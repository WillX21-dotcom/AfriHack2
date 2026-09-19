import React, { useEffect, useRef, useState } from 'react';
import { ClientApp } from '@client/app';
import { DashboardApp } from '@dashboard/app';
import {
  getSession,
  initAuthListener,
  isAdminPath,
  isStaff,
  logout,
  restoreSession,
  syncSessionWithProfile,
  type AuthSession,
} from '@shared/auth';
import { LandingPage } from './LandingPage';
import {
  dataStore,
  hydrateRemoteState,
  isSupabaseConfigured,
  startRealtime,
  stopRealtime,
} from '@supabase-pkg/client';
import '@client/styles/main.css';
import '@dashboard/styles/main.css';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

function FullScreenMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#071326] px-6 py-16 text-center text-slate-200 flex flex-col items-center justify-center">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState<boolean>(() => Boolean(getSession()) || isAdminPath());
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const clientContainerRef = useRef<HTMLDivElement>(null);
  const dashboardContainerRef = useRef<HTMLDivElement>(null);

  const userId = session?.user.id ?? null;
  // Signed-in users land where their role belongs. Signed-out visitors get the client portal,
  // except on the staff path which shows the Royal Desk sign-in.
  const activeView: 'royal' | 'client' = session ? (isStaff(session.user.role) ? 'royal' : 'client') : isAdminPath() ? 'royal' : 'client';

  // Verify the cached session against Supabase before trusting it.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    initAuthListener();
    restoreSession()
      .catch((error) => console.error('Unable to restore session:', error))
      .finally(() => {
        setSession(getSession());
        setAuthChecked(true);
      });
  }, []);

  useEffect(() => {
    const handleAuthChange = () => {
      const current = getSession();
      setSession(current);
      if (current) setShowAuth(true);
    };
    const handleReturnToLanding = () => {
      if (!getSession()) setShowAuth(false);
    };
    window.addEventListener('royal-square-auth-change', handleAuthChange);
    window.addEventListener('return-to-landing', handleReturnToLanding);
    return () => {
      window.removeEventListener('royal-square-auth-change', handleAuthChange);
      window.removeEventListener('return-to-landing', handleReturnToLanding);
    };
  }, []);

  // If an administrator changes this user's role or name, follow it without a reload.
  useEffect(() => dataStore.subscribe(() => syncSessionWithProfile(dataStore.getState().currentUser)), []);

  // Load the user's data, then keep it live.
  useEffect(() => {
    if (!isSupabaseConfigured || !authChecked) return;

    if (!userId) {
      stopRealtime();
      dataStore.reset();
      setLoadError(null);
      setStatus('ready');
      return;
    }

    let active = true;
    setStatus('loading');
    setLoadError(null);
    hydrateRemoteState()
      .then(() => {
        if (!active) return;
        startRealtime();
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Unable to load Supabase data:', error);
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load your data.');
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [userId, authChecked, reloadKey]);

  const ready = isSupabaseConfigured && authChecked && status === 'ready';
  const showLanding = !session && !showAuth && !isAdminPath();

  useEffect(() => {
    if (!ready || showLanding) return;

    if (activeView === 'royal' && dashboardContainerRef.current) {
      const app = new DashboardApp(dashboardContainerRef.current);
      return () => app.destroy();
    }
    if (activeView === 'client' && clientContainerRef.current) {
      const app = new ClientApp(clientContainerRef.current);
      return () => app.destroy();
    }
  }, [ready, showLanding, activeView, userId]);

  if (!isSupabaseConfigured) {
    return (
      <FullScreenMessage title="Royal Square is not connected to a database yet">
        <p>
          Set <code className="rounded bg-white/10 px-1.5 py-0.5">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file
          to your Supabase project values, then restart the dev server.
        </p>
      </FullScreenMessage>
    );
  }

  if (!authChecked) {
    return <FullScreenMessage title="Loading…" />;
  }

  if (showLanding) {
    return <LandingPage onLogin={() => setShowAuth(true)} />;
  }

  if (session && status === 'error') {
    return (
      <FullScreenMessage title="We couldn't load your workspace">
        <p>{loadError}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            Try again
          </button>
          <button
            onClick={() => void logout()}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-xs font-medium text-white hover:bg-white/20"
          >
            Sign out
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  if (session && status !== 'ready') {
    return <FullScreenMessage title="Loading your secure workspace…" />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col antialiased selection:bg-amber-400 selection:text-slate-900">
      <main className="flex-1 w-full">
        {activeView === 'royal' ? (
          <div id="dashboard-app" ref={dashboardContainerRef} className="w-full min-h-full" />
        ) : (
          <div id="app" ref={clientContainerRef} className="w-full min-h-full" />
        )}
      </main>
    </div>
  );
}
