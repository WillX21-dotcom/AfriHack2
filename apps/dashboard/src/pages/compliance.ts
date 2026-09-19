import { html, type SafeHtml } from '@shared/html';
import { dataStore } from '@supabase-pkg/client';
import { formatDateTime, titleCase } from '@shared/format';
import { adviserService } from '../services/adviser';
import { emptyState, pageHeading, statCard } from '../components/ui';

export function renderDashboardCompliancePage(): SafeHtml {
  const state = dataStore.getState();
  const logs = state.audit_logs;
  const clients = adviserService.getClients();
  const ficaCounts = { verified: 0, partial: 0, pending: 0 };
  for (const c of clients) ficaCounts[adviserService.ficaStatus(c.id)]++;
  const unverifiedDocs = state.documents.filter((d) => !d.is_verified).length;
  const overdueReminders = state.reminders.filter((r) => !r.is_completed && new Date(r.reminder_date).getTime() < Date.now()).length;
  const unassigned = clients.filter((c) => !c.adviser_id).length;

  return html`
    <div class="space-y-6">
      ${pageHeading('Compliance & Audit Trail', 'FICA status across your book and a tamper-resistant record of every change, written by the database itself.')}

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        ${statCard('FICA verified', `${ficaCounts.verified} / ${clients.length}`, 'emerald', `${ficaCounts.partial} partial · ${ficaCounts.pending} not started`, 'clients')}
        ${statCard('Documents to verify', unverifiedDocs, 'amber', 'Uploaded but not yet verified', 'documents')}
        ${statCard('Overdue reminders', overdueReminders, 'red', 'Past their due date', 'reminders')}
        ${statCard('Unassigned clients', unassigned, 'blue', 'No adviser on file', 'clients')}
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Record of changes</h3>
          <span class="text-xs text-slate-400 font-mono">Latest ${logs.length}</span>
        </div>
        ${logs.length === 0
          ? emptyState('No activity recorded yet')
          : html`
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr><th class="py-3 px-4">When</th><th class="py-3 px-4">Who</th><th class="py-3 px-4">Action</th><th class="py-3 px-4">Entity</th><th class="py-3 px-4">Detail</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-[11px]">
                  ${logs.map(
                    (log) => html`
                      <tr class="hover:bg-slate-50/80">
                        <td class="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">${formatDateTime(log.created_at)}</td>
                        <td class="py-3 px-4 font-semibold text-slate-800">${log.user_name || (log.user_id ? 'Former user' : 'System')}</td>
                        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold uppercase">${log.action.replace(/_/g, ' ')}</span></td>
                        <td class="py-3 px-4 text-slate-600">${titleCase(log.table_name)}</td>
                        <td class="py-3 px-4 text-slate-500">${log.client_id ? html`<button data-dash-nav="client-detail" data-id="${log.client_id}" class="text-blue-700 hover:underline text-left">${log.description}</button>` : log.description}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </div>
          `}
      </div>
    </div>
  `;
}
