// Forensic AI content detection engine

export const AI_DETECTION_VERDICTS = Object.freeze({
  DEFINITELY_AI: 'DEFINITELY_AI_GENERATED',
  LIKELY_AI: 'LIKELY_AI_GENERATED',
  MIXED_CONTENT: 'MIXED_OR_PARAPHRASED',
  LIKELY_HUMAN: 'LIKELY_HUMAN_AUTHORED',
  HIGHLY_CONFIDENT_HUMAN: 'HIGHLY_CONFIDENT_HUMAN'
});

export const THREAT_VERDICTS = Object.freeze({
  FRAUDULENT_HARMFUL: 'FRAUDULENT_HARMFUL',
  SUSPICIOUS_RISK: 'SUSPICIOUS_RISK',
  LEGITIMATE_SAFE: 'LEGITIMATE_SAFE'
});

export const THREAT_CATEGORIES = Object.freeze({
  CREDENTIAL_PHISHING: 'CREDENTIAL_PHISHING',
  FINANCIAL_FRAUD: 'FINANCIAL_FRAUD',
  SECURITY_ALERT_SCAM: 'SECURITY_ALERT_SCAM',
  BRAND_IMPERSONATION: 'BRAND_IMPERSONATION',
  MALWARE_LURE: 'MALWARE_LURE',
  EXTORTION_COERCION: 'EXTORTION_COERCION',
  BENIGN_LEGITIMATE: 'BENIGN_LEGITIMATE'
});

export const QUAD_MATRIX_VERDICTS = Object.freeze({
  AI_GENERATED_HARMFUL: 'AI_GENERATED_HARMFUL',
  AI_GENERATED_LEGITIMATE: 'AI_GENERATED_LEGITIMATE',
  HUMAN_AUTHORED_HARMFUL: 'HUMAN_AUTHORED_HARMFUL',
  HUMAN_AUTHORED_LEGITIMATE: 'HUMAN_AUTHORED_LEGITIMATE',
  SUSPICIOUS_ANOMALY: 'SUSPICIOUS_ANOMALY'
});

// LLM signature markers
export const AI_HALLMARKS = [
  // 1. Synthetic Openers & Hedging
  { pattern: /\b(i hope this email finds you well)\b/i, category: 'Formulaic Opener', weight: 15, description: 'Classic generic LLM greeting cliché' },
  { pattern: /\b(i hope this message finds you in good health)\b/i, category: 'Formulaic Opener', weight: 15, description: 'Overly formal synthetic greeting' },
  { pattern: /\b(please be advised that)\b/i, category: 'Synthetic Formalism', weight: 10, description: 'Common administrative hedging' },
  { pattern: /\b(it is important to (?:note|remember|consider))\b/i, category: 'Synthetic Transition', weight: 12, description: 'Didactic lecturing transition typical of LLMs' },
  { pattern: /\b(delve(?:\s+deeply)?\s+into)\b/i, category: 'LLM Vocabulary Signature', weight: 22, description: 'Disproportionately high LLM word choice ("delve")' },
  { pattern: /\b(testament to)\b/i, category: 'LLM Vocabulary Signature', weight: 20, description: 'Overused stylistic embellishment' },
  { pattern: /\b(beacon of)\b/i, category: 'LLM Vocabulary Signature', weight: 20, description: 'Hyperbolic metaphor typical of LLMs' },
  { pattern: /\b(tapestry of)\b/i, category: 'LLM Vocabulary Signature', weight: 25, description: 'Classic stylistic hallmark of synthetic generation' },
  { pattern: /\b(in today'?s (?:fast-paced|ever-evolving|digital) (?:world|landscape|age))\b/i, category: 'Synthetic Exposition', weight: 24, description: 'Standard LLM essay/marketing exposition' },
  { pattern: /\b(rest assured(?:,| that))\b/i, category: 'Robotic Assurance', weight: 14, description: 'Formulaic reassurance phrase' },
  { pattern: /\b(moreover|furthermore|in conclusion|to summarize)\b/gi, category: 'Mechanical Connector', weight: 8, description: 'Rigid academic transitional markers' },
  { pattern: /\b(do not hesitate to (?:contact|reach out to) (?:us|me))\b/i, category: 'Formulaic Closer', weight: 10, description: 'Overused automated closing phrase' },
  { pattern: /\b(pivotal role|vital role|crucial role)\b/i, category: 'Synthetic Embellishment', weight: 12, description: 'Recurrent synthetic emphasis adjective' },
  { pattern: /\b(by following these steps|simply click the link below to verify)\b/i, category: 'Scaffolding Urgency', weight: 12, description: 'Phishing email procedural scaffolding' },
  { pattern: /\b(foster(?:ing)? (?:innovation|collaboration|growth))\b/i, category: 'Corporate Cliché', weight: 14, description: 'AI corporate buzzword alignment' },

  // 2. Prompt Leakage & Variable Placeholders
  { pattern: /\b(?:as an ai language model|as an ai(?: assistant)?)\b/i, category: 'Prompt Leak', weight: 50, description: 'Direct AI model self-identification leak' },
  { pattern: /\[(?:recipient(?:'s)? name|insert date|your name|company name|organization|account number)\]/i, category: 'Unfilled Template Variable', weight: 35, description: 'Unsubstituted prompt template variable placeholder' },
  { pattern: /\b(?:subject line:|here is a draft(?: of)?|here is an email)\b/i, category: 'Prompt Generation Leak', weight: 40, description: 'Chatbot output prefix artifact' }
];

// Threat patterns
export const THREAT_PATTERNS = [
  // 1. Credential Harvesting & Account Takeover
  {
    pattern: /\b(?:verify (?:your|my) (?:account|identity|credentials|password|email)|confirm (?:your|my) (?:login|password|credentials|security details)|reset (?:your|my) password|click (?:the link below|here) to (?:verify|confirm|login|sign in)|update your (?:billing|account|payment) (?:info|information)|validate your (?:identity|account))\b/i,
    category: 'CREDENTIAL_PHISHING',
    indicator: 'Credential Harvesting Trap',
    severity: 'CRITICAL',
    weight: 35,
    description: 'Solicits user to enter credentials, verify account, or click authentication portal'
  },
  // 2. Urgent Security Scams & Account Lockout Threats
  {
    pattern: /\b(?:unauthorized (?:access|sign-in|activity|charges?)|account (?:has been|is) (?:suspended|locked|restricted|compromised|flagged)|immediate action (?:is )?required|suspended within (?:24|48) hours|terminate your access|security alert:?\s*(?:urgent|unusual))\b/i,
    category: 'SECURITY_ALERT_SCAM',
    indicator: 'Account Compromise & Lockout Pretext',
    severity: 'HIGH',
    weight: 30,
    description: 'Simulates alarming security compromise to trigger urgent panicked response'
  },
  // 3. Financial Manipulation, BEC & Wire Fraud
  {
    pattern: /\b(?:wire transfer|direct deposit|bank routing|bank account (?:details|information)|gift cards?|itunes card|crypto(?:currency)?|bitcoin|send payment to|invoice attached|update payment (?:instructions|details)|wire (?:the|funds)|remittance advice)\b/i,
    category: 'FINANCIAL_FRAUD',
    indicator: 'Financial Diversion & Wire Lure',
    severity: 'CRITICAL',
    weight: 40,
    description: 'Requests urgent money transfer, banking credential alteration, or gift cards'
  },
  // 4. Authority & Brand Impersonation
  {
    pattern: /\b(?:paypal (?:security|support|team)|microsoft (?:365|security|support|team)|google workspace (?:security|team)|it (?:helpdesk|support|department)|internal revenue service|ceo office|human resources payroll)\b/i,
    category: 'BRAND_IMPERSONATION',
    indicator: 'Brand or Authority Impersonation',
    severity: 'HIGH',
    weight: 25,
    description: 'Claims high-authority brand or organizational oversight without verification'
  },
  // 5. Coercive Time Limits & Extortion
  {
    pattern: /\b(?:within (?:24|12|48) hours|strictly confidential|do not inform anyone|failure to comply will result|legal action will be taken|your prompt compliance)\b/i,
    category: 'EXTORTION_COERCION',
    indicator: 'Artificial Deadline & Coercion',
    severity: 'MEDIUM',
    weight: 20,
    description: 'Pressures recipient with tight artificial countdown or legal extortion'
  },
  // 6. Malware & Malicious Attachment Lure
  {
    pattern: /\b(?:enable macros|download (?:the|attached) (?:file|exe|zip|archive|payload)|view invoice\.exe|security_patch\.zip)\b/i,
    category: 'MALWARE_LURE',
    indicator: 'Malware / Macro Execution Lure',
    severity: 'CRITICAL',
    weight: 40,
    description: 'Encourages downloading or executing suspicious attachments or enabling macros'
  }
];

// Benign workplace patterns
export const BENIGN_PATTERNS = [
  /\b(?:attached is the (?:presentation|deck|minutes|agenda)|meeting (?:notes|link|minutes)|standup|catch up tomorrow|hop on a (?:call|google meet|zoom)|feel free to edit the doc|pull request|github|jira ticket|looking forward to (?:seeing|working with) you)\b/i,
  /\b(?:sprint (?:planning|review|retrospective)|code review|deployment pipeline|quarterly roadmap)\b/i
];

// Strip HTML tags
export function stripHtml(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Segment text into sentences
export function segmentSentences(text) {
  if (!text || typeof text !== 'string') return [];

  const cleanText = text.includes('<') && text.includes('>') ? stripHtml(text) : text;

  const normalized = cleanText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();

  if (!normalized) return [];

  const rawSegments = normalized.split(/(?<=[.?!])\s+(?=[A-Z0-9"'\(\[])|\n{2,}/);

  const sentences = [];
  for (const seg of rawSegments) {
    const trimmed = seg.trim().replace(/\s+/g, ' ');
    if (trimmed.length >= 8 && trimmed.split(/\s+/).length >= 2) {
      sentences.push(trimmed);
    }
  }

  if (sentences.length === 0 && normalized.length > 0) {
    sentences.push(normalized);
  }

  return sentences;
}

// Tokenize text into words
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

// Compute sentence length burstiness
export function computeBurstiness(sentences) {
  if (!Array.isArray(sentences) || sentences.length <= 1) {
    return {
      burstinessScore: 50,
      meanLength: sentences?.[0]?.length || 0,
      stdDev: 0,
      cv: 0.45,
      interpretation: 'Insufficient sentence count for statistical burstiness variance'
    };
  }

  const lengths = sentences.map((s) => tokenizeText(s).length).filter((l) => l > 0);
  if (lengths.length <= 1) {
    return {
      burstinessScore: 50,
      meanLength: lengths[0] || 0,
      stdDev: 0,
      cv: 0.45,
      interpretation: 'Single sentence detected'
    };
  }

  const sum = lengths.reduce((acc, val) => acc + val, 0);
  const mean = sum / lengths.length;

  const variance =
    lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  const cv = mean > 0 ? stdDev / mean : 0;

  let aiBurstinessLikelihood = 50;
  if (cv < 0.25) {
    aiBurstinessLikelihood = 92;
  } else if (cv < 0.38) {
    aiBurstinessLikelihood = 78;
  } else if (cv < 0.52) {
    aiBurstinessLikelihood = 55;
  } else if (cv < 0.70) {
    aiBurstinessLikelihood = 32;
  } else {
    aiBurstinessLikelihood = 15;
  }

  return {
    burstinessScore: Math.round(aiBurstinessLikelihood),
    meanLength: Math.round(mean * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv * 100) / 100,
    interpretation:
      cv < 0.35
        ? 'Unnaturally uniform sentence cadence (strong LLM indicator)'
        : cv > 0.65
        ? 'Organic human rhythm with high sentence length variance'
        : 'Moderate stylistic variance'
  };
}

// Compute perplexity proxy
export function computePerplexityProxy(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return {
      predictabilityScore: 50,
      commonTransitionDensity: 0,
      rareWordRatio: 0,
      rating: 'INSUFFICIENT_TOKENS'
    };
  }

  const llmHighFrequencyWords = new Set([
    'additionally',
    'furthermore',
    'moreover',
    'consequently',
    'therefore',
    'however',
    'specifically',
    'crucial',
    'essential',
    'paramount',
    'seamless',
    'seamlessly',
    'transformative',
    'synergy',
    'foster',
    'fostering',
    'beacon',
    'tapestry',
    'delve',
    'delving',
    'testament',
    'collaborative',
    'unwavering',
    'ecosystem',
    'dynamic',
    'robust',
    'tailored',
    'meticulously',
    'streamline',
    'interoperability',
    'empower',
    'empowers',
    'catalyst',
    'journey',
    'realm',
    'vital',
    'pivotal',
    'comprehensive',
    'efficient',
    'innovative',
    'optimize',
    'ensure',
    'regarding',
    'assistance',
    'convenience',
    'sincerely',
    'promptly',
    'verification',
    'immediate'
  ]);

  let transitionCount = 0;
  for (const t of tokens) {
    if (llmHighFrequencyWords.has(t)) {
      transitionCount++;
    }
  }

  const transitionDensity = (transitionCount / tokens.length) * 100;

  let predictabilityScore = 30;
  if (transitionDensity > 7.0) {
    predictabilityScore = 88;
  } else if (transitionDensity > 4.5) {
    predictabilityScore = 72;
  } else if (transitionDensity > 2.0) {
    predictabilityScore = 52;
  } else {
    predictabilityScore = 25;
  }

  return {
    predictabilityScore: Math.min(100, Math.round(predictabilityScore)),
    commonTransitionDensity: Math.round(transitionDensity * 10) / 10,
    rating:
      predictabilityScore >= 75
        ? 'High token predictability (LLM smoothing pattern)'
        : predictabilityScore >= 50
        ? 'Moderate token predictability'
        : 'Natural lexical entropy'
  };
}

// Compute lexical diversity
export function computeLexicalDiversity(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return { ttr: 0.5, uniqueWords: 0, totalTokens: 0, rating: 'UNKNOWN' };
  }

  const unique = new Set(tokens);
  const ttr = unique.size / tokens.length;

  return {
    ttr: Math.round(ttr * 100) / 100,
    uniqueWords: unique.size,
    totalTokens: tokens.length,
    rating:
      ttr > 0.75
        ? 'High vocabulary richness'
        : ttr > 0.50
        ? 'Standard vocabulary distribution'
        : 'Repetitive vocabulary pattern'
  };
}

// Detect synthetic AI hallmarks
export function detectAiHallmarks(text) {
  if (!text || typeof text !== 'string') {
    return { hallmarks: [], totalHallmarkWeight: 0 };
  }

  const matches = [];
  let totalWeight = 0;

  for (const item of AI_HALLMARKS) {
    const found = text.match(item.pattern);
    if (found) {
      matches.push({
        category: item.category,
        matched: found[0],
        description: item.description,
        weight: item.weight
      });
      totalWeight += item.weight;
    }
  }

  return {
    hallmarks: matches,
    totalHallmarkWeight: Math.min(100, totalWeight)
  };
}

// Analyze deterministic threat cues
export function analyzeThreatDeterministic(text, subject = '') {
  const fullText = subject ? `${subject}\n\n${text}` : text;
  const matches = [];
  let rawScore = 0;
  let hasCriticalLure = false;

  for (const item of THREAT_PATTERNS) {
    const found = fullText.match(item.pattern);
    if (found) {
      matches.push({
        category: item.category,
        indicator: item.indicator,
        severity: item.severity,
        evidence: found[0],
        explanation: item.description,
        weight: item.weight
      });
      rawScore += item.weight;
      if (item.severity === 'CRITICAL') {
        hasCriticalLure = true;
      }
    }
  }

  let benignCount = 0;
  for (const bp of BENIGN_PATTERNS) {
    if (bp.test(fullText)) {
      benignCount++;
    }
  }

  if (benignCount > 0 && !hasCriticalLure) {
    rawScore = Math.max(0, rawScore - benignCount * 25);
  }

  const threatScore = Math.max(0, Math.min(99, Math.round(rawScore)));
  const isFake = threatScore >= 35 || hasCriticalLure || matches.some(m => m.category === 'CREDENTIAL_PHISHING' || m.category === 'FINANCIAL_FRAUD');
  const isHarmful = threatScore >= 35 || hasCriticalLure || matches.some(m => m.category === 'CREDENTIAL_PHISHING' || m.category === 'FINANCIAL_FRAUD');
  const isLegitimate = threatScore < 30 && !hasCriticalLure && matches.length === 0;

  let threatVerdict = THREAT_VERDICTS.LEGITIMATE_SAFE;
  if (threatScore >= 60 || hasCriticalLure) {
    threatVerdict = THREAT_VERDICTS.FRAUDULENT_HARMFUL;
  } else if (threatScore >= 30) {
    threatVerdict = THREAT_VERDICTS.SUSPICIOUS_RISK;
  }

  const primaryCategory =
    matches.length > 0 ? matches[0].category : THREAT_CATEGORIES.BENIGN_LEGITIMATE;

  return {
    threatScore,
    isFake,
    isHarmful,
    isLegitimate,
    threatVerdict,
    threatCategory: primaryCategory,
    threatIndicators: matches
  };
}

// Resolve quad-matrix verdict
export function resolveQuadMatrixVerdict(aiProbability, threatScore, isHarmful = null) {
  const isHighAi = aiProbability >= 50;
  const isHarmfulThreat = isHarmful !== null ? Boolean(isHarmful) : threatScore >= 50;
  const isSafe = threatScore < 30 && !isHarmfulThreat;

  if (isHarmfulThreat) {
    return isHighAi
      ? QUAD_MATRIX_VERDICTS.AI_GENERATED_HARMFUL
      : QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_HARMFUL;
  }

  if (isSafe) {
    return isHighAi
      ? QUAD_MATRIX_VERDICTS.AI_GENERATED_LEGITIMATE
      : QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_LEGITIMATE;
  }

  return QUAD_MATRIX_VERDICTS.SUSPICIOUS_ANOMALY;
}

// Analyze stylometrics deterministically
export function analyzeStylometricsDeterministic(text, subject = '') {
  const cleanBody = text && typeof text === 'string' ? text.trim() : '';
  const fullText = subject ? `${subject}\n\n${cleanBody}` : cleanBody;
  const sentences = segmentSentences(cleanBody || subject);
  const tokens = tokenizeText(fullText);

  const burstiness = computeBurstiness(sentences);
  const perplexity = computePerplexityProxy(tokens);
  const lexical = computeLexicalDiversity(tokens);
  const hallmarks = detectAiHallmarks(fullText);
  const threatData = analyzeThreatDeterministic(fullText, subject);

  // Hallmark scoring based on count and weight
  let hallmarkScore = Math.min(100, hallmarks.totalHallmarkWeight * 1.5);
  if (hallmarks.hallmarks.length >= 3) hallmarkScore = Math.max(hallmarkScore, 85);
  else if (hallmarks.hallmarks.length === 2) hallmarkScore = Math.max(hallmarkScore, 70);
  else if (hallmarks.hallmarks.length === 1) hallmarkScore = Math.max(hallmarkScore, 50);

  let compositeScore =
    hallmarkScore * 0.40 +
    burstiness.burstinessScore * 0.35 +
    perplexity.predictabilityScore * 0.25;

  if (burstiness.cv < 0.35) compositeScore += 8;
  if (burstiness.cv > 0.65 && hallmarks.hallmarks.length === 0) compositeScore -= 12;

  if (sentences.length >= 3 && burstiness.cv < 0.22) {
    compositeScore += 10;
  }

  // Strong AI hallmarks override: if text contains clear AI hallmark signatures, guarantee AI probability
  if (hallmarks.hallmarks.length >= 2 || hallmarks.totalHallmarkWeight >= 35) {
    compositeScore = Math.max(compositeScore, 65);
  }
  if (hallmarks.hallmarks.length >= 3 || hallmarks.totalHallmarkWeight >= 50) {
    compositeScore = Math.max(compositeScore, 80);
  }

  const finalAiScore = Math.max(2, Math.min(98, Math.round(compositeScore)));

  let authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
  if (finalAiScore >= 80) {
    authorshipVerdict = AI_DETECTION_VERDICTS.DEFINITELY_AI;
  } else if (finalAiScore >= 60) {
    authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_AI;
  } else if (finalAiScore >= 40) {
    authorshipVerdict = AI_DETECTION_VERDICTS.MIXED_CONTENT;
  } else if (finalAiScore >= 20) {
    authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
  } else {
    authorshipVerdict = AI_DETECTION_VERDICTS.HIGHLY_CONFIDENT_HUMAN;
  }

  const quadMatrixVerdict = resolveQuadMatrixVerdict(finalAiScore, threatData.threatScore, threatData.isHarmful);

  // Generate per-sentence synthetic and deceptive annotations for heatmap
  const perSentenceAnalysis = sentences.map((sentence, index) => {
    const sTokens = tokenizeText(sentence);
    const sHallmarks = detectAiHallmarks(sentence);
    const sThreatMatches = THREAT_PATTERNS.filter((tp) => tp.pattern.test(sentence));
    const isSentenceDeceptive = sThreatMatches.length > 0;

    let sScore = Math.round(finalAiScore * 0.7);

    if (sHallmarks.hallmarks.length > 0) {
      sScore = Math.min(99, sScore + 30);
    }

    if (sTokens.length <= 4 && sHallmarks.hallmarks.length === 0) {
      sScore = Math.max(10, sScore - 35);
    }

    return {
      index,
      sentence,
      aiProbability: sScore,
      isDeceptive: isSentenceDeceptive,
      deceptiveIndicators: sThreatMatches.map((m) => m.indicator),
      classification:
        sScore >= 75 ? 'AI_GENERATED' : sScore >= 45 ? 'SUSPICIOUS_MIXED' : 'HUMAN_AUTHENTIC',
      hallmarksFound: sHallmarks.hallmarks.map((h) => h.matched)
    };
  });

  const threatText = threatData.isHarmful
    ? `Identified ${threatData.threatIndicators.length} critical threat cue(s) indicating potential ${threatData.threatCategory.replace(/_/g, ' ')} (${threatData.threatScore}% threat severity).`
    : `Threat analysis indicates benign/safe communication (Threat Score: ${threatData.threatScore}%).`;

  const authorshipText =
    finalAiScore >= 60
      ? `Statistical stylometrics detect strong synthetic indicators (${finalAiScore}% probability) with uniform cadence (CV: ${burstiness.cv}) and ${hallmarks.hallmarks.length} hallmark marker(s).`
      : `Stylometrics indicate predominantly human-authored characteristics (${100 - finalAiScore}% organic confidence).`;

  return {
    aiProbability: finalAiScore,
    authorshipVerdict,
    verdict: authorshipVerdict, // backwards-compatible alias
    threatScore: threatData.threatScore,
    isFake: threatData.isFake,
    isHarmful: threatData.isHarmful,
    isLegitimate: threatData.isLegitimate,
    threatVerdict: threatData.threatVerdict,
    threatCategory: threatData.threatCategory,
    quadMatrixVerdict,
    threatIndicators: threatData.threatIndicators,
    confidence: sentences.length >= 4 ? 90 : 75,
    engine: 'AEGIS Dual-Matrix Deterministic Engine',
    metrics: {
      burstiness,
      perplexity,
      lexical,
      sentenceCount: sentences.length,
      tokenCount: tokens.length
    },
    hallmarks: hallmarks.hallmarks,
    perSentenceAnalysis,
    summary: `${authorshipText} ${threatText}`,
    suggestedAnalystAction: threatData.isHarmful
      ? `Exercise caution: Email contains fraudulent/harmful indicators (${threatData.threatCategory}). Do NOT click links or provide credentials.`
      : finalAiScore >= 60
      ? 'Synthetic text detected. Verify sender identity and cross-check SPF/DKIM/DMARC.'
      : 'Email appears legitimate and organic. Verify routine attachments if any.'
  };
}

// Build Gemini detection prompt
export function buildAiDetectionPrompt(text, subject = '', deterministicMetrics = null) {
  const systemInstruction = `You are an elite Senior Dual-Domain Forensic Email Analyst and Computational Linguist.
Your mission is to rigorously analyze an incoming email along TWO independent, orthogonal dimensions:

DIMENSION 1: AUTHORSHIP ORIGIN (AI-Generated vs Human-Authored)
- Evaluate sentence cadence variance (burstiness), vocabulary smoothing, structural symmetry, robotic clichés, and prompt leak markers.
- Assign an aiProbability (0% to 100%).

DIMENSION 2: DECEPTION & THREAT CLASSIFICATION (Fake / Harmful vs Legitimate / Safe)
- Determine whether the email is FAKE (deceptive, spoofing, impersonating, or fraudulent) or AUTHENTIC.
- Determine whether the email is HARMFUL (credential phishing, financial wire scam, extortion, malware) or SAFE (benign business, transactional, or personal dialogue).
- Assign a threatScore (0% to 100%).

CRITICAL FORENSIC PRINCIPLES:
1. Orthogonal Separation: AI-generated text is NOT automatically malicious (e.g. an AI-written marketing newsletter or meeting recap is AI-Generated but LEGITIMATE).
2. Human attacks exist: A CEO wire fraud scam written manually by a scammer is Human-Authored but FRAUDULENT and HARMFUL.
3. Output STRICT, VALID JSON conforming exactly to the requested schema. No markdown backticks.`;

  const promptText = `Analyze the following email for both AI synthetic authorship AND deceptive threat/harm indicators.

EMAIL SUBJECT: "${subject || '(No Subject)'}"

EMAIL BODY:
"""
${text}
"""

DETERMINISTIC FORENSIC BASELINE:
- Calculated Burstiness (CV): ${deterministicMetrics?.metrics?.burstiness?.cv ?? 'N/A'}
- Detected LLM Hallmarks: ${deterministicMetrics?.hallmarks?.map((h) => h.matched).join(', ') || 'None'}
- Detected Threat Cues: ${deterministicMetrics?.threatIndicators?.map((t) => t.indicator).join(', ') || 'None'}
- Baseline Threat Score: ${deterministicMetrics?.threatScore ?? 'N/A'}

Produce your forensic assessment strictly as a JSON object matching this schema:
{
  "aiProbability": 85,
  "authorshipVerdict": "DEFINITELY_AI_GENERATED | LIKELY_AI_GENERATED | MIXED_OR_PARAPHRASED | LIKELY_HUMAN_AUTHORED | HIGHLY_CONFIDENT_HUMAN",
  "isFake": true,
  "isHarmful": true,
  "isLegitimate": false,
  "threatScore": 90,
  "threatVerdict": "FRAUDULENT_HARMFUL | SUSPICIOUS_RISK | LEGITIMATE_SAFE",
  "threatCategory": "CREDENTIAL_PHISHING | FINANCIAL_FRAUD | SECURITY_ALERT_SCAM | BRAND_IMPERSONATION | MALWARE_LURE | EXTORTION_COERCION | BENIGN_LEGITIMATE",
  "quadMatrixVerdict": "AI_GENERATED_HARMFUL | AI_GENERATED_LEGITIMATE | HUMAN_AUTHORED_HARMFUL | HUMAN_AUTHORED_LEGITIMATE | SUSPICIOUS_ANOMALY",
  "confidence": 92,
  "summary": "Forensic executive summary addressing both authorship origin and deceptive harm/legitimacy status.",
  "threatIndicators": [
    {
      "category": "CREDENTIAL_PHISHING",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "indicator": "Short name",
      "evidence": "Quoted text snippet",
      "explanation": "Why this represents a threat"
    }
  ],
  "linguisticIndicators": [
    {
      "indicator": "Short name",
      "severity": "HIGH | MEDIUM | LOW",
      "evidence": "Quoted text",
      "explanation": "Why this reflects AI or human generation"
    }
  ],
  "perSentenceAnalysis": [
    {
      "index": 0,
      "sentence": "Exact sentence text",
      "aiProbability": 90,
      "isDeceptive": true,
      "classification": "AI_GENERATED | SUSPICIOUS_MIXED | HUMAN_AUTHENTIC",
      "reason": "Brief rationale"
    }
  ],
  "suggestedAnalystAction": "Concrete security recommendation"
}`;

  return { systemInstruction, promptText };
}

// Detect AI-generated content
export async function detectAiGeneratedContent(text, options = {}) {
  const generatedAt = new Date().toISOString();
  const subject = options.subject || '';
  const timeoutMs = options.timeoutMs || Number(process.env.GEMINI_TIMEOUT_MS) || 30000;
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
  const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // 1. Run deterministic stylometrics & threat baseline
  const deterministicBaseline = analyzeStylometricsDeterministic(text, subject);

  // If forceOffline or no API key, return deterministic baseline immediately
  if (options.forceOffline || !apiKey) {
    return {
      status: 'AVAILABLE',
      generatedAt,
      model: `${model} (Offline Dual-Matrix Engine)`,
      isOfflineFallback: true,
      ...deterministicBaseline
    };
  }

  // 2. Query Google Gemini with automatic model failover pool
  const { systemInstruction, promptText } = buildAiDetectionPrompt(text, subject, deterministicBaseline);
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (response.status === 429 || response.status === 503 || response.status === 404) {
        console.warn(`[AI Content Detection] Model ${currentModel} returned HTTP ${response.status} (quota/availability). Trying next model in pool...`);
        continue;
      }

      if (!response.ok) {
        console.warn(`[AI Content Detection] Model ${currentModel} returned HTTP ${response.status}. Trying next model...`);
        continue;
      }

      const payload = await response.json();
      const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        continue;
      }

      clearTimeout(timeoutId);

      // Form Hybrid Ensemble Scores for both Authorship and Threat
      const geminiAiScore = typeof parsed.aiProbability === 'number' ? parsed.aiProbability : deterministicBaseline.aiProbability;
      const hybridAiScore = Math.round(geminiAiScore * 0.6 + deterministicBaseline.aiProbability * 0.4);

      const geminiThreatScore = typeof parsed.threatScore === 'number' ? parsed.threatScore : deterministicBaseline.threatScore;
      const hybridThreatScore = Math.round(geminiThreatScore * 0.65 + deterministicBaseline.threatScore * 0.35);

      let authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
      if (hybridAiScore >= 80) authorshipVerdict = AI_DETECTION_VERDICTS.DEFINITELY_AI;
      else if (hybridAiScore >= 60) authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_AI;
      else if (hybridAiScore >= 40) authorshipVerdict = AI_DETECTION_VERDICTS.MIXED_CONTENT;
      else if (hybridAiScore >= 20) authorshipVerdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
      else authorshipVerdict = AI_DETECTION_VERDICTS.HIGHLY_CONFIDENT_HUMAN;

      const isFake = hybridThreatScore >= 35 || Boolean(parsed.isFake) || deterministicBaseline.isFake;
      const isHarmful = hybridThreatScore >= 35 || Boolean(parsed.isHarmful) || deterministicBaseline.isHarmful;
      const isLegitimate = hybridThreatScore < 30 && !isFake && !isHarmful;

      let threatVerdict = THREAT_VERDICTS.LEGITIMATE_SAFE;
      if (hybridThreatScore >= 60 || isHarmful) {
        threatVerdict = THREAT_VERDICTS.FRAUDULENT_HARMFUL;
      } else if (hybridThreatScore >= 30) {
        threatVerdict = THREAT_VERDICTS.SUSPICIOUS_RISK;
      }

      const quadMatrixVerdict = resolveQuadMatrixVerdict(hybridAiScore, hybridThreatScore, isHarmful);

      const threatIndicators = Array.isArray(parsed.threatIndicators) && parsed.threatIndicators.length > 0
        ? parsed.threatIndicators
        : deterministicBaseline.threatIndicators;

      return {
        status: 'AVAILABLE',
        generatedAt,
        model: currentModel,
        engine: `gemini-api (${currentModel})`,
        isOfflineFallback: false,
        aiProbability: hybridAiScore,
        authorshipVerdict,
        verdict: authorshipVerdict,
        threatScore: hybridThreatScore,
        isFake,
        isHarmful,
        isLegitimate,
        threatVerdict,
        threatCategory: parsed.threatCategory || deterministicBaseline.threatCategory,
        quadMatrixVerdict,
        threatIndicators,
        confidence: parsed.confidence || deterministicBaseline.confidence,
        summary: parsed.summary || deterministicBaseline.summary,
        metrics: deterministicBaseline.metrics,
        hallmarks: deterministicBaseline.hallmarks,
        linguisticIndicators: parsed.linguisticIndicators || [],
        perSentenceAnalysis: Array.isArray(parsed.perSentenceAnalysis) && parsed.perSentenceAnalysis.length > 0
          ? parsed.perSentenceAnalysis
          : deterministicBaseline.perSentenceAnalysis,
        suggestedAnalystAction: parsed.suggestedAnalystAction || deterministicBaseline.suggestedAnalystAction
      };
    } catch (err) {
      if (err.name === 'AbortError') break;
      console.warn(`[AI Content Detection] Live call failed for ${currentModel}:`, err.message || err);
    }
  }

  clearTimeout(timeoutId);
  return {
    status: 'AVAILABLE',
    generatedAt,
    model: `${model} (Stylometric Fallback - Model Pool Exhausted/Timeout)`,
    isOfflineFallback: true,
    ...deterministicBaseline
  };
}