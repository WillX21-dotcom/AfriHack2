export const MOCK_INSURER_RESPONSES = {
  lodgeSuccess: (claimNumber: string, insurerName: string) => ({
    status: 200,
    data: {
      claimNumber,
      insurerReference: `${insurerName.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
      receivedTimestamp: new Date().toISOString(),
      handler: 'Santam First Response Team',
    },
  }),
};
