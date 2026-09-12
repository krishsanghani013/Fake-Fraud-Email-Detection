import assert from 'node:assert/strict';
import {
  segmentSentences,
  tokenizeText,
  computeBurstiness,
  computePerplexityProxy,
  computeLexicalDiversity,
  detectAiHallmarks,
  analyzeStylometricsDeterministic,
  detectAiGeneratedContent,
  AI_DETECTION_VERDICTS
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
console.log('STARTING AI CONTENT DETECTION TEST SUITE (PHASE 9)');
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
  // Uniform sentence lengths (10 words each)
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
  // Mix of short punchy phrases and long compound thoughts
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

// 9. Full Deterministic Stylometrics on ChatGPT Spear-Phishing Email
await runTest('TEST 9: Full deterministic scan flags ChatGPT phishing email as AI_GENERATED', () => {
  const aiPhish = `I hope this email finds you well.
Please be advised that our automated security system has detected unauthorized access attempts on your account. In today's fast-paced digital landscape, protecting your personal data is of paramount importance to our organization.
To ensure that your services remain uninterrupted, it is crucial that you verify your identity promptly. By following these simple steps, you can secure your account within minutes.
Furthermore, please do not hesitate to contact our dedicated support team if you require any additional assistance. Rest assured that we are taking every necessary precaution to protect your digital assets.`;

  const result = analyzeStylometricsDeterministic(aiPhish, 'URGENT: Verify Your Account Credentials Immediately');
  assert.ok(result.aiProbability >= 70, `Expected aiProbability >= 70, got ${result.aiProbability}`);
  assert.ok(
    result.verdict === AI_DETECTION_VERDICTS.DEFINITELY_AI ||
    result.verdict === AI_DETECTION_VERDICTS.LIKELY_AI,
    `Expected AI verdict, got ${result.verdict}`
  );
  assert.ok(result.perSentenceAnalysis.length >= 4);
  assert.ok(result.hallmarks.length >= 3);
});

// 10. Full Deterministic Stylometrics on Genuine Human Email
await runTest('TEST 10: Full deterministic scan classifies genuine human email as HUMAN_AUTHORED', () => {
  const humanEmail = `Hey Dave,
Just saw your ping. Was stuck in traffic on the way back from client site, sorry!
Did you push the updated slides to the shared drive? Mark needs them by 4pm today for tomorrow's standup. If not no worries, I can grab them from yesterday's thread.
Let me know if you want to hop on a quick 5 min call before EOD!
Dave`;

  const result = analyzeStylometricsDeterministic(humanEmail, 'quick question about meeting notes');
  assert.ok(result.aiProbability <= 35, `Expected aiProbability <= 35, got ${result.aiProbability}`);
  assert.ok(
    result.verdict === AI_DETECTION_VERDICTS.LIKELY_HUMAN ||
    result.verdict === AI_DETECTION_VERDICTS.HIGHLY_CONFIDENT_HUMAN,
    `Expected Human verdict, got ${result.verdict}`
  );
});

// 11. Orchestrator with Offline Fallback
await runTest('TEST 11: detectAiGeneratedContent offline fallback returns complete report with 0ms latency', async () => {
  const text = 'I hope this email finds you well. Please be advised that we must delve into these issues.';
  const res = await detectAiGeneratedContent(text, { forceOffline: true });
  assert.equal(res.status, 'AVAILABLE');
  assert.equal(res.isOfflineFallback, true);
  assert.ok(res.aiProbability > 0);
  assert.ok(Array.isArray(res.perSentenceAnalysis));
  assert.ok(res.metrics.burstiness);
});

// 12. Sentence Heatmap Annotations
await runTest('TEST 12: Per-sentence heatmap contains probability and classifications', () => {
  const text = 'I hope this email finds you well. Here is a note. Furthermore, delve into the details.';
  const result = analyzeStylometricsDeterministic(text);
  assert.equal(result.perSentenceAnalysis.length, 3);
  for (const s of result.perSentenceAnalysis) {
    assert.equal(typeof s.index, 'number');
    assert.equal(typeof s.aiProbability, 'number');
    assert.ok(['AI_GENERATED', 'SUSPICIOUS_MIXED', 'HUMAN_AUTHENTIC'].includes(s.classification));
  }
});

console.log('\n====================================================');
console.log(`TOTAL AI CONTENT DETECTION TESTS: ${passed}/${passed + failed} PASSED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
