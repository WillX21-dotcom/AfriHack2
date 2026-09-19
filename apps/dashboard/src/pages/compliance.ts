import { localStore } from '@supabase-pkg/client';
import { formatDateTime } from '../utils/formatters';

export function renderDashboardCompliancePage(): string {
  const state = localStore.getState();
  const logs = state.audit_logs;

  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-base font-bold text-slate-900">FAIS, FICA & POPIA Regulatory Compliance Center</h2>
        <p class="text-xs text-slate-500">Statutory record keeping and tamper-evident audit registers for FSCA oversight</p>
      </div>

      <!-- Regulatory Licenses Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-amber-600 block">FSCA Licensed Entity</span>
          <h3 class="text-sm font-bold text-slate-900 mt-1">FSP Category I & II</h3>
          <p class="text-xs text-slate-500 font-mono mt-0.5">License # 48921</p>
          <div class="mt-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg inline-block">
            ✓ In Good Standing
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-blue-600 block">POPIA Compliance</span>
          <h3 class="text-sm font-bold text-slate-900 mt-1">Information Officer Registered</h3>
          <p class="text-xs text-slate-500 mt-0.5">Reg # ZA-POPIA-84920</p>
          <div class="mt-2 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded-lg inline-block">
            ✓ End-to-End Encryption
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-[10px] uppercase font-bold text-purple-600 block">FICA Risk & KYC</span>
          <h3 class="text-sm font-bold text-slate-900 mt-1">Risk Management Compliance</h3>
          <p class="text-xs text-slate-500 mt-0.5">RMCP Version 4.2</p>
          <div class="mt-2 text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-lg inline-block">
            ✓ Automated 12-Month Audits
          </div>
        </div>
      </div>

      <!-- Regulatory Audit Log Register -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Immutable Record of Advice & System Actions</h3>
          <span class="text-xs text-slate-400 font-mono">${logs.length} Logged Entries</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4">Operator / User</th>
                <th class="py-3 px-4">Action Code</th>
                <th class="py-3 px-4">Entity Type</th>
                <th class="py-3 px-4">Audit Digest Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
              ${logs
                .map(
                  (log) => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 text-slate-400">${formatDateTime(log.created_at)}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">${log.user_id}</td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold">
                      ${log.action}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-slate-600">${log.entity_type}</td>
                  <td class="py-3 px-4 text-slate-500 truncate max-w-xs">${JSON.stringify(log.details)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
