import { dataStore, hydrateRemoteState, supabase } from '@supabase-pkg/client';
import { monthlyAmount } from '@shared/format';
import type { GoalType } from '@shared/types/goal';
import { clientService } from './client';

export const financialService = {
  getSummary() {
    const client = clientService.getCurrentClient();
    const state = dataStore.getState();
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

    return {
      totalAssets,
      totalInvestments,
      totalLiabilities,
      netWorth: totalAssets + totalInvestments - totalLiabilities,
      totalMonthlyIncome: income.reduce((sum, inc) => sum + monthlyAmount(inc.amount, inc.frequency), 0),
      totalMonthlyExpenses: expenses.reduce((sum, exp) => sum + monthlyAmount(exp.amount, exp.frequency), 0),
      hasFinancialData: assets.length + liabilities.length + investments.length + policies.length + income.length + expenses.length > 0,
      assets,
      liabilities,
      policies,
      investments,
      goals,
      income,
      expenses,
    };
  },

  async addGoal(goal: { name: string; target_amount: number; current_amount: number; target_date: string | null; goal_type: GoalType }): Promise<void> {
    const client = clientService.getCurrentClient();
    if (!client) throw new Error('No client file is linked to this account.');
    if (!goal.name.trim()) throw new Error('Please enter a goal name.');
    if (!(goal.target_amount > 0)) throw new Error('Please enter a target amount greater than zero.');

    const { error } = await supabase.from('goals').insert({
      client_id: client.id,
      name: goal.name.trim(),
      goal_type: goal.goal_type,
      target_amount: goal.target_amount,
      current_amount: Math.max(0, goal.current_amount || 0),
      target_date: goal.target_date || null,
      status: 'active',
      is_shared: true,
    });
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },

  async updateGoalProgress(goalId: string, currentAmount: number): Promise<void> {
    if (!(currentAmount >= 0)) throw new Error('Please enter a valid amount.');
    const { error } = await supabase.from('goals').update({ current_amount: currentAmount }).eq('id', goalId);
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },

  async removeGoal(goalId: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },
};
