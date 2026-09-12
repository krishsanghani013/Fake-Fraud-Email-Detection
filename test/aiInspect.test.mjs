import assert from 'node:assert/strict';
import {
  inspectEmailDeterministic,
  inspectEmail,
  extractTextAnnotations,
  buildUnifiedEvidenceChain,
  parseGeminiJsonResponse,
  normalizeInspectionResult
} from '../src/lib/aiInspect.js';
import { POST as aiInspectRoute } from '../src/app/api/ai-inspect/route.js';

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

async function runAll() {
  console.log('====================================================');
  console.log('STARTING AI INSPECT FORENSIC ENGINE TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Account-Security Alert Impersonation Detection
  await runTest('TEST 1: Account-Security Alert Impersonation', () => {
    const raw = 'Subject: Security alert: Unusual sign-in attempt detected from unrecognized device in Russia.';
    const result = inspectEmailDeterministic(raw);

    assert.equal(result.classification, 'suspicious');
    assert.ok(result.indicators.some((i) => i.type === 'Account-Security Impersonation'));
    const ind = result.indicators.find((i) => i.type === 'Account-Security Impersonation');
    assert.equal(ind.severity, 'high');
    assert.ok(ind.evidence.length > 0);
    assert.ok(ind.confidence >= 85);
  });

  // TEST 2: Social Engineering & Fear Tactics Detection
  await runTest('TEST 2: Social Engineering & Fear Tactics', () => {
    const raw = 'Your account will be suspended permanently within 24 hours. Immediate action required.';
    const result = inspectEmailDeterministic(raw);

    assert.ok(result.indicators.some((i) => i.type === 'Social Engineering & Fear Tactics'));
    const ind = result.indicators.find((i) => i.type === 'Social Engineering & Fear Tactics');
    assert.equal(ind.severity, 'high');
    assert.ok(result.urgencyIndex >= 30);
  });

  // TEST 3: Potential Credential Harvesting Detection
  await runTest('TEST 3: Potential Credential Harvesting', () => {
    const raw = 'Click here to verify your account credentials now: https://login-portal.auth-check.xyz';
    const result = inspectEmailDeterministic(raw);

    assert.ok(result.indicators.some((i) => i.type === 'Potential Credential Harvesting'));
    const ind = result.indicators.find((i) => i.type === 'Potential Credential Harvesting');
    assert.equal(ind.severity, 'critical');
  });

  // TEST 4: External / Suspicious Verification URL Detection
  await runTest('TEST 4: External / Suspicious Verification URL', () => {
    const raw = 'Unusual sign-in alert. Verify here: https://paypal-security-update.fake/verify-my-account';
    const result = inspectEmailDeterministic(raw);

    assert.ok(result.indicators.some((i) => i.type === 'External Verification URL'));
    const ind = result.indicators.find((i) => i.type === 'External Verification URL');
    assert.equal(ind.severity, 'high');
    assert.equal(ind.evidence, 'https://paypal-security-update.fake/verify-my-account');
  });

  // TEST 5: Potential Brand Impersonation Detection
  await runTest('TEST 5: Potential Brand Impersonation', () => {
    const raw = 'From: Apple Security <service@external-mailer.com>\nSubject: Apple account security alert\nVerify account: https://apple-id-login.xyz';
    const result = inspectEmailDeterministic(raw);

    assert.ok(result.indicators.some((i) => i.type === 'Potential Brand Impersonation'));
    const ind = result.indicators.find((i) => i.type === 'Potential Brand Impersonation');
    assert.equal(ind.severity, 'high');
    assert.match(ind.description, /Apple/i);
  });

  // TEST 6: Financial Fraud & Wire Redirection (BEC)
  await runTest('TEST 6: Financial Fraud & Wire Redirection', () => {
    const raw = 'Please transfer $480,000 USD via wire transfer to our designated offshore escrow account before 2:00 PM today. Urgent invoice #9812.';
    const result = inspectEmailDeterministic(raw);

    assert.equal(result.classification, 'fraudulent');
    assert.equal(result.riskLevel, 'critical');
    assert.ok(result.riskScore >= 75);
    assert.ok(result.indicators.some((i) => i.type === 'Financial Manipulation & Wire Fraud'));
  });

  // TEST 7: Authority Impersonation Detection
  await runTest('TEST 7: Authority Impersonation', () => {
    const raw = 'From: Tim Cook <ceo-office@sec-apple-verify.com>\nI am the Chief Executive Officer. Transfer $100,000 wire transfer immediately.';
    const result = inspectEmailDeterministic(raw);

    assert.ok(result.indicators.some((i) => i.type === 'Authority Impersonation'));
    assert.equal(result.primaryThreatVector, 'Executive Impersonation (BEC)');
  });

  // TEST 8: Clean Routine Email
  await runTest('TEST 8: Clean Routine Email', () => {
    const raw = 'From: news@digest.org\nTo: team@corp.com\nSubject: Weekly Design System Update\n\nHello team, here is the weekly recap of component updates. Have a great day!';
    const result = inspectEmailDeterministic(raw);

    assert.equal(result.classification, 'legitimate');
    assert.equal(result.riskLevel, 'low');
    assert.ok(result.riskScore <= 20);
    assert.equal(result.indicators.length, 0);
  });

  // TEST 9: Text Annotation Extraction
  await runTest('TEST 9: Text Annotation Extraction', () => {
    const raw = 'Transfer $480,000 USD immediately before 2:00 PM today. Click here to verify your account.';
    const indicators = [
      { evidence: 'Transfer $480,000 USD', severity: 'critical', type: 'Financial Fraud' }
    ];

    const annotations = extractTextAnnotations(raw, indicators);
    assert.ok(annotations.length >= 2);
    assert.ok(annotations.some((a) => a.type === 'payment'));
    assert.ok(annotations.some((a) => a.type === 'urgency'));
  });

  // TEST 10: Unified Evidence Chain & Budget Meters
  await runTest('TEST 10: Unified Evidence Chain & Budget Meters', () => {
    const raw = 'Transfer $480,000 USD via wire transfer immediately.';
    const aiResult = inspectEmailDeterministic(raw);

    const canonicalData = {
      risk: {
        totalScore: 80,
        level: 'CRITICAL',
        contributions: [
          { category: 'authentication', points: 20, finding: 'DMARC failed' },
          { category: 'identity', points: 15, finding: 'From vs Reply-To mismatch' },
          { category: 'threatIntel', points: 30, finding: 'Malicious domain hit' }
        ]
      }
    };

    const chain = buildUnifiedEvidenceChain(aiResult, canonicalData);
    assert.equal(chain.steps.length, 6);
    assert.equal(chain.categoryScores.aiContent.max, 30);
    assert.equal(chain.categoryScores.threatIntel.max, 30);
    assert.equal(chain.categoryScores.authentication.max, 25);
    assert.equal(chain.categoryScores.senderIdentity.max, 15);
    assert.ok(chain.categoryScores.authentication.score <= 25);
    assert.ok(chain.categoryScores.senderIdentity.score <= 15);
    assert.ok(chain.evidenceList.length > 0);
  });

  // TEST 11: JSON Parser resilience with code fences
  await runTest('TEST 11: JSON Parser resilience with code fences', () => {
    const jsonStr = '```json\n{\n  "classification": "fraudulent",\n  "riskLevel": "critical",\n  "riskScore": 90,\n  "confidence": 95\n}\n```';
    const parsed = parseGeminiJsonResponse(jsonStr);
    assert.equal(parsed.classification, 'fraudulent');
    assert.equal(parsed.riskScore, 90);
  });

  // TEST 12: POST /api/ai-inspect input validation
  await runTest('TEST 12: POST /api/ai-inspect input validation', async () => {
    const emptyReq = new Request('http://localhost:3000/api/ai-inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const res = await aiInspectRoute(emptyReq);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // TEST 13: POST /api/ai-inspect with valid emailText
  await runTest('TEST 13: POST /api/ai-inspect with valid emailText', async () => {
    const validReq = new Request('http://localhost:3000/api/ai-inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailText: 'From: tim.cook@corp.com\nSubject: URGENT: Wire Transfer $50,000 to escrow account immediately.'
      })
    });
    const res = await aiInspectRoute(validReq);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.riskScore > 50);
    assert.ok(Array.isArray(body.data.indicators));
    assert.ok(Array.isArray(body.data.textAnnotations));
    assert.ok(body.data.evidenceChain);
  });

  // TEST 14: POST /api/ai-inspect with canonical emailData
  await runTest('TEST 14: POST /api/ai-inspect with canonical emailData', async () => {
    const canonicalReq = new Request('http://localhost:3000/api/ai-inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailData: {
          metadata: {
            from: 'service@paypal-security.com',
            subject: 'Security Alert: Verify your account immediately'
          },
          body: {
            text: 'Click here to verify your account credentials: https://paypal-phish.xyz'
          }
        }
      })
    });
    const res = await aiInspectRoute(canonicalReq);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.indicators.length > 0);
  });

  console.log('\n====================================================');
  console.log(`TOTAL AI INSPECT TESTS: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll();
