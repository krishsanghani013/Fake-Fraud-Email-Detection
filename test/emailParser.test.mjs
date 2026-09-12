import assert from 'node:assert/strict';
import { parseRawEmail, validateEmailInput } from '../src/lib/emailParser.js';
import { POST } from '../src/app/api/parse-eml/route.js';

console.log('====================================================');
console.log('RUNNING PHASE 1 RFC 5322 & MIME PARSER TEST SUITE');
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
    assert.equal(att.size, 18); // Exact determinable base64 decoded byte length
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

    // Empty rejection
    const emptyReq = new Request('http://localhost:3000/api/parse-eml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emlContent: '' })
    });
    const emptyRes = await POST(emptyReq);
    assert.equal(emptyRes.status, 400);
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAll();
