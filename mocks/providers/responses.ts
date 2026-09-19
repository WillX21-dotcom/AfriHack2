export const MOCK_PROVIDER_RESPONSES = {
  fetchValuation: (accountNumber: string) => ({
    success: true,
    accountNumber,
    lastValuationDate: new Date().toISOString(),
    navUnitPrice: 142.85,
    currency: 'ZAR',
  }),
};
