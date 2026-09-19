import { formatDate, formatZAR, html, titleCase, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';

const GOAL_TYPES = ['retirement', 'property', 'vehicle', 'education', 'emergency_fund', 'travel', 'investment', 'business', 'other'];

export function renderGoalsPage(): SafeHtml {
  const { goals } = financialService.getSummary();

  return html`
    <div class="space-y-4 pb-24">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Life goals and milestones</h2>
          <p class="text-xs text-slate-500">Your adviser can see these and plan around them</p>
        </div>
        <button id="open-add-goal-btn" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs">+ New goal</button>
      </div>

      <form id="add-goal-form" class="hidden bg-white p-4 rounded-2xl border border-amber-300 shadow-md space-y-2.5">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Create a financial goal</h3>
        <div>
          <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="goal-name-input">Goal name</label>
          <input id="goal-name-input" required type="text" placeholder="e.g. Coastal holiday home" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="goal-type-input">Type</label>
            <select id="goal-type-input" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${GOAL_TYPES.map((t) => html`<option value="${t}" ${t === 'other' ? 'selected' : ''}>${titleCase(t)}</option>`)}
            </select>
          </div>
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="goal-date-input">Target date</label>
            <input id="goal-date-input" type="date" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="goal-target-input">Target (ZAR)</label>
            <input id="goal-target-input" required type="number" min="1" step="any" inputmode="decimal" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label class="text-[11px] font-semibold text-slate-600 block mb-1" for="goal-current-input">Saved so far (ZAR)</label>
            <input id="goal-current-input" type="number" min="0" step="any" inputmode="decimal" value="0" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
        </div>
        <div class="flex justify-end space-x-2 pt-1">
          <button type="button" id="cancel-add-goal-btn" class="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
          <button type="submit" class="px-4 py-1.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl shadow-xs">Save goal</button>
        </div>
      </form>

      ${goals.length === 0
        ? html`<div class="p-8 text-center bg-white rounded-2xl border border-slate-200"><p class="text-xs text-slate-400">No goals yet. Add one to start tracking your progress.</p></div>`
        : html`<div class="space-y-3">
            ${goals.map((goal) => {
              const pct = Number(goal.target_amount) > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0;
              return html`<div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div class="flex justify-between items-start mb-2 gap-2">
                  <div class="min-w-0">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600">${titleCase(goal.goal_type)}</span>
                    <h3 class="text-sm font-bold text-slate-800 mt-0.5">${goal.name}</h3>
                    ${goal.description ? html`<p class="text-xs text-slate-500 mt-0.5">${goal.description}</p>` : ''}
                  </div>
                  <span class="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200/60 font-mono shrink-0">${pct}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-3"><div class="bg-gradient-to-r from-[#0A192F] to-amber-500 h-2.5 rounded-full" style="width: ${pct}%"></div></div>
                <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div><span class="text-[10px] text-slate-400 block">Saved</span><span class="font-bold text-slate-800 font-mono">${formatZAR(goal.current_amount)}</span></div>
                  <div class="text-center"><span class="text-[10px] text-slate-400 block">Target date</span><span class="font-medium text-slate-600">${formatDate(goal.target_date)}</span></div>
                  <div class="text-right"><span class="text-[10px] text-slate-400 block">Target</span><span class="font-bold text-amber-800 font-mono">${formatZAR(goal.target_amount)}</span></div>
                </div>
                <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                  <form data-goal-progress-form="${goal.id}" class="flex items-center gap-2">
                    <input name="amount" type="number" min="0" step="any" inputmode="decimal" value="${goal.current_amount}" aria-label="Amount saved" class="w-28 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono" />
                    <button type="submit" class="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Update saved</button>
                  </form>
                  <button data-action="remove-goal" data-id="${goal.id}" class="text-[11px] font-semibold text-rose-600 hover:text-rose-700">Remove</button>
                </div>
              </div>`;
            })}
          </div>`}
    </div>
  `;
}
