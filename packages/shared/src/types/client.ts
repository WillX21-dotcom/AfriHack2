import { Profile } from './user';

export interface Client {
  id: string;
  profile_id: string;
  client_number: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  marital_status: string | null;
  occupation: string | null;
  employer: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  preferred_contact_method: 'app' | 'email' | 'phone' | null;
  risk_profile: string | null;
  adviser_id: string | null;
  onboarding_completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  profile?: Profile;
  adviser?: Profile;
}
