export interface MockEmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export const MOCK_EMAIL_INBOX: MockEmailRecord[] = [
  {
    id: 'em-1',
    to: 'sipho.dlamini@royalsquare.co.za',
    subject: 'Claim Update: Assessor Appointed for BMW X5 (CLM-20250918-X9921)',
    body: 'Dear Sipho, Royal Square has liaised with Santam. Senior Assessor Sarah Van Der Merwe will inspect your vehicle tomorrow at Renew-It Sandton.',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'em-2',
    to: 'sipho.dlamini@royalsquare.co.za',
    subject: 'Service Request In Progress: Discovery Life Policy Schedule',
    body: 'Dear Sipho, your adviser Kagiso Mabena is retrieving your Discovery Life schedule. Estimated delivery is within 2 business days.',
    date: new Date(Date.now() - 86400000).toISOString(),
  },
];
