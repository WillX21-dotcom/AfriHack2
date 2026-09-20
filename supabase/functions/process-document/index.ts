// Edge function: OCR + rules for an uploaded client document (Deno runtime).
//
//   POST { documentId }   with the caller's JWT
//
// 1. Reads the document with the caller's JWT, so row level security proves they may access it.
// 2. Claims it (pending -> processing) so a second call cannot double-process or double-bill.
// 3. Asks Gemini to classify + extract fields, then applies the shared, deterministic rules.
// 4. Writes the outcome and an event trail with the service role (clients cannot write these).
//
// Secrets: GEMINI_API_KEY (required), GEMINI_MODEL (optional). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by the platform.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI, Type } from 'npm:@google/genai@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';
import {
  evaluateDocument,
  isOcrEligible,
  type OcrDocumentType,
} from '../../../packages/shared/src/rules/documentRules.ts';

const BUCKET = 'client-documents';
const SUPPORTED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const PROMPTS: Record<OcrDocumentType, string> = {
  id_document:
    'You are checking a South African identity document (ID card/book, smart ID, passport or driver licence). ' +
    'Extract full_name, id_number (13 digits, digits only) and date_of_birth (YYYY-MM-DD). ' +
    'Leave a field as an empty string if you cannot read it. Never guess.',
  proof_of_address:
    'You are checking a proof of address (utility bill, bank statement, municipal account, lease). ' +
    'Extract address (single line, as printed), document_date (YYYY-MM-DD, the statement/issue date) and issuer (company name). ' +
    'Leave a field as an empty string if you cannot read it. Never guess.',
};

const FIELD_KEYS: Record<OcrDocumentType, string[]> = {
  id_document: ['full_name', 'id_number', 'date_of_birth'],
  proof_of_address: ['address', 'document_date', 'issuer'],
};

// Override with the GEMINI_MODEL secret. gemini-2.5-flash now returns 404 for this project.
const DEFAULT_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-flash-latest';

function isModelUnavailable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const message = err instanceof Error ? err.message : String(err);
  return status === 404 || /"code":\s*404|NOT_FOUND|no longer available/i.test(message);
}

interface Extraction {
  readable: boolean;
  matches_type: boolean;
  confidence: number;
  fields: Record<string, string>;
}

async function extract(bytes: Uint8Array, mime: string, type: OcrDocumentType): Promise<Extraction> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const ai = new GoogleGenAI({ apiKey });

  const fieldProps: Record<string, { type: Type }> = {};
  for (const key of FIELD_KEYS[type]) fieldProps[key] = { type: Type.STRING };

  const request = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: mime, data: encodeBase64(bytes) } },
          {
            text:
              `${PROMPTS[type]} Also report: readable (is this a legible document at all), ` +
              'matches_type (is it the kind of document described), and confidence (0 to 1) that every extracted ' +
              'field is correct. Be conservative with confidence.',
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          readable: { type: Type.BOOLEAN },
          matches_type: { type: Type.BOOLEAN },
          confidence: { type: Type.NUMBER },
          fields: { type: Type.OBJECT, properties: fieldProps },
        },
        required: ['readable', 'matches_type', 'confidence', 'fields'],
      },
    },
  };

  // Google retires models without notice ("no longer available to new users" is a 404). Try the
  // configured model first, then the rolling alias, so a retired model does not silently push every
  // document to manual review. Any other error (bad key, quota, ...) is thrown immediately.
  const models = [...new Set([Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL, FALLBACK_MODEL])];
  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
  let lastError: unknown;
  for (const model of models) {
    try {
      response = await ai.models.generateContent({ model, ...request });
      break;
    } catch (err) {
      lastError = err;
      if (!isModelUnavailable(err)) throw err;
      console.warn(`Gemini model ${model} is unavailable, trying the next one.`);
    }
  }
  if (!response) throw lastError;

  const parsed = JSON.parse(response.text ?? '{}');
  return {
    readable: parsed.readable !== false,
    matches_type: parsed.matches_type !== false,
    confidence: Number(parsed.confidence),
    fields: parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {},
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  let documentId: string | undefined;
  try {
    documentId = (await req.json())?.documentId;
  } catch {
    /* handled below */
  }
  if (!documentId || typeof documentId !== 'string') return json({ error: 'documentId is required' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // RLS decides whether this caller may see the document at all.
  const { data: doc, error: docError } = await asCaller.from('documents').select('*').eq('id', documentId).maybeSingle();
  if (docError) return json({ error: docError.message }, 500);
  if (!doc) return json({ error: 'Document not found' }, 404);

  if (!isOcrEligible(doc.document_type)) return json({ status: doc.processing_status, skipped: 'not_ocr_eligible' });

  // Claim it. Only a pending document is processed; anything else is returned as it stands.
  const { data: claimed, error: claimError } = await admin
    .from('documents')
    .update({ processing_status: 'processing' })
    .eq('id', documentId)
    .eq('processing_status', 'pending')
    .select('id')
    .maybeSingle();
  if (claimError) return json({ error: claimError.message }, 500);
  if (!claimed) return json({ status: doc.processing_status, skipped: 'already_processed' });

  const log = (event_type: string, payload: Record<string, unknown> = {}) =>
    admin.from('document_events').insert({ document_id: doc.id, client_id: doc.client_id, event_type, payload, actor: null });

  await log('ocr_started', { document_type: doc.document_type, mime_type: doc.mime_type });

  try {
    const mime = (doc.mime_type ?? '').toLowerCase();
    // Earlier rejected uploads of this type for this client: how many re-uploads have been used.
    const { count } = await admin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', doc.client_id)
      .eq('document_type', doc.document_type)
      .eq('processing_status', 'rejected')
      .neq('id', doc.id);
    const priorRejections = count ?? 0;

    let outcome;
    let extractedFields: Record<string, string> = {};
    let confidence: number | null = null;

    if (!SUPPORTED_MIME.has(mime)) {
      // Same rules as any unreadable file, so the re-upload limit and escalation still apply.
      const unreadable = evaluateDocument({
        documentType: doc.document_type,
        confidence: null,
        extractedFields: {},
        readable: false,
        reuploadCount: priorRejections,
      });
      outcome = unreadable.escalate
        ? unreadable
        : { ...unreadable, reason: 'This file type cannot be read automatically. Please upload a PDF or a clear photo (JPG or PNG).' };
      await log('unsupported_file_type', { mime_type: mime });
    } else {
      const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(doc.storage_path);
      if (downloadError || !file) throw new Error(downloadError?.message ?? 'Could not download the file');

      const extraction = await extract(new Uint8Array(await file.arrayBuffer()), mime, doc.document_type);
      extractedFields = extraction.fields;
      confidence = Number.isFinite(extraction.confidence) ? Math.min(1, Math.max(0, extraction.confidence)) : null;
      await log('fields_extracted', { fields: extractedFields, confidence, readable: extraction.readable, matches_type: extraction.matches_type });

      outcome = evaluateDocument({
        documentType: doc.document_type,
        confidence,
        extractedFields,
        readable: extraction.readable,
        matchesType: extraction.matches_type,
        reuploadCount: priorRejections,
      });
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      processing_status: outcome.status,
      confidence_score: confidence,
      extracted_fields: extractedFields,
      human_review_required: outcome.humanReview,
      rejection_reason: outcome.status === 'rejected' || outcome.escalate ? outcome.reason : null,
      reupload_count: priorRejections,
      escalated_at: outcome.escalate ? now : null,
      last_processed_at: now,
    };
    if (outcome.status === 'under_review' && !outcome.escalate && outcome.reason) {
      update.metadata = { ...(doc.metadata ?? {}), review_reason: outcome.reason };
    }

    const { error: writeError } = await admin.from('documents').update(update).eq('id', doc.id);
    if (writeError) throw new Error(writeError.message);

    await log('rule_outcome', { status: outcome.status, reason: outcome.reason, escalated: outcome.escalate });
    if (outcome.humanReview) await log('review_required', { reason: outcome.reason, escalated: outcome.escalate });

    return json({ status: outcome.status, confidence, reason: outcome.reason, escalated: outcome.escalate });
  } catch (err) {
    // Never leave a document stuck in "processing": hand it to a human.
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from('documents')
      .update({
        processing_status: 'under_review',
        human_review_required: true,
        last_processed_at: new Date().toISOString(),
        metadata: { ...(doc.metadata ?? {}), review_reason: 'Automatic processing failed; needs manual review.' },
      })
      .eq('id', doc.id);
    await log('processing_failed', { error: message });
    return json({ status: 'under_review', error: 'processing_failed' }, 200);
  }
});
