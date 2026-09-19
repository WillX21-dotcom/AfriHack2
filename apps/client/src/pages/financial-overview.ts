import { formatDate, formatZAR, html, titleCase, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';
import { clientService } from '../services/client';

export function renderFinancialOverviewPage(): SafeHtml {
  const summary = financialService.getSummary();
  const client = clientService.getCurrentClient();
  const beneficiaries = client ? clientService.getBeneficiaries(client.id) : [];
  const dependants = client ? clientService.getDependants(client.id) : [];

  if (!summary.hasFinancialData && beneficiaries.length === 0 && dependants.length === 0) {
    return html`
      <div class="space-y-4 pb-24">
        <div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <h2 class="text-sm font-bold text-slate-900">Your financial picture is being prepared</h2>
          <p class="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Your adviser captures your assets, liabilities, policies and investments after your onboarding conversation. They will appear here automatically.
          </p>
          <button data-nav="messages" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl">Message your adviser</button>
        </div>
      </div>`;
  }

  const cashflow = summary.totalMonthlyIncome - summary.totalMonthlyExpenses;

  return html`
    <div class="space-y-4 pb-24">
      <div class="bg-[#0A192F] text-white p-5 rounded-2xl shadow-md">
        <span class="text-xs text-amber-300 font-medium tracking-wide uppercase">Consolidated net worth</span>
        <h2 class="text-2xl font-bold font-mono text-white mt-1">${formatZAR(summary.netWorth)}</h2>
        <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
          <div><span class="text-[10px] text-slate-300 uppercase block">Assets</span><span class="text-xs font-bold text-white font-mono">${formatZAR(summary.totalAssets)}</span></div>
          <div><span class="text-[10px] text-slate-300 uppercase block">Investments</span><span class="text-xs font-bold text-amber-300 font-mono">${formatZAR(summary.totalInvestments)}</span></div>
          <div><span class="text-[10px] text-slate-300 uppercase block">Liabilities</span><span class="text-xs font-bold text-rose-300 font-mono">${formatZAR(summary.totalLiabilities)}</span></div>
        </div>
      </div>

      ${summary.income.length + summary.expenses.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Monthly cash flow</h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl"><span class="text-[10px] text-emerald-700 font-semibold uppercase block">Income</span><span class="text-base font-bold text-emerald-900 font-mono">${formatZAR(summary.totalMonthlyIncome)}</span></div>
              <div class="bg-rose-50/70 border border-rose-100 p-3 rounded-xl"><span class="text-[10px] text-rose-700 font-semibold uppercase block">Expenses</span><span class="text-base font-bold text-rose-900 font-mono">${formatZAR(summary.totalMonthlyExpenses)}</span></div>
            </div>
            <p class="text-[11px] text-slate-500 mt-3">Surplus after expenses: <strong class="font-mono ${cashflow < 0 ? 'text-rose-700' : 'text-emerald-700'}">${formatZAR(cashflow)}</strong> per month</p>
          </div>`
        : ''}

      ${summary.assets.length + summary.liabilities.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Assets and liabilities</h3>
            <div class="space-y-2">
              ${summary.assets.map((a) => html`<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs gap-2"><div class="min-w-0"><span class="font-semibold text-slate-800 block truncate">${a.name}</span><span class="text-[10px] text-slate-400">${titleCase(a.asset_type)}${a.institution ? ` · ${a.institution}` : ''}</span></div><span class="font-mono font-bold text-slate-700 shrink-0">${formatZAR(a.current_value)}</span></div>`)}
              ${summary.liabilities.map((l) => html`<div class="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-xl text-xs gap-2"><div class="min-w-0"><span class="font-semibold text-slate-800 block truncate">${l.name}</span><span class="text-[10px] text-slate-400">${titleCase(l.liability_type)}${l.institution ? ` · ${l.institution}` : ''}</span></div><span class="font-mono font-bold text-rose-700 shrink-0">-${formatZAR(l.outstanding_balance)}</span></div>`)}
            </div>
          </div>`
        : ''}

      ${summary.policies.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between mb-3"><h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">In-force policies</h3><span class="text-xs font-semibold text-slate-500">${summary.policies.length}</span></div>
            <div class="space-y-3">
              ${summary.policies.map(
                (p) => html`<div class="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                  <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0"><h4 class="text-xs font-bold text-slate-800">${p.policy_type || 'Policy'}</h4><p class="text-[11px] text-slate-500 font-mono mt-0.5">${[p.provider_name, p.policy_number].filter(Boolean).join(' • ') || '—'}</p></div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">${p.status.toUpperCase()}</span>
                  </div>
                  <div class="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-xs">
                    <div><span class="text-[10px] text-slate-400 block">Sum assured</span><span class="font-bold text-slate-700 font-mono">${formatZAR(p.sum_assured)}</span></div>
                    <div><span class="text-[10px] text-slate-400 block">Premium</span><span class="font-bold text-slate-700 font-mono">${formatZAR(p.premium)}/${p.premium_frequency === 'annually' ? 'yr' : 'mo'}</span></div>
                    <div><span class="text-[10px] text-slate-400 block">Renewal</span><span class="font-bold text-slate-700">${formatDate(p.renewal_date)}</span></div>
                  </div>
                </div>`
              )}
            </div>
          </div>`
        : ''}

      ${summary.investments.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div class="flex items-center justify-between mb-3"><h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Investment portfolios</h3><span class="text-xs font-semibold text-slate-500">${summary.investments.length}</span></div>
            <div class="space-y-3">
              ${summary.investments.map(
                (inv) => html`<div class="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
                  <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0"><h4 class="text-xs font-bold text-slate-800">${inv.investment_name}</h4><p class="text-[11px] text-slate-500 font-mono mt-0.5">${[inv.provider_name, inv.account_number].filter(Boolean).join(' • ') || '—'}</p></div>
                    <span class="text-xs font-bold text-slate-900 font-mono shrink-0">${formatZAR(inv.current_value)}</span>
                  </div>
                  ${Number(inv.monthly_contribution) > 0 ? html`<div class="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">Monthly contribution: <strong class="font-mono text-slate-700">${formatZAR(inv.monthly_contribution)}</strong></div>` : ''}
                </div>`
              )}
            </div>
          </div>`
        : ''}

      ${beneficiaries.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Beneficiary nominations</h3>
            <p class="text-[11px] text-slate-400 mb-3">To change these, submit a "Beneficiary Nomination Update" request.</p>
            <div class="space-y-2">
              ${beneficiaries.map((b) => html`<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"><div><span class="font-bold text-slate-800">${b.full_name}</span><span class="text-[11px] text-slate-500 block">${b.relationship || ''}</span></div><span class="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full font-mono text-xs">${b.percentage ?? 0}%</span></div>`)}
            </div>
          </div>`
        : ''}

      ${dependants.length > 0
        ? html`<div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Dependants</h3>
            <div class="space-y-2">
              ${dependants.map((d) => html`<div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"><span class="font-bold text-slate-800">${d.full_name}</span><span class="text-[11px] text-slate-500">${d.relationship || ''}</span></div>`)}
            </div>
          </div>`
        : ''}
    </div>
  `;
}
