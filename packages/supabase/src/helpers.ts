import { supabase, localStore } from './client';
import { Client } from '../../shared/src/types/client';
import { Profile } from '../../shared/src/types/user';

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (error || !profile) return null;
  return profile as Profile;
}

export async function getCurrentClientData(): Promise<Client | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const state = localStore.getState();
  const client = state.clients.find((c) => c.profile_id === profile.id);
  return client || state.clients[0] || null;
}

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
