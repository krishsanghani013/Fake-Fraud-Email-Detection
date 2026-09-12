import { parseRawEmail } from '../../../lib/emailParser.js';

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

    return Response.json(
      {
        success: true,
        data: result.data,
        warnings: result.warnings || []
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
