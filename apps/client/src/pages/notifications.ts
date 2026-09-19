import { notificationService } from '../services/notification';
import { formatRelativeTime } from '../utils/date';

export function renderNotificationsPage(): string {
  const notifications = notificationService.getNotifications();

  return `
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">In-App Notifications</h2>
          <p class="text-xs text-slate-500">Real-time alerts, claim milestones & adviser reminders</p>
        </div>
        <button id="mark-all-read-btn" class="text-xs text-amber-800 font-bold hover:underline">
          Mark all read
        </button>
      </div>

      <div class="space-y-2.5">
        ${
          notifications.length === 0
            ? `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p class="text-xs text-slate-400">All caught up! No unread notifications.</p>
              </div>`
            : notifications
                .map(
                  (n) => `
            <div data-notif-id="${n.id}" class="p-3.5 rounded-2xl border transition-all ${
                    n.is_read ? 'bg-white border-slate-200/80 opacity-75' : 'bg-amber-50/60 border-amber-200 shadow-xs'
                  }">
              <div class="flex items-start justify-between">
                <div class="flex items-center space-x-2">
                  ${!n.is_read ? '<span class="w-2 h-2 rounded-full bg-amber-500"></span>' : ''}
                  <h4 class="text-xs font-bold text-slate-800">${n.title}</h4>
                </div>
                <span class="text-[10px] text-slate-400">${formatRelativeTime(n.created_at)}</span>
              </div>
              <p class="text-xs text-slate-600 mt-1 pl-4 leading-relaxed">${n.body}</p>
            </div>
          `
                )
                .join('')
        }
      </div>
    </div>
  `;
}
