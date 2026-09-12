// Verification script: Every ingestion path automatically stores in Supabase
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
  const ts = Date.now();
  console.log(`\n=== VERIFYING AUTOMATIC SUPABASE PERSISTENCE ACROSS ALL PATHS [Run: ${ts}] ===\n`);

  // 1. Test /api/parse-eml auto-persistence
  console.log('1. Testing /api/parse-eml auto-persistence to Supabase...');
  const emlRaw = `From: auto-parse-${ts}@security-notice.org
To: victim@company.com
Subject: [AUTO-PARSE-${ts}] Security Alert
Date: Sat, 12 Sep 2026 18:00:00 +0000
Content-Type: text/plain; charset=UTF-8

This is an automated security test message. Please verify your credentials immediately.`;

  const parseRes = await fetchWithRetry(`${BASE_URL}/api/parse-eml`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emlContent: emlRaw })
  });

  const parseJson = await parseRes.json();
  console.log('  /api/parse-eml response status:', parseRes.status);
  assert.strictEqual(parseRes.status, 200, 'Expected 200 from /api/parse-eml');
  assert.ok(parseJson.savedRecord?.id, 'Expected savedRecord.id from Supabase');
  console.log(`  ✓ Auto-saved via /api/parse-eml to Supabase with ID: ${parseJson.savedRecord.id}`);

  // 2. Test /api/detect-ai-content auto-persistence
  console.log('\n2. Testing /api/detect-ai-content auto-persistence to Supabase...');
  const detectRes = await fetchWithRetry(`${BASE_URL}/api/detect-ai-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: `[AUTO-DETECT-${ts}] Transformative Cloud Synergy`,
      text: `In today's fast-paced digital landscape, our platform stands as a testament to operational synergy. Delve deeply into our solutions.`,
      forceOffline: true
    })
  });

  const detectJson = await detectRes.json();
  console.log('  /api/detect-ai-content response status:', detectRes.status);
  assert.strictEqual(detectRes.status, 200, 'Expected 200 from /api/detect-ai-content');
  assert.ok(detectJson.savedRecord?.id, 'Expected savedRecord.id from Supabase');
  console.log(`  ✓ Auto-saved via /api/detect-ai-content to Supabase with ID: ${detectJson.savedRecord.id}`);

  // 3. Test /api/ai-inspect auto-persistence
  console.log('\n3. Testing /api/ai-inspect auto-persistence to Supabase...');
  const inspectRes = await fetchWithRetry(`${BASE_URL}/api/ai-inspect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailText: `From: auto-inspect-${ts}@paypal-security-update.com\nSubject: [AUTO-INSPECT-${ts}] Immediate Account Verification\n\nUrgent action required. Your account will be closed in 24 hours unless you verify.`,
    })
  });

  const inspectJson = await inspectRes.json();
  console.log('  /api/ai-inspect response status:', inspectRes.status);
  assert.strictEqual(inspectRes.status, 200, 'Expected 200 from /api/ai-inspect');
  assert.ok(inspectJson.data?.savedRecord?.id, 'Expected savedRecord.id from Supabase');
  console.log(`  ✓ Auto-saved via /api/ai-inspect to Supabase with ID: ${inspectJson.data.savedRecord.id}`);

  // 4. Test /api/emails direct dynamic creation
  console.log('\n4. Testing /api/emails auto-persistence...');
  const directRes = await fetchWithRetry(`${BASE_URL}/api/emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: `auto-direct-${ts}@finance-alert.com`,
      subject: `[AUTO-DIRECT-${ts}] Invoice Wire Notification`,
      body: `Wire $24,500 before end of day. Confidential instructions attached.`,
      riskScore: 88,
      classification: 'CRITICAL',
      explanation: 'High urgency wire redirection scam'
    })
  });

  const directJson = await directRes.json();
  console.log('  /api/emails response status:', directRes.status);
  assert.strictEqual(directRes.status, 201, 'Expected 201 from /api/emails');
  assert.ok(directJson.data?.id, 'Expected Supabase ID');
  console.log(`  ✓ Auto-saved via /api/emails to Supabase with ID: ${directJson.data.id}`);

  // 5. Query Supabase database via GET /api/emails to confirm all 4 records appear
  console.log('\n5. Querying Supabase database via GET /api/emails...');
  const listRes = await fetchWithRetry(`${BASE_URL}/api/emails`);
  const listJson = await listRes.json();
  console.log('  Total emails in Supabase:', listJson.count);
  assert.strictEqual(listRes.status, 200, 'Expected 200 from /api/emails');

  const parseFound = listJson.emails.some(e => e.id === parseJson.savedRecord.id);
  const detectFound = listJson.emails.some(e => e.id === detectJson.savedRecord.id);
  const inspectFound = listJson.emails.some(e => e.id === inspectJson.data.savedRecord.id);
  const directFound = listJson.emails.some(e => e.id === directJson.data.id);

  assert.ok(parseFound, 'Parse email was stored in Supabase');
  assert.ok(detectFound, 'AI detector email was stored in Supabase');
  assert.ok(inspectFound, 'AI inspect email was stored in Supabase');
  assert.ok(directFound, 'Direct email was stored in Supabase');

  console.log('  ✓ All 4 records verified in Supabase PostgreSQL tables (emails & analysis_results)!');

  console.log('\n============================================================');
  console.log(' ALL TESTS PASSED: EVERYTHING IS AUTOMATICALLY PUT IN SUPABASE! ');
  console.log('============================================================\n');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
