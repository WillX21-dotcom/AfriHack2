import { html, type SafeHtml } from '@shared/html';
import { getRecordSchema, toDateTimeLocal, type FieldDef } from '../services/records';

export const INPUT_CLASS =
  'w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900';

export function pageHeading(title: string, description?: string, actions?: SafeHtml | string): SafeHtml {
  return html`
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-slate-900">${title}</h2>
        ${description ? html`<p class="text-xs text-slate-500">${description}</p>` : ''}
      </div>
      ${actions ? html`<div class="flex items-center gap-2 flex-wrap">${actions}</div>` : ''}
    </div>
  `;
}

export function emptyState(title: string, hint?: string): SafeHtml {
  return html`
    <div class="p-8 text-center">
      <p class="text-sm font-semibold text-slate-700">${title}</p>
      ${hint ? html`<p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">${hint}</p>` : ''}
    </div>
  `;
}

export function notFound(what: string, backRoute: string, backLabel: string): SafeHtml {
  return html`
    <div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <h3 class="text-sm font-bold text-slate-800">${what} not found</h3>
      <p class="text-xs text-slate-400 mt-1">It may have been removed, or you may not have access to it.</p>
      <button data-dash-nav="${backRoute}" class="mt-3 px-4 py-2 bg-[#0A192F] text-amber-300 rounded-xl text-xs font-bold">${backLabel}</button>
    </div>
  `;
}

export function statCard(label: string, value: string | number, tone: 'blue' | 'amber' | 'red' | 'emerald' | 'slate', hint?: string, nav?: string): SafeHtml {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return html`
    <div ${nav ? html`data-dash-nav="${nav}"` : ''} class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start space-x-4 ${nav ? 'cursor-pointer hover:border-amber-300 transition-colors' : ''}">
      <div class="w-11 h-11 rounded-xl ${tones[tone]} flex items-center justify-center shrink-0 font-bold text-sm">${String(label).charAt(0)}</div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-slate-500">${label}</p>
        <h3 class="text-2xl font-bold text-slate-900 mt-1 truncate">${value}</h3>
        ${hint ? html`<p class="text-[11px] text-slate-400 mt-1">${hint}</p>` : ''}
      </div>
    </div>
  `;
}

/** A titled list of editable client records with an "Add" button. */
export function recordSection(options: {
  title: string;
  table: string;
  clientId: string;
  total?: string;
  rows: Array<{ id: string; primary: string; secondary?: string; value?: string }>;
  emptyText: string;
}): SafeHtml {
  const { title, table, clientId, total, rows, emptyText } = options;
  return html`
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <div class="flex justify-between items-center mb-3 gap-2">
        <div class="min-w-0">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">${title}</h3>
          ${total ? html`<span class="text-xs font-bold text-slate-900 font-mono">${total}</span>` : ''}
        </div>
        <button data-action="edit-record" data-table="${table}" data-client="${clientId}" data-id="" class="shrink-0 px-2.5 py-1 bg-[#0A192F] text-amber-300 rounded-lg text-[11px] font-bold hover:bg-slate-800">+ Add</button>
      </div>
      <div class="space-y-2">
        ${rows.length === 0
          ? html`<p class="text-[11px] text-slate-400 py-2">${emptyText}</p>`
          : rows.map(
              (row) => html`
                <button data-action="edit-record" data-table="${table}" data-client="${clientId}" data-id="${row.id}" class="w-full text-left p-2.5 bg-slate-50 hover:bg-amber-50/60 rounded-xl text-xs flex justify-between items-center gap-3 transition-colors">
                  <div class="min-w-0">
                    <span class="font-semibold text-slate-800 block truncate">${row.primary}</span>
                    ${row.secondary ? html`<span class="text-[10px] text-slate-400 block truncate">${row.secondary}</span>` : ''}
                  </div>
                  ${row.value ? html`<span class="font-mono font-bold text-slate-700 shrink-0">${row.value}</span>` : ''}
                </button>
              `
            )}
      </div>
    </div>
  `;
}

function renderField(field: FieldDef, value: unknown): SafeHtml {
  const wrapper = field.half ? 'col-span-1' : 'col-span-2';
  const label = html`<span class="text-[11px] font-semibold text-slate-600 block mb-1">${field.label}${field.required ? ' *' : ''}</span>`;

  if (field.type === 'checkbox') {
    return html`
      <label class="${wrapper} flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" name="${field.name}" ${value ? 'checked' : ''} class="rounded border-slate-300" />
        <span>${field.label}</span>
      </label>
    `;
  }
  if (field.type === 'select') {
    return html`
      <label class="${wrapper} block">
        ${label}
        <select name="${field.name}" class="${INPUT_CLASS}">
          ${(field.options || []).map(([v, l]) => html`<option value="${v}" ${String(value ?? '') === v ? 'selected' : ''}>${l}</option>`)}
        </select>
      </label>
    `;
  }
  if (field.type === 'textarea') {
    return html`<label class="${wrapper} block">${label}<textarea name="${field.name}" rows="3" class="${INPUT_CLASS}">${value ?? ''}</textarea></label>`;
  }

  const inputType = field.type === 'datetime' ? 'datetime-local' : field.type;
  const shown = field.type === 'datetime' ? toDateTimeLocal(value) : field.type === 'date' ? String(value ?? '').slice(0, 10) : (value ?? '');
  return html`
    <label class="${wrapper} block">
      ${label}
      <input type="${inputType}" name="${field.name}" value="${shown}" ${field.type === 'number' ? html`step="any" min="0"` : ''} placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} class="${INPUT_CLASS}" />
    </label>
  `;
}

export interface ModalState {
  table: string;
  clientId: string;
  id: string | null;
  row: Record<string, unknown> | null;
  error?: string;
}

export function renderRecordModal(modal: ModalState): SafeHtml {
  const schema = getRecordSchema(modal.table);
  if (!schema) return html``;

  // Defaults for a brand new row
  const defaults: Record<string, unknown> = { is_dependent: true, is_shared: true, notify_client: true, notify_adviser: true, status: 'active', frequency: schema.table === 'reminders' ? 'once' : 'monthly', priority: 'normal' };
  const row = modal.row || defaults;

  return html`
    <div id="dash-modal" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div data-action="close-modal" class="absolute inset-0 bg-slate-900/60"></div>
      <form id="record-form" data-table="${schema.table}" data-client="${modal.clientId}" data-id="${modal.id || ''}" class="relative bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900">${modal.id ? 'Edit' : 'Add'} ${schema.singular.toLowerCase()}</h3>
          <button type="button" data-action="close-modal" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg" aria-label="Close">✕</button>
        </div>
        ${modal.error ? html`<div class="text-xs bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl">${modal.error}</div>` : ''}
        <div class="grid grid-cols-2 gap-3">
          ${schema.fields.map((field) => renderField(field, row[field.name]))}
        </div>
        <div class="flex items-center justify-between pt-2">
          ${modal.id
            ? html`<button type="button" data-action="delete-record" class="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl">Delete</button>`
            : html`<span></span>`}
          <div class="flex gap-2">
            <button type="button" data-action="close-modal" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Save</button>
          </div>
        </div>
      </form>
    </div>
  `;
}
