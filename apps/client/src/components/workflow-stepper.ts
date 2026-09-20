import { html, type SafeHtml } from '@shared/index';
import type { RequestWorkflow } from '@shared/types/workflow';
import { icon } from './icons';

export function renderWorkflowStepper(workflows: RequestWorkflow[]): SafeHtml {
  if (!workflows || workflows.length === 0) return html``;

  const sorted = [...workflows].sort((a, b) => a.step_number - b.step_number);

  return html`
    <ol class="grid gap-2 mt-3" style="grid-template-columns: repeat(${sorted.length}, minmax(0, 1fr))">
      ${sorted.map((step) => {
        const done = step.status === 'completed';
        const current = step.status === 'in_progress';
        const dot = done ? 'bg-[#0A192F] text-white' : current ? 'bg-white text-[#0A192F] border-2 border-[#0A192F]' : 'bg-white text-slate-400 border border-slate-300';
        return html`
          <li class="flex flex-col items-center text-center gap-1.5">
            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${dot}">${done ? icon('check', 'w-3.5 h-3.5', 3) : step.step_number}</span>
            <span class="text-[11px] leading-tight ${current ? 'font-semibold text-slate-900' : done ? 'font-medium text-slate-700' : 'text-slate-400'}">${step.step_name}</span>
          </li>`;
      })}
    </ol>
  `;
}
