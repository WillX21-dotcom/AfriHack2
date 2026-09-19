import { CLAIM_STAGES, claimStageIndex, fullName, greeting, html, isOpenClaim, formatDate, formatZAR, relativeTime, type SafeHtml } from '@shared/index';
import { REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { dataStore } from '@supabase-pkg/client';
import { clientService } from '../services/client';
import { financialService } from '../services/financial';
import { requestService } from '../services/request';
import { claimService } from '../services/claim';
import { messageService } from '../services/message';
import { renderStatusBadge } from '../components/status-badge';

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

  return html`
    <div class="space-y-4 pb-20 max-w-3xl mx-auto">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">${greeting()}, ${user?.first_name || fullName(user, 'there')}</h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          ${adviser ? html`Your adviser is <strong class="text-slate-700">${fullName(adviser)}</strong>.` : 'Your financial journey, our priority.'}
        </p>
      </div>

      ${!client
        ? html`<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">Your client file is being set up. Please contact Royal Square if this message does not go away.</div>`
        : ''}

      <div data-nav="financial" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs cursor-pointer hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500">Net worth</p>
            ${summary.hasFinancialData
              ? html`<span class="text-xl sm:text-2xl font-bold text-slate-900 font-mono">${formatZAR(summary.netWorth)}</span>
                  <p class="text-[11px] text-slate-400 mt-0.5">${formatZAR(summary.totalAssets + summary.totalInvestments)} assets and investments, ${formatZAR(summary.totalLiabilities)} liabilities</p>`
              : html`<span class="text-sm font-semibold text-slate-700">Not captured yet</span>
                  <p class="text-[11px] text-slate-400 mt-0.5">Your adviser will add your balance sheet during onboarding.</p>`}
          </div>
          <span class="text-slate-400">→</span>
        </div>
      </div>

      <div>
        <h3 class="text-xs font-bold text-slate-900 mb-2.5">Quick actions</h3>
        <div class="grid grid-cols-4 gap-2 sm:gap-3">
          <button data-nav="create-request" class="bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100/80 rounded-2xl p-3 text-center transition-all">
            <span class="block text-lg">📝</span><span class="text-[11px] font-semibold text-slate-800 leading-tight">Request<br/>service</span>
          </button>
          <button data-nav="report-accident" class="bg-red-50/70 hover:bg-red-100/70 border border-red-100/80 rounded-2xl p-3 text-center transition-all">
            <span class="block text-lg">🚗</span><span class="text-[11px] font-semibold text-slate-800 leading-tight">Report<br/>accident</span>
          </button>
          <button data-nav="documents" class="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100/80 rounded-2xl p-3 text-center transition-all">
            <span class="block text-lg">📁</span><span class="text-[11px] font-semibold text-slate-800 leading-tight">Documents</span>
          </button>
          <button data-nav="messages" class="relative bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100/80 rounded-2xl p-3 text-center transition-all">
            <span class="block text-lg">💬</span><span class="text-[11px] font-semibold text-slate-800 leading-tight">Contact<br/>adviser</span>
            ${unreadMessages > 0 ? html`<span class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center">${unreadMessages}</span>` : ''}
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold text-slate-900">Goals</h3>
          <button data-nav="goals" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
        </div>
        ${goals.length === 0
          ? html`<div class="bg-white rounded-2xl p-4 border border-dashed border-slate-300 text-xs text-slate-500">No goals yet. <button data-nav="goals" class="font-semibold text-blue-600">Set your first goal</button>.</div>`
          : html`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${goals.map((goal) => {
                const pct = goal.target_amount > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0;
                return html`<div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-xs font-bold text-slate-800 truncate pr-2">${goal.name}</h4>
                    <span class="text-xs font-bold text-slate-600 font-mono">${pct}%</span>
                  </div>
                  <p class="text-xs font-semibold text-slate-900 font-mono">${formatZAR(goal.current_amount)} <span class="text-slate-400 font-normal">/ ${formatZAR(goal.target_amount)}</span></p>
                  <div class="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden"><div class="bg-emerald-500 h-2 rounded-full" style="width: ${pct}%"></div></div>
                </div>`;
              })}
            </div>`}
      </div>

      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold text-slate-900">Recent requests</h3>
          <button data-nav="requests" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</button>
        </div>
        ${requests.length === 0
          ? html`<div class="bg-white rounded-2xl p-4 border border-dashed border-slate-300 text-xs text-slate-500">You have not submitted any requests yet.</div>`
          : html`<div class="space-y-2">
              ${requests.map(
                (req) => html`<div data-nav="request-detail" data-id="${req.id}" class="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer gap-3">
                  <div class="min-w-0">
                    <h4 class="text-xs font-bold text-slate-900 truncate">${req.title}</h4>
                    <p class="text-[11px] text-slate-400 font-mono truncate">${req.request_number} · ${REQUEST_TYPE_LABELS[req.request_type as RequestType] || req.request_type}</p>
                  </div>
                  <div class="flex items-center space-x-2 shrink-0">${renderStatusBadge(req.status)}<span class="text-[11px] text-slate-400 hidden sm:inline">${relativeTime(req.updated_at)}</span></div>
                </div>`
              )}
            </div>`}
      </div>

      ${activeClaim
        ? html`<div data-nav="claim-detail" data-id="${activeClaim.id}" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300 transition-all">
            <h3 class="font-bold text-xs sm:text-sm text-slate-900 mb-2">Active claim</h3>
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <span class="font-bold text-xs sm:text-sm text-slate-900 font-mono">${activeClaim.claim_number}</span>${renderStatusBadge(activeClaim.status)}
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Incident: ${formatDate(activeClaim.incident_date)}${activeClaim.metadata?.insured_vehicle ? ` | ${activeClaim.metadata.insured_vehicle}` : ''}</p>
            <div class="mt-3">
              <div class="flex justify-between text-[11px] text-slate-500 mb-1"><span>${stageLabel}</span><span class="font-mono">${stageIndex + 1} of ${CLAIM_STAGES.length}</span></div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div class="bg-amber-500 h-2 rounded-full" style="width: ${Math.round(((stageIndex + 1) / CLAIM_STAGES.length) * 100)}%"></div></div>
            </div>
          </div>`
        : ''}
    </div>
  `;
}
