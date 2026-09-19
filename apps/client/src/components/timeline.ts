import { html, relativeTime, type SafeHtml } from '@shared/index';
import type { ClaimTimeline } from '@shared/types/claim';

export function renderClaimTimeline(items: ClaimTimeline[]): SafeHtml {
  if (!items || items.length === 0) {
    return html`<div class="text-sm text-slate-400 py-4 text-center">No updates yet. Your adviser will post progress here.</div>`;
  }

  return html`
    <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      ${items.map(
        (item, index) => html`
        <div class="relative">
          <div class="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${index === 0 ? 'bg-amber-500 border-amber-200 ring-4 ring-amber-100' : 'bg-slate-400 border-white'}"></div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center justify-between text-xs mb-1 gap-2">
              <span class="font-semibold text-slate-800">${item.title}</span>
              <span class="text-slate-400 text-[11px] shrink-0">${relativeTime(item.created_at)}</span>
            </div>
            ${item.description ? html`<p class="text-xs text-slate-600 leading-relaxed">${item.description}</p>` : ''}
          </div>
        </div>`
      )}
    </div>
  `;
}
