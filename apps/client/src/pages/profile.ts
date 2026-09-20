import { dataStore } from '@supabase-pkg/client';
import { fullName, html, initials, maskIdNumber, type SafeHtml } from '@shared/index';
import { clientService } from '../services/client';
import { getOnboardingSteps } from './onboarding';
import { icon } from '../components/icons';

const PROVINCES = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];
const MARITAL = ['Single', 'Married in community of property', 'Married out of community of property', 'Divorced', 'Widowed', 'Life partner'];

export function renderProfilePage(): SafeHtml {
  const user = dataStore.getState().currentUser;
  const client = clientService.getCurrentClient();
  const steps = getOnboardingSteps();
  const completed = steps.filter((s) => s.done).length;

  const text = (id: string, label: string, value: string | null | undefined, type = 'text') => html`
    <div>
      <label for="${id}" class="rsc-label">${label}</label>
      <input id="${id}" type="${type}" value="${value || ''}" class="rsc-input" />
    </div>`;

  return html`
    <div class="space-y-4 pb-4">
      <section class="rsc-card p-5 flex items-center gap-4">
        <span class="w-14 h-14 rounded-full bg-[#0A192F] text-white text-lg font-semibold flex items-center justify-center shrink-0">${initials(user)}</span>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-slate-900 truncate">${fullName(user)}</h2>
          <p class="rsc-ref !text-[12px]">${client?.client_number || 'Client account'}</p>
          <button data-nav="onboarding" class="mt-1.5 rsc-badge ${client?.onboarding_completed ? 'rsc-badge-green' : 'rsc-badge-amber'}">${client?.onboarding_completed ? 'Onboarding complete' : `Onboarding ${completed} of ${steps.length}`}</button>
        </div>
      </section>

      <form id="client-profile-form" class="rsc-card p-4 space-y-3.5">
        <h3 class="rsc-eyebrow">Account details</h3>
        <div class="grid grid-cols-2 gap-3">
          <div><label for="client-profile-first-name" class="rsc-label">First name</label><input id="client-profile-first-name" value="${user?.first_name || ''}" required class="rsc-input" /></div>
          <div><label for="client-profile-last-name" class="rsc-label">Last name</label><input id="client-profile-last-name" value="${user?.last_name || ''}" required class="rsc-input" /></div>
        </div>
        <div><label for="client-profile-phone" class="rsc-label">Phone</label><input id="client-profile-phone" type="tel" value="${user?.phone || ''}" class="rsc-input" /></div>
        <p class="rsc-muted">Email: ${user?.email || '—'}</p>
        <button type="submit" class="rsc-btn rsc-btn-primary rsc-btn-block">Save account details</button>
      </form>

      ${client
        ? html`<form id="client-details-form" class="rsc-card p-4 space-y-3.5">
            <div>
              <h3 class="rsc-eyebrow">Personal details and FICA</h3>
              <p class="rsc-muted mt-1">Required by law for your adviser to act for you. ID on file: ${maskIdNumber(client.id_number)}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${text('cd-id-number', 'South African ID number', client.id_number)}
              ${text('cd-dob', 'Date of birth', client.date_of_birth, 'date')}
            </div>
            <div>
              <label for="cd-marital" class="rsc-label">Marital status</label>
              <select id="cd-marital" class="rsc-input">
                <option value="">Select</option>
                ${MARITAL.map((m) => html`<option value="${m}" ${client.marital_status === m ? 'selected' : ''}>${m}</option>`)}
              </select>
            </div>
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
            <div>
              <label for="cd-province" class="rsc-label">Province</label>
              <select id="cd-province" class="rsc-input">
                <option value="">Select</option>
                ${PROVINCES.map((p) => html`<option value="${p}" ${client.province === p ? 'selected' : ''}>${p}</option>`)}
              </select>
            </div>
            <div>
              <label for="cd-contact" class="rsc-label">Preferred contact method</label>
              <select id="cd-contact" class="rsc-input">
                ${['app', 'email', 'phone'].map((m) => html`<option value="${m}" ${(client.preferred_contact_method || 'app') === m ? 'selected' : ''}>${m === 'app' ? 'In this app' : m === 'email' ? 'Email' : 'Phone'}</option>`)}
              </select>
            </div>
            <button type="submit" class="rsc-btn rsc-btn-primary rsc-btn-block">Save personal details</button>
          </form>`
        : ''}

      <section class="rsc-card p-4">
        <h3 class="rsc-eyebrow">POPIA and privacy</h3>
        <p class="rsc-text mt-2">Royal Square Financial is an authorised financial services provider (FSP #48921) and processes your personal information under the Protection of Personal Information Act (POPIA). Documents you upload are stored privately and are only visible to you and your Royal Square team.</p>
      </section>

      <button id="client-logout-btn" class="rsc-btn rsc-btn-secondary rsc-btn-block">${icon('logout', 'w-4 h-4', 2)}Sign out</button>
    </div>
  `;
}
