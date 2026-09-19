import { adviserService } from '../services/adviser';
import { formatDateTime } from '../utils/formatters';

export function renderDashboardRemindersPage(): string {
  const reminders = adviserService.getReminders();

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Regulatory Compliance Reminders</h2>
          <p class="text-xs text-slate-500">Scheduled FICA verification refreshers, annual policy reviews, and driver license expiries</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${reminders
          .map((rem) => {
            const isCompleted = rem.is_completed;
            return `
            <div class="bg-white p-5 rounded-2xl border ${
              isCompleted ? 'border-slate-200 opacity-60' : 'border-amber-200/80 shadow-xs'
            } space-y-3">
              <div class="flex justify-between items-start">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  ${rem.frequency.replace(/_/g, ' ')}
                </span>
                <span class="text-[10px] font-bold font-mono ${isCompleted ? 'text-slate-400' : 'text-amber-700'}">
                  Due: ${formatDateTime(rem.reminder_date)}
                </span>
              </div>

              <div>
                <h3 class="text-xs font-bold text-slate-900">${rem.title}</h3>
                <p class="text-xs text-slate-500 mt-1 leading-relaxed">${rem.description}</p>
              </div>

              <div class="pt-2 border-t border-slate-100 flex justify-end">
                ${
                  !isCompleted
                    ? `<button data-action="resolve-reminder" data-id="${rem.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all">
                        Mark Actioned ✓
                      </button>`
                    : '<span class="text-xs font-semibold text-emerald-700">✓ Completed</span>'
                }
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}
