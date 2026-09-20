import { dataStore, hydrateRemoteState, supabase, unwrap, type ClientRecord } from '@supabase-pkg/client';
import { uploadClientDocument, markNotificationsRead } from '@supabase-pkg/helpers';
import type { Profile } from '@shared/types/user';
import type { Request } from '@shared/types/request';
import type { Claim } from '@shared/types/claim';
import type { DocumentEvent, DocumentType } from '@shared/types/document';
import { fullName, isOpenClaim, isOpenRequest } from '@shared/format';
import { CLAIM_STAGES } from '@shared/constants/claim-stages';

/** The order a motor claim moves through (shared with the client app). rejected / cancelled are side exits. */
export const CLAIM_PIPELINE: Array<{ key: string; label: string }> = CLAIM_STAGES.map((s) => ({ key: s.key, label: s.label }));

const state = () => dataStore.getState();
const DAY = 86_400_000;

async function refresh<T>(result: { error: { message: string } | null } & T): Promise<T> {
  unwrap(result);
  await hydrateRemoteState();
  return result;
}

/** Record a human review action in the document's trace. The row update is already audited server side, so a failure here only costs the trace entry. */
async function logDocumentEvent(documentId: string, clientId: string, eventType: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('document_events')
    .insert({ document_id: documentId, client_id: clientId, event_type: eventType, payload, actor: state().currentUser?.id ?? null });
  if (error) console.warn('Could not record document event:', error.message);
}

export const adviserService = {
  // ---------------------------------------------------------------- identity
  getMe(): Profile | null {
    return state().currentUser;
  },

  isAdmin(): boolean {
    return state().currentUser?.role === 'admin';
  },

  getStaff(): Profile[] {
    return state().profiles.filter((p) => p.role !== 'client');
  },

  /** Advisers (and admins) a client can be assigned to. */
  getAdvisers(): Profile[] {
    return state().profiles.filter((p) => p.is_active && (p.role === 'adviser' || p.role === 'admin'));
  },

  profileName(profileId: string | null | undefined): string {
    if (!profileId) return 'Unassigned';
    return fullName(state().profiles.find((p) => p.id === profileId), 'Unknown user');
  },

  // ---------------------------------------------------------------- clients
  getClients(): ClientRecord[] {
    return state()
      .clients.filter((c) => !c.profile || c.profile.role === 'client')
      .sort((a, b) => fullName(a.profile, a.client_number || '').localeCompare(fullName(b.profile, b.client_number || '')));
  },

  clientName(clientId: string | null | undefined): string {
    const client = state().clients.find((c) => c.id === clientId);
    return client ? fullName(client.profile, client.client_number || 'Client') : 'Unknown client';
  },

  getClient(clientId: string): ClientRecord | null {
    return state().clients.find((c) => c.id === clientId) ?? null;
  },

  clientTotals(clientId: string) {
    const s = state();
    const assets = s.assets.filter((a) => a.client_id === clientId).reduce((n, a) => n + Number(a.current_value), 0);
    const investments = s.investments.filter((i) => i.client_id === clientId).reduce((n, i) => n + Number(i.current_value), 0);
    const liabilities = s.liabilities.filter((l) => l.client_id === clientId).reduce((n, l) => n + Number(l.outstanding_balance), 0);
    return { assets, investments, liabilities, netWorth: assets + investments - liabilities };
  },

  /** FICA: both an ID document and proof of address must be uploaded AND verified by staff. */
  ficaStatus(clientId: string): 'verified' | 'partial' | 'pending' {
    const docs = state().documents.filter((d) => d.client_id === clientId);
    const has = (type: string, verified: boolean) => docs.some((d) => d.document_type === type && (!verified || d.is_verified));
    if (has('id_document', true) && has('proof_of_address', true)) return 'verified';
    if (has('id_document', false) || has('proof_of_address', false)) return 'partial';
    return 'pending';
  },

  getClientDetail(clientId: string) {
    const s = state();
    const by = <T extends { client_id: string }>(rows: T[]) => rows.filter((r) => r.client_id === clientId);
    return {
      client: s.clients.find((c) => c.id === clientId) ?? null,
      assets: by(s.assets),
      liabilities: by(s.liabilities),
      income: by(s.income),
      expenses: by(s.expenses),
      policies: by(s.policies),
      investments: by(s.investments),
      goals: by(s.goals),
      dependants: by(s.dependants),
      beneficiaries: by(s.beneficiaries),
      requests: by(s.requests),
      claims: by(s.claims),
      documents: by(s.documents),
      reminders: by(s.reminders),
      tasks: s.tasks.filter((t) => t.client_id === clientId),
      auditLogs: s.audit_logs.filter((a) => a.client_id === clientId),
    };
  },

  async updateClient(clientId: string, values: Record<string, unknown>) {
    await refresh(await supabase.from('clients').update(values).eq('id', clientId));
  },

  async assignAdviser(clientId: string, adviserId: string) {
    await refresh(await supabase.rpc('assign_client_adviser', { p_client_id: clientId, p_adviser_id: adviserId }));
  },

  // ---------------------------------------------------------------- requests
  getRequests(): Request[] {
    return state().requests;
  },

  getRequestDetail(requestId: string) {
    const s = state();
    const request = s.requests.find((r) => r.id === requestId) ?? null;
    return {
      request,
      workflows: s.request_workflows.filter((w) => w.request_id === requestId),
      client: request ? s.clients.find((c) => c.id === request.client_id) ?? null : null,
      documents: s.documents.filter((d) => d.request_id === requestId),
      messages: s.messages.filter((m) => m.request_id === requestId),
    };
  },

  async advanceRequest(requestId: string, notes?: string) {
    await refresh(await supabase.rpc('advance_request_workflow', { p_request_id: requestId, p_notes: notes || null }));
  },

  async setRequestStatus(requestId: string, status: string, note?: string) {
    await refresh(await supabase.rpc('set_request_status', { p_request_id: requestId, p_status: status, p_note: note || null }));
  },

  // ---------------------------------------------------------------- claims
  getClaims(): Claim[] {
    return state().claims;
  },

  getClaimDetail(claimId: string) {
    const s = state();
    const claim = s.claims.find((c) => c.id === claimId) ?? null;
    return {
      claim,
      timeline: s.claim_timeline.filter((t) => t.claim_id === claimId),
      vehicles: s.claim_vehicles.filter((v) => v.claim_id === claimId),
      witnesses: s.claim_witnesses.filter((w) => w.claim_id === claimId),
      client: claim ? s.clients.find((c) => c.id === claim.client_id) ?? null : null,
      documents: s.documents.filter((d) => d.claim_id === claimId),
    };
  },

  async setClaimStatus(claimId: string, status: string, description: string) {
    await refresh(await supabase.rpc('update_claim_status', { p_claim_id: claimId, p_status: status, p_description: description || null }));
  },

  async updateClaim(claimId: string, values: Record<string, unknown>) {
    await refresh(await supabase.from('claims').update(values).eq('id', claimId));
  },

  /** Staff-only note on a claim's chronology. Never shown to the client (RLS hides is_client_visible = false rows). */
  async addInternalClaimNote(claimId: string, note: string) {
    const claim = state().claims.find((c) => c.id === claimId);
    await refresh(
      await supabase.from('claim_timeline').insert({
        claim_id: claimId,
        created_by: state().currentUser?.id ?? null,
        status: claim?.status ?? null,
        title: 'Internal note',
        description: note,
        is_client_visible: false,
      })
    );
  },

  // ---------------------------------------------------------------- tasks & reminders
  getTasks() {
    return state().tasks;
  },

  async setTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    await refresh(
      await supabase
        .from('tasks')
        .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
        .eq('id', taskId)
    );
  },

  getReminders() {
    return state().reminders;
  },

  async completeReminder(reminderId: string) {
    await refresh(await supabase.rpc('complete_reminder', { p_reminder_id: reminderId }));
  },

  // ---------------------------------------------------------------- generic client records (balance sheet, cover, tasks...)
  async saveRecord(table: string, id: string | null, values: Record<string, unknown>) {
    if (id) await refresh(await supabase.from(table).update(values).eq('id', id));
    else await refresh(await supabase.from(table).insert(values));
  },

  async deleteRecord(table: string, id: string) {
    await refresh(await supabase.from(table).delete().eq('id', id));
  },

  // ---------------------------------------------------------------- documents
  getDocuments() {
    return state().documents;
  },

  async verifyDocument(docId: string, verified: boolean) {
    await refresh(await supabase.from('documents').update({ is_verified: verified }).eq('id', docId));
  },

  /** The engine trace for one document, oldest first. */
  async getDocumentEvents(docId: string): Promise<DocumentEvent[]> {
    const { data } = unwrap(await supabase.from('document_events').select('*').eq('document_id', docId).order('created_at', { ascending: true }));
    return (data ?? []) as DocumentEvent[];
  },

  /** Human review: accept the document, optionally correcting what the OCR extracted. */
  async approveDocument(docId: string, extractedFields?: Record<string, string>) {
    const doc = state().documents.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found.');
    const update: Record<string, unknown> = { processing_status: 'successful', human_review_required: false, rejection_reason: null };
    const edited = extractedFields ? Object.keys(extractedFields).filter((k) => String(extractedFields[k] ?? '') !== String(doc.extracted_fields?.[k] ?? '')) : [];
    if (extractedFields) update.extracted_fields = extractedFields;
    await refresh(await supabase.from('documents').update(update).eq('id', docId));
    await logDocumentEvent(doc.id, doc.client_id, 'approved', { edited_fields: edited, previous: edited.length ? doc.extracted_fields : undefined });
  },

  /** Human review: reject with a reason the client will see, asking for a clearer upload. */
  async rejectDocument(docId: string, reason: string) {
    const doc = state().documents.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found.');
    const trimmed = reason.trim();
    if (!trimmed) throw new Error('Give the client a reason so they know what to fix.');
    await refresh(await supabase.from('documents').update({ processing_status: 'rejected', human_review_required: false, rejection_reason: trimmed }).eq('id', docId));
    await logDocumentEvent(doc.id, doc.client_id, 'rejected', { reason: trimmed });
  },

  async uploadForClient(options: { clientId: string; file: File; documentType: DocumentType; requestId?: string | null; claimId?: string | null }) {
    return uploadClientDocument(options);
  },

  // ---------------------------------------------------------------- messages
  /** One row per client that has a thread, newest activity first. */
  getConversations() {
    const s = state();
    const byClient = new Map<string, typeof s.messages>();
    for (const m of s.messages) {
      const list = byClient.get(m.client_id) ?? [];
      list.push(m);
      byClient.set(m.client_id, list);
    }
    return [...byClient.entries()]
      .map(([clientId, messages]) => ({
        clientId,
        messages,
        last: messages[messages.length - 1],
        unread: messages.filter((m) => m.direction === 'client_to_royal' && !m.is_read).length,
      }))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  },

  unreadMessageCount(): number {
    return state().messages.filter((m) => m.direction === 'client_to_royal' && !m.is_read).length;
  },

  async sendMessage(clientId: string, body: string, options: { requestId?: string; claimId?: string } = {}) {
    await refresh(
      await supabase.rpc('send_message', {
        p_body: body,
        p_client_id: clientId,
        p_request_id: options.requestId || null,
        p_claim_id: options.claimId || null,
      })
    );
  },

  async markThreadRead(clientId: string) {
    await refresh(await supabase.rpc('mark_thread_read', { p_client_id: clientId }));
  },

  // ---------------------------------------------------------------- notifications (the signed-in staff member's own)
  getNotifications() {
    const me = state().currentUser?.id;
    return state().notifications.filter((n) => n.user_id === me);
  },

  unreadNotificationCount(): number {
    return this.getNotifications().filter((n) => !n.is_read).length;
  },

  async markNotificationsRead(ids: string[]) {
    await markNotificationsRead(ids);
  },

  // ---------------------------------------------------------------- providers
  getProviders() {
    return state().providers;
  },

  providerUsage(providerId: string) {
    const s = state();
    return {
      policies: s.policies.filter((p) => p.provider_id === providerId).length,
      investments: s.investments.filter((i) => i.provider_id === providerId).length,
      claims: s.claims.filter((c) => c.provider_id === providerId).length,
    };
  },

  async updateProvider(providerId: string, values: Record<string, unknown>) {
    await refresh(await supabase.from('providers').update(values).eq('id', providerId));
  },

  // ---------------------------------------------------------------- administration
  async setUserRole(userId: string, role: string, isActive?: boolean) {
    await refresh(await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role, p_is_active: isActive ?? null }));
  },

  // ---------------------------------------------------------------- dashboards
  getKPIs() {
    const s = state();
    const now = Date.now();
    const clients = this.getClients();
    const openRequests = s.requests.filter((r) => isOpenRequest(r.status));
    const activeClaims = s.claims.filter((c) => isOpenClaim(c.status));

    const aum = s.investments.reduce((n, i) => n + Number(i.current_value), 0);
    const assets = s.assets.reduce((n, a) => n + Number(a.current_value), 0);
    const liabilities = s.liabilities.reduce((n, l) => n + Number(l.outstanding_balance), 0);

    const completed = s.requests.filter((r) => r.status === 'completed' && r.completed_at);
    const avgTurnaroundDays = completed.length
      ? completed.reduce((n, r) => n + (new Date(r.completed_at!).getTime() - new Date(r.created_at).getTime()) / DAY, 0) / completed.length
      : null;
    const slaMet = completed.length
      ? completed.filter((r) => !r.due_date || new Date(r.completed_at!) <= new Date(r.due_date)).length / completed.length
      : null;

    const closedClaims = s.claims.filter((c) => !isOpenClaim(c.status));
    const settledRate = closedClaims.length ? closedClaims.filter((c) => c.status === 'completed').length / closedClaims.length : null;

    const me = s.currentUser?.id;
    return {
      totalAUM: aum,
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: assets + aum - liabilities,
      activeClients: clients.filter((c) => c.profile?.is_active !== false).length,
      newClients30d: clients.filter((c) => now - new Date(c.created_at).getTime() < 30 * DAY).length,
      openRequests: openRequests.length,
      overdueRequests: openRequests.filter((r) => r.due_date && new Date(r.due_date).getTime() < now).length,
      activeClaims: activeClaims.length,
      openTasks: s.tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
      myOpenTasks: s.tasks.filter((t) => t.assigned_to === me && (t.status === 'pending' || t.status === 'in_progress')).length,
      dueReminders: s.reminders.filter((r) => !r.is_completed && new Date(r.reminder_date).getTime() <= now + 7 * DAY).length,
      avgTurnaroundDays,
      slaMet,
      settledRate,
      completedRequests: completed.length,
      closedClaims: closedClaims.length,
    };
  },

  aumByProvider() {
    const s = state();
    const totals = new Map<string, number>();
    for (const i of s.investments) {
      const key = i.provider_name || 'Unassigned provider';
      totals.set(key, (totals.get(key) || 0) + Number(i.current_value));
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  },

  turnaroundByType() {
    const done = state().requests.filter((r) => r.status === 'completed' && r.completed_at);
    const groups = new Map<string, number[]>();
    for (const r of done) {
      const days = (new Date(r.completed_at!).getTime() - new Date(r.created_at).getTime()) / DAY;
      groups.set(r.request_type, [...(groups.get(r.request_type) || []), days]);
    }
    return [...groups.entries()]
      .map(([type, list]) => ({ type, count: list.length, avgDays: list.reduce((a, b) => a + b, 0) / list.length }))
      .sort((a, b) => b.count - a.count);
  },

  requestsByType() {
    const groups = new Map<string, number>();
    for (const r of state().requests) groups.set(r.request_type, (groups.get(r.request_type) || 0) + 1);
    return [...groups.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  },

  /** Net worth per month-end is not stored historically, so the overview charts cumulative onboarding instead. */
  clientGrowth(months = 6) {
    const clients = this.getClients();
    const out: Array<{ label: string; count: number }> = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      out.push({
        label: end.toLocaleDateString('en-ZA', { month: 'short' }).replace('.', ''),
        count: clients.filter((c) => new Date(c.created_at) < end).length,
      });
    }
    return out;
  },

  search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { clients: [], requests: [], claims: [] };
    const s = state();
    return {
      clients: this.getClients().filter((c) =>
        [fullName(c.profile, ''), c.profile?.email, c.client_number, c.id_number].some((v) => (v || '').toLowerCase().includes(q))
      ),
      requests: s.requests.filter((r) => [r.request_number, r.title, r.description].some((v) => (v || '').toLowerCase().includes(q))),
      claims: s.claims.filter((c) => [c.claim_number, c.incident_location, c.insurer_reference, c.police_case_number].some((v) => (v || '').toLowerCase().includes(q))),
    };
  },
};
