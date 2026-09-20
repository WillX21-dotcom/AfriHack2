import { formatDate, formatZAR, html, titleCase, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';
import { clientService } from '../services/client';

/** One labelled line inside a card: name and detail on the left, an amount or status on the right. */
function line(primary: string, secondary: string, value: SafeHtml | string): SafeHtml {
  return html`
    <div class="flex items-center justify-between gap-3 py-3">
      <div class="min-w-0">
        <p class="text-[13px] font-medium text-slate-900 truncate">${primary}</p>
        ${secondary ? html`<p class="rsc-muted truncate">${secondary}</p>` : ''}
      </div>
      <div class="text-[13px] font-semibold text-slate-900 rsc-num shrink-0">${value}</div>
    </div>`;
}

function panel(title: string, body: SafeHtml, count?: number): SafeHtml {
  return html`
    <section class="rsc-card">
      <div class="flex items-center justify-between px-4 pt-4"><h3 class="rsc-eyebrow">${title}</h3>${count !== undefined ? html`<span class="rsc-muted">${count}</span>` : ''}</div>
      <div class="px-4 pb-1 divide-y divide-slate-100">${body}</div>
    </section>`;
}

export function renderFinancialOverviewPage(): SafeHtml {
  const summary = financialService.getSummary();
  const client = clientService.getCurrentClient();
  const beneficiaries = client ? clientService.getBeneficiaries(client.id) : [];
  const dependants = client ? clientService.getDependants(client.id) : [];

  if (!summary.hasFinancialData && beneficiaries.length === 0 && dependants.length === 0) {
    return html`
      <div class="rsc-card px-6 py-10 text-center">
        <h2 class="rsc-heading">Your financial picture is being prepared</h2>
        <p class="rsc-muted max-w-sm mx-auto mt-1.5">Your adviser captures your assets, liabilities, policies and investments after your onboarding conversation. They will appear here automatically.</p>
        <button data-nav="messages" class="rsc-btn rsc-btn-primary rsc-btn-sm mt-5">Message your adviser</button>
      </div>`;
  }

  const cashflow = summary.totalMonthlyIncome - summary.totalMonthlyExpenses;

  return html`
    <div class="space-y-4 pb-4">
      <section class="rsc-card p-5">
        <p class="rsc-eyebrow">Net worth</p>
        <p class="rsc-num text-[28px] leading-tight font-semibold text-slate-900 mt-1.5">${formatZAR(summary.netWorth)}</p>
        <div class="grid grid-cols-3 gap-3 mt-4 pt-4 rsc-divider">
          <div><p class="rsc-muted">Assets</p><p class="rsc-num text-[13px] font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalAssets)}</p></div>
          <div><p class="rsc-muted">Investments</p><p class="rsc-num text-[13px] font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalInvestments)}</p></div>
          <div><p class="rsc-muted">Liabilities</p><p class="rsc-num text-[13px] font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalLiabilities)}</p></div>
        </div>
      </section>

      ${summary.income.length + summary.expenses.length > 0
        ? html`<section class="rsc-card p-4">
            <h3 class="rsc-eyebrow">Monthly cash flow</h3>
            <div class="grid grid-cols-3 gap-3 mt-3">
              <div><p class="rsc-muted">Income</p><p class="rsc-num text-[13px] font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalMonthlyIncome)}</p></div>
              <div><p class="rsc-muted">Expenses</p><p class="rsc-num text-[13px] font-semibold text-slate-900 mt-0.5">${formatZAR(summary.totalMonthlyExpenses)}</p></div>
              <div><p class="rsc-muted">Surplus</p><p class="rsc-num text-[13px] font-semibold mt-0.5 ${cashflow < 0 ? 'text-red-700' : 'text-emerald-700'}">${formatZAR(cashflow)}</p></div>
            </div>
          </section>`
        : ''}

      ${summary.assets.length + summary.liabilities.length > 0
        ? panel(
            'Assets and liabilities',
            html`${summary.assets.map((a) => line(a.name, `${titleCase(a.asset_type)}${a.institution ? ` · ${a.institution}` : ''}`, formatZAR(a.current_value)))}
              ${summary.liabilities.map((l) => line(l.name, `${titleCase(l.liability_type)}${l.institution ? ` · ${l.institution}` : ''}`, html`<span class="text-red-700">-${formatZAR(l.outstanding_balance)}</span>`))}`
          )
        : ''}

      ${summary.policies.length > 0
        ? panel(
            'In-force policies',
            html`${summary.policies.map(
              (p) => html`<div class="py-3">
                <div class="flex justify-between items-start gap-3">
                  <div class="min-w-0"><p class="text-[13px] font-medium text-slate-900">${p.policy_type || 'Policy'}</p><p class="rsc-muted">${[p.provider_name, p.policy_number].filter(Boolean).join(' · ') || '—'}</p></div>
                  <span class="rsc-badge ${p.status === 'active' ? 'rsc-badge-green' : 'rsc-badge-slate'}">${titleCase(p.status)}</span>
                </div>
                <div class="grid grid-cols-3 gap-3 mt-2.5">
                  <div><p class="rsc-muted">Sum assured</p><p class="rsc-num text-[13px] font-medium text-slate-800">${formatZAR(p.sum_assured)}</p></div>
                  <div><p class="rsc-muted">Premium</p><p class="rsc-num text-[13px] font-medium text-slate-800">${formatZAR(p.premium)}/${p.premium_frequency === 'annually' ? 'yr' : 'mo'}</p></div>
                  <div><p class="rsc-muted">Renewal</p><p class="text-[13px] font-medium text-slate-800">${formatDate(p.renewal_date)}</p></div>
                </div>
              </div>`
            )}`,
            summary.policies.length
          )
        : ''}

      ${summary.investments.length > 0
        ? panel(
            'Investment portfolios',
            html`${summary.investments.map(
              (inv) => html`<div class="py-3">
                <div class="flex justify-between items-start gap-3">
                  <div class="min-w-0"><p class="text-[13px] font-medium text-slate-900">${inv.investment_name}</p><p class="rsc-muted">${[inv.provider_name, inv.account_number].filter(Boolean).join(' · ') || '—'}</p></div>
                  <span class="rsc-num text-[13px] font-semibold text-slate-900 shrink-0">${formatZAR(inv.current_value)}</span>
                </div>
                ${Number(inv.monthly_contribution) > 0 ? html`<p class="rsc-muted mt-1.5">Monthly contribution <span class="rsc-num font-semibold text-slate-800">${formatZAR(inv.monthly_contribution)}</span></p>` : ''}
              </div>`
            )}`,
            summary.investments.length
          )
        : ''}

      ${beneficiaries.length > 0
        ? html`<section class="rsc-card">
            <div class="px-4 pt-4"><h3 class="rsc-eyebrow">Beneficiary nominations</h3><p class="rsc-muted mt-1">To change these, submit a "Beneficiary Nomination Update" request.</p></div>
            <div class="px-4 pb-1 divide-y divide-slate-100 mt-1">${beneficiaries.map((b) => line(b.full_name, b.relationship || '', `${b.percentage ?? 0}%`))}</div>
          </section>`
        : ''}

      ${dependants.length > 0
        ? panel('Dependants', html`${dependants.map((d) => line(d.full_name, d.relationship || '', ''))}`)
        : ''}
    </div>
  `;
}
