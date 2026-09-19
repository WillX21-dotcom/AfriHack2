import { html, type SafeHtml } from '@shared/html';
import { formatDate, formatDateTime, formatZAR, fullName, initials, titleCase, maskIdNumber, relativeTime, monthlyAmount } from '@shared/format';
import { adviserService } from '../services/adviser';
import { renderDashboardStatusBadge } from '../components/status-badge';
import { INPUT_CLASS, notFound, recordSection } from '../components/ui';

export const DOCUMENT_TYPE_OPTIONS: Array<[string, string]> = [
  ['id_document', 'ID document'],
  ['proof_of_address', 'Proof of address'],
  ['policy_document', 'Policy document'],
  ['investment_statement', 'Investment statement'],
  ['driver_license', "Driver's licence"],
  ['vehicle_registration', 'Vehicle registration'],
  ['insurance_certificate', 'Insurance certificate'],
  ['claim_document', 'Claim document'],
  ['financial_statement', 'Financial statement'],
  ['beneficiary_document', 'Beneficiary document'],
  ['compliance_document', 'Compliance document'],
  ['other', 'Other'],
];

function labelledInput(id: string, label: string, value: string | null | undefined, type = 'text'): SafeHtml {
  return html`<label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">${label}</span><input id="${id}" name="${id}" type="${type}" value="${value ?? ''}" class="${INPUT_CLASS}" /></label>`;
}

export function renderDocumentRow(doc: { id: string; name: string; document_type: string; is_verified: boolean; created_at: string }): SafeHtml {
  return html`
    <div class="p-2.5 bg-slate-50 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <span class="font-semibold text-slate-800 block truncate">${doc.name}</span>
        <span class="text-[10px] text-slate-400">${titleCase(doc.document_type)} · ${formatDate(doc.created_at)}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        ${doc.is_verified ? html`<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Verified</span>` : ''}
        <button data-action="open-doc" data-id="${doc.id}" class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-100">Open</button>
        <button data-action="verify-doc" data-id="${doc.id}" data-verified="${doc.is_verified ? 'false' : 'true'}" class="px-2 py-1 rounded-lg text-[11px] font-semibold ${doc.is_verified ? 'text-slate-500 hover:bg-slate-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}">${doc.is_verified ? 'Unverify' : 'Verify'}</button>
      </div>
    </div>
  `;
}

export function renderUploadForm(clientId: string, extra: { requestId?: string; claimId?: string } = {}, defaultType = 'other'): SafeHtml {
  return html`
    <form data-form="staff-upload" data-client="${clientId}" data-request="${extra.requestId || ''}" data-claim="${extra.claimId || ''}" class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
      <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Document type</span>
        <select name="document_type" class="${INPUT_CLASS}">${DOCUMENT_TYPE_OPTIONS.map(([v, l]) => html`<option value="${v}" ${v === defaultType ? 'selected' : ''}>${l}</option>`)}</select>
      </label>
      <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">File (max 10 MB)</span>
        <input type="file" name="file" required class="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700" />
      </label>
      <button type="submit" class="px-4 py-2.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Upload</button>
    </form>
  `;
}

export function renderClientDetailPage(clientId: string): SafeHtml {
  const data = adviserService.getClientDetail(clientId);
  const client = data.client;
  if (!client) return notFound('Client profile', 'clients', 'Back to Directory');

  const totals = adviserService.clientTotals(clientId);
  const fica = adviserService.ficaStatus(clientId);
  const isAdmin = adviserService.isAdmin();
  const income = data.income.reduce((n, i) => n + monthlyAmount(i.amount, i.frequency), 0);
  const expenses = data.expenses.reduce((n, e) => n + monthlyAmount(e.amount, e.frequency), 0);
  const p = client.profile;

  return html`
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center space-x-4 min-w-0">
            <div class="w-16 h-16 rounded-2xl bg-[#0A192F] text-amber-300 font-serif-royal font-bold text-xl flex items-center justify-center shadow-md shrink-0">${initials(p)}</div>
            <div class="min-w-0">
              <div class="flex items-center flex-wrap gap-2">
                <h2 class="text-lg font-bold text-slate-900">${fullName(p, 'Profile unavailable')}</h2>
                ${renderDashboardStatusBadge(fica)}
                ${client.onboarding_completed ? html`<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Onboarded</span>` : ''}
              </div>
              <div class="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-1">
                <span class="font-mono font-semibold text-slate-700">${client.client_number}</span>
                <span>ID: <span class="font-mono">${client.id_number ? maskIdNumber(client.id_number) : 'not provided'}</span></span>
                <span>${p?.email}</span>
                ${p?.phone ? html`<span>${p.phone}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <div class="text-right pr-4 lg:border-r border-slate-200">
              <span class="text-[10px] text-slate-400 uppercase tracking-wide block">Net worth</span>
              <span class="text-lg font-bold font-mono text-slate-900">${formatZAR(totals.netWorth)}</span>
            </div>
            <button data-dash-nav="communications" data-id="${client.id}" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold">✉ Message client</button>
            <button data-action="toggle-onboarding" data-client="${client.id}" data-value="${client.onboarding_completed ? 'false' : 'true'}" class="px-3 py-2 ${client.onboarding_completed ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0A192F] text-amber-300 hover:bg-slate-800'} rounded-xl text-xs font-bold">
              ${client.onboarding_completed ? 'Reopen onboarding' : '✓ Complete onboarding'}
            </button>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span class="text-slate-500">Adviser:</span>
          ${isAdmin
            ? html`
              <select id="assign-adviser-select" data-client="${client.id}" class="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                ${!client.adviser_id ? html`<option value="" selected>Unassigned</option>` : ''}
                ${adviserService.getAdvisers().map((a) => html`<option value="${a.id}" ${a.id === client.adviser_id ? 'selected' : ''}>${fullName(a)}</option>`)}
              </select>`
            : html`<strong class="text-slate-800">${client.adviser ? fullName(client.adviser) : 'Unassigned'}</strong>`}
          <span class="text-slate-300">|</span>
          <span class="text-slate-500">Monthly income <strong class="text-slate-800 font-mono">${formatZAR(income)}</strong></span>
          <span class="text-slate-500">Monthly outgoings <strong class="text-slate-800 font-mono">${formatZAR(expenses)}</strong></span>
          <span class="text-slate-500">Surplus <strong class="font-mono ${income - expenses < 0 ? 'text-rose-700' : 'text-emerald-700'}">${formatZAR(income - expenses)}</strong></span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${recordSection({ title: 'Assets', table: 'assets', clientId, total: formatZAR(totals.assets), emptyText: 'No assets captured yet.', rows: data.assets.map((a) => ({ id: a.id, primary: a.name, secondary: titleCase(a.asset_type), value: formatZAR(a.current_value) })) })}
        ${recordSection({ title: 'Investments', table: 'investments', clientId, total: formatZAR(totals.investments), emptyText: 'No investments captured yet.', rows: data.investments.map((i) => ({ id: i.id, primary: i.investment_name, secondary: [i.provider_name, i.account_number].filter(Boolean).join(' · '), value: formatZAR(i.current_value) })) })}
        ${recordSection({ title: 'Liabilities', table: 'liabilities', clientId, total: formatZAR(totals.liabilities), emptyText: 'No liabilities captured yet.', rows: data.liabilities.map((l) => ({ id: l.id, primary: l.name, secondary: titleCase(l.liability_type), value: formatZAR(l.outstanding_balance) })) })}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${recordSection({ title: 'Income', table: 'income', clientId, emptyText: 'No income captured yet.', rows: data.income.map((i) => ({ id: i.id, primary: i.source, secondary: titleCase(i.frequency), value: formatZAR(i.amount) })) })}
        ${recordSection({ title: 'Expenses', table: 'expenses', clientId, emptyText: 'No expenses captured yet.', rows: data.expenses.map((e) => ({ id: e.id, primary: e.category, secondary: titleCase(e.frequency), value: formatZAR(e.amount) })) })}
      </div>

      ${recordSection({ title: 'In-force policies', table: 'policies', clientId, emptyText: 'No policies captured yet.', rows: data.policies.map((p) => ({ id: p.id, primary: p.policy_type || 'Policy', secondary: [p.provider_name, p.policy_number, titleCase(p.status)].filter(Boolean).join(' · '), value: `${formatZAR(p.sum_assured)} cover` })) })}

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${recordSection({ title: 'Goals', table: 'goals', clientId, emptyText: 'No goals yet.', rows: data.goals.map((g) => ({ id: g.id, primary: g.name, secondary: `${titleCase(g.status)} · target ${formatDate(g.target_date)}`, value: `${formatZAR(g.current_amount)} / ${formatZAR(g.target_amount)}` })) })}
        ${recordSection({ title: 'Dependants', table: 'dependants', clientId, emptyText: 'No dependants captured.', rows: data.dependants.map((d) => ({ id: d.id, primary: d.full_name, secondary: d.relationship || '' })) })}
        ${recordSection({ title: 'Beneficiaries', table: 'beneficiaries', clientId, emptyText: 'No beneficiaries captured.', rows: data.beneficiaries.map((b) => ({ id: b.id, primary: b.full_name, secondary: b.relationship || '', value: b.percentage != null ? `${b.percentage}%` : '' })) })}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Document vault & FICA</h3>
          <div class="space-y-2">
            ${data.documents.length === 0
              ? html`<p class="text-[11px] text-slate-400">No documents uploaded yet. FICA needs a verified ID document and proof of address.</p>`
              : data.documents.map((d) => renderDocumentRow(d))}
          </div>
          ${renderUploadForm(clientId)}
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Requests & claims</h3>
          <div class="space-y-2">
            ${data.claims.map(
              (c) => html`<div class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs gap-2">
                <div class="min-w-0"><span class="font-mono font-bold text-slate-900">${c.claim_number}</span><p class="text-slate-600 text-[11px] mt-0.5 truncate">${(c.metadata as any)?.insured_vehicle || 'Motor claim'} · ${c.incident_location || ''}</p></div>
                <div class="flex items-center gap-2 shrink-0">${renderDashboardStatusBadge(c.status)}<button data-dash-nav="claim-detail" data-id="${c.id}" class="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700">Manage →</button></div>
              </div>`
            )}
            ${data.requests.map(
              (r) => html`<div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs gap-2">
                <div class="min-w-0"><span class="font-mono font-bold text-slate-900">${r.request_number}</span><p class="text-slate-600 text-[11px] mt-0.5 truncate">${r.title}</p></div>
                <div class="flex items-center gap-2 shrink-0">${renderDashboardStatusBadge(r.status)}<button data-dash-nav="request-detail" data-id="${r.id}" class="px-3 py-1 bg-slate-800 text-white rounded-lg font-bold text-[11px] hover:bg-slate-900">Open →</button></div>
              </div>`
            )}
            ${data.claims.length + data.requests.length === 0 ? html`<p class="text-[11px] text-slate-400">No requests or claims yet.</p>` : ''}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${recordSection({ title: 'Reminders', table: 'reminders', clientId, emptyText: 'No reminders scheduled.', rows: data.reminders.map((r) => ({ id: r.id, primary: r.title, secondary: `${r.is_completed ? 'Completed' : 'Due ' + formatDateTime(r.reminder_date)} · ${titleCase(r.frequency)}` })) })}
        ${recordSection({ title: 'Tasks', table: 'tasks', clientId, emptyText: 'No tasks for this client.', rows: data.tasks.map((t) => ({ id: t.id, primary: t.title, secondary: `${titleCase(t.status)}${t.due_date ? ' · due ' + formatDate(t.due_date) : ''}` })) })}
      </div>

      <form id="client-details-form" data-client="${client.id}" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Client file (KYC & advice notes)</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">The client can also update their personal details from the app. Risk profile and notes are adviser-only.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${labelledInput('id_number', 'SA ID number', client.id_number)}
          ${labelledInput('date_of_birth', 'Date of birth', client.date_of_birth, 'date')}
          ${labelledInput('marital_status', 'Marital status', client.marital_status)}
          ${labelledInput('occupation', 'Occupation', client.occupation)}
          ${labelledInput('employer', 'Employer', client.employer)}
          ${labelledInput('risk_profile', 'Risk profile', client.risk_profile)}
          ${labelledInput('address_line_1', 'Address line 1', client.address_line_1)}
          ${labelledInput('address_line_2', 'Address line 2', client.address_line_2)}
          ${labelledInput('city', 'City', client.city)}
          ${labelledInput('province', 'Province', client.province)}
          ${labelledInput('postal_code', 'Postal code', client.postal_code)}
          <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Preferred contact</span>
            <select name="preferred_contact_method" id="preferred_contact_method" class="${INPUT_CLASS}">
              ${(['app', 'email', 'phone'] as const).map((m) => html`<option value="${m}" ${client.preferred_contact_method === m ? 'selected' : ''}>${titleCase(m)}</option>`)}
            </select>
          </label>
        </div>
        <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Adviser notes (never shown to the client)</span>
          <textarea id="notes" name="notes" rows="3" class="${INPUT_CLASS}">${client.notes ?? ''}</textarea>
        </label>
        <button type="submit" class="px-5 py-2.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Save client file</button>
      </form>

      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">Record of advice & change history</h3>
        <div class="space-y-2 text-xs max-h-80 overflow-y-auto">
          ${data.auditLogs.length === 0
            ? html`<p class="text-[11px] text-slate-400">No recorded activity.</p>`
            : data.auditLogs.map(
                (a) => html`<div class="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-[11px] text-slate-600">
                  <span><span class="font-bold text-slate-800 uppercase">${a.action.replace(/_/g, ' ')}</span> · ${a.description} <span class="text-slate-400">by ${a.user_name || 'system'}</span></span>
                  <span class="font-mono text-slate-400 shrink-0">${relativeTime(a.created_at)}</span>
                </div>`
              )}
        </div>
      </div>
    </div>
  `;
}
