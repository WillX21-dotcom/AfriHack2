export type LiabilityType = 'bond' | 'vehicle_finance' | 'personal_loan' | 'credit_card' | 'business_loan' | 'other';

export interface Liability {
  id: string;
  client_id: string;
  liability_type: LiabilityType;
  name: string;
  institution: string | null;
  outstanding_balance: number;
  monthly_payment: number;
  interest_rate: number | null;
  created_at: string;
  updated_at: string;
}
