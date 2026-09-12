import { inspectEmail, extractTextAnnotations, buildUnifiedEvidenceChain } from '../../../lib/aiInspect.js';
import { autoPersistEmailToSupabase } from '../../../lib/emailPersistence.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai-inspect
 * 
 * Deep AI Forensic Inspection endpoint powered by Gemini 3.6 / Deterministic Heuristics.
 * Ingests raw email text or structured emailData and produces:
 * - Observable deception indicators with exact quoted evidence snippets
 * - Psychological urgency index & primary threat vector
 * - Interactive text anomaly annotations
 * - 6-stage evidence progression & category budget distribution
 * 
 * Request payload:
 * {
 *   "emailText": string,
 *   "emailData"?: object,
 *   "model"?: string,
 *   "apiKey"?: string
 * }
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        { success: false, error: 'Content-Type must be application/json.' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, error: 'Malformed JSON in request body.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return Response.json(
        { success: false, error: 'Request body must be a valid JSON object.' },
        { status: 400 }
      );
    }

    // Extract text from emailText or canonical emailData
    let emailText = body.emailText;
    const emailData = body.emailData || null;

    if (!emailText && emailData) {
      // Reconstruct text representation from canonical email data
      const subject = emailData.metadata?.subject || '';
      const from = emailData.metadata?.from || '';
      const replyTo = Array.isArray(emailData.metadata?.replyTo) ? emailData.metadata.replyTo.join(', ') : '';
      const bodyText = emailData.body?.text || emailData.body?.html || '';
      emailText = `From: ${from}\nReply-To: ${replyTo}\nSubject: ${subject}\n\n${bodyText}`;
    }

    if (!emailText || typeof emailText !== 'string' || !emailText.trim()) {
      return Response.json(
        { success: false, error: 'Missing required field: "emailText" (or valid "emailData").' },
        { status: 400 }
      );
    }

    const trimmedText = emailText.trim();
    if (trimmedText.length < 10) {
      return Response.json(
        { success: false, error: 'Email content is too short to perform meaningful forensic inspection.' },
        { status: 400 }
      );
    }

    const options = {
      apiKey: body.apiKey || process.env.GEMINI_API_KEY,
      model: body.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 8000
    };

    // Run AI Inspection
    const inspectionResult = await inspectEmail(trimmedText, options);

    // Extract anomaly annotations for interactive text viewer
    const textAnnotations = extractTextAnnotations(trimmedText, inspectionResult.indicators);

    // Build unified 6-stage evidence flow & category scores
    const evidenceChain = buildUnifiedEvidenceChain(inspectionResult, emailData);

    // Automatically record in Supabase database
    let savedRecord = null;
    try {
      const fromHeader = emailData?.metadata?.from || 'inspect@workbench.internal';
      const subjHeader = emailData?.metadata?.subject || 'AI Deep Inspection';
      const score = inspectionResult.riskScore ?? 0;
      const level = inspectionResult.urgencyLevel || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');
      const expl = inspectionResult.executiveSummary || 'Deep AI Forensic Inspection completed.';

      savedRecord = await autoPersistEmailToSupabase({
        sender: fromHeader,
        subject: subjHeader,
        body: trimmedText,
        riskScore: score,
        classification: level,
        explanation: expl
      });
    } catch (dbErr) {
      console.warn('[API /api/ai-inspect] Auto-persist skipped:', dbErr?.message || dbErr);
    }

    return Response.json(
      {
        success: true,
        data: {
          ...inspectionResult,
          emailText: trimmedText,
          textAnnotations,
          evidenceChain,
          savedRecord
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('API /api/ai-inspect error:', err?.message || err);
    return Response.json(
      {
        success: false,
        error: err?.message || 'An unexpected error occurred during email inspection.'
      },
      { status: 500 }
    );
  }
}
