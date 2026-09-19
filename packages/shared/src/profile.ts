import { dataStore, hydrateRemoteState, supabase } from '@supabase-pkg/client';
import { syncSessionWithProfile } from './auth';

export type ProfileDetails = {
  first_name: string;
  last_name: string;
  phone: string;
};

export async function updateCurrentProfile(details: ProfileDetails): Promise<void> {
  const currentUser = dataStore.getState().currentUser;
  if (!currentUser?.id) throw new Error('No authenticated profile found.');

  const firstName = details.first_name.trim();
  const lastName = details.last_name.trim();
  const phone = details.phone.trim();
  if (!firstName || !lastName) throw new Error('First and last name are required.');

  // Role, status and email are protected server-side; only these three fields are ever sent.
  const profileResult = await supabase
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, phone: phone || null })
    .eq('id', currentUser.id);
  if (profileResult.error) throw new Error(profileResult.error.message);

  const authResult = await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName } });
  if (authResult.error) throw new Error(authResult.error.message);

  await hydrateRemoteState();
  syncSessionWithProfile(dataStore.getState().currentUser);
}
