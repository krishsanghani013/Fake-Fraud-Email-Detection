import assert from 'node:assert/strict';
import {
  segmentSentences,
  tokenizeText,
  computeBurstiness,
  computePerplexityProxy,
  computeLexicalDiversity,
  detectAiHallmarks,
  analyzeThreatDeterministic,
  resolveQuadMatrixVerdict,
  analyzeStylometricsDeterministic,
  detectAiGeneratedContent,
  AI_DETECTION_VERDICTS,
  THREAT_VERDICTS,
  THREAT_CATEGORIES,
  QUAD_MATRIX_VERDICTS
} from '../src/lib/aiContentDetection.js';

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('====================================================');
console.log('STARTING DUAL-MATRIX AI & THREAT DETECTION TEST SUITE');
console.log('====================================================\n');

// 1. Sentence Segmentation
await runTest('TEST 1: Sentence Segmentation with varied punctuation and linebreaks', () => {
  const text = 'Hello there! This is sentence two. Is this sentence three? Yes, it is.';
  const sentences = segmentSentences(text);
  assert.equal(sentences.length, 4);
  assert.equal(sentences[0], 'Hello there!');
  assert.equal(sentences[1], 'This is sentence two.');
  assert.equal(sentences[2], 'Is this sentence three?');
  assert.equal(sentences[3], 'Yes, it is.');
});

// 2. Tokenization
await runTest('TEST 2: Tokenization and normalization', () => {
  const text = 'Hello, WORLD! This is a test-tokenized phrase.';
  const tokens = tokenizeText(text);
  assert.deepEqual(tokens, ['hello', 'world', 'this', 'is', 'a', 'test-tokenized', 'phrase']);
});

// 3. Burstiness: Low CV for Uniform AI Cadence
await runTest('TEST 3: Burstiness computation detects uniform AI rhythm (Low CV)', () => {
  const uniformSentences = [
    'Our company offers a very comprehensive and modern digital solution today.',
    'You can easily verify your account by clicking the secure link.',
    'Please contact our customer support team if you have any questions.',
    'We always ensure that your personal information remains safe and protected.'
  ];
  const burstiness = computeBurstiness(uniformSentences);
  assert.ok(burstiness.cv < 0.35, `Expected CV < 0.35, got ${burstiness.cv}`);
  assert.ok(burstiness.burstinessScore >= 75, `Expected high AI burstiness score, got ${burstiness.burstinessScore}`);
});

// 4. Burstiness: High CV for Organic Human Writing
await runTest('TEST 4: Burstiness computation detects organic human rhythm (High CV)', () => {
  const humanSentences = [
    'Hey Dave.',
    'Quick ping on the slides for tomorrow morning because Mark asked if we can review them before the 10am meeting with the executive board.',
    'Done?',
    'Call me later.'
  ];
  const burstiness = computeBurstiness(humanSentences);
  assert.ok(burstiness.cv > 0.65, `Expected CV > 0.65 for human burstiness, got ${burstiness.cv}`);
  assert.ok(burstiness.burstinessScore <= 35, `Expected low AI score for human burstiness, got ${burstiness.burstinessScore}`);
});

// 5. Predictability / Perplexity Proxy
await runTest('TEST 5: Perplexity proxy flags dense transitional smoothing', () => {
  const text = 'Furthermore, it is crucial to ensure that we additionally optimize the comprehensive verification process.';
  const tokens = tokenizeText(text);
  const perplexity = computePerplexityProxy(tokens);
  assert.ok(perplexity.predictabilityScore >= 70, `Expected high predictability score, got ${perplexity.predictabilityScore}`);
});

// 6. Lexical Diversity (TTR)
await runTest('TEST 6: Lexical diversity Type-Token Ratio computation', () => {
  const diverseTokens = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
  const res = computeLexicalDiversity(diverseTokens);
  assert.equal(res.ttr, 1.0);
  assert.equal(res.uniqueWords, 5);
});

// 7. Hallmark Detection
await runTest('TEST 7: Hallmark matcher flags classic LLM cliché markers', () => {
  const text = 'I hope this email finds you well. As we delve into the tapestry of cloud solutions, it is a testament to our beacon of innovation.';
  const res = detectAiHallmarks(text);
  assert.ok(res.hallmarks.length >= 4, `Expected at least 4 hallmarks, found ${res.hallmarks.length}`);
  const categories = res.hallmarks.map((h) => h.category);
  assert.ok(categories.includes('Formulaic Opener'));
  assert.ok(categories.includes('LLM Vocabulary Signature'));
});

// 8. Prompt Leak Detection
await runTest('TEST 8: Prompt leak and unfilled template placeholder detection', () => {
  const text = 'Dear [Recipient Name], as an AI language model, here is a draft for [Company Name].';
  const res = detectAiHallmarks(text);
  assert.ok(res.hallmarks.some((h) => h.category === 'Prompt Leak'));
  assert.ok(res.hallmarks.some((h) => h.category === 'Unfilled Template Variable'));
  assert.ok(res.totalHallmarkWeight >= 50);
});

// 9. Full Deterministic Dual-Matrix on ChatGPT Spear-Phishing Email (Quadrant 1: AI + Harmful)
await runTest('TEST 9: Quadrant 1: ChatGPT spear-phishing classified as AI-GENERATED & HARMFUL', () => {
  const aiPhish = `I hope this email finds you well.
Please be advised that our automated security system has detected unauthorized access attempts on your account. In today's fast-paced digital landscape, protecting your personal data is of paramount importance to our organization.
To ensure that your services remain uninterrupted, it is crucial that you verify your identity promptly. By following these simple steps, you can secure your account within minutes: click the link below to verify your password immediately.
Furthermore, please do not hesitate to contact our dedicated support team if you require any additional assistance. Rest assured that we are taking every necessary precaution to protect your digital assets.`;

  const result = analyzeStylometricsDeterministic(aiPhish, 'URGENT: Verify Your Account Credentials Immediately');
  assert.ok(result.aiProbability >= 70, `Expected aiProbability >= 70, got ${result.aiProbability}`);
  assert.equal(result.isFake, true, 'Expected isFake to be true');
  assert.equal(result.isHarmful, true, 'Expected isHarmful to be true');
  assert.equal(result.threatVerdict, THREAT_VERDICTS.FRAUDULENT_HARMFUL);
  assert.equal(result.quadMatrixVerdict, QUAD_MATRIX_VERDICTS.AI_GENERATED_HARMFUL);
  assert.ok(result.threatIndicators.length >= 1, 'Expected at least 1 threat indicator');
});

// 10. Full Deterministic Dual-Matrix on Genuine Human Email (Quadrant 4: Human + Legitimate Safe)
await runTest('TEST 10: Quadrant 4: Genuine human workplace email classified as HUMAN-AUTHORED & LEGITIMATE', () => {
  const humanEmail = `Hey Dave,
Just saw your ping. Was stuck in traffic on the way back from client site, sorry!
Did you push the updated slides to the shared drive? Mark needs them by 4pm today for tomorrow's standup. If not no worries, I can grab them from yesterday's thread.
Let me know if you want to hop on a quick 5 min call before EOD!
Thanks,
Dave`;

  const result = analyzeStylometricsDeterministic(humanEmail, 'quick question about meeting notes');
  assert.ok(result.aiProbability <= 35, `Expected aiProbability <= 35, got ${result.aiProbability}`);
  assert.equal(result.isFake, false, 'Expected isFake to be false');
  assert.equal(result.isHarmful, false, 'Expected isHarmful to be false');
  assert.equal(result.isLegitimate, true, 'Expected isLegitimate to be true');
  assert.equal(result.threatVerdict, THREAT_VERDICTS.LEGITIMATE_SAFE);
  assert.equal(result.quadMatrixVerdict, QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_LEGITIMATE);
});

// 11. Quadrant 2: AI-Generated + Legitimate Safe (AI Marketing / Newsletter)
await runTest('TEST 11: Quadrant 2: AI-Generated corporate marketing classified as AI-GENERATED & LEGITIMATE', () => {
  const aiNewsletter = `I hope this message finds you in good health and high spirits.
As we delve deeply into the transformative era of cloud computing, our latest enterprise suite stands as a true testament to our enduring commitment to technological excellence. Our platform serves as a beacon of innovation, seamlessly bridging legacy infrastructure with state-of-the-art agility.
Furthermore, we foster an environment where collaborative synergy thrives across diverse operational ecosystems. To delve into our comprehensive whitepaper and discover how we can optimize your operational workflows, please review the attached documentation.
Do not hesitate to reach out if you have any questions or wish to schedule a personalized demonstration.
Best regards,
Enterprise Strategy Team`;

  const result = analyzeStylometricsDeterministic(aiNewsletter, 'Transforming Your Digital Enterprise with Next-Gen Intelligence');
  assert.ok(result.aiProbability >= 60, `Expected high AI probability, got ${result.aiProbability}`);
  assert.equal(result.isFake, false, 'Expected isFake to be false (no deception/impersonation)');
  assert.equal(result.isHarmful, false, 'Expected isHarmful to be false (no credential harvesting/malware)');
  assert.equal(result.isLegitimate, true, 'Expected isLegitimate to be true');
  assert.equal(result.threatVerdict, THREAT_VERDICTS.LEGITIMATE_SAFE);
  assert.equal(result.quadMatrixVerdict, QUAD_MATRIX_VERDICTS.AI_GENERATED_LEGITIMATE);
});

// 12. Quadrant 3: Human-Authored + Harmful Fraud (CEO Wire Transfer Scam)
await runTest('TEST 12: Quadrant 3: Human-crafted CEO wire scam classified as HUMAN-AUTHORED & HARMFUL FRAUD', () => {
  const humanWireScam = `Hey,
I am in a confidential board meeting right now and cannot take phone calls. I need you to process an urgent wire transfer of $48,500 to a new vendor for our acquisition closing today.
Please update payment instructions with the bank routing details I will send over shortly. Wire the funds immediately so the contract doesn't fall through. Do not inform anyone else on the finance team yet as this is strictly confidential.
Let me know as soon as you are at your desk so I can send the bank account details.
Thanks,
Mark`;

  const result = analyzeStylometricsDeterministic(humanWireScam, 'Urgent Wire Transfer Needed Before 3pm Today');
  assert.ok(result.aiProbability <= 45, `Expected low-to-moderate AI probability for human scam, got ${result.aiProbability}`);
  assert.equal(result.isFake, true, 'Expected isFake to be true');
  assert.equal(result.isHarmful, true, 'Expected isHarmful to be true');
  assert.equal(result.threatVerdict, THREAT_VERDICTS.FRAUDULENT_HARMFUL);
  assert.equal(result.quadMatrixVerdict, QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_HARMFUL);
  assert.equal(result.threatCategory, THREAT_CATEGORIES.FINANCIAL_FRAUD);
});

// 13. Threat Heuristic: Credential Harvesting Cues
await runTest('TEST 13: analyzeThreatDeterministic flags credential phishing trap', () => {
  const text = 'Your account has been locked. Click the link below to verify your password immediately.';
  const threat = analyzeThreatDeterministic(text);
  assert.equal(threat.isFake, true);
  assert.equal(threat.isHarmful, true);
  assert.equal(threat.threatCategory, THREAT_CATEGORIES.CREDENTIAL_PHISHING);
  assert.ok(threat.threatScore >= 35);
});

// 14. Threat Heuristic: Financial Wire Scams
await runTest('TEST 14: analyzeThreatDeterministic flags bank routing and wire transfer lures', () => {
  const text = 'Please process an urgent wire transfer to update payment instructions with the new bank routing number.';
  const threat = analyzeThreatDeterministic(text);
  assert.equal(threat.isFake, true);
  assert.equal(threat.isHarmful, true);
  assert.equal(threat.threatCategory, THREAT_CATEGORIES.FINANCIAL_FRAUD);
});

// 15. Threat Heuristic: Benign Counter-Weight
await runTest('TEST 15: Benign workplace patterns mitigate threat score on clean emails', () => {
  const text = 'Attached is the presentation for our sprint standup. Let us hop on a call tomorrow morning to review the pull request.\nThanks,\nSarah';
  const threat = analyzeThreatDeterministic(text);
  assert.equal(threat.threatScore, 0);
  assert.equal(threat.isFake, false);
  assert.equal(threat.isHarmful, false);
  assert.equal(threat.isLegitimate, true);
  assert.equal(threat.threatVerdict, THREAT_VERDICTS.LEGITIMATE_SAFE);
});

// 16. Quad-Matrix Verdict Resolution Utility
await runTest('TEST 16: resolveQuadMatrixVerdict properly maps all 4 quadrants', () => {
  assert.equal(resolveQuadMatrixVerdict(85, 90), QUAD_MATRIX_VERDICTS.AI_GENERATED_HARMFUL);
  assert.equal(resolveQuadMatrixVerdict(80, 10), QUAD_MATRIX_VERDICTS.AI_GENERATED_LEGITIMATE);
  assert.equal(resolveQuadMatrixVerdict(20, 85), QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_HARMFUL);
  assert.equal(resolveQuadMatrixVerdict(15, 10), QUAD_MATRIX_VERDICTS.HUMAN_AUTHORED_LEGITIMATE);
  assert.equal(resolveQuadMatrixVerdict(55, 40), QUAD_MATRIX_VERDICTS.SUSPICIOUS_ANOMALY);
});

// 17. Orchestrator with Offline Fallback
await runTest('TEST 17: detectAiGeneratedContent offline fallback returns full dual-matrix report', async () => {
  const text = 'I hope this email finds you well. Please be advised that we must delve into these issues.';
  const res = await detectAiGeneratedContent(text, { forceOffline: true });
  assert.equal(res.status, 'AVAILABLE');
  assert.equal(res.isOfflineFallback, true);
  assert.ok(typeof res.aiProbability === 'number');
  assert.ok(typeof res.threatScore === 'number');
  assert.ok(typeof res.isFake === 'boolean');
  assert.ok(typeof res.isHarmful === 'boolean');
  assert.ok(typeof res.isLegitimate === 'boolean');
  assert.ok(res.quadMatrixVerdict);
  assert.ok(Array.isArray(res.perSentenceAnalysis));
});

// 18. Per-Sentence Heatmap with Deception Annotations
await runTest('TEST 18: Per-sentence heatmap contains both AI probability and deceptive annotations', () => {
  const text = 'I hope this email finds you well. Click here to verify your password immediately. Furthermore, delve into the details.';
  const result = analyzeStylometricsDeterministic(text);
  assert.equal(result.perSentenceAnalysis.length, 3);
  
  // Sentence 2 should be flagged as deceptive
  const deceptiveSentence = result.perSentenceAnalysis[1];
  assert.equal(deceptiveSentence.isDeceptive, true);
  assert.ok(deceptiveSentence.deceptiveIndicators.length > 0);
});

// 19. Backwards-compatibility of result properties
await runTest('TEST 19: Result preserves verdict alias and metrics for full backward compatibility', () => {
  const text = 'Hey team, quick update on the roadmap.';
  const result = analyzeStylometricsDeterministic(text);
  assert.ok(result.verdict);
  assert.equal(result.verdict, result.authorshipVerdict);
  assert.ok(result.metrics.burstiness);
  assert.ok(result.metrics.perplexity);
  assert.ok(result.metrics.lexical);
});

console.log('\n====================================================');
console.log(`TOTAL DUAL-MATRIX FORENSIC TESTS: ${passed}/${passed + failed} PASSED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
