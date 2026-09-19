import { html, raw, isStaff, type SafeHtml } from '@shared/index';
import { attachSharedAuthEvents, getSession, logout, renderSharedAuthScreen } from '@shared/auth';
import { updateCurrentProfile } from '@shared/profile';
import type { DocumentType } from '@shared/types/document';
import type { GoalType } from '@shared/types/goal';
import { dataStore } from '@supabase-pkg/client';
import { renderClientHeader } from './components/header';
import { renderClientTabBar, type ClientTabKey } from './components/tab-bar';
import { renderCameraCaptureModal } from './components/camera-capture';
import { showToast } from './components/toast';
import { renderClientDashboardPage } from './pages/dashboard';
import { renderFinancialOverviewPage } from './pages/financial-overview';
import { renderGoalsPage } from './pages/goals';
import { renderRequestsPage } from './pages/requests';
import { renderRequestDetailPage } from './pages/request-detail';
import { renderCreateRequestPage } from './pages/create-request';
import { renderClaimsPage } from './pages/claims';
import { renderClaimDetailPage } from './pages/claim-detail';
import { ACCIDENT_FIELD_IDS, getAccidentDraft, renderReportAccidentPage, resetAccidentDraft } from './pages/report-accident';
import { renderDocumentsPage } from './pages/documents';
import { notificationTarget, renderNotificationsPage } from './pages/notifications';
import { renderMessagesPage } from './pages/messages';
import { renderProfilePage } from './pages/profile';
import { renderOnboardingPage } from './pages/onboarding';
import { requestService } from './services/request';
import { claimService } from './services/claim';
import { financialService } from './services/financial';
import { documentService } from './services/document';
import { notificationService } from './services/notification';
import { messageService } from './services/message';
import { clientService } from './services/client';
import { describeCoordinates, getCurrentCoordinates } from './utils/geolocation';
import { compressImage } from './utils/image-compression';
import { SimpleAudioRecorder } from './utils/audio-recorder';

interface MessageContext {
  requestId?: string;
  claimId?: string;
}

export class ClientApp {
  private container: HTMLElement;
  private currentRoute = 'dashboard';
  private routeParam: string | null = null;
  private messageContext: MessageContext = {};
  private authMode: 'login' | 'register' = 'login';
  private audioRecorder = new SimpleAudioRecorder();
  private isRecording = false;
  private cameraStream: MediaStream | null = null;
  private destroyed = false;
  private pendingRender = false;
  private markingRead = false;
  private unsubscribeStore: () => void;

  private readonly onAuthChange = () => this.render();
  private readonly onClick = (event: Event) => void this.handleClick(event);
  private readonly onSubmit = (event: Event) => void this.handleSubmit(event);
  private readonly onChange = (event: Event) => void this.handleChange(event);
  private readonly onInput = (event: Event) => this.handleInput(event);
  private readonly onFocusOut = () => {
    // Apply any refresh that was held back while the user was typing.
    setTimeout(() => {
      if (this.pendingRender && !this.isBusyEditing()) this.render();
    }, 0);
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.addEventListener('click', this.onClick);
    this.container.addEventListener('submit', this.onSubmit);
    this.container.addEventListener('change', this.onChange);
    this.container.addEventListener('input', this.onInput);
    this.container.addEventListener('focusout', this.onFocusOut);
    window.addEventListener('royal-square-auth-change', this.onAuthChange);
    this.unsubscribeStore = dataStore.subscribe(() => this.onDataChanged());
    this.render();
  }

  public destroy(): void {
    this.destroyed = true;
    this.stopCamera();
    this.unsubscribeStore();
    window.removeEventListener('royal-square-auth-change', this.onAuthChange);
    this.container.removeEventListener('click', this.onClick);
    this.container.removeEventListener('submit', this.onSubmit);
    this.container.removeEventListener('change', this.onChange);
    this.container.removeEventListener('input', this.onInput);
    this.container.removeEventListener('focusout', this.onFocusOut);
    this.container.innerHTML = '';
  }

  public navigate(route: string, param: string | null = null, context: MessageContext = {}): void {
    this.currentRoute = route;
    this.routeParam = param;
    this.messageContext = context;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------- rendering

  /** True while the user is typing into a field or the camera is open, so a live refresh must not wipe their input. */
  private isBusyEditing(): boolean {
    const active = document.activeElement;
    const typing = Boolean(active && this.container.contains(active) && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
    const cameraOpen = Boolean(this.cameraStream);
    return typing || cameraOpen;
  }

  private onDataChanged(): void {
    if (this.destroyed) return;
    if (this.isBusyEditing()) {
      this.pendingRender = true;
      return;
    }
    this.render();
  }

  public render(): void {
    if (this.destroyed) return;
    this.pendingRender = false;

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
        onSuccess: () => undefined, // the auth-change event re-renders the app
      });
      return;
    }

    if (isStaff(session.user.role)) {
      this.container.innerHTML = html`
        <div class="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 text-center">
          <h2 class="text-xl font-bold font-serif-royal">Staff account detected</h2>
          <p class="text-xs text-slate-300 max-w-sm mt-1.5 mb-6">You are signed in as <strong>${session.user.email}</strong>. Staff use the Royal Desk, not the client portal.</p>
          <button data-action="client-sign-out" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs transition-all">Sign out</button>
        </div>`.value;
      return;
    }

    const messagesUnread = messageService.getUnreadCount();
    if (this.currentRoute === 'messages' && messagesUnread > 0 && !this.markingRead) {
      this.markingRead = true;
      messageService
        .markRead()
        .catch((error) => console.error('Unable to mark messages read:', error))
        .finally(() => {
          this.markingRead = false;
        });
    }

    let page: SafeHtml;
    let title = 'Royal Square';
    let subtitle: string | undefined;
    let showBack = false;
    let activeTab: ClientTabKey = 'dashboard';

    switch (this.currentRoute) {
      case 'financial':
        title = 'Finances';
        subtitle = 'Assets, policies and investments';
        page = renderFinancialOverviewPage();
        activeTab = 'financial';
        break;
      case 'goals':
        title = 'Goals';
        subtitle = 'Financial milestones';
        page = renderGoalsPage();
        showBack = true;
        break;
      case 'requests':
        title = 'Requests';
        subtitle = 'Advisory and document requests';
        page = renderRequestsPage();
        activeTab = 'requests';
        break;
      case 'request-detail':
        title = 'Request';
        subtitle = 'Progress tracker';
        page = renderRequestDetailPage(this.routeParam || '');
        activeTab = 'requests';
        showBack = true;
        break;
      case 'create-request':
        title = 'New request';
        subtitle = 'Ask your adviser';
        page = renderCreateRequestPage(this.routeParam || undefined);
        activeTab = 'requests';
        showBack = true;
        break;
      case 'claims':
        title = 'Claims';
        subtitle = 'Motor and asset claims';
        page = renderClaimsPage();
        activeTab = 'claims';
        break;
      case 'claim-detail':
        title = 'Claim';
        subtitle = 'Live progress';
        page = renderClaimDetailPage(this.routeParam || '');
        activeTab = 'claims';
        showBack = true;
        break;
      case 'report-accident':
        title = 'Report accident';
        subtitle = 'Motor claim';
        page = renderReportAccidentPage(this.isRecording);
        activeTab = 'claims';
        showBack = true;
        break;
      case 'documents':
        title = 'Documents';
        subtitle = 'Private vault';
        page = renderDocumentsPage();
        showBack = true;
        break;
      case 'notifications':
        title = 'Notifications';
        subtitle = 'Updates from your adviser';
        page = renderNotificationsPage();
        showBack = true;
        break;
      case 'messages':
        title = 'Messages';
        subtitle = 'Your adviser';
        page = renderMessagesPage(this.messageContext);
        showBack = true;
        break;
      case 'profile':
        title = 'Profile';
        subtitle = 'Your details';
        page = renderProfilePage();
        activeTab = 'profile';
        break;
      case 'onboarding':
        title = 'Onboarding';
        subtitle = 'Regulatory checklist';
        page = renderOnboardingPage();
        activeTab = 'profile';
        showBack = true;
        break;
      default:
        title = 'Royal Square';
        subtitle = 'Wealth and insurance portal';
        page = renderClientDashboardPage();
    }

    this.container.innerHTML = html`
      <div class="client-pwa-root min-h-screen bg-slate-50 flex flex-col justify-between">
        ${renderClientHeader(title, subtitle, showBack)}
        <main class="flex-1 max-w-3xl mx-auto w-full px-4 pt-4 pb-28">${page}</main>
        ${raw(renderClientTabBar(activeTab))}
        ${this.currentRoute === 'report-accident' ? raw(renderCameraCaptureModal()) : ''}
      </div>`.value;

    if (this.currentRoute === 'messages') {
      const thread = this.container.querySelector('#message-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }
  }

  // ------------------------------------------------------------------- events

  private async guard(button: HTMLButtonElement | null, work: () => Promise<void>): Promise<void> {
    if (button) button.disabled = true;
    try {
      await work();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Something went wrong. Please try again.', 'error');
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  }

  private async handleClick(event: Event): Promise<void> {
    const target = event.target as HTMLElement;

    const nav = target.closest<HTMLElement>('[data-nav]');
    if (nav && !nav.hasAttribute('disabled')) {
      event.preventDefault();
      const route = nav.dataset.nav!;
      const context: MessageContext = {};
      if (nav.dataset.contextRequest) context.requestId = nav.dataset.contextRequest;
      if (nav.dataset.contextClaim) context.claimId = nav.dataset.contextClaim;
      this.navigate(route, nav.dataset.id || null, context);
      return;
    }

    const tab = target.closest<HTMLElement>('[data-tab]');
    if (tab) {
      event.preventDefault();
      this.navigate(tab.dataset.tab!);
      return;
    }

    const notif = target.closest<HTMLElement>('[data-notif-id]');
    if (notif) {
      event.preventDefault();
      const id = notif.dataset.notifId!;
      const item = notificationService.getNotifications().find((n) => n.id === id);
      await this.guard(null, async () => {
        if (item && !item.is_read) await notificationService.markAsRead(id);
      });
      const destination = item ? notificationTarget(item) : null;
      if (destination) this.navigate(destination.route, destination.id || null);
      return;
    }

    const action = target.closest<HTMLElement>('[data-action]');
    if (action) {
      event.preventDefault();
      switch (action.dataset.action) {
        case 'go-back':
          this.stopCamera();
          this.navigate(this.backTarget());
          return;
        case 'client-sign-out':
          await logout();
          return;
        case 'open-doc': {
          const doc = dataStore.getState().documents.find((d) => d.id === action.dataset.id);
          if (doc) await this.guard(null, () => documentService.open(doc));
          return;
        }
        case 'remove-goal':
          if (window.confirm('Remove this goal?')) {
            await this.guard(null, async () => {
              await financialService.removeGoal(action.dataset.id!);
              showToast('Goal removed', 'info');
            });
          }
          return;
        case 'remove-photo': {
          const draft = getAccidentDraft();
          const [removed] = draft.photos.splice(Number(action.dataset.index), 1);
          if (removed) URL.revokeObjectURL(removed.url);
          this.render();
          return;
        }
      }
    }

    const button = target.closest<HTMLButtonElement>('button[id]');
    switch (button?.id) {
      case 'mark-all-read-btn':
        await this.guard(button, async () => {
          await notificationService.markAllAsRead();
          showToast('All notifications marked as read', 'success');
        });
        return;
      case 'open-add-goal-btn':
        this.container.querySelector('#add-goal-form')?.classList.remove('hidden');
        return;
      case 'cancel-add-goal-btn':
        this.container.querySelector('#add-goal-form')?.classList.add('hidden');
        return;
      case 'client-logout-btn':
        await logout();
        return;
      case 'detect-gps-btn':
        await this.detectLocation(button);
        return;
      case 'trigger-camera-btn':
        await this.openCamera();
        return;
      case 'close-camera-btn':
        this.stopCamera();
        this.render();
        return;
      case 'camera-snap-btn':
        await this.snapPhoto();
        return;
      case 'trigger-mic-btn':
        await this.toggleRecording();
        return;
    }
  }

  private backTarget(): string {
    switch (this.currentRoute) {
      case 'request-detail':
      case 'create-request':
        return 'requests';
      case 'claim-detail':
      case 'report-accident':
        return 'claims';
      case 'onboarding':
        return 'profile';
      default:
        return 'dashboard';
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    const form = event.target as HTMLFormElement;
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const value = (id: string) => (this.container.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`#${id}`)?.value ?? '');

    if (form.id === 'create-request-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        const title = value('req-title-input').trim();
        if (title.length < 3) throw new Error('Please give your request a subject of at least 3 characters.');
        const priority = form.querySelector<HTMLInputElement>('input[name="priority"]:checked')?.value || 'normal';
        const attachment = this.container.querySelector<HTMLInputElement>('#req-file-input')?.files?.[0] ?? null;
        try {
          const id = await requestService.createRequest({ requestType: value('req-type-select') || 'general', title, description: value('req-desc-input'), priority, attachment });
          showToast('Request sent to your adviser', 'success');
          this.navigate('request-detail', id);
        } catch (error) {
          const createdId = (error as { requestId?: string }).requestId;
          if (createdId) {
            showToast((error as Error).message, 'error');
            this.navigate('request-detail', createdId);
            return;
          }
          throw error;
        }
      });
      return;
    }

    if (form.id === 'accident-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        const draft = getAccidentDraft();
        const location = value('acc-location-input').trim();
        const description = value('acc-desc-input').trim();
        if (!location || !description) throw new Error('Please enter where it happened and describe what happened.');
        const when = new Date(value('acc-date-input'));
        if (Number.isNaN(when.getTime())) throw new Error('Please enter the date and time of the accident.');
        if (when.getTime() > Date.now() + 5 * 60 * 1000) throw new Error('The accident date cannot be in the future.');

        try {
          const claimId = await claimService.reportMotorAccident({
            incidentDate: when.toISOString(),
            incidentLocation: location,
            incidentDescription: description,
            insuredVehicle: value('acc-vehicle-input'),
            policeCaseNumber: value('acc-police-cas-input'),
            policeStation: value('acc-police-station-input'),
            thirdParty: { registration: value('tp-reg-input'), makeModel: value('tp-make-input'), driverName: value('tp-name-input'), insurer: value('tp-insurer-input') },
            witness: { name: value('wit-name-input'), phone: value('wit-phone-input') },
            photos: draft.photos.map((p) => p.blob),
            voiceNote: draft.voiceNote?.blob ?? null,
          });
          resetAccidentDraft();
          showToast('Claim reported. Your adviser has been notified.', 'success');
          this.navigate('claim-detail', claimId);
        } catch (error) {
          const createdId = (error as { claimId?: string }).claimId;
          if (createdId) {
            resetAccidentDraft();
            showToast((error as Error).message, 'error');
            this.navigate('claim-detail', createdId);
            return;
          }
          throw error;
        }
      });
      return;
    }

    if (form.id === 'add-goal-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        await financialService.addGoal({
          name: value('goal-name-input'),
          goal_type: (value('goal-type-input') || 'other') as GoalType,
          target_amount: Number(value('goal-target-input')),
          current_amount: Number(value('goal-current-input') || 0),
          target_date: value('goal-date-input') || null,
        });
        showToast('Goal saved', 'success');
      });
      return;
    }

    if (form.dataset.goalProgressForm) {
      event.preventDefault();
      await this.guard(submit, async () => {
        const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value);
        await financialService.updateGoalProgress(form.dataset.goalProgressForm!, amount);
        showToast('Progress updated', 'success');
      });
      return;
    }

    if (form.id === 'doc-upload-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        const file = this.container.querySelector<HTMLInputElement>('#doc-upload-input')?.files?.[0];
        if (!file) throw new Error('Please choose a file to upload.');
        if (file.size > 10 * 1024 * 1024) throw new Error('Files must be 10 MB or smaller.');
        await documentService.uploadDocument(file, value('doc-type-select') as DocumentType);
        showToast('Document uploaded. Your adviser has been notified.', 'success');
      });
      return;
    }

    if (form.id === 'message-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        const body = value('message-input').trim();
        if (!body) return;
        await messageService.send(body, { requestId: form.dataset.requestId, claimId: form.dataset.claimId });
        showToast('Message sent', 'success');
      });
      return;
    }

    if (form.id === 'client-profile-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        await updateCurrentProfile({ first_name: value('client-profile-first-name'), last_name: value('client-profile-last-name'), phone: value('client-profile-phone') });
        showToast('Account details saved', 'success');
      });
      return;
    }

    if (form.id === 'client-details-form') {
      event.preventDefault();
      await this.guard(submit, async () => {
        const id = value('cd-id-number').replace(/\s+/g, '');
        if (id && !/^\d{13}$/.test(id)) throw new Error('A South African ID number has 13 digits.');
        await clientService.updatePersonalDetails({
          id_number: id,
          date_of_birth: value('cd-dob'),
          marital_status: value('cd-marital'),
          occupation: value('cd-occupation'),
          employer: value('cd-employer'),
          address_line_1: value('cd-address1'),
          address_line_2: value('cd-address2'),
          city: value('cd-city'),
          province: value('cd-province'),
          postal_code: value('cd-postal'),
          preferred_contact_method: (value('cd-contact') || 'app') as 'app' | 'email' | 'phone',
        });
        showToast('Personal details saved', 'success');
      });
    }
  }

  private async handleChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.id !== 'photo-file-input' || !input.files) return;

    await this.guard(null, async () => {
      const draft = getAccidentDraft();
      for (const file of Array.from(input.files!)) {
        if (!file.type.startsWith('image/')) continue;
        const blob = await compressImage(file);
        draft.photos.push({ blob, url: URL.createObjectURL(blob) });
      }
      this.render();
    });
  }

  /** Keep the accident form in the draft so a live refresh cannot lose it. */
  private handleInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    if (ACCIDENT_FIELD_IDS.includes(el.id)) getAccidentDraft().values[el.id] = el.value;
  }

  // ------------------------------------------------ device features (accident)

  private async detectLocation(button: HTMLButtonElement | null): Promise<void> {
    if (button) button.textContent = 'Locating…';
    try {
      const coords = await getCurrentCoordinates();
      const text = describeCoordinates(coords);
      const input = this.container.querySelector<HTMLInputElement>('#acc-location-input');
      const existing = input?.value.trim();
      const combined = existing ? `${existing} (${text})` : text;
      getAccidentDraft().values['acc-location-input'] = combined;
      if (input) input.value = combined;
      showToast('Location added', 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      if (button?.isConnected) button.textContent = '📍 Use my location';
    }
  }

  private async openCamera(): Promise<void> {
    const modal = this.container.querySelector<HTMLElement>('#camera-modal');
    const video = this.container.querySelector<HTMLVideoElement>('#camera-video-preview');
    if (!modal || !video) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Camera is not available here. Use "Choose photos" instead.', 'error');
      return;
    }
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = this.cameraStream;
      modal.classList.remove('hidden');
    } catch {
      this.cameraStream = null;
      showToast('Camera permission was denied. Use "Choose photos" instead.', 'error');
    }
  }

  private stopCamera(): void {
    this.cameraStream?.getTracks().forEach((track) => track.stop());
    this.cameraStream = null;
  }

  private async snapPhoto(): Promise<void> {
    const video = this.container.querySelector<HTMLVideoElement>('#camera-video-preview');
    const canvas = this.container.querySelector<HTMLCanvasElement>('#camera-canvas');
    if (!video || !canvas || !video.videoWidth) {
      showToast('The camera is not ready yet. Try again in a moment.', 'error');
      return;
    }
    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    if (!blob) {
      showToast('Could not capture the photo. Please try again.', 'error');
      return;
    }
    const draft = getAccidentDraft();
    draft.photos.push({ blob, url: URL.createObjectURL(blob) });
    this.stopCamera();
    this.render();
    showToast('Photo added', 'success');
  }

  private async toggleRecording(): Promise<void> {
    const draft = getAccidentDraft();
    if (!this.isRecording) {
      const started = await this.audioRecorder.start();
      if (!started) {
        showToast('Microphone access is not available. Please allow it in your browser settings.', 'error');
        return;
      }
      this.isRecording = true;
      this.render();
      return;
    }

    const result = await this.audioRecorder.stop();
    this.isRecording = false;
    if (result) {
      if (draft.voiceNote) URL.revokeObjectURL(draft.voiceNote.url);
      draft.voiceNote = { blob: result.blob, url: result.url, durationMs: result.durationMs };
      showToast('Voice statement recorded', 'success');
    }
    this.render();
  }
}
