import { parseRawEmail } from '../../../lib/emailParser.js';
import { autoPersistEmailToSupabase } from '../../../lib/emailPersistence.js';

/**
 * POST /api/parse-eml
 * 
 * Core RFC 5322 Ingestion and Parsing API endpoint.
 * Ingests raw email / .eml text and returns the canonical normalized email object.
 * 
 * Request body: { "emlContent": string }
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Invalid JSON request payload.',
          warnings: []
        },
        { status: 400 }
      );
    }

    const { emlContent } = body || {};

    if (!emlContent || typeof emlContent !== 'string' || !emlContent.trim()) {
      return Response.json(
        {
          success: false,
          error: 'No email content was provided.',
          warnings: []
        },
        { status: 400 }
      );
    }

    const result = parseRawEmail(emlContent);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error || 'Failed to parse RFC 5322 email input.',
          warnings: result.warnings || []
        },
        { status: 400 }
      );
    }

    // Automatically record in Supabase database
    let savedRecord = null;
    try {
      const sender = result.data?.metadata?.from || 'eml-upload@workbench.internal';
      const subject = result.data?.metadata?.subject || '(No Subject)';
      const body = result.data?.body?.text || result.data?.body?.html || emlContent;
      const score = result.data?.risk?.totalScore ?? 0;
      const level = result.data?.risk?.level || 'ANALYZED';
      const expl = `RFC 5322 Ingestion: ${level} risk level (${score}/100).`;

      savedRecord = await autoPersistEmailToSupabase({
        sender,
        subject,
        body,
        riskScore: score,
        classification: level,
        explanation: expl
      });
    } catch (dbErr) {
      console.warn('[API /api/parse-eml] Auto-persist skipped:', dbErr?.message || dbErr);
    }

    return Response.json(
      {
        success: true,
        data: result.data,
        warnings: result.warnings || [],
        savedRecord
      },
      { status: 200 }
    );
  } catch {
    // Return sanitized error without internal stack traces
    return Response.json(
      {
        success: false,
        error: 'An internal error occurred while processing the email input.',
        warnings: []
      },
      { status: 500 }
    );
  }
}
