import { html, type SafeHtml } from '@shared/index';

export function renderEmptyState(title: string, description: string, action?: { label: string; nav: string }): SafeHtml {
  return html`
    <div class="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <h3 class="text-sm font-semibold text-slate-800">${title}</h3>
      <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">${description}</p>
      ${action
        ? html`<button data-nav="${action.nav}" class="mt-4 px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 shadow-xs transition-all">${action.label}</button>`
        : ''}
    </div>
  `;
}
