import assert from 'node:assert/strict';
import { parseRawEmail, validateEmailInput } from '../src/lib/emailParser.js';
import {
  extractArtifacts,
  extractUrls,
  extractIps,
  extractDomains,
  extractSenderDomains,
  normalizeUrl,
  isValidIpv4,
  isValidIpv6
} from '../src/lib/emailArtifacts.js';
import {
  parseAuthenticationResults,
  parseReceivedSpf,
  parseDkimSignatures,
  parseArcHeaders,
  extractAuthenticationEvidence
} from '../src/lib/emailAuth.js';
import {
  compareDomains,
  normalizeDomain,
  extractEmailAndDomain,
  extractSenderIdentities,
  analyzeSenderIdentity
} from '../src/lib/senderIdentity.js';
import {
  classifyIp,
  extractIpsFromText,
  cleanHostname,
  parseReceivedHeader,
  calculateHopLatencies,
  analyzeHopContinuity,
  analyzeEmailTransmission
} from '../src/lib/emailTransmission.js';
import { POST } from '../src/app/api/parse-eml/route.js';

console.log('====================================================');
console.log('RUNNING PHASE 1, 2, 3, 4 & 5 FORENSIC TEST SUITE');
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
  console.log('--- PHASE 1: CORE RFC 5322 & MIME TESTS ---');

  // ---------------------------------------------------------------------------
  // TEST 1: Simple plain-text email
  // ---------------------------------------------------------------------------
  await runTest('TEST 1: Simple plain-text email', () => {
    const raw = [
      'From: alice@example.com',
      'To: bob@example.com',
      'Subject: Simple Text Email',
      'Date: Mon, 10 Aug 2026 10:00:00 +0000',
      'Message-ID: <123@example.com>',
      'Content-Type: text/plain',
      '',
      'Hello Bob, this is a plain text email.'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'alice@example.com');
    assert.deepEqual(result.data.metadata.to, ['bob@example.com']);
    assert.equal(result.data.metadata.subject, 'Simple Text Email');
    assert.equal(result.data.metadata.date, 'Mon, 10 Aug 2026 10:00:00 +0000');
    assert.equal(result.data.metadata.messageId, '<123@example.com>');
    assert.equal(result.data.body.text.trim(), 'Hello Bob, this is a plain text email.');
    assert.equal(result.data.body.html, '');
    assert.equal(result.data.attachments.length, 0);
    assert.equal(result.data.mime.parts.length, 1);
    assert.equal(result.data.mime.parts[0].contentType, 'text/plain');
  });

  // ---------------------------------------------------------------------------
  // TEST 2: HTML email
  // ---------------------------------------------------------------------------
  await runTest('TEST 2: HTML email', () => {
    const raw = [
      'From: newsletter@example.com',
      'To: subscriber@example.com',
      'Subject: Monthly Update',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      '<html><body><h1>Hello Subscriber</h1><p>Welcome to the update.</p></body></html>'
    ].join('\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'newsletter@example.com');
    assert.equal(result.data.body.html.includes('<h1>Hello Subscriber</h1>'), true);
    assert.equal(result.data.body.text, '');
    assert.equal(result.data.mime.contentType, 'text/html');
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Multipart/alternative email
  // ---------------------------------------------------------------------------
  await runTest('TEST 3: Multipart/alternative email', () => {
    const boundary = 'alt_boundary_98765';
    const raw = [
      'From: service@example.com',
      'To: user@example.com',
      'Subject: Multipart Notice',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      'This is the plain text version.',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      '<p>This is the <strong>HTML</strong> version.</p>',
      `--${boundary}--`
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.body.text.trim(), 'This is the plain text version.');
    assert.equal(result.data.body.html.trim(), '<p>This is the <strong>HTML</strong> version.</p>');
    assert.equal(result.data.mime.parts.length, 2);
    assert.equal(result.data.mime.parts[0].contentType, 'text/plain');
    assert.equal(result.data.mime.parts[1].contentType, 'text/html');
  });

  // ---------------------------------------------------------------------------
  // TEST 4: Email with attachment metadata
  // ---------------------------------------------------------------------------
  await runTest('TEST 4: Email with attachment metadata', () => {
    const boundary = 'mix_boundary_54321';
    const base64Data = Buffer.from('Hello PDF Document').toString('base64');

    const raw = [
      'From: sender@example.com',
      'To: recipient@example.com',
      'Subject: Invoice Attached',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain',
      '',
      'Please find invoice attached.',
      `--${boundary}`,
      'Content-Type: application/pdf; name="invoice_august.pdf"',
      'Content-Disposition: attachment; filename="invoice_august.pdf"',
      'Content-Transfer-Encoding: base64',
      '',
      base64Data,
      `--${boundary}--`
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.attachments.length, 1);
    const att = result.data.attachments[0];
    assert.equal(att.filename, 'invoice_august.pdf');
    assert.equal(att.contentType, 'application/pdf');
    assert.equal(att.contentDisposition, 'attachment');
    assert.equal(att.size, 18);
  });

  // ---------------------------------------------------------------------------
  // TEST 5: Email containing folded headers
  // ---------------------------------------------------------------------------
  await runTest('TEST 5: Email containing folded headers', () => {
    const raw = [
      'From: sender@example.com',
      'To: recipient@example.com',
      'Subject: This is a very long',
      '    folded subject header line',
      'X-Custom-Multiline: first line',
      '\tsecond line with tab indent',
      '',
      'Body text here.'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.subject, 'This is a very long folded subject header line');

    const customHeader = result.data.headers.all.find((h) => h.name === 'X-Custom-Multiline');
    assert.ok(customHeader);
    assert.equal(customHeader.value, 'first line second line with tab indent');
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Email containing duplicate headers such as Received
  // ---------------------------------------------------------------------------
  await runTest('TEST 6: Email containing duplicate headers such as Received', () => {
    const raw = [
      'Received: from mail.hop1.com by relay.com with ESMTP id 1',
      'Received: from relay.com by mx.destination.com with ESMTP id 2',
      'From: sender@example.com',
      'To: recipient@example.com',
      'Subject: Two Received Hops',
      '',
      'Body content'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const receivedHeaders = result.data.headers.all.filter((h) => h.name.toLowerCase() === 'received');
    assert.equal(receivedHeaders.length, 2);
    assert.equal(receivedHeaders[0].value, 'from mail.hop1.com by relay.com with ESMTP id 1');
    assert.equal(receivedHeaders[1].value, 'from relay.com by mx.destination.com with ESMTP id 2');
  });

  // ---------------------------------------------------------------------------
  // TEST 7: Email using CRLF line endings
  // ---------------------------------------------------------------------------
  await runTest('TEST 7: Email using CRLF line endings', () => {
    const raw = 'From: crlf@example.com\r\nTo: dest@example.com\r\nSubject: CRLF Test\r\n\r\nMessage with CRLF';
    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'crlf@example.com');
    assert.equal(result.data.body.text, 'Message with CRLF');
  });

  // ---------------------------------------------------------------------------
  // TEST 8: Email using LF line endings
  // ---------------------------------------------------------------------------
  await runTest('TEST 8: Email using LF line endings', () => {
    const raw = 'From: lf@example.com\nTo: dest@example.com\nSubject: LF Test\n\nMessage with LF';
    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'lf@example.com');
    assert.equal(result.data.body.text, 'Message with LF');
  });

  // ---------------------------------------------------------------------------
  // TEST 9: Email with missing optional headers
  // ---------------------------------------------------------------------------
  await runTest('TEST 9: Email with missing optional headers', () => {
    const raw = [
      'From: minimal@example.com',
      'To: target@example.com',
      '',
      'Minimal email with no subject, date, or cc.'
    ].join('\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.metadata.from, 'minimal@example.com');
    assert.deepEqual(result.data.metadata.to, ['target@example.com']);
    assert.equal(result.data.metadata.subject, null);
    assert.equal(result.data.metadata.date, null);
    assert.deepEqual(result.data.metadata.cc, []);
    assert.deepEqual(result.data.metadata.bcc, []);
    assert.deepEqual(result.data.metadata.replyTo, []);
    assert.equal(result.data.metadata.messageId, null);
  });

  // ---------------------------------------------------------------------------
  // TEST 10: Malformed email handling (controlled error/warning, no crash)
  // ---------------------------------------------------------------------------
  await runTest('TEST 10a: Reject completely empty string', () => {
    const result = parseRawEmail('');
    assert.equal(result.success, false);
    assert.equal(result.error, 'No email content was provided.');
  });

  await runTest('TEST 10b: Reject input with no email headers', () => {
    const result = parseRawEmail('Just some random text without any email headers');
    assert.equal(result.success, false);
    assert.equal(result.error, 'Input does not contain recognizable RFC 5322 email headers.');
  });

  await runTest('TEST 10c: Handle missing boundary in multipart with warnings', () => {
    const raw = [
      'From: broken@example.com',
      'To: user@example.com',
      'Subject: Malformed Multipart',
      'Content-Type: multipart/mixed; boundary="missing_boundary"',
      '',
      'Body without any matching boundary markers.'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.ok(result.warnings.length > 0);
    assert.equal(result.data.metadata.from, 'broken@example.com');
  });

  // ---------------------------------------------------------------------------
  // TEST 11: Backend API Route (POST /api/parse-eml)
  // ---------------------------------------------------------------------------
  await runTest('TEST 11: Backend API Route POST /api/parse-eml', async () => {
    const validReq = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emlContent: 'From: api@example.com\r\nTo: dest@example.com\r\nSubject: Route Test\r\n\r\nAPI Body'
      })
    });
    const res = await POST(validReq);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.metadata.from, 'api@example.com');
    assert.equal(json.data.body.text, 'API Body');
    assert.ok(json.data.artifacts);

    // Empty rejection
    const emptyReq = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: '' })
    });
    const emptyRes = await POST(emptyReq);
    assert.equal(emptyRes.status, 400);
  });

  console.log('\n--- PHASE 2: ARTIFACT EXTRACTION & NORMALIZATION TESTS ---');

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 1: Single HTTP URL
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 1: Single HTTP URL', () => {
    const raw = [
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Login Link',
      '',
      'Please login here: http://example.com/login'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.ok(result.data.artifacts);
    assert.equal(result.data.artifacts.urls.length, 1);
    const u = result.data.artifacts.urls[0];
    assert.equal(u.original, 'http://example.com/login');
    assert.equal(u.normalized, 'http://example.com/login');
    assert.equal(u.domain, 'example.com');
    assert.equal(u.source, 'body');

    // Verify domain is extracted
    const d = result.data.artifacts.domains.find((item) => item.normalized === 'example.com');
    assert.ok(d);
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 2: HTTPS URL
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 2: HTTPS URL', () => {
    const raw = [
      'From: secure@example.com',
      'To: user@example.com',
      'Subject: Secure Portal',
      '',
      'Visit https://example.com/account for details.'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.urls.length, 1);
    const u = result.data.artifacts.urls[0];
    assert.equal(u.normalized, 'https://example.com/account');
    assert.equal(u.domain, 'example.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 3: Multiple URLs
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 3: Multiple URLs', () => {
    const raw = [
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Multiple Links',
      '',
      'First link: http://site-a.com/page1 and second link: https://site-b.org/page2?query=1'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.urls.length, 2);
    const domains = result.data.artifacts.urls.map((u) => u.domain);
    assert.ok(domains.includes('site-a.com'));
    assert.ok(domains.includes('site-b.org'));
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 4: Duplicate URLs
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 4: Duplicate URLs', () => {
    const boundary = 'dup_bound_123';
    const raw = [
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Duplicate Links',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain',
      '',
      'Plain link: https://example.com/login',
      `--${boundary}`,
      'Content-Type: text/html',
      '',
      '<a href="https://example.com/login">Login</a>',
      `--${boundary}--`
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const matching = result.data.artifacts.urls.filter(
      (u) => u.normalized === 'https://example.com/login'
    );
    assert.equal(matching.length, 1); // Deterministically deduplicated!
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 5: HTML href
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 5: HTML href', () => {
    const raw = [
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Action Required',
      'Content-Type: text/html',
      '',
      '<a href="https://different.example/login">Verify your account</a>'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.urls.length, 1);
    const u = result.data.artifacts.urls[0];
    assert.equal(u.normalized, 'https://different.example/login');
    assert.equal(u.source, 'html_href');
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 6: URL normalization
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 6: URL normalization (default ports 80/443 & hostname case)', () => {
    // Port 443 default on https
    const norm1 = normalizeUrl('HTTPS://Example.COM:443/Login');
    assert.equal(norm1, 'https://example.com/Login');

    // Port 80 default on http
    const norm2 = normalizeUrl('HTTP://Example.COM:80/path?id=123#sec');
    assert.equal(norm2, 'http://example.com/path?id=123#sec');

    // Trailing dot on hostname
    const norm3 = normalizeUrl('https://example.com.:443/test');
    assert.equal(norm3, 'https://example.com/test');
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 7: IPv4 in Received header
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 7: IPv4 in Received header', () => {
    const raw = [
      'Received: from mail.example.com (mail.example.com [203.0.113.10]) by relay.example.net with ESMTP id ABC',
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Transmission Trace',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.ips.length, 1);
    const ip = result.data.artifacts.ips[0];
    assert.equal(ip.address, '203.0.113.10');
    assert.equal(ip.version, 4);
    assert.equal(ip.source, 'received_header');
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 8: IPv6 in Received header
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 8: IPv6 in Received header', () => {
    const raw = [
      'Received: from mail.example.com ([2001:db8::1]) by mx.example.net with ESMTPS id XYZ',
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: IPv6 Trace',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.ips.length, 1);
    const ip = result.data.artifacts.ips[0];
    assert.equal(ip.address, '2001:db8::1');
    assert.equal(ip.version, 6);
    assert.equal(ip.source, 'received_header');
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 9: Sender domains
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 9: Sender domains', () => {
    const raw = [
      'From: Security Team <security@example.com>',
      'Reply-To: support@external.example',
      'Return-Path: bounce@example.com',
      'To: user@client.com',
      'Subject: Sender Domains Test',
      '',
      'Body content'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const sd = result.data.artifacts.senderDomains;
    assert.deepEqual(sd.from, ['example.com']);
    assert.deepEqual(sd.replyTo, ['external.example']);
    assert.deepEqual(sd.returnPath, ['example.com']);
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 10: Invalid IP rejection
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 10: Invalid IP rejection', () => {
    // Validate unit helper
    assert.equal(isValidIpv4('999.999.999.999'), false);
    assert.equal(isValidIpv4('256.1.2.3'), false);
    assert.equal(isValidIpv6('10:30:45'), false); // timestamp must not be accepted

    const raw = [
      'Received: from host (unknown [999.999.999.999]) time 10:30:45 by relay.com',
      'From: test@example.com',
      'To: user@example.com',
      'Subject: Bad IP Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.ips.length, 0); // Invalid IP and timestamp rejected!
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 11: Multiple domains
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 11: Multiple domains (subdomains preserved)', () => {
    const raw = [
      'From: sender@company.com',
      'To: user@example.com',
      'Subject: Subdomains',
      '',
      'Links: https://login.example.com and https://mail.example.com'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const domainNames = result.data.artifacts.domains.map((d) => d.normalized);
    assert.ok(domainNames.includes('login.example.com'));
    assert.ok(domainNames.includes('mail.example.com'));
    assert.ok(domainNames.includes('company.com'));
  });

  // ---------------------------------------------------------------------------
  // PHASE 2 - TEST 12: URL punctuation cleanup
  // ---------------------------------------------------------------------------
  await runTest('PHASE 2 - TEST 12: URL punctuation cleanup', () => {
    const raw = [
      'From: sender@example.com',
      'To: user@example.com',
      'Subject: Punctuation Test',
      '',
      'Visit https://example.com/login.'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.artifacts.urls.length, 1);
    const u = result.data.artifacts.urls[0];
    assert.equal(u.normalized, 'https://example.com/login'); // trailing dot stripped!
  });

  console.log('\n--- PHASE 3: EMAIL AUTHENTICATION FORENSICS TESTS ---');

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 1: Authentication-Results SPF PASS
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 1: Authentication-Results SPF PASS', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=example.com',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: SPF Pass Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.ok(result.data.authentication);
    assert.equal(result.data.authentication.authenticationResults.length, 1);
    const ar = result.data.authentication.authenticationResults[0];
    assert.equal(ar.server, 'mx.example.com');
    assert.equal(ar.spf.result, 'pass');
    assert.equal(ar.spf.mailFrom, 'example.com');
    assert.equal(ar.spf.domain, 'example.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 2: SPF FAIL
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 2: SPF FAIL', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=fail smtp.mailfrom=example.com',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: SPF Fail Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.authenticationResults[0].spf.result, 'fail');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 3: SPF SOFTFAIL
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 3: SPF SOFTFAIL', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=softfail smtp.mailfrom=example.com',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: SPF Softfail Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    // Crucial: softfail must remain softfail and NOT be converted to fail
    assert.equal(result.data.authentication.authenticationResults[0].spf.result, 'softfail');
    assert.equal(result.data.authentication.authenticationResults[0].spf.rawResult, 'softfail');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 4: Received-SPF
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 4: Received-SPF', () => {
    const raw = [
      'Received-SPF: pass (domain of example.com designates 203.0.113.10 as permitted sender) client-ip=203.0.113.10;',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Received-SPF Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.receivedSpf.length, 1);
    const rs = result.data.authentication.receivedSpf[0];
    assert.equal(rs.result, 'pass');
    assert.equal(rs.clientIp, '203.0.113.10');
    assert.equal(rs.domain, 'example.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 5: DKIM Signature
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 5: DKIM Signature', () => {
    const raw = [
      'DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com; s=selector1; h=from:to:subject:date; bh=abc123; b=signaturevalue',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: DKIM Signature Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.dkim.signatures.length, 1);
    const sig = result.data.authentication.dkim.signatures[0];
    assert.equal(sig.version, '1');
    assert.equal(sig.algorithm, 'rsa-sha256');
    assert.deepEqual(sig.canonicalization, { header: 'relaxed', body: 'relaxed' });
    assert.equal(sig.domain, 'example.com');
    assert.equal(sig.selector, 'selector1');
    assert.deepEqual(sig.signedHeaders, ['from', 'to', 'subject', 'date']);
    assert.equal(sig.bodyHash, 'abc123');
    assert.equal(sig.signature, 'signaturevalue');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 6: DKIM Authentication Result
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 6: DKIM Authentication Result', () => {
    const raw = [
      'Authentication-Results: mx.example.com; dkim=pass header.d=example.com header.s=selector1',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: DKIM Result Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.dkim.results.length, 1);
    const dkimRes = result.data.authentication.dkim.results[0];
    assert.equal(dkimRes.result, 'pass');
    assert.equal(dkimRes.domain, 'example.com');
    assert.equal(dkimRes.selector, 'selector1');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 7: DMARC
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 7: DMARC', () => {
    const raw = [
      'Authentication-Results: mx.example.com; dmarc=fail header.from=example.com policy=reject',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: DMARC Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.dmarc.results.length, 1);
    const dmarcRes = result.data.authentication.dmarc.results[0];
    assert.equal(dmarcRes.result, 'fail');
    assert.equal(dmarcRes.domain, 'example.com');
    assert.equal(dmarcRes.policy, 'reject');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 8: Multiple Authentication-Results
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 8: Multiple Authentication-Results', () => {
    const raw = [
      'Authentication-Results: mx1.example.com; spf=pass; dkim=pass',
      'Authentication-Results: mx2.example.net; spf=fail; dkim=fail',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Multi Auth-Results Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.authenticationResults.length, 2);
    assert.equal(result.data.authentication.authenticationResults[0].server, 'mx1.example.com');
    assert.equal(result.data.authentication.authenticationResults[1].server, 'mx2.example.net');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 9: Multiple DKIM Signatures
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 9: Multiple DKIM Signatures', () => {
    const raw = [
      'DKIM-Signature: v=1; a=rsa-sha256; d=domain1.com; s=s1; b=sig1',
      'DKIM-Signature: v=1; a=rsa-sha256; d=domain2.com; s=s2; b=sig2',
      'From: user@domain1.com',
      'To: recipient@example.com',
      'Subject: Multi DKIM Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.dkim.signatures.length, 2);
    assert.equal(result.data.authentication.dkim.signatures[0].domain, 'domain1.com');
    assert.equal(result.data.authentication.dkim.signatures[1].domain, 'domain2.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 10: ARC
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 10: ARC', () => {
    const raw = [
      'ARC-Seal: i=1; a=rsa-sha256; cv=none; d=example.com; s=arc1; b=seal1',
      'ARC-Message-Signature: i=1; a=rsa-sha256; d=example.com; s=arc1; c=relaxed/relaxed; h=from:to; bh=abc; b=sig1',
      'ARC-Authentication-Results: i=1; mx.example.com; spf=pass; dkim=pass; dmarc=pass',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: ARC Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const arc = result.data.authentication.arc;
    assert.equal(arc.seals.length, 1);
    assert.equal(arc.seals[0].instance, 1);
    assert.equal(arc.seals[0].cv, 'none');
    assert.equal(arc.messageSignatures.length, 1);
    assert.equal(arc.messageSignatures[0].instance, 1);
    assert.equal(arc.messageSignatures[0].domain, 'example.com');
    assert.equal(arc.authenticationResults.length, 1);
    assert.equal(arc.authenticationResults[0].instance, 1);
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 11: Folded Authentication Header
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 11: Folded Authentication Header', () => {
    const raw = [
      'Authentication-Results: mx.example.com;',
      '    spf=pass;',
      '    dkim=pass;',
      '    dmarc=pass',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Folded Auth Header Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const ar = result.data.authentication.authenticationResults[0];
    assert.equal(ar.spf.result, 'pass');
    assert.equal(ar.dkim.result, 'pass');
    assert.equal(ar.dmarc.result, 'pass');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 12: Missing Optional Authentication Fields
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 12: Missing Optional Authentication Fields', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=pass',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Partial Auth Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const ar = result.data.authentication.authenticationResults[0];
    assert.ok(ar.spf);
    assert.equal(ar.spf.result, 'pass');
    assert.equal(ar.dkim, null);
    assert.equal(ar.dmarc, null);
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 13: Conflicting SPF Sources
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 13: Conflicting SPF Sources', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=pass',
      'Received-SPF: fail client-ip=203.0.113.10;',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Conflicting SPF Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const spfResults = result.data.authentication.spf.results;
    assert.equal(spfResults.length, 2);
    const authSpf = spfResults.find((r) => r.source === 'Authentication-Results');
    const recSpf = spfResults.find((r) => r.source === 'Received-SPF');
    assert.equal(authSpf.result, 'pass');
    assert.equal(recSpf.result, 'fail');
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 14: Malformed Authentication Header
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 14: Malformed Authentication Header', () => {
    const raw = [
      'Authentication-Results: ;;; invalid garbage = = = ;;;',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Malformed Auth Header Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.authenticationResults.length, 1);
    assert.ok(result.data.authentication.authenticationResults[0].raw);
  });

  // ---------------------------------------------------------------------------
  // PHASE 3 - TEST 15: Mixed Header Casing
  // ---------------------------------------------------------------------------
  await runTest('PHASE 3 - TEST 15: Mixed Header Casing', () => {
    const raw = [
      'authentication-results: mx.example.com; spf=pass',
      'received-spf: pass client-ip=1.2.3.4;',
      'dkim-signature: v=1; a=rsa-sha256; d=example.com; s=s1; b=sig',
      'From: user@example.com',
      'To: recipient@example.com',
      'Subject: Mixed Header Casing Test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.authentication.authenticationResults.length, 1);
    assert.equal(result.data.authentication.receivedSpf.length, 1);
    assert.equal(result.data.authentication.dkim.signatures.length, 1);
  });

  // ===========================================================================
  // PHASE 4: SENDER IDENTITY & HEADER CONSISTENCY TESTS
  // ===========================================================================
  console.log('\n--- PHASE 4: SENDER IDENTITY & HEADER CONSISTENCY TESTS ---');

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 1: From and Reply-To same domain
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 1: From and Reply-To same domain', () => {
    const raw = [
      'From: alice@example.com',
      'Reply-To: support@example.com',
      'Subject: Same domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    assert.ok(si);
    const rtComp = si.comparisons.find((c) => c.type === 'from_vs_reply_to');
    assert.ok(rtComp);
    assert.equal(rtComp.status, 'match');
    assert.equal(si.findings.some((f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 2: From and Reply-To different domains
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 2: From and Reply-To different domains', () => {
    const raw = [
      'From: alice@example.com',
      'Reply-To: support@evil.com',
      'Subject: Mismatch domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const rtComp = si.comparisons.find((c) => c.type === 'from_vs_reply_to');
    assert.ok(rtComp);
    assert.equal(rtComp.status, 'mismatch');
    const finding = si.findings.find((f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'example.com');
    assert.equal(finding.sourceB.domain, 'evil.com');
    assert.ok(finding.evidence.fromRaw);
    assert.ok(finding.evidence.replyToRaw);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 3: From and Return-Path same domain
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 3: From and Return-Path same domain', () => {
    const raw = [
      'From: alice@example.com',
      'Return-Path: <bounce@example.com>',
      'Subject: Same Return-Path domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const rpComp = si.comparisons.find((c) => c.type === 'from_vs_return_path');
    assert.ok(rpComp);
    assert.equal(rpComp.status, 'match');
    assert.equal(si.findings.some((f) => f.id === 'FROM_RETURN_PATH_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 4: From and Return-Path different domains
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 4: From and Return-Path different domains', () => {
    const raw = [
      'From: alice@example.com',
      'Return-Path: <bounce@mailer.example.net>',
      'Subject: Different Return-Path domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const rpComp = si.comparisons.find((c) => c.type === 'from_vs_return_path');
    assert.ok(rpComp);
    assert.equal(rpComp.status, 'mismatch');
    const finding = si.findings.find((f) => f.id === 'FROM_RETURN_PATH_DOMAIN_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'example.com');
    assert.equal(finding.sourceB.domain, 'mailer.example.net');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 5: From and SPF domain same
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 5: From and SPF domain same', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=example.com',
      'From: user@example.com',
      'Subject: SPF same domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const spfComp = si.comparisons.find((c) => c.type === 'from_vs_spf');
    assert.ok(spfComp);
    assert.equal(spfComp.status, 'match');
    assert.equal(si.findings.some((f) => f.id === 'FROM_SPF_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 6: From and SPF domain different
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 6: From and SPF domain different', () => {
    const raw = [
      'Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=spoofed.net',
      'From: user@example.com',
      'Subject: SPF mismatch test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const spfComp = si.comparisons.find((c) => c.type === 'from_vs_spf');
    assert.ok(spfComp);
    assert.equal(spfComp.status, 'mismatch');
    const finding = si.findings.find((f) => f.id === 'FROM_SPF_DOMAIN_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'example.com');
    assert.equal(finding.sourceB.domain, 'spoofed.net');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 7: From and DKIM d= same
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 7: From and DKIM d= same', () => {
    const raw = [
      'DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=s1; b=sig;',
      'From: user@example.com',
      'Subject: DKIM same domain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const dkimComp = si.comparisons.find((c) => c.type === 'from_vs_dkim');
    assert.ok(dkimComp);
    assert.equal(dkimComp.status, 'match');
    assert.equal(si.findings.some((f) => f.id === 'FROM_DKIM_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 8: From and DKIM d= different
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 8: From and DKIM d= different', () => {
    const raw = [
      'DKIM-Signature: v=1; a=rsa-sha256; d=attacker-domain.com; s=s1; b=sig;',
      'From: user@example.com',
      'Subject: DKIM mismatch test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const dkimComp = si.comparisons.find((c) => c.type === 'from_vs_dkim');
    assert.ok(dkimComp);
    assert.equal(dkimComp.status, 'mismatch');
    const finding = si.findings.find((f) => f.id === 'FROM_DKIM_DOMAIN_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'example.com');
    assert.equal(finding.sourceB.domain, 'attacker-domain.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 9: Multiple DKIM signatures evaluated independently
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 9: Multiple DKIM signatures evaluated independently', () => {
    const raw = [
      'DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=s1; b=sig1;',
      'DKIM-Signature: v=1; a=rsa-sha256; d=thirdparty-mailer.net; s=s2; b=sig2;',
      'From: user@example.com',
      'Subject: Multiple DKIM signatures test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const dkimComps = si.comparisons.filter((c) => c.type === 'from_vs_dkim');
    assert.equal(dkimComps.length, 2);
    assert.equal(dkimComps.some((c) => c.status === 'match' && c.sourceB.domain === 'example.com'), true);
    assert.equal(dkimComps.some((c) => c.status === 'mismatch' && c.sourceB.domain === 'thirdparty-mailer.net'), true);
    const findings = si.findings.filter((f) => f.id === 'FROM_DKIM_DOMAIN_MISMATCH');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].sourceB.domain, 'thirdparty-mailer.net');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 10: Multiple Reply-To addresses evaluated independently
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 10: Multiple Reply-To addresses evaluated independently', () => {
    const raw = [
      'From: alice@example.com',
      'Reply-To: one@example.com, two@evil.com',
      'Subject: Multiple Reply-To test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    const si = result.data.senderIdentity;
    const rtComps = si.comparisons.filter((c) => c.type === 'from_vs_reply_to');
    assert.equal(rtComps.length, 2);
    assert.equal(rtComps.some((c) => c.status === 'match' && c.sourceB.domain === 'example.com'), true);
    assert.equal(rtComps.some((c) => c.status === 'mismatch' && c.sourceB.domain === 'evil.com'), true);
    const findings = si.findings.filter((f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH');
    assert.equal(findings.length, 1);
    assert.equal(findings[0].sourceB.domain, 'evil.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 11: Case-insensitive domain comparison
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 11: Case-insensitive domain comparison', () => {
    assert.equal(compareDomains('Example.COM', 'example.com'), true);
    assert.equal(compareDomains('Example.COM', 'different.com'), false);

    const raw = [
      'From: alice@Example.COM',
      'Reply-To: support@example.com',
      'Subject: Case test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const rtComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_reply_to');
    assert.equal(rtComp.status, 'match');
    assert.equal(result.data.senderIdentity.findings.length, 0);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 12: Trailing-dot domain normalization
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 12: Trailing-dot domain normalization', () => {
    assert.equal(normalizeDomain('example.com.'), 'example.com');
    assert.equal(compareDomains('example.com.', 'example.com'), true);

    const raw = [
      'From: alice@example.com.',
      'Return-Path: <bounce@example.com>',
      'Subject: Trailing dot test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const rpComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_return_path');
    assert.equal(rpComp.status, 'match');
    assert.equal(result.data.senderIdentity.findings.length, 0);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 13: Subdomain mismatch (exact-domain rule)
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 13: Subdomain mismatch (exact-domain rule)', () => {
    assert.equal(compareDomains('mail.example.com', 'example.com'), false);
    assert.equal(compareDomains('evil-example.com', 'example.com'), false);

    const raw = [
      'From: alice@mail.example.com',
      'Reply-To: support@example.com',
      'Subject: Subdomain exact match test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const rtComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_reply_to');
    assert.equal(rtComp.status, 'mismatch');
    const finding = result.data.senderIdentity.findings.find((f) => f.id === 'FROM_REPLY_TO_DOMAIN_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'mail.example.com');
    assert.equal(finding.sourceB.domain, 'example.com');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 14: Missing SPF domain recorded as unavailable, NOT mismatch
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 14: Missing SPF domain recorded as unavailable, NOT mismatch', () => {
    const raw = [
      'From: alice@example.com',
      'Subject: Missing SPF test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const spfComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_spf');
    assert.ok(spfComp);
    assert.equal(spfComp.status, 'unavailable');
    assert.equal(result.data.senderIdentity.findings.some((f) => f.id === 'FROM_SPF_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 15: Missing DKIM domain recorded as unavailable, NOT mismatch
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 15: Missing DKIM domain recorded as unavailable, NOT mismatch', () => {
    const raw = [
      'From: alice@example.com',
      'Subject: Missing DKIM test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const dkimComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_dkim');
    assert.ok(dkimComp);
    assert.equal(dkimComp.status, 'unavailable');
    assert.equal(result.data.senderIdentity.findings.some((f) => f.id === 'FROM_DKIM_DOMAIN_MISMATCH'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 16: From vs DMARC header.from mismatch
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 16: From vs DMARC header.from mismatch', () => {
    const raw = [
      'Authentication-Results: mx.example.com; dmarc=pass header.from=different.org',
      'From: user@example.com',
      'Subject: DMARC header.from test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const dmarcComp = result.data.senderIdentity.comparisons.find((c) => c.type === 'from_vs_dmarc_header_from');
    assert.ok(dmarcComp);
    assert.equal(dmarcComp.status, 'mismatch');
    const finding = result.data.senderIdentity.findings.find((f) => f.id === 'FROM_DMARC_HEADER_FROM_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.sourceA.domain, 'example.com');
    assert.equal(finding.sourceB.domain, 'different.org');
  });

  // ---------------------------------------------------------------------------
  // PHASE 4 - TEST 17: Missing From header handled gracefully
  // ---------------------------------------------------------------------------
  await runTest('PHASE 4 - TEST 17: Missing From header handled gracefully', () => {
    const raw = [
      'To: recipient@example.com',
      'Subject: No From Header',
      'Reply-To: support@example.com',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.senderIdentity.identities.from, null);
    assert.equal(result.data.senderIdentity.comparisons.every((c) => c.status === 'unavailable'), true);
    assert.equal(result.data.senderIdentity.findings.length, 0);
  });

  // ===========================================================================
  // PHASE 5: HEADER TRANSMISSION & HOP ANALYSIS TESTS
  // ===========================================================================
  console.log('\n--- PHASE 5: HEADER TRANSMISSION & HOP ANALYSIS TESTS ---');

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 1: One simple Received header extraction
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 1: One simple Received header extraction', () => {
    const raw = [
      'Received: from mail.example.com by mx.example.net with ESMTPS id ABC123; Sat, 12 Sep 2026 10:15:30 +0000',
      'From: sender@example.com',
      'Subject: Single hop test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.ok(result.data.transmission);
    assert.equal(result.data.transmission.received.length, 1);
    assert.equal(result.data.transmission.hops.length, 1);
    assert.equal(result.data.transmission.summary.hopCount, 1);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.from.host, 'mail.example.com');
    assert.equal(hop.by.host, 'mx.example.net');
    assert.equal(hop.with, 'ESMTPS');
    assert.equal(hop.id, 'ABC123');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 2: Multiple Received headers preserved
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 2: Multiple Received headers preserved', () => {
    const raw = [
      'Received: from relay2.example.com by mx.final.net with ESMTPS id DEF456; Sat, 12 Sep 2026 10:15:35 +0000',
      'Received: from relay1.example.com by relay2.example.com with ESMTP id ABC123; Sat, 12 Sep 2026 10:15:30 +0000',
      'Received: from client.local by relay1.example.com with SMTP; Sat, 12 Sep 2026 10:15:20 +0000',
      'From: user@example.com',
      'Subject: Multiple hops test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.transmission.received.length, 3);
    assert.equal(result.data.transmission.hops.length, 3);
    assert.equal(result.data.transmission.summary.hopCount, 3);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 3: Folded Received header treated as one header
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 3: Folded Received header treated as one header', () => {
    const raw = [
      'Received: from mail.example.com',
      '    (mail.example.com [192.0.2.10])',
      '    by mx.example.net',
      '    with ESMTPS',
      '    id FOLD123;',
      '    Sat, 12 Sep 2026 10:15:30 +0000',
      'From: sender@example.com',
      'Subject: Folded header test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    assert.equal(result.success, true);
    assert.equal(result.data.transmission.received.length, 1);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.from.host, 'mail.example.com');
    assert.equal(hop.from.ip, '192.0.2.10');
    assert.equal(hop.by.host, 'mx.example.net');
    assert.equal(hop.id, 'FOLD123');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 4: Extract from host and IP
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 4: Extract from host and IP', () => {
    const raw = [
      'Received: from mail.sender.org (outbound.sender.org [203.0.113.50]) by mx.dest.com; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: sender@sender.org',
      'Subject: From test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.from.host, 'mail.sender.org');
    assert.equal(hop.from.ip, '203.0.113.50');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 5: Extract by host
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 5: Extract by host', () => {
    const raw = [
      'Received: from mail.example.com by gateway.target.net with ESMTP; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: By test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.by.host, 'gateway.target.net');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 6: Extract with protocol
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 6: Extract with protocol', () => {
    const raw = [
      'Received: by mx.target.net with ESMTPSA id 999; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: Protocol test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.with, 'ESMTPSA');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 7: Extract id
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 7: Extract id', () => {
    const raw = [
      'Received: from a by b with SMTP id <unique-queue-id-12345@b>; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: ID test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.id, '<unique-queue-id-12345@b>');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 8: Extract for recipient
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 8: Extract for recipient', () => {
    const raw = [
      'Received: from a by b for <target.user@domain.com>; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: For test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.for, '<target.user@domain.com>');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 9: Extract IPv4 address from Received
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 9: Extract IPv4 address from Received', () => {
    const raw = [
      'Received: from mail.example.com ([198.51.100.25]) by mx.example.com; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: IPv4 test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.ips.some((ip) => ip.address === '198.51.100.25' && ip.version === 4), true);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 10: Extract IPv6 address from Received
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 10: Extract IPv6 address from Received', () => {
    const raw = [
      'Received: from mail.example.com ([2001:db8::cafe:1]) by mx.example.com; Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: IPv6 test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.ips.some((ip) => ip.address === '2001:db8::cafe:1' && ip.version === 6), true);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 11: Extract timestamp and normalize to ISO
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 11: Extract timestamp and normalize to ISO', () => {
    const raw = [
      'Received: by mx.example.com; Sat, 12 Sep 2026 10:15:30 +0000',
      'From: user@example.com',
      'Subject: Timestamp test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.timestamp.raw, 'Sat, 12 Sep 2026 10:15:30 +0000');
    assert.equal(hop.timestamp.normalized, '2026-09-12T10:15:30.000Z');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 12: Received header ordering (newest-vs-oldest)
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 12: Received header ordering (newest-vs-oldest)', () => {
    const raw = [
      'Received: by final.destination.net; Sat, 12 Sep 2026 10:15:35 +0000',
      'Received: by intermediate.relay.net; Sat, 12 Sep 2026 10:15:25 +0000',
      'Received: by origin.sender.org; Sat, 12 Sep 2026 10:15:10 +0000',
      'From: user@example.com',
      'Subject: Order test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    // In raw received array: index 0 is top (final), index 2 is bottom (origin)
    assert.equal(tx.received[0].by.host, 'final.destination.net');
    assert.equal(tx.received[0].headerIndex, 0);
    assert.equal(tx.received[0].chronologicalIndex, 2);

    assert.equal(tx.received[2].by.host, 'origin.sender.org');
    assert.equal(tx.received[2].headerIndex, 2);
    assert.equal(tx.received[2].chronologicalIndex, 0);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 13: Construct chronological hop chain
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 13: Construct chronological hop chain', () => {
    const raw = [
      'Received: by hop3.net; Sat, 12 Sep 2026 10:15:30 +0000',
      'Received: by hop2.net; Sat, 12 Sep 2026 10:15:20 +0000',
      'Received: by hop1.net; Sat, 12 Sep 2026 10:15:10 +0000',
      'From: user@example.com',
      'Subject: Chain test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hops = result.data.transmission.hops;
    assert.equal(hops[0].by.host, 'hop1.net');
    assert.equal(hops[0].chronologicalIndex, 0);
    assert.equal(hops[1].by.host, 'hop2.net');
    assert.equal(hops[1].chronologicalIndex, 1);
    assert.equal(hops[2].by.host, 'hop3.net');
    assert.equal(hops[2].chronologicalIndex, 2);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 14: Calculate positive transmission latency
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 14: Calculate positive transmission latency', () => {
    const raw = [
      'Received: by hop2.net; Sat, 12 Sep 2026 10:15:25 +0000',
      'Received: by hop1.net; Sat, 12 Sep 2026 10:15:10 +0000',
      'From: user@example.com',
      'Subject: Latency test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    assert.equal(tx.latencies.length, 1);
    assert.equal(tx.latencies[0].seconds, 15);
    assert.equal(tx.latencies[0].status, 'valid');
    assert.equal(tx.findings.some((f) => f.id === 'NEGATIVE_TRANSMISSION_LATENCY'), false);
    assert.equal(tx.summary.totalLatencySeconds, 15);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 15: Detect negative transmission latency
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 15: Detect negative transmission latency', () => {
    const raw = [
      'Received: by hop2.net; Sat, 12 Sep 2026 10:15:10 +0000', // Newer hop says 10:15:10
      'Received: by hop1.net; Sat, 12 Sep 2026 10:15:30 +0000', // Older hop says 10:15:30
      'From: user@example.com',
      'Subject: Negative latency test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    assert.equal(tx.latencies.length, 1);
    assert.equal(tx.latencies[0].seconds, -20);
    assert.equal(tx.latencies[0].status, 'negative');
    const finding = tx.findings.find((f) => f.id === 'NEGATIVE_TRANSMISSION_LATENCY');
    assert.ok(finding);
    assert.equal(finding.evidence.latencySeconds, -20);
    assert.ok(finding.evidence.olderTimestamp);
    assert.ok(finding.evidence.newerTimestamp);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 16: Missing timestamp handled without false anomaly
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 16: Missing timestamp handled without false anomaly', () => {
    const raw = [
      'Received: from a by b with SMTP', // No semicolon/timestamp
      'Received: from c by d with SMTP; Sat, 12 Sep 2026 10:15:00 +0000',
      'From: user@example.com',
      'Subject: Missing timestamp test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    assert.equal(tx.latencies.length, 1);
    assert.equal(tx.latencies[0].status, 'unavailable');
    assert.equal(tx.latencies[0].seconds, null);
    assert.equal(tx.findings.some((f) => f.id === 'NEGATIVE_TRANSMISSION_LATENCY'), false);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 17: Multiple IPs and hostname evidence preservation
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 17: Multiple IPs and hostname evidence preservation', () => {
    const raw = [
      'Received: from relay.net ([192.0.2.1] [198.51.100.2]) by mx.com ([203.0.113.3]); Sat, 12 Sep 2026 10:00:00 +0000',
      'From: user@example.com',
      'Subject: Multiple IP preservation test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const hop = result.data.transmission.hops[0];
    assert.equal(hop.ips.length, 3);
    assert.equal(hop.ips.some((ip) => ip.address === '192.0.2.1'), true);
    assert.equal(hop.ips.some((ip) => ip.address === '198.51.100.2'), true);
    assert.equal(hop.ips.some((ip) => ip.address === '203.0.113.3'), true);
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 18: Offline verification (no network/DNS calls)
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 18: Offline verification (no network/DNS calls)', () => {
    assert.equal(classifyIp('192.168.1.1', 4), 'private');
    assert.equal(classifyIp('10.0.0.1', 4), 'private');
    assert.equal(classifyIp('172.20.0.1', 4), 'private');
    assert.equal(classifyIp('127.0.0.1', 4), 'loopback');
    assert.equal(classifyIp('169.254.1.1', 4), 'link-local');
    assert.equal(classifyIp('8.8.8.8', 4), 'public');
    assert.equal(classifyIp('::1', 6), 'loopback');
    assert.equal(classifyIp('fe80::1', 6), 'link-local');
    assert.equal(classifyIp('2001:db8::1', 6), 'public');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 19: Malformed timestamp error detection
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 19: Malformed timestamp error detection', () => {
    const raw = [
      'Received: by mx.example.com; DefinitelyNotAValidDateString123',
      'From: user@example.com',
      'Subject: Invalid date test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    const finding = tx.findings.find((f) => f.id === 'RECEIVED_TIMESTAMP_PARSE_ERROR');
    assert.ok(finding);
    assert.equal(finding.evidence.rawTimestamp, 'DefinitelyNotAValidDateString123');
  });

  // ---------------------------------------------------------------------------
  // PHASE 5 - TEST 20: Hop continuity mismatch detection
  // ---------------------------------------------------------------------------
  await runTest('PHASE 5 - TEST 20: Hop continuity mismatch detection', () => {
    const raw = [
      'Received: from completely-unrelated.org by dest.com; Sat, 12 Sep 2026 10:15:30 +0000',
      'Received: from origin.com by relay.trusted.com; Sat, 12 Sep 2026 10:15:20 +0000',
      'From: user@example.com',
      'Subject: Continuity test',
      '',
      'Body'
    ].join('\r\n');

    const result = parseRawEmail(raw);
    const tx = result.data.transmission;
    const finding = tx.findings.find((f) => f.id === 'RECEIVED_HOP_HOST_MISMATCH');
    assert.ok(finding);
    assert.equal(finding.evidence.priorByHost, 'relay.trusted.com');
    assert.equal(finding.evidence.nextFromHost, 'completely-unrelated.org');
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll();
