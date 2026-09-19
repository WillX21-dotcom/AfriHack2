import { fullName, html, type SafeHtml } from '@shared/index';
import { REQUEST_TYPES, REQUEST_TYPE_LABELS, type RequestType } from '@shared/constants/request-types';
import { clientService } from '../services/client';

export function renderCreateRequestPage(presetType?: string): SafeHtml {
  const types = Object.values(REQUEST_TYPES);
  const adviser = clientService.getAdviser();

  return html`
    <div class="space-y-4 pb-24">
      <div>
        <h2 class="text-base font-bold text-slate-900">New service request</h2>
        <p class="text-xs text-slate-500">${adviser ? html`Goes straight to your adviser, <strong>${fullName(adviser)}</strong>` : 'Goes straight to the Royal Square advisory team'}</p>
      </div>

      <form id="create-request-form" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5" for="req-type-select">Category</label>
          <select id="req-type-select" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500">
            ${types.map((t) => html`<option value="${t}" ${presetType === t ? 'selected' : ''}>${REQUEST_TYPE_LABELS[t as RequestType]}</option>`)}
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5" for="req-title-input">Subject</label>
          <input id="req-title-input" required minlength="3" maxlength="140" type="text" placeholder="e.g. Updated policy schedule for my home loan" value="${presetType === 'consultation' ? 'Adviser portfolio review' : ''}" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <span class="text-xs font-semibold text-slate-700 block mb-1.5">Priority</span>
          <div class="grid grid-cols-3 gap-2">
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-slate-800 has-checked:bg-slate-50"><input type="radio" name="priority" value="low" /><span class="text-xs font-medium text-slate-700">Low</span></label>
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-amber-600 has-checked:bg-amber-50"><input type="radio" name="priority" value="normal" checked /><span class="text-xs font-semibold text-amber-900">Standard</span></label>
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-rose-600 has-checked:bg-rose-50"><input type="radio" name="priority" value="urgent" /><span class="text-xs font-bold text-rose-800">Urgent</span></label>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5" for="req-desc-input">Details</label>
          <textarea id="req-desc-input" rows="4" maxlength="4000" placeholder="Give as much detail as you can, such as the institution, destination country for a border letter, or any deadline." class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"></textarea>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5" for="req-file-input">Supporting document (optional)</label>
          <input id="req-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt,.csv" class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0A192F] file:text-amber-300" />
        </div>

        <button type="submit" id="submit-request-btn" class="w-full py-3 bg-[#0A192F] hover:bg-slate-800 disabled:opacity-60 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-md">Submit request →</button>
      </form>
    </div>
  `;
}
