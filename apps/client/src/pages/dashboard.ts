import { CLAIM_STAGES, claimStageIndex, fullName, greeting, html, isOpenClaim, formatDate, formatZAR, relativeTime, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { dataStore } from '@supabase-pkg/client';
import { clientService } from '../services/client';
import { financialService } from '../services/financial';
import { requestService } from '../services/request';
import { claimService } from '../services/claim';
import { messageService } from '../services/message';
import { renderStatusBadge } from '../components/status-badge';
import { icon, type IconName } from '../components/icons';

function sectionHeader(title: string, nav?: string): SafeHtml {
  return html`
    <div class="flex items-center justify-between mb-2.5">
      <h3 class="rsc-eyebrow">${title}</h3>
      ${nav ? html`<button data-nav="${nav}" class="rsc-link">View all</button>` : ''}
    </div>`;
}

export function renderClientDashboardPage(): SafeHtml {
  const user = dataStore.getState().currentUser;
  const client = clientService.getCurrentClient();
  const adviser = clientService.getAdviser();
  const summary = financialService.getSummary();
  const goals = summary.goals.filter((g) => g.status === 'active').slice(0, 2);
  const requests = requestService.getRequests().slice(0, 3);
  const activeClaim = claimService.getClaims().find((c) => isOpenClaim(c.status));
  const unreadMessages = messageService.getUnreadCount();

  const stageIndex = activeClaim ? claimStageIndex(activeClaim.status) : -1;
  const stageLabel = activeClaim ? CLAIM_STAGES[stageIndex]?.clientLabel || activeClaim.status : '';

  const action = (nav: string, label: string, name: IconName, opts: { danger?: boolean; badge?: number } = {}) => html`
    <button data-nav="${nav}" class="relative rsc-card rsc-card-link !w-auto flex flex-col items-center gap-2 px-2 py-3.5 text-center">
      <span class="rsc-chip ${opts.danger ? 'rsc-chip-danger' : ''}">${icon(name, 'w-[18px] h-[18px]', 2)}</span>
      <span class="text-xs font-semibold text-slate-800 leading-tight">${label}</span>
      ${opts.badge ? html`<span class="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white font-semibold text-[10px] leading-4">${opts.badge}</span>` : ''}
    </button>`;

  return html`
    <div class="space-y-6 pb-4">
      <div>
        <h2 class="rsc-title">${greeting()}, ${user?.first_name || fullName(user, 'there')}</h2>
        <p class="rsc-subtitle mt-0.5">${adviser ? html`Your adviser is <strong class="text-slate-800 font-semibold">${fullName(adviser)}</strong>` : 'Your Royal Square adviser will be assigned shortly'}</p>
      </div>

      ${!client
        ? html`<div class="rsc-notice rsc-notice-warn">Your client file is being set up. Please contact Royal Square if this message does not go away.</div>`
        : ''}

      <button data-nav="financial" class="rsc-card rsc-card-link p-5 block">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="rsc-eyebrow">Net worth</p>
            ${summary.hasFinancialData
              ? html`<p class="rsc-num text-[28px] leading-tight font-semibold text-slate-900 mt-1.5">${formatZAR(summary.netWorth)}</p>`
              : html`<p class="text-base font-semibold text-slate-700 mt-1.5">Not captured yet</p>`}
          </div>
          <span class="text-slate-400 mt-1">${icon('chevronRight', 'w-5 h-5')}</span>
        </div>
        ${summary.hasFinancialData
          ? html`<div class="grid grid-cols-2 gap-4 mt-4 pt-4 rsc-divider">
              <div><p class="rsc-muted">Assets and investments</p><p class="rsc-num text-sm font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalAssets + summary.totalInvestments)}</p></div>
              <div><p class="rsc-muted">Liabilities</p><p class="rsc-num text-sm font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalLiabilities)}</p></div>
            </div>`
          : html`<p class="rsc-muted mt-2">Your adviser will add your balance sheet during onboarding.</p>`}
      </button>

      <div>
        <h3 class="rsc-eyebrow mb-2.5">Quick actions</h3>
        <div class="grid grid-cols-4 gap-2.5">
          ${action('create-request', 'New request', 'document')}
          ${action('report-accident', 'Report accident', 'alert', { danger: true })}
          ${action('documents', 'Documents', 'folder')}
          ${action('messages', 'Messages', 'chat', { badge: unreadMessages })}
        </div>
      </div>

      <div>
        ${sectionHeader('Goals', 'goals')}
        ${goals.length === 0
          ? html`<div class="rsc-card px-4 py-5"><p class="rsc-muted">No goals yet. <button data-nav="goals" class="rsc-link">Set your first goal</button></p></div>`
          : html`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${goals.map((goal) => {
                const pct = goal.target_amount > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0;
                return html`<div class="rsc-card p-4">
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="rsc-heading truncate">${goal.name}</h4>
                    <span class="rsc-num text-xs font-semibold text-slate-600">${pct}%</span>
                  </div>
                  <p class="rsc-num text-[13px] text-slate-900 mt-1"><span class="font-semibold">${formatZAR(goal.current_amount)}</span> <span class="text-slate-400">of ${formatZAR(goal.target_amount)}</span></p>
                  <div class="rsc-progress mt-3"><span style="width: ${pct}%"></span></div>
                </div>`;
              })}
            </div>`}
      </div>

      <div>
        ${sectionHeader('Recent requests', 'requests')}
        ${requests.length === 0
          ? html`<div class="rsc-card px-4 py-5"><p class="rsc-muted">You have not submitted any requests yet.</p></div>`
          : html`<div class="rsc-card divide-y divide-slate-100">
              ${requests.map(
                (req) => html`<button data-nav="request-detail" data-id="${req.id}" class="w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 first:rounded-t-[14px] last:rounded-b-[14px]">
                  <div class="min-w-0">
                    <h4 class="text-[13px] font-semibold text-slate-900 truncate">${req.title}</h4>
                    <p class="rsc-muted truncate mt-0.5"><span class="rsc-ref">${req.request_number}</span> · ${REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type}</p>
                  </div>
                  <div class="flex flex-col items-end gap-1 shrink-0">${renderStatusBadge(req.status, 'request')}<span class="text-[11px] text-slate-400">${relativeTime(req.updated_at)}</span></div>
                </button>`
              )}
            </div>`}
      </div>

      ${activeClaim
        ? html`<div>
            ${sectionHeader('Active claim')}
            <button data-nav="claim-detail" data-id="${activeClaim.id}" class="rsc-card rsc-card-link p-4 block">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="rsc-ref !text-[12px]">${activeClaim.claim_number}</p>
                  <p class="rsc-heading mt-0.5 truncate">${activeClaim.metadata?.insured_vehicle || 'Motor claim'}</p>
                  <p class="rsc-muted mt-0.5">Incident on ${formatDate(activeClaim.incident_date)}</p>
                </div>
                ${renderStatusBadge(activeClaim.status)}
              </div>
              <div class="mt-4">
                <div class="flex justify-between rsc-muted mb-1.5"><span>${stageLabel}</span><span class="rsc-num">Stage ${stageIndex + 1} of ${CLAIM_STAGES.length}</span></div>
                <div class="rsc-progress"><span style="width: ${Math.round(((stageIndex + 1) / CLAIM_STAGES.length) * 100)}%"></span></div>
              </div>
            </button>
          </div>`
        : ''}
    </div>
  `;
}
