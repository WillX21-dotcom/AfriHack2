import { hydrateRemoteState, localStore, supabase } from '@supabase-pkg/client';

export type ProfileDetails = {
  first_name: string;
  last_name: string;
  phone: string;
};

export async function updateCurrentProfile(details: ProfileDetails): Promise<void> {
  const currentUser = localStore.getState().currentUser;
  if (!currentUser?.id) throw new Error('No authenticated profile found.');

  const firstName = details.first_name.trim();
  const lastName = details.last_name.trim();
  const phone = details.phone.trim();
  if (!firstName || !lastName) throw new Error('First and last name are required.');

  const authResult = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName },
  });
  if (authResult.error) throw authResult.error;

  const profileResult = await supabase.from('profiles').update({
    first_name: firstName,
    last_name: lastName,
    phone: phone || null,
    updated_at: new Date().toISOString(),
  }).eq('id', currentUser.id);
  if (profileResult.error) throw profileResult.error;

  await hydrateRemoteState();
}