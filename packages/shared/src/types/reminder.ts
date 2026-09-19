export type ReminderFrequency = 'once' | 'monthly' | 'quarterly' | 'six_monthly' | 'yearly' | 'every_two_years';

export interface Reminder {
  id: string;
  client_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  reminder_date: string;
  frequency: ReminderFrequency;
  is_completed: boolean;
  completed_at: string | null;
  last_notified_at: string | null;
  notify_client: boolean;
  notify_adviser: boolean;
  related_document_id: string | null;
  related_policy_id: string | null;
  created_at: string;
  updated_at: string;
}
