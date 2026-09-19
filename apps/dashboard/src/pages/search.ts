import { html, type SafeHtml } from '@shared/html';
import { fullName } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { emptyState, pageHeading } from '../components/ui';

export function renderDashboardSearchPage(query: string): SafeHtml {
  const results = adviserService.search(query);
  const total = results.clients.length + results.requests.length + results.claims.length;

  return html`
    <div class="space-y-6">
      ${pageHeading(`Search results for “${query}”`, `${total} match${total === 1 ? '' : 'es'}`)}
      ${total === 0 ? html`<div class="bg-white rounded-2xl border border-slate-200">${emptyState('Nothing found', 'Try a client name, email, SA ID, request or claim reference.')}</div>` : ''}

      ${results.clients.length
        ? html`<div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            <h3 class="p-4 text-xs font-bold text-slate-800 uppercase tracking-wide">Clients</h3>
            ${results.clients.map((c) => html`<button data-dash-nav="client-detail" data-id="${c.id}" class="w-full text-left p-4 hover:bg-slate-50 text-xs flex justify-between"><span class="font-bold text-slate-900">${fullName(c.profile, c.client_number || 'Client')}</span><span class="font-mono text-slate-400">${c.client_number}</span></button>`)}
          </div>`
        : ''}
      ${results.requests.length
        ? html`<div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            <h3 class="p-4 text-xs font-bold text-slate-800 uppercase tracking-wide">Requests</h3>
            ${results.requests.map((r) => html`<button data-dash-nav="request-detail" data-id="${r.id}" class="w-full text-left p-4 hover:bg-slate-50 text-xs flex justify-between gap-3"><span><span class="font-mono font-bold text-slate-900">${r.request_number}</span> ${r.title}</span>${renderDashboardStatusBadge(r.status)}</button>`)}
          </div>`
        : ''}
      ${results.claims.length
        ? html`<div class="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
            <h3 class="p-4 text-xs font-bold text-slate-800 uppercase tracking-wide">Claims</h3>
            ${results.claims.map((c) => html`<button data-dash-nav="claim-detail" data-id="${c.id}" class="w-full text-left p-4 hover:bg-slate-50 text-xs flex justify-between gap-3"><span><span class="font-mono font-bold text-slate-900">${c.claim_number}</span> ${adviserService.clientName(c.client_id)}</span>${renderDashboardStatusBadge(c.status)}</button>`)}
          </div>`
        : ''}
    </div>
  `;
}
