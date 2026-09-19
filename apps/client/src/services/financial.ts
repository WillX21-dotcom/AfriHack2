import { localStore } from '@supabase-pkg/client';
import { clientService } from './client';

export const financialService = {
  getSummary() {
    const client = clientService.getCurrentClient();
    const state = localStore.getState();
    const clientId = client?.id;

    const assets = state.assets.filter((a) => a.client_id === clientId);
    const liabilities = state.liabilities.filter((l) => l.client_id === clientId);
    const policies = state.policies.filter((p) => p.client_id === clientId);
    const investments = state.investments.filter((i) => i.client_id === clientId);
    const goals = state.goals.filter((g) => g.client_id === clientId);
    const income = state.income.filter((inc) => inc.client_id === clientId);
    const expenses = state.expenses.filter((exp) => exp.client_id === clientId);

    const totalAssets = assets.reduce((sum, a) => sum + Number(a.current_value), 0);
    const totalInvestments = investments.reduce((sum, i) => sum + Number(i.current_value), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.outstanding_balance), 0);
    const netWorth = totalAssets + totalInvestments - totalLiabilities;
    const totalMonthlyIncome = income.reduce((sum, inc) => sum + Number(inc.amount), 0);
    const totalMonthlyExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    return {
      totalAssets,
      totalInvestments,
      totalLiabilities,
      netWorth,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      assets,
      liabilities,
      policies,
      investments,
      goals,
      income,
      expenses,
    };
  },

  addGoal(goalData: { name: string; target_amount: number; current_amount: number; target_date: string; goal_type: any; is_shared: boolean }) {
    const client = clientService.getCurrentClient();
    const state = localStore.getState();
    const newGoal = {
      id: `goal-${Date.now()}`,
      client_id: client?.id,
      name: goalData.name,
      goal_type: goalData.goal_type || 'investment',
      description: null,
      target_amount: Number(goalData.target_amount),
      current_amount: Number(goalData.current_amount || 0),
      target_date: goalData.target_date,
      status: 'active' as const,
      is_shared: goalData.is_shared,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.goals.push(newGoal);
    localStore.saveState();
    return newGoal;
  },
};
