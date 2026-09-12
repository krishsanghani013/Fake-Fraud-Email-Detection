/**
 * Phase 4 — Sender Identity & Header Consistency Forensics
 * 
 * Deterministically extracts sender identities from RFC 5322 headers (From, Reply-To, Return-Path)
 * and Phase 3 authentication evidence (SPF, DKIM, DMARC), and performs exact-domain consistency comparisons.
 * 
 * FORENSIC PRINCIPLE:
 * This module identifies OBSERVED HEADER CONSISTENCIES AND MISMATCHES.
 * It does NOT perform risk scoring, does NOT perform DNS or network queries,
 * and does NOT declare an email to be fraudulent or malicious.
 */

/**
 * Normalizes a domain name for deterministic comparison:
 * - Converts to lowercase
 * - Strips leading/trailing whitespace
 * - Strips trailing dot
 * 
 * @param {string} domain 
 * @returns {string|null}
 */
export function normalizeDomain(domain) {
  if (!domain || typeof domain !== 'string') return null;
  let clean = domain.trim().toLowerCase();
  if (clean.endsWith('.')) {
    clean = clean.slice(0, -1);
  }
  return clean || null;
}

/**
 * Deterministically compares two domain names.
 * 
 * Rules:
 * 1. Case-insensitive
 * 2. Trailing-dot normalized
 * 3. Exact matching only — does NOT treat subdomains as equivalent
 *    (e.g., mail.example.com != example.com)
 * 4. No substring matching
 * 
 * @param {string} domainA 
 * @param {string} domainB 
 * @returns {boolean}
 */
export function compareDomains(domainA, domainB) {
  const normA = normalizeDomain(domainA);
  const normB = normalizeDomain(domainB);

  if (!normA || !normB) return false;
  return normA === normB;
}

/**
 * Extracts normalized email address and domain from an address string.
 * Supports:
 * - "Display Name <user@example.com>"
 * - "<user@example.com>"
 * - "user@example.com"
 * - Quoted display names: "\"John Doe\" <john@example.com>"
 * 
 * @param {string} rawAddress 
 * @returns {{ address: string|null, domain: string|null, raw: string|null }}
 */
export function extractEmailAndDomain(rawAddress) {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return {
      address: null,
      domain: null,
      raw: rawAddress ? String(rawAddress) : null
    };
  }

  const raw = rawAddress.trim();
  const angleMatch = raw.match(/<([^>]+)>/);
  const target = (angleMatch ? angleMatch[1] : raw).trim();

  const atIndex = target.lastIndexOf('@');
  if (atIndex === -1 || atIndex === target.length - 1) {
    return {
      address: target || null,
      domain: null,
      raw
    };
  }

  const address = target.toLowerCase();
  const domainPart = target.slice(atIndex + 1).trim();
  const domain = normalizeDomain(domainPart);

  return {
    address,
    domain,
    raw
  };
}

/**
 * Extracts primary sender identities across all available sources in the email.
 * Sources:
 * 1. From (metadata.from / headers)
 * 2. Reply-To (metadata.replyTo / headers)
 * 3. Return-Path (metadata.returnPath / headers)
 * 4. SPF authenticated / envelope domain (authentication.spf.results)
 * 5. DKIM signing domain (authentication.dkim.signatures)
 * 6. DMARC header.from domain (authentication.dmarc.results)
 * 
 * @param {object} emailData 
 * @returns {object} Normalized identities object
 */
export function extractSenderIdentities(emailData) {
  const identities = {
    from: null,
    replyTo: [],
    returnPath: null,
    spf: [],
    dkim: [],
    dmarc: []
  };

  if (!emailData) return identities;

  // 1. From
  const rawFrom = emailData.metadata?.from || null;
  if (rawFrom) {
    const fromInfo = extractEmailAndDomain(rawFrom);
    identities.from = fromInfo;
  }

  // 2. Reply-To (support both array in metadata and raw headers)
  const rawReplyTo = emailData.metadata?.replyTo;
  const replyToList = Array.isArray(rawReplyTo)
    ? rawReplyTo
    : (rawReplyTo ? [rawReplyTo] : []);

  for (const item of replyToList) {
    if (item) {
      const info = extractEmailAndDomain(item);
      identities.replyTo.push(info);
    }
  }

  // 3. Return-Path
  const rawReturnPath = emailData.metadata?.returnPath || null;
  if (rawReturnPath) {
    const returnPathInfo = extractEmailAndDomain(rawReturnPath);
    identities.returnPath = returnPathInfo;
  }

  // 4. SPF Domains (from Phase 3 authentication evidence)
  const spfResults = emailData.authentication?.spf?.results || [];
  for (const item of spfResults) {
    // Check item.domain or item.mailFrom
    const domainCandidate = item.domain || (item.mailFrom ? extractEmailAndDomain(item.mailFrom).domain : null);
    if (domainCandidate) {
      const norm = normalizeDomain(domainCandidate);
      if (norm) {
        identities.spf.push({
          domain: norm,
          source: item.source || 'SPF',
          raw: item.raw || null,
          result: item.result || null
        });
      }
    }
  }

  // Also check direct receivedSpf if present and not already collected
  const receivedSpf = emailData.authentication?.receivedSpf || [];
  for (const rs of receivedSpf) {
    if (rs.domain) {
      const norm = normalizeDomain(rs.domain);
      if (norm && !identities.spf.some((s) => s.domain === norm && s.source === 'Received-SPF')) {
        identities.spf.push({
          domain: norm,
          source: 'Received-SPF',
          raw: rs.raw || null,
          result: rs.result || null
        });
      }
    }
  }

  // 5. DKIM Domains (from DKIM-Signature headers parsed in Phase 3)
  const dkimSignatures = emailData.authentication?.dkim?.signatures || [];
  for (const sig of dkimSignatures) {
    if (sig.domain) {
      const norm = normalizeDomain(sig.domain);
      if (norm) {
        identities.dkim.push({
          domain: norm,
          selector: sig.selector || null,
          source: 'DKIM-Signature',
          raw: sig.raw || null
        });
      }
    }
  }

  // 6. DMARC Domains (from Authentication-Results parsed in Phase 3)
  const dmarcResults = emailData.authentication?.dmarc?.results || [];
  for (const dm of dmarcResults) {
    const domainCandidate = dm.headerFrom || dm.domain || null;
    if (domainCandidate) {
      const norm = normalizeDomain(domainCandidate);
      if (norm) {
        identities.dmarc.push({
          headerFrom: dm.headerFrom || null,
          domain: norm,
          source: dm.source || 'Authentication-Results',
          raw: dm.raw || null,
          result: dm.result || null,
          policy: dm.policy || null
        });
      }
    }
  }

  return identities;
}

/**
 * Analyzes sender identity consistency across headers and authentication records.
 * Performs deterministic comparisons between From and:
 * - Reply-To (each independently)
 * - Return-Path
 * - SPF domains (each independently)
 * - DKIM domains (each independently)
 * - DMARC header.from
 * 
 * Emits stable finding IDs:
 * - FROM_REPLY_TO_DOMAIN_MISMATCH
 * - FROM_RETURN_PATH_DOMAIN_MISMATCH
 * - FROM_SPF_DOMAIN_MISMATCH
 * - FROM_DKIM_DOMAIN_MISMATCH
 * - FROM_DMARC_HEADER_FROM_MISMATCH
 * 
 * @param {object} emailData Canonical parsed email object
 * @returns {object} Normalized senderIdentity object
 */
export function analyzeSenderIdentity(emailData) {
  const identities = extractSenderIdentities(emailData);
  const comparisons = [];
  const findings = [];

  const fromDomain = identities.from?.domain || null;
  const fromAddress = identities.from?.address || null;
  const fromRaw = identities.from?.raw || null;

  // ---------------------------------------------------------------------------
  // 1. From vs Reply-To Analysis
  // ---------------------------------------------------------------------------
  if (!fromDomain || identities.replyTo.length === 0) {
    comparisons.push({
      type: 'from_vs_reply_to',
      status: 'unavailable',
      sourceA: {
        type: 'From',
        value: fromAddress,
        domain: fromDomain
      },
      sourceB: {
        type: 'Reply-To',
        value: null,
        domain: null
      },
      evidence: {
        fromRaw,
        replyToRaw: null
      },
      message: !fromDomain
        ? 'From header domain is not available for Reply-To comparison.'
        : 'No Reply-To header was present in the email.'
    });
  } else {
    for (const rt of identities.replyTo) {
      if (!rt.domain) {
        comparisons.push({
          type: 'from_vs_reply_to',
          status: 'unavailable',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'Reply-To',
            value: rt.address,
            domain: null
          },
          evidence: {
            fromRaw,
            replyToRaw: rt.raw
          },
          message: 'Reply-To header did not contain a valid domain.'
        });
        continue;
      }

      const isMatch = compareDomains(fromDomain, rt.domain);
      if (isMatch) {
        comparisons.push({
          type: 'from_vs_reply_to',
          status: 'match',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'Reply-To',
            value: rt.address,
            domain: rt.domain
          },
          evidence: {
            fromRaw,
            replyToRaw: rt.raw
          },
          message: `From domain (${fromDomain}) and Reply-To domain (${rt.domain}) match.`
        });
      } else {
        const mismatchItem = {
          type: 'from_vs_reply_to',
          status: 'mismatch',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'Reply-To',
            value: rt.address,
            domain: rt.domain
          },
          evidence: {
            fromRaw,
            replyToRaw: rt.raw
          },
          message: `From domain (${fromDomain}) and Reply-To domain (${rt.domain}) do not match.`
        };
        comparisons.push(mismatchItem);

        findings.push({
          id: 'FROM_REPLY_TO_DOMAIN_MISMATCH',
          type: 'sender_identity_mismatch',
          comparison: 'from_vs_reply_to',
          detected: true,
          sourceA: mismatchItem.sourceA,
          sourceB: mismatchItem.sourceB,
          evidence: mismatchItem.evidence,
          message: mismatchItem.message
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. From vs Return-Path Analysis
  // ---------------------------------------------------------------------------
  const returnPathDomain = identities.returnPath?.domain || null;
  const returnPathAddress = identities.returnPath?.address || null;
  const returnPathRaw = identities.returnPath?.raw || null;

  if (!fromDomain || !returnPathDomain) {
    comparisons.push({
      type: 'from_vs_return_path',
      status: 'unavailable',
      sourceA: {
        type: 'From',
        value: fromAddress,
        domain: fromDomain
      },
      sourceB: {
        type: 'Return-Path',
        value: returnPathAddress,
        domain: returnPathDomain
      },
      evidence: {
        fromRaw,
        returnPathRaw
      },
      message: !fromDomain
        ? 'From header domain is not available for Return-Path comparison.'
        : 'Return-Path header is not present or contains no domain.'
    });
  } else {
    const isMatch = compareDomains(fromDomain, returnPathDomain);
    if (isMatch) {
      comparisons.push({
        type: 'from_vs_return_path',
        status: 'match',
        sourceA: {
          type: 'From',
          value: fromAddress,
          domain: fromDomain
        },
        sourceB: {
          type: 'Return-Path',
          value: returnPathAddress,
          domain: returnPathDomain
        },
        evidence: {
          fromRaw,
          returnPathRaw
        },
        message: `From domain (${fromDomain}) and Return-Path domain (${returnPathDomain}) match.`
      });
    } else {
      const mismatchItem = {
        type: 'from_vs_return_path',
        status: 'mismatch',
        sourceA: {
          type: 'From',
          value: fromAddress,
          domain: fromDomain
        },
        sourceB: {
          type: 'Return-Path',
          value: returnPathAddress,
          domain: returnPathDomain
        },
        evidence: {
          fromRaw,
          returnPathRaw
        },
        message: `From domain (${fromDomain}) and Return-Path domain (${returnPathDomain}) do not match.`
      };
      comparisons.push(mismatchItem);

      findings.push({
        id: 'FROM_RETURN_PATH_DOMAIN_MISMATCH',
        type: 'sender_identity_mismatch',
        comparison: 'from_vs_return_path',
        detected: true,
        sourceA: mismatchItem.sourceA,
        sourceB: mismatchItem.sourceB,
        evidence: mismatchItem.evidence,
        message: mismatchItem.message
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. From vs SPF Domain Analysis
  // ---------------------------------------------------------------------------
  if (!fromDomain || identities.spf.length === 0) {
    comparisons.push({
      type: 'from_vs_spf',
      status: 'unavailable',
      sourceA: {
        type: 'From',
        value: fromAddress,
        domain: fromDomain
      },
      sourceB: {
        type: 'SPF',
        value: null,
        domain: null
      },
      evidence: {
        fromRaw,
        spfRaw: null
      },
      message: !fromDomain
        ? 'From header domain is not available for SPF comparison.'
        : 'No explicit SPF-authenticated domain was found in authentication evidence.'
    });
  } else {
    for (const spfItem of identities.spf) {
      const isMatch = compareDomains(fromDomain, spfItem.domain);
      if (isMatch) {
        comparisons.push({
          type: 'from_vs_spf',
          status: 'match',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'SPF',
            value: spfItem.domain,
            domain: spfItem.domain,
            source: spfItem.source
          },
          evidence: {
            fromRaw,
            spfRaw: spfItem.raw
          },
          message: `From domain (${fromDomain}) and SPF domain (${spfItem.domain}) match.`
        });
      } else {
        const mismatchItem = {
          type: 'from_vs_spf',
          status: 'mismatch',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'SPF',
            value: spfItem.domain,
            domain: spfItem.domain,
            source: spfItem.source
          },
          evidence: {
            fromRaw,
            spfRaw: spfItem.raw
          },
          message: `From domain (${fromDomain}) and SPF domain (${spfItem.domain}) do not match.`
        };
        comparisons.push(mismatchItem);

        findings.push({
          id: 'FROM_SPF_DOMAIN_MISMATCH',
          type: 'sender_identity_mismatch',
          comparison: 'from_vs_spf',
          detected: true,
          sourceA: mismatchItem.sourceA,
          sourceB: mismatchItem.sourceB,
          evidence: mismatchItem.evidence,
          message: mismatchItem.message
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. From vs DKIM Domain Analysis
  // ---------------------------------------------------------------------------
  if (!fromDomain || identities.dkim.length === 0) {
    comparisons.push({
      type: 'from_vs_dkim',
      status: 'unavailable',
      sourceA: {
        type: 'From',
        value: fromAddress,
        domain: fromDomain
      },
      sourceB: {
        type: 'DKIM',
        value: null,
        domain: null
      },
      evidence: {
        fromRaw,
        dkimRaw: null
      },
      message: !fromDomain
        ? 'From header domain is not available for DKIM comparison.'
        : 'No DKIM signature domain (d=) was found in the message.'
    });
  } else {
    for (const dkimItem of identities.dkim) {
      const isMatch = compareDomains(fromDomain, dkimItem.domain);
      if (isMatch) {
        comparisons.push({
          type: 'from_vs_dkim',
          status: 'match',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'DKIM',
            value: dkimItem.domain,
            domain: dkimItem.domain,
            selector: dkimItem.selector
          },
          evidence: {
            fromRaw,
            dkimRaw: dkimItem.raw
          },
          message: `From domain (${fromDomain}) and DKIM signing domain (${dkimItem.domain}) match.`
        });
      } else {
        const mismatchItem = {
          type: 'from_vs_dkim',
          status: 'mismatch',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'DKIM',
            value: dkimItem.domain,
            domain: dkimItem.domain,
            selector: dkimItem.selector
          },
          evidence: {
            fromRaw,
            dkimRaw: dkimItem.raw
          },
          message: `From domain (${fromDomain}) and DKIM signing domain (${dkimItem.domain}) do not match.`
        };
        comparisons.push(mismatchItem);

        findings.push({
          id: 'FROM_DKIM_DOMAIN_MISMATCH',
          type: 'sender_identity_mismatch',
          comparison: 'from_vs_dkim',
          detected: true,
          sourceA: mismatchItem.sourceA,
          sourceB: mismatchItem.sourceB,
          evidence: mismatchItem.evidence,
          message: mismatchItem.message
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. From vs DMARC header.from Analysis
  // ---------------------------------------------------------------------------
  if (!fromDomain || identities.dmarc.length === 0) {
    comparisons.push({
      type: 'from_vs_dmarc_header_from',
      status: 'unavailable',
      sourceA: {
        type: 'From',
        value: fromAddress,
        domain: fromDomain
      },
      sourceB: {
        type: 'DMARC',
        value: null,
        domain: null
      },
      evidence: {
        fromRaw,
        dmarcRaw: null
      },
      message: !fromDomain
        ? 'From header domain is not available for DMARC comparison.'
        : 'No DMARC header.from was reported in Authentication-Results.'
    });
  } else {
    for (const dmarcItem of identities.dmarc) {
      const isMatch = compareDomains(fromDomain, dmarcItem.domain);
      if (isMatch) {
        comparisons.push({
          type: 'from_vs_dmarc_header_from',
          status: 'match',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'DMARC',
            value: dmarcItem.headerFrom || dmarcItem.domain,
            domain: dmarcItem.domain
          },
          evidence: {
            fromRaw,
            dmarcRaw: dmarcItem.raw
          },
          message: `From domain (${fromDomain}) and DMARC header.from domain (${dmarcItem.domain}) match.`
        });
      } else {
        const mismatchItem = {
          type: 'from_vs_dmarc_header_from',
          status: 'mismatch',
          sourceA: {
            type: 'From',
            value: fromAddress,
            domain: fromDomain
          },
          sourceB: {
            type: 'DMARC',
            value: dmarcItem.headerFrom || dmarcItem.domain,
            domain: dmarcItem.domain
          },
          evidence: {
            fromRaw,
            dmarcRaw: dmarcItem.raw
          },
          message: `From domain (${fromDomain}) and DMARC header.from domain (${dmarcItem.domain}) do not match.`
        };
        comparisons.push(mismatchItem);

        findings.push({
          id: 'FROM_DMARC_HEADER_FROM_MISMATCH',
          type: 'sender_identity_mismatch',
          comparison: 'from_vs_dmarc_header_from',
          detected: true,
          sourceA: mismatchItem.sourceA,
          sourceB: mismatchItem.sourceB,
          evidence: mismatchItem.evidence,
          message: mismatchItem.message
        });
      }
    }
  }

  return {
    identities,
    comparisons,
    findings
  };
}
