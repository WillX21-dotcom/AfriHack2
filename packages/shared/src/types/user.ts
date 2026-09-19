import { UserRole } from '../constants/roles';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  user: Profile | null;
  token?: string;
  client?: import('./client').Client | null;
}
