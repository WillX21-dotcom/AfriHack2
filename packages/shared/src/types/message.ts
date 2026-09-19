export type MessageDirection = 'client_to_royal' | 'royal_to_client';

export interface Message {
  id: string;
  client_id: string;
  sender_id: string;
  recipient_id: string | null;
  request_id: string | null;
  claim_id: string | null;
  direction: MessageDirection;
  subject: string | null;
  body: string;
  attachment_path: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}
