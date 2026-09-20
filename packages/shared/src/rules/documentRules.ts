// Deterministic rules that decide what happens to an OCR'd document.
// Pure and import-free on purpose: the Supabase edge function (Deno) imports this file directly,
// and the apps import it through the shared package, so both always apply the same policy.

export type OcrDocumentType = 'id_document' | 'proof_of_address';
export type RuleOutcomeStatus = 'auto_completed' | 'under_review' | 'rejected';

/** Document types that go through OCR. Everything else keeps the manual adviser verification. */
export const OCR_ELIGIBLE_TYPES: readonly OcrDocumentType[] = ['id_document', 'proof_of_address'];

/** At or above this (with every required field valid) a document completes without a human. */
export const AUTO_COMPLETE_MIN_CONFIDENCE = 0.85;
/** Below this the scan is treated as unreadable and rejected. Between the two it goes to an adviser. */
export const REVIEW_MIN_CONFIDENCE = 0.5;
/** A client may re-upload this many times after a rejection; the next failure escalates to an adviser. */
export const MAX_REUPLOADS = 5;

export const REQUIRED_FIELDS: Record<OcrDocumentType, readonly string[]> = {
  id_document: ['full_name', 'id_number', 'date_of_birth'],
  proof_of_address: ['address', 'document_date'],
};

export interface DocumentRuleInput {
  documentType: string;
  /** Model confidence, 0-1. null when nothing could be read. */
  confidence: number | null;
  extractedFields: Record<string, unknown>;
  /** Set false when the model says the file is not a legible document at all. */
  readable?: boolean;
  /** Set false when the model says this is a different kind of document than the client claimed. */
  matchesType?: boolean;
  /** Earlier rejected uploads of this document type for this client. */
  reuploadCount: number;
}

export interface DocumentRuleResult {
  status: RuleOutcomeStatus;
  humanReview: boolean;
  /** Shown to the client on rejection and to the adviser on review. null when auto-completed. */
  reason: string | null;
  /** True when the re-upload limit is exhausted: an adviser takes over instead of asking again. */
  escalate: boolean;
  missingFields: string[];
  invalidFields: string[];
}

export function isOcrEligible(documentType: string): documentType is OcrDocumentType {
  return (OCR_ELIGIBLE_TYPES as readonly string[]).includes(documentType);
}

export function reuploadsRemaining(reuploadCount: number): number {
  return Math.max(0, MAX_REUPLOADS - reuploadCount);
}

function present(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

/** South African ID number: 13 digits with a valid Luhn check digit. */
export function isValidSouthAfricanId(value: unknown): boolean {
  const digits = String(value ?? '').replace(/[\s-]/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = Number(digits[i]);
    if ((13 - i) % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function isValidDate(value: unknown): boolean {
  const t = Date.parse(String(value ?? ''));
  return Number.isFinite(t);
}

function invalidFieldsFor(documentType: OcrDocumentType, fields: Record<string, unknown>): string[] {
  const invalid: string[] = [];
  if (documentType === 'id_document') {
    if (present(fields.id_number) && !isValidSouthAfricanId(fields.id_number)) invalid.push('id_number');
    if (present(fields.date_of_birth) && !isValidDate(fields.date_of_birth)) invalid.push('date_of_birth');
  } else if (present(fields.document_date) && !isValidDate(fields.document_date)) {
    invalid.push('document_date');
  }
  return invalid;
}

function humanList(fields: string[]): string {
  return fields.map((f) => f.replace(/_/g, ' ')).join(', ');
}

export function evaluateDocument(input: DocumentRuleInput): DocumentRuleResult {
  if (!isOcrEligible(input.documentType)) {
    return {
      status: 'under_review',
      humanReview: true,
      reason: 'This document type is verified manually.',
      escalate: false,
      missingFields: [],
      invalidFields: [],
    };
  }

  const type = input.documentType;
  const fields = input.extractedFields ?? {};
  const confidence =
    typeof input.confidence === 'number' && Number.isFinite(input.confidence)
      ? Math.min(1, Math.max(0, input.confidence))
      : null;

  const missingFields = REQUIRED_FIELDS[type].filter((f) => !present(fields[f]));
  const invalidFields = invalidFieldsFor(type, fields);

  let status: RuleOutcomeStatus;
  let reason: string | null = null;

  if (input.matchesType === false) {
    status = 'rejected';
    reason = `This does not look like ${type === 'id_document' ? 'an ID document' : 'a proof of address'}. Please upload the correct document.`;
  } else if (input.readable === false || confidence === null || confidence < REVIEW_MIN_CONFIDENCE) {
    status = 'rejected';
    reason = 'The document could not be read clearly. Please upload a sharper, well-lit copy.';
  } else if (missingFields.length > 0) {
    status = 'rejected';
    reason = `We could not find: ${humanList(missingFields)}. Please upload a complete copy.`;
  } else if (invalidFields.length > 0) {
    status = 'under_review';
    reason = `Please check: ${humanList(invalidFields)} looks incorrect.`;
  } else if (confidence >= AUTO_COMPLETE_MIN_CONFIDENCE) {
    status = 'auto_completed';
  } else {
    status = 'under_review';
    reason = 'The scan is readable but the extraction is not certain enough to complete automatically.';
  }

  if (status === 'rejected' && input.reuploadCount >= MAX_REUPLOADS) {
    return {
      status: 'under_review',
      humanReview: true,
      reason: `${reason} Re-upload limit reached, escalated to your adviser.`,
      escalate: true,
      missingFields,
      invalidFields,
    };
  }

  return { status, humanReview: status === 'under_review', reason, escalate: false, missingFields, invalidFields };
}
