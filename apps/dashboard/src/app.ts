import { renderDashboardSidebar, DashboardRouteKey } from './components/sidebar';
import { renderDashboardHeader } from './components/top-header';
import { renderDashboardOverviewPage } from './pages/dashboard';
import { renderClientsPage } from './pages/clients';
import { renderClientDetailPage } from './pages/client-detail';
import { renderDashboardRequestsPage } from './pages/requests';
import { renderDashboardRequestDetailPage } from './pages/request-detail';
import { renderDashboardClaimsPage } from './pages/claims';
import { renderDashboardClaimDetailPage } from './pages/claim-detail';
import { renderDashboardRemindersPage } from './pages/reminders';
import { renderDashboardProvidersPage } from './pages/providers';
import { renderDashboardAnalyticsPage } from './pages/analytics';
import { renderDashboardCompliancePage } from './pages/compliance';
import { renderAdminProfilePage } from './pages/profile';
import { updateCurrentProfile } from '@shared/profile';
import { adviserService } from './services/adviser';
import { providerService } from './services/provider-service';
import { exportToCSV } from './utils/export-csv';
import { localStore } from '@supabase-pkg/client';
import {
  getSession,
  logout,
  renderSharedAuthScreen,
  attachSharedAuthEvents,
  isAdminPath,
} from '@shared/auth';

export class DashboardApp {
  private container: HTMLElement;
  private currentRoute: DashboardRouteKey = 'overview';
  private routeParam: string | null = null;
  private authMode: 'login' | 'register' = 'login';

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init() {
    this.render();
    this.setupEventListeners();
    localStore.subscribe(() => {
      this.render();
      this.setupEventListeners();
    });
    window.addEventListener('royal-square-auth-change', () => {
      this.render();
      this.setupEventListeners();
    });
  }

  public navigate(route: DashboardRouteKey, param: string | null = null) {
    this.currentRoute = route;
    this.routeParam = param;
    this.render();
    this.setupEventListeners();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public render() {
    const storedSession = getSession();
    const session = isAdminPath() && storedSession?.user.role !== 'admin' ? null : storedSession;
    if (!session) {
      this.container.innerHTML = renderSharedAuthScreen({ mode: this.authMode });
      attachSharedAuthEvents(this.container, {
        mode: this.authMode,
        onModeChange: (newMode) => {
          this.authMode = newMode;
          this.render();
        },
        onBack: () => window.dispatchEvent(new CustomEvent('return-to-landing')),
        onSuccess: (newSession) => {
          if (newSession.user.role === 'admin' || newSession.user.role === 'adviser') {
            this.render();
            this.setupEventListeners();
          }
        },
      });
      return;
    }

    // Role check: if client logged into admin portal
    if (session.user.role === 'client') {
      this.container.innerHTML = `
        <div class="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 class="text-xl font-bold font-serif-royal">Client Account Detected</h2>
          <p class="text-xs text-slate-300 max-w-sm mt-1.5 mb-6">
            You are logged in as <strong>${session.user.email}</strong>. The Royal Desk is reserved for licensed advisers & administrators.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button id="dash-role-sign-out" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-all cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      `;
      this.container.querySelector('#dash-role-sign-out')?.addEventListener('click', () => {
        logout();
        this.render();
      });
      return;
    }

    let content = '';
    let pageTitle = 'Executive Overview';
    let subtitle: string | undefined = undefined;

    switch (this.currentRoute) {
      case 'overview':
        pageTitle = 'Executive Overview & Practice Health';
        subtitle = 'Royal Square Financial Sandton Practice Overview';
        content = renderDashboardOverviewPage();
        break;
      case 'clients':
        pageTitle = 'Private Clients & FICA Directory';
        subtitle = 'Consolidated portfolios and risk categories';
        content = renderClientsPage();
        break;
      case 'client-detail':
        pageTitle = 'Client 360° Portfolio Review';
        subtitle = 'Full balance sheet, policies, investments & documents';
        content = renderClientDetailPage(this.routeParam || 'cli-001');
        break;
      case 'requests':
        pageTitle = 'Service Requests SLA Desk';
        subtitle = 'Track and advance multi-step client requests';
        content = renderDashboardRequestsPage();
        break;
      case 'request-detail':
        pageTitle = 'Request Processing Stepper';
        subtitle = 'Execute next workflow phase and upload resolutions';
        content = renderDashboardRequestDetailPage(this.routeParam || 'req-001');
        break;
      case 'claims':
        pageTitle = 'Motor & Asset Claims Engine';
        subtitle = '17-Stage Santam insurer tracking and assessor coordination';
        content = renderDashboardClaimsPage();
        break;
      case 'claim-detail':
        pageTitle = '17-Stage Claims Investigator';
        subtitle = 'Santam reference, assessment reports, and panel beater bay';
        content = renderDashboardClaimDetailPage(this.routeParam || 'clm-001');
        break;
      case 'reminders':
        pageTitle = 'Compliance Reminders & Deadlines';
        subtitle = 'FICA renewals, annual review mandates, and license tracking';
        content = renderDashboardRemindersPage();
        break;
      case 'providers':
        pageTitle = 'Mock Provider Integration Hub';
        subtitle = 'Santam, Discovery, Allan Gray & Europcar live simulation';
        content = renderDashboardProvidersPage();
        break;
      case 'analytics':
        pageTitle = 'Practice Performance & Wealth Analytics';
        subtitle = 'AUM breakdown, turnaround metrics, and client satisfaction';
        content = renderDashboardAnalyticsPage();
        break;
      case 'compliance':
        pageTitle = 'FAIS & POPIA Regulatory Register';
        subtitle = 'Record of Advice logs and tamper-evident audit trail';
        content = renderDashboardCompliancePage();
        break;
      case 'tasks':
        pageTitle = 'Adviser Tasks & Follow-ups';
        subtitle = 'Daily advisory checklists and review tasks';
        content = renderDashboardRequestsPage();
        break;
      case 'documents':
        pageTitle = 'Document Archive & POPIA Vault';
        subtitle = 'FICA submissions, policy schedules and mandate letters';
        content = renderDashboardCompliancePage();
        break;
      case 'communications':
        pageTitle = 'Client Communications Log';
        subtitle = 'Broadcast announcements, claims alerts and direct messages';
        content = renderDashboardRemindersPage();
        break;
      case 'settings':
        pageTitle = 'Practice Settings & Gateway Configuration';
        subtitle = 'Update your administrator profile and account details';
        content = renderAdminProfilePage();
        break;
      default:
        content = renderDashboardOverviewPage();
    }

    this.container.innerHTML = `
      <div class="dashboard-layout min-h-screen bg-[#F8FAFC] flex relative">
        <!-- Desktop Sidebar (sticky, visible on lg screens) -->
        <div class="hidden lg:flex flex-col shrink-0 w-64 min-h-screen bg-[#0A192F] sticky top-0 h-screen">
          ${renderDashboardSidebar(this.currentRoute)}
        </div>

        <!-- Mobile / Tablet Drawer Sidebar (slides in on tap) -->
        <div id="dash-mobile-drawer" class="fixed inset-0 z-50 lg:hidden pointer-events-none opacity-0 transition-opacity duration-300">
          <div id="dash-drawer-backdrop" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"></div>
          <div class="dash-drawer-panel absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0A192F] shadow-2xl flex flex-col transition-transform duration-300 transform -translate-x-full">
            <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Royal Adviser Menu</span>
              <button id="dash-drawer-close" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto">
              ${renderDashboardSidebar(this.currentRoute)}
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="dashboard-main flex-1 flex flex-col min-w-0">
          ${renderDashboardHeader(pageTitle, subtitle)}
          <main class="dashboard-content flex-1 p-4 sm:p-6 lg:p-8">
            ${content}
          </main>
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    // Mobile Drawer Controls
    const mobileMenuBtn = this.container.querySelector('#dash-mobile-menu-btn');
    const drawer = this.container.querySelector('#dash-mobile-drawer');
    const drawerPanel = drawer?.querySelector('.dash-drawer-panel');
    const drawerCloseBtn = this.container.querySelector('#dash-drawer-close');
    const drawerBackdrop = this.container.querySelector('#dash-drawer-backdrop');

    const openDrawer = () => {
      if (drawer && drawerPanel) {
        drawer.classList.remove('pointer-events-none', 'opacity-0');
        drawer.classList.add('pointer-events-auto', 'opacity-100');
        drawerPanel.classList.remove('-translate-x-full');
        drawerPanel.classList.add('translate-x-0');
      }
    };

    const closeDrawer = () => {
      if (drawer && drawerPanel) {
        drawer.classList.add('pointer-events-none', 'opacity-0');
        drawer.classList.remove('pointer-events-auto', 'opacity-100');
        drawerPanel.classList.add('-translate-x-full');
        drawerPanel.classList.remove('translate-x-0');
      }
    };

    mobileMenuBtn?.addEventListener('click', openDrawer);
    drawerCloseBtn?.addEventListener('click', closeDrawer);
    drawerBackdrop?.addEventListener('click', closeDrawer);

    // Sign out button handler
    this.container.querySelectorAll('[data-dash-action="sign-out"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
        logout();
        this.render();
      });
    });

    // Navigation clicks
    this.container.querySelectorAll('[data-dash-nav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
        const target = btn.getAttribute('data-dash-nav') as DashboardRouteKey;
        const id = btn.getAttribute('data-id');
        this.navigate(target, id);
      });
    });

    // Quick refresh button
    const refreshBtn = this.container.querySelector('#dash-quick-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render();
        this.setupEventListeners();
      });
    }

    const adminProfileForm = this.container.querySelector('#admin-profile-form') as HTMLFormElement | null;
    adminProfileForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await updateCurrentProfile({
          first_name: (this.container.querySelector('#admin-profile-first-name') as HTMLInputElement).value,
          last_name: (this.container.querySelector('#admin-profile-last-name') as HTMLInputElement).value,
          phone: (this.container.querySelector('#admin-profile-phone') as HTMLInputElement).value,
        });
        this.render();
        this.setupEventListeners();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to update profile');
      }
    });

    // Advance Request Step
    const advanceReqBtn = this.container.querySelector('#dash-advance-step-btn');
    if (advanceReqBtn) {
      advanceReqBtn.addEventListener('click', async () => {
        const reqId = advanceReqBtn.getAttribute('data-req-id');
        const step = Number(advanceReqBtn.getAttribute('data-step'));
        if (reqId && step) {
          await adviserService.advanceRequestWorkflow(reqId, step, `Completed by Kagiso Mabena on ${new Date().toLocaleTimeString()}`);
          this.render();
          this.setupEventListeners();
        }
      });
    }

    // Advance Claim Stage (17-Stage engine)
    const advanceClaimBtn = this.container.querySelector('#dash-advance-claim-btn');
    if (advanceClaimBtn) {
      advanceClaimBtn.addEventListener('click', async () => {
        const claimId = advanceClaimBtn.getAttribute('data-claim-id');
        const nextStatus = advanceClaimBtn.getAttribute('data-next-status');
        const stageLabel = advanceClaimBtn.getAttribute('data-stage-label');
        if (claimId && nextStatus && stageLabel) {
          await adviserService.advanceClaimStage(
            claimId,
            nextStatus,
            `Stage Advanced: ${stageLabel}`,
            `Claim status transitioned to ${stageLabel} via Santam Insurer Gateway. Assessor notes updated.`
          );
          this.render();
          this.setupEventListeners();
        }
      });
    }

    // Resolve Reminder
    this.container.querySelectorAll('[data-action="resolve-reminder"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          await adviserService.completeReminder(id);
          this.render();
          this.setupEventListeners();
        }
      });
    });

    // Generate Cross-Border Vehicle Clearance Letter
    this.container.querySelectorAll('[data-action="generate-border-letter"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const clientId = btn.getAttribute('data-client') || 'cli-001';
        const doc = await adviserService.generateOfficialDocument(
          clientId,
          'cross_border_letter',
          'Santam-Vehicle-Cross-Border-Clearance-SADC'
        );
        alert(`Generated Official Border Letter: ${doc.name} (Stored in encrypted vault)`);
        this.render();
        this.setupEventListeners();
      });
    });

    // Generate Tax Schedule
    this.container.querySelectorAll('[data-action="generate-tax-cert"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const clientId = btn.getAttribute('data-client') || 'cli-001';
        const doc = await adviserService.generateOfficialDocument(
          clientId,
          'tax_schedule',
          'IRPS-Consolidated-Tax-Assessment-Schedule-2025'
        );
        alert(`Generated Tax Schedule: ${doc.name} (Stored in encrypted vault)`);
        this.render();
        this.setupEventListeners();
      });
    });

    // Export CSV
    const exportBtn = this.container.querySelector('#export-clients-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const clients = adviserService.getClients().map((c) => ({
          client_number: c.client_number,
          first_name: c.profile?.first_name,
          last_name: c.profile?.last_name,
          id_number: c.id_number,
          risk_profile: c.risk_profile,
          status: c.onboarding_completed ? 'Active' : 'Pending',
        }));
        exportToCSV('royal-square-clients-register', clients);
      });
    }

    // Provider manual sync simulation
    this.container.querySelectorAll('[data-action="sync-provider"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const pId = btn.getAttribute('data-provider') || '';
        btn.textContent = 'Syncing...';
        await providerService.simulateSync(pId);
        btn.textContent = '✓ Synced';
        setTimeout(() => {
          this.render();
          this.setupEventListeners();
        }, 800);
      });
    });

    // Provider test webhook simulation
    this.container.querySelectorAll('[data-action="test-webhook"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pId = btn.getAttribute('data-provider') || '';
        alert(`Inbound Webhook simulated from ${pId.toUpperCase()} Gateway! Status and quotes synchronized.`);
        this.render();
        this.setupEventListeners();
      });
    });

    // Client search filter
    const searchInput = this.container.querySelector('#client-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const tbody = this.container.querySelector('#clients-table-body');
        if (tbody) {
          const rows = tbody.querySelectorAll('tr');
          rows.forEach((row) => {
            const text = row.textContent?.toLowerCase() || '';
            row.style.display = text.includes(query) ? '' : 'none';
          });
        }
      });
    }
  }
}
