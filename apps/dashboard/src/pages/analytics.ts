import { adviserService } from '../services/adviser';
import { formatCurrencyZAR } from '../utils/formatters';

export function renderDashboardAnalyticsPage(): string {
  const kpis = adviserService.getKPIs();

  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-base font-bold text-slate-900">Practice Performance & Wealth Analytics</h2>
        <p class="text-xs text-slate-500">Asset distribution, client retention, claims loss ratios, and SLA turnaround</p>
      </div>

      <!-- Top Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-400 uppercase font-semibold">Total Practice AUM</span>
          <h3 class="text-2xl font-bold text-slate-900 font-mono mt-1">${formatCurrencyZAR(kpis.totalAUM)}</h3>
          <span class="text-emerald-600 font-bold text-xs mt-1 block">↗ 14.2% annualized</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-400 uppercase font-semibold">Average SLA Turnaround</span>
          <h3 class="text-2xl font-bold text-slate-900 font-mono mt-1">1.8 Days</h3>
          <span class="text-emerald-600 font-bold text-xs mt-1 block">Target: ≤ 3.0 Days</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-400 uppercase font-semibold">Client Retention Rate</span>
          <h3 class="text-2xl font-bold text-slate-900 font-mono mt-1">98.9%</h3>
          <span class="text-emerald-600 font-bold text-xs mt-1 block">Top Decile in SA</span>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs text-slate-400 uppercase font-semibold">Claims Approval Rate</span>
          <h3 class="text-2xl font-bold text-slate-900 font-mono mt-1">96.4%</h3>
          <span class="text-emerald-600 font-bold text-xs mt-1 block">R 450k settled YTD</span>
        </div>
      </div>

      <!-- Distribution Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">AUM Allocation by Asset Manager</h3>
          
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-800">Allan Gray Balanced & Equity</span>
                <span class="font-mono font-bold text-slate-900">58% (${formatCurrencyZAR(kpis.totalAUM * 0.58)})</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5">
                <div class="bg-[#0A192F] h-2.5 rounded-full" style="width: 58%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-800">Old Mutual Wealth & Offshore</span>
                <span class="font-mono font-bold text-slate-900">32% (${formatCurrencyZAR(kpis.totalAUM * 0.32)})</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5">
                <div class="bg-amber-500 h-2.5 rounded-full" style="width: 32%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-slate-800">Direct Cash & Money Market</span>
                <span class="font-mono font-bold text-slate-900">10% (${formatCurrencyZAR(kpis.totalAUM * 0.1)})</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5">
                <div class="bg-slate-400 h-2.5 rounded-full" style="width: 10%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Requests Turnaround by Category</h3>
          
          <div class="space-y-3 text-xs">
            <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span class="font-semibold text-slate-800">Cross-Border Vehicle Clearance Letter</span>
              <span class="font-mono font-bold text-emerald-700">0.8 Days</span>
            </div>
            <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span class="font-semibold text-slate-800">IRPS Tax Certificate / Assessment</span>
              <span class="font-mono font-bold text-emerald-700">1.2 Days</span>
            </div>
            <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span class="font-semibold text-slate-800">Policy Beneficiary Nomination Update</span>
              <span class="font-mono font-bold text-amber-700">2.1 Days</span>
            </div>
            <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
              <span class="font-semibold text-slate-800">Investment Portfolio Reallocation</span>
              <span class="font-mono font-bold text-amber-700">2.4 Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
