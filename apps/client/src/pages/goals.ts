import { formatDate, formatZAR, html, titleCase, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';
import { icon } from '../components/icons';

const GOAL_TYPES = ['retirement', 'property', 'vehicle', 'education', 'emergency_fund', 'travel', 'investment', 'business', 'other'];

export function renderGoalsPage(): SafeHtml {
  const { goals } = financialService.getSummary();

  return html`
    <div class="space-y-5 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="rsc-title">Goals</h2>
          <p class="rsc-subtitle mt-0.5">Your adviser can see these and plan around them</p>
        </div>
        <button id="open-add-goal-btn" class="rsc-btn rsc-btn-primary rsc-btn-sm shrink-0">${icon('plus', 'w-4 h-4', 2.25)}New goal</button>
      </div>

      <form id="add-goal-form" class="hidden rsc-card p-4 space-y-3">
        <h3 class="rsc-heading">Create a financial goal</h3>
        <div>
          <label class="rsc-label" for="goal-name-input">Goal name</label>
          <input id="goal-name-input" required type="text" placeholder="e.g. Coastal holiday home" class="rsc-input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="rsc-label" for="goal-type-input">Type</label>
            <select id="goal-type-input" class="rsc-input">
              ${GOAL_TYPES.map((t) => html`<option value="${t}" ${t === 'other' ? 'selected' : ''}>${titleCase(t)}</option>`)}
            </select>
          </div>
          <div>
            <label class="rsc-label" for="goal-date-input">Target date</label>
            <input id="goal-date-input" type="date" class="rsc-input" />
          </div>
          <div>
            <label class="rsc-label" for="goal-target-input">Target (ZAR)</label>
            <input id="goal-target-input" required type="number" min="1" step="any" inputmode="decimal" class="rsc-input" />
          </div>
          <div>
            <label class="rsc-label" for="goal-current-input">Saved so far (ZAR)</label>
            <input id="goal-current-input" type="number" min="0" step="any" inputmode="decimal" value="0" class="rsc-input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="cancel-add-goal-btn" class="rsc-btn rsc-btn-secondary rsc-btn-sm">Cancel</button>
          <button type="submit" class="rsc-btn rsc-btn-primary rsc-btn-sm">Save goal</button>
        </div>
      </form>

      ${goals.length === 0
        ? html`<div class="rsc-card px-6 py-10 text-center"><h3 class="rsc-heading">No goals yet</h3><p class="rsc-muted mt-1.5">Add one to start tracking your progress.</p></div>`
        : html`<div class="space-y-3">
            ${goals.map((goal) => {
              const pct = Number(goal.target_amount) > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0;
              return html`<div class="rsc-card p-4">
                <div class="flex justify-between items-start gap-3">
                  <div class="min-w-0">
                    <p class="rsc-muted">${titleCase(goal.goal_type)}</p>
                    <h3 class="rsc-heading mt-0.5">${goal.name}</h3>
                    ${goal.description ? html`<p class="rsc-muted mt-0.5">${goal.description}</p>` : ''}
                  </div>
                  <span class="rsc-num text-sm font-semibold text-slate-900 shrink-0">${pct}%</span>
                </div>
                <div class="rsc-progress my-3"><span style="width: ${pct}%"></span></div>
                <div class="grid grid-cols-3 gap-3">
                  <div><p class="rsc-muted">Saved</p><p class="rsc-num text-[13px] font-semibold text-slate-900">${formatZAR(goal.current_amount)}</p></div>
                  <div><p class="rsc-muted">Target date</p><p class="text-[13px] font-medium text-slate-800">${formatDate(goal.target_date)}</p></div>
                  <div class="text-right"><p class="rsc-muted">Target</p><p class="rsc-num text-[13px] font-semibold text-slate-900">${formatZAR(goal.target_amount)}</p></div>
                </div>
                <div class="flex items-center justify-between gap-2 mt-3 pt-3 rsc-divider">
                  <form data-goal-progress-form="${goal.id}" class="flex items-center gap-2">
                    <input name="amount" type="number" min="0" step="any" inputmode="decimal" value="${goal.current_amount}" aria-label="Amount saved" class="rsc-input !w-28 !py-1.5 !text-[13px] rsc-num" />
                    <button type="submit" class="rsc-btn rsc-btn-secondary rsc-btn-sm">Update</button>
                  </form>
                  <button data-action="remove-goal" data-id="${goal.id}" class="rsc-btn rsc-btn-quiet rsc-btn-sm !text-red-700">Remove</button>
                </div>
              </div>`;
            })}
          </div>`}
    </div>
  `;
}
