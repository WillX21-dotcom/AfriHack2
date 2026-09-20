import { html, type SafeHtml } from '@shared/index';
import { financialService } from '../services/financial';
import { icon } from '../components/icons';

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
      <label for="${id}" class="rsc-label">${label}</label>
      <input id="${id}" type="${type}" placeholder="${placeholder}" value="${v(id)}" class="rsc-input" />
    </div>`;

  const step = (n: number, title: string, hint?: string) => html`
    <div class="mb-3">
      <p class="rsc-eyebrow">Step ${n} of 4</p>
      <h3 class="text-[15px] font-semibold text-slate-900 mt-0.5">${title}</h3>
      ${hint ? html`<p class="rsc-muted mt-1">${hint}</p>` : ''}
    </div>`;

  const voiceLabel = isRecording
    ? 'Recording. Tap to stop'
    : draft.voiceNote
    ? `Voice note saved (${Math.max(1, Math.round(draft.voiceNote.durationMs / 1000))}s). Tap to re-record`
    : 'Record a voice statement';
  const voiceTone = isRecording ? '!border-red-300 !bg-red-50 !text-red-700' : draft.voiceNote ? '!border-emerald-300 !bg-emerald-50 !text-emerald-800' : '';

  return html`
    <div class="space-y-4 pb-4">
      <div class="rsc-notice rsc-notice-danger">
        <span class="shrink-0 mt-0.5">${icon('alert', 'w-5 h-5', 2)}</span>
        <div>
          <p class="font-semibold">Safety first</p>
          <p class="mt-0.5">If anyone is injured, dial <strong>10177</strong> or <strong>112</strong> straight away. Switch on your hazard lights, place your warning triangle about 45 m behind the vehicle and stay somewhere safe.</p>
          <a href="tel:112" class="rsc-btn rsc-btn-danger rsc-btn-sm mt-2.5">${icon('phone', 'w-4 h-4', 2)}Call 112</a>
        </div>
      </div>

      <form id="accident-form" class="rsc-card p-4 space-y-6" novalidate>
        <section>
          ${step(1, 'What happened and where')}
          <div class="space-y-3.5">
            <div>
              <label for="acc-date-input" class="rsc-label">Date and approximate time</label>
              <input id="acc-date-input" type="datetime-local" max="${localDateTimeValue()}" value="${v('acc-date-input', localDateTimeValue())}" class="rsc-input" />
            </div>
            <div>
              <div class="flex justify-between items-baseline mb-[5px]">
                <label for="acc-location-input" class="text-xs font-semibold text-slate-700">Location or intersection</label>
                <button id="detect-gps-btn" type="button" class="rsc-link !text-xs">Use my location</button>
              </div>
              <input id="acc-location-input" type="text" required placeholder="Street and suburb" value="${v('acc-location-input')}" class="rsc-input" />
            </div>
            <div>
              <label for="acc-vehicle-input" class="rsc-label">Your vehicle</label>
              <input id="acc-vehicle-input" list="insured-vehicles" type="text" placeholder="Make, model and registration" value="${v('acc-vehicle-input')}" class="rsc-input" />
              <datalist id="insured-vehicles">${vehicles.map((a) => html`<option value="${a.name}"></option>`)}</datalist>
            </div>
            <div>
              <label for="acc-desc-input" class="rsc-label">What happened and what is damaged</label>
              <textarea id="acc-desc-input" required rows="3" placeholder="Describe the impact, road and weather conditions and the visible damage." class="rsc-input">${v('acc-desc-input')}</textarea>
            </div>
          </div>
        </section>

        <section class="pt-6 rsc-divider">
          ${step(2, 'Police report', 'Accidents must be reported to SAPS within 24 hours. Add the case number now or send it to your adviser later.')}
          <div class="grid grid-cols-2 gap-3">
            ${field('acc-police-cas-input', 'SAPS case number', 'CAS 123/09/2026')}
            ${field('acc-police-station-input', 'Police station', '')}
          </div>
        </section>

        <section class="pt-6 rsc-divider">
          ${step(3, 'Other driver and witnesses', 'Optional. Fill in whatever you have.')}
          <div class="grid grid-cols-2 gap-3">
            ${field('tp-reg-input', 'Other vehicle registration')}
            ${field('tp-make-input', 'Make and model')}
            ${field('tp-name-input', 'Driver name')}
            ${field('tp-insurer-input', 'Their insurer')}
            ${field('wit-name-input', 'Witness name')}
            ${field('wit-phone-input', 'Witness phone', '', 'tel')}
          </div>
        </section>

        <section class="pt-6 rsc-divider">
          ${step(4, 'Photos and voice statement', 'Optional, but photos of all vehicles and the scene speed up your claim.')}
          <div class="grid grid-cols-2 gap-2.5">
            <button id="trigger-camera-btn" type="button" class="rsc-btn rsc-btn-secondary">${icon('camera', 'w-[18px] h-[18px]', 2)}Take photo</button>
            <label class="rsc-btn rsc-btn-secondary">${icon('photo', 'w-[18px] h-[18px]', 2)}Choose photos<input id="photo-file-input" type="file" accept="image/*" multiple class="hidden" /></label>
          </div>

          <button id="trigger-mic-btn" type="button" class="rsc-btn rsc-btn-secondary rsc-btn-block mt-2.5 ${voiceTone}">
            ${isRecording ? html`<span class="w-2 h-2 rounded-full bg-red-600 animate-pulse" aria-hidden="true"></span>` : icon('mic', 'w-[18px] h-[18px]', 2)}${voiceLabel}
          </button>

          ${draft.photos.length > 0
            ? html`<div class="flex gap-2 mt-3 overflow-x-auto py-1">
                ${draft.photos.map((p, i) => html`<div class="relative shrink-0">
                  <img src="${p.url}" alt="Accident photo ${i + 1}" class="w-16 h-16 rounded-[10px] object-cover border border-slate-200" />
                  <button type="button" data-action="remove-photo" data-index="${i}" aria-label="Remove photo ${i + 1}" class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">${icon('close', 'w-3 h-3', 3)}</button>
                </div>`)}
              </div>`
            : ''}
        </section>

        <button id="submit-accident-claim-btn" type="submit" class="rsc-btn rsc-btn-primary rsc-btn-block">Submit claim to Royal Square</button>
      </form>
    </div>
  `;
}
