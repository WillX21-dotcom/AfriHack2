export interface MockInsurerClaimRecord {
  claimNumber: string;
  insurer: string;
  assessor: string;
  status: string;
  estimatedSettlement: number;
}

export const MOCK_INSURER_CLAIMS: MockInsurerClaimRecord[] = [
  {
    claimNumber: 'CLM-20250918-X9921',
    insurer: 'Santam Insurance',
    assessor: 'Sarah Van Der Merwe',
    status: 'handler_assigned',
    estimatedSettlement: 48500.0,
  },
];
