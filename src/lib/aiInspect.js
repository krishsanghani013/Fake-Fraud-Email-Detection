// AI forensic email inspector

const MAX_EMAIL_LENGTH = 15000;
const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

// Deception taxonomy
export const DECEPTION_TAXONOMY = Object.freeze([
  'Potential Brand Impersonation',
  'Account-Security Impersonation',
  'Social Engineering & Fear Tactics',
  'Potential Credential Harvesting',
  'External Verification URL',
  'Financial Manipulation & Wire Fraud',
  'Urgency & Time Constraints',
  'Authority Impersonation'
]);

const SYSTEM_INSTRUCTION = `You are a Senior Email Fraud & Phishing Forensics Analysis Engine.
Your role is to perform an objective, rigorous, evidence-based security assessment of provided email text.

CORE PRINCIPLES & GUIDELINES:
1. DISTINGUISH OBSERVED TEXTUAL EVIDENCE FROM CONFIRMED EXTERNAL EVIDENCE:
   - Base all findings strictly on observable textual patterns in the email.
   - Do NOT claim a domain or IP is "confirmed malicious" or "belongs to an attacker" unless external threat intelligence verifies it.
   - Use accurate forensic terminology (e.g., "Potential brand impersonation", "Potential credential-harvesting attempt", "External account-verification URL detected", "Alleged sign-in incident IP artifact").
2. CONTEXT & COMBINATION OF SIGNALS:
   - Do NOT treat a brand name, security alert, IP address, country, URL, or urgency alone as automatically malicious.
   - Evaluate the COMBINATION and CONTEXT of signals (e.g., security alert + account compromise fear + verification CTA + external verification URL is a strong indicator of phishing).
3. TAXONOMY OF OBSERVABLE INDICATORS:
   - "Potential Brand Impersonation": References/mimics a known brand/entity without verified sender authentication.
   - "Account-Security Impersonation": Simulates security alerts (e.g. "unusual sign-in", "compromised account", "unrecognized device").
   - "Social Engineering & Fear Tactics": Leverages fear of account loss, secrecy, or consequences to compel action.
   - "Potential Credential Harvesting": Directs user to verify account credentials, reset passwords, or click portals.
   - "External Verification URL": A verification link directing outside the legitimate brand domain.
   - "Financial Manipulation & Wire Fraud": Requests urgent payment redirection, escrow wiring, or invoice modifications.
   - "Urgency & Time Constraints": Employs artificial deadlines, countdowns, or immediate demands.
   - "Authority Impersonation": Claims executive (CEO), legal, compliance, or IT administrator authority.
4. EVIDENCE-BASED INDICATORS:
   - Every indicator must contain: "type", "severity" ("low"|"medium"|"high"|"critical"), "description" (explaining WHY), "evidence" (exact quoted text snippet from email), and "confidence" (0-100).
5. CLASSIFICATION & RISK SCORING:
   - "legitimate": Routine, safe email without deceptive patterns (riskScore: 0–24).
   - "suspicious": Notable anomalies, unverified claims, or mild urgency warranting caution (riskScore: 25–69).
   - "fraudulent": Strong combination of impersonation, deception, credential harvesting, or financial fraud (riskScore: 70–100).
6. OUTPUT FORMAT:
   - Return ONLY a valid JSON object matching the requested schema. No markdown code fences or surrounding text.`;

const USER_PROMPT_TEMPLATE = (emailText) => `${SYSTEM_INSTRUCTION}

Analyze the following email content and return ONLY a valid JSON object with this exact structure:

{
  "classification": "legitimate" | "suspicious" | "fraudulent",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": 0,
  "confidence": 0,
  "urgencyIndex": 0,
  "primaryThreatVector": "string (e.g. Executive Impersonation / Credential Phishing / Clean Routine)",
  "indicators": [
    {
      "type": "string (taxonomy category name)",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "string (specific explanation in context)",
      "evidence": "string (exact quoted text snippet from email)",
      "confidence": 0
    }
  ],
  "summary": "string (concise 1-2 sentence forensic overview)",
  "recommendation": "string (actionable security mitigation guidance)"
}

EMAIL CONTENT TO ANALYZE:
"""
${emailText}
"""
`;

// Parse JSON from Gemini response
export function parseGeminiJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Received empty response from Gemini API.');
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}

// Normalize inspection result
export function normalizeInspectionResult(data, options = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('AI analysis result is not a valid object.');
  }

  const validClassifications = ['legitimate', 'suspicious', 'fraudulent'];
  const validRiskLevels = ['low', 'medium', 'high', 'critical'];

  const rawClassification = String(data.classification || '').toLowerCase().trim();
  const classification = validClassifications.includes(rawClassification)
    ? rawClassification
    : 'suspicious';

  const rawRiskLevel = String(data.riskLevel || '').toLowerCase().trim();
  const riskLevel = validRiskLevels.includes(rawRiskLevel)
    ? rawRiskLevel
    : 'medium';

  const riskScore = Math.max(0, Math.min(100, Math.round(Number(data.riskScore) || 0)));
  const confidence = Math.max(0, Math.min(100, Math.round(Number(data.confidence) || 85)));
  const urgencyIndex = Math.max(0, Math.min(100, Math.round(Number(data.urgencyIndex) || 0)));

  const primaryThreatVector = String(
    data.primaryThreatVector ||
      (classification === 'fraudulent'
        ? 'Credential Phishing & Impersonation'
        : classification === 'suspicious'
        ? 'Suspicious Communication Anomaly'
        : 'Legitimate Routine Communication')
  ).trim();

  const rawIndicators = Array.isArray(data.indicators) ? data.indicators.slice(0, 10) : [];
  let indicatorCounter = 1;

  const indicators = rawIndicators.map((item) => {
    const rawSev = String(item?.severity || '').toLowerCase().trim();
    const severity = validRiskLevels.includes(rawSev) ? rawSev : 'medium';
    const conf = Math.max(0, Math.min(100, Math.round(Number(item?.confidence) || 85)));
    const id = `INSPECT-${String(indicatorCounter++).padStart(3, '0')}`;

    // Calculate point contribution based on severity
    let riskContribution = 10;
    if (severity === 'critical') riskContribution = 30;
    else if (severity === 'high') riskContribution = 20;
    else if (severity === 'medium') riskContribution = 10;
    else if (severity === 'low') riskContribution = 5;

    return {
      id,
      type: String(item?.type || 'Forensic Observation').trim(),
      severity,
      description: String(item?.description || '').trim(),
      evidence: String(item?.evidence || '').trim(),
      confidence: conf,
      riskContribution,
      category: 'ai'
    };
  });

  const summary = String(data.summary || '').trim() || 'Forensic inspection completed.';
  const recommendation =
    String(data.recommendation || '').trim() ||
    'Verify sender integrity before interacting with any embedded links or requested actions.';

  return {
    engine: options.engine || 'gemini-3.6',
    model: options.model || DEFAULT_GEMINI_MODEL,
    inspectedAt: new Date().toISOString(),
    classification,
    riskLevel,
    riskScore,
    confidence,
    urgencyIndex,
    primaryThreatVector,
    indicators,
    summary,
    recommendation
  };
}

// Deterministic inspection fallback
export function inspectEmailDeterministic(text) {
  if (typeof text !== 'string') {
    text = '';
  }

  const lower = text.toLowerCase();
  const indicators = [];
  let riskScore = 0;
  let urgencyIndex = 15;
  let primaryThreatVector = 'Legitimate Routine Communication';

  // 1. Check for Account-Security Alert Impersonation
  const hasSecurityAlert =
    lower.includes('unusual sign-in') ||
    lower.includes('unrecognized device') ||
    lower.includes('unauthorized access') ||
    lower.includes('suspicious activity') ||
    lower.includes('sign-in attempt') ||
    lower.includes('new sign-in') ||
    lower.includes('security alert') ||
    lower.includes('unauthorized login');

  if (hasSecurityAlert) {
    indicators.push({
      type: 'Account-Security Impersonation',
      severity: 'high',
      description: 'The message simulates an automated security alert regarding an alleged unauthorized sign-in or unrecognized device.',
      evidence:
        text.match(/(?:unusual sign-in[^\n.]*|unrecognized device[^\n.]*|sign-in attempt[^\n.]*|security alert[^\n.]*)/i)?.[0] ||
        'Detected unusual sign-in attempt warning',
      confidence: 90
    });
    riskScore += 25;
    urgencyIndex += 20;
    primaryThreatVector = 'Account Security Alert Impersonation';
  }

  // 2. Check for Social Engineering & Fear of Account Compromise
  const hasFearOrCompromise =
    lower.includes('account may be compromised') ||
    lower.includes('compromised') ||
    lower.includes('account suspended') ||
    lower.includes('account locked') ||
    lower.includes('permanent suspension') ||
    lower.includes('terminate your account') ||
    lower.includes('immediate action required') ||
    lower.includes('do not discuss this with anyone');

  if (hasFearOrCompromise) {
    indicators.push({
      type: 'Social Engineering & Fear Tactics',
      severity: 'high',
      description: 'The message leverages fear of account compromise, permanent loss, or secrecy to compel immediate compliance without verification.',
      evidence:
        text.match(/(?:your account may be compromised[^\n.]*|account (?:will be |is )?(?:suspended|locked)[^\n.]*|do not discuss this[^\n.]*)/i)?.[0] ||
        'Account may be compromised, immediate verification required.',
      confidence: 92
    });
    riskScore += 25;
    urgencyIndex += 25;
  }

  // 3. Check for Potential Credential Harvesting & Verification CTA
  const hasVerificationCta =
    lower.includes('verify my account') ||
    lower.includes('verify your account') ||
    lower.includes('confirm your account') ||
    lower.includes('click here to verify') ||
    lower.includes('reset-password') ||
    lower.includes('reset your password') ||
    lower.includes('renew your credentials') ||
    lower.includes('re-authenticate') ||
    lower.includes('update your password');

  if (hasVerificationCta) {
    indicators.push({
      type: 'Potential Credential Harvesting',
      severity: 'critical',
      description: 'The message prompts the recipient to complete urgent account verification or credential re-authentication via an external action.',
      evidence:
        text.match(/(?:verify (?:my|your) account[^\n.]*|reset (?:your )?password[^\n.]*|confirm (?:your )?identity[^\n.]*|click here to verify[^\n.]*)/i)?.[0] ||
        'Verify your account credentials',
      confidence: 94
    });
    riskScore += 30;
    urgencyIndex += 20;
    primaryThreatVector = 'Credential Harvesting Phishing';
  }

  // 4. Check for External / Suspicious Verification URLs
  const urlMatches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  let hasExternalVerificationUrl = false;

  for (const url of urlMatches) {
    const urlLower = url.toLowerCase();
    const isBrandUrl =
      urlLower.includes('microsoft.com') ||
      urlLower.includes('google.com') ||
      urlLower.includes('apple.com') ||
      urlLower.includes('amazon.com') ||
      urlLower.includes('paypal.com');

    const isSuspiciousUrl =
      urlLower.includes('phish') ||
      urlLower.includes('training') ||
      urlLower.includes('verify') ||
      urlLower.includes('auth-') ||
      urlLower.includes('login-') ||
      urlLower.includes('portal-') ||
      urlLower.includes('fake') ||
      !isBrandUrl;

    if (isSuspiciousUrl && (hasSecurityAlert || hasVerificationCta || urlMatches.length > 0)) {
      hasExternalVerificationUrl = true;
      indicators.push({
        type: 'External Verification URL',
        severity: 'high',
        description: 'The verification link directs the user to an external or anomalous domain rather than official brand infrastructure.',
        evidence: url,
        confidence: 90
      });
      riskScore += 20;
      break;
    }
  }

  // 5. Check for Potential Brand Impersonation
  const brands = ['microsoft', 'google', 'apple', 'paypal', 'amazon', 'netflix', 'dhl', 'fedex', 'bank'];
  const referencedBrand = brands.find((b) => lower.includes(b));

  if (referencedBrand && (hasSecurityAlert || hasVerificationCta || hasExternalVerificationUrl)) {
    const brandCapitalized = referencedBrand.charAt(0).toUpperCase() + referencedBrand.slice(1);
    indicators.push({
      type: 'Potential Brand Impersonation',
      severity: 'high',
      description: `The message presents itself as an official ${brandCapitalized} notification without verifiable domain authentication.`,
      evidence:
        text.match(new RegExp(`(?:from:\\s*[^\\n]*${referencedBrand}|${referencedBrand}\\s+account|${referencedBrand}\\s+security)`, 'i'))?.[0] ||
        `From: ${brandCapitalized}`,
      confidence: 88
    });
    riskScore += 20;
    if (!primaryThreatVector.includes('Wire')) {
      primaryThreatVector = `Brand Impersonation (${brandCapitalized})`;
    }
  }

  // 6. Check for Financial Fraud & Wire Redirection
  const hasFinancialFraud =
    lower.includes('wire transfer') ||
    lower.includes('rerouted to our designated escrow') ||
    lower.includes('unscheduled compliance audit') ||
    lower.includes('offshore commercial bank') ||
    lower.includes('swift / routing') ||
    lower.includes('escrow account') ||
    lower.includes('transfer $') ||
    lower.includes('payment instruction') ||
    lower.includes('invoice #');

  if (hasFinancialFraud && (lower.includes('wire') || lower.includes('bank') || lower.includes('transfer') || lower.includes('urgent'))) {
    indicators.push({
      type: 'Financial Manipulation & Wire Fraud',
      severity: 'critical',
      description: 'The email requests urgent financial transactions or wire redirection while using pressure or secrecy to bypass standard verification.',
      evidence:
        text.match(/(?:transfer \\$[0-9,]+[^\\n.]*|wire transfer[^\\n.]*|escrow account[^\\n.]*|invoice #[0-9]+[^\\n.]*)/i)?.[0] ||
        'Transfer funds via wire to offshore escrow account',
      confidence: 96
    });
    riskScore += 45;
    urgencyIndex += 30;
    primaryThreatVector = 'BEC Wire Transfer Scheme';
  }

  // 7. Check for Urgency & Time Constraints
  const hasUrgency =
    lower.includes('immediately') ||
    lower.includes('before 2:00 pm') ||
    lower.includes('today') ||
    lower.includes('within 24 hours') ||
    lower.includes('urgent') ||
    lower.includes('as soon as possible');

  if (hasUrgency && indicators.length > 0) {
    indicators.push({
      type: 'Urgency & Time Constraints',
      severity: 'medium',
      description: 'The email imposes tight deadlines and artificial urgency to induce rapid execution before verification can take place.',
      evidence:
        text.match(/(?:immediately[^\\n.]*|before [0-9]+:[0-9]+ (?:am|pm)[^\\n.]*|within 24 hours[^\\n.]*|urgent[^\\n.]*)/i)?.[0] ||
        'Immediate execution required today',
      confidence: 85
    });
    riskScore += 10;
    urgencyIndex = Math.min(100, urgencyIndex + 15);
  }

  // 8. Authority Impersonation
  const hasAuthority =
    lower.includes('chief executive officer') ||
    lower.includes('tim cook') ||
    lower.includes('ceo-office') ||
    lower.includes('cfo') ||
    lower.includes('executive director');

  if (hasAuthority && hasFinancialFraud) {
    indicators.push({
      type: 'Authority Impersonation',
      severity: 'high',
      description: 'Claims senior executive authority to intimidate personnel and override standard segregation-of-duties protocols.',
      evidence:
        text.match(/(?:chief executive officer[^\\n.]*|tim cook[^\\n.]*|ceo-office[^\\n.]*)/i)?.[0] ||
        'Chief Executive Officer',
      confidence: 92
    });
    riskScore += 20;
    primaryThreatVector = 'Executive Impersonation (BEC)';
  }

  // Determine Classification and Risk Level
  let classification = 'legitimate';
  if (
    riskScore >= 60 ||
    hasVerificationCta ||
    hasFinancialFraud ||
    (hasExternalVerificationUrl && (referencedBrand || hasSecurityAlert))
  ) {
    classification = 'fraudulent';
    riskScore = Math.max(75, Math.min(98, riskScore));
  } else if (riskScore >= 25 || indicators.length >= 1) {
    classification = 'suspicious';
    riskScore = Math.max(35, Math.min(68, riskScore));
  } else {
    classification = 'legitimate';
    riskScore = Math.min(20, Math.max(0, riskScore));
    primaryThreatVector = 'Legitimate Routine Communication';
  }

  const riskLevel =
    riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

  urgencyIndex = Math.min(100, Math.max(10, urgencyIndex));
  const confidence = indicators.length > 0 ? 94 : 88;

  let summary = '';
  let recommendation = '';

  if (classification === 'fraudulent') {
    summary = `Forensic inspection identified definitive indicators of ${primaryThreatVector}, including unverified sender identity, psychological pressure, and deceptive call-to-actions.`;
    recommendation = 'Isolate message immediately. Do NOT authorize wire transfers, disclose credentials, or click external URLs. Alert internal SOC personnel.';
  } else if (classification === 'suspicious') {
    summary = 'The communication exhibits structural or behavioral anomalies that deviate from verified corporate baselines.';
    recommendation = 'Independently contact the alleged sender through an established out-of-band channel before taking requested action.';
  } else {
    summary = 'No deceptive social engineering, brand impersonation, or credential theft indicators were detected in the text.';
    recommendation = 'Standard organizational email precautions apply.';
  }

  return normalizeInspectionResult(
    {
      classification,
      riskLevel,
      riskScore,
      confidence,
      urgencyIndex,
      primaryThreatVector,
      indicators,
      summary,
      recommendation
    },
    { engine: 'deterministic-heuristic', model: 'offline-forensic-engine' }
  );
}

// Inspect email with AI and deterministic fallback
export async function inspectEmail(emailText, options = {}) {
  if (!emailText || typeof emailText !== 'string') {
    throw new Error('Invalid input: emailText must be a non-empty string.');
  }

  let sanitized = emailText.trim();
  if (sanitized.length === 0) {
    throw new Error('Invalid input: emailText cannot be empty.');
  }

  if (sanitized.length > MAX_EMAIL_LENGTH) {
    sanitized = sanitized.slice(0, MAX_EMAIL_LENGTH) + '\n\n[Truncated for token efficiency]';
  }

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const model = options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const timeoutMs = options.timeoutMs || Number(process.env.GEMINI_TIMEOUT_MS) || 8000;

  // Fallback immediately if no API key is present
  if (!apiKey) {
    return inspectEmailDeterministic(sanitized);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const candidateModels = [
    model,
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3-flash-preview',
    'gemini-3.7-flash'
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  for (const currentModel of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        currentModel
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const promptText = USER_PROMPT_TEMPLATE(sanitized);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (res.status === 429 || res.status === 503 || res.status === 404) {
        console.warn(`[AI Inspect] Gemini model ${currentModel} returned HTTP ${res.status} (quota/availability). Trying next model in pool...`);
        continue;
      }

      if (!res.ok) {
        console.warn(`[AI Inspect] Gemini model ${currentModel} HTTP status ${res.status}. Trying next model...`);
        continue;
      }

      const payload = await res.json();
      const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) continue;

      const parsed = parseGeminiJsonResponse(rawText);
      clearTimeout(timeoutId);
      return normalizeInspectionResult(parsed, { engine: 'gemini-api', model: currentModel });
    } catch (err) {
      if (err.name === 'AbortError') break;
      console.warn(`[AI Inspect] Gemini call failed for ${currentModel}:`, err.message || err);
    }
  }

  clearTimeout(timeoutId);
  return inspectEmailDeterministic(sanitized);
}

// Extract text annotations for UI
export function extractTextAnnotations(text, indicators = []) {
  if (!text || typeof text !== 'string') return [];

  const annotations = [];

  // Patterns to annotate
  const PATTERNS = [
    {
      type: 'payment',
      label: 'Payment Demand',
      color: 'red',
      regex: /(?:transfer\s+\$[0-9,]+[^.\n]*|wire\s+transfer[^.\n]*|\$[0-9,]+(?:\s+USD)?|escrow\s+account[^.\n]*)/gi
    },
    {
      type: 'urgency',
      label: 'Urgency Trap',
      color: 'purple',
      regex: /(?:immediately|before\s+[0-9]+:[0-9]+\s*(?:am|pm)[^.\n]*|urgent[^.\n]*|do not discuss this[^.\n]*|strict\s+sec\s+non-disclosure[^.\n]*)/gi
    },
    {
      type: 'credential',
      label: 'Credential Phish',
      color: 'orange',
      regex: /(?:verify\s+(?:my|your)\s+account|click\s+here\s+to\s+verify|reset\s+(?:your\s+)?password|renew\s+your\s+credentials)/gi
    },
    {
      type: 'mismatch',
      label: 'Domain Mismatch',
      color: 'amber',
      regex: /(?:From:\s*[^<\n]*<[^>]+>|Reply-To:\s*[^<\n]*<[^>]+>)/gi
    }
  ];

  for (const p of PATTERNS) {
    let match;
    const rx = new RegExp(p.regex);
    while ((match = rx.exec(text)) !== null) {
      annotations.push({
        type: p.type,
        label: p.label,
        color: p.color,
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  // Also include exact snippets from indicators if not matched
  for (const ind of indicators) {
    if (ind.evidence && ind.evidence.length > 5) {
      const idx = text.indexOf(ind.evidence);
      if (idx !== -1 && !annotations.some((a) => a.startIndex === idx)) {
        annotations.push({
          type: ind.severity === 'critical' ? 'payment' : 'urgency',
          label: ind.type,
          color: ind.severity === 'critical' ? 'red' : 'purple',
          text: ind.evidence,
          startIndex: idx,
          endIndex: idx + ind.evidence.length
        });
      }
    }
  }

  return annotations.sort((a, b) => a.startIndex - b.startIndex);
}

// Build unified evidence chain
export function buildUnifiedEvidenceChain(aiResult, canonicalData = {}) {
  const safeAi = aiResult || inspectEmailDeterministic('');
  const risk = canonicalData?.risk || { totalScore: safeAi.riskScore, level: safeAi.riskLevel, contributions: [] };

  // Category Score Allocation
  // Maximum budgets: AI Content (30), Threat Intel (30), Authentication (25), Sender Identity (15)
  let aiContentScore = Math.min(30, Math.round((safeAi.riskScore * 30) / 100));
  let threatIntelScore = 0;
  let authScore = 0;
  let identityScore = 0;

  // Derive scores from canonical contributions if available
  if (Array.isArray(risk.contributions)) {
    for (const c of risk.contributions) {
      const cat = String(c.category || '').toLowerCase();
      if (cat.includes('auth') || cat.includes('spf') || cat.includes('dkim') || cat.includes('dmarc')) {
        authScore += c.points || 0;
      } else if (cat.includes('ident') || cat.includes('sender') || cat.includes('mismatch')) {
        identityScore += c.points || 0;
      } else if (cat.includes('intel') || cat.includes('threat') || cat.includes('reputation')) {
        threatIntelScore += c.points || 0;
      }
    }
  }

  // Clamping to category budgets
  authScore = Math.min(25, authScore);
  identityScore = Math.min(15, identityScore);
  threatIntelScore = Math.min(30, threatIntelScore);

  // Unified Evidence Items List
  const evidenceList = [];

  // Add AI Content indicators
  for (const ind of safeAi.indicators || []) {
    evidenceList.push({
      id: ind.id,
      category: 'ai',
      type: ind.type,
      source: 'AI Behavioral Inspector',
      severity: ind.severity,
      confidence: ind.confidence,
      riskContribution: ind.riskContribution,
      evidence: ind.evidence,
      description: ind.description
    });
  }

  // Add Canonical risk contributions
  if (Array.isArray(risk.contributions)) {
    let contribId = 1;
    for (const c of risk.contributions) {
      evidenceList.push({
        id: `DETERMINISTIC-${String(contribId++).padStart(3, '0')}`,
        category: c.category || 'authentication',
        type: c.ruleId || c.finding || 'Forensic Rule Finding',
        source: 'Deterministic Risk Engine',
        severity: c.points >= 20 ? 'critical' : c.points >= 15 ? 'high' : 'medium',
        confidence: 100,
        riskContribution: c.points,
        evidence: c.detail || c.finding,
        description: c.finding
      });
    }
  }

  // 6-step evidence flow
  const steps = [
    { step: '1', title: 'Email Header & Body', sub: 'RFC 5322 Ingress' },
    { step: '2', title: 'Observed Evidence', sub: `${safeAi.indicators?.length || 0} Behavioral Signals` },
    { step: '3', title: 'Artifact Extraction', sub: 'Domains / URLs / IPs' },
    { step: '4', title: 'Deterministic Analysis', sub: 'Auth / Latency / Identity' },
    { step: '5', title: 'Risk Point Contribution', sub: `${safeAi.riskScore} Combined Score` },
    { step: '6', title: 'Final Verdict', sub: `${safeAi.riskLevel.toUpperCase()} THREAT` }
  ];

  return {
    steps,
    categoryScores: {
      aiContent: { score: aiContentScore, max: 30 },
      threatIntel: { score: threatIntelScore, max: 30 },
      authentication: { score: authScore, max: 25 },
      senderIdentity: { score: identityScore, max: 15 }
    },
    evidenceList,
    totalScore: safeAi.riskScore,
    riskLevel: safeAi.riskLevel,
    classification: safeAi.classification
  };
}
