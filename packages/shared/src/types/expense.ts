export interface Expense {
  id: string;
  client_id: string;
  category: string;
  amount: number;
  frequency: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFinancialSummary {
  client_id: string;
  total_assets: number;
  total_investments: number;
  total_liabilities: number;
  net_worth: number;
  total_income: number;
  total_expenses: number;
}
