import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AUTO_COMPLETE_MIN_CONFIDENCE,
  MAX_REUPLOADS,
  REVIEW_MIN_CONFIDENCE,
  evaluateDocument,
  isValidSouthAfricanId,
  reuploadsRemaining,
} from './documentRules';

// 8001015009087 is a well-known valid test ID (Luhn-correct).
const VALID_ID = '8001015009087';

const goodId = { full_name: 'Thabo Mokoena', id_number: VALID_ID, date_of_birth: '1980-01-01' };
const goodPoa = { address: '12 Main Rd, Sandton', document_date: '2026-08-15' };

describe('isValidSouthAfricanId', () => {
  it('accepts a Luhn-valid 13 digit number', () => assert.equal(isValidSouthAfricanId(VALID_ID), true));
  it('rejects a wrong check digit', () => assert.equal(isValidSouthAfricanId('8001015009088'), false));
  it('rejects the wrong length', () => assert.equal(isValidSouthAfricanId('80010150090'), false));
});

describe('evaluateDocument', () => {
  it('auto-completes a confident, complete ID', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: 0.95, extractedFields: goodId, reuploadCount: 0 });
    assert.equal(r.status, 'auto_completed');
    assert.equal(r.humanReview, false);
    assert.equal(r.reason, null);
  });

  it('auto-completes exactly at the threshold', () => {
    const r = evaluateDocument({ documentType: 'proof_of_address', confidence: AUTO_COMPLETE_MIN_CONFIDENCE, extractedFields: goodPoa, reuploadCount: 0 });
    assert.equal(r.status, 'auto_completed');
  });

  it('sends a moderate confidence document to review', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: 0.7, extractedFields: goodId, reuploadCount: 0 });
    assert.equal(r.status, 'under_review');
    assert.equal(r.humanReview, true);
  });

  it('sends just-below-threshold and exactly-at-review-floor to review', () => {
    for (const confidence of [AUTO_COMPLETE_MIN_CONFIDENCE - 0.001, REVIEW_MIN_CONFIDENCE]) {
      const r = evaluateDocument({ documentType: 'proof_of_address', confidence, extractedFields: goodPoa, reuploadCount: 0 });
      assert.equal(r.status, 'under_review', `confidence ${confidence}`);
    }
  });

  it('rejects low confidence', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: REVIEW_MIN_CONFIDENCE - 0.001, extractedFields: goodId, reuploadCount: 0 });
    assert.equal(r.status, 'rejected');
    assert.equal(r.escalate, false);
  });

  it('rejects an unreadable file and one with no confidence', () => {
    assert.equal(evaluateDocument({ documentType: 'id_document', confidence: 0.99, extractedFields: goodId, readable: false, reuploadCount: 0 }).status, 'rejected');
    assert.equal(evaluateDocument({ documentType: 'id_document', confidence: null, extractedFields: {}, reuploadCount: 0 }).status, 'rejected');
  });

  it('rejects a document of the wrong type regardless of confidence', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: 0.99, extractedFields: goodId, matchesType: false, reuploadCount: 0 });
    assert.equal(r.status, 'rejected');
  });

  it('rejects when a required field is missing, even at high confidence', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: 0.99, extractedFields: { full_name: 'A B', id_number: '  ' }, reuploadCount: 0 });
    assert.equal(r.status, 'rejected');
    assert.deepEqual(r.missingFields, ['id_number', 'date_of_birth']);
  });

  it('sends an ID with a bad check digit to review rather than rejecting it', () => {
    const r = evaluateDocument({ documentType: 'id_document', confidence: 0.99, extractedFields: { ...goodId, id_number: '8001015009088' }, reuploadCount: 0 });
    assert.equal(r.status, 'under_review');
    assert.deepEqual(r.invalidFields, ['id_number']);
  });

  it('keeps asking for a re-upload up to the limit, then escalates', () => {
    const base = { documentType: 'proof_of_address', confidence: 0.2, extractedFields: {} };
    const last = evaluateDocument({ ...base, reuploadCount: MAX_REUPLOADS - 1 });
    assert.equal(last.status, 'rejected');
    assert.equal(last.escalate, false);

    const over = evaluateDocument({ ...base, reuploadCount: MAX_REUPLOADS });
    assert.equal(over.status, 'under_review');
    assert.equal(over.humanReview, true);
    assert.equal(over.escalate, true);
  });

  it('does not treat non-OCR document types as auto-completable', () => {
    const r = evaluateDocument({ documentType: 'policy_document', confidence: 1, extractedFields: {}, reuploadCount: 0 });
    assert.equal(r.status, 'under_review');
  });
});

describe('reuploadsRemaining', () => {
  it('never goes negative', () => {
    assert.equal(reuploadsRemaining(0), MAX_REUPLOADS);
    assert.equal(reuploadsRemaining(MAX_REUPLOADS + 3), 0);
  });
});
