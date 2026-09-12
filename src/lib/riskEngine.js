/**
 * Phase 6 — Deterministic Risk Engine
 * 
 * Computes an evidence-first forensic risk assessment by analyzing structured findings
 * from Authentication (Phase 3), Sender Identity (Phase 4), and Transmission (Phase 5).
 * 
 * CORE FORENSIC PRINCIPLES:
 * 1. Evidence-First: Points are awarded ONLY when explicit, observable evidence exists.
 * 2. Missing data is never penalized as a failure (Missing ≠ Malicious).
 * 3. Deduplication: Duplicate reports of identical evidence across multiple headers
 *    do not result in uncontrolled double-counting.
 * 4. Zero External Lookups: No DNS, reverse DNS, GeoIP, WHOIS, or threat intelligence.
 * 5. Zero AI / LLM: Fully deterministic, transparent, and reproducible scoring.
 * 6. Objective Findings: The engine detects anomalies and failures; it does NOT
 *    declare an email to be "confirmed phishing" or an IP "malicious".
 */

/**
 * Deterministic Risk Scoring Policy (Version 1.0)
 * Points allocated per evidence observation.
 */
export const DETERMINISTIC_RISK_POLICY = Object.freeze({
  version: '1.0',
  thresholds: {
    LOW: { min: 0, max: 19 },
    MEDIUM: { min: 20, max: 49 },
    HIGH: { min: 50, max: 79 },
    CRITICAL: { min: 80, max: 100 }
  },
  points: {
    // 1. Authentication Evidence (DMARC, SPF, DKIM)
    DMARC_FAIL: 20, // Checklist #38: explicit DMARC authentication rejection
    DMARC_PERMERROR: 10, // DMARC permanent configuration error
    DMARC_TEMPERROR: 5, // DMARC transient evaluation error
    SPF_FAIL: 15, // Explicit SPF rejection (-all)
    SPF_SOFTFAIL: 10, // SPF soft-fail (~all)
    SPF_PERMERROR: 5, // Malformed SPF record
    SPF_TEMPERROR: 5, // Transient SPF lookup error
    DKIM_FAIL: 15, // DKIM signature verification failure
    DKIM_PERMERROR: 5, // DKIM permanent error
    DKIM_TEMPERROR: 5, // DKIM temporary error

    // 2. Sender Identity Consistency Findings
    FROM_REPLY_TO_DOMAIN_MISMATCH: 15,
    FROM_RETURN_PATH_DOMAIN_MISMATCH: 10,
    FROM_SPF_DOMAIN_MISMATCH: 10,
    FROM_DKIM_DOMAIN_MISMATCH: 10,
    FROM_DMARC_HEADER_FROM_MISMATCH: 15,

    // 3. Header Transmission Findings
    NEGATIVE_TRANSMISSION_LATENCY: 10,
    RECEIVED_HOP_HOST_MISMATCH: 10,
    RECEIVED_TIMESTAMP_PARSE_ERROR: 5,

    // 4. Threat Intelligence Reputation Findings (Phase 7 Enrichment)
    IP_REPUTATION_MALICIOUS: 25,
    IP_REPUTATION_SUSPICIOUS: 12,
    URL_REPUTATION_MALICIOUS: 25,
    URL_REPUTATION_SUSPICIOUS: 12,
    DOMAIN_REPUTATION_MALICIOUS: 25,
    DOMAIN_REPUTATION_SUSPICIOUS: 12,
    // Operational findings carry 0 points (Missing ≠ Malicious, Error ≠ Malicious)
    THREAT_INTEL_UNAVAILABLE: 0,
    THREAT_INTEL_RATE_LIMITED: 0,
    THREAT_INTEL_PROVIDER_ERROR: 0
  }
});

/**
 * Maps a total numerical score to its deterministic risk level.
 * 
 * @param {number} score 
 * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
export function determineRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
}

/**
 * Evaluates DMARC reported authentication outcomes.
 * Fulfills Checklist item #38: DMARC failures and warning states contribute to forensic risk scoring.
 * 
 * @param {Array<object>} dmarcResults 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateDmarcEvidence(dmarcResults = [], seenDedupKeys) {
  const contributions = [];

  for (const item of dmarcResults) {
    if (!item || !item.result) continue;

    const res = item.result.toLowerCase();
    const domain = item.domain || item.headerFrom || 'unknown';
    let id = null;
    let points = 0;
    let reason = '';

    if (res === 'fail') {
      id = 'DMARC_FAIL';
      points = DETERMINISTIC_RISK_POLICY.points.DMARC_FAIL;
      reason = `DMARC authentication reported an explicit failure for domain "${domain}".`;
    } else if (res === 'permerror') {
      id = 'DMARC_PERMERROR';
      points = DETERMINISTIC_RISK_POLICY.points.DMARC_PERMERROR;
      reason = `DMARC authentication reported a permanent configuration or syntax error for domain "${domain}".`;
    } else if (res === 'temperror') {
      id = 'DMARC_TEMPERROR';
      points = DETERMINISTIC_RISK_POLICY.points.DMARC_TEMPERROR;
      reason = `DMARC authentication reported a temporary evaluation or DNS error for domain "${domain}".`;
    }

    if (id && points > 0) {
      const dedupKey = `dmarc:${id}:${domain}:${item.policy || 'none'}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id,
          category: 'authentication',
          points,
          reason,
          evidence: {
            source: item.source || 'Authentication-Results',
            result: item.result,
            domain: domain !== 'unknown' ? domain : null,
            policy: item.policy || null,
            raw: item.raw || null
          }
        });
      }
    }
  }

  return contributions;
}

/**
 * Evaluates SPF reported authentication outcomes.
 * 
 * @param {Array<object>} spfResults 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateSpfEvidence(spfResults = [], seenDedupKeys) {
  const contributions = [];

  for (const item of spfResults) {
    if (!item || !item.result) continue;

    const res = item.result.toLowerCase();
    const domain = item.domain || item.mailFrom || 'unknown';
    let id = null;
    let points = 0;
    let reason = '';

    if (res === 'fail') {
      id = 'SPF_FAIL';
      points = DETERMINISTIC_RISK_POLICY.points.SPF_FAIL;
      reason = `SPF authentication reported an explicit failure for sender domain "${domain}".`;
    } else if (res === 'softfail') {
      id = 'SPF_SOFTFAIL';
      points = DETERMINISTIC_RISK_POLICY.points.SPF_SOFTFAIL;
      reason = `SPF authentication reported a softfail (~all) for sender domain "${domain}".`;
    } else if (res === 'permerror') {
      id = 'SPF_PERMERROR';
      points = DETERMINISTIC_RISK_POLICY.points.SPF_PERMERROR;
      reason = `SPF authentication reported a permanent DNS or syntax error for domain "${domain}".`;
    } else if (res === 'temperror') {
      id = 'SPF_TEMPERROR';
      points = DETERMINISTIC_RISK_POLICY.points.SPF_TEMPERROR;
      reason = `SPF authentication reported a temporary DNS or lookup error for domain "${domain}".`;
    }

    if (id && points > 0) {
      const dedupKey = `spf:${id}:${domain}:${item.clientIp || 'no-ip'}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id,
          category: 'authentication',
          points,
          reason,
          evidence: {
            source: item.source || 'SPF',
            result: item.result,
            domain: domain !== 'unknown' ? domain : null,
            clientIp: item.clientIp || null,
            raw: item.raw || null
          }
        });
      }
    }
  }

  return contributions;
}

/**
 * Evaluates DKIM reported authentication outcomes.
 * 
 * @param {Array<object>} dkimResults 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateDkimEvidence(dkimResults = [], seenDedupKeys) {
  const contributions = [];

  for (const item of dkimResults) {
    if (!item || !item.result) continue;

    const res = item.result.toLowerCase();
    const domain = item.domain || 'unknown';
    let id = null;
    let points = 0;
    let reason = '';

    if (res === 'fail') {
      id = 'DKIM_FAIL';
      points = DETERMINISTIC_RISK_POLICY.points.DKIM_FAIL;
      reason = `DKIM authentication reported signature verification failure for domain "${domain}".`;
    } else if (res === 'permerror') {
      id = 'DKIM_PERMERROR';
      points = DETERMINISTIC_RISK_POLICY.points.DKIM_PERMERROR;
      reason = `DKIM authentication reported a permanent key or syntax error for domain "${domain}".`;
    } else if (res === 'temperror') {
      id = 'DKIM_TEMPERROR';
      points = DETERMINISTIC_RISK_POLICY.points.DKIM_TEMPERROR;
      reason = `DKIM authentication reported a temporary key lookup error for domain "${domain}".`;
    }

    if (id && points > 0) {
      const dedupKey = `dkim:${id}:${domain}:${item.selector || 'no-selector'}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id,
          category: 'authentication',
          points,
          reason,
          evidence: {
            source: item.source || 'Authentication-Results',
            result: item.result,
            domain: domain !== 'unknown' ? domain : null,
            selector: item.selector || null,
            raw: item.raw || null
          }
        });
      }
    }
  }

  return contributions;
}

/**
 * Evaluates Sender Identity Consistency findings from Phase 4.
 * 
 * @param {Array<object>} identityFindings 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateSenderIdentityFindings(identityFindings = [], seenDedupKeys) {
  const contributions = [];

  for (const f of identityFindings) {
    if (!f || !f.id) continue;

    const points = DETERMINISTIC_RISK_POLICY.points[f.id] || 0;
    if (points <= 0) continue;

    const domainA = f.sourceA?.domain || 'unknown';
    const domainB = f.sourceB?.domain || 'unknown';
    const dedupKey = `identity:${f.id}:${domainA}:${domainB}`;

    if (!seenDedupKeys.has(dedupKey)) {
      seenDedupKeys.add(dedupKey);

      let reason = f.message || `Sender identity mismatch detected: ${f.id}.`;
      if (f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH') {
        reason = `Sender From domain (${domainA}) does not match Reply-To destination domain (${domainB}).`;
      } else if (f.id === 'FROM_RETURN_PATH_DOMAIN_MISMATCH') {
        reason = `Sender From domain (${domainA}) does not match envelope Return-Path domain (${domainB}).`;
      } else if (f.id === 'FROM_SPF_DOMAIN_MISMATCH') {
        reason = `Sender From domain (${domainA}) does not match SPF authenticated domain (${domainB}).`;
      } else if (f.id === 'FROM_DKIM_DOMAIN_MISMATCH') {
        reason = `Sender From domain (${domainA}) does not match DKIM signing domain (${domainB}).`;
      } else if (f.id === 'FROM_DMARC_HEADER_FROM_MISMATCH') {
        reason = `Sender From domain (${domainA}) does not match DMARC evaluated domain (${domainB}).`;
      }

      contributions.push({
        id: f.id,
        category: 'sender_identity',
        points,
        reason,
        evidence: {
          comparison: f.comparison || null,
          sourceA: f.sourceA || null,
          sourceB: f.sourceB || null,
          rawEvidence: f.evidence || null
        }
      });
    }
  }

  return contributions;
}

/**
 * Evaluates Transmission and Hop Analysis findings from Phase 5.
 * 
 * @param {Array<object>} transmissionFindings 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateTransmissionFindings(transmissionFindings = [], seenDedupKeys) {
  const contributions = [];

  for (const f of transmissionFindings) {
    if (!f || !f.id) continue;

    const points = DETERMINISTIC_RISK_POLICY.points[f.id] || 0;
    if (points <= 0) continue;

    const dedupKey = `transmission:${f.id}:${f.fromHop ?? ''}:${f.toHop ?? ''}:${f.hopIndex ?? ''}`;

    if (!seenDedupKeys.has(dedupKey)) {
      seenDedupKeys.add(dedupKey);

      let reason = f.message || `Transmission anomaly detected: ${f.id}.`;
      if (f.id === 'NEGATIVE_TRANSMISSION_LATENCY') {
        reason = `Received timestamps are not chronologically consistent: negative transit delay detected between hops.`;
      } else if (f.id === 'RECEIVED_HOP_HOST_MISMATCH') {
        reason = `Handoff host discrepancy observed between receiving server and subsequent relay server.`;
      } else if (f.id === 'RECEIVED_TIMESTAMP_PARSE_ERROR') {
        reason = `Malformed or unparseable date/timestamp token observed in Received header.`;
      }

      contributions.push({
        id: f.id,
        category: 'transmission',
        points,
        reason,
        evidence: {
          type: f.type || null,
          fromHop: f.fromHop ?? null,
          toHop: f.toHop ?? null,
          hopIndex: f.hopIndex ?? null,
          rawEvidence: f.evidence || null
        }
      });
    }
  }

  return contributions;
}

/**
 * Evaluates Threat Intelligence Findings from Phase 7.
 * Confirmed malicious findings contribute +25 pts.
 * Suspicious findings contribute +12 pts.
 * Operational, clean, unknown, or skipped findings contribute 0 pts (Missing ≠ Malicious).
 * 
 * @param {Array<object>} threatIntelFindings 
 * @param {Set<string>} seenDedupKeys 
 * @returns {Array<object>} List of risk contributions
 */
function evaluateThreatIntelFindings(threatIntelFindings = [], seenDedupKeys) {
  const contributions = [];

  for (const f of threatIntelFindings) {
    if (!f || !f.id) continue;

    const points = DETERMINISTIC_RISK_POLICY.points[f.id] || 0;
    if (points <= 0) continue; // Operational status or clean findings contribute 0 points

    const artifactKey = f.artifact || f.evidence?.artifact || '';
    const dedupKey = `threat_intel:${f.id}:${artifactKey}`;

    if (!seenDedupKeys.has(dedupKey)) {
      seenDedupKeys.add(dedupKey);

      contributions.push({
        id: f.id,
        category: 'threat_intelligence',
        points,
        reason: f.message || `Threat intelligence reported ${f.id} for artifact "${artifactKey}".`,
        evidence: {
          artifact: artifactKey,
          provider: f.provider || 'unknown',
          providerVerdict: f.status || null,
          confidence: f.evidence?.confidence ?? null,
          source: f.evidence?.source || null,
          checkedAt: f.evidence?.checkedAt || null,
          rawEvidence: f.evidence || null
        }
      });
    }
  }

  return contributions;
}

/**
 * Deterministic Master Risk Engine Function.
 * Consumes the canonical normalized email object and produces the canonical data.risk model.
 * 
 * @param {object} emailData Canonical parsed email object
 * @returns {object} Canonical risk model
 */
export function analyzeRisk(emailData) {
  if (!emailData || typeof emailData !== 'object') {
    return {
      version: DETERMINISTIC_RISK_POLICY.version,
      totalScore: 0,
      rawScore: 0,
      level: 'LOW',
      contributions: [],
      summary: {
        totalContributions: 0,
        categories: {
          authentication: 0,
          sender_identity: 0,
          transmission: 0,
          threat_intelligence: 0
        }
      },
      methodology: {
        type: 'deterministic',
        version: DETERMINISTIC_RISK_POLICY.version,
        thresholds: {
          low: '0-19',
          medium: '20-49',
          high: '50-79',
          critical: '80-100'
        }
      }
    };
  }

  const seenDedupKeys = new Set();
  const allContributions = [];

  // 1. Authentication Evidence (DMARC, SPF, DKIM)
  const dmarcResults = emailData.authentication?.dmarc?.results || [];
  const spfResults = emailData.authentication?.spf?.results || [];
  const dkimResults = emailData.authentication?.dkim?.results || [];

  allContributions.push(...evaluateDmarcEvidence(dmarcResults, seenDedupKeys));
  allContributions.push(...evaluateSpfEvidence(spfResults, seenDedupKeys));
  allContributions.push(...evaluateDkimEvidence(dkimResults, seenDedupKeys));

  // 2. Sender Identity Consistency Findings
  const identityFindings = emailData.senderIdentity?.findings || [];
  allContributions.push(...evaluateSenderIdentityFindings(identityFindings, seenDedupKeys));

  // 3. Header Transmission Findings
  const transmissionFindings = emailData.transmission?.findings || [];
  allContributions.push(...evaluateTransmissionFindings(transmissionFindings, seenDedupKeys));

  // 4. Threat Intelligence Reputation Findings (Phase 7 Enrichment)
  const threatIntelFindings = emailData.threatIntel?.findings || [];
  allContributions.push(...evaluateThreatIntelFindings(threatIntelFindings, seenDedupKeys));

  // Calculate category totals
  const categorySums = {
    authentication: 0,
    sender_identity: 0,
    transmission: 0,
    threat_intelligence: 0
  };

  let rawScore = 0;
  for (const c of allContributions) {
    rawScore += c.points;
    if (categorySums[c.category] !== undefined) {
      categorySums[c.category] += c.points;
    }
  }

  // Bound totalScore to [0, 100]
  const totalScore = Math.min(100, Math.max(0, rawScore));
  const level = determineRiskLevel(totalScore);

  return {
    version: DETERMINISTIC_RISK_POLICY.version,
    totalScore,
    rawScore,
    level,
    contributions: allContributions,
    summary: {
      totalContributions: allContributions.length,
      categories: categorySums
    },
    methodology: {
      type: 'deterministic',
      version: DETERMINISTIC_RISK_POLICY.version,
      thresholds: {
        low: '0-19',
        medium: '20-49',
        high: '50-79',
        critical: '80-100'
      }
    }
  };
}

/**
 * Public alias for analyzeRisk
 */
export const calculateRisk = analyzeRisk;
