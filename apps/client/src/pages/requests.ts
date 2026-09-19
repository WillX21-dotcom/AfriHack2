import { formatDate, html, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { renderEmptyState } from '../components/empty-state';

export function renderRequestsPage(): SafeHtml {
  const requests = requestService.getRequests();

  return html`
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Service requests</h2>
          <p class="text-xs text-slate-500">Track each request as your adviser works through it</p>
        </div>
        <button data-nav="create-request" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs">+ New request</button>
      </div>

      ${requests.length === 0
        ? renderEmptyState('No requests yet', 'Ask for a policy document, border letter, address change and more. Your adviser is notified straight away.', { label: 'Submit a request', nav: 'create-request' })
        : html`<div class="space-y-3">
            ${requests.map((req) => {
              const label = REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type;
              return html`<div data-nav="request-detail" data-id="${req.id}" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer">
                <div class="flex items-start justify-between mb-2 gap-2">
                  <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">${label}</span>
                  ${renderStatusBadge(req.status)}
                </div>
                <h3 class="text-xs font-bold text-slate-800 leading-snug">${req.title}</h3>
                ${req.description ? html`<p class="text-xs text-slate-500 line-clamp-2 mt-1">${req.description}</p>` : ''}
                <div class="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                  <span class="font-mono text-slate-600 font-semibold">${req.request_number}</span>
                  <span>Submitted ${formatDate(req.created_at)}</span>
                </div>
              </div>`;
            })}
          </div>`}
    </div>
  `;
}
