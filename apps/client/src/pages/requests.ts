import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { formatSimpleDate } from '../utils/date';
import { REQUEST_TYPE_LABELS, RequestType } from '@shared/constants/request-types';

export function renderRequestsPage(): string {
  const requests = requestService.getRequests();

  return `
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Service & Compliance Requests</h2>
          <p class="text-xs text-slate-500">Track 4-stage advisory workflow processing</p>
        </div>
        <button data-nav="create-request" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs">
          + New Request
        </button>
      </div>

      <div class="space-y-3">
        ${
          requests.length === 0
            ? `<div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p class="text-xs text-slate-400">No requests submitted yet.</p>
              </div>`
            : requests
                .map((req) => {
                  const categoryLabel = REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type;
                  return `
            <div data-nav="request-detail" data-id="${req.id}" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer">
              <div class="flex items-start justify-between mb-2">
                <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">${categoryLabel}</span>
                ${renderStatusBadge(req.status)}
              </div>
              <h3 class="text-xs font-bold text-slate-800 leading-snug">${req.title}</h3>
              ${req.description ? `<p class="text-xs text-slate-500 line-clamp-2 mt-1">${req.description}</p>` : ''}
              <div class="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                <span class="font-mono text-slate-600 font-semibold">${req.request_number}</span>
                <span>Submitted: ${formatSimpleDate(req.created_at)}</span>
              </div>
            </div>
          `;
                })
                .join('')
        }
      </div>
    </div>
  `;
}
