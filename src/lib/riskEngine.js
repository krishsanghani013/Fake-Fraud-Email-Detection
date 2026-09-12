// Deterministic risk engine

// Risk scoring policy
export const DETERMINISTIC_RISK_POLICY = Object.freeze({
  version: '1.0',
  thresholds: {
    LOW: { min: 0, max: 19 },
    MEDIUM: { min: 20, max: 49 },
    HIGH: { min: 50, max: 79 },
    CRITICAL: { min: 80, max: 100 }
  },
  points: {
    DMARC_FAIL: 20,
    DMARC_PERMERROR: 10,
    DMARC_TEMPERROR: 5,
    SPF_FAIL: 15,
    SPF_SOFTFAIL: 10,
    SPF_PERMERROR: 5,
    SPF_TEMPERROR: 5,
    DKIM_FAIL: 15,
    DKIM_PERMERROR: 5,
    DKIM_TEMPERROR: 5,

    FROM_REPLY_TO_DOMAIN_MISMATCH: 15,
    FROM_RETURN_PATH_DOMAIN_MISMATCH: 10,
    FROM_SPF_DOMAIN_MISMATCH: 10,
    FROM_DKIM_DOMAIN_MISMATCH: 10,
    FROM_DMARC_HEADER_FROM_MISMATCH: 15,

    NEGATIVE_TRANSMISSION_LATENCY: 10,
    RECEIVED_HOP_HOST_MISMATCH: 10,
    RECEIVED_TIMESTAMP_PARSE_ERROR: 5,

    IP_REPUTATION_MALICIOUS: 25,
    IP_REPUTATION_SUSPICIOUS: 12,
    URL_REPUTATION_MALICIOUS: 25,
    URL_REPUTATION_SUSPICIOUS: 12,
    DOMAIN_REPUTATION_MALICIOUS: 25,
    DOMAIN_REPUTATION_SUSPICIOUS: 12,
    THREAT_INTEL_UNAVAILABLE: 0,
    THREAT_INTEL_RATE_LIMITED: 0,
    THREAT_INTEL_PROVIDER_ERROR: 0,

    PHISHING_CREDENTIAL_HARVESTING: 25,
    PHISHING_ACCOUNT_SUSPENSION_URGENCY: 20,
    PHISHING_FINANCIAL_WIRE_FRAUD: 25,
    PHISHING_BRAND_IMPERSONATION: 20,
    PHISHING_EXTORTION_COERCION: 15,
    PHISHING_MALWARE_ATTACHMENT_LURE: 25,
    PHISHING_DECEPTIVE_URL_ANCHOR_MISMATCH: 25,
    PHISHING_DECEPTIVE_URL_IP_HOST: 20,
    PHISHING_SUSPICIOUS_TLD_CREDENTIAL_PATH: 15,
    PHISHING_LOOKALIKE_BRAND_DOMAIN: 15,
    PHISHING_DANGEROUS_ATTACHMENT_EXTENSION: 25,
    PHISHING_MACRO_ENABLED_ATTACHMENT: 20,
    PHISHING_DOUBLE_EXTENSION_ATTACHMENT: 25
  }
});

// Map score to risk level
export function determineRiskLevel(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
}

// Evaluate DMARC evidence
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

// Evaluate SPF evidence
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

// Evaluate DKIM evidence
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

// Evaluate sender identity findings
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

// Evaluate transmission findings
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

// Evaluate threat intelligence findings
function evaluateThreatIntelFindings(threatIntelFindings = [], seenDedupKeys) {
  const contributions = [];

  for (const f of threatIntelFindings) {
    if (!f || !f.id) continue;

    const points = DETERMINISTIC_RISK_POLICY.points[f.id] || 0;
    if (points <= 0) continue;

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

// Brand profiles for impersonation checks
const BRAND_PROFILES = [
  { name: 'PayPal', pattern: /\bpaypa[lI]\b/i, validDomains: ['paypal.com', 'paypal.me', 'paypal-corp.com'] },
  { name: 'Microsoft', pattern: /\b(?:microsoft|office\s*365|outlook|azure)\b/i, validDomains: ['microsoft.com', 'office.com', 'live.com', 'outlook.com', 'azure.com', 'msn.com'] },
  { name: 'Apple', pattern: /\b(?:apple(?:\s+security|\s+support|\s+id)?|icloud)\b/i, validDomains: ['apple.com', 'icloud.com', 'appleid.apple.com'] },
  { name: 'Google', pattern: /\b(?:google(?:\s+workspace|\s+security|\s+account)?|gmail)\b/i, validDomains: ['google.com', 'gmail.com', 'googlemail.com'] },
  { name: 'Amazon', pattern: /\bamazon(?:\s+security|\s+prime|\s+support|\s+pay)?\b/i, validDomains: ['amazon.com', 'amazonses.com', 'amazon.co.uk'] },
  { name: 'Netflix', pattern: /\bnetflix\b/i, validDomains: ['netflix.com'] },
  { name: 'Bank of America', pattern: /\bbank\s+of\s+america\b/i, validDomains: ['bankofamerica.com', 'bofa.com'] },
  { name: 'Chase', pattern: /\bchase\s+bank|jpmorgan\b/i, validDomains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com'] },
  { name: 'Wells Fargo', pattern: /\bwells\s+fargo\b/i, validDomains: ['wellsfargo.com'] },
  { name: 'DocuSign', pattern: /\bdocusign\b/i, validDomains: ['docusign.com', 'docusign.net'] },
  { name: 'Dropbox', pattern: /\bdropbox\b/i, validDomains: ['dropbox.com', 'dropboxmail.com'] },
  { name: 'DHL', pattern: /\bdhl(?:\s+express|\s+delivery|\s+tracking)?\b/i, validDomains: ['dhl.com', 'dhl-usa.com'] },
  { name: 'FedEx', pattern: /\bfedex\b/i, validDomains: ['fedex.com'] }
];

// High-abuse TLDs
const HIGH_ABUSE_TLDS = new Set([
  'xyz', 'top', 'tk', 'click', 'work', 'buzz', 'cam', 'fit', 'surf', 'cf', 'ga', 'ml', 'gq', 'club', 'live', 'online'
]);

// Dangerous attachment extensions
const DANGEROUS_ATTACHMENT_EXTENSIONS = new Set([
  'exe', 'scr', 'bat', 'cmd', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'ps1', 'ps1xml', 'ps2', 'psc1', 'psc2', 'hta', 'cpl', 'pif', 'iso', 'img', 'lnk', 'reg'
]);

// Macro document extensions
const MACRO_EXTENSIONS = new Set([
  'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam', 'ppsm'
]);

// Evaluate phishing heuristics
function evaluatePhishingEvidence(emailData = {}, seenDedupKeys) {
  const contributions = [];

  const subject = emailData.metadata?.subject || '';
  const rawTextBody = emailData.body?.text || '';
  const rawHtmlBody = emailData.body?.html || '';

  // Clean HTML text for heuristic evaluation
  const cleanHtmlBody = rawHtmlBody
    ? rawHtmlBody
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  const fullContentText = `${subject}\n\n${rawTextBody}\n\n${cleanHtmlBody}`.trim();

  // 1. Phishing & Threat Heuristics (Body & Subject)
  if (fullContentText) {
    // Check for benign workplace patterns first
    const isBenignWorkplace = /\b(?:attached is the (?:presentation|deck|minutes|agenda)|meeting (?:notes|link|minutes)|standup|catch up tomorrow|hop on a (?:call|google meet|zoom)|feel free to edit the doc|pull request|github|jira ticket|looking forward to (?:seeing|working with) you|sprint (?:planning|review|retrospective)|code review|deployment pipeline|quarterly roadmap)\b/i.test(fullContentText);

    // 1A. Credential Harvesting Lure
    const credHarvestRegex = /\b(?:verify (?:your|my) (?:account|identity|credentials|password|email|billing)|confirm (?:your|my) (?:login|password|credentials|security details)|reset (?:your|my) password|click (?:the link below|here) to (?:verify|confirm|login|sign in|access)|update your (?:billing|account|payment) (?:info|information)|validate your (?:identity|account)|verify your account now)\b/i;
    const credMatch = fullContentText.match(credHarvestRegex);
    if (credMatch) {
      const dedupKey = 'phishing:PHISHING_CREDENTIAL_HARVESTING';
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_CREDENTIAL_HARVESTING',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_CREDENTIAL_HARVESTING,
          reason: `Email content solicits sensitive credentials or account verification: "${credMatch[0]}".`,
          evidence: {
            indicator: 'Credential Harvesting Trap',
            matchedSnippet: credMatch[0],
            source: 'Body/Subject Content'
          }
        });
      }
    }

    // 1B. Account Suspension & Compromise Urgency
    const urgencyRegex = /\b(?:unauthorized (?:access|sign-in|activity|charges?|transaction)|account (?:has been|is) (?:suspended|locked|restricted|compromised|flagged|deactivated)|immediate action (?:is )?required|suspended within (?:12|24|48) hours|terminate your access|security alert:?\s*(?:urgent|unusual)|avoid (?:immediate )?account suspension|permanent account deactivation)\b/i;
    const urgencyMatch = fullContentText.match(urgencyRegex);
    if (urgencyMatch && (!isBenignWorkplace || credMatch)) {
      const dedupKey = 'phishing:PHISHING_ACCOUNT_SUSPENSION_URGENCY';
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_ACCOUNT_SUSPENSION_URGENCY',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_ACCOUNT_SUSPENSION_URGENCY,
          reason: `Email employs alarming security compromise pretext or urgent lockout threats: "${urgencyMatch[0]}".`,
          evidence: {
            indicator: 'Account Compromise & Lockout Pretext',
            matchedSnippet: urgencyMatch[0],
            source: 'Body/Subject Content'
          }
        });
      }
    }

    // 1C. Financial Diversion, BEC & Fake Invoices
    const financialRegex = /\b(?:wire transfer|direct deposit|bank routing|bank account (?:details|information)|gift cards?|itunes card|crypto(?:currency)?|bitcoin|send payment to|invoice attached|update payment (?:instructions|details)|wire (?:the|funds)|remittance advice|offshore (?:escrow|account)|call our fraud desk|invoice paid:? \$\d+|unauthorized payment on your account)\b/i;
    const financialMatch = fullContentText.match(financialRegex);
    if (financialMatch) {
      const dedupKey = 'phishing:PHISHING_FINANCIAL_WIRE_FRAUD';
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_FINANCIAL_WIRE_FRAUD',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_FINANCIAL_WIRE_FRAUD,
          reason: `Email solicits wire transfer, banking details alteration, or fraudulent invoice callback: "${financialMatch[0]}".`,
          evidence: {
            indicator: 'Financial Diversion & Wire Lure',
            matchedSnippet: financialMatch[0],
            source: 'Body/Subject Content'
          }
        });
      }
    }

    // 1D. Extortion & Coercive Pressure
    const extortionRegex = /\b(?:strictly confidential|do not inform anyone|failure to comply will result in (?:legal|disciplinary) action|legal action will be taken|your prompt compliance|law enforcement will be contacted)\b/i;
    const extortionMatch = fullContentText.match(extortionRegex);
    if (extortionMatch) {
      const dedupKey = 'phishing:PHISHING_EXTORTION_COERCION';
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_EXTORTION_COERCION',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_EXTORTION_COERCION,
          reason: `Email exerts coercive pressure or confidential isolation demanding compliance: "${extortionMatch[0]}".`,
          evidence: {
            indicator: 'Artificial Deadline & Coercion',
            matchedSnippet: extortionMatch[0],
            source: 'Body/Subject Content'
          }
        });
      }
    }

    // 1E. Malware / Macro Execution Lure
    const malwareRegex = /\b(?:enable macros|enable content|download (?:the|attached) (?:file|exe|zip|archive|payload)|view invoice\.exe|security_patch\.zip|execute the attached|open the attached payload)\b/i;
    const malwareMatch = fullContentText.match(malwareRegex);
    if (malwareMatch) {
      const dedupKey = 'phishing:PHISHING_MALWARE_ATTACHMENT_LURE';
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_MALWARE_ATTACHMENT_LURE',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_MALWARE_ATTACHMENT_LURE,
          reason: `Email prompts recipient to enable macros, run executables, or download untrusted payloads: "${malwareMatch[0]}".`,
          evidence: {
            indicator: 'Malware / Macro Execution Lure',
            matchedSnippet: malwareMatch[0],
            source: 'Body/Subject Content'
          }
        });
      }
    }
  }

  // 2. Brand Impersonation & Display-Name Spoofing
  const fromHeader = emailData.metadata?.from || '';
  if (fromHeader) {
    const angleMatch = fromHeader.match(/<([^>]+)>/);
    const displayName = angleMatch ? fromHeader.slice(0, angleMatch.index).trim().replace(/^["']+|["']+$/g, '') : '';
    const senderAddr = angleMatch ? angleMatch[1].trim() : fromHeader.trim();
    const atIdx = senderAddr.lastIndexOf('@');
    const senderDomain = atIdx !== -1 ? senderAddr.slice(atIdx + 1).toLowerCase().replace(/\.$/, '') : '';

    if (displayName && senderDomain) {
      for (const brand of BRAND_PROFILES) {
        if (brand.pattern.test(displayName)) {
          const isAuthenticDomain = brand.validDomains.some(
            (d) => senderDomain === d || senderDomain.endsWith(`.${d}`)
          );
          if (!isAuthenticDomain) {
            const dedupKey = `phishing:PHISHING_BRAND_IMPERSONATION:${brand.name}:${senderDomain}`;
            if (!seenDedupKeys.has(dedupKey)) {
              seenDedupKeys.add(dedupKey);
              contributions.push({
                id: 'PHISHING_BRAND_IMPERSONATION',
                category: 'phishing_heuristics',
                points: DETERMINISTIC_RISK_POLICY.points.PHISHING_BRAND_IMPERSONATION,
                reason: `Sender display name ("${displayName}") claims trusted organization "${brand.name}", but actual sending domain is "${senderDomain}".`,
                evidence: {
                  brandName: brand.name,
                  displayName,
                  senderDomain,
                  expectedDomains: brand.validDomains
                }
              });
            }
            break;
          }
        }
      }
    }
  }

  // 3. Deceptive HTML Anchor vs Target Href Mismatch
  if (rawHtmlBody) {
    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let aMatch;
    while ((aMatch = anchorRegex.exec(rawHtmlBody)) !== null) {
      const href = (aMatch[1] || '').trim();
      const rawAnchor = (aMatch[2] || '').replace(/<[^>]+>/g, '').trim();

      if (/^https?:\/\//i.test(href) && rawAnchor) {
        let hrefHost = '';
        try {
          hrefHost = new URL(href).hostname.toLowerCase();
        } catch {}

        // Check if anchor text looks like a domain or URL
        const anchorHostMatch = rawAnchor.match(/(?:https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)/i);
        if (anchorHostMatch && hrefHost) {
          const anchorHost = anchorHostMatch[1].toLowerCase();
          // If anchor host claims a different root domain than href target host
          if (anchorHost !== hrefHost && !hrefHost.endsWith(`.${anchorHost}`) && !anchorHost.endsWith(`.${hrefHost}`)) {
            const dedupKey = `phishing:PHISHING_DECEPTIVE_URL_ANCHOR_MISMATCH:${anchorHost}:${hrefHost}`;
            if (!seenDedupKeys.has(dedupKey)) {
              seenDedupKeys.add(dedupKey);
              contributions.push({
                id: 'PHISHING_DECEPTIVE_URL_ANCHOR_MISMATCH',
                category: 'phishing_heuristics',
                points: DETERMINISTIC_RISK_POLICY.points.PHISHING_DECEPTIVE_URL_ANCHOR_MISMATCH,
                reason: `Hyperlink anchor displays domain "${anchorHost}", but destination redirects to unassociated host "${hrefHost}".`,
                evidence: {
                  displayedAnchorDomain: anchorHost,
                  actualTargetHost: hrefHost,
                  destinationUrl: href
                }
              });
            }
          }
        }
      }
    }
  }

  // 4. URL Artifact Analysis (IP host, high-abuse TLDs, lookalike brand domains)
  const extractedUrls = emailData.artifacts?.urls || [];
  for (const urlItem of extractedUrls) {
    const normUrl = typeof urlItem === 'string' ? urlItem : (urlItem?.normalized || urlItem?.original || '');
    if (!normUrl) continue;

    let parsed = null;
    try {
      parsed = new URL(normUrl);
    } catch {
      continue;
    }

    const host = parsed.hostname.toLowerCase();

    // 4A. Raw IP Address Host in URL
    const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':');
    if (isIpHost) {
      const dedupKey = `phishing:PHISHING_DECEPTIVE_URL_IP_HOST:${host}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_DECEPTIVE_URL_IP_HOST',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_DECEPTIVE_URL_IP_HOST,
          reason: `Hyperlink targets a raw IP address host ("${host}") instead of an authenticated domain.`,
          evidence: {
            ipHost: host,
            url: normUrl
          }
        });
      }
    }

    // 4B. High-Abuse TLD with Credential / Login Target Path
    const tld = host.split('.').pop();
    if (HIGH_ABUSE_TLDS.has(tld)) {
      const pathAndQuery = `${parsed.pathname}${parsed.search}`.toLowerCase();
      if (/(?:login|signin|verify|account|password|banking|wallet|confirm|update|auth|credential)/i.test(pathAndQuery)) {
        const dedupKey = `phishing:PHISHING_SUSPICIOUS_TLD_CREDENTIAL_PATH:${host}`;
        if (!seenDedupKeys.has(dedupKey)) {
          seenDedupKeys.add(dedupKey);
          contributions.push({
            id: 'PHISHING_SUSPICIOUS_TLD_CREDENTIAL_PATH',
            category: 'phishing_heuristics',
            points: DETERMINISTIC_RISK_POLICY.points.PHISHING_SUSPICIOUS_TLD_CREDENTIAL_PATH,
            reason: `Hyperlink hosted on high-risk TLD (".${tld}") routes to an authentication or credential harvesting endpoint: "${parsed.pathname}".`,
            evidence: {
              domain: host,
              tld,
              path: parsed.pathname,
              url: normUrl
            }
          });
        }
      }
    }

    // 4C. Lookalike Brand Domain in Hyperlink
    const lookalikeMatch = host.match(/\b(paypa[lI]|apple[-_]?verify|sec[-_]?apple|microsoft[-_]?verify|login[-_]?security|account[-_]?update)[-a-zA-Z0-9]*/i);
    const isAuthenticBrandHost =
      host === 'paypal.com' || host.endsWith('.paypal.com') ||
      host === 'paypal.me' || host.endsWith('.paypal.me') ||
      host === 'apple.com' || host.endsWith('.apple.com') ||
      host === 'microsoft.com' || host.endsWith('.microsoft.com') ||
      host === 'google.com' || host.endsWith('.google.com');

    if (lookalikeMatch && !isAuthenticBrandHost) {
      const dedupKey = `phishing:PHISHING_LOOKALIKE_BRAND_DOMAIN:${host}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_LOOKALIKE_BRAND_DOMAIN',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_LOOKALIKE_BRAND_DOMAIN,
          reason: `Hyperlink host ("${host}") uses brand lookalike keywords matching deceptive typosquatting patterns.`,
          evidence: {
            suspiciousHost: host,
            matchedKeyword: lookalikeMatch[0],
            url: normUrl
          }
        });
      }
    }
  }

  // 5. Attachment Analysis
  const attachments = emailData.attachments || [];
  for (const att of attachments) {
    const filename = (att.filename || att.name || '').trim();
    if (!filename) continue;

    // 5A. Double Extension Concealment
    const doubleExtMatch = filename.match(/\.(?:pdf|docx?|xlsx?|txt|jpg|png|csv)\.(exe|scr|bat|cmd|vbs|jse?|wsf|ps1|hta|iso|cpl)$/i);
    if (doubleExtMatch) {
      const dedupKey = `phishing:PHISHING_DOUBLE_EXTENSION_ATTACHMENT:${filename.toLowerCase()}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_DOUBLE_EXTENSION_ATTACHMENT',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_DOUBLE_EXTENSION_ATTACHMENT,
          reason: `Attachment "${filename}" uses double-extension masking to conceal executable file extension (.${doubleExtMatch[1]}).`,
          evidence: {
            filename,
            maskedExtension: doubleExtMatch[1],
            contentType: att.contentType || null
          }
        });
      }
      continue;
    }

    const ext = filename.split('.').pop().toLowerCase();

    // 5B. Dangerous Executable or Script File
    if (DANGEROUS_ATTACHMENT_EXTENSIONS.has(ext)) {
      const dedupKey = `phishing:PHISHING_DANGEROUS_ATTACHMENT_EXTENSION:${filename.toLowerCase()}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_DANGEROUS_ATTACHMENT_EXTENSION',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_DANGEROUS_ATTACHMENT_EXTENSION,
          reason: `Attachment "${filename}" has a dangerous executable or script file extension (.${ext}).`,
          evidence: {
            filename,
            extension: ext,
            contentType: att.contentType || null
          }
        });
      }
      continue;
    }

    // 5C. Macro-Enabled Document
    if (MACRO_EXTENSIONS.has(ext) || /macroEnabled/i.test(att.contentType || '')) {
      const dedupKey = `phishing:PHISHING_MACRO_ENABLED_ATTACHMENT:${filename.toLowerCase()}`;
      if (!seenDedupKeys.has(dedupKey)) {
        seenDedupKeys.add(dedupKey);
        contributions.push({
          id: 'PHISHING_MACRO_ENABLED_ATTACHMENT',
          category: 'phishing_heuristics',
          points: DETERMINISTIC_RISK_POLICY.points.PHISHING_MACRO_ENABLED_ATTACHMENT,
          reason: `Attachment "${filename}" is a macro-enabled document (.${ext}) capable of executing arbitrary VBA code.`,
          evidence: {
            filename,
            extension: ext,
            contentType: att.contentType || null
          }
        });
      }
    }
  }

  return contributions;
}

// Master risk analysis
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
          threat_intelligence: 0,
          phishing_heuristics: 0
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

  // 5. Phishing, Content Deception & Attack Heuristics (Phase 6 Enhancement)
  allContributions.push(...evaluatePhishingEvidence(emailData, seenDedupKeys));

  // Calculate category totals
  const categorySums = {
    authentication: 0,
    sender_identity: 0,
    transmission: 0,
    threat_intelligence: 0,
    phishing_heuristics: 0
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

export const calculateRisk = analyzeRisk;
