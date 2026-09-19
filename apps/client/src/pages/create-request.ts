import { REQUEST_TYPES, REQUEST_TYPE_LABELS, RequestType } from '@shared/constants/request-types';

export function renderCreateRequestPage(presetType?: string): string {
  const types = Object.values(REQUEST_TYPES);

  return `
    <div class="space-y-4 pb-24">
      <div>
        <h2 class="text-base font-bold text-slate-900">Initiate Advisory Request</h2>
        <p class="text-xs text-slate-500">Fast-tracked to your dedicated adviser Kagiso Mabena</p>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <!-- Request Category -->
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5">Request Category</label>
          <select id="req-type-select" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500">
            ${types
              .map(
                (t) => `
              <option value="${t}" ${presetType === t ? 'selected' : ''}>
                ${REQUEST_TYPE_LABELS[t as RequestType]}
              </option>
            `
              )
              .join('')}
          </select>
        </div>

        <!-- Request Subject / Title -->
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5">Subject / Title</label>
          <input
            id="req-title-input"
            type="text"
            placeholder="e.g. Request updated Discovery policy schedule"
            value="${presetType === 'consultation' ? 'Adviser Portfolio Review Booking' : ''}"
            class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <!-- Priority Selection -->
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5">Priority Level</label>
          <div class="grid grid-cols-3 gap-2">
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-slate-800 has-checked:bg-slate-50">
              <input type="radio" name="priority" value="low" class="text-slate-800 focus:ring-0" />
              <span class="text-xs font-medium text-slate-700">Low</span>
            </label>
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-amber-600 has-checked:bg-amber-50">
              <input type="radio" name="priority" value="normal" checked class="text-amber-600 focus:ring-0" />
              <span class="text-xs font-semibold text-amber-900">Standard</span>
            </label>
            <label class="border border-slate-200 rounded-xl p-2.5 flex items-center justify-center space-x-1.5 cursor-pointer has-checked:border-rose-600 has-checked:bg-rose-50">
              <input type="radio" name="priority" value="urgent" class="text-rose-600 focus:ring-0" />
              <span class="text-xs font-bold text-rose-800">Urgent</span>
            </label>
          </div>
        </div>

        <!-- Description & Specific Instructions -->
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5">Detailed Description & Reason</label>
          <textarea
            id="req-desc-input"
            rows="4"
            placeholder="Please provide specifics (e.g. institution, destination country for border letter, reason for address update, or homeloan deadline)..."
            class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
          ></textarea>
        </div>

        <!-- Supporting Document Attachment -->
        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1.5">Attach Supporting Document (Optional)</label>
          <input
            id="req-file-input"
            type="file"
            class="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0A192F] file:text-amber-300 hover:file:bg-slate-800"
          />
        </div>

        <button
          id="submit-request-btn"
          class="w-full py-3 bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <span>Submit Service Request</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}
