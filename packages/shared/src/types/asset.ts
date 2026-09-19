export type AssetType = 'property' | 'vehicle' | 'investment' | 'cash' | 'business' | 'pension' | 'other';

export interface Asset {
  id: string;
  client_id: string;
  asset_type: AssetType;
  name: string;
  description: string | null;
  current_value: number;
  institution: string | null;
  created_at: string;
  updated_at: string;
}
