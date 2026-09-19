import { renderClientHeader } from './components/header';
import { renderClientTabBar, ClientTabKey } from './components/tab-bar';
import { renderCameraCaptureModal } from './components/camera-capture';
import { renderClientDashboardPage } from './pages/dashboard';
import { renderFinancialOverviewPage } from './pages/financial-overview';
import { renderGoalsPage } from './pages/goals';
import { renderRequestsPage } from './pages/requests';
import { renderRequestDetailPage } from './pages/request-detail';
import { renderCreateRequestPage } from './pages/create-request';
import { renderClaimsPage } from './pages/claims';
import { renderClaimDetailPage } from './pages/claim-detail';
import { renderReportAccidentPage } from './pages/report-accident';
import { renderDocumentsPage } from './pages/documents';
import { renderNotificationsPage } from './pages/notifications';
import { renderProfilePage } from './pages/profile';
import { renderOnboardingPage } from './pages/onboarding';
import { showToast } from './components/toast';
import { authService } from './services/auth';
import { updateCurrentProfile } from '@shared/profile';
import { requestService } from './services/request';
import { claimService } from './services/claim';
import { financialService } from './services/financial';
import { documentService } from './services/document';
import { notificationService } from './services/notification';
import { getCurrentCoordinates } from './utils/geolocation';
import { SimpleAudioRecorder } from './utils/audio-recorder';
import { localStore } from '@supabase-pkg/client';
import {
  getSession,
  logout,
  renderSharedAuthScreen,
  attachSharedAuthEvents,
} from '@shared/auth';

export class ClientApp {
  private container: HTMLElement;
  private currentRoute: string = 'dashboard';
  private routeParam: string | null = null;
  private audioRecorder: SimpleAudioRecorder = new SimpleAudioRecorder();
  private isRecording = false;
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

  public navigate(route: string, param: string | null = null) {
    this.currentRoute = route;
    this.routeParam = param;
    this.render();
    this.setupEventListeners();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public render() {
    const session = getSession();
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
          if (newSession.user.role === 'client') {
            this.render();
            this.setupEventListeners();
          }
        },
      });
      return;
    }

    // Role safety check: if admin is on client portal
    if (session.user.role === 'admin' || session.user.role === 'adviser') {
      this.container.innerHTML = `
        <div class="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
          <h2 class="text-xl font-bold font-serif-royal">Adviser / Admin Account Detected</h2>
          <p class="text-xs text-slate-300 max-w-sm mt-1.5 mb-6">
            You are signed in as <strong>${session.user.email}</strong>. This device is viewing the Client Member portal.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button id="client-role-sign-out" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-all cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      `;
      this.container.querySelector('#client-role-sign-out')?.addEventListener('click', () => {
        logout();
        this.render();
      });
      return;
    }

    let pageContent = '';
    let pageTitle = 'Royal Square';
    let subtitle: string | undefined = undefined;
    let showBack = false;
    let activeTab: ClientTabKey = 'dashboard';

    switch (this.currentRoute) {
      case 'dashboard':
        pageTitle = 'Royal Square';
        subtitle = 'Wealth & Insurance Portal';
        pageContent = renderClientDashboardPage();
        activeTab = 'dashboard';
        break;
      case 'financial':
        pageTitle = 'Financial Portfolio';
        subtitle = 'Assets, Policies & Investments';
        pageContent = renderFinancialOverviewPage();
        activeTab = 'financial';
        break;
      case 'goals':
        pageTitle = 'Wealth Goals';
        subtitle = 'Financial Milestones';
        pageContent = renderGoalsPage();
        showBack = true;
        break;
      case 'requests':
        pageTitle = 'Service Requests';
        subtitle = 'Advisory & Document Processing';
        pageContent = renderRequestsPage();
        activeTab = 'requests';
        break;
      case 'request-detail':
        pageTitle = 'Request Workflow';
        subtitle = '4-Stage Progress Tracker';
        pageContent = renderRequestDetailPage(this.routeParam || 'req-001');
        showBack = true;
        break;
      case 'create-request':
        pageTitle = 'New Request';
        subtitle = 'Fast-Track Advisory Request';
        pageContent = renderCreateRequestPage(this.routeParam || undefined);
        showBack = true;
        break;
      case 'claims':
        pageTitle = 'Motor & Asset Claims';
        subtitle = '17-Stage Lifecycle';
        pageContent = renderClaimsPage();
        activeTab = 'claims';
        break;
      case 'claim-detail':
        pageTitle = 'Claim Investigation';
        subtitle = 'Live Panel Beater & Assessor Feed';
        pageContent = renderClaimDetailPage(this.routeParam || 'clm-001');
        showBack = true;
        break;
      case 'report-accident':
        pageTitle = 'Report Motor Accident';
        subtitle = 'Emergency Incident Log';
        pageContent = renderReportAccidentPage();
        showBack = true;
        break;
      case 'documents':
        pageTitle = 'Document Vault';
        subtitle = 'POPIA Encrypted Archive';
        pageContent = renderDocumentsPage();
        showBack = true;
        break;
      case 'notifications':
        pageTitle = 'Notifications';
        subtitle = 'Real-Time Portfolio Updates';
        pageContent = renderNotificationsPage();
        showBack = true;
        break;
      case 'profile':
        pageTitle = 'Client Profile';
        subtitle = 'FICA & Compliance Status';
        pageContent = renderProfilePage();
        activeTab = 'profile';
        break;
      case 'onboarding':
        pageTitle = 'Onboarding Status';
        subtitle = 'Regulatory Checklist';
        pageContent = renderOnboardingPage();
        showBack = true;
        break;
      default:
        pageContent = renderClientDashboardPage();
        activeTab = 'dashboard';
    }

    this.container.innerHTML = `
      <div class="client-pwa-root min-h-screen bg-slate-50 flex flex-col justify-between">
        ${renderClientHeader(pageTitle, subtitle, showBack)}
        <main class="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-28">
          ${pageContent}
        </main>
        ${renderClientTabBar(activeTab)}
        ${renderCameraCaptureModal()}
      </div>
    `;
  }

  private setupEventListeners() {
    // Navigation clicks
    this.container.querySelectorAll('[data-nav]').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        const target = elem.getAttribute('data-nav')!;
        const id = elem.getAttribute('data-id');
        const preset = elem.getAttribute('data-preset');
        this.navigate(target, id || preset);
      });
    });

    // Tab bar clicks
    this.container.querySelectorAll('[data-tab]').forEach((elem) => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = elem.getAttribute('data-tab')!;
        this.navigate(tab);
      });
    });

    // Back button
    this.container.querySelectorAll('[data-action="go-back"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.navigate('dashboard');
      });
    });

    // Emergency call
    this.container.querySelectorAll('[data-action="emergency-call"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.navigate('report-accident');
      });
    });

    // Mark notifications read
    const markAllBtn = this.container.querySelector('#mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        notificationService.markAllAsRead();
        showToast('All notifications marked as read', 'success');
      });
    }

    // Submit new request
    const submitReqBtn = this.container.querySelector('#submit-request-btn');
    if (submitReqBtn) {
      submitReqBtn.addEventListener('click', async () => {
        const typeSelect = this.container.querySelector('#req-type-select') as HTMLSelectElement;
        const titleInput = this.container.querySelector('#req-title-input') as HTMLInputElement;
        const descInput = this.container.querySelector('#req-desc-input') as HTMLTextAreaElement;
        const priorityInput = this.container.querySelector('input[name="priority"]:checked') as HTMLInputElement;

        if (!titleInput?.value || titleInput.value.trim().length < 3) {
          showToast('Please provide a subject title for your request', 'error');
          return;
        }

        const newId = await requestService.createRequest({
          requestType: typeSelect?.value || 'general',
          title: titleInput.value,
          description: descInput?.value || '',
          priority: priorityInput?.value || 'normal',
        });

        showToast('Request submitted to Royal Square advisers', 'success');
        this.navigate('request-detail', newId ? String(newId) : undefined);
      });
    }

    // Submit motor accident claim
    const submitClaimBtn = this.container.querySelector('#submit-accident-claim-btn');
    if (submitClaimBtn) {
      submitClaimBtn.addEventListener('click', async () => {
        const locationInput = this.container.querySelector('#acc-location-input') as HTMLInputElement;
        const descInput = this.container.querySelector('#acc-desc-input') as HTMLTextAreaElement;
        const casInput = this.container.querySelector('#acc-police-cas-input') as HTMLInputElement;
        const stationInput = this.container.querySelector('#acc-police-station-input') as HTMLInputElement;
        const tpReg = this.container.querySelector('#tp-reg-input') as HTMLInputElement;
        const tpMake = this.container.querySelector('#tp-make-input') as HTMLInputElement;
        const tpName = this.container.querySelector('#tp-name-input') as HTMLInputElement;
        const tpInsurer = this.container.querySelector('#tp-insurer-input') as HTMLInputElement;

        if (!locationInput?.value || !descInput?.value) {
          showToast('Please enter incident location and damage notes', 'error');
          return;
        }

        const claimId = await claimService.reportMotorAccident({
          incidentDate: new Date().toISOString(),
          incidentLocation: locationInput.value,
          incidentDescription: descInput.value,
          policeReported: true,
          policeCaseNumber: casInput?.value || 'CAS 412/09/2025',
          policeStation: stationInput?.value || 'Sandton SAPS',
          thirdPartyDetails: {
            registration: tpReg?.value,
            make: tpMake?.value,
            driverName: tpName?.value,
            insurer: tpInsurer?.value,
          },
        });

        showToast('Claim reported! Royal Square triage team notified.', 'success');
        this.navigate('claim-detail', claimId ? String(claimId) : undefined);
      });
    }

    // Detect GPS
    const gpsBtn = this.container.querySelector('#detect-gps-btn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', async () => {
        gpsBtn.textContent = 'Detecting...';
        const coords = await getCurrentCoordinates();
        const locInput = this.container.querySelector('#acc-location-input') as HTMLInputElement;
        if (locInput) {
          locInput.value = coords.addressSuggestion || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        }
        gpsBtn.textContent = '📍 GPS Updated';
        showToast('Incident GPS coordinates resolved', 'success');
      });
    }

    // Voice recording trigger
    const micBtn = this.container.querySelector('#trigger-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', async () => {
        const label = this.container.querySelector('#mic-label');
        const status = this.container.querySelector('#mic-status');
        if (!this.isRecording) {
          const ok = await this.audioRecorder.start();
          if (ok) {
            this.isRecording = true;
            if (label) label.textContent = 'Recording Voice Note...';
            if (status) status.textContent = '🔴 Tap to stop';
            micBtn.classList.add('border-red-500', 'bg-red-50');
          } else {
            showToast('Microphone access simulated for demo', 'info');
          }
        } else {
          await this.audioRecorder.stop();
          this.isRecording = false;
          if (label) label.textContent = 'Voice Note Saved';
          if (status) status.textContent = '✓ Statement attached';
          micBtn.classList.remove('border-red-500', 'bg-red-50');
          micBtn.classList.add('border-emerald-500', 'bg-emerald-50');
          showToast('Voice statement attached to incident claim', 'success');
        }
      });
    }

    // Camera capture modal trigger
    const camTriggerBtn = this.container.querySelector('#trigger-camera-btn');
    const camModal = this.container.querySelector('#camera-modal') as HTMLElement;
    const closeCamBtn = this.container.querySelector('#close-camera-btn');
    const snapCamBtn = this.container.querySelector('#camera-snap-btn');

    if (camTriggerBtn && camModal) {
      camTriggerBtn.addEventListener('click', () => {
        camModal.classList.remove('hidden');
        this.startCameraStream();
      });
    }

    if (closeCamBtn && camModal) {
      closeCamBtn.addEventListener('click', () => {
        camModal.classList.add('hidden');
      });
    }

    if (snapCamBtn && camModal) {
      snapCamBtn.addEventListener('click', () => {
        camModal.classList.add('hidden');
        showToast('Accident scene photograph captured & encrypted', 'success');
      });
    }

    // Add Goal toggles
    const openGoalBtn = this.container.querySelector('#open-add-goal-btn');
    const goalForm = this.container.querySelector('#add-goal-form');
    const cancelGoalBtn = this.container.querySelector('#cancel-add-goal-btn');
    const saveGoalBtn = this.container.querySelector('#save-new-goal-btn');

    if (openGoalBtn && goalForm) {
      openGoalBtn.addEventListener('click', () => goalForm.classList.remove('hidden'));
    }
    if (cancelGoalBtn && goalForm) {
      cancelGoalBtn.addEventListener('click', () => goalForm.classList.add('hidden'));
    }
    if (saveGoalBtn && goalForm) {
      saveGoalBtn.addEventListener('click', () => {
        const nameInput = this.container.querySelector('#goal-name-input') as HTMLInputElement;
        const targetInput = this.container.querySelector('#goal-target-input') as HTMLInputElement;
        const dateInput = this.container.querySelector('#goal-date-input') as HTMLInputElement;

        if (!nameInput?.value || !targetInput?.value) {
          showToast('Please enter a goal name and target amount', 'error');
          return;
        }

        financialService.addGoal({
          name: nameInput.value,
          target_amount: Number(targetInput.value),
          current_amount: 0,
          target_date: dateInput?.value || '2028-12-31',
          goal_type: 'investment',
          is_shared: true,
        });

        showToast('New milestone saved to portfolio', 'success');
        goalForm.classList.add('hidden');
        this.render();
        this.setupEventListeners();
      });
    }

    // Document upload
    const docUpload = this.container.querySelector('#doc-upload-input') as HTMLInputElement;
    if (docUpload) {
      docUpload.addEventListener('change', async () => {
        if (docUpload.files && docUpload.files[0]) {
          await documentService.uploadDocument(docUpload.files[0], 'compliance_document');
          showToast('Document uploaded to encrypted vault', 'success');
          this.render();
          this.setupEventListeners();
        }
      });
    }

    // Download document simulation
    this.container.querySelectorAll('[data-action="download-doc"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name') || 'Document';
        showToast(`Downloaded verified document: ${name}`, 'success');
      });
    });

    // Header Sign Out button
    this.container.querySelectorAll('[data-action="client-sign-out"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        showToast('Signed out of Client Portal', 'info');
        this.render();
      });
    });

    // Login handlers
    const loginBtn = this.container.querySelector('#client-do-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const emailInput = this.container.querySelector('#client-login-email') as HTMLInputElement;
        if (!emailInput?.value.trim()) {
          showToast('Enter your email address', 'error');
          return;
        }
        await authService.login(emailInput.value.trim());
        showToast('Signed in successfully', 'success');
        this.navigate('dashboard');
      });
    }

    const logoutBtn = this.container.querySelector('#client-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await authService.logout();
        showToast('Signed out of client portal', 'info');
        this.navigate('login');
      });
    }

    const clientProfileForm = this.container.querySelector('#client-profile-form') as HTMLFormElement | null;
    clientProfileForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await updateCurrentProfile({
          first_name: (this.container.querySelector('#client-profile-first-name') as HTMLInputElement).value,
          last_name: (this.container.querySelector('#client-profile-last-name') as HTMLInputElement).value,
          phone: (this.container.querySelector('#client-profile-phone') as HTMLInputElement).value,
        });
        showToast('Profile updated', 'success');
        this.render();
        this.setupEventListeners();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to update profile', 'error');
      }
    });
  }

  private startCameraStream() {
    const video = this.container.querySelector('#camera-video-preview') as HTMLVideoElement;
    if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          video.srcObject = stream;
        })
        .catch(() => {
          // Camera permission denied or not supported; UI falls back gracefully
        });
    }
  }
}
