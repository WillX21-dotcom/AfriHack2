import { ValidationError } from './client';

export function validateRequestSubmission(data: {
  request_type?: string;
  title?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.request_type || data.request_type.trim() === '') {
    errors.push({ field: 'request_type', message: 'Please select a request category.' });
  }

  if (!data.title || data.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Request title must contain at least 3 characters.' });
  }

  return errors;
}
