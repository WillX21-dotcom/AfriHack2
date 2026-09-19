import { dataStore, hydrateRemoteState, supabase } from '@supabase-pkg/client';
import { uploadClientDocument } from '@supabase-pkg/helpers';
import type { Claim, ClaimTimeline, ClaimVehicle, ClaimWitness } from '@shared/types/claim';
import type { DocumentRecord } from '@shared/types/document';
import { clientService } from './client';

export interface AccidentReport {
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  insuredVehicle?: string;
  policeCaseNumber?: string;
  policeStation?: string;
  thirdParty?: { registration?: string; makeModel?: string; driverName?: string; insurer?: string };
  witness?: { name?: string; phone?: string; statement?: string };
  photos?: Blob[];
  voiceNote?: Blob | null;
}

export const claimService = {
  getClaims(): Claim[] {
    const client = clientService.getCurrentClient();
    return dataStore.getState().claims.filter((c) => c.client_id === client?.id);
  },

  getClaimDetail(claimId: string): {
    claim: Claim | null;
    timeline: ClaimTimeline[];
    vehicles: ClaimVehicle[];
    witnesses: ClaimWitness[];
    documents: DocumentRecord[];
  } {
    const state = dataStore.getState();
    const client = clientService.getCurrentClient();
    const claim = state.claims.find((c) => c.id === claimId && c.client_id === client?.id) || null;
    return {
      claim,
      // RLS already hides internal notes; the flag check keeps the screen correct if that ever changes.
      timeline: state.claim_timeline.filter((t) => t.claim_id === claimId && t.is_client_visible),
      vehicles: state.claim_vehicles.filter((v) => v.claim_id === claimId),
      witnesses: state.claim_witnesses.filter((w) => w.claim_id === claimId),
      documents: state.documents.filter((d) => d.claim_id === claimId),
    };
  },

  async reportMotorAccident(report: AccidentReport): Promise<string> {
    const client = clientService.getCurrentClient();
    if (!client) throw new Error('No client file is linked to this account.');

    const { data, error } = await supabase.rpc('create_motor_claim', {
      p_incident_date: report.incidentDate,
      p_incident_location: report.incidentLocation,
      p_incident_description: report.incidentDescription,
      p_police_case_number: report.policeCaseNumber?.trim() || null,
      p_police_station: report.policeStation?.trim() || null,
      p_provider_id: null,
      p_insured_vehicle: report.insuredVehicle?.trim() || null,
    });
    if (error) throw new Error(error.message);
    const claimId = String(data);

    // The claim exists now; everything below is supplementary, so failures are collected, not thrown.
    const problems: string[] = [];
    const tp = report.thirdParty;
    if (tp && (tp.registration || tp.makeModel || tp.driverName)) {
      const result = await supabase.from('claim_vehicles').insert({
        claim_id: claimId,
        is_client_vehicle: false,
        registration_number: tp.registration?.trim() || null,
        make: tp.makeModel?.trim() || null,
        driver_name: tp.driverName?.trim() || null,
        owner_name: tp.driverName?.trim() || null,
        insurer_name: tp.insurer?.trim() || null,
      });
      if (result.error) problems.push(`third-party details (${result.error.message})`);
    }

    if (report.witness?.name?.trim()) {
      const result = await supabase.from('claim_witnesses').insert({
        claim_id: claimId,
        full_name: report.witness.name.trim(),
        phone: report.witness.phone?.trim() || null,
        statement: report.witness.statement?.trim() || null,
      });
      if (result.error) problems.push(`witness details (${result.error.message})`);
    }

    const stamp = Date.now();
    for (const [index, photo] of (report.photos || []).entries()) {
      try {
        await uploadClientDocument({
          clientId: client.id,
          file: photo,
          fileName: `accident-photo-${stamp}-${index + 1}.jpg`,
          documentType: 'claim_document',
          claimId,
          metadata: { kind: 'accident_photo' },
        });
      } catch (err) {
        problems.push(`photo ${index + 1} (${(err as Error).message})`);
      }
    }

    if (report.voiceNote) {
      try {
        await uploadClientDocument({
          clientId: client.id,
          file: report.voiceNote,
          fileName: `voice-statement-${stamp}.webm`,
          documentType: 'claim_document',
          claimId,
          metadata: { kind: 'voice_statement' },
        });
      } catch (err) {
        problems.push(`voice statement (${(err as Error).message})`);
      }
    }

    await hydrateRemoteState();
    if (problems.length > 0) {
      throw Object.assign(
        new Error(`Claim reported, but some items could not be saved: ${problems.join('; ')}. Message your adviser to add them.`),
        { claimId }
      );
    }
    return claimId;
  },
};
