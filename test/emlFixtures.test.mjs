/**
 * Controlled EML Forensic Test Suite
 * 
 * Verifies that all 10 realistic, controlled RFC 5322 / MIME fixtures in test/fixtures/eml/
 * are correctly parsed and analyzed across all forensic layers:
 * 1. RFC 5322 and MIME structure parsing
 * 2. Artifact extraction (URLs, domains, IPs, sender domains)
 * 3. Authentication evidence extraction (SPF, DKIM, DMARC)
 * 4. Sender identity consistency forensics (Reply-To, Return-Path, SPF, DKIM)
 * 5. Header transmission and hop latency reconstruction
 * 6. Deterministic risk engine scoring and categorization
 * 7. POST /api/parse-eml API route integration
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parseRawEmail } from '../src/lib/emailParser.js';
import { POST } from '../src/app/api/parse-eml/route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'eml');

function loadFixture(name) {
  const filePath = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

console.log('====================================================');
console.log('RUNNING CONTROLLED EML FORENSIC TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${testName}`);
    console.error(err);
  }
}

async function runAll() {
  console.log('--- SECTION 1: INDIVIDUAL EML FIXTURE FORENSICS ---');

  // Cache parsed results for comparative tests
  const parsedResults = {};

  // ---------------------------------------------------------------------------
  // FIXTURE 01: Legitimate Baseline
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 01: Legitimate baseline establishes clean low-risk profile', () => {
    const raw = loadFixture('01-legitimate.eml');
    const result = parseRawEmail(raw);
    parsedResults['01'] = result;

    assert.equal(result.success, true, 'Parsing must succeed for legitimate email');
    assert.equal(result.data.metadata.from, 'Alice Smith <alice.smith@company.example>');
    assert.equal(result.data.metadata.subject, 'Controlled Test: Weekly Engineering Sync Notes');
    assert.ok(result.data.metadata.messageId);
    assert.ok(result.data.metadata.date);

    // Body
    assert.ok(result.data.body.text.includes('Here are the brief notes'));
    assert.equal(result.data.body.html, '');

    // Artifacts
    assert.equal(result.data.artifacts.urls.length, 0, 'Baseline email should have no URLs');
    assert.equal(result.data.attachments.length, 0, 'Baseline email should have no attachments');

    // Authentication evidence
    assert.ok(result.data.authentication.spf.results.some((r) => r.result === 'pass'));
    assert.ok(result.data.authentication.dkim.results.some((r) => r.result === 'pass'));
    assert.ok(result.data.authentication.dmarc.results.some((r) => r.result === 'pass'));

    // Sender Identity: clean with zero mismatches
    const identityFindings = result.data.senderIdentity.findings || [];
    assert.equal(identityFindings.length, 0, 'Baseline email should produce zero sender identity mismatches');

    // Transmission: single valid hop
    assert.ok(result.data.transmission.hops.length >= 1);
    assert.equal(result.data.transmission.findings.length, 0, 'Baseline should have zero transmission anomalies');

    // Risk: deterministic score 0, LOW level
    assert.equal(result.data.risk.totalScore, 0);
    assert.equal(result.data.risk.level, 'LOW');
    assert.equal(result.data.risk.contributions.length, 0);
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 02: Suspicious Reply-To Mismatch
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 02: Detects Reply-To domain mismatch against From header', () => {
    const raw = loadFixture('02-suspicious-reply-to.eml');
    const result = parseRawEmail(raw);
    parsedResults['02'] = result;

    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'Example Security Team <security@company.example>');
    assert.equal(result.data.metadata.replyTo[0], 'External Support Team <support@different-example.example>');

    // Sender Identity analysis
    const mismatchFinding = result.data.senderIdentity.findings.find(
      (f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH'
    );
    assert.ok(mismatchFinding, 'Must detect FROM_REPLY_TO_DOMAIN_MISMATCH');
    assert.equal(mismatchFinding.sourceA.domain, 'company.example');
    assert.equal(mismatchFinding.sourceB.domain, 'different-example.example');

    // Risk engine scoring
    const riskContribution = result.data.risk.contributions.find(
      (c) => c.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH'
    );
    assert.ok(riskContribution, 'Risk engine must award points for Reply-To mismatch');
    assert.equal(riskContribution.points, 15);
    assert.equal(result.data.risk.summary.categories.sender_identity, 15);
    assert.ok(result.data.risk.totalScore >= 15);
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 03: Return-Path Mismatch
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 03: Detects Return-Path bounce domain mismatch against From header', () => {
    const raw = loadFixture('03-return-path-mismatch.eml');
    const result = parseRawEmail(raw);
    parsedResults['03'] = result;

    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'Example Billing Department <billing@company.example>');
    assert.equal(result.data.metadata.returnPath, '<bounce@mailer-different.example>');

    // Sender Identity analysis
    const mismatchFinding = result.data.senderIdentity.findings.find(
      (f) => f.id === 'FROM_RETURN_PATH_DOMAIN_MISMATCH'
    );
    assert.ok(mismatchFinding, 'Must detect FROM_RETURN_PATH_DOMAIN_MISMATCH');
    assert.equal(mismatchFinding.sourceA.domain, 'company.example');
    assert.equal(mismatchFinding.sourceB.domain, 'mailer-different.example');

    // Risk engine scoring
    const riskContribution = result.data.risk.contributions.find(
      (c) => c.id === 'FROM_RETURN_PATH_DOMAIN_MISMATCH'
    );
    assert.ok(riskContribution, 'Risk engine must award points for Return-Path mismatch');
    assert.equal(riskContribution.points, 10);
    assert.ok(result.data.risk.totalScore >= 10);
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 04: Suspicious URL Extraction
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 04: Extracts URL and domain artifacts from HTML body anchor tag', () => {
    const raw = loadFixture('04-suspicious-url.eml');
    const result = parseRawEmail(raw);
    parsedResults['04'] = result;

    assert.equal(result.success, true);
    assert.ok(result.data.body.html.includes('https://login-security-test.example/verify-account'));

    // Artifacts extraction
    const urls = result.data.artifacts.urls || [];
    assert.ok(urls.length >= 1, 'Must extract at least one URL from the HTML body');

    const targetUrl = urls.find((u) => u.domain === 'login-security-test.example');
    assert.ok(targetUrl, 'Must locate extracted URL under domain login-security-test.example');
    assert.equal(targetUrl.normalized, 'https://login-security-test.example/verify-account');

    // Domains collection
    const domains = result.data.artifacts.domains || [];
    assert.ok(
      domains.some((d) => (typeof d === 'string' ? d : d.normalized) === 'login-security-test.example'),
      'Domain list must include extracted host'
    );
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 05: Multiple Received Hops Transmission
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 05: Reconstructs Received hop chain, ordering, RFC 5737 IPs, and latency', () => {
    const raw = loadFixture('05-multiple-received-hops.eml');
    const result = parseRawEmail(raw);
    parsedResults['05'] = result;

    assert.equal(result.success, true);

    const transmission = result.data.transmission;
    assert.equal(transmission.hops.length, 2, 'Must extract exactly 2 chronological transmission hops');

    // Chronological ordering: Hop 0 (oldest/origin) -> Hop 1 (newest/relay)
    const hop0 = transmission.hops[0];
    const hop1 = transmission.hops[1];

    assert.equal(hop0.chronologicalIndex, 0);
    assert.equal(hop1.chronologicalIndex, 1);
    assert.equal(hop0.from.host, 'origin.example');
    assert.equal(hop0.by.host, 'relay.example');
    assert.equal(hop1.from.host, 'relay.example');
    assert.equal(hop1.by.host, 'mx.example');

    // RFC 5737 IP extraction
    const allIps = [
      ...hop0.ips.map((i) => i.address),
      ...hop1.ips.map((i) => i.address)
    ];
    assert.ok(allIps.includes('198.51.100.25'), 'Must capture origin IP 198.51.100.25');
    assert.ok(allIps.includes('198.51.100.50'), 'Must capture relay IP 198.51.100.50');
    assert.ok(allIps.includes('198.51.100.100'), 'Must capture destination IP 198.51.100.100');

    // Latency calculation: hop0 at 10:02:00, hop1 at 10:02:15 = +15 seconds
    assert.ok(transmission.latencies.length >= 1);
    const latency01 = transmission.latencies[0];
    assert.equal(latency01.seconds, 15, 'Transmission latency must equal 15 seconds');
    assert.equal(latency01.status, 'valid');

    // No transmission anomalies
    assert.equal(transmission.findings.length, 0, 'Chronological clean hops should have no anomalies');
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 06: Authentication Failure
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 06: Extracts explicit SPF, DKIM, and DMARC failures and scores them', () => {
    const raw = loadFixture('06-authentication-failure.eml');
    const result = parseRawEmail(raw);
    parsedResults['06'] = result;

    assert.equal(result.success, true);

    // Authentication evidence
    const spfFail = result.data.authentication.spf.results.find((r) => r.result === 'fail');
    assert.ok(spfFail, 'Must extract SPF fail result');

    const dkimFail = result.data.authentication.dkim.results.find((r) => r.result === 'fail');
    assert.ok(dkimFail, 'Must extract DKIM fail result');

    const dmarcFail = result.data.authentication.dmarc.results.find((r) => r.result === 'fail');
    assert.ok(dmarcFail, 'Must extract DMARC fail result');

    // Risk engine scoring for authentication failures
    const contribIds = result.data.risk.contributions.map((c) => c.id);
    assert.ok(contribIds.includes('SPF_FAIL'), 'Risk engine must award points for SPF_FAIL');
    assert.ok(contribIds.includes('DKIM_FAIL'), 'Risk engine must award points for DKIM_FAIL');
    assert.ok(contribIds.includes('DMARC_FAIL'), 'Risk engine must award points for DMARC_FAIL');

    // Sum of auth points: SPF(15) + DKIM(15) + DMARC(20) = 50 points
    assert.ok(result.data.risk.summary.categories.authentication >= 50);
    assert.ok(result.data.risk.totalScore >= 50);
    assert.ok(result.data.risk.level === 'HIGH' || result.data.risk.level === 'CRITICAL');
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 07: MIME Multipart Attachment
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 07: Parses multipart/mixed MIME structure, bodies, and attachment metadata', () => {
    const raw = loadFixture('07-mime-attachment.eml');
    const result = parseRawEmail(raw);
    parsedResults['07'] = result;

    assert.equal(result.success, true);
    assert.equal(result.data.mime.contentType, 'multipart/mixed');

    // Both text and html bodies extracted from inner multipart/alternative
    assert.ok(result.data.body.text.includes('security-report-test.txt'));
    assert.ok(result.data.body.html.includes('<code>security-report-test.txt</code>'));

    // Attachments
    assert.equal(result.data.attachments.length, 1, 'Must extract exactly 1 attachment');
    const att = result.data.attachments[0];
    assert.equal(att.filename, 'security-report-test.txt');
    assert.equal(att.contentType, 'text/plain');
    assert.equal(att.contentDisposition, 'attachment');
    assert.ok(typeof att.size === 'number' && att.size > 0, 'Attachment decoded size must be calculated');
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 08: HTML Phishing Simulation
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 08: Evaluates co-occurring phishing indicators (urgency, link, Reply-To mismatch)', () => {
    const raw = loadFixture('08-html-phishing.eml');
    const result = parseRawEmail(raw);
    parsedResults['08'] = result;

    assert.equal(result.success, true);

    // Urgent wording in subject and body
    assert.ok(result.data.metadata.subject.includes('URGENT ACTION REQUIRED'));
    assert.ok(result.data.body.html.includes('CRITICAL NOTICE') || result.data.body.html.includes('account suspension'));
    assert.ok(result.data.body.html.includes('24 hours'));

    // Reply-To mismatch
    const mismatchFinding = result.data.senderIdentity.findings.find(
      (f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH'
    );
    assert.ok(mismatchFinding, 'Must detect Reply-To mismatch in phishing lure');

    // Extracted URL artifact
    const targetUrl = result.data.artifacts.urls.find((u) => u.domain === 'login-security-test.example');
    assert.ok(targetUrl, 'Must extract lure link artifact');

    // Risk points assigned
    assert.ok(result.data.risk.totalScore >= 70, `Phishing lure must achieve elevated risk score (got ${result.data.risk.totalScore})`);
    assert.equal(result.data.risk.level, 'HIGH');
    assert.ok(result.data.risk.summary.categories.phishing_heuristics >= 50);
    assert.ok(result.data.risk.contributions.some((c) => c.id === 'PHISHING_CREDENTIAL_HARVESTING'));
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 09: Header Structure Anomalies
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 09: Handles folded headers, duplicate headers, unusual ordering, and mixed casing', () => {
    const raw = loadFixture('09-header-anomaly.eml');
    const result = parseRawEmail(raw);
    parsedResults['09'] = result;

    assert.equal(result.success, true, 'Must parse without throwing on RFC header anomalies');

    // Subject and Message-ID positioned before From in raw file are correctly captured
    assert.equal(result.data.metadata.subject, 'Controlled Test: Structural Header Anomaly and Folding Exercise');
    assert.equal(result.data.metadata.messageId, '<anomaly-header-009@company.example>');
    assert.equal(result.data.metadata.from, 'Anomaly Testing Service <service@company.example>');

    // Folded header continuation lines unfolded
    const folded = result.data.headers.all.find((h) => h.name.toLowerCase() === 'x-folded-header');
    assert.ok(folded, 'Must find X-Folded-Header');
    assert.ok(
      folded.value.includes('InitialToken') &&
      folded.value.includes('ContinuationSegmentOne') &&
      folded.value.includes('ContinuationSegmentTwo'),
      'Folded header must preserve all whitespace-indented continuation tokens'
    );

    // Duplicate headers preserved
    const spamHeaders = result.data.headers.all.filter((h) => h.name.toLowerCase() === 'x-spam-status');
    assert.equal(spamHeaders.length, 2, 'Duplicate X-Spam-Status headers must be preserved');

    // Mixed casing preserved in headers.all
    const custom = result.data.headers.all.find((h) => h.name === 'x-CuSToM-TrAcKeR');
    assert.ok(custom, 'Mixed-case header name must be preserved in headers.all');
    assert.equal(custom.value, 'TrackingID-Alpha-99482');
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 10: Combined Multi-Vector High Risk
  // ---------------------------------------------------------------------------
  await runTest('FIXTURE 10: Compounds multi-vector indicators into high/critical forensic risk', () => {
    const raw = loadFixture('10-combined-high-risk.eml');
    const result = parseRawEmail(raw);
    parsedResults['10'] = result;

    assert.equal(result.success, true);

    // Multi-category risk contributions
    const contribs = result.data.risk.contributions;
    const contribIds = contribs.map((c) => c.id);

    // 1. Auth failure contributions
    assert.ok(contribIds.includes('DMARC_FAIL'));
    assert.ok(contribIds.includes('SPF_FAIL'));
    assert.ok(contribIds.includes('DKIM_FAIL'));

    // 2. Sender identity mismatch contributions
    assert.ok(contribIds.includes('FROM_REPLY_TO_DOMAIN_MISMATCH'));
    assert.ok(contribIds.includes('FROM_RETURN_PATH_DOMAIN_MISMATCH'));

    // 3. Transmission continuity anomaly
    assert.ok(contribIds.includes('RECEIVED_HOP_HOST_MISMATCH'));

    // 4. Artifacts & attachment
    assert.ok(result.data.artifacts.urls.some((u) => u.domain === 'login-security-test.example'));
    assert.equal(result.data.attachments.length, 1);
    assert.equal(result.data.attachments[0].filename, 'audit-evidence-test.txt');

    // 5. Compounded score ceiling and risk level
    assert.equal(result.data.risk.totalScore, 100, 'Compound risk score should reach ceiling of 100');
    assert.equal(result.data.risk.level, 'CRITICAL', 'Compound risk level must be CRITICAL');
    assert.ok(result.data.risk.contributions.length >= 6);
  });

  // ---------------------------------------------------------------------------
  // SECTION 2: CROSS-FIXTURE COMPARATIVE FORENSIC ASSERTIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: CROSS-FIXTURE COMPARATIVE FORENSIC ASSERTIONS ---');

  await runTest('COMPARATIVE: Legitimate baseline (01) has significantly lower risk than combined (10)', () => {
    const legit = parsedResults['01'];
    const combined = parsedResults['10'];

    assert.ok(legit && combined);
    assert.equal(legit.data.risk.totalScore, 0);
    assert.equal(combined.data.risk.totalScore, 100);
    assert.ok(legit.data.risk.contributions.length < combined.data.risk.contributions.length);
    assert.equal(legit.data.risk.level, 'LOW');
    assert.equal(combined.data.risk.level, 'CRITICAL');
  });

  await runTest('COMPARATIVE: Authentication failure (06) produces higher risk than baseline (01)', () => {
    const legit = parsedResults['01'];
    const authFail = parsedResults['06'];

    assert.ok(legit && authFail);
    assert.ok(authFail.data.risk.totalScore > legit.data.risk.totalScore);
    assert.ok(authFail.data.risk.summary.categories.authentication > 0);
  });

  await runTest('COMPARATIVE: Reply-To mismatch (02) produces higher identity risk than baseline (01)', () => {
    const legit = parsedResults['01'];
    const replyTo = parsedResults['02'];

    assert.ok(legit && replyTo);
    assert.ok(replyTo.data.risk.summary.categories.sender_identity > legit.data.risk.summary.categories.sender_identity);
    assert.ok(replyTo.data.risk.totalScore > legit.data.risk.totalScore);
  });

  // ---------------------------------------------------------------------------
  // SECTION 3: API ROUTE INTEGRATION TESTS (POST /api/parse-eml)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 3: API ROUTE INTEGRATION TESTS (POST /api/parse-eml) ---');

  for (const fixtureNum of ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']) {
    const fixtureName = fs.readdirSync(FIXTURES_DIR).find((f) => f.startsWith(fixtureNum) && f.endsWith('.eml'));

    await runTest(`API POST /api/parse-eml handles fixture ${fixtureName}`, async () => {
      const rawContent = loadFixture(fixtureName);

      const request = new Request('http://localhost:3000/api/parse-eml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emlContent: rawContent })
      });

      const response = await POST(request);
      assert.equal(response.status, 200, 'Valid fixture must return HTTP 200');

      const json = await response.json();
      assert.equal(json.success, true, 'Response success must be true');
      assert.ok(json.data, 'Response must contain canonical parsed data');
      assert.ok(json.data.metadata, 'Response data must contain metadata');
      assert.ok(json.data.artifacts, 'Response data must contain artifacts');
      assert.ok(json.data.authentication, 'Response data must contain authentication');
      assert.ok(json.data.senderIdentity, 'Response data must contain senderIdentity');
      assert.ok(json.data.transmission, 'Response data must contain transmission');
      assert.ok(json.data.risk, 'Response data must contain risk');
      assert.ok(Array.isArray(json.warnings), 'Response warnings must be an array');
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: API ROUTE ERROR HANDLING TESTS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: API ROUTE INPUT VALIDATION & ERROR HANDLING ---');

  await runTest('API POST /api/parse-eml rejects empty emlContent string', async () => {
    const req = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: '' })
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, 'No email content was provided.');
  });

  await runTest('API POST /api/parse-eml rejects whitespace-only emlContent', async () => {
    const req = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: '   \r\n   ' })
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, 'No email content was provided.');
  });

  await runTest('API POST /api/parse-eml rejects non-string emlContent', async () => {
    const req = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: 12345 })
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, 'No email content was provided.');
  });

  await runTest('API POST /api/parse-eml rejects missing emlContent property', async () => {
    const req = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  await runTest('API POST /api/parse-eml rejects unparseable non-email text', async () => {
    const req = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: 'Plain text without any headers or colons' })
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error, 'Input does not contain recognizable RFC 5322 email headers.');
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL EML SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll();
