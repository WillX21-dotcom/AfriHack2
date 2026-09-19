export interface Provider {
  id: string;
  name: string;
  provider_type: string;
  api_enabled: boolean;
  mock_enabled: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}
