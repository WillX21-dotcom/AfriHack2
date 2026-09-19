import { ClaimStatus } from '../constants/statuses';
import { ClaimType } from '../constants/claim-types';
import { Client } from './client';
import { Profile } from './user';

export interface Claim {
  id: string;
  client_id: string;
  created_by: string | null;
  assigned_to: string | null;
  provider_id: string | null;
  claim_number: string | null;
  claim_type: ClaimType;
  status: ClaimStatus;
  incident_date: string | null;
  incident_location: string | null;
  incident_description: string | null;
  police_reported: boolean;
  police_case_number: string | null;
  police_station: string | null;
  insurer_reference: string | null;
  handler_name: string | null;
  handler_contact: string | null;
  assessment_date: string | null;
  repair_authorised: boolean;
  repair_date: string | null;
  hire_car_required: boolean;
  hire_car_provider: string | null;
  hire_car_start: string | null;
  hire_car_end: string | null;
  repairer_name: string | null;
  closed_at: string | null;
  provider_name?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Joined relations
  client?: Client;
  creator?: Profile;
  timeline?: ClaimTimeline[];
  vehicles?: ClaimVehicle[];
  witnesses?: ClaimWitness[];
}

export interface ClaimTimeline {
  id: string;
  claim_id: string;
  created_by: string | null;
  status: ClaimStatus | null;
  title: string;
  description: string | null;
  is_client_visible: boolean;
  created_at: string;
}

export interface ClaimWitness {
  id: string;
  claim_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  statement: string | null;
  voice_note_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimVehicle {
  id: string;
  claim_id: string;
  is_client_vehicle: boolean;
  registration_number: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  driver_name: string | null;
  driver_license_number: string | null;
  owner_name: string | null;
  insurer_name: string | null;
  policy_number: string | null;
  damage_description: string | null;
  created_at: string;
  updated_at: string;
}
