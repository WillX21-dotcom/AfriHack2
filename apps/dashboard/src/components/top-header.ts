import { html, type SafeHtml } from '@shared/html';
import { fullName, initials, titleCase } from '@shared/format';
import { adviserService } from '../services/adviser';

export function renderDashboardHeader(title?: string, subtitle?: string): SafeHtml {
  const profile = adviserService.getMe();
  const unread = adviserService.unreadNotificationCount();

  return html`
    <header class="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center space-x-3 flex-1 max-w-lg">
        <button id="dash-mobile-menu-btn" class="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors" title="Toggle Sidebar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <form id="dash-search-form" class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="search"
            id="dash-search-input"
            placeholder="Search clients, requests, claims..."
            class="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </form>
      </div>

      <div class="hidden xl:block min-w-0 text-right">
        <p class="text-xs font-bold text-slate-900 truncate">${title}</p>
        ${subtitle ? html`<p class="text-[10px] text-slate-400 truncate">${subtitle}</p>` : ''}
      </div>

      <div class="flex items-center space-x-3 sm:space-x-4">
        <button data-dash-nav="notifications" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative" title="${unread} unread notifications">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          ${unread > 0
            ? html`<span class="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">${unread > 99 ? '99+' : unread}</span>`
            : ''}
        </button>

        <div class="h-6 w-px bg-slate-200"></div>

        <button data-dash-nav="settings" class="flex items-center space-x-2.5 pl-1 text-left">
          <div class="w-8 h-8 rounded-full bg-[#0A192F] text-white flex items-center justify-center font-bold text-xs shadow-xs">${initials(profile)}</div>
          <div class="hidden md:block text-left leading-tight">
            <h4 class="text-xs font-bold text-slate-900">${fullName(profile, 'Royal Desk')}</h4>
            <p class="text-[10px] text-slate-500 font-medium">${titleCase(profile?.role || 'staff')}</p>
          </div>
        </button>
      </div>
    </header>
  `;
}
