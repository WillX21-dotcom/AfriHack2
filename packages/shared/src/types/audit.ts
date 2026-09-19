export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'upload'
  | 'download'
  | 'status_change'
  | 'assign'
  | 'complete';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  description: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
}
