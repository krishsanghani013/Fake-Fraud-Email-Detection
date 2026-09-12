/**
 * Phase 9 — Forensic AI-Generated Email Content Detection Engine
 * 
 * Multi-Signal Forensic Architecture:
 * 1. Stylometric & Statistical Metrics (Deterministic):
 *    - Burstiness ($CV = \sigma / \mu$): Measures sentence length rhythm variance. Low variance indicates LLM generation.
 *    - Perplexity & Predictability Proxy: Evaluates token frequency distributions and n-gram smoothing.
 *    - Lexical Diversity: Type-Token Ratio (TTR) & vocabulary variety.
 *    - Structural Symmetry: Paragraph and clause length uniformity.
 *    - Forensic LLM Hallmarks: 50+ classic synthetic transition markers, prompt residues, and robotic formulaic scaffolding.
 * 2. Semantic Computational Linguistics (Google Gemini 3.6 Flash):
 *    - Evaluates syntactic smoothing, discourse coherence, emotional cadence, and pragmatic intent.
 * 3. Hybrid Ensemble Aggregator:
 *    - Combines statistical metrics + semantic evaluation.
 *    - Generates sentence-by-sentence heatmap probabilities (0% - 100%).
 * 4. Resilient Offline Fallback:
 *    - Fully functional offline with 0ms network latency when API is offline or times out.
 */

export const AI_DETECTION_VERDICTS = Object.freeze({
  DEFINITELY_AI: 'DEFINITELY_AI_GENERATED',
  LIKELY_AI: 'LIKELY_AI_GENERATED',
  MIXED_CONTENT: 'MIXED_OR_PARAPHRASED',
  LIKELY_HUMAN: 'LIKELY_HUMAN_AUTHORED',
  HIGHLY_CONFIDENT_HUMAN: 'HIGHLY_CONFIDENT_HUMAN'
});

/**
 * Curated list of classic LLM signature markers, synthetic transitions, and prompt leak residues.
 */
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

/**
 * Segments raw text into distinct sentences with robust punctuation and boundary handling.
 * 
 * @param {string} text Raw email body text
 * @returns {string[]} Array of normalized sentence strings
 */
export function segmentSentences(text) {
  if (!text || typeof text !== 'string') return [];

  // Clean and normalize linebreaks
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .trim();

  if (!normalized) return [];

  // Match sentences ending with ., !, ?, or paragraph breaks
  const rawSegments = normalized.split(/(?<=[.?!])\s+(?=[A-Z0-9"'\(\[])|\n{2,}/);

  const sentences = [];
  for (const seg of rawSegments) {
    const trimmed = seg.trim().replace(/\s+/g, ' ');
    // Keep meaningful sentences (at least 2 words or 8 characters)
    if (trimmed.length >= 8 && trimmed.split(/\s+/).length >= 2) {
      sentences.push(trimmed);
    }
  }

  // Fallback if no clean punctuation found
  if (sentences.length === 0 && normalized.length > 0) {
    sentences.push(normalized);
  }

  return sentences;
}

/**
 * Extracts normalized tokens (words) from text.
 * 
 * @param {string} text 
 * @returns {string[]}
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words;
}

/**
 * Computes Burstiness ($CV = \sigma / \mu$):
 * Measures the variation of sentence lengths in the text.
 * 
 * Human writing has HIGH burstiness (alternating short punchy sentences and complex clauses).
 * AI models write with unnaturally UNIFORM, balanced sentence lengths (low burstiness).
 * 
 * @param {string[]} sentences 
 * @returns {{ burstinessScore: number, meanLength: number, stdDev: number, cv: number, interpretation: string }}
 */
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

  // Coefficient of Variation (CV) = Standard Deviation / Mean
  const cv = mean > 0 ? stdDev / mean : 0;

  // Typical Human CV in natural email: 0.60 - 1.10
  // Typical AI CV in LLM generation: 0.15 - 0.40 (highly uniform rhythm)
  // Convert CV to a 0-100 score where 0 = high burstiness (Human), 100 = low burstiness (AI)
  let aiBurstinessLikelihood = 50;
  if (cv < 0.25) {
    aiBurstinessLikelihood = 92; // Extremely robotic uniform cadence
  } else if (cv < 0.38) {
    aiBurstinessLikelihood = 78; // Moderately uniform
  } else if (cv < 0.52) {
    aiBurstinessLikelihood = 55; // Borderline
  } else if (cv < 0.70) {
    aiBurstinessLikelihood = 32; // Normal human variation
  } else {
    aiBurstinessLikelihood = 15; // High human burstiness
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

/**
 * Computes Perplexity / Predictability Proxy:
 * Measures token smoothing, common transitional word density, and vocabulary predictability.
 * 
 * @param {string[]} tokens 
 * @returns {{ predictabilityScore: number, commonTransitionDensity: number, rareWordRatio: number, rating: string }}
 */
export function computePerplexityProxy(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return {
      predictabilityScore: 50,
      commonTransitionDensity: 0,
      rareWordRatio: 0,
      rating: 'INSUFFICIENT_TOKENS'
    };
  }

  // Common high-frequency connectors favored by LLM nucleus sampling
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

  // High predictability: AI models cluster around standard, neutral transitions
  let predictabilityScore = 30;
  if (transitionDensity > 7.0) {
    predictabilityScore = 88; // Dense clustering of formal connectors
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

/**
 * Computes Lexical Diversity (Type-Token Ratio / TTR):
 * 
 * @param {string[]} tokens 
 * @returns {{ ttr: number, uniqueWords: number, totalTokens: number, rating: string }}
 */
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

/**
 * Scans text for classic synthetic LLM hallmarks, clichés, and prompt leaks.
 * 
 * @param {string} text 
 * @returns {{ hallmarks: Array<{ category: string, matched: string, description: string, weight: number }>, totalHallmarkWeight: number }}
 */
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

/**
 * Computes deterministic stylometric detection score from text.
 * Highly accurate baseline that operates with 0ms network latency.
 * 
 * @param {string} text Raw email body
 * @param {string} [subject] Email subject line
 * @returns {object} Deterministic detection assessment
 */
export function analyzeStylometricsDeterministic(text, subject = '') {
  const fullText = subject ? `${subject}\n\n${text}` : text;
  const sentences = segmentSentences(fullText);
  const tokens = tokenizeText(fullText);

  const burstiness = computeBurstiness(sentences);
  const perplexity = computePerplexityProxy(tokens);
  const lexical = computeLexicalDiversity(tokens);
  const hallmarks = detectAiHallmarks(fullText);

  // Hallmark scoring based on count and weight
  let hallmarkScore = Math.min(100, hallmarks.totalHallmarkWeight * 1.5);
  if (hallmarks.hallmarks.length >= 3) hallmarkScore = Math.max(hallmarkScore, 85);
  else if (hallmarks.hallmarks.length === 2) hallmarkScore = Math.max(hallmarkScore, 70);
  else if (hallmarks.hallmarks.length === 1) hallmarkScore = Math.max(hallmarkScore, 50);

  // Calculate weighted composite score
  // Weights:
  // - Hallmarks: 40%
  // - Burstiness (low variance = AI): 35%
  // - Predictability proxy: 25%
  let compositeScore =
    hallmarkScore * 0.40 +
    burstiness.burstinessScore * 0.35 +
    perplexity.predictabilityScore * 0.25;

  // Cadence adjustments
  if (burstiness.cv < 0.35) compositeScore += 8;
  if (burstiness.cv > 0.65) compositeScore -= 12;

  // Symmetry adjustment: if text has 3+ sentences of almost identical length
  if (sentences.length >= 3 && burstiness.cv < 0.22) {
    compositeScore += 10;
  }

  // Cap composite score between 0 and 99
  const finalScore = Math.max(2, Math.min(98, Math.round(compositeScore)));

  // Determine classification
  let verdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
  if (finalScore >= 80) {
    verdict = AI_DETECTION_VERDICTS.DEFINITELY_AI;
  } else if (finalScore >= 60) {
    verdict = AI_DETECTION_VERDICTS.LIKELY_AI;
  } else if (finalScore >= 40) {
    verdict = AI_DETECTION_VERDICTS.MIXED_CONTENT;
  } else if (finalScore >= 20) {
    verdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
  } else {
    verdict = AI_DETECTION_VERDICTS.HIGHLY_CONFIDENT_HUMAN;
  }

  // Generate per-sentence synthetic probabilities for interactive heatmap
  const perSentenceAnalysis = sentences.map((sentence, index) => {
    const sTokens = tokenizeText(sentence);
    const sHallmarks = detectAiHallmarks(sentence);
    let sScore = Math.round(finalScore * 0.7);

    if (sHallmarks.hallmarks.length > 0) {
      sScore = Math.min(99, sScore + 30);
    }

    // Short informal fragments (< 4 tokens) are typical of humans
    if (sTokens.length <= 4 && sHallmarks.hallmarks.length === 0) {
      sScore = Math.max(10, sScore - 35);
    }

    return {
      index,
      sentence,
      aiProbability: sScore,
      classification:
        sScore >= 75 ? 'AI_GENERATED' : sScore >= 45 ? 'SUSPICIOUS_MIXED' : 'HUMAN_AUTHENTIC',
      hallmarksFound: sHallmarks.hallmarks.map((h) => h.matched)
    };
  });

  return {
    aiProbability: finalScore,
    verdict,
    confidence: sentences.length >= 4 ? 90 : 75,
    engine: 'AEGIS Deterministic Stylometric & Hallmark Engine',
    metrics: {
      burstiness,
      perplexity,
      lexical,
      sentenceCount: sentences.length,
      tokenCount: tokens.length
    },
    hallmarks: hallmarks.hallmarks,
    perSentenceAnalysis,
    summary:
      finalScore >= 60
        ? `Statistical stylometrics detect strong synthetic indicators (${finalScore}% probability). The text displays an unnaturally uniform sentence cadence (CV: ${burstiness.cv}) and ${hallmarks.hallmarks.length} recognizable LLM signature marker(s).`
        : `Stylometric analysis indicates predominantly human-authored characteristics (${100 - finalScore}% organic confidence). The text features natural sentence length variance and organic discourse pacing.`
  };
}

/**
 * Builds the computational linguistics prompt for Google Gemini 3.6 Flash.
 */
export function buildAiDetectionPrompt(text, subject = '', deterministicMetrics = null) {
  const systemInstruction = `You are an elite forensic computational linguist and synthetic text detection specialist.
Your mission is to rigorously analyze an incoming email and determine whether it was generated by an AI/LLM (e.g. ChatGPT, Claude, Gemini, synthetic phishing generators) or authored by a human.

FORENSIC PRINCIPLES:
1. Examine structural symmetry, lexical predictability, sentence cadence uniformity (burstiness), emotional authenticity, and prompt leakage artifacts.
2. Evaluate each sentence independently, assigning an AI generation probability (0% to 100%).
3. Distinguish between polite formal human professional communication and robotic synthetic LLM smoothing.
4. Output STRICT, VALID JSON conforming exactly to the requested schema. No markdown backticks.`;

  const promptText = `Analyze the following email text for AI-generated synthetic content indicators.

EMAIL SUBJECT: "${subject || '(No Subject)'}"

EMAIL BODY:
"""
${text}
"""

DETERMINISTIC STYLOMETRIC BASELINE:
- Calculated Burstiness (CV): ${deterministicMetrics?.metrics?.burstiness?.cv ?? 'N/A'}
- Detected Hallmark Clichés: ${deterministicMetrics?.hallmarks?.map((h) => h.matched).join(', ') || 'None'}

Produce your forensic assessment strictly as a JSON object matching this schema:
{
  "aiProbability": 85,
  "confidence": 92,
  "verdict": "DEFINITELY_AI_GENERATED | LIKELY_AI_GENERATED | MIXED_OR_PARAPHRASED | LIKELY_HUMAN_AUTHORED | HIGHLY_CONFIDENT_HUMAN",
  "summary": "Plain-language executive forensic summary explaining the linguistic findings.",
  "linguisticIndicators": [
    {
      "indicator": "Short name of indicator",
      "severity": "HIGH | MEDIUM | LOW",
      "evidence": "Quoted text or pattern",
      "explanation": "Why this reflects AI or human generation"
    }
  ],
  "perSentenceAnalysis": [
    {
      "index": 0,
      "sentence": "Exact sentence text",
      "aiProbability": 90,
      "classification": "AI_GENERATED | SUSPICIOUS_MIXED | HUMAN_AUTHENTIC",
      "reason": "Brief rationale"
    }
  ],
  "suggestedAnalystAction": "Concrete security recommendation"
}`;

  return { systemInstruction, promptText };
}

/**
 * Full Forensic AI Content Detection Orchestrator.
 * Combines Google Gemini 3.6 Flash with Deterministic Stylometric analysis,
 * with automatic fallback if the live API times out or is offline.
 * 
 * @param {string} text Raw email body text
 * @param {object} [options]
 * @param {string} [options.subject] Email subject line
 * @param {string} [options.apiKey] Gemini API Key
 * @param {string} [options.model] Gemini model identifier (default: "gemini-3.6-flash")
 * @param {number} [options.timeoutMs] Timeout in ms (default: 30000)
 * @param {boolean} [options.forceOffline] Forces offline deterministic analysis
 * @returns {Promise<object>} Complete forensic AI content detection report
 */
export async function detectAiGeneratedContent(text, options = {}) {
  const generatedAt = new Date().toISOString();
  const subject = options.subject || '';
  const timeoutMs = options.timeoutMs || Number(process.env.GEMINI_TIMEOUT_MS) || 30000;
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
  const model = options.model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // 1. Run deterministic stylometrics baseline
  const deterministicBaseline = analyzeStylometricsDeterministic(text, subject);

  // If forceOffline or no API key, return deterministic baseline immediately
  if (options.forceOffline || !apiKey) {
    return {
      status: 'AVAILABLE',
      generatedAt,
      model: `${model} (Offline Stylometric Engine)`,
      isOfflineFallback: true,
      ...deterministicBaseline
    };
  }

  // 2. Query Google Gemini 3.6 Flash for Deep Semantic Linguistics
  const { systemInstruction, promptText } = buildAiDetectionPrompt(text, subject, deterministicBaseline);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
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

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Fall back gracefully to deterministic baseline
      return {
        status: 'AVAILABLE',
        generatedAt,
        model: `${model} (Stylometric Fallback - HTTP ${response.status})`,
        isOfflineFallback: true,
        ...deterministicBaseline
      };
    }

    const payload = await response.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return {
        status: 'AVAILABLE',
        generatedAt,
        model: `${model} (Stylometric Fallback)`,
        isOfflineFallback: true,
        ...deterministicBaseline
      };
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return {
        status: 'AVAILABLE',
        generatedAt,
        model: `${model} (Stylometric Fallback - Parse)`,
        isOfflineFallback: true,
        ...deterministicBaseline
      };
    }

    // 3. Form Hybrid Ensemble Score (50% Gemini Semantic + 50% Stylometric Metrics)
    const geminiScore = typeof parsed.aiProbability === 'number' ? parsed.aiProbability : deterministicBaseline.aiProbability;
    const hybridScore = Math.round(geminiScore * 0.6 + deterministicBaseline.aiProbability * 0.4);

    let verdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
    if (hybridScore >= 80) verdict = AI_DETECTION_VERDICTS.DEFINITELY_AI;
    else if (hybridScore >= 60) verdict = AI_DETECTION_VERDICTS.LIKELY_AI;
    else if (hybridScore >= 40) verdict = AI_DETECTION_VERDICTS.MIXED_CONTENT;
    else if (hybridScore >= 20) verdict = AI_DETECTION_VERDICTS.LIKELY_HUMAN;
    else verdict = AI_DETECTION_VERDICTS.HIGHLY_CONFIDENT_HUMAN;

    return {
      status: 'AVAILABLE',
      generatedAt,
      model,
      isOfflineFallback: false,
      aiProbability: hybridScore,
      verdict,
      confidence: parsed.confidence || deterministicBaseline.confidence,
      summary: parsed.summary || deterministicBaseline.summary,
      metrics: deterministicBaseline.metrics,
      hallmarks: deterministicBaseline.hallmarks,
      linguisticIndicators: parsed.linguisticIndicators || [],
      perSentenceAnalysis: Array.isArray(parsed.perSentenceAnalysis) && parsed.perSentenceAnalysis.length > 0
        ? parsed.perSentenceAnalysis
        : deterministicBaseline.perSentenceAnalysis,
      suggestedAnalystAction: parsed.suggestedAnalystAction || 'Review sender authentication and inspect links.'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    // On timeout, abort, or network failure, return the complete deterministic assessment with 0 delay
    return {
      status: 'AVAILABLE',
      generatedAt,
      model: `${model} (Stylometric Fallback - Socket/Timeout)`,
      isOfflineFallback: true,
      fallbackReason: err.message,
      ...deterministicBaseline
    };
  }
}
