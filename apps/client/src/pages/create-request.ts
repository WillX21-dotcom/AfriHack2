import { fullName, html, type SafeHtml } from '@shared/index';
import { REQUEST_TYPES, REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { clientService } from '../services/client';

export function renderCreateRequestPage(presetType?: string): SafeHtml {
  const types = Object.values(REQUEST_TYPES);
  const adviser = clientService.getAdviser();

  const priority = (value: string, label: string, checked = false) => html`
    <label class="flex items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white py-2.5 text-[13px] font-medium text-slate-700 cursor-pointer has-checked:border-[#0A192F] has-checked:bg-slate-50 has-checked:font-semibold has-checked:text-slate-900">
      <input type="radio" name="priority" value="${value}" ${checked ? 'checked' : ''} class="accent-[#0A192F]" />${label}
    </label>`;

  return html`
    <div class="space-y-5 pb-4">
      <div>
        <h2 class="rsc-title">New service request</h2>
        <p class="rsc-subtitle mt-0.5">${adviser ? html`Goes straight to your adviser, <strong class="font-semibold text-slate-800">${fullName(adviser)}</strong>` : 'Goes straight to the Royal Square advisory team'}</p>
      </div>

      <form id="create-request-form" class="rsc-card p-4 space-y-4">
        <div>
          <label class="rsc-label" for="req-type-select">Category</label>
          <select id="req-type-select" class="rsc-input">
            ${types.map((t) => html`<option value="${t}" ${presetType === t ? 'selected' : ''}>${REQUEST_TYPE_LABELS[t as RequestType]}</option>`)}
          </select>
        </div>

        <div>
          <label class="rsc-label" for="req-title-input">Subject</label>
          <input id="req-title-input" required minlength="3" maxlength="140" type="text" placeholder="e.g. Updated policy schedule for my home loan" value="${presetType === 'consultation' ? 'Adviser portfolio review' : ''}" class="rsc-input" />
        </div>

        <div>
          <span class="rsc-label">Priority</span>
          <div class="grid grid-cols-3 gap-2">${priority('low', 'Low')}${priority('normal', 'Standard', true)}${priority('urgent', 'Urgent')}</div>
        </div>

        <div>
          <label class="rsc-label" for="req-desc-input">Details</label>
          <textarea id="req-desc-input" rows="4" maxlength="4000" placeholder="Give as much detail as you can, such as the institution, destination country for a border letter, or any deadline." class="rsc-input"></textarea>
        </div>

        <div>
          <label class="rsc-label" for="req-file-input">Supporting document <span class="font-normal text-slate-400">(optional)</span></label>
          <input id="req-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt,.csv" class="rsc-input" />
        </div>

        <button type="submit" id="submit-request-btn" class="rsc-btn rsc-btn-primary rsc-btn-block">Submit request</button>
      </form>
    </div>
  `;
}
