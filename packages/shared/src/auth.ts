import { UserRole } from './constants/roles';
import { supabase } from '@supabase-pkg/client';

export const SESSION_STORAGE_KEY = 'royal-square-session';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'client' | 'adviser';
  phone?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  createdAt: string;
}

export const ADMIN_PATH_UUID = '7838bc41-d851-427a-8111-6797b789ec90';
const ADMIN_PATH_PASSWORD = '1234as';
const ADMIN_GATE_STORAGE_KEY = 'royal-square-admin-gate';

export function matchesAdminPath(value?: string): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  return normalized === ADMIN_PATH_UUID.toLowerCase() || normalized.includes(ADMIN_PATH_UUID.toLowerCase());
}

export function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return matchesAdminPath(`${window.location.pathname} ${window.location.search} ${window.location.hash}`);
}

export function isAdminGateUnlocked(): boolean {
  if (!isAdminPath() || typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_GATE_STORAGE_KEY) === 'unlocked';
}

export function unlockAdminGate(password: string): boolean {
  if (password.trim() !== ADMIN_PATH_PASSWORD || typeof sessionStorage === 'undefined') return false;
  sessionStorage.setItem(ADMIN_GATE_STORAGE_KEY, 'unlocked');
  return true;
}

export function clearAdminGate(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(ADMIN_GATE_STORAGE_KEY);
}

function formatAuthError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || '');
  if (message.toLowerCase().includes('rate limit')) {
    return 'Email delivery is temporarily rate-limited. Confirm the existing account or disable Confirm email in Supabase Auth settings, then try again.';
  }
  return message || fallback;
}

export function resolveRoleFromAccount(context: {
  id?: string;
  email?: string;
  fullName?: string;
  explicitRole?: 'admin' | 'client' | 'adviser';
}): 'admin' | 'client' | 'adviser' {
  const accountString = [context.id, context.email, context.fullName, context.explicitRole].join(' ');

  if (matchesAdminPath(accountString)) {
    return 'admin';
  }

  if (context.explicitRole) {
    return context.explicitRole;
  }

  if (context.email) {
    return determineRoleFromEmail(context.email);
  }

  return 'client';
}

/**
 * Get the current active session from localStorage
 */
export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (err) {
    console.error('Failed to parse royal-square-session:', err);
    return null;
  }
}

export function getSessionDisplayName(): string {
  const session = getSession();
  return session?.user.fullName || session?.user.email?.split('@')[0] || 'Account holder';
}

/**
 * Save session to localStorage and broadcast change
 */
export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('royal-square-auth-change', { detail: { session } }));
  } catch (err) {
    console.error('Failed to save royal-square-session:', err);
  }
}

/**
 * Clear session and broadcast change
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('royal-square-auth-change', { detail: { session: null } }));
  } catch (err) {
    console.error('Failed to clear royal-square-session:', err);
  }
}

/**
 * Determine role from email address
 */
export function determineRoleFromEmail(email: string): 'admin' | 'client' | 'adviser' {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return 'client';
  }

  return 'client';
}

/**
 * Authenticate using demo credentials or valid email/password
 */
export async function login(
  email: string,
  password: string,
  id?: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPass = password.trim();

  if (!trimmedEmail || !trimmedPass) {
    return { success: false, error: 'Please provide both email address and password.' };
  }

  if (trimmedPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPass });
  if (error || !data.user) {
    return { success: false, error: error?.message || 'Unable to sign in with Supabase.' };
  }

  const fullName = `${data.user.user_metadata?.first_name || ''} ${data.user.user_metadata?.last_name || ''}`.trim() || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
  const role = resolveRoleFromAccount({
    id: isAdminPath() ? ADMIN_PATH_UUID : id || data.user.id,
    email: trimmedEmail,
    fullName,
    explicitRole: data.user.user_metadata?.role,
  });
  const displayName = fullName.charAt(0).toUpperCase() + fullName.slice(1);

  const session: AuthSession = {
    user: {
      id: data.user.id,
      email: trimmedEmail,
      fullName: displayName,
      role,
    },
    token: data.session?.access_token || '',
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return { success: true, session };
}

/**
 * Register a new user in demo session storage
 */
export async function register(data: {
  fullName: string;
  email: string;
  password: string;
  role?: 'admin' | 'client' | 'adviser';
  id?: string;
  adminUuid?: string;
}): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const trimmedName = data.fullName.trim();
  const trimmedEmail = data.email.trim().toLowerCase();
  const trimmedPass = data.password.trim();

  if (!trimmedName) {
    return { success: false, error: 'Please enter your full legal name.' };
  }
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!trimmedPass || trimmedPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password: trimmedPass,
    options: {
      data: {
        first_name: trimmedName.split(' ')[0],
        last_name: trimmedName.split(' ').slice(1).join(' '),
        role: isAdminPath() ? 'admin' : data.role || 'client',
      },
    },
  });
  if (error || !authData.user) {
    return { success: false, error: formatAuthError(error, 'Unable to register with Supabase.') };
  }

  if (!authData.session) {
    return { success: false, error: 'Account created. Confirm your email, then sign in.' };
  }

  const resolvedRole = resolveRoleFromAccount({
    id: isAdminPath() ? ADMIN_PATH_UUID : data.id || data.adminUuid || authData.user.id,
    email: trimmedEmail,
    fullName: trimmedName,
    explicitRole: isAdminPath() ? 'admin' : data.role,
  });

  const session: AuthSession = {
    user: {
      id: authData.user.id,
      email: trimmedEmail,
      fullName: trimmedName,
      role: resolvedRole,
    },
    token: authData.session?.access_token || '',
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return { success: true, session };
}

/**
 * Log out user: clears session and triggers redirect/auth screen
 */
export function logout(): void {
  clearSession();
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const currentPort = typeof window !== 'undefined' ? window.location.port : '';

  // In standalone apps, reloading resets to the auth screen
  if (isLocalhost && (currentPort === '5174' || currentPort === '5175')) {
    window.location.reload();
  } else {
    window.dispatchEvent(new CustomEvent('royal-square-auth-change', { detail: { session: null } }));
  }
}

/**
 * Shared HTML renderer for Login / Register Screen
 */
export function renderSharedAuthScreen(options: { mode?: 'login' | 'register' } = {}): string {
  const mode = options.mode || 'login';
  const isLogin = mode === 'login';
  const adminPath = isAdminPath();
  const adminGateActive = adminPath && !isAdminGateUnlocked();

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
          <div class="${adminGateActive ? 'hidden' : 'grid grid-cols-2'} p-1 bg-white/5 rounded-xl border border-white/10 text-xs font-semibold">
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
            adminGateActive
              ? `
            <form id="auth-admin-form" class="space-y-3.5">
              <div>
                <label for="auth-admin-password" class="text-[11px] font-semibold text-slate-300 block mb-1">Admin Password</label>
                <input
                  id="auth-admin-password"
                  type="password"
                  required
                  autofocus
                  placeholder="Enter admin password"
                  class="w-full text-xs p-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                id="auth-admin-submit-btn"
                class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md mt-1 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Enter Royal Desk</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          `
              : isLogin
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
                  placeholder="At least 4 characters"
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

  const adminForm = container.querySelector('#auth-admin-form') as HTMLFormElement | null;
  adminForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordInput = container.querySelector('#auth-admin-password') as HTMLInputElement | null;
    if (!passwordInput) return;

    if (unlockAdminGate(passwordInput.value)) {
      options.onModeChange('login');
    } else {
      showError('Incorrect admin password.');
    }
  });

  // Login form submit
  const loginForm = container.querySelector('#auth-login-form') as HTMLFormElement | null;
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = container.querySelector('#auth-input-email') as HTMLInputElement | null;
    const passInput = container.querySelector('#auth-input-password') as HTMLInputElement | null;
    if (!emailInput || !passInput) return;

    const res = await login(emailInput.value, passInput.value);
    if (res.success && res.session) {
      options.onSuccess(res.session);
    } else if (res.error) {
      showError(res.error);
    }
  });

  // Register form submit
  const regForm = container.querySelector('#auth-register-form') as HTMLFormElement | null;
  regForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = container.querySelector('#auth-reg-name') as HTMLInputElement | null;
    const emailInput = container.querySelector('#auth-reg-email') as HTMLInputElement | null;
    const passInput = container.querySelector('#auth-reg-password') as HTMLInputElement | null;

    if (!nameInput || !emailInput || !passInput) return;

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
}
