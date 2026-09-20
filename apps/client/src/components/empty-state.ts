import { html, type SafeHtml } from '@shared/index';

export function renderEmptyState(title: string, description: string, action?: { label: string; nav: string }): SafeHtml {
  return html`
    <div class="rsc-card px-6 py-10 text-center">
      <h3 class="rsc-heading">${title}</h3>
      <p class="rsc-muted max-w-xs mx-auto mt-1.5">${description}</p>
      ${action ? html`<button data-nav="${action.nav}" class="rsc-btn rsc-btn-primary rsc-btn-sm mt-5">${action.label}</button>` : ''}
    </div>
  `;
}
