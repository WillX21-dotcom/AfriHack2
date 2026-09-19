export interface Investment {
  id: string;
  client_id: string;
  provider_id: string | null;
  investment_name: string;
  account_number: string | null;
  current_value: number;
  monthly_contribution: number;
  investment_type: string | null;
  created_at: string;
  updated_at: string;
  provider_name?: string;
}
