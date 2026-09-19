import { financialService } from '../services/financial';
import { formatCurrencyZAR } from '../utils/formatters';
import { formatSimpleDate } from '../utils/date';

export function renderGoalsPage(): string {
  const summary = financialService.getSummary();

  return `
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Life Goals & Milestones</h2>
          <p class="text-xs text-slate-500">Track target wealth achievements with your adviser</p>
        </div>
        <button id="open-add-goal-btn" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs">
          + New Goal
        </button>
      </div>

      <!-- Add Goal Modal / Form Inline if active -->
      <div id="add-goal-form" class="hidden bg-white p-4 rounded-2xl border border-amber-300 shadow-md">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Create New Financial Goal</h3>
        <div class="space-y-2.5">
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1">Goal Name</label>
            <input id="goal-name-input" type="text" placeholder="e.g. Coastal Holiday Home" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Target (ZAR)</label>
              <input id="goal-target-input" type="number" placeholder="2500000" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Target Date</label>
              <input id="goal-date-input" type="date" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div class="flex justify-end space-x-2 pt-2">
            <button id="cancel-add-goal-btn" class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
            <button id="save-new-goal-btn" class="px-4 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl shadow-xs">Save Milestone</button>
          </div>
        </div>
      </div>

      <!-- Goal Cards List -->
      <div class="space-y-3">
        ${summary.goals
          .map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return `
            <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">${goal.goal_type}</span>
                  <h3 class="text-sm font-bold text-slate-800 mt-0.5">${goal.name}</h3>
                  ${goal.description ? `<p class="text-xs text-slate-500 mt-0.5">${goal.description}</p>` : ''}
                </div>
                <span class="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200/60 font-mono">
                  ${pct}% Achieved
                </span>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-3">
                <div class="bg-gradient-to-r from-[#0A192F] to-amber-500 h-2.5 rounded-full" style="width: ${pct}%"></div>
              </div>

              <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <div>
                  <span class="text-[10px] text-slate-400 block">Accumulated</span>
                  <span class="font-bold text-slate-800 font-mono">${formatCurrencyZAR(goal.current_amount)}</span>
                </div>
                <div class="text-center">
                  <span class="text-[10px] text-slate-400 block">Target Horizon</span>
                  <span class="font-medium text-slate-600">${formatSimpleDate(goal.target_date)}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Required Capital</span>
                  <span class="font-bold text-amber-800 font-mono">${formatCurrencyZAR(goal.target_amount)}</span>
                </div>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}
