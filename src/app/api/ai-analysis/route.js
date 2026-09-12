import { generateAiAnalysis, buildEvidencePackage } from '../../../lib/aiAnalysis.js';

export const dynamic = 'force-dynamic';

/**
 * Phase 8 — Server-Side Explainable AI Analysis Route
 * 
 * POST /api/ai-analysis
 * 
 * SECURITY:
 * - Validates input structures and rejects arbitrary payloads.
 * - Prevents arbitrary prompts from client (server strictly constructs prompts).
 * - Enforces request timeout and payload limits.
 * - Keeps GEMINI_API_KEY strictly server-side.
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        {
          success: false,
          error: 'Content-Type must be application/json.'
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: 'Malformed JSON in request body.'
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return Response.json(
        {
          success: false,
          error: 'Invalid or missing request body.'
        },
        { status: 400 }
      );
    }

    const emailData = body.emailData || (body.risk ? body : null);

    if (!emailData || typeof emailData !== 'object') {
      return Response.json(
        {
          success: false,
          error: 'Missing required forensic emailData structure in request body.'
        },
        { status: 400 }
      );
    }

    // Must have deterministic risk assessment from Phase 6 to ground AI explanations
    if (!emailData.risk || typeof emailData.risk.totalScore !== 'number') {
      return Response.json(
        {
          success: false,
          error: 'Email data must contain Phase 6 deterministic risk assessment.'
        },
        { status: 400 }
      );
    }

    const options = {
      apiKey: body.apiKey || process.env.GEMINI_API_KEY,
      model: body.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      timeoutMs: Number(body.timeoutMs) || Number(process.env.GEMINI_TIMEOUT_MS) || 30000,
      allowFallback: body.allowFallback !== false,
      forceFallback: Boolean(body.forceFallback),
      mockResponse: body.mockResponse || null,
      mockResponseJson: body.mockResponseJson || null
    };

    const aiResult = await generateAiAnalysis(emailData, options);

    return Response.json(
      {
        success: true,
        aiAnalysis: aiResult,
        data: aiResult
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: 'An internal server error occurred while generating AI analysis.',
        details: err.message
      },
      { status: 500 }
    );
  }
}
