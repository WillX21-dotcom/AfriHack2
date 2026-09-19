export interface ProviderHealth {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'syncing' | 'degraded';
  lastPingMs: number;
  lastSyncTime: string;
  apiProtocol: string;
}

export const providerService = {
  getProviders(): ProviderHealth[] {
    return [
      {
        id: 'santam',
        name: 'Santam B2B Gateway',
        category: 'Short-Term Motor & Commercial Insurance',
        status: 'operational',
        lastPingMs: 42,
        lastSyncTime: '2 mins ago',
        apiProtocol: 'REST / OAuth2 + Webhooks',
      },
      {
        id: 'discovery',
        name: 'Discovery Life Direct Connect',
        category: 'Life Assurance, Severe Illness & Vitality',
        status: 'operational',
        lastPingMs: 65,
        lastSyncTime: '15 mins ago',
        apiProtocol: 'SOAP / XML MTLS Mutual Auth',
      },
      {
        id: 'allangray',
        name: 'Allan Gray Platform API',
        category: 'Unit Trusts, Retirement Annuities & Offshore',
        status: 'operational',
        lastPingMs: 51,
        lastSyncTime: '1 hour ago',
        apiProtocol: 'JSON-RPC 2.0 Secure Token',
      },
      {
        id: 'europcar',
        name: 'Europcar Courtesy Fleet Dispatch',
        category: 'Car Rental & Accident Replacement Logistics',
        status: 'operational',
        lastPingMs: 88,
        lastSyncTime: '5 mins ago',
        apiProtocol: 'REST Webhooks API',
      },
    ];
  },

  simulateSync(providerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 800);
    });
  },
};
