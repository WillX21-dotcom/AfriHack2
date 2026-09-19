import { localStore, supabase, hydrateRemoteState } from '@supabase-pkg/client';
import { Client } from '@shared/types/client';
import { Request } from '@shared/types/request';
import { Claim } from '@shared/types/claim';
import { Reminder } from '@shared/types/reminder';
import { AuditLog } from '@shared/types/audit';

export const adviserService = {
  getClients(): Client[] {
    return localStore.getState().clients;
  },

  getClientById(id: string): {
    client: Client | null;
    assets: any[];
    liabilities: any[];
    policies: any[];
    investments: any[];
    goals: any[];
    requests: Request[];
    claims: Claim[];
    documents: any[];
    auditLogs: AuditLog[];
  } {
    const state = localStore.getState();
    const client = state.clients.find((c) => c.id === id) || null;
    return {
      client,
      assets: state.assets.filter((a) => a.client_id === id),
      liabilities: state.liabilities.filter((l) => l.client_id === id),
      policies: state.policies.filter((p) => p.client_id === id),
      investments: state.investments.filter((i) => i.client_id === id),
      goals: state.goals.filter((g) => g.client_id === id),
      requests: state.requests.filter((r) => r.client_id === id),
      claims: state.claims.filter((c) => c.client_id === id),
      documents: state.documents.filter((d) => d.client_id === id),
      auditLogs: state.audit_logs.filter((a) => a.client_id === id),
    };
  },

  getRequests(): Request[] {
    return localStore.getState().requests;
  },

  getRequestDetail(id: string) {
    const state = localStore.getState();
    const request = state.requests.find((r) => r.id === id) || null;
    const workflows = state.request_workflows.filter((w) => w.request_id === id);
    const client = request ? state.clients.find((c) => c.id === request.client_id) : null;
    return { request, workflows, client };
  },

  async advanceRequestWorkflow(requestId: string, currentStepNumber: number, notes?: string) {
    const state = localStore.getState();
    const workflows = state.request_workflows.filter((w) => w.request_id === requestId);
    const currentWf = workflows.find((w) => w.step_number === currentStepNumber);
    const nextWf = workflows.find((w) => w.step_number === currentStepNumber + 1);

    if (currentWf) {
      const { error } = await supabase.from('request_workflows').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ...(notes ? { notes } : {}),
      }).eq('id', currentWf.id);
      if (error) throw error;
    }

    const request = state.requests.find((r) => r.id === requestId);
    if (nextWf) {
      const { error } = await supabase.from('request_workflows').update({ status: 'in_progress' }).eq('id', nextWf.id);
      if (error) throw error;
      if (request) {
        const requestResult = await supabase.from('requests').update({ status: 'in_progress' }).eq('id', request.id);
        if (requestResult.error) throw requestResult.error;
      }
    } else {
      // Completed full pipeline
      if (request) {
        const requestResult = await supabase.from('requests').update({ status: 'completed', resolved_at: new Date().toISOString() }).eq('id', request.id);
        if (requestResult.error) throw requestResult.error;
      }
    }

    await hydrateRemoteState();
  },

  getClaims(): Claim[] {
    return localStore.getState().claims;
  },

  getClaimDetail(id: string) {
    const state = localStore.getState();
    const claim = state.claims.find((c) => c.id === id) || null;
    const timeline = state.claim_timeline.filter((t) => t.claim_id === id);
    const vehicles = state.claim_vehicles.filter((v) => v.claim_id === id);
    const witnesses = state.claim_witnesses.filter((w) => w.claim_id === id);
    const client = claim ? state.clients.find((c) => c.id === claim.client_id) : null;
    return { claim, timeline, vehicles, witnesses, client };
  },

  async advanceClaimStage(claimId: string, nextStatus: any, title: string, description: string) {
    const result = await supabase.rpc('update_claim_status', {
      p_claim_id: claimId,
      p_status: nextStatus,
      p_description: `${title}: ${description}`,
    });
    if (result.error) throw result.error;
    await hydrateRemoteState();
  },

  getReminders(): Reminder[] {
    return localStore.getState().reminders;
  },

  async completeReminder(reminderId: string) {
    const result = await supabase.from('reminders').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', reminderId);
    if (result.error) throw result.error;
    await hydrateRemoteState();
  },

  getKPIs() {
    const state = localStore.getState();
    const totalAUM = state.investments.reduce((sum, i) => sum + Number(i.current_value), 0);
    const activeClientsCount = state.clients.filter((c) => c.status === 'active').length;
    const openRequestsCount = state.requests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length;
    const activeClaimsCount = state.claims.filter((c) => c.status !== 'completed' && c.status !== 'cancelled').length;
    const pendingRemindersCount = state.reminders.filter((r) => r.status === 'pending').length;

    return {
      totalAUM,
      activeClientsCount,
      openRequestsCount,
      activeClaimsCount,
      pendingRemindersCount,
    };
  },

  async generateOfficialDocument(clientId: string, docType: string, title: string) {
    const user = localStore.getState().currentUser;
    const newDoc = {
      client_id: clientId,
      name: `${title}.pdf`,
      document_type: docType as any,
      file_path: `generated/${clientId}/${docType}.pdf`,
      file_size: 245000,
      mime_type: 'application/pdf',
      is_verified: true,
      verified_by: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const result = await supabase.from('documents').insert(newDoc);
    if (result.error) throw result.error;
    await hydrateRemoteState();
    return result.data?.[0] || newDoc;
  },
};
