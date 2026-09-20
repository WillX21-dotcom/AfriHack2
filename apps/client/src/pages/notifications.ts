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
    <div class="space-y-5 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="rsc-title">Notifications</h2>
          <p class="rsc-subtitle mt-0.5">Updates from your adviser on requests, claims, documents and messages</p>
        </div>
        ${unread > 0 ? html`<button id="mark-all-read-btn" class="rsc-btn rsc-btn-secondary rsc-btn-sm shrink-0">Mark all read</button>` : ''}
      </div>

      ${notifications.length === 0
        ? html`<div class="rsc-card px-6 py-10 text-center"><h3 class="rsc-heading">You're all caught up</h3><p class="rsc-muted mt-1.5">New updates will appear here.</p></div>`
        : html`<div class="rsc-card divide-y divide-slate-100">
            ${notifications.map((n) => {
              const target = notificationTarget(n);
              return html`<button data-notif-id="${n.id}" ${target ? html`data-notif-route="${target.route}" data-notif-target="${target.id || ''}"` : ''} class="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-50 first:rounded-t-[14px] last:rounded-b-[14px]">
                <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-blue-600'}" aria-hidden="true"></span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-start justify-between gap-3">
                    <span class="text-[13px] ${n.is_read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}">${n.title}</span>
                    <span class="text-[11px] text-slate-400 shrink-0 pt-0.5">${relativeTime(n.created_at)}</span>
                  </span>
                  ${n.body ? html`<span class="block rsc-muted mt-0.5">${n.body}</span>` : ''}
                </span>
              </button>`;
            })}
          </div>`}
    </div>
  `;
}
