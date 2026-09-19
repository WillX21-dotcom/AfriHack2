export interface Policy {
  id: string;
  client_id: string;
  provider_id: string | null;
  policy_number: string | null;
  policy_type: string | null;
  premium: number;
  premium_frequency: string | null;
  sum_assured: number;
  status: string;
  start_date: string | null;
  renewal_date: string | null;
  debit_order_day: number | null;
  created_at: string;
  updated_at: string;
  provider_name?: string;
}
