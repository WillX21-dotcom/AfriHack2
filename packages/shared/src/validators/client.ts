export interface ValidationError {
  field: string;
  message: string;
}

export function validateClientProfile(data: {
  id_number?: string | null;
  phone?: string | null;
  email?: string | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.id_number) {
    const cleanId = data.id_number.trim();
    if (!/^\d{13}$/.test(cleanId)) {
      errors.push({ field: 'id_number', message: 'South African ID must be exactly 13 numeric digits.' });
    }
  }

  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address.' });
    }
  }

  return errors;
}
