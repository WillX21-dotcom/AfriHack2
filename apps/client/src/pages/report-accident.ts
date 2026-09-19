import { html, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';

/**
 * The accident form survives re-renders (the app refreshes whenever the database reports a change),
 * so everything typed or captured lives in this draft rather than in the DOM.
 */
export interface AccidentDraft {
  values: Record<string, string>;
  photos: Array<{ blob: Blob; url: string }>;
  voiceNote: { blob: Blob; url: string; durationMs: number } | null;
}

function localDateTimeValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

let draft: AccidentDraft = { values: {}, photos: [], voiceNote: null };

export function getAccidentDraft(): AccidentDraft {
  return draft;
}

export function resetAccidentDraft(): void {
  draft.photos.forEach((p) => URL.revokeObjectURL(p.url));
  if (draft.voiceNote) URL.revokeObjectURL(draft.voiceNote.url);
  draft = { values: {}, photos: [], voiceNote: null };
}

export const ACCIDENT_FIELD_IDS = [
  'acc-date-input',
  'acc-location-input',
  'acc-desc-input',
  'acc-vehicle-input',
  'acc-police-cas-input',
  'acc-police-station-input',
  'tp-reg-input',
  'tp-make-input',
  'tp-name-input',
  'tp-insurer-input',
  'wit-name-input',
  'wit-phone-input',
];

export function renderReportAccidentPage(isRecording: boolean): SafeHtml {
  const v = (id: string, fallback = '') => draft.values[id] ?? fallback;
  const vehicles = financialService.getSummary().assets.filter((a) => a.asset_type === 'vehicle');

  const field = (id: string, label: string, placeholder = '', type = 'text') => html`
    <div>
      <label for="${id}" class="text-[11px] font-semibold text-slate-600 block mb-1">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" value="${v(id)}" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
    </div>`;

  return html`
    <div class="space-y-4 pb-28">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 shadow-xs">
        <h3 class="text-xs font-bold uppercase tracking-wide">⚠️ Safety first</h3>
        <p class="text-xs text-red-800/90 mt-1 leading-relaxed">
          If anyone is injured, dial <strong>10177</strong> or <strong>112</strong> straight away. Switch on your hazard lights, place your warning triangle about 45 m behind the vehicle and stay somewhere safe.
        </p>
        <a href="tel:112" class="inline-block mt-2 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-xs">Call 112</a>
      </div>

      <form id="accident-form" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4" novalidate>
        <div>
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 1 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">What happened and where</h2>
        </div>

        <div>
          <label for="acc-date-input" class="text-xs font-semibold text-slate-700 block mb-1">Date and approximate time</label>
          <input id="acc-date-input" type="datetime-local" max="${localDateTimeValue()}" value="${v('acc-date-input', localDateTimeValue())}" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label for="acc-location-input" class="text-xs font-semibold text-slate-700">Location or intersection</label>
            <button id="detect-gps-btn" type="button" class="text-[11px] text-amber-700 font-bold hover:underline">📍 Use my location</button>
          </div>
          <input id="acc-location-input" type="text" required placeholder="Street and suburb" value="${v('acc-location-input')}" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl" />
        </div>

        <div>
          <label for="acc-vehicle-input" class="text-xs font-semibold text-slate-700 block mb-1">Your vehicle</label>
          <input id="acc-vehicle-input" list="insured-vehicles" type="text" placeholder="Make, model and registration" value="${v('acc-vehicle-input')}" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl" />
          <datalist id="insured-vehicles">${vehicles.map((a) => html`<option value="${a.name}"></option>`)}</datalist>
        </div>

        <div>
          <label for="acc-desc-input" class="text-xs font-semibold text-slate-700 block mb-1">What happened and what is damaged</label>
          <textarea id="acc-desc-input" required rows="3" placeholder="Describe the impact, road and weather conditions and the visible damage." class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed">${v('acc-desc-input')}</textarea>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 2 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Police report</h2>
          <p class="text-xs text-slate-500">Accidents must be reported to SAPS within 24 hours. Add the case number now or send it to your adviser later.</p>
          <div class="grid grid-cols-2 gap-2 mt-2">
            ${field('acc-police-cas-input', 'SAPS case number (CAS)', 'CAS 123/09/2026')}
            ${field('acc-police-station-input', 'Police station', '')}
          </div>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 3 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Other driver and witnesses</h2>
          <div class="grid grid-cols-2 gap-2 mt-2">
            ${field('tp-reg-input', 'Other vehicle registration')}
            ${field('tp-make-input', 'Make and model')}
            ${field('tp-name-input', 'Driver name')}
            ${field('tp-insurer-input', 'Their insurer')}
            ${field('wit-name-input', 'Witness name')}
            ${field('wit-phone-input', 'Witness phone', '', 'tel')}
          </div>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 4 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Photos and voice statement</h2>
          <p class="text-xs text-slate-500">Optional, but photos of all vehicles and the scene speed up your claim.</p>

          <div class="grid grid-cols-2 gap-2 mt-3">
            <button id="trigger-camera-btn" type="button" class="p-3 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 flex flex-col items-center text-amber-900">
              <span class="text-lg">📷</span><span class="text-xs font-bold mt-1">Take photo</span>
            </button>
            <label class="p-3 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 flex flex-col items-center text-amber-900 cursor-pointer">
              <span class="text-lg">🖼️</span><span class="text-xs font-bold mt-1">Choose photos</span>
              <input id="photo-file-input" type="file" accept="image/*" multiple class="hidden" />
            </label>
          </div>

          <button id="trigger-mic-btn" type="button" class="mt-2 w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-center space-x-2 ${isRecording ? 'border-red-500 bg-red-50 text-red-700' : draft.voiceNote ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'}">
            <span class="text-lg">🎙️</span>
            <span class="text-xs font-bold">${isRecording ? '🔴 Recording, tap to stop' : draft.voiceNote ? `Voice note saved (${Math.max(1, Math.round(draft.voiceNote.durationMs / 1000))}s), tap to re-record` : 'Record a voice statement'}</span>
          </button>

          ${draft.photos.length > 0
            ? html`<div class="flex gap-2 mt-3 overflow-x-auto py-1">
                ${draft.photos.map((p, i) => html`<div class="relative shrink-0">
                  <img src="${p.url}" alt="Accident photo ${i + 1}" class="w-16 h-16 rounded-xl object-cover border border-slate-300" />
                  <button type="button" data-action="remove-photo" data-index="${i}" aria-label="Remove photo ${i + 1}" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] leading-none">✕</button>
                </div>`)}
              </div>`
            : ''}
        </div>

        <button id="submit-accident-claim-btn" type="submit" class="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 disabled:opacity-60 text-white font-bold rounded-xl text-xs transition-all shadow-md">
          Submit claim to Royal Square
        </button>
      </form>
    </div>
  `;
}
