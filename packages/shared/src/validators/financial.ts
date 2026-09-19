import { ValidationError } from './client';

export function validateFinancialAmount(amount: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (isNaN(amount) || amount < 0) {
    errors.push({ field: fieldName, message: `${fieldName} must be a valid positive numerical figure.` });
  }
  return errors;
}
