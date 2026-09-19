import { html, raw, type SafeHtml } from '@shared/html';
import { adviserService } from '../services/adviser';

export type DashboardRouteKey =
  | 'overview'
  | 'clients'
  | 'client-detail'
  | 'requests'
  | 'request-detail'
  | 'claims'
  | 'claim-detail'
  | 'tasks'
  | 'reminders'
  | 'documents'
  | 'communications'
  | 'providers'
  | 'analytics'
  | 'compliance'
  | 'notifications'
  | 'search'
  | 'settings';

const icon = (path: string) =>
  raw(`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${path}"></path></svg>`);

const ICONS = {
  home: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'),
  clients: icon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'),
  doc: icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'),
  shield: icon('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'),
  tasks: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
  clock: icon('M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'),
  folder: icon('M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z'),
  mail: icon('M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'),
  chart: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
  log: icon('M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'),
  building: icon('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'),
  cog: icon('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z'),
};

export function renderDashboardSidebar(activeRoute: DashboardRouteKey): SafeHtml {
  const kpis = adviserService.getKPIs();
  const unread = adviserService.unreadMessageCount();

  const navItems: Array<{ key: DashboardRouteKey; label: string; icon: SafeHtml; badge?: number }> = [
    { key: 'overview', label: 'Dashboard', icon: ICONS.home },
    { key: 'clients', label: 'Clients', icon: ICONS.clients },
    { key: 'requests', label: 'Requests', icon: ICONS.doc, badge: kpis.openRequests },
    { key: 'claims', label: 'Claims', icon: ICONS.shield, badge: kpis.activeClaims },
    { key: 'tasks', label: 'Tasks', icon: ICONS.tasks, badge: kpis.myOpenTasks },
    { key: 'reminders', label: 'Reminders', icon: ICONS.clock, badge: kpis.dueReminders },
    { key: 'documents', label: 'Documents', icon: ICONS.folder },
    { key: 'communications', label: 'Messages', icon: ICONS.mail, badge: unread },
    { key: 'analytics', label: 'Analytics', icon: ICONS.chart },
    { key: 'compliance', label: 'Audit Log', icon: ICONS.log },
    { key: 'providers', label: 'Providers', icon: ICONS.building },
    { key: 'settings', label: 'Settings', icon: ICONS.cog },
  ];

  // Detail pages highlight their parent section
  const parent: Partial<Record<DashboardRouteKey, DashboardRouteKey>> = {
    'client-detail': 'clients',
    'request-detail': 'requests',
    'claim-detail': 'claims',
  };
  const activeKey = parent[activeRoute] || activeRoute;

  return html`
    <aside class="dashboard-sidebar select-none h-full flex flex-col justify-between">
      <div>
        <div class="px-5 py-6 flex flex-col items-center justify-center border-b border-white/10 text-center">
          <div class="mb-2">
            <svg class="w-9 h-9 text-amber-400" viewBox="0 0 44 32" fill="none">
              <path d="M7 25H37L35 22H9L7 25Z" fill="#F59E0B" />
              <path d="M7 22L10 8L18 16L22 4L26 16L34 8L37 22H7Z" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="10" cy="8" r="1.5" fill="#F59E0B" />
              <circle cx="22" cy="4" r="1.5" fill="#F59E0B" />
              <circle cx="34" cy="8" r="1.5" fill="#F59E0B" />
            </svg>
          </div>
          <h1 class="font-serif-royal font-bold text-sm text-white tracking-[0.18em] uppercase leading-tight">Royal Square</h1>
          <p class="text-[10px] text-slate-400 tracking-[0.25em] uppercase font-medium mt-0.5">Financial</p>
        </div>

        <nav class="px-3 py-4 space-y-1">
          ${navItems.map((item) => {
            const isActive = activeKey === item.key;
            return html`
              <button
                data-dash-nav="${item.key}"
                class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-left group ${isActive
                  ? 'bg-[#19407E] text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'}"
              >
                <div class="flex items-center space-x-3 min-w-0">
                  <span class="${isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'}">${item.icon}</span>
                  <span class="truncate">${item.label}</span>
                </div>
                ${item.badge
                  ? html`<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'}">${item.badge}</span>`
                  : ''}
              </button>
            `;
          })}

          <div class="pt-2 border-t border-white/10 mt-2">
            <button
              data-dash-action="sign-out"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all text-left font-medium group border border-rose-500/20 hover:border-rose-500/40"
              title="Sign out of Royal Desk"
            >
              <div class="flex items-center space-x-2.5">
                <svg class="w-4 h-4 text-rose-400 group-hover:text-rose-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign out</span>
              </div>
            </button>
          </div>
        </nav>
      </div>

      <div class="relative pt-4 overflow-hidden mt-auto border-t border-white/5">
        <div class="px-5 pb-2 relative z-10">
          <p class="text-[11px] font-medium text-slate-300 leading-snug">Better advice.</p>
          <p class="text-[11px] font-medium text-slate-400 leading-snug">Greater tomorrow.</p>
        </div>
        <div class="w-full h-14 relative opacity-40">
          <svg class="w-full h-full text-[#1E3A5F]" viewBox="0 0 260 60" preserveAspectRatio="none" fill="currentColor">
            <polygon points="0,60 45,22 95,50 145,15 210,55 260,30 260,60" />
            <polygon points="20,60 70,35 125,58 175,28 230,52 260,40 260,60" opacity="0.6" />
          </svg>
        </div>
      </div>
    </aside>
  `;
}
