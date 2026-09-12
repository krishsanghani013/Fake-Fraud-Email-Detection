// Comprehensive verification of dynamic Supabase persistence and UI retrieval flow
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 404) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return await fetch(url, options);
}

async function run() {
  console.log('--- 1. Testing Dynamic User Email Submission to Supabase ---');
  
  const timestamp = Date.now();
  const dynamicSender = `urgent-support-${timestamp}@security-paypal-verify.com`;
  const dynamicSubject = `[URGENT] Security Action Required - Account Verification #${timestamp}`;
  const dynamicBody = `Dear customer,\n\nWe detected unauthorized login attempts to your account at ${new Date().toISOString()}.\nPlease click http://login.security-paypal-verify.com/login?token=${timestamp} immediately to verify your identity.\n\nFailure to verify will result in immediate suspension.\n\nSecurity Operations Center`;
  const dynamicRiskScore = 92;
  const dynamicClassification = 'CRITICAL';
  const dynamicExplanation = `Dynamic user submitted email with urgent spoofed PayPal impersonation, domain ${dynamicSender.split('@')[1]}, and credential harvesting hyperlink.`;

  // POST dynamic email
  const postRes = await fetchWithRetry(`${BASE_URL}/api/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: dynamicSender,
      subject: dynamicSubject,
      body: dynamicBody,
      riskScore: dynamicRiskScore,
      classification: dynamicClassification,
      explanation: dynamicExplanation
    })
  });

  const postText = await postRes.text();
  console.log('POST /api/emails status:', postRes.status);
  let postJson;
  try {
    postJson = JSON.parse(postText);
  } catch (e) {
    console.error('Failed to parse POST JSON. Raw body:', postText.slice(0, 500));
    throw e;
  }

  assert.strictEqual(postRes.status, 201, 'Expected HTTP 201 Created');
  assert.ok(postJson.success, 'Expected success: true');
  assert.ok(postJson.data?.id, 'Expected Supabase UUID');
  
  const createdId = postJson.data.id;
  console.log(`✓ Email successfully saved in Supabase database with ID: ${createdId}`);

  console.log('\n--- 2. Testing Dynamic Supabase Listing via GET /api/emails ---');
  const getRes = await fetch(`${BASE_URL}/api/emails`);
  const getJson = await getRes.json();
  
  console.log('GET /api/emails status:', getRes.status);
  console.log('Total emails in Supabase:', getJson.count);
  assert.strictEqual(getRes.status, 200, 'Expected HTTP 200 OK');
  assert.ok(Array.isArray(getJson.emails), 'Expected emails array');

  const found = getJson.emails.find(e => e.id === createdId);
  assert.ok(found, `Expected to find created email ${createdId} in Supabase listing`);
  assert.strictEqual(found.sender, dynamicSender, 'Sender must match dynamic input');
  assert.strictEqual(found.subject, dynamicSubject, 'Subject must match dynamic input');
  assert.strictEqual(found.riskScore, dynamicRiskScore, 'Risk score must match dynamic input');
  assert.strictEqual(found.classification, dynamicClassification, 'Classification must match');
  console.log(`✓ Confirmed dynamic email is returned in Supabase listing!`);

  console.log('\n--- 3. Testing Single Dynamic Email Retrieval via GET /api/emails/[id] ---');
  const singleRes = await fetch(`${BASE_URL}/api/emails/${createdId}`);
  const singleJson = await singleRes.json();

  console.log(`GET /api/emails/${createdId} status:`, singleRes.status);
  assert.strictEqual(singleRes.status, 200, 'Expected HTTP 200 OK');
  assert.ok(singleJson.success, 'Expected success: true');
  assert.strictEqual(singleJson.email.id, createdId);
  assert.strictEqual(singleJson.email.sender, dynamicSender);
  assert.strictEqual(singleJson.email.subject, dynamicSubject);
  assert.strictEqual(singleJson.email.body, dynamicBody);
  assert.strictEqual(singleJson.email.analysisResults[0]?.riskScore, dynamicRiskScore);
  assert.strictEqual(singleJson.email.analysisResults[0]?.classification, dynamicClassification);
  assert.strictEqual(singleJson.email.analysisResults[0]?.explanation, dynamicExplanation);
  console.log(`✓ Confirmed single dynamic record fetches directly from Supabase!`);

  console.log('\n--- 4. Testing Next.js Pages Rendering (/dashboard, /cases, /results/[id]) ---');
  const dashboardRes = await fetch(`${BASE_URL}/dashboard`);
  console.log('/dashboard status:', dashboardRes.status);
  assert.strictEqual(dashboardRes.status, 200, 'Dashboard must render with HTTP 200');

  const casesRes = await fetch(`${BASE_URL}/cases`);
  console.log('/cases status:', casesRes.status);
  assert.strictEqual(casesRes.status, 200, 'Cases must render with HTTP 200');

  const resultsRes = await fetch(`${BASE_URL}/results/${createdId}`);
  console.log(`/results/${createdId} status:`, resultsRes.status);
  assert.strictEqual(resultsRes.status, 200, 'Results page must render with HTTP 200 for Supabase UUID');

  console.log('\n============================================================');
  console.log(' ALL TESTS PASSED: SUPABASE DYNAMIC PERSISTENCE VERIFIED! ');
  console.log('============================================================');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
