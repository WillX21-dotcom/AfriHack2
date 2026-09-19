import { GoalStatus } from '../constants/statuses';

export type GoalType = 'retirement' | 'property' | 'vehicle' | 'education' | 'emergency_fund' | 'travel' | 'investment' | 'business' | 'other';

export interface Goal {
  id: string;
  client_id: string;
  name: string;
  goal_type: GoalType;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: GoalStatus;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}
