export function renderEmptyState(title: string, description: string, actionLabel?: string, actionAttr?: string): string {
  return `
    <div class="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs my-4">
      <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
      </div>
      <h3 class="text-sm font-semibold text-slate-800">${title}</h3>
      <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">${description}</p>
      ${
        actionLabel && actionAttr
          ? `<button ${actionAttr} class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 shadow-xs transition-all">
              ${actionLabel}
            </button>`
          : ''
      }
    </div>
  `;
}
