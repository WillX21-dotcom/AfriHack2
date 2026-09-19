export interface RequestWorkflow {
  id: string;
  request_id: string;
  step_number: number;
  step_key: string;
  step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
