import { html, type SafeHtml } from '@shared/html';
import { formatDateTime, titleCase } from '@shared/format';
import { adviserService } from '../services/adviser';
import { emptyState, pageHeading } from '../components/ui';
import { newRecordControl } from './tasks';

export function renderDashboardRemindersPage(): SafeHtml {
  const reminders = adviserService.getReminders();
  const now = Date.now();
  const active = reminders.filter((r) => !r.is_completed);
  const overdue = active.filter((r) => new Date(r.reminder_date).getTime() < now);
  const upcoming = active.filter((r) => new Date(r.reminder_date).getTime() >= now);
  const completed = reminders.filter((r) => r.is_completed).slice(0, 12);

  const card = (rem: (typeof reminders)[number], tone: 'overdue' | 'upcoming' | 'done') => html`
    <div class="bg-white p-5 rounded-2xl border ${tone === 'overdue' ? 'border-rose-200' : tone === 'done' ? 'border-slate-200 opacity-70' : 'border-amber-200/80'} shadow-xs space-y-3">
      <div class="flex justify-between items-start gap-2">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">${titleCase(rem.frequency)}</span>
        <span class="text-[10px] font-bold font-mono ${tone === 'overdue' ? 'text-rose-700' : tone === 'done' ? 'text-slate-400' : 'text-amber-700'}">${tone === 'overdue' ? 'Overdue: ' : 'Due: '}${formatDateTime(rem.reminder_date)}</span>
      </div>
      <div>
        <h3 class="text-xs font-bold text-slate-900">${rem.title}</h3>
        <button data-dash-nav="client-detail" data-id="${rem.client_id}" class="text-[11px] font-semibold text-blue-700 hover:underline">${adviserService.clientName(rem.client_id)}</button>
        ${rem.description ? html`<p class="text-xs text-slate-500 mt-1 leading-relaxed">${rem.description}</p>` : ''}
        <p class="text-[10px] text-slate-400 mt-1">${rem.notify_client ? 'Client is notified' : 'Adviser only'}</p>
      </div>
      <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
        <button data-action="edit-record" data-table="reminders" data-client="${rem.client_id}" data-id="${rem.id}" class="text-[11px] font-semibold text-slate-500 hover:text-slate-800">Edit</button>
        ${tone === 'done'
          ? html`<span class="text-xs font-semibold text-emerald-700">✓ Completed</span>`
          : html`<button data-action="resolve-reminder" data-id="${rem.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 hover:bg-slate-800 rounded-xl text-xs font-semibold">${rem.frequency === 'once' ? 'Mark actioned ✓' : 'Actioned, schedule next ✓'}</button>`}
      </div>
    </div>
  `;

  const section = (title: string, list: typeof reminders, tone: 'overdue' | 'upcoming' | 'done') =>
    list.length === 0 ? '' : html`<div class="space-y-3"><h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">${title} (${list.length})</h3><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${list.map((r) => card(r, tone))}</div></div>`;

  return html`
    <div class="space-y-6">
      ${pageHeading('Compliance Reminders', 'FICA refreshers, annual reviews and renewals. Clients flagged on a reminder are notified when it falls due.', newRecordControl('reminders', '+ New reminder'))}
      ${reminders.length === 0 ? html`<div class="bg-white rounded-2xl border border-slate-200">${emptyState('No reminders yet', 'Pick a client above and schedule the first one.')}</div>` : ''}
      ${section('Overdue', overdue, 'overdue')} ${section('Upcoming', upcoming, 'upcoming')} ${section('Recently completed', completed, 'done')}
    </div>
  `;
}
