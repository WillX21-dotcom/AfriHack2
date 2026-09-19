import { dataStore, hydrateRemoteState, supabase, type ClientRecord } from '@supabase-pkg/client';
import { getCurrentClient } from '@supabase-pkg/helpers';
import type { Beneficiary, Dependant } from '@shared/types/dependant';
import type { Profile } from '@shared/types/user';

export type PersonalDetails = {
  id_number: string;
  date_of_birth: string;
  marital_status: string;
  occupation: string;
  employer: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  preferred_contact_method: 'app' | 'email' | 'phone';
};

export const clientService = {
  getCurrentClient(): ClientRecord | null {
    return getCurrentClient();
  },

  getAdviser(): Profile | null {
    return this.getCurrentClient()?.adviser ?? null;
  },

  getDependants(clientId: string): Dependant[] {
    return dataStore.getState().dependants.filter((d) => d.client_id === clientId);
  },

  getBeneficiaries(clientId: string): Beneficiary[] {
    return dataStore.getState().beneficiaries.filter((b) => b.client_id === clientId);
  },

  /** Fields a client may maintain themselves; adviser-managed fields are protected by the database. */
  async updatePersonalDetails(details: PersonalDetails): Promise<void> {
    const client = this.getCurrentClient();
    if (!client) throw new Error('No client file is linked to this account.');

    const clean = (value: string) => value.trim() || null;
    const { error } = await supabase
      .from('clients')
      .update({
        id_number: clean(details.id_number),
        date_of_birth: clean(details.date_of_birth),
        marital_status: clean(details.marital_status),
        occupation: clean(details.occupation),
        employer: clean(details.employer),
        address_line_1: clean(details.address_line_1),
        address_line_2: clean(details.address_line_2),
        city: clean(details.city),
        province: clean(details.province),
        postal_code: clean(details.postal_code),
        preferred_contact_method: details.preferred_contact_method,
      })
      .eq('id', client.id);
    if (error) throw new Error(error.message);
    await hydrateRemoteState();
  },
};
