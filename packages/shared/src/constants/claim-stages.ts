import type { ClaimStatus } from './statuses';

/**
 * The ordered claim lifecycle shared by the client app and the adviser dashboard, so both sides
 * always describe a claim with the same stages. 'draft', 'rejected' and 'cancelled' sit outside the
 * happy path and are not part of the progress bar.
 */
export const CLAIM_STAGES: ReadonlyArray<{ key: ClaimStatus; label: string; clientLabel: string }> = [
  { key: 'reported', label: 'Incident logged', clientLabel: 'Incident reported' },
  { key: 'submitted', label: 'Validated', clientLabel: 'Checked by Royal Square' },
  { key: 'insurer_received', label: 'Insurer received', clientLabel: 'Received by insurer' },
  { key: 'handler_assigned', label: 'Handler assigned', clientLabel: 'Claims handler assigned' },
  { key: 'assessment_pending', label: 'Assessment due', clientLabel: 'Assessment scheduled' },
  { key: 'assessment_complete', label: 'Assessed', clientLabel: 'Assessment complete' },
  { key: 'quotes_pending', label: 'Quotes pending', clientLabel: 'Repair quotes pending' },
  { key: 'authorisation_pending', label: 'Authorisation pending', clientLabel: 'Awaiting authorisation' },
  { key: 'authorised', label: 'Authorised', clientLabel: 'Repairs authorised' },
  { key: 'repair_booked', label: 'Repair booked', clientLabel: 'Repair booked' },
  { key: 'repair_in_progress', label: 'In repair', clientLabel: 'Vehicle being repaired' },
  { key: 'vehicle_ready', label: 'Vehicle ready', clientLabel: 'Ready for collection' },
  { key: 'hire_car_returned', label: 'Hire car returned', clientLabel: 'Courtesy vehicle returned' },
  { key: 'completed', label: 'Settled and closed', clientLabel: 'Claim closed' },
];

export function claimStageIndex(status: string): number {
  return CLAIM_STAGES.findIndex((stage) => stage.key === status);
}

export function nextClaimStage(status: string) {
  const index = claimStageIndex(status);
  return index >= 0 ? CLAIM_STAGES[index + 1] ?? null : CLAIM_STAGES[0];
}
