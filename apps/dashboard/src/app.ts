import { html, type SafeHtml } from '@shared/html';
import { dataStore } from '@supabase-pkg/client';
import { openDocument } from '@supabase-pkg/helpers';
import { getSession, logout, renderSharedAuthScreen, attachSharedAuthEvents, isStaff } from '@shared/auth';
import { updateCurrentProfile } from '@shared/profile';
import type { DocumentType } from '@shared/types/document';
import { fullName } from '@shared/format';
import { renderDashboardSidebar, type DashboardRouteKey } from './components/sidebar';
import { renderDashboardHeader } from './components/top-header';
import { renderRecordModal, type ModalState } from './components/ui';
import { renderDocumentReviewModal, type DocumentReviewState } from './components/document-review';
import { renderDashboardOverviewPage } from './pages/dashboard';
import { renderClientsPage } from './pages/clients';
import { renderClientDetailPage } from './pages/client-detail';
import { renderDashboardRequestsPage } from './pages/requests';
import { renderDashboardRequestDetailPage } from './pages/request-detail';
import { renderDashboardClaimsPage } from './pages/claims';
import { renderDashboardClaimDetailPage } from './pages/claim-detail';
import { renderDashboardTasksPage } from './pages/tasks';
import { renderDashboardRemindersPage } from './pages/reminders';
import { renderDashboardDocumentsPage } from './pages/documents';
import { renderDashboardCommunicationsPage } from './pages/communications';
import { renderDashboardProvidersPage } from './pages/providers';
import { renderDashboardAnalyticsPage } from './pages/analytics';
import { renderDashboardCompliancePage } from './pages/compliance';
import { renderDashboardNotificationsPage } from './pages/notifications';
import { renderDashboardSearchPage } from './pages/search';
import { renderAdminProfilePage } from './pages/profile';
import { adviserService } from './services/adviser';
import { getRecordSchema, readRecordForm } from './services/records';
import { exportToCSV } from './utils/export-csv';
import { showToast } from './utils/toast';

const PAGE_TITLES: Record<DashboardRouteKey, [string, string]> = {
  overview: ['Executive Overview', 'Live view of your practice'],
  clients: ['Private Clients & FICA', 'Registered clients and their wealth'],
  'client-detail': ['Client 360° Review', 'Balance sheet, cover, documents and history'],
  requests: ['Service Requests', 'Track and progress client requests'],
  'request-detail': ['Request Processing', 'Advance the workflow and deliver documents'],
  claims: ['Claims Centre', 'Motor claims and insurer coordination'],
  'claim-detail': ['Claim Management', 'Stage, assessor, repairer and timeline'],
  tasks: ['Tasks & Follow-ups', 'Your work queue'],
  reminders: ['Compliance Reminders', 'Deadlines and renewals'],
  documents: ['Document Register', 'FICA submissions and client uploads'],
  communications: ['Client Messages', 'Direct conversations with clients'],
  providers: ['Product Providers', 'Insurers and asset managers'],
  analytics: ['Practice Analytics', 'Performance computed from live data'],
  compliance: ['Compliance & Audit', 'FICA status and change history'],
  notifications: ['Notifications', 'Everything that needs your attention'],
  search: ['Search', 'Clients, requests and claims'],
  settings: ['Settings', 'Your profile and team access'],
};

interface RouteContext {
  requestId?: string;
  claimId?: string;
}

export class DashboardApp {
  private container: HTMLElement;
  private currentRoute: DashboardRouteKey = 'overview';
  private routeParam: string | null = null;
  private routeContext: RouteContext = {};
  private searchQuery = '';
  private authMode: 'login' | 'register' = 'login';
  private modal: ModalState | null = null;
  private docReview: DocumentReviewState | null = null;
  private drawerOpen = false;
  private destroyed = false;
  private renderQueued = false;
  private renderDeferred = false;
  private markingRead = new Set<string>();
  private cleanups: Array<() => void> = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.bindEvents();
    this.render();

    this.cleanups.push(dataStore.subscribe(() => this.scheduleRender()));
    const onAuth = () => this.render();
    window.addEventListener('royal-square-auth-change', onAuth);
    this.cleanups.push(() => window.removeEventListener('royal-square-auth-change', onAuth));
  }

  /** Remove every store and window listener this instance registered. */
  public destroy(): void {
    this.destroyed = true;
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.container.innerHTML = '';
  }

  public navigate(route: DashboardRouteKey, param: string | null = null, context: RouteContext = {}): void {
    this.currentRoute = route;
    this.routeParam = param;
    this.routeContext = context;
    this.drawerOpen = false;
    this.modal = null;
    this.docReview = null;
    this.render();
    window.scrollTo({ top: 0 });
  }

  // ------------------------------------------------------------------ rendering

  private scheduleRender(): void {
    if (this.destroyed || this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      if (this.destroyed) return;
      if (this.isTyping()) {
        this.renderDeferred = true; // refresh once the user leaves the field
        return;
      }
      this.render();
    });
  }

  private isTyping(): boolean {
    const el = document.activeElement;
    return !!el && this.container.contains(el) && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && (el as HTMLInputElement).type !== 'button';
  }

  /** Snapshot user-entered values so a background refresh never wipes a half-written form. */
  private captureFields(): Map<string, string | boolean> {
    const saved = new Map<string, string | boolean>();
    this.container.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach((el) => {
      if (el.type === 'file' || el.type === 'password') return;
      const form = el.closest('form');
      const scope = form ? form.id || `${form.dataset.form}:${form.dataset.id || ''}:${form.dataset.client || ''}` : '';
      const key = `${scope}|${el.id || el.name}`;
      if (key.endsWith('|')) return;
      saved.set(key, el.type === 'checkbox' ? el.checked : el.value);
    });
    return saved;
  }

  private restoreFields(saved: Map<string, string | boolean>): void {
    this.container.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach((el) => {
      if (el.type === 'file' || el.type === 'password') return;
      const form = el.closest('form');
      const scope = form ? form.id || `${form.dataset.form}:${form.dataset.id || ''}:${form.dataset.client || ''}` : '';
      const key = `${scope}|${el.id || el.name}`;
      if (!saved.has(key)) return;
      const value = saved.get(key)!;
      if (el.type === 'checkbox') el.checked = value as boolean;
      else if (typeof value === 'string' && value !== '') el.value = value;
    });
  }

  private pageContent(): SafeHtml {
    switch (this.currentRoute) {
      case 'clients':
        return renderClientsPage();
      case 'client-detail':
        return renderClientDetailPage(this.routeParam || '');
      case 'requests':
        return renderDashboardRequestsPage();
      case 'request-detail':
        return renderDashboardRequestDetailPage(this.routeParam || '');
      case 'claims':
        return renderDashboardClaimsPage();
      case 'claim-detail':
        return renderDashboardClaimDetailPage(this.routeParam || '');
      case 'tasks':
        return renderDashboardTasksPage();
      case 'reminders':
        return renderDashboardRemindersPage();
      case 'documents':
        return renderDashboardDocumentsPage();
      case 'communications':
        return renderDashboardCommunicationsPage(this.routeParam, this.routeContext);
      case 'providers':
        return renderDashboardProvidersPage();
      case 'analytics':
        return renderDashboardAnalyticsPage();
      case 'compliance':
        return renderDashboardCompliancePage();
      case 'notifications':
        return renderDashboardNotificationsPage();
      case 'search':
        return renderDashboardSearchPage(this.searchQuery);
      case 'settings':
        return renderAdminProfilePage();
      default:
        return renderDashboardOverviewPage();
    }
  }

  public render(): void {
    if (this.destroyed) return;
    this.renderDeferred = false;

    const session = getSession();
    if (!session) {
      this.container.innerHTML = renderSharedAuthScreen({ mode: this.authMode });
      attachSharedAuthEvents(this.container, {
        mode: this.authMode,
        onModeChange: (mode) => {
          this.authMode = mode;
          this.render();
        },
        onBack: () => window.dispatchEvent(new CustomEvent('return-to-landing')),
        onSuccess: () => this.render(),
      });
      return;
    }

    if (!isStaff(session.user.role)) {
      this.container.innerHTML = html`
        <div class="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 class="text-xl font-bold font-serif-royal">Client account detected</h2>
          <p class="text-xs text-slate-300 max-w-sm mt-1.5 mb-6">You are signed in as <strong>${session.user.email}</strong>. The Royal Desk is reserved for Royal Square staff. Ask an administrator to grant you access if you should be here.</p>
          <button data-dash-action="sign-out" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-all cursor-pointer">Sign out</button>
        </div>
      `.toString();
      return;
    }

    const saved = this.captureFields();
    const focusId = document.activeElement && this.container.contains(document.activeElement) ? (document.activeElement as HTMLElement).id : '';
    const [title, subtitle] = PAGE_TITLES[this.currentRoute] || PAGE_TITLES.overview;

    this.container.innerHTML = html`
      <div class="dashboard-layout min-h-screen bg-[#F8FAFC] flex relative">
        <div class="hidden lg:flex flex-col shrink-0 w-64 min-h-screen bg-[#0A192F] sticky top-0 h-screen">${renderDashboardSidebar(this.currentRoute)}</div>

        <div id="dash-mobile-drawer" class="fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${this.drawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}">
          <div id="dash-drawer-backdrop" class="absolute inset-0 bg-slate-900/60"></div>
          <div class="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0A192F] shadow-2xl flex flex-col transition-transform duration-300 transform ${this.drawerOpen ? 'translate-x-0' : '-translate-x-full'}">
            <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Royal Desk</span>
              <button id="dash-drawer-close" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10" aria-label="Close menu">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto">${renderDashboardSidebar(this.currentRoute)}</div>
          </div>
        </div>

        <div class="dashboard-main flex-1 flex flex-col min-w-0">
          ${renderDashboardHeader(title, subtitle)}
          <main class="dashboard-content flex-1 p-4 sm:p-6 lg:p-8">${this.pageContent()}</main>
        </div>
        ${this.modal ? renderRecordModal(this.modal) : ''}
        ${this.reviewModal()}
      </div>
    `.toString();

    this.restoreFields(saved);
    if (focusId) (this.container.querySelector(`#${CSS.escape(focusId)}`) as HTMLElement | null)?.focus();
    this.afterRender();
  }

  private reviewModal(): SafeHtml | '' {
    if (!this.docReview) return '';
    const doc = adviserService.getDocuments().find((d) => d.id === this.docReview!.docId);
    return doc ? renderDocumentReviewModal(doc, this.docReview) : '';
  }

  private async openDocReview(docId: string): Promise<void> {
    this.docReview = { docId, events: null };
    this.render();
    await this.loadDocReviewEvents(docId);
  }

  private async loadDocReviewEvents(docId: string): Promise<void> {
    try {
      const events = await adviserService.getDocumentEvents(docId);
      if (this.docReview?.docId !== docId) return; // closed or switched while loading
      this.docReview = { docId, events };
    } catch (error) {
      if (this.docReview?.docId !== docId) return;
      this.docReview = { docId, events: [] };
      showToast(error instanceof Error ? error.message : 'Could not load the engine trace.', 'error');
    }
    this.render();
  }

  private afterRender(): void {
    if (this.currentRoute === 'requests') this.applyRequestFilter(this.activeChip('request') || 'open');
    if (this.currentRoute === 'clients') this.applyClientFilter();
    if (this.currentRoute === 'documents') this.applyDocumentFilter();

    if (this.currentRoute === 'communications' && this.routeParam) {
      const thread = this.container.querySelector('#message-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
      const unread = adviserService.getConversations().find((c) => c.clientId === this.routeParam)?.unread ?? 0;
      const key = `${this.routeParam}:${unread}`;
      if (unread > 0 && !this.markingRead.has(key)) {
        this.markingRead.add(key);
        adviserService.markThreadRead(this.routeParam).catch((e) => console.warn('Could not mark thread read:', e)).finally(() => this.markingRead.delete(key));
      }
    }
  }

  // ------------------------------------------------------------------ filters (DOM only)

  private activeChip(kind: 'request' | 'doc'): string | null {
    const attr = kind === 'request' ? 'data-request-filter' : 'data-doc-filter';
    const active = this.container.querySelector(`[${attr}].bg-\\[\\#0A192F\\]`);
    return active?.getAttribute(attr) ?? null;
  }

  private setChip(kind: 'request' | 'doc', value: string): void {
    const attr = kind === 'request' ? 'data-request-filter' : 'data-doc-filter';
    this.container.querySelectorAll<HTMLElement>(`[${attr}]`).forEach((chip) => {
      const on = chip.getAttribute(attr) === value;
      chip.classList.toggle('bg-[#0A192F]', on);
      chip.classList.toggle('text-amber-300', on);
      chip.classList.toggle('border-[#0A192F]', on);
      chip.classList.toggle('bg-white', !on);
      chip.classList.toggle('text-slate-600', !on);
      chip.classList.toggle('border-slate-200', !on);
    });
  }

  private applyRequestFilter(filter: string): void {
    this.setChip('request', filter);
    this.container.querySelectorAll<HTMLElement>('#requests-table-body tr').forEach((row) => {
      const show = filter === 'all' || (filter === 'open' && row.dataset.open === 'true') || (filter === 'overdue' && row.dataset.overdue === 'true') || (filter === 'completed' && row.dataset.status === 'completed');
      row.style.display = show ? '' : 'none';
    });
  }

  private applyClientFilter(): void {
    const query = (this.container.querySelector('#client-search-input') as HTMLInputElement | null)?.value.toLowerCase().trim() || '';
    const risk = (this.container.querySelector('#client-risk-filter') as HTMLSelectElement | null)?.value || 'all';
    this.container.querySelectorAll<HTMLElement>('#clients-table-body tr').forEach((row) => {
      const matchesText = !query || (row.textContent || '').toLowerCase().includes(query);
      const matchesRisk = risk === 'all' || row.dataset.risk === risk;
      row.style.display = matchesText && matchesRisk ? '' : 'none';
    });
  }

  private applyDocumentFilter(): void {
    const chip = this.activeChip('doc') || 'all';
    this.setChip('doc', chip);
    const query = (this.container.querySelector('#doc-search-input') as HTMLInputElement | null)?.value.toLowerCase().trim() || '';
    this.container.querySelectorAll<HTMLElement>('#documents-table-body tr').forEach((row) => {
      const matchesChip = chip === 'all' || (chip === 'pending' && row.dataset.verified === 'false') || (chip === 'review' && row.dataset.status === 'under_review');
      const matchesText = !query || (row.dataset.search || '').includes(query);
      row.style.display = matchesChip && matchesText ? '' : 'none';
    });
  }

  // ------------------------------------------------------------------ events (delegated; bound once)

  private on<K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void): void {
    const listener = handler as EventListener;
    this.container.addEventListener(type, listener);
    this.cleanups.push(() => this.container.removeEventListener(type, listener));
  }

  private async run(action: () => Promise<unknown>, success?: string): Promise<boolean> {
    try {
      await action();
      if (success) showToast(success, 'success');
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Something went wrong. Please try again.', 'error');
      return false;
    }
  }

  private bindEvents(): void {
    this.on('click', (event) => {
      const target = event.target as HTMLElement;

      if (target.closest('#dash-mobile-menu-btn')) {
        this.drawerOpen = true;
        return this.render();
      }
      if (target.closest('#dash-drawer-close') || target.closest('#dash-drawer-backdrop')) {
        this.drawerOpen = false;
        return this.render();
      }

      const nav = target.closest<HTMLElement>('[data-dash-nav]');
      if (nav) {
        event.preventDefault();
        return this.navigate(nav.dataset.dashNav as DashboardRouteKey, nav.dataset.id || null, { requestId: nav.dataset.request || undefined, claimId: nav.dataset.claim || undefined });
      }

      if (target.closest('[data-dash-action="sign-out"]')) {
        event.preventDefault();
        return void logout();
      }

      const requestChip = target.closest<HTMLElement>('[data-request-filter]');
      if (requestChip) return this.applyRequestFilter(requestChip.dataset.requestFilter || 'all');
      const docChip = target.closest<HTMLElement>('[data-doc-filter]');
      if (docChip) {
        this.setChip('doc', docChip.dataset.docFilter || 'all');
        return this.applyDocumentFilter();
      }

      if (target.closest('#export-clients-csv-btn')) return this.exportClients();
      if (target.closest('#copy-signup-link-btn')) return void this.copySignupLink();
      if (target.closest('#mark-all-notifications-btn')) {
        const ids = adviserService.getNotifications().filter((n) => !n.is_read).map((n) => n.id);
        return void this.run(() => adviserService.markNotificationsRead(ids));
      }

      const actionEl = target.closest<HTMLElement>('[data-action]');
      if (actionEl) return void this.handleAction(actionEl);
    });

    this.on('submit', (event) => {
      const form = event.target as HTMLFormElement;
      event.preventDefault();
      void this.handleSubmit(form);
    });

    this.on('change', (event) => {
      const el = event.target as HTMLElement;
      if (el.id === 'assign-adviser-select') {
        const select = el as HTMLSelectElement;
        if (select.value) void this.run(() => adviserService.assignAdviser(select.dataset.client!, select.value), 'Client reassigned');
      } else if (el.id === 'new-conversation-select') {
        const value = (el as HTMLSelectElement).value;
        if (value) this.navigate('communications', value);
      } else if (el.id === 'client-risk-filter') {
        this.applyClientFilter();
      }
    });

    this.on('input', (event) => {
      const id = (event.target as HTMLElement).id;
      if (id === 'client-search-input') this.applyClientFilter();
      else if (id === 'doc-search-input') this.applyDocumentFilter();
    });

    // A refresh that was held back while the user was typing runs as soon as they leave the field.
    this.on('focusout', () => {
      setTimeout(() => {
        if (this.renderDeferred && !this.isTyping()) this.render();
      }, 0);
    });
  }

  private async handleAction(el: HTMLElement): Promise<void> {
    const { action, id = '' } = el.dataset;

    switch (action) {
      case 'edit-record': {
        const table = el.dataset.table!;
        let clientId = el.dataset.client!;
        if (clientId === '__select__') clientId = (this.container.querySelector('#new-record-client') as HTMLSelectElement | null)?.value || '';
        if (!clientId || !getRecordSchema(table)) return;
        const rows = (dataStore.getState() as any)[table] as Array<Record<string, unknown>>;
        this.modal = { table, clientId, id: id || null, row: id ? rows.find((r) => r.id === id) ?? null : null };
        return this.render();
      }
      case 'close-modal':
        this.modal = null;
        return this.render();
      case 'delete-record': {
        if (!this.modal?.id || !window.confirm('Delete this record? This cannot be undone (the change is kept in the audit log).')) return;
        const { table, id: recordId } = this.modal;
        if (await this.run(() => adviserService.deleteRecord(table, recordId), 'Record deleted')) {
          this.modal = null;
          this.render();
        }
        return;
      }
      case 'resolve-reminder':
        return void this.run(() => adviserService.completeReminder(id), 'Reminder actioned');
      case 'task-status':
        return void this.run(() => adviserService.setTaskStatus(id, el.dataset.status as 'pending' | 'in_progress' | 'completed'));
      case 'verify-doc': {
        const verified = el.dataset.verified === 'true';
        return void this.run(() => adviserService.verifyDocument(id, verified), verified ? 'Document verified. The client has been notified.' : 'Verification removed');
      }
      case 'review-doc':
        return this.openDocReview(id);
      case 'close-doc-review':
        this.docReview = null;
        return this.render();
      case 'approve-doc': {
        const fields: Record<string, string> = {};
        this.container.querySelectorAll<HTMLInputElement>('[data-review-field]').forEach((input) => {
          fields[input.dataset.reviewField!] = input.value.trim();
        });
        const hasFields = Object.keys(fields).length > 0;
        if (await this.run(() => adviserService.approveDocument(id, hasFields ? fields : undefined), 'Document approved. The client has been notified.')) {
          this.docReview = null;
          this.render();
        }
        return;
      }
      case 'reject-doc': {
        const reason = (this.container.querySelector('#review-reject-reason') as HTMLInputElement | null)?.value ?? '';
        if (await this.run(() => adviserService.rejectDocument(id, reason), 'Document rejected. The client has been asked to upload again.')) {
          this.docReview = null;
          this.render();
        }
        return;
      }
      case 'open-doc': {
        const doc = adviserService.getDocuments().find((d) => d.id === id);
        if (doc) await this.run(() => openDocument(doc));
        return;
      }
      case 'toggle-onboarding': {
        const complete = el.dataset.value === 'true';
        return void this.run(() => adviserService.updateClient(el.dataset.client!, { onboarding_completed: complete }), complete ? 'Onboarding marked complete' : 'Onboarding reopened');
      }
      case 'save-role': {
        const userId = el.dataset.user!;
        const role = (this.container.querySelector(`[data-role-select="${CSS.escape(userId)}"]`) as HTMLSelectElement).value;
        const active = (this.container.querySelector(`[data-active-check="${CSS.escape(userId)}"]`) as HTMLInputElement).checked;
        const name = adviserService.profileName(userId);
        if (!window.confirm(`Set ${name} to ${role}${active ? '' : ' and deactivate their account'}?`)) return;
        return void this.run(() => adviserService.setUserRole(userId, role, active), 'Access updated');
      }
      case 'open-notification': {
        await this.run(() => adviserService.markNotificationsRead([id]));
        const route = el.dataset.route as DashboardRouteKey;
        if (route) this.navigate(route, el.dataset.target || null);
        return;
      }
    }
  }

  private async handleSubmit(form: HTMLFormElement): Promise<void> {
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit?.disabled) return;
    if (submit) submit.disabled = true;
    try {
      await this.dispatchSubmit(form);
    } finally {
      if (submit && submit.isConnected) submit.disabled = false;
    }
  }

  private async dispatchSubmit(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? '').trim();
    const orNull = (name: string) => text(name) || null;

    if (form.id === 'dash-search-form') {
      const query = (form.querySelector('input') as HTMLInputElement).value.trim();
      if (!query) return;
      this.searchQuery = query;
      return this.navigate('search');
    }

    if (form.id === 'record-form') {
      const schema = getRecordSchema(form.dataset.table!);
      const modal = this.modal;
      if (!schema || !modal) return;
      try {
        const values = readRecordForm(schema, form);
        const isNew = !form.dataset.id;
        if (schema.clientScoped) values.client_id = form.dataset.client;
        if (isNew && schema.onCreate) Object.assign(values, schema.onCreate());
        await adviserService.saveRecord(schema.table, form.dataset.id || null, values);
        this.modal = null;
        this.render();
        showToast(`${schema.singular} saved`, 'success');
      } catch (error) {
        // Keep the modal open with what the user typed, and say what went wrong.
        this.modal = { ...modal, error: error instanceof Error ? error.message : 'Unable to save', row: { ...(modal.row || {}), ...Object.fromEntries(data.entries()) } };
        this.render();
      }
      return;
    }

    if (form.id === 'client-details-form') {
      const values: Record<string, unknown> = {
        id_number: orNull('id_number'),
        date_of_birth: orNull('date_of_birth'),
        marital_status: orNull('marital_status'),
        occupation: orNull('occupation'),
        employer: orNull('employer'),
        risk_profile: orNull('risk_profile'),
        address_line_1: orNull('address_line_1'),
        address_line_2: orNull('address_line_2'),
        city: orNull('city'),
        province: orNull('province'),
        postal_code: orNull('postal_code'),
        preferred_contact_method: text('preferred_contact_method') || 'app',
        notes: orNull('notes'),
      };
      await this.run(() => adviserService.updateClient(form.dataset.client!, values), 'Client file saved');
      return;
    }

    if (form.id === 'advance-request-form') {
      await this.run(() => adviserService.advanceRequest(form.dataset.request!, text('notes')), 'Step completed. The client has been notified.');
      return;
    }

    if (form.id === 'request-status-form') {
      await this.run(() => adviserService.setRequestStatus(form.dataset.request!, text('status'), text('note')), 'Status updated. The client has been notified.');
      return;
    }

    if (form.id === 'claim-status-form') {
      await this.run(() => adviserService.setClaimStatus(form.dataset.claim!, text('status'), text('description')), 'Claim stage updated. The client has been notified.');
      return;
    }

    if (form.id === 'claim-note-form') {
      const ok = await this.run(() => adviserService.addInternalClaimNote(form.dataset.claim!, text('note')), 'Internal note added (not visible to the client)');
      if (ok) (form.querySelector('textarea') as HTMLTextAreaElement).value = '';
      return;
    }

    if (form.id === 'claim-details-form') {
      const iso = (name: string) => {
        const value = text(name);
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d.toISOString();
      };
      const values = {
        insurer_reference: orNull('insurer_reference'),
        provider_id: orNull('provider_id'),
        handler_name: orNull('handler_name'),
        handler_contact: orNull('handler_contact'),
        assessment_date: iso('assessment_date'),
        repairer_name: orNull('repairer_name'),
        repair_date: iso('repair_date'),
        hire_car_provider: orNull('hire_car_provider'),
        hire_car_start: iso('hire_car_start'),
        hire_car_end: iso('hire_car_end'),
        police_case_number: orNull('police_case_number'),
        police_station: orNull('police_station'),
        hire_car_required: data.get('hire_car_required') === 'on',
      };
      await this.run(() => adviserService.updateClaim(form.dataset.claim!, { ...values, police_reported: Boolean(values.police_case_number) }), 'Claim details saved');
      return;
    }

    if (form.id === 'message-form') {
      const body = text('body');
      if (!body) return;
      const ok = await this.run(() => adviserService.sendMessage(form.dataset.client!, body, { requestId: form.dataset.request || undefined, claimId: form.dataset.claim || undefined }));
      if (ok) (form.querySelector('textarea') as HTMLTextAreaElement).value = '';
      return;
    }

    if (form.id === 'admin-profile-form') {
      await this.run(
        () =>
          updateCurrentProfile({
            first_name: (this.container.querySelector('#admin-profile-first-name') as HTMLInputElement).value,
            last_name: (this.container.querySelector('#admin-profile-last-name') as HTMLInputElement).value,
            phone: (this.container.querySelector('#admin-profile-phone') as HTMLInputElement).value,
          }),
        'Profile updated'
      );
      return;
    }

    switch (form.dataset.form) {
      case 'staff-upload': {
        const file = (form.querySelector('input[type="file"]') as HTMLInputElement).files?.[0];
        if (!file) return showToast('Choose a file to upload.', 'error');
        const ok = await this.run(
          () => adviserService.uploadForClient({ clientId: form.dataset.client!, file, documentType: text('document_type') as DocumentType, requestId: form.dataset.request || null, claimId: form.dataset.claim || null }),
          'Document uploaded. The client has been notified.'
        );
        if (ok) form.reset();
        return;
      }
      case 'provider':
        await this.run(() => adviserService.updateProvider(form.dataset.id!, { contact_email: orNull('contact_email'), contact_phone: orNull('contact_phone') }), 'Provider updated');
        return;
      case 'new-provider': {
        const ok = await this.run(() => adviserService.saveRecord('providers', null, { name: text('name'), provider_type: text('provider_type'), api_enabled: false, mock_enabled: false }), 'Provider added');
        if (ok) form.reset();
        return;
      }
    }
  }

  // ------------------------------------------------------------------ small actions

  private exportClients(): void {
    const rows = adviserService.getClients().map((c) => {
      const totals = adviserService.clientTotals(c.id);
      return {
        client_number: c.client_number,
        name: fullName(c.profile, ''),
        email: c.profile?.email,
        phone: c.profile?.phone,
        id_number: c.id_number,
        risk_profile: c.risk_profile,
        adviser: c.adviser ? fullName(c.adviser) : '',
        fica: adviserService.ficaStatus(c.id),
        onboarded: c.onboarding_completed ? 'Yes' : 'No',
        net_worth_zar: totals.netWorth,
      };
    });
    if (rows.length === 0) return showToast('There are no clients to export yet.', 'info');
    exportToCSV(`royal-square-clients-${new Date().toISOString().slice(0, 10)}`, rows);
  }

  private async copySignupLink(): Promise<void> {
    const link = window.location.origin;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Sign-up link copied. Clients register on this page.', 'success');
    } catch {
      window.prompt('Copy this client sign-up link:', link);
    }
  }
}
