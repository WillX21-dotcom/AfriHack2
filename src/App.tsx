import React, { useState, useEffect, useRef } from 'react';
import { ClientApp } from '@client/app';
import { DashboardApp } from '@dashboard/app';
import { getSession, AuthSession, isAdminPath } from '@shared/auth';
import { LandingPage } from './LandingPage';
import { hydrateRemoteState } from '@supabase-pkg/client';
import '@client/styles/main.css';
import '@dashboard/styles/main.css';

type ScreenView = 'royal' | 'client';
type DeviceMode = 'auto' | 'laptop' | 'tablet' | 'phone';

export default function App() {
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1200;
  });

  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [showAuth, setShowAuth] = useState<boolean>(() => Boolean(getSession()) || isAdminPath());
  const [dataReady, setDataReady] = useState<boolean>(() => !getSession());

  // Current active screen: default based on active role if logged in, else screen size
  const [activeView, setActiveView] = useState<ScreenView>(() => {
    if (isAdminPath()) {
      return 'royal';
    }
    const s = getSession();
    if (s?.user) {
      return s.user.role === 'client' ? 'client' : 'royal';
    }
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? 'royal' : 'client';
    }
    return 'royal';
  });

  // Device simulation mode for testing on laptops or desktops
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');

  const clientContainerRef = useRef<HTMLDivElement>(null);
  const dashboardContainerRef = useRef<HTMLDivElement>(null);
  const clientAppInstance = useRef<ClientApp | null>(null);
  const dashboardAppInstance = useRef<DashboardApp | null>(null);

  // Track window resizing
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      const cur = getSession();
      setSession(cur);
      setDataReady(!cur);
      if (cur?.user) {
        setShowAuth(true);
        if (cur.user.role === 'admin' || cur.user.role === 'adviser') {
          setActiveView('royal');
        } else {
          setActiveView('client');
        }
      }
    };

    window.addEventListener('royal-square-auth-change', handleAuthChange);
    const handleReturnToLanding = () => {
      setSession(null);
      setShowAuth(false);
    };
    window.addEventListener('return-to-landing', handleReturnToLanding);
    return () => {
      window.removeEventListener('royal-square-auth-change', handleAuthChange);
      window.removeEventListener('return-to-landing', handleReturnToLanding);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setDataReady(true);
      return;
    }

    let active = true;
    setDataReady(false);
    hydrateRemoteState()
      .catch((error) => {
        console.error('Unable to load Supabase data:', error);
      })
      .finally(() => {
        if (active) setDataReady(true);
      });

    return () => {
      active = false;
    };
  }, [session]);

  // Mount/remount instances when activeView, deviceMode, or window size changes
  useEffect(() => {
    if (activeView === 'royal' && dashboardContainerRef.current) {
      dashboardAppInstance.current = new DashboardApp(dashboardContainerRef.current);
    }
  }, [activeView, deviceMode, showAuth, session, dataReady]);

  useEffect(() => {
    if (activeView === 'client' && clientContainerRef.current) {
      clientAppInstance.current = new ClientApp(clientContainerRef.current);
    }
  }, [activeView, deviceMode, showAuth, session, dataReady]);

  if (!session && !showAuth && !isAdminPath()) {
    return <LandingPage onLogin={() => setShowAuth(true)} />;
  }

  if (session && !dataReady) {
    return <div className="min-h-screen bg-[#071326] p-8 text-center text-sm text-slate-300">Loading your secure workspace...</div>;
  }

  // Determine frame styling based on simulated deviceMode and viewport
  const isSimulatedFrame = deviceMode === 'phone' || deviceMode === 'tablet';

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col antialiased selection:bg-amber-400 selection:text-slate-900">
      {/* Main Viewport Container */}
      <main className={`flex-1 w-full ${isSimulatedFrame ? 'py-6 px-4 flex flex-col items-center justify-start bg-slate-900/10' : ''}`}>
        {isSimulatedFrame && (
          <div className="mb-2 text-xs text-slate-500 font-medium flex items-center space-x-2">
            <span>Viewing {activeView === 'royal' ? 'Royal Desk' : 'Client Portal'} on simulated {deviceMode === 'phone' ? 'Smartphone (390px)' : 'Tablet (768px)'}</span>
            <button
              onClick={() => setDeviceMode('auto')}
              className="text-blue-600 hover:underline text-[11px]"
            >
              Reset to Full Screen
            </button>
          </div>
        )}

        <div
          className={`w-full transition-all duration-300 ${
            deviceMode === 'phone'
              ? 'max-w-[390px] bg-white rounded-[38px] shadow-2xl border-[8px] border-slate-900 overflow-hidden min-h-[780px] relative'
              : deviceMode === 'tablet'
              ? 'max-w-[768px] bg-white rounded-2xl shadow-2xl border border-slate-300/80 overflow-hidden min-h-[820px]'
              : 'min-h-full'
          }`}
        >
          {/* Phone Dynamic Island / Speaker notch simulation */}
          {deviceMode === 'phone' && (
            <div className="w-full bg-slate-900 h-5 flex items-center justify-center relative">
              <div className="w-24 h-3.5 bg-slate-950 rounded-b-xl flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-8 h-1 rounded-full bg-slate-800" />
              </div>
            </div>
          )}

          {activeView === 'royal' ? (
            <div id="dashboard-app" ref={dashboardContainerRef} className="w-full min-h-full" />
          ) : (
            <div id="app" ref={clientContainerRef} className="w-full min-h-full" />
          )}
        </div>
      </main>
    </div>
  );
}
