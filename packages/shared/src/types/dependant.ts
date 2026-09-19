export interface Dependant {
  id: string;
  client_id: string;
  full_name: string;
  relationship: string | null;
  date_of_birth: string | null;
  id_number: string | null;
  is_dependent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  client_id: string;
  full_name: string;
  relationship: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  percentage: number | null;
  contact_number: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
