import { html, type SafeHtml } from '@shared/html';
import { fullName, initials, titleCase, formatDate } from '@shared/format';
import { dataStore } from '@supabase-pkg/client';
import { adviserService } from '../services/adviser';
import { INPUT_CLASS } from '../components/ui';

export function renderAdminProfilePage(): SafeHtml {
  const profile = adviserService.getMe();
  const isAdmin = adviserService.isAdmin();
  const users = dataStore.getState().profiles;

  return html`
    <div class="max-w-4xl space-y-5">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A192F] text-lg font-bold text-amber-300">${initials(profile)}</div>
          <div>
            <h2 class="text-lg font-bold text-slate-900">${fullName(profile)}</h2>
            <p class="text-xs text-slate-500">${profile?.email || ''} · ${titleCase(profile?.role || 'staff')}</p>
          </div>
        </div>
      </section>

      <form id="admin-profile-form" class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Profile details</h3>
          <p class="mt-1 text-xs text-slate-500">Shown to clients on their requests, claims and messages.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-xs font-semibold text-slate-600">First name<input id="admin-profile-first-name" value="${profile?.first_name ?? ''}" required class="mt-1 ${INPUT_CLASS}" /></label>
          <label class="text-xs font-semibold text-slate-600">Last name<input id="admin-profile-last-name" value="${profile?.last_name ?? ''}" required class="mt-1 ${INPUT_CLASS}" /></label>
        </div>
        <label class="block text-xs font-semibold text-slate-600">Phone<input id="admin-profile-phone" type="tel" value="${profile?.phone ?? ''}" class="mt-1 ${INPUT_CLASS}" /></label>
        <button type="submit" class="rounded-xl bg-[#0A192F] px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-slate-800">Save profile</button>
      </form>

      ${isAdmin
        ? html`
          <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Team & access</h3>
              <p class="mt-1 text-xs text-slate-500">Roles are enforced by the database. Anyone can register as a client; only an administrator can make them staff. Promote a colleague after they have registered.</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-600">
                <thead class="text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr><th class="py-2.5 pr-3">User</th><th class="py-2.5 pr-3">Joined</th><th class="py-2.5 pr-3">Role</th><th class="py-2.5 pr-3">Active</th><th class="py-2.5 text-right"></th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${users.map((u) => {
                    const self = u.id === profile?.id;
                    return html`
                      <tr>
                        <td class="py-3 pr-3"><span class="font-semibold text-slate-900 block">${fullName(u)}</span><span class="text-[11px] text-slate-400">${u.email}</span></td>
                        <td class="py-3 pr-3 text-slate-500">${formatDate(u.created_at)}</td>
                        <td class="py-3 pr-3">
                          <select data-role-select="${u.id}" ${self ? 'disabled' : ''} class="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60">
                            ${(['client', 'adviser', 'compliance', 'admin'] as const).map((r) => html`<option value="${r}" ${u.role === r ? 'selected' : ''}>${titleCase(r)}</option>`)}
                          </select>
                        </td>
                        <td class="py-3 pr-3"><input type="checkbox" data-active-check="${u.id}" ${u.is_active ? 'checked' : ''} ${self ? 'disabled' : ''} class="rounded border-slate-300" /></td>
                        <td class="py-3 text-right">${self ? html`<span class="text-[11px] text-slate-400">You</span>` : html`<button data-action="save-role" data-user="${u.id}" class="px-3 py-1.5 bg-[#0A192F] text-amber-300 rounded-lg font-semibold hover:bg-slate-800">Save</button>`}</td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            </div>
          </section>
        `
        : ''}
    </div>
  `;
}
