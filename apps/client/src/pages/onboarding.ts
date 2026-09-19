export function renderOnboardingPage(): string {
  return `
    <div class="space-y-4 pb-24">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Onboarding Checklist</span>
        <h2 class="text-base font-bold text-slate-900 mt-1">Welcome to Royal Square Financial</h2>
        <p class="text-xs text-slate-500 mt-1">Your advisory mandate and private wealth onboarding steps.</p>

        <div class="space-y-3 mt-4">
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
            <span class="font-medium text-emerald-900">1. POPIA Data Processing Consent</span>
            <span class="text-emerald-700 font-bold">✓ Signed</span>
          </div>
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
            <span class="font-medium text-emerald-900">2. FICA Smart ID & Proof of Residence</span>
            <span class="text-emerald-700 font-bold">✓ Verified</span>
          </div>
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
            <span class="font-medium text-emerald-900">3. Risk Profile & Asset Survey</span>
            <span class="text-emerald-700 font-bold">✓ Completed</span>
          </div>
          <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
            <span class="font-medium text-blue-900">4. Designated Adviser Assigned</span>
            <span class="text-blue-700 font-bold">Kagiso Mabena</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
