import { formatDate, html, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { requestService } from '../services/request';
import { renderStatusBadge } from '../components/status-badge';
import { renderEmptyState } from '../components/empty-state';
import { icon } from '../components/icons';

export function renderRequestsPage(): SafeHtml {
  const requests = requestService.getRequests();

  return html`
    <div class="space-y-5 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="rsc-title">Service requests</h2>
          <p class="rsc-subtitle mt-0.5">Track each request as your adviser works through it</p>
        </div>
        <button data-nav="create-request" class="rsc-btn rsc-btn-primary rsc-btn-sm shrink-0">${icon('plus', 'w-4 h-4', 2.25)}New request</button>
      </div>

      ${requests.length === 0
        ? renderEmptyState('No requests yet', 'Ask for a policy document, border letter, address change and more. Your adviser is notified straight away.', { label: 'Submit a request', nav: 'create-request' })
        : html`<div class="space-y-3">
            ${requests.map((req) => {
              const label = REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type;
              return html`<button data-nav="request-detail" data-id="${req.id}" class="rsc-card rsc-card-link p-4 block">
                <div class="flex items-start justify-between gap-3">
                  <p class="rsc-eyebrow !normal-case !tracking-normal !text-[12px]">${label}</p>
                  ${renderStatusBadge(req.status, 'request')}
                </div>
                <h3 class="rsc-heading mt-1.5">${req.title}</h3>
                ${req.description ? html`<p class="rsc-muted mt-1 line-clamp-2">${req.description}</p>` : ''}
                <div class="flex items-center justify-between mt-3 pt-3 rsc-divider">
                  <span class="rsc-ref">${req.request_number}</span>
                  <span class="rsc-muted">Submitted ${formatDate(req.created_at)}</span>
                </div>
              </button>`;
            })}
          </div>`}
    </div>
  `;
}
