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

  return `
    <div id="royal-square-auth-root" class="min-h-screen bg-[#0A192F] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans">
      <!-- Background Mountain Vector Silhouette -->
      <div class="absolute inset-0 pointer-events-none opacity-10">
        <svg class="w-full h-full text-white" viewBox="0 0 1440 600" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,600 300,200 650,450 1000,120 1250,380 1440,250 1440,600" />
        </svg>
      </div>

      <!-- Top Branding -->
      <div class="pt-6 sm:pt-10 text-center relative z-10">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-amber-400/30 flex items-center justify-center mx-auto shadow-xl mb-3 backdrop-blur-xs">
          <!-- Geometric Gold Crown -->
          <svg class="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" viewBox="0 0 44 32" fill="none">
            <path d="M7 25H37L35 22H9L7 25Z" fill="#F59E0B" />
            <path d="M7 22L10 8L18 16L22 4L26 16L34 8L37 22H7Z" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="10" cy="8" r="1.5" fill="#F59E0B" />
            <circle cx="22" cy="4" r="1.5" fill="#F59E0B" />
            <circle cx="34" cy="8" r="1.5" fill="#F59E0B" />
          </svg>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold font-serif-royal text-white tracking-[0.15em] uppercase">
          Royal Square
        </h1>
        <p class="text-[10px] text-amber-300/80 tracking-[0.25em] uppercase font-semibold mt-0.5">
          Financial Private Gateway
        </p>
      </div>

      <!-- Central Card -->
      <div class="relative z-10 w-full max-w-md mx-auto my-auto py-4">
        <div class="bg-slate-900/85 border border-white/15 p-6 sm:p-7 rounded-3xl backdrop-blur-md shadow-2xl space-y-4">
          ${!adminPath ? `
          <button id="auth-back-landing" type="button" class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:text-amber-300">
            <span aria-hidden="true">←</span>
            <span>Back to Home</span>
          </button>
          ` : ''}
          
          <!-- Mode Tabs (Sign In vs Create Account) -->
          ${adminPath ? `
          <div class="text-center">
            <h2 class="text-sm font-bold text-white">Royal Desk staff sign-in</h2>
            <p class="text-[11px] text-slate-400 mt-1">For advisers and administrators. Accounts are created by an administrator.</p>
          </div>
          ` : ''}
          <div class="${adminPath ? 'hidden' : 'grid grid-cols-2'} p-1 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold">
            <button
              id="tab-auth-login"
              class="py-2 rounded-lg transition-all ${
                isLogin
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }"
            >
              Sign In
            </button>
            <button
              id="tab-auth-register"
              class="py-2 rounded-lg transition-all ${
                !isLogin
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }"
            >
              Create Account
            </button>
          </div>

          <!-- Alert Error Box (hidden by default) -->
          <div id="auth-error-msg" class="hidden text-xs bg-rose-500/20 border border-rose-500/40 text-rose-200 p-2.5 rounded-xl">
          </div>

          ${
            isLogin
              ? `
            <!-- Login Form -->
            <form id="auth-login-form" class="space-y-3.5">
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[11px] font-semibold text-slate-300">Password</label>
                </div>
                <input
                  id="auth-input-password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                id="auth-submit-btn"
                class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md mt-1 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Sign In to Portal</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>

          `
              : `
            <!-- Register Form -->
            <form id="auth-register-form" class="space-y-3.5">
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                <input
                  id="auth-reg-name"
                  type="text"
                  required
                  placeholder="e.g. Thato Selepe"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  id="auth-reg-email"
                  type="email"
                  required
                  placeholder="e.g. thato@example.com"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Create Password</label>
                <input
                  id="auth-reg-password"
                  type="password"
                  required
                  minlength="${MIN_PASSWORD_LENGTH}"
                  autocomplete="new-password"
                  placeholder="At least ${MIN_PASSWORD_LENGTH} characters"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                id="auth-reg-submit-btn"
                class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md mt-1 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Create Account & Continue</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          `
          }
        </div>
      </div>

      <!-- Bottom Compliance Footer -->
      <div class="text-center text-[10px] text-slate-400/80 pb-4 relative z-10">
        <p>Royal Square Financial (Pty) Ltd • Authorised FSP #48921</p>
        <p class="text-slate-500 mt-0.5">FAIS Act Compliant • POPIA Data Protection Guarantee</p>
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
