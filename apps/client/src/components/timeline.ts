import { ClaimTimeline } from '@shared/types/claim';
import { formatRelativeTime } from '../utils/date';

export function renderClaimTimeline(items: ClaimTimeline[]): string {
  if (!items || items.length === 0) {
    return `<div class="text-sm text-slate-400 py-4 text-center">No timeline updates recorded yet.</div>`;
  }

  return `
    <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      ${items
        .map(
          (item, index) => `
        <div class="relative group">
          <div class="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
            index === 0 ? 'bg-amber-500 border-amber-200 ring-4 ring-amber-100' : 'bg-slate-400 border-white'
          }"></div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-semibold text-slate-800">${item.title}</span>
              <span class="text-slate-400 text-[11px]">${formatRelativeTime(item.created_at)}</span>
            </div>
            ${item.description ? `<p class="text-xs text-slate-600 leading-relaxed">${item.description}</p>` : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}
