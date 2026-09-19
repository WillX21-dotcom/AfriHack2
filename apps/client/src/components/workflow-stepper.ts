import { html, type SafeHtml } from '@shared/index';
import type { RequestWorkflow } from '@shared/types/workflow';

export function renderWorkflowStepper(workflows: RequestWorkflow[]): SafeHtml {
  if (!workflows || workflows.length === 0) return html``;

  const sorted = [...workflows].sort((a, b) => a.step_number - b.step_number);

  return html`
    <div class="py-3">
      <div class="relative flex items-center justify-between">
        <div class="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
        ${sorted.map((step) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'in_progress';
          const circle = isDone
            ? 'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-100'
            : isCurrent
            ? 'bg-[#0A192F] text-amber-300 border-[#0A192F] ring-4 ring-amber-100 animate-pulse'
            : 'bg-white text-slate-400 border-slate-300';
          return html`
            <div class="relative z-10 flex flex-col items-center">
              <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${circle}">${isDone ? '✓' : step.step_number}</div>
              <span class="mt-2 text-[11px] font-medium text-slate-700 max-w-[70px] text-center leading-tight">${step.step_name}</span>
            </div>`;
        })}
      </div>
    </div>
  `;
}
