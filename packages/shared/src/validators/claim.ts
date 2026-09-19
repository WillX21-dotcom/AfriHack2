import { ValidationError } from './client';

export function validateMotorClaimSubmission(data: {
  incident_date?: string;
  incident_location?: string;
  incident_description?: string;
  police_reported?: boolean;
  police_case_number?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.incident_date) {
    errors.push({ field: 'incident_date', message: 'Incident date and approximate time are mandatory.' });
  }

  if (!data.incident_location || data.incident_location.trim().length < 3) {
    errors.push({ field: 'incident_location', message: 'Please specify the road, intersection, or city of incident.' });
  }

  if (!data.incident_description || data.incident_description.trim().length < 10) {
    errors.push({ field: 'incident_description', message: 'Provide a brief description of damage and collision circumstances (min 10 characters).' });
  }

  if (data.police_reported && (!data.police_case_number || data.police_case_number.trim() === '')) {
    errors.push({ field: 'police_case_number', message: 'SAPS Case Number (e.g. CAS 123/09/2025) is required when police have been notified.' });
  }

  return errors;
}
