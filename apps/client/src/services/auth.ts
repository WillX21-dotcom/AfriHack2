import { supabase } from '@supabase-pkg/client';
import { Profile } from '@shared/types/user';

export const authService = {
  async getCurrentUser(): Promise<Profile | null> {
    const { data } = await supabase.auth.getUser();
    return data.user as Profile | null;
  },

  async login(email: string, password?: string): Promise<{ user: Profile | null; error: any }> {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return { user: res.data.user as Profile | null, error: res.error };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

};
