import { localStore } from '@supabase-pkg/client';

export function renderAdminProfilePage(): string {
  const profile = localStore.getState().profiles.find((item) => item.id === localStore.getState().currentUser?.id) || localStore.getState().currentUser;
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const phone = profile?.phone || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'RS';

  return `
    <div class="max-w-2xl space-y-5">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A192F] text-lg font-bold text-amber-300">${initials}</div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">${firstName} ${lastName}</h2>
            <p class="text-xs text-slate-500">${profile?.email || ''} · ${profile?.role || 'admin'}</p>
          </div>
        </div>
      </section>
      <form id="admin-profile-form" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Profile details</h3>
          <p class="mt-1 text-xs text-slate-500">These details are used throughout the Royal Desk and client communications.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-xs font-semibold text-slate-600">First name<input id="admin-profile-first-name" value="${firstName}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900" /></label>
          <label class="text-xs font-semibold text-slate-600">Last name<input id="admin-profile-last-name" value="${lastName}" required class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900" /></label>
        </div>
        <label class="block text-xs font-semibold text-slate-600">Phone<input id="admin-profile-phone" type="tel" value="${phone}" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900" /></label>
        <button type="submit" class="rounded-xl bg-[#0A192F] px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-800">Save profile</button>
      </form>
    </div>
  `;
}
