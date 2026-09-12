import { detectAiGeneratedContent } from '../../../lib/aiContentDetection.js';

export const dynamic = 'force-dynamic';

/**
 * Phase 9 — API Route: AI-Generated Content Forensic Detection
 * 
 * POST /api/detect-ai-content
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
        { success: false, error: 'Invalid or missing request body.' },
        { status: 400 }
      );
    }

    const text = (body.text || body.body || '').trim();
    const subject = (body.subject || '').trim();

    if (!text && !subject) {
      return Response.json(
        { success: false, error: 'Missing required text or body content for AI detection.' },
        { status: 400 }
      );
    }

    if (text.length < 10 && subject.length < 10) {
      return Response.json(
        { success: false, error: 'Input text too short for forensic stylometric evaluation (minimum 10 characters).' },
        { status: 400 }
      );
    }

    const options = {
      subject,
      apiKey: body.apiKey || process.env.GEMINI_API_KEY,
      model: body.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      timeoutMs: Number(body.timeoutMs) || Number(process.env.GEMINI_TIMEOUT_MS) || 30000,
      forceOffline: Boolean(body.forceOffline)
    };

    const detection = await detectAiGeneratedContent(text, options);

    return Response.json(
      {
        success: true,
        detection
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: 'Failed to process AI content detection.',
        details: err.message
      },
      { status: 500 }
    );
  }
}
