import { enrichThreatIntel } from '../../../lib/threatIntel.js';

/**
 * POST /api/threat-intel
 * 
 * Server-side Threat Intelligence Enrichment API endpoint.
 * Enriches extracted email artifacts (public IPs, normalized URLs, domains)
 * with threat reputation data from configured providers.
 * 
 * SECURITY & PRIVACY CONTROLS:
 * - Server-side only; API credentials are never exposed to clients.
 * - Does not fetch, crawl, or execute arbitrary URLs (SSRF prevention).
 * - Private/loopback IPs are filtered out by the threat intelligence engine.
 * - Minimum required artifacts only; raw email text and headers are never sent.
 * 
 * Request body: { "artifacts": { "urls": [], "ips": [], "domains": [] }, "providerName"?: string }
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
          error: 'Invalid JSON request payload.'
        },
        { status: 400 }
      );
    }

    const { artifacts, providerName } = body || {};

    if (!artifacts || typeof artifacts !== 'object') {
      return Response.json(
        {
          success: false,
          error: 'Request payload must include an "artifacts" object containing urls, ips, or domains.'
        },
        { status: 400 }
      );
    }

    // SSRF / Payload safety: ensure arrays contain strings or basic objects
    const sanitizedArtifacts = {
      ips: Array.isArray(artifacts.ips)
        ? artifacts.ips.filter((item) => typeof item === 'string' || (typeof item === 'object' && item?.address))
        : [],
      urls: Array.isArray(artifacts.urls)
        ? artifacts.urls.filter((item) => typeof item === 'string' || (typeof item === 'object' && (item?.normalized || item?.original)))
        : [],
      domains: Array.isArray(artifacts.domains)
        ? artifacts.domains.filter((item) => typeof item === 'string' || (typeof item === 'object' && (item?.normalized || item?.original)))
        : []
    };

    const timeoutMs = parseInt(process.env.THREAT_INTEL_TIMEOUT_MS || '5000', 10);

    const intelResult = await enrichThreatIntel(sanitizedArtifacts, {
      providerName: providerName || process.env.THREAT_INTEL_PROVIDER,
      providerConfig: { timeoutMs }
    });

    return Response.json(
      {
        success: true,
        data: intelResult
      },
      { status: 200 }
    );
  } catch (err) {
    // Graceful error fallback: never expose internal stack trace
    return Response.json(
      {
        success: false,
        error: 'An internal error occurred during threat intelligence enrichment.',
        details: err.message
      },
      { status: 500 }
    );
  }
}
