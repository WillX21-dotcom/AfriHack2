import { html, type SafeHtml } from '@shared/html';
import { relativeTime } from '@shared/format';
import { adviserService } from '../services/adviser';
import { emptyState, pageHeading } from '../components/ui';

export function renderDashboardNotificationsPage(): SafeHtml {
  const notifications = adviserService.getNotifications();
  const unread = notifications.filter((n) => !n.is_read).length;

  return html`
    <div class="space-y-6">
      ${pageHeading(
        'Notifications',
        `${unread} unread. New client requests, claims, messages, uploads and due reminders land here.`,
        unread ? html`<button id="mark-all-notifications-btn" class="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs">Mark all read</button>` : ''
      )}

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        ${notifications.length === 0
          ? emptyState('You are all caught up')
          : notifications.map((n) => {
              const target = n.request_id ? ['request-detail', n.request_id] : n.claim_id ? ['claim-detail', n.claim_id] : n.document_id ? ['documents', ''] : n.notification_type === 'message' ? ['communications', ''] : ['', ''];
              return html`
                <button data-action="open-notification" data-id="${n.id}" data-route="${target[0]}" data-target="${target[1]}" class="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 ${n.is_read ? 'opacity-70' : ''}">
                  <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-slate-200' : 'bg-amber-500'}"></span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2"><h4 class="text-xs font-bold text-slate-900 truncate">${n.title}</h4><span class="text-[10px] text-slate-400 shrink-0">${relativeTime(n.created_at)}</span></div>
                    ${n.body ? html`<p class="text-[11px] text-slate-500 mt-0.5">${n.body}</p>` : ''}
                  </div>
                </button>
              `;
            })}
      </div>
    </div>
  `;
}
