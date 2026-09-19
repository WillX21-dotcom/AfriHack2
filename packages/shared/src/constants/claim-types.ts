export const CLAIM_TYPES = {
  MOTOR: 'motor',
  HOME: 'home',
  LIFE: 'life',
  TRAVEL: 'travel',
  OTHER: 'other',
} as const;

export type ClaimType = (typeof CLAIM_TYPES)[keyof typeof CLAIM_TYPES];

export const CLAIM_STAGE_LABELS: Record<string, string> = {
  draft: 'Draft Created',
  reported: 'Incident Reported',
  submitted: 'Submitted to Royal Square',
  insurer_received: 'Insurer Received',
  handler_assigned: 'Assessor / Handler Assigned',
  assessment_pending: 'Physical Assessment Scheduled',
  assessment_complete: 'Assessment Complete',
  quotes_pending: 'Parts & Panel Beater Quotes Pending',
  authorisation_pending: 'Authorisation Pending',
  authorised: 'Repairs Authorised',
  repair_booked: 'Panel Beater Booking Confirmed',
  repair_in_progress: 'Vehicle In Repair Bay',
  vehicle_ready: 'Vehicle Ready For Collection',
  hire_car_returned: 'Courtesy Vehicle Returned',
  completed: 'Claim Closed & Settled',
  rejected: 'Claim Repudiated',
  cancelled: 'Claim Withdrawn',
};
