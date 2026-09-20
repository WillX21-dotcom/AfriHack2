import { html } from '@shared/index';
import { icon, type IconName } from './icons';

export type ClientTabKey = 'dashboard' | 'financial' | 'requests' | 'claims' | 'profile';

const TABS: Array<{ key: ClientTabKey; label: string; icon: IconName }> = [
  { key: 'dashboard', label: 'Home', icon: 'home' },
  { key: 'financial', label: 'Finances', icon: 'trend' },
  { key: 'requests', label: 'Requests', icon: 'document' },
  { key: 'claims', label: 'Claims', icon: 'shield' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

/** Returns a markup string: the app shell mounts it with raw(). */
export function renderClientTabBar(activeTab: ClientTabKey): string {
  return html`
    <nav aria-label="Main" class="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5">
      <div class="max-w-3xl mx-auto grid grid-cols-5 px-2">
        ${TABS.map((tab) => {
          const active = tab.key === activeTab;
          return html`
            <button data-tab="${tab.key}" ${active ? html`aria-current="page"` : ''} class="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg ${active ? 'text-[#0A192F]' : 'text-slate-400 hover:text-slate-600'}">
              ${icon(tab.icon, 'w-[22px] h-[22px]', active ? 2.1 : 1.75)}
              <span class="text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}">${tab.label}</span>
            </button>`;
        })}
      </div>
    </nav>
  `.toString();
}
