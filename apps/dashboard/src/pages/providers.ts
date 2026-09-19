import { html, type SafeHtml } from '@shared/html';
import { titleCase } from '@shared/format';
import { adviserService } from '../services/adviser';
import { INPUT_CLASS, emptyState, pageHeading } from '../components/ui';

export function renderDashboardProvidersPage(): SafeHtml {
  const providers = adviserService.getProviders();
  const isAdmin = adviserService.isAdmin();

  return html`
    <div class="space-y-6">
      ${pageHeading('Product Providers', 'Insurers and asset managers your clients hold products with. Keep their contact details current.')}

      ${providers.length === 0 ? html`<div class="bg-white rounded-2xl border border-slate-200">${emptyState('No providers yet')}</div>` : ''}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${providers.map((p) => {
          const usage = adviserService.providerUsage(p.id);
          return html`
            <form data-form="provider" data-id="${p.id}" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <span class="text-[10px] uppercase font-bold text-amber-600 tracking-wider">${titleCase(p.provider_type)}</span>
                  <h3 class="text-sm font-bold text-slate-900 mt-0.5">${p.name}</h3>
                </div>
                <div class="text-right text-[11px] text-slate-500 leading-tight">
                  <div><strong class="text-slate-800">${usage.policies}</strong> policies</div>
                  <div><strong class="text-slate-800">${usage.investments}</strong> investments</div>
                  <div><strong class="text-slate-800">${usage.claims}</strong> claims</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Contact email</span><input name="contact_email" type="email" value="${p.contact_email ?? ''}" class="${INPUT_CLASS}" /></label>
                <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Contact phone</span><input name="contact_phone" type="tel" value="${p.contact_phone ?? ''}" class="${INPUT_CLASS}" /></label>
              </div>
              <button type="submit" class="px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Save contact details</button>
            </form>
          `;
        })}
      </div>

      ${isAdmin
        ? html`
          <form data-form="new-provider" class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">New provider name</span><input name="name" required class="${INPUT_CLASS}" /></label>
            <label class="block"><span class="text-[11px] font-semibold text-slate-600 block mb-1">Type</span>
              <select name="provider_type" class="${INPUT_CLASS}"><option value="insurance">Insurance</option><option value="investments">Investments</option><option value="insurance_and_investments">Insurance & investments</option></select>
            </label>
            <button type="submit" class="px-4 py-2.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">+ Add provider</button>
          </form>
        `
        : ''}
    </div>
  `;
}
