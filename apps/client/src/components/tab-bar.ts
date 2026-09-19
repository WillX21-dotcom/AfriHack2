export type ClientTabKey = 'dashboard' | 'financial' | 'requests' | 'claims' | 'profile';

export function renderClientTabBar(activeTab: ClientTabKey): string {
  const tabs = [
    {
      key: 'dashboard',
      label: 'Home',
      icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    },
    {
      key: 'financial',
      label: 'Finances',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`,
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
    },
    {
      key: 'claims',
      label: 'Claims',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
    },
  ];

  return `
    <nav class="bg-white/95 backdrop-blur-md border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-lg">
      <div class="max-w-md sm:max-w-lg mx-auto grid grid-cols-5 gap-1 px-3">
        ${tabs
          .map((tab) => {
            const isActive = tab.key === activeTab;
            return `
            <button
              data-tab="${tab.key}"
              class="flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive ? 'text-amber-600 font-semibold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }"
            >
              <div class="p-1 rounded-lg transition-transform ${isActive ? 'scale-110 text-amber-500' : ''}">
                ${tab.icon}
              </div>
              <span class="text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-amber-600 font-bold' : 'text-slate-400'}">${tab.label}</span>
            </button>
          `;
          })
          .join('')}
      </div>
    </nav>
  `;
}
