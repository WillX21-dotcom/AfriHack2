export function renderDashboardOverviewPage(): string {
  return `
    <div class="space-y-6">
      <!-- Welcome Header matching Screenshot 1 -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Good morning, Adviser</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Here's what's happening with your clients today.</p>
        </div>
        <div class="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shadow-2xs">
          Tue, 29 Apr 2026
        </div>
      </div>

      <!-- 4 Metric Cards matching Screenshot 1 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Active Clients -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
          <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-500">Active Clients</p>
            <h3 class="text-2xl font-bold text-slate-900 mt-1">48</h3>
            <p class="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center space-x-1">
              <span>↑ 12%</span>
              <span class="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>
        </div>

        <!-- Open Requests -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
          <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-500">Open Requests</p>
            <h3 class="text-2xl font-bold text-slate-900 mt-1">12</h3>
            <p class="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center space-x-1">
              <span>↑ 3%</span>
              <span class="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>
        </div>

        <!-- Active Claims -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
          <div class="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-500">Active Claims</p>
            <h3 class="text-2xl font-bold text-slate-900 mt-1">4</h3>
            <p class="text-[11px] font-semibold text-red-500 mt-1 flex items-center space-x-1">
              <span>↓ 20%</span>
              <span class="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>
        </div>

        <!-- Tasks Due -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-slate-500">Tasks Due</p>
            <h3 class="text-2xl font-bold text-slate-900 mt-1">7</h3>
            <p class="text-[11px] font-semibold text-red-500 mt-1 flex items-center space-x-1">
              <span>↓ 42%</span>
              <span class="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Middle Section: Client Service Queue (Left) & Financial Overview (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Client Service Queue (7 Cols) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-sm text-slate-900">Client Service Queue</h3>
              <button data-dash-nav="requests" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <span>View all requests</span>
                <span>→</span>
              </button>
            </div>

            <!-- Table with horizontal scroll container for mobile/tablet -->
            <div class="overflow-x-auto -mx-5 px-5">
              <table class="w-full text-left text-xs whitespace-nowrap min-w-[520px]">
                <thead>
                  <tr class="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                    <th class="pb-3 font-medium">Client</th>
                    <th class="pb-3 font-medium">Request Type</th>
                    <th class="pb-3 font-medium">Priority</th>
                    <th class="pb-3 font-medium">Status</th>
                    <th class="pb-3 font-medium text-right">Last Update</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <!-- Row 1 -->
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          TM
                        </div>
                        <span class="font-semibold text-slate-900">Thando Mokoena</span>
                      </div>
                    </td>
                    <td class="py-3 text-slate-600">Policy Update</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">High</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">In Progress</span>
                    </td>
                    <td class="py-3 text-right text-slate-400 font-medium">2h ago</td>
                  </tr>

                  <!-- Row 2 -->
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          NP
                        </div>
                        <span class="font-semibold text-slate-900">Nandi Patel</span>
                      </div>
                    </td>
                    <td class="py-3 text-slate-600">Claim Assistance</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">High</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Pending</span>
                    </td>
                    <td class="py-3 text-right text-slate-400 font-medium">4h ago</td>
                  </tr>

                  <!-- Row 3 -->
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          KL
                        </div>
                        <span class="font-semibold text-slate-900">Kabelo Langa</span>
                      </div>
                    </td>
                    <td class="py-3 text-slate-600">Investment Query</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Medium</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">Assigned</span>
                    </td>
                    <td class="py-3 text-right text-slate-400 font-medium">6h ago</td>
                  </tr>

                  <!-- Row 4 -->
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          SB
                        </div>
                        <span class="font-semibold text-slate-900">Sarah Botha</span>
                      </div>
                    </td>
                    <td class="py-3 text-slate-600">Document Request</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Medium</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">In Progress</span>
                    </td>
                    <td class="py-3 text-right text-slate-400 font-medium">8h ago</td>
                  </tr>

                  <!-- Row 5 -->
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3">
                      <div class="flex items-center space-x-2.5">
                        <div class="w-7 h-7 rounded-full bg-[#0A192F] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          JT
                        </div>
                        <span class="font-semibold text-slate-900">Jason Taylor</span>
                      </div>
                    </td>
                    <td class="py-3 text-slate-600">Benefit Enquiry</td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Low</span>
                    </td>
                    <td class="py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Completed</span>
                    </td>
                    <td class="py-3 text-right text-slate-400 font-medium">1d ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Financial Overview (5 Cols) -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-sm text-slate-900">Financial Overview</h3>
            </div>
            <div class="mb-4">
              <p class="text-[11px] font-medium text-slate-500">Net Worth</p>
              <div class="flex items-center space-x-2 mt-0.5">
                <span class="text-xl font-bold text-slate-900 font-mono">R 4,250,000</span>
                <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">↑ 8% vs last quarter</span>
              </div>
            </div>

            <!-- Responsive SVG Area & Line Chart matching Screenshot 1 -->
            <div class="w-full h-44 relative">
              <svg class="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="royalChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <!-- Grid lines -->
                <line x1="40" y1="20" x2="390" y2="20" stroke="#F1F5F9" stroke-width="1" />
                <line x1="40" y1="50" x2="390" y2="50" stroke="#F1F5F9" stroke-width="1" />
                <line x1="40" y1="80" x2="390" y2="80" stroke="#F1F5F9" stroke-width="1" />
                <line x1="40" y1="110" x2="390" y2="110" stroke="#F1F5F9" stroke-width="1" />
                <line x1="40" y1="140" x2="390" y2="140" stroke="#E2E8F0" stroke-width="1" />

                <!-- Y-Labels -->
                <text x="5" y="24" font-size="9" fill="#94A3B8">5.0M</text>
                <text x="5" y="54" font-size="9" fill="#94A3B8">4.0M</text>
                <text x="5" y="84" font-size="9" fill="#94A3B8">3.0M</text>
                <text x="5" y="114" font-size="9" fill="#94A3B8">2.0M</text>
                <text x="5" y="144" font-size="9" fill="#94A3B8">1.0M</text>

                <!-- Area Fill -->
                <polygon points="50,110 110,95 170,90 230,95 290,75 350,60 380,45 380,140 50,140" fill="url(#royalChartGrad)" />

                <!-- Line -->
                <polyline points="50,110 110,95 170,90 230,95 290,75 350,60 380,45" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

                <!-- Data Dots -->
                <circle cx="50" cy="110" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="110" cy="95" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="170" cy="90" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="230" cy="95" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="290" cy="75" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="350" cy="60" r="3" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5" />
                <circle cx="380" cy="45" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" />
              </svg>

              <!-- X-Axis Labels -->
              <div class="flex justify-between pl-10 pr-2 text-[10px] text-slate-400 mt-1">
                <span>Nov</span>
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
              </div>
            </div>
          </div>

          <!-- Bottom Breakdown Cards -->
          <div class="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p class="text-[11px] text-slate-500 font-medium">Assets</p>
              <p class="text-sm font-bold text-slate-900 mt-0.5 font-mono">R 6,800,000</p>
              <p class="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 10%</p>
            </div>
            <div class="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p class="text-[11px] text-slate-500 font-medium">Liabilities</p>
              <p class="text-sm font-bold text-slate-900 mt-0.5 font-mono">R 2,550,000</p>
              <p class="text-[10px] text-emerald-600 font-semibold mt-0.5">↓ 6%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Section: Active Motor Claim (Left) & Recent Notifications (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Active Motor Claim (7 Cols) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900">Active Motor Claim</h3>
            </div>
            <button data-dash-nav="claims" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View all claims</span>
              <span>→</span>
            </button>
          </div>

          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-sm text-slate-900 font-mono">RS-CLM-2026-0012</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">In Progress</span>
            </div>

            <div class="text-xs text-slate-600 space-y-0.5">
              <p><span class="text-slate-400">Client:</span> <strong class="text-slate-800">Thando Mokoena</strong></p>
              <p><span class="text-slate-400">Accident Date:</span> 12 Apr 2026 <span class="text-slate-300 mx-1">|</span> <span class="text-slate-400">Vehicle:</span> Toyota Corolla</p>
            </div>

            <!-- Stepper Container with horizontal scroll on small devices -->
            <div class="pt-4 overflow-x-auto">
              <div class="min-w-[480px] flex items-center justify-between relative px-2">
                <!-- Step 1: Reported -->
                <div class="flex flex-col items-center text-center z-10">
                  <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-blue-50">
                    ✓
                  </div>
                  <span class="text-[11px] font-bold text-slate-900 mt-1.5">Reported</span>
                  <span class="text-[10px] text-slate-400">12 Apr</span>
                </div>

                <!-- Connecting Line 1 (solid blue) -->
                <div class="flex-1 h-0.5 bg-blue-600 -mt-6"></div>

                <!-- Step 2: Assessment -->
                <div class="flex flex-col items-center text-center z-10">
                  <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-blue-50">
                    ✓
                  </div>
                  <span class="text-[11px] font-bold text-slate-900 mt-1.5">Assessment</span>
                  <span class="text-[10px] text-slate-400">14 Apr</span>
                </div>

                <!-- Connecting Line 2 (gold/amber) -->
                <div class="flex-1 h-0.5 bg-amber-400 -mt-6"></div>

                <!-- Step 3: Authorisation (Current) -->
                <div class="flex flex-col items-center text-center z-10">
                  <div class="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[10px] font-bold ring-4 ring-amber-100 animate-pulse">
                    ●
                  </div>
                  <span class="text-[11px] font-bold text-amber-700 mt-1.5">Authorisation</span>
                  <span class="text-[10px] text-amber-600 font-semibold">18 Apr</span>
                </div>

                <!-- Connecting Line 3 (gray) -->
                <div class="flex-1 h-0.5 bg-slate-200 -mt-6"></div>

                <!-- Step 4: Repair -->
                <div class="flex flex-col items-center text-center z-10">
                  <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] ring-4 ring-slate-100">
                    ○
                  </div>
                  <span class="text-[11px] font-medium text-slate-400 mt-1.5">Repair</span>
                  <span class="text-[10px] text-slate-400">Pending</span>
                </div>

                <!-- Connecting Line 4 (gray) -->
                <div class="flex-1 h-0.5 bg-slate-200 -mt-6"></div>

                <!-- Step 5: Completed -->
                <div class="flex flex-col items-center text-center z-10">
                  <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] ring-4 ring-slate-100">
                    ○
                  </div>
                  <span class="text-[11px] font-medium text-slate-400 mt-1.5">Completed</span>
                  <span class="text-[10px] text-slate-400">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Notifications (5 Cols) -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </div>
              <h3 class="font-bold text-sm text-slate-900">Recent Notifications</h3>
            </div>
            <button data-dash-nav="overview" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
              <span>View all</span>
              <span>→</span>
            </button>
          </div>

          <div class="space-y-3">
            <!-- Notification 1 -->
            <div class="flex items-start space-x-3 text-xs">
              <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800 truncate">Claim update: RS-CLM-2026-0012</h4>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">2h ago</span>
                </div>
                <p class="text-slate-500 text-[11px] mt-0.5">Assessment completed. Awaiting authorisation.</p>
              </div>
            </div>

            <!-- Notification 2 -->
            <div class="flex items-start space-x-3 text-xs">
              <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800 truncate">New request submitted</h4>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">4h ago</span>
                </div>
                <p class="text-slate-500 text-[11px] mt-0.5">Thando Mokoena • Policy Update</p>
              </div>
            </div>

            <!-- Notification 3 -->
            <div class="flex items-start space-x-3 text-xs">
              <div class="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800 truncate">Task assigned</h4>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">6h ago</span>
                </div>
                <p class="text-slate-500 text-[11px] mt-0.5">Review client documents • Nandi Patel</p>
              </div>
            </div>

            <!-- Notification 4 -->
            <div class="flex items-start space-x-3 text-xs">
              <div class="w-7 h-7 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800 truncate">Reminder due</h4>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">8h ago</span>
                </div>
                <p class="text-slate-500 text-[11px] mt-0.5">Client meeting with Sarah Botha</p>
              </div>
            </div>

            <!-- Notification 5 -->
            <div class="flex items-start space-x-3 text-xs">
              <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-slate-800 truncate">Document uploaded</h4>
                  <span class="text-[10px] text-slate-400 shrink-0 ml-2">1d ago</span>
                </div>
                <p class="text-slate-500 text-[11px] mt-0.5">Proof of residence • Kabelo Langa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
