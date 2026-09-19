import { html, type SafeHtml } from '@shared/index';
import { notificationService } from '../services/notification';

export function renderClientHeader(title?: string, subtitle?: string, showBack = false): SafeHtml {
  const unread = notificationService.getUnreadCount();

  return html`
    <header class="bg-[#0A192F] text-white px-5 pt-3 pb-3 sticky top-0 z-30 shadow-md relative overflow-hidden">
      <div class="absolute right-0 bottom-0 top-0 w-48 opacity-20 pointer-events-none">
        <svg class="w-full h-full text-white" viewBox="0 0 200 60" preserveAspectRatio="none" fill="currentColor">
          <polygon points="40,60 90,20 140,55 180,15 200,60" />
        </svg>
      </div>

      <div class="flex items-center justify-between relative z-10">
        <div class="flex items-center space-x-2.5">
          ${showBack
            ? html`<button data-action="go-back" aria-label="Back" class="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>`
            : ''}
          <div class="flex items-center space-x-2">
            <svg class="w-7 h-7 text-amber-400 shrink-0" viewBox="0 0 44 32" fill="none">
              <path d="M7 25H37L35 22H9L7 25Z" fill="#F59E0B" />
              <path d="M7 22L10 8L18 16L22 4L26 16L34 8L37 22H7Z" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="10" cy="8" r="1.5" fill="#F59E0B" />
              <circle cx="22" cy="4" r="1.5" fill="#F59E0B" />
              <circle cx="34" cy="8" r="1.5" fill="#F59E0B" />
            </svg>
            <div>
              <h1 class="font-serif-royal font-bold text-xs sm:text-sm text-white tracking-[0.16em] uppercase leading-tight">${title || 'Royal Square'}</h1>
              ${subtitle ? html`<p class="text-[9px] text-slate-400 tracking-[0.18em] uppercase font-medium">${subtitle}</p>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button data-nav="notifications" class="relative p-2 text-slate-200 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="${unread} unread notifications" aria-label="Notifications">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            ${unread > 0
              ? html`<span class="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-[#0A192F]">${unread > 99 ? '99+' : unread}</span>`
              : ''}
          </button>

          <button data-action="client-sign-out" class="p-1.5 text-slate-300 hover:text-rose-300 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-1" title="Sign out">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="hidden sm:inline text-[11px] font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  `;
}
