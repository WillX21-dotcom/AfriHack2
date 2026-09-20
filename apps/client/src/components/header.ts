import { html, type SafeHtml } from '@shared/index';
import { notificationService } from '../services/notification';
import { icon } from './icons';

/** White app bar, matching the adviser dashboard's top bar. The brand mark only shows on top-level screens. */
export function renderClientHeader(title?: string, subtitle?: string, showBack = false): SafeHtml {
  const unread = notificationService.getUnreadCount();

  return html`
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div class="max-w-3xl mx-auto w-full px-4 h-14 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          ${showBack
            ? html`<button data-action="go-back" aria-label="Back" class="rsc-btn rsc-btn-quiet -ml-2 !p-2">${icon('chevronLeft', 'w-5 h-5', 2)}</button>`
            : html`<span class="w-8 h-8 rounded-lg bg-[#0A192F] flex items-center justify-center shrink-0" aria-hidden="true">
                <svg class="w-5 h-5" viewBox="0 0 44 32" fill="none"><path d="M7 25H37L35 22H9L7 25Z" fill="#FCD34D" /><path d="M7 22L10 8L18 16L22 4L26 16L34 8L37 22H7Z" stroke="#FCD34D" stroke-width="2.5" stroke-linejoin="round" /></svg>
              </span>`}
          <div class="min-w-0">
            <h1 class="text-[15px] font-semibold text-slate-900 leading-tight truncate">${title || 'Royal Square'}</h1>
            ${subtitle ? html`<p class="text-[11px] text-slate-500 leading-tight truncate">${subtitle}</p>` : ''}
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button data-nav="notifications" class="relative rsc-btn rsc-btn-quiet !p-2" title="${unread} unread notifications" aria-label="Notifications">
            ${icon('bell', 'w-5 h-5')}
            ${unread > 0
              ? html`<span class="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-semibold text-[10px] leading-4 text-center ring-2 ring-white">${unread > 99 ? '99+' : unread}</span>`
              : ''}
          </button>
          <button data-action="client-sign-out" class="rsc-btn rsc-btn-quiet !p-2" title="Sign out" aria-label="Sign out">${icon('logout', 'w-5 h-5')}</button>
        </div>
      </div>
    </header>
  `;
}
