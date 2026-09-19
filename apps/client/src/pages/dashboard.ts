export function renderClientDashboardPage(): string {
  return `
    <div class="space-y-4 pb-20 px-4 pt-4 max-w-3xl mx-auto">
      <!-- Welcome Greeting matching Screenshot 2 -->
      <div class="relative flex items-center justify-between pb-1">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Good afternoon, Thato</h2>
          <p class="text-xs sm:text-sm text-slate-500 mt-0.5">Your financial journey, our priority.</p>
        </div>
        <!-- Mountain Silhouette Graphic -->
        <div class="w-20 h-10 opacity-30 pointer-events-none hidden sm:block">
          <svg class="w-full h-full text-slate-500" viewBox="0 0 100 40" fill="currentColor">
            <polygon points="0,40 25,10 50,35 75,5 100,40" />
          </svg>
        </div>
      </div>

      <!-- Net Worth Card matching Screenshot 2 -->
      <div data-nav="financial" class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs cursor-pointer hover:shadow-md transition-all">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3.5">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500">Net Worth</p>
              <div class="flex items-center space-x-2 mt-0.5">
                <span class="text-xl sm:text-2xl font-bold text-slate-900 font-mono">R 2,850,000</span>
                <span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">↑ 8% <span class="hidden xs:inline font-normal text-slate-400">vs last quarter</span></span>
              </div>
            </div>
          </div>
          <div class="text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
      </div>

      <!-- Quick Actions (4 Cards in a row) matching Screenshot 2 -->
      <div>
        <h3 class="text-xs font-bold text-slate-900 mb-2.5">Quick Actions</h3>
        <div class="grid grid-cols-4 gap-2 sm:gap-3">
          <!-- Action 1: Request Service -->
          <button data-nav="create-request" class="bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group">
            <div class="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-800 leading-tight">Request<br/>Service</span>
          </button>

          <!-- Action 2: Report Accident -->
          <button data-nav="report-accident" class="bg-red-50/70 hover:bg-red-100/70 border border-red-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group">
            <div class="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-800 leading-tight">Report<br/>Accident</span>
          </button>

          <!-- Action 3: Documents -->
          <button data-nav="documents" class="bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group">
            <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"></path></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-800 leading-tight">Documents</span>
          </button>

          <!-- Action 4: Contact Adviser -->
          <button data-nav="profile" class="bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group">
            <div class="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <span class="text-[11px] font-semibold text-slate-800 leading-tight">Contact<br/>Adviser</span>
          </button>
        </div>
      </div>

      <!-- Goals Section matching Screenshot 2 -->
      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold text-slate-900">Goals</h3>
          <button data-nav="goals" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View all</span>
            <span>→</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Goal 1: Retirement -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h4 class="text-xs font-bold text-slate-800">Retirement</h4>
              </div>
              <span class="text-xs font-bold text-slate-600 font-mono">60%</span>
            </div>
            <p class="text-xs font-semibold text-slate-900 font-mono">
              R 1,200,000 <span class="text-slate-400 font-normal">/ R 2,000,000</span>
            </p>
            <!-- Progress Bar -->
            <div class="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div class="bg-emerald-500 h-2 rounded-full" style="width: 60%"></div>
            </div>
          </div>

          <!-- Goal 2: Home Purchase -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </div>
                <h4 class="text-xs font-bold text-slate-800">Home Purchase</h4>
              </div>
              <span class="text-xs font-bold text-slate-600 font-mono">30%</span>
            </div>
            <p class="text-xs font-semibold text-slate-900 font-mono">
              R 450,000 <span class="text-slate-400 font-normal">/ R 1,500,000</span>
            </p>
            <!-- Progress Bar -->
            <div class="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div class="bg-blue-500 h-2 rounded-full" style="width: 30%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Requests matching Screenshot 2 -->
      <div>
        <div class="flex items-center justify-between mb-2.5">
          <h3 class="text-xs font-bold text-slate-900">Recent Requests</h3>
          <button data-nav="requests" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1">
            <span>View all</span>
            <span>→</span>
          </button>
        </div>

        <div class="space-y-2">
          <!-- Request 1: Policy Update -->
          <div data-nav="request-detail" data-id="req-001" class="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900">Policy Update</h4>
                <p class="text-[11px] text-slate-400 font-mono">REQ-2026-0045</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">In Progress</span>
              <span class="text-[11px] text-slate-400">2h ago</span>
            </div>
          </div>

          <!-- Request 2: Investment Enquiry -->
          <div data-nav="request-detail" data-id="req-002" class="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900">Investment Enquiry</h4>
                <p class="text-[11px] text-slate-400 font-mono">REQ-2026-0044</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Pending</span>
              <span class="text-[11px] text-slate-400">5h ago</span>
            </div>
          </div>

          <!-- Request 3: Benefit Enquiry -->
          <div data-nav="request-detail" data-id="req-003" class="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer">
            <div class="flex items-center space-x-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900">Benefit Enquiry</h4>
                <p class="text-[11px] text-slate-400 font-mono">REQ-2026-0043</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Completed</span>
              <span class="text-[11px] text-slate-400">1d ago</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Motor Claim matching Screenshot 2 -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div class="flex items-center space-x-2 mb-2">
          <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-9 8h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <h3 class="font-bold text-xs sm:text-sm text-slate-900">Active Motor Claim</h3>
        </div>

        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-xs sm:text-sm text-slate-900 font-mono">RS-CLM-2026-0012</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">In Progress</span>
          </div>

          <p class="text-[11px] text-slate-500">Accident: 12 Apr 2026 <span class="text-slate-300 mx-1">|</span> Toyota Corolla</p>

          <!-- Stepper Container -->
          <div class="pt-3 overflow-x-auto">
            <div class="min-w-[440px] flex items-center justify-between relative px-1">
              <!-- Step 1: Reported -->
              <div class="flex flex-col items-center text-center z-10">
                <div class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <span class="text-[10px] font-bold text-slate-900 mt-1">Reported</span>
                <span class="text-[9px] text-slate-400">12 Apr</span>
              </div>

              <div class="flex-1 h-0.5 bg-blue-600 -mt-5"></div>

              <!-- Step 2: Assessment -->
              <div class="flex flex-col items-center text-center z-10">
                <div class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <span class="text-[10px] font-bold text-slate-900 mt-1">Assessment</span>
                <span class="text-[9px] text-slate-400">14 Apr</span>
              </div>

              <div class="flex-1 h-0.5 bg-amber-400 -mt-5"></div>

              <!-- Step 3: Authorisation (Current) -->
              <div class="flex flex-col items-center text-center z-10">
                <div class="w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[9px] font-bold ring-2 ring-amber-100 animate-pulse">
                  ●
                </div>
                <span class="text-[10px] font-bold text-amber-700 mt-1">Authorisation</span>
                <span class="text-[9px] text-amber-600 font-semibold">18 Apr</span>
              </div>

              <div class="flex-1 h-0.5 bg-slate-200 -mt-5"></div>

              <!-- Step 4: Repair -->
              <div class="flex flex-col items-center text-center z-10">
                <div class="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px]">
                  ○
                </div>
                <span class="text-[10px] font-medium text-slate-400 mt-1">Repair</span>
                <span class="text-[9px] text-slate-400">Pending</span>
              </div>

              <div class="flex-1 h-0.5 bg-slate-200 -mt-5"></div>

              <!-- Step 5: Completed -->
              <div class="flex flex-col items-center text-center z-10">
                <div class="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[9px]">
                  ○
                </div>
                <span class="text-[10px] font-medium text-slate-400 mt-1">Completed</span>
                <span class="text-[9px] text-slate-400">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
