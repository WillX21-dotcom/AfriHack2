import { providerService } from '../services/provider-service';

export function renderDashboardProvidersPage(): string {
  const providers = providerService.getProviders();

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-slate-900">Financial Institution & Insurer Gateways</h2>
          <p class="text-xs text-slate-500">Live API integrations with South Africa's leading insurers, asset managers & logistics providers</p>
        </div>
      </div>

      <!-- Provider Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${providers
          .map(
            (p) => `
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] uppercase font-bold text-amber-600 tracking-wider">${p.category}</span>
                <h3 class="text-sm font-bold text-slate-900 mt-0.5">${p.name}</h3>
              </div>
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 animate-ping"></span>
                Operational (${p.lastPingMs}ms)
              </span>
            </div>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div class="flex justify-between text-slate-600">
                <span>Protocol:</span>
                <span class="font-mono font-semibold text-slate-800">${p.apiProtocol}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Last Polled:</span>
                <span class="font-medium text-slate-800">${p.lastSyncTime}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>TLS Cipher:</span>
                <span class="font-mono text-emerald-700 font-semibold">TLS_AES_256_GCM_SHA384</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                data-action="sync-provider"
                data-provider="${p.id}"
                class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
              >
                <span>🔄 Run Full Sync</span>
              </button>
              <button
                data-action="test-webhook"
                data-provider="${p.id}"
                class="py-2 bg-[#0A192F] hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
              >
                <span>⚡ Simulate Webhook</span>
              </button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <!-- Live Webhook Log Simulation -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Live Webhook Inbound Stream</h3>
        <div class="space-y-2 text-xs font-mono">
          <div class="p-2.5 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-between text-[11px]">
            <span>[2025-09-19 11:24:02] POST /api/webhooks/santam - HTTP 200 (Stage: vehicle_ready, Claim: CLM-2025-001)</span>
            <span class="text-slate-400">14ms</span>
          </div>
          <div class="p-2.5 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-between text-[11px]">
            <span>[2025-09-19 10:15:40] POST /api/webhooks/europcar - HTTP 200 (Dispatch ID: EP-9842-SD)</span>
            <span class="text-slate-400">22ms</span>
          </div>
          <div class="p-2.5 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-between text-[11px]">
            <span>[2025-09-19 09:00:12] POST /api/webhooks/allangray - HTTP 200 (Unit Trust NAV Updated)</span>
            <span class="text-slate-400">35ms</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
