export const REQUEST_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  IN_PROGRESS: 'in_progress',
  WAITING_CLIENT: 'waiting_client',
  WAITING_PROVIDER: 'waiting_provider',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

export const CLAIM_STATUSES = {
  DRAFT: 'draft',
  REPORTED: 'reported',
  SUBMITTED: 'submitted',
  INSURER_RECEIVED: 'insurer_received',
  HANDLER_ASSIGNED: 'handler_assigned',
  ASSESSMENT_PENDING: 'assessment_pending',
  ASSESSMENT_COMPLETE: 'assessment_complete',
  QUOTES_PENDING: 'quotes_pending',
  AUTHORISATION_PENDING: 'authorisation_pending',
  AUTHORISED: 'authorised',
  REPAIR_BOOKED: 'repair_booked',
  REPAIR_IN_PROGRESS: 'repair_in_progress',
  VEHICLE_READY: 'vehicle_ready',
  HIRE_CAR_RETURNED: 'hire_car_returned',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[keyof typeof CLAIM_STATUSES];

export const TASK_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = (typeof TASK_STATUSES)[keyof typeof TASK_STATUSES];

export const GOAL_STATUSES = {
  ACTIVE: 'active',
  ACHIEVED: 'achieved',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export type GoalStatus = (typeof GOAL_STATUSES)[keyof typeof GOAL_STATUSES];
