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
import { POST } from '../src/app/api/parse-eml/route.js';

console.log('====================================================');
console.log('RUNNING PHASE 1 & 2 PARSER AND ARTIFACT TEST SUITE');
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
