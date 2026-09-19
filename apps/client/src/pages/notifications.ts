import { html, relativeTime, type SafeHtml } from '@shared/index';
import { notificationService } from '../services/notification';

/** Where tapping a notification should take the client. */
export function notificationTarget(n: { request_id: string | null; claim_id: string | null; document_id: string | null; notification_type: string }): { route: string; id?: string } | null {
  if (n.request_id) return { route: 'request-detail', id: n.request_id };
  if (n.claim_id) return { route: 'claim-detail', id: n.claim_id };
  if (n.document_id) return { route: 'documents' };
  if (n.notification_type === 'message') return { route: 'messages' };
  return null;
}

export function renderNotificationsPage(): SafeHtml {
  const notifications = notificationService.getNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;

  return html`
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Notifications</h2>
          <p class="text-xs text-slate-500">Updates from your adviser on requests, claims, documents and messages</p>
        </div>
        ${unread > 0 ? html`<button id="mark-all-read-btn" class="text-xs text-amber-800 font-bold hover:underline">Mark all read</button>` : ''}
      </div>

      ${notifications.length === 0
        ? html`<div class="p-8 text-center bg-white rounded-2xl border border-slate-200"><p class="text-xs text-slate-400">You're all caught up.</p></div>`
        : html`<div class="space-y-2.5">
            ${notifications.map((n) => {
              const target = notificationTarget(n);
              return html`<button data-notif-id="${n.id}" ${target ? html`data-notif-route="${target.route}" data-notif-target="${target.id || ''}"` : ''} class="w-full text-left p-3.5 rounded-2xl border transition-all ${n.is_read ? 'bg-white border-slate-200/80 opacity-75' : 'bg-amber-50/60 border-amber-200 shadow-xs'}">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center space-x-2 min-w-0">
                    ${!n.is_read ? html`<span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>` : ''}
                    <h4 class="text-xs font-bold text-slate-800 truncate">${n.title}</h4>
                  </div>
                  <span class="text-[10px] text-slate-400 shrink-0">${relativeTime(n.created_at)}</span>
                </div>
                ${n.body ? html`<p class="text-xs text-slate-600 mt-1 ${n.is_read ? '' : 'pl-4'} leading-relaxed">${n.body}</p>` : ''}
              </button>`;
            })}
          </div>`}
    </div>
  `;
}
