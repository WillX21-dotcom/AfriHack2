export const REQUEST_TYPES = {
  CHANGE_ADDRESS: 'change_address',
  CHANGE_BANK_DETAILS: 'change_bank_details',
  CHANGE_BENEFICIARY: 'change_beneficiary',
  POLICY_DOCUMENT: 'policy_document',
  BORDER_LETTER: 'border_letter',
  IRPS: 'irps',
  CONSULTATION: 'consultation',
  CLIENT_INFORMATION: 'client_information',
  BALANCE_SHEET: 'balance_sheet',
  INCOME_STATEMENT: 'income_statement',
  DRIVER_LICENSE: 'driver_license',
  INSURANCE_CERTIFICATE: 'insurance_certificate',
  POLICY_CHANGE: 'policy_change',
  INVESTMENT_REQUEST: 'investment_request',
  GENERAL: 'general',
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  change_address: 'Change Residential Address',
  change_bank_details: 'Update Banking Details',
  change_beneficiary: 'Beneficiary Nomination Update',
  policy_document: 'Request Policy Document / Schedule',
  border_letter: 'Cross-Border Vehicle Clearance Letter',
  irps: 'IRPS Tax Assessment Schedule',
  consultation: 'Book Adviser Consultation',
  client_information: 'Update KYC / Personal Information',
  balance_sheet: 'Request Verified Balance Sheet',
  income_statement: 'Request Financial Income Statement',
  driver_license: 'Upload Driver License Renewal',
  insurance_certificate: 'Issue Insurance Confirmation Certificate',
  policy_change: 'Amend Policy Coverage / Excess',
  investment_request: 'Portfolio Reallocation / Withdrawal',
  general: 'General Advisory Inquiry',
};

export const REQUEST_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type RequestPriority = (typeof REQUEST_PRIORITIES)[keyof typeof REQUEST_PRIORITIES];
