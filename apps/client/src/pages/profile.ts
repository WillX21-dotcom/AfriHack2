import { clientService } from '../services/client';
import { maskIDNumber } from '../utils/formatters';
import { localStore } from '@supabase-pkg/client';

export function renderProfilePage(): string {
  const client = clientService.getCurrentClient();
  const profile = localStore.getState().profiles.find((item) => item.id === localStore.getState().currentUser?.id) || client?.profile;
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const phone = profile?.phone || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'RS';

  return `
    <div class="space-y-4 pb-24">
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
        <div class="w-16 h-16 rounded-full bg-[#0A192F] text-amber-300 font-serif-royal font-bold text-xl flex items-center justify-center mx-auto shadow-md">
          ${initials}
        </div>
        <h2 class="text-base font-bold text-slate-900 mt-2">${firstName} ${lastName}</h2>
        <span class="text-xs font-mono text-slate-400 font-semibold">${client?.client_number || 'Client account'}</span>
        <div class="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mt-2 border border-emerald-200">
          <span>✓ Verified Private Client</span>
        </div>
      </div>

      <form id="client-profile-form" class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Profile Details</h3>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs text-slate-500">First name<input id="client-profile-first-name" value="${firstName}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
          <label class="text-xs text-slate-500">Last name<input id="client-profile-last-name" value="${lastName}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
        </div>
        <label class="text-xs text-slate-500">Phone<input id="client-profile-phone" type="tel" value="${phone}" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" /></label>
        <button type="submit" class="w-full rounded-xl bg-[#0A192F] py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-800">Save Profile</button>
      </form>

      <!-- Personal & Residential Info -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Personal Details & FICA</h3>
        
        <div class="space-y-2 text-xs divide-y divide-slate-100">
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">South African ID</span>
            <span class="font-mono font-semibold text-slate-800">${maskIDNumber(client?.id_number)}</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">Date of Birth</span>
            <span class="font-semibold text-slate-800">${client?.date_of_birth || '1985-06-12'}</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">Marital Status</span>
            <span class="font-semibold text-slate-800">${client?.marital_status || 'Community of Property'}</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">Occupation</span>
            <span class="font-semibold text-slate-800">${client?.occupation || 'Not provided'}</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">Residential Address</span>
            <span class="font-semibold text-slate-800 text-right max-w-xs">${client?.address_line_1 || 'Not provided'}${client?.city ? `, ${client.city}` : ''}</span>
          </div>
        </div>
      </div>

      <!-- POPIA & Privacy Compliance -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide">POPIA & Regulatory Protection</h3>
        <p class="text-xs text-slate-500 leading-relaxed">
          Royal Square Financial is a licensed Financial Services Provider (FSP #48921) strictly complying with the Protection of Personal Information Act (POPIA). Your financial schedules and identity documents are encrypted end-to-end.
        </p>
        <div class="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <span class="text-emerald-700 font-semibold">Consent Status: Active</span>
          <button data-nav="documents" class="text-amber-700 font-bold hover:underline">View Consent Cert →</button>
        </div>
      </div>

      <!-- Session Controls -->
      <div class="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
        <button id="client-logout-btn" class="w-full py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  `;
}
