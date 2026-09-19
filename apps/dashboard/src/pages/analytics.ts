import { html, type SafeHtml } from '@shared/html';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { formatZAR } from '@shared/format';
import { adviserService } from '../services/adviser';
import { emptyState, statCard } from '../components/ui';

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
const label = (type: string) => REQUEST_TYPE_LABELS[type as RequestType] || type.replace(/_/g, ' ');

export function renderDashboardAnalyticsPage(): SafeHtml {
  const kpis = adviserService.getKPIs();
  const byProvider = adviserService.aumByProvider();
  const turnaround = adviserService.turnaroundByType();
  const volume = adviserService.requestsByType();
  const totalAum = byProvider.reduce((n, p) => n + p.value, 0);
  const maxVolume = Math.max(1, ...volume.map((v) => v.count));

  return html`
    <div class="space-y-6">
      <div>
        <h2 class="text-base font-bold text-slate-900">Practice Performance & Wealth Analytics</h2>
        <p class="text-xs text-slate-500">Calculated live from your clients' records. Measures with no history yet show a dash.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        ${statCard('Assets under advice', formatZAR(kpis.totalAUM), 'blue', 'Sum of all client investments')}
        ${statCard('Average turnaround', kpis.avgTurnaroundDays === null ? '—' : `${kpis.avgTurnaroundDays.toFixed(1)} days`, 'amber', `${kpis.completedRequests} resolved requests`)}
        ${statCard('Resolved within SLA', pct(kpis.slaMet), 'emerald', 'Requests finished before their deadline')}
        ${statCard('Claims settled', pct(kpis.settledRate), 'red', `${kpis.closedClaims} claims closed`)}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Investments by provider</h3>
          ${byProvider.length === 0
            ? emptyState('No investments captured yet')
            : html`<div class="space-y-3">
                ${byProvider.map((p) => {
                  const share = totalAum ? (p.value / totalAum) * 100 : 0;
                  return html`
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="font-medium text-slate-800">${p.name}</span><span class="font-mono font-bold text-slate-900">${Math.round(share)}% · ${formatZAR(p.value)}</span></div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5"><div class="bg-[#0A192F] h-2.5 rounded-full" style="width: ${share}%"></div></div>
                    </div>
                  `;
                })}
              </div>`}
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Request volume by category</h3>
          ${volume.length === 0
            ? emptyState('No requests yet')
            : html`<div class="space-y-3">
                ${volume.map(
                  (v) => html`
                    <div>
                      <div class="flex justify-between text-xs mb-1"><span class="font-medium text-slate-800">${label(v.type)}</span><span class="font-mono font-bold text-slate-900">${v.count}</span></div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5"><div class="bg-amber-500 h-2.5 rounded-full" style="width: ${(v.count / maxVolume) * 100}%"></div></div>
                    </div>
                  `
                )}
              </div>`}
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Turnaround by category (resolved requests)</h3>
        ${turnaround.length === 0
          ? emptyState('No resolved requests yet', 'Turnaround appears once requests have been completed.')
          : html`<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              ${turnaround.map(
                (t) => html`<div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl"><span class="font-semibold text-slate-800">${label(t.type)} <span class="text-slate-400 font-normal">(${t.count})</span></span><span class="font-mono font-bold ${t.avgDays <= 3 ? 'text-emerald-700' : 'text-amber-700'}">${t.avgDays.toFixed(1)} days</span></div>`
              )}
            </div>`}
      </div>
    </div>
  `;
}
