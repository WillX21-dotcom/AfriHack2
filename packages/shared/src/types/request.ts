import { RequestPriority, RequestType } from '../constants/request-types';
import { RequestStatus } from '../constants/statuses';
import { Profile } from './user';
import { Client } from './client';

export interface Request {
  id: string;
  client_id: string;
  created_by: string | null;
  assigned_to: string | null;
  request_number: string | null;
  request_type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Joined relations
  client?: Client;
  creator?: Profile;
  assignee?: Profile;
  workflows?: import('./workflow').RequestWorkflow[];
}
