import { localStore } from '@supabase-pkg/client';

export function renderDashboardHeader(title?: string, subtitle?: string): string {
  const profile = localStore.getState().profiles.find((item) => item.id === localStore.getState().currentUser?.id) || localStore.getState().currentUser;
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const displayName = `${firstName} ${lastName}`.trim() || profile?.email || 'Administrator';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'RS';
  return `
    <header class="dashboard-header bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between">
      <!-- Left: Mobile Menu Toggle & Search Bar -->
      <div class="flex items-center space-x-3 flex-1 max-w-lg">
        <!-- Mobile Sidebar Toggle (visible on tablet/phone) -->
        <button id="dash-mobile-menu-btn" class="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors" title="Toggle Sidebar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <!-- Search Bar matching Screenshot 1 -->
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            id="dash-search-input"
            placeholder="Search clients, requests, claims..."
            class="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      <!-- Right: Notification Bell & Adviser Profile -->
      <div class="flex items-center space-x-3 sm:space-x-4">
        <!-- Notification Bell with Red Badge (6) -->
        <div class="relative">
          <button id="dash-notifications-btn" class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative" title="6 unread notifications">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white">
              6
            </span>
          </button>
        </div>

        <div class="h-6 w-px bg-slate-200"></div>

        <!-- Adviser Profile Avatar matching Screenshot 1 -->
        <button data-dash-nav="settings" class="flex items-center space-x-2.5 pl-1 text-left">
          <div class="w-8 h-8 rounded-full bg-[#0A192F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            ${initials}
          </div>
          <div class="hidden md:block text-left leading-tight">
            <h4 class="text-xs font-bold text-slate-900">${displayName}</h4>
            <p class="text-[10px] text-slate-500 font-medium">${profile?.role || 'Administrator'}</p>
          </div>
        </button>
      </div>
    </header>
  `;
}
