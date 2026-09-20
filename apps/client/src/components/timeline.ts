import { html, relativeTime, type SafeHtml } from '@shared/index';
import type { ClaimTimeline } from '@shared/types/claim';

export function renderClaimTimeline(items: ClaimTimeline[]): SafeHtml {
  if (!items || items.length === 0) {
    return html`<p class="rsc-muted py-3">No updates yet. Your adviser will post progress here.</p>`;
  }

  return html`
    <ol class="relative">
      ${items.map(
        (item, index) => html`
          <li class="relative pl-6 ${index === items.length - 1 ? '' : 'pb-5'}">
            ${index === items.length - 1 ? '' : html`<span class="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" aria-hidden="true"></span>`}
            <span class="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full ${index === 0 ? 'bg-[#0A192F]' : 'bg-white border-2 border-slate-300'}" aria-hidden="true"></span>
            <div class="flex items-start justify-between gap-3">
              <span class="text-[13px] font-semibold text-slate-900">${item.title}</span>
              <span class="text-[11px] text-slate-400 shrink-0 pt-0.5">${relativeTime(item.created_at)}</span>
            </div>
            ${item.description ? html`<p class="rsc-text mt-0.5">${item.description}</p>` : ''}
          </li>`
      )}
    </ol>
  `;
}
