import { html, type SafeHtml } from '@shared/html';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { formatZAR, greeting, relativeTime, formatDate, fullName, initials, isOpenClaim, isOpenRequest } from '@shared/format';
import { adviserService, CLAIM_PIPELINE } from '../services/adviser';
import { renderDashboardStatusBadge, renderPriorityBadge } from '../components/status-badge';
import { emptyState, statCard } from '../components/ui';

function growthChart(): SafeHtml {
  const data = adviserService.clientGrowth(6);
  const max = Math.max(1, ...data.map((d) => d.count));
  const barWidth = 40;
  const gap = 20;
  const height = 110;
  return html`
    <svg viewBox="0 0 ${data.length * (barWidth + gap)} ${height + 24}" class="w-full h-44" role="img" aria-label="Clients onboarded over the last six months">
      ${data.map((d, i) => {
        const h = Math.round((d.count / max) * height);
        const x = i * (barWidth + gap) + gap / 2;
        return html`
          <rect x="${x}" y="${height - h}" width="${barWidth}" height="${h}" rx="6" fill="#2563EB" opacity="0.85" />
          <text x="${x + barWidth / 2}" y="${height - h - 4}" text-anchor="middle" font-size="10" fill="#475569" font-weight="600">${d.count}</text>
          <text x="${x + barWidth / 2}" y="${height + 16}" text-anchor="middle" font-size="10" fill="#94A3B8">${d.label}</text>
        `;
      })}
    </svg>
  `;
}

function claimStepper(status: string): SafeHtml {
  const index = CLAIM_PIPELINE.findIndex((s) => s.key === status);
  const total = CLAIM_PIPELINE.length;
  const pct = index < 0 ? 0 : Math.round(((index + 1) / total) * 100);
  return html`
    <div class="mt-3">
      <div class="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>${CLAIM_PIPELINE[index]?.label || status}</span>
        <span>Stage ${Math.max(index + 1, 1)} of ${total}</span>
      </div>
      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-amber-500 h-2 rounded-full" style="width: ${pct}%"></div></div>
    </div>
  `;
}

export function renderDashboardOverviewPage(): SafeHtml {
  const me = adviserService.getMe();
  const kpis = adviserService.getKPIs();
  const openRequests = adviserService.getRequests().filter((r) => isOpenRequest(r.status)).slice(0, 6);
  const openClaims = adviserService.getClaims().filter((c) => isOpenClaim(c.status)).slice(0, 3);
  const notifications = adviserService.getNotifications().slice(0, 5);
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return html`
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">${greeting()}, ${me?.first_name || 'there'}</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Here's what's happening across your clients.</p>
        </div>
        <div class="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">${today}</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard('Active Clients', kpis.activeClients, 'blue', `${kpis.newClients30d} joined in the last 30 days`, 'clients')}
        ${statCard('Open Requests', kpis.openRequests, 'amber', kpis.overdueRequests ? `${kpis.overdueRequests} past their SLA` : 'None past their SLA', 'requests')}
        ${statCard('Active Claims', kpis.activeClaims, 'red', `${kpis.closedClaims} closed to date`, 'claims')}
        ${statCard('My Open Tasks', kpis.myOpenTasks, 'emerald', `${kpis.openTasks} across the practice`, 'tasks')}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-sm text-slate-900">Client Service Queue</h3>
            <button data-dash-nav="requests" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View all requests →</button>
          </div>
          ${openRequests.length === 0
            ? emptyState('No open requests', 'New requests from the client app appear here in real time.')
            : html`
              <div class="overflow-x-auto -mx-5 px-5">
                <table class="w-full text-left text-xs whitespace-nowrap min-w-[520px]">
                  <thead>
                    <tr class="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                      <th class="pb-3 font-medium">Client</th><th class="pb-3 font-medium">Request</th><th class="pb-3 font-medium">Priority</th><th class="pb-3 font-medium">Status</th><th class="pb-3 font-medium text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${openRequests.map((r) => {
                      const client = adviserService.getClient(r.client_id);
                      return html`
                        <tr data-dash-nav="request-detail" data-id="${r.id}" class="hover:bg-slate-50/80 transition-colors cursor-pointer">
                          <td class="py-3">
                            <div class="flex items-center space-x-2.5">
                              <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">${initials(client?.profile)}</div>
                              <span class="font-semibold text-slate-900">${fullName(client?.profile, client?.client_number || 'Client')}</span>
                            </div>
                          </td>
                          <td class="py-3 text-slate-600">${REQUEST_TYPE_LABELS[r.request_type as RequestType] || r.title}</td>
                          <td class="py-3">${renderPriorityBadge(r.priority)}</td>
                          <td class="py-3">${renderDashboardStatusBadge(r.status)}</td>
                          <td class="py-3 text-right text-slate-400 font-medium">${relativeTime(r.updated_at)}</td>
                        </tr>
                      `;
                    })}
                  </tbody>
                </table>
              </div>
            `}
        </div>

        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-sm text-slate-900 mb-2">Practice Overview</h3>
            <p class="text-[11px] font-medium text-slate-500">Combined client net worth</p>
            <span class="text-xl font-bold text-slate-900 font-mono">${formatZAR(kpis.netWorth)}</span>
            <p class="text-[11px] font-medium text-slate-500 mt-4">Clients onboarded (cumulative)</p>
            ${growthChart()}
          </div>
          <div class="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100">
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100"><p class="text-[11px] text-slate-500 font-medium">Assets</p><p class="text-xs font-bold text-slate-900 mt-0.5 font-mono">${formatZAR(kpis.totalAssets)}</p></div>
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100"><p class="text-[11px] text-slate-500 font-medium">AUM</p><p class="text-xs font-bold text-slate-900 mt-0.5 font-mono">${formatZAR(kpis.totalAUM)}</p></div>
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100"><p class="text-[11px] text-slate-500 font-medium">Liabilities</p><p class="text-xs font-bold text-slate-900 mt-0.5 font-mono">${formatZAR(kpis.totalLiabilities)}</p></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-sm text-slate-900">Active Claims</h3>
            <button data-dash-nav="claims" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View all claims →</button>
          </div>
          ${openClaims.length === 0
            ? emptyState('No active claims')
            : html`<div class="space-y-4">
                ${openClaims.map(
                  (c) => html`
                    <div data-dash-nav="claim-detail" data-id="${c.id}" class="p-3 rounded-xl border border-slate-100 hover:border-amber-300 cursor-pointer transition-colors">
                      <div class="flex items-center space-x-2">
                        <span class="font-bold text-sm text-slate-900 font-mono">${c.claim_number}</span>
                        ${renderDashboardStatusBadge(c.status)}
                      </div>
                      <p class="text-xs text-slate-600 mt-1"><span class="text-slate-400">Client:</span> <strong class="text-slate-800">${adviserService.clientName(c.client_id)}</strong></p>
                      <p class="text-xs text-slate-600"><span class="text-slate-400">Incident:</span> ${formatDate(c.incident_date)} · ${c.incident_location || 'Location not given'}</p>
                      ${claimStepper(c.status)}
                    </div>
                  `
                )}
              </div>`}
        </div>

        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-sm text-slate-900">Recent Notifications</h3>
            <button data-dash-nav="notifications" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
          </div>
          ${notifications.length === 0
            ? emptyState('Nothing new')
            : html`<div class="space-y-3">
                ${notifications.map(
                  (n) => html`
                    <div class="flex items-start space-x-3 text-xs">
                      <span class="w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-slate-200' : 'bg-amber-500'}"></span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <h4 class="font-bold text-slate-800 truncate">${n.title}</h4>
                          <span class="text-[10px] text-slate-400 shrink-0">${relativeTime(n.created_at)}</span>
                        </div>
                        ${n.body ? html`<p class="text-slate-500 text-[11px] mt-0.5 line-clamp-2">${n.body}</p>` : ''}
                      </div>
                    </div>
                  `
                )}
              </div>`}
        </div>
      </div>
    </div>
  `;
}
