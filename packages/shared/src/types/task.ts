import { TaskStatus } from '../constants/statuses';
import { RequestPriority } from '../constants/request-types';

export interface Task {
  id: string;
  client_id: string | null;
  assigned_to: string | null;
  request_id: string | null;
  claim_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: RequestPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
