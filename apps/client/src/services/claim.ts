import { localStore, supabase, hydrateRemoteState } from '@supabase-pkg/client';
import { clientService } from './client';
import { Claim, ClaimTimeline, ClaimVehicle, ClaimWitness } from '@shared/types/claim';

export const claimService = {
  getClaims(): Claim[] {
    const client = clientService.getCurrentClient();
    const state = localStore.getState();
    return state.claims.filter((c) => c.client_id === client?.id);
  },

  getClaimDetail(claimId: string): {
    claim: Claim | null;
    timeline: ClaimTimeline[];
    vehicles: ClaimVehicle[];
    witnesses: ClaimWitness[];
  } {
    const state = localStore.getState();
    const claim = state.claims.find((c) => c.id === claimId) || null;
    const timeline = state.claim_timeline.filter((t) => t.claim_id === claimId && t.is_client_visible);
    const vehicles = state.claim_vehicles.filter((v) => v.claim_id === claimId);
    const witnesses = state.claim_witnesses.filter((w) => w.claim_id === claimId);
    return { claim, timeline, vehicles, witnesses };
  },

  async reportMotorAccident(data: {
    incidentDate: string;
    incidentLocation: string;
    incidentDescription: string;
    policeReported: boolean;
    policeCaseNumber?: string;
    policeStation?: string;
    thirdPartyDetails?: any;
    witnessDetails?: any;
    photos?: string[];
  }) {
    const providerResult = await supabase.from('providers').select('id').eq('name', 'Santam').single();
    const res = await supabase.rpc('create_motor_claim', {
      p_incident_date: data.incidentDate,
      p_incident_location: data.incidentLocation,
      p_incident_description: data.incidentDescription,
      p_police_case_number: data.policeCaseNumber || 'CAS PENDING',
      p_police_station: data.policeStation || 'Local SAPS',
      p_provider_id: providerResult.data?.id || null,
    });

    if (res.error) throw res.error;

    const claimId = res.data;

    // Store third party if provided
    if (data.thirdPartyDetails?.make || data.thirdPartyDetails?.registration) {
      const vehicleResult = await supabase.from('claim_vehicles').insert({
        claim_id: claimId,
        is_client_vehicle: false,
        registration_number: data.thirdPartyDetails.registration || null,
        make: data.thirdPartyDetails.make || null,
        model: data.thirdPartyDetails.model || null,
        year: null,
        driver_name: data.thirdPartyDetails.driverName || null,
        driver_license_number: null,
        owner_name: data.thirdPartyDetails.driverName || null,
        insurer_name: data.thirdPartyDetails.insurer || null,
        policy_number: null,
        damage_description: data.thirdPartyDetails.damage || 'Front/side contact',
      });
      if (vehicleResult.error) throw vehicleResult.error;
    }

    if (data.witnessDetails?.name) {
      const witnessResult = await supabase.from('claim_witnesses').insert({
        claim_id: claimId,
        full_name: data.witnessDetails.name,
        phone: data.witnessDetails.phone || null,
        email: null,
        address: null,
        statement: data.witnessDetails.notes || 'Eyewitness at scene',
        voice_note_path: null,
      });
      if (witnessResult.error) throw witnessResult.error;
    }

    await hydrateRemoteState();
    return claimId;
  },
};
