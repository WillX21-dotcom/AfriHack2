import type { UserRole } from './constants/roles';
import type { Profile } from './types/user';
import { supabase, dataStore, stopRealtime } from '@supabase-pkg/client';

export const SESSION_STORAGE_KEY = 'royal-square-session';
export const MIN_PASSWORD_LENGTH = 8;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  createdAt: string;
}

/**
 * The staff sign-in lives on this URL path. It is only a routing convenience so advisers land on
 * the Royal Desk sign-in; it is NOT a security boundary. Access is decided by the role stored on
 * the user's profile row in the database, which users cannot edit.
 */
export const ADMIN_PATH_UUID = '7838bc41-d851-427a-8111-6797b789ec90';

export function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  const location = `${window.location.pathname} ${window.location.search} ${window.location.hash}`.toLowerCase();
  return location.includes(ADMIN_PATH_UUID);
}

export function isStaff(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'adviser' || role === 'compliance';
}

function displayName(profile: Pick<Profile, 'first_name' | 'last_name' | 'email'>): string {
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return name || (profile.email || '').split('@')[0] || 'Account holder';
}

function buildSession(profile: Profile, token: string): AuthSession {
  return {
    user: {
      id: profile.id,
      email: profile.email || '',
      fullName: displayName(profile),
      role: profile.role,
      phone: profile.phone || undefined,
    },
    token,
    createdAt: new Date().toISOString(),
  };
}

function formatAuthError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String((error as any)?.message || error || '');
  const lowered = message.toLowerCase();
  if (lowered.includes('rate limit')) {
    return 'Too many attempts right now. Please wait a few minutes and try again.';
  }
  if (lowered.includes('invalid login credentials')) {
    return 'Incorrect email address or password.';
  }
  if (lowered.includes('email not confirmed')) {
    return 'Please confirm your email address using the link we sent you, then sign in.';
  }
  return message || fallback;
}

/** The cached session (used for fast first paint). `restoreSession` verifies it against Supabase. */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function getSessionDisplayName(): string {
  const session = getSession();
  return session?.user.fullName || session?.user.email?.split('@')[0] || 'Account holder';
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to cache session:', err);
  }
  window.dispatchEvent(new CustomEvent('royal-square-auth-change', { detail: { session } }));
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear cached session:', err);
  }
  window.dispatchEvent(new CustomEvent('royal-square-auth-change', { detail: { session: null } }));
}

function sameIdentity(a: AuthSession | null, b: AuthSession): boolean {
  return Boolean(a) && a!.user.id === b.user.id && a!.user.role === b.user.role && a!.user.fullName === b.user.fullName && a!.user.email === b.user.email;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/**
 * Re-derive the session from Supabase Auth + the profile row. The role always comes from the
 * database, so a tampered localStorage entry cannot grant access to the dashboard.
 */
export async function restoreSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();
  const authSession = data.session;

  if (!authSession) {
    if (getSession()) clearSession();
    return null;
  }

  let profile: Profile | null = null;
  try {
    profile = await fetchProfile(authSession.user.id);
  } catch (error) {
    console.error('Unable to verify profile:', error);
    // Keep the cached session (if any) so a transient network failure does not sign the user out;
    // the data layer still enforces access through Row Level Security.
    return getSession();
  }

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    clearSession();
    return null;
  }

  const session = buildSession(profile, authSession.access_token);
  if (!sameIdentity(getSession(), session)) saveSession(session);
  return session;
}

/** Called when the profile in the data store changes (e.g. an admin changed this user's role). */
export function syncSessionWithProfile(profile: Profile | null): void {
  const cached = getSession();
  if (!cached || !profile || profile.id !== cached.user.id) return;
  const next = buildSession(profile, cached.token);
  if (!sameIdentity(cached, next)) saveSession(next);
}

let listening = false;

/** Clear local state if Supabase ends the session (token revoked, signed out in another tab...). */
export function initAuthListener(): void {
  if (listening) return;
  listening = true;
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && getSession()) {
      stopRealtime();
      dataStore.reset();
      clearSession();
    }
  });
}

export async function login(email: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return { success: false, error: 'Please provide both email address and password.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
  if (error || !data.user) {
    return { success: false, error: formatAuthError(error, 'Unable to sign in.') };
  }

  let profile: Profile | null = null;
  try {
    profile = await fetchProfile(data.user.id);
  } catch (err) {
    await supabase.auth.signOut();
    return { success: false, error: formatAuthError(err, 'Unable to load your profile.') };
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, error: 'Your account has no profile yet. Please contact Royal Square support.' };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { success: false, error: 'This account has been deactivated. Please contact Royal Square support.' };
  }

  const session = buildSession(profile, data.session?.access_token || '');
  saveSession(session);
  return { success: true, session };
}

/**
 * Self-service registration. Accounts are always created as clients; the database ignores any role
 * supplied here. Staff access is granted afterwards by an administrator.
 */
export async function register(data: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; session?: AuthSession; error?: string; needsConfirmation?: boolean }> {
  const trimmedName = data.fullName.trim();
  const trimmedEmail = data.email.trim().toLowerCase();

  if (!trimmedName) {
    return { success: false, error: 'Please enter your full legal name.' };
  }
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!data.password || data.password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const [firstName, ...rest] = trimmedName.split(/\s+/);
  const { data: authData, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password: data.password,
    options: { data: { first_name: firstName, last_name: rest.join(' ') } },
  });
  if (error || !authData.user) {
    return { success: false, error: formatAuthError(error, 'Unable to create your account.') };
  }

  if (!authData.session) {
    return { success: false, needsConfirmation: true, error: 'Account created. Confirm your email address using the link we sent you, then sign in.' };
  }

  let profile: Profile | null = null;
  try {
    profile = await fetchProfile(authData.user.id);
  } catch (err) {
    return { success: false, error: formatAuthError(err, 'Account created but your profile could not be loaded. Please sign in.') };
  }
  if (!profile) {
    return { success: false, error: 'Account created but your profile is not ready yet. Please sign in again in a moment.' };
  }

  const session = buildSession(profile, authData.session.access_token);
  saveSession(session);
  return { success: true, session };
}

export async function logout(): Promise<void> {
  stopRealtime();
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
  dataStore.reset();
  clearSession();
}

/**
 * Shared HTML renderer for Login / Register Screen
 */
export function renderSharedAuthScreen(options: { mode?: 'login' | 'register' } = {}): string {
  const adminPath = isAdminPath();
  // Staff accounts are provisioned by an administrator, so the staff sign-in never offers registration.
  const isLogin = adminPath || (options.mode || 'login') === 'login';

  const input = 'w-full text-base sm:text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-[10px] text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#19407E] focus:ring-[3px] focus:ring-[#19407E]/15 transition-colors';
  const label = 'block text-xs font-semibold text-slate-700 mb-1.5';
  const submit = 'w-full py-3 bg-[#0A192F] hover:bg-[#16305A] text-white font-semibold rounded-[10px] text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19407E]';
  const tab = (active: boolean) =>
    `py-2 rounded-lg text-[13px] font-semibold transition-colors ${active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`;

  return `
    <div id="royal-square-auth-root" class="min-h-screen bg-[#0A192F] flex flex-col items-center justify-between px-4 py-8 sm:py-12">
      <div class="text-center">
        <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3" aria-hidden="true">
          <svg class="w-7 h-7" viewBox="0 0 44 32" fill="none"><path d="M7 25H37L35 22H9L7 25Z" fill="#FCD34D" /><path d="M7 22L10 8L18 16L22 4L26 16L34 8L37 22H7Z" stroke="#FCD34D" stroke-width="2.5" stroke-linejoin="round" /></svg>
        </div>
        <h1 class="text-xl font-semibold text-white tracking-tight">Royal Square Financial</h1>
        <p class="text-xs text-slate-400 mt-1">${adminPath ? 'Royal Desk' : 'Client portal'}</p>
      </div>

      <div class="w-full max-w-sm my-8">
        <div class="bg-white rounded-2xl shadow-xl p-6 sm:p-7 space-y-5">
          ${!adminPath ? `
          <button id="auth-back-landing" type="button" class="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
            Back to home
          </button>
          ` : ''}

          ${adminPath ? `
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Staff sign-in</h2>
            <p class="text-xs text-slate-500 mt-1">For advisers and administrators. Accounts are created by an administrator.</p>
          </div>
          ` : `
          <div>
            <h2 class="text-lg font-semibold text-slate-900">${isLogin ? 'Welcome back' : 'Create your account'}</h2>
            <p class="text-xs text-slate-500 mt-1">${isLogin ? 'Sign in to view your requests, claims and documents.' : 'Register to work with your Royal Square adviser online.'}</p>
          </div>
          `}

          <div class="${adminPath ? 'hidden' : 'grid grid-cols-2'} p-1 bg-slate-100 rounded-[10px] gap-1">
            <button id="tab-auth-login" class="${tab(isLogin)}">Sign in</button>
            <button id="tab-auth-register" class="${tab(!isLogin)}">Create account</button>
          </div>

          <div id="auth-error-msg" role="alert" class="hidden text-xs bg-red-50 border border-red-200 text-red-800 p-3 rounded-[10px]"></div>

          ${
            isLogin
              ? `
            <form id="auth-login-form" class="space-y-4">
              <div>
                <label class="${label}" for="auth-input-email">Email address</label>
                <input id="auth-input-email" type="email" required autocomplete="email" placeholder="you@example.com" class="${input}" />
              </div>
              <div>
                <label class="${label}" for="auth-input-password">Password</label>
                <input id="auth-input-password" type="password" required autocomplete="current-password" placeholder="Your password" class="${input}" />
              </div>
              <button type="submit" id="auth-submit-btn" class="${submit}">Sign in</button>
            </form>
          `
              : `
            <form id="auth-register-form" class="space-y-4">
              <div>
                <label class="${label}" for="auth-reg-name">Full name</label>
                <input id="auth-reg-name" type="text" required autocomplete="name" placeholder="As on your ID document" class="${input}" />
              </div>
              <div>
                <label class="${label}" for="auth-reg-email">Email address</label>
                <input id="auth-reg-email" type="email" required autocomplete="email" placeholder="you@example.com" class="${input}" />
              </div>
              <div>
                <label class="${label}" for="auth-reg-password">Password</label>
                <input id="auth-reg-password" type="password" required minlength="${MIN_PASSWORD_LENGTH}" autocomplete="new-password" placeholder="At least ${MIN_PASSWORD_LENGTH} characters" class="${input}" />
              </div>
              <button type="submit" id="auth-reg-submit-btn" class="${submit}">Create account</button>
            </form>
          `
          }
        </div>
      </div>

      <div class="text-center text-[11px] text-slate-500">
        <p>Royal Square Financial (Pty) Ltd</p>
      </div>
    </div>
  `;
}

/**
 * Attach listeners to the shared auth screen inside a container
 */
export function attachSharedAuthEvents(
  container: HTMLElement,
  options: {
    mode: 'login' | 'register';
    onModeChange: (newMode: 'login' | 'register') => void;
    onSuccess: (session: AuthSession) => void;
    onBack?: () => void;
  }
): void {
  const errorBox = container.querySelector('#auth-error-msg') as HTMLElement | null;

  const showError = (msg: string) => {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
    }
  };

  // Tab switching
  container.querySelector('#tab-auth-login')?.addEventListener('click', () => {
    options.onModeChange('login');
  });

  container.querySelector('#tab-auth-register')?.addEventListener('click', () => {
    options.onModeChange('register');
  });

  container.querySelector('#auth-back-landing')?.addEventListener('click', () => {
    options.onBack?.();
  });

  // Disable the submit button while a request is in flight so credentials are not submitted twice.
  const withBusy = async (form: HTMLFormElement, work: () => Promise<void>) => {
    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (button) button.disabled = true;
    errorBox?.classList.add('hidden');
    try {
      await work();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      if (button && button.isConnected) button.disabled = false;
    }
  };

  // Login form submit
  const loginForm = container.querySelector('#auth-login-form') as HTMLFormElement | null;
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = container.querySelector('#auth-input-email') as HTMLInputElement | null;
    const passInput = container.querySelector('#auth-input-password') as HTMLInputElement | null;
    if (!emailInput || !passInput) return;

    void withBusy(loginForm, async () => {
      const res = await login(emailInput.value, passInput.value);
      if (res.success && res.session) {
        options.onSuccess(res.session);
      } else if (res.error) {
        showError(res.error);
      }
    });
  });

  // Register form submit
  const regForm = container.querySelector('#auth-register-form') as HTMLFormElement | null;
  regForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = container.querySelector('#auth-reg-name') as HTMLInputElement | null;
    const emailInput = container.querySelector('#auth-reg-email') as HTMLInputElement | null;
    const passInput = container.querySelector('#auth-reg-password') as HTMLInputElement | null;

    if (!nameInput || !emailInput || !passInput) return;

    void withBusy(regForm, async () => {
      const res = await register({
        fullName: nameInput.value,
        email: emailInput.value,
        password: passInput.value,
      });

      if (res.success && res.session) {
        options.onSuccess(res.session);
      } else if (res.error) {
        showError(res.error);
      }
    });
  });
}
