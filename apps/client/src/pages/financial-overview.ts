import { financialService } from '../services/financial';
import { clientService } from '../services/client';
import { formatCurrencyZAR } from '../utils/formatters';

export function renderFinancialOverviewPage(): string {
  const summary = financialService.getSummary();
  const client = clientService.getCurrentClient();
  const dependants = client ? clientService.getDependants(client.id) : [];
  const beneficiaries = client ? clientService.getBeneficiaries(client.id) : [];

  return `
    <div class="space-y-4 pb-24">
      <!-- Net Worth Executive Summary -->
      <div class="bg-[#0A192F] text-white p-5 rounded-2xl shadow-md">
        <span class="text-xs text-amber-300 font-medium tracking-wide uppercase">Consolidated Net Worth</span>
        <h2 class="text-2xl font-bold font-mono text-white mt-1">${formatCurrencyZAR(summary.netWorth)}</h2>
        
        <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
          <div>
            <span class="text-[10px] text-slate-300 uppercase block">Tangible Assets</span>
            <span class="text-xs font-bold text-white font-mono">${formatCurrencyZAR(summary.totalAssets)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-300 uppercase block">Investments</span>
            <span class="text-xs font-bold text-amber-300 font-mono">${formatCurrencyZAR(summary.totalInvestments)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-300 uppercase block">Liabilities</span>
            <span class="text-xs font-bold text-rose-300 font-mono">${formatCurrencyZAR(summary.totalLiabilities)}</span>
          </div>
        </div>
      </div>

      <!-- Cash Flow Strip -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Monthly Cash Flow Dynamic</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl">
            <span class="text-[10px] text-emerald-700 font-semibold uppercase block">Verified Income</span>
            <span class="text-base font-bold text-emerald-900 font-mono">${formatCurrencyZAR(summary.totalMonthlyIncome)}</span>
            <span class="text-[10px] text-emerald-600 block mt-0.5">Salary & Rental</span>
          </div>
          <div class="bg-rose-50/70 border border-rose-100 p-3 rounded-xl">
            <span class="text-[10px] text-rose-700 font-semibold uppercase block">Monthly Outflows</span>
            <span class="text-base font-bold text-rose-900 font-mono">${formatCurrencyZAR(summary.totalMonthlyExpenses)}</span>
            <span class="text-[10px] text-rose-600 block mt-0.5">Bonds, Living & Tuition</span>
          </div>
        </div>
      </div>

      <!-- In-Force Policies Card -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">In-Force Policies</h3>
          <span class="text-xs font-semibold text-slate-500">${summary.policies.length} Policies</span>
        </div>
        <div class="space-y-3">
          ${summary.policies
            .map(
              (p) => `
            <div class="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-xs font-bold text-slate-800">${p.policy_type}</h4>
                  <p class="text-[11px] text-slate-500 font-mono mt-0.5">${p.provider_name} • ${p.policy_number}</p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">ACTIVE</span>
              </div>
              <div class="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">Sum Assured</span>
                  <span class="font-bold text-slate-700 font-mono">${formatCurrencyZAR(p.sum_assured)}</span>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 block">Monthly Premium</span>
                  <span class="font-bold text-slate-700 font-mono">${formatCurrencyZAR(p.premium)}/mo</span>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Managed Investments -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Investment Portfolios</h3>
          <span class="text-xs font-semibold text-slate-500">${summary.investments.length} Portfolios</span>
        </div>
        <div class="space-y-3">
          ${summary.investments
            .map(
              (inv) => `
            <div class="border border-slate-100 rounded-xl p-3 bg-slate-50/60">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-xs font-bold text-slate-800">${inv.investment_name}</h4>
                  <p class="text-[11px] text-slate-500 font-mono mt-0.5">${inv.provider_name} • ${inv.account_number}</p>
                </div>
                <span class="text-xs font-bold text-slate-900 font-mono">${formatCurrencyZAR(inv.current_value)}</span>
              </div>
              <div class="flex justify-between items-center text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                <span>Debit Contribution: <strong class="font-mono text-slate-700">${formatCurrencyZAR(inv.monthly_contribution)}/mo</strong></span>
                <span class="text-emerald-600 font-semibold font-mono">+11.8% YTD</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Beneficiaries & Estate Planning -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Beneficiary Nominations</h3>
        <div class="space-y-2">
          ${beneficiaries
            .map(
              (b) => `
            <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
              <div>
                <span class="font-bold text-slate-800">${b.full_name}</span>
                <span class="text-[11px] text-slate-500 block">${b.relationship}</span>
              </div>
              <span class="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full font-mono text-xs">
                ${b.percentage}%
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
