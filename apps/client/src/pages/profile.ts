import { dataStore } from '@supabase-pkg/client';
import { fullName, html, initials, maskIdNumber, type SafeHtml } from '@shared/index';
import { clientService } from '../services/client';
import { getOnboardingSteps } from './onboarding';

const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];
const MARITAL = ['Single', 'Married in community of property', 'Married out of community of property', 'Divorced', 'Widowed', 'Life partner'];

export function renderProfilePage(): SafeHtml {
  const user = dataStore.getState().currentUser;
  const client = clientService.getCurrentClient();
  const steps = getOnboardingSteps();
  const completed = steps.filter((s) => s.done).length;

  const text = (id: string, label: string, value: string | null | undefined, type = 'text') => html`
    <label class="text-xs text-slate-500 block">${label}
      <input id="${id}" type="${type}" value="${value || ''}" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" />
    </label>`;

  return html`
    <div class="space-y-4 pb-24">
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
        <div class="w-16 h-16 rounded-full bg-[#0A192F] text-amber-300 font-serif-royal font-bold text-xl flex items-center justify-center mx-auto shadow-md">${initials(user)}</div>
        <h2 class="text-base font-bold text-slate-900 mt-2">${fullName(user)}</h2>
        <span class="text-xs font-mono text-slate-400 font-semibold">${client?.client_number || 'Client account'}</span>
        <div class="mt-2">
          <button data-nav="onboarding" class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${client?.onboarding_completed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}">
            <span>${client?.onboarding_completed ? '✓ Onboarding complete' : `Onboarding ${completed}/${steps.length}`}</span>
          </button>
        </div>
      </div>

      <form id="client-profile-form" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Account details</h3>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs text-slate-500">First name<input id="client-profile-first-name" value="${user?.first_name || ''}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
          <label class="text-xs text-slate-500">Last name<input id="client-profile-last-name" value="${user?.last_name || ''}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
        </div>
        <label class="text-xs text-slate-500 block">Phone<input id="client-profile-phone" type="tel" value="${user?.phone || ''}" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
        <p class="text-[11px] text-slate-400">Email: ${user?.email || '—'}</p>
        <button type="submit" class="w-full rounded-xl bg-[#0A192F] py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-800 disabled:opacity-60">Save account details</button>
      </form>

      ${client
        ? html`<form id="client-details-form" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Personal details and FICA</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Required by law for your adviser to act for you. ID on file: ${maskIdNumber(client.id_number)}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${text('cd-id-number', 'South African ID number', client.id_number)}
              ${text('cd-dob', 'Date of birth', client.date_of_birth, 'date')}
            </div>
            <label class="text-xs text-slate-500 block">Marital status
              <select id="cd-marital" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                <option value="">Select</option>
                ${MARITAL.map((m) => html`<option value="${m}" ${client.marital_status === m ? 'selected' : ''}>${m}</option>`)}
              </select>
            </label>
            <div class="grid grid-cols-2 gap-3">
              ${text('cd-occupation', 'Occupation', client.occupation)}
              ${text('cd-employer', 'Employer', client.employer)}
            </div>
            ${text('cd-address1', 'Address line 1', client.address_line_1)}
            ${text('cd-address2', 'Address line 2', client.address_line_2)}
            <div class="grid grid-cols-2 gap-3">
              ${text('cd-city', 'City', client.city)}
              ${text('cd-postal', 'Postal code', client.postal_code)}
            </div>
            <label class="text-xs text-slate-500 block">Province
              <select id="cd-province" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                <option value="">Select</option>
                ${PROVINCES.map((p) => html`<option value="${p}" ${client.province === p ? 'selected' : ''}>${p}</option>`)}
              </select>
            </label>
            <label class="text-xs text-slate-500 block">Preferred contact method
              <select id="cd-contact" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                ${['app', 'email', 'phone'].map((m) => html`<option value="${m}" ${(client.preferred_contact_method || 'app') === m ? 'selected' : ''}>${m === 'app' ? 'In this app' : m === 'email' ? 'Email' : 'Phone'}</option>`)}
              </select>
            </label>
            <button type="submit" class="w-full rounded-xl bg-[#0A192F] py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-800 disabled:opacity-60">Save personal details</button>
          </form>`
        : ''}

      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">POPIA and privacy</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Royal Square Financial is an authorised financial services provider (FSP #48921) and processes your personal information under the Protection of Personal Information Act (POPIA). Documents you upload are stored privately and are only visible to you and your Royal Square team.
        </p>
      </div>

      <div class="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-center">
        <button id="client-logout-btn" class="w-full py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">Sign out</button>
      </div>
    </div>
  `;
}
