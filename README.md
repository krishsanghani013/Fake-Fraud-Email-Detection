# Aegis Forensics — Email Forensics Engine

A standard-compliant, zero-retention RFC 5322 email ingestion, validation, and forensic artifact extraction subsystem.

---

## 1. System Pipeline Architecture

```
                 RAW EMAIL (.eml / Text)
                            │
                            ▼
               ┌────────────────────────┐
               │    INPUT VALIDATION    │
               │   (validateEmailInput) │
               └────────────┬───────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │    RFC 5322 PARSER     │
               │  (Headers, MIME, Body) │
               └────────────┬───────────┘
                            │
                            ▼
                 NORMALIZED EMAIL OBJECT
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐
│ARTIFACT EXTRACTOR││AUTHENTICATION    ││ SENDER IDENTITY  │
│(emailArtifacts.js││  (emailAuth.js)  ││(senderIdentity.js│
└─────────┬────────┘└─────────┬────────┘└─────────┬────────┘
          │                   │                   │
    ┌─────┼─────┐       ┌─────┼─────┐             │
    ▼     ▼     ▼       ▼     ▼     ▼             ▼
  URLs   IPs  Domains  SPF   DKIM  DMARC   CONSISTENCY MATRIX
(Norm.) (v4/6) (Sub.)         │            & FINDINGS LOG
                              ▼            (From vs Reply-To,
                             ARC            Return-Path, SPF,
                                            DKIM, DMARC)
                            │
                            ▼
         CANONICAL OBJECT WITH ALL FORENSIC LAYERS
                            │
                            ▼
          UI INSPECTION VIEW & POST /api/parse-eml
```

---

## 2. Canonical Data Models

### Normalized Email Object (Phase 1, 2, 3 & 4)
Every parsed email produces the exact canonical structure:
```json
{
  "metadata": {
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "cc": [],
    "bcc": [],
    "replyTo": [],
    "returnPath": null,
    "subject": "Test Email",
    "date": "Mon, 10 Aug 2026 10:00:00 +0000",
    "messageId": "<123@example.com>",
    "inReplyTo": null,
    "references": [],
    "mimeVersion": "1.0",
    "contentType": "text/plain",
    "contentTransferEncoding": null
  },
  "headers": {
    "all": [
      { "name": "From", "value": "sender@example.com" },
      { "name": "To", "value": "recipient@example.com" }
    ]
  },
  "body": {
    "text": "Hello world message...",
    "html": ""
  },
  "mime": {
    "contentType": "text/plain",
    "parts": [
      {
        "contentType": "text/plain",
        "contentDisposition": null,
        "contentTransferEncoding": null,
        "filename": null
      }
    ]
  },
  "attachments": [],
  "raw": {
    "size": 1024
  },
  "artifacts": { ... },
  "authentication": { ... },
  "senderIdentity": { ... }
}
```

### Canonical Sender Identity Object (Phase 4)
Located under `data.senderIdentity`:
```json
{
  "identities": {
    "from": {
      "address": "alice@example.com",
      "domain": "example.com",
      "raw": "Alice <alice@example.com>"
    },
    "replyTo": [
      {
        "address": "support@evil.com",
        "domain": "evil.com",
        "raw": "support@evil.com"
      }
    ],
    "returnPath": {
      "address": "bounce@mailer.example.net",
      "domain": "mailer.example.net",
      "raw": "<bounce@mailer.example.net>"
    },
    "spf": [
      {
        "domain": "example.com",
        "source": "Authentication-Results",
        "raw": "mx.example.com; spf=pass smtp.mailfrom=example.com"
      }
    ],
    "dkim": [
      {
        "domain": "example.com",
        "selector": "s1",
        "source": "DKIM-Signature",
        "raw": "v=1; a=rsa-sha256; d=example.com; ..."
      }
    ],
    "dmarc": [
      {
        "headerFrom": "example.com",
        "domain": "example.com",
        "source": "Authentication-Results",
        "raw": "mx.example.com; dmarc=pass header.from=example.com"
      }
    ]
  },
  "comparisons": [
    {
      "type": "from_vs_reply_to",
      "status": "mismatch",
      "sourceA": { "type": "From", "value": "alice@example.com", "domain": "example.com" },
      "sourceB": { "type": "Reply-To", "value": "support@evil.com", "domain": "evil.com" },
      "evidence": { "fromRaw": "Alice <alice@example.com>", "replyToRaw": "support@evil.com" },
      "message": "From domain (example.com) and Reply-To domain (evil.com) do not match."
    }
  ],
  "findings": [
    {
      "id": "FROM_REPLY_TO_DOMAIN_MISMATCH",
      "type": "sender_identity_mismatch",
      "comparison": "from_vs_reply_to",
      "detected": true,
      "sourceA": { "type": "From", "value": "alice@example.com", "domain": "example.com" },
      "sourceB": { "type": "Reply-To", "value": "support@evil.com", "domain": "evil.com" },
      "evidence": { "fromRaw": "Alice <alice@example.com>", "replyToRaw": "support@evil.com" },
      "message": "From domain (example.com) and Reply-To domain (evil.com) do not match."
    }
  ]
}
```

### Canonical Authentication Object (Phase 3)
Located under `data.authentication`:
```json
{
  "authenticationResults": [ ... ],
  "receivedSpf": [ ... ],
  "spf": { "results": [ ... ] },
  "dkim": { "signatures": [ ... ], "results": [ ... ] },
  "dmarc": { "results": [ ... ] },
  "arc": {
    "seals": [ ... ],
    "messageSignatures": [ ... ],
    "authenticationResults": [ ... ]
  }
}
```

### Canonical Artifact Object (Phase 2)
Located under `data.artifacts`:
```json
{
  "urls": [ ... ],
  "ips": [ ... ],
  "domains": [ ... ],
  "senderDomains": {
    "from": ["example.com"],
    "replyTo": ["external.example"],
    "returnPath": ["example.com"]
  }
}
```

---

## 3. Extraction & Normalization Specifications

### Sender Identity & Header Consistency Forensics (Phase 4)
- **Forensic Principle**:
  - Phase 4 performs deterministic sender identity consistency analysis across message headers and authentication records.
  - An observed mismatch is a **forensic finding**, NOT independent proof that an email is malicious or fraudulent. Legitimate mailing lists, transactional relays, and enterprise bounce-handling services routinely exhibit domain variances.
  - Zero risk scoring, zero confidence scores, and zero automated fraud classifications are produced.
- **Exact Normalized Domain Comparison**:
  - Case-insensitive comparison (`toLowerCase()`).
  - Normalizes trailing periods (`example.com.` -> `example.com`).
  - Strict exact-domain rule: does NOT treat subdomains as equivalent (`mail.example.com` != `example.com`).
  - No substring matching or arbitrary domain guessing.
- **Comparisons Performed**:
  1. **From ↔ Reply-To**: Evaluates every Reply-To address independently. Emits `FROM_REPLY_TO_DOMAIN_MISMATCH`.
  2. **From ↔ Return-Path**: Evaluates envelope return path against visible sender. Emits `FROM_RETURN_PATH_DOMAIN_MISMATCH`.
  3. **From ↔ SPF**: Evaluates explicit SPF authenticated domain(s). Emits `FROM_SPF_DOMAIN_MISMATCH`.
  4. **From ↔ DKIM**: Evaluates all DKIM signing domains (`d=`) independently. Emits `FROM_DKIM_DOMAIN_MISMATCH`.
  5. **From ↔ DMARC**: Evaluates DMARC reported `header.from` domain. Emits `FROM_DMARC_HEADER_FROM_MISMATCH`.
- **Missing Data Handling**:
  - When an optional header or authentication domain is absent, the comparison status is recorded as `unavailable`. It is **never** manufactured into a false mismatch.
- **Evidence Traceability**:
  - Every finding links directly back to `fromRaw`, `replyToRaw`, `returnPathRaw`, `spfRaw`, or `dkimRaw`.

### Email Authentication Forensics (Phase 3)
- Strictly extracts reported/observed evidence from email headers without cryptographic verification.
- Parses `Authentication-Results`, `Received-SPF`, `DKIM-Signature`, `DMARC`, and `ARC` chain instances.
- Preserves raw values, supports multiple occurrences, and reconciles conflicting SPF results without picking winners.

### URL Extraction & Normalization (Phase 2)
- Extracts and normalizes URLs from text, HTML, and `<a href="...">` attributes.
- Strips default ports (`:80`, `:443`), cleans trailing sentence punctuation, and lowercases schemes and hostnames.

### IP Address Extraction & Validation (Phase 2)
- Strict octet range validation (`0–255`) for IPv4.
- Validates IPv6 hex groups and compressed syntax while rejecting timestamps.

---

## 4. Security & Forensic Integrity

- **Untrusted Input**: All email contents, headers, and authentication claims are treated as untrusted attacker-controlled data.
- **No Remote Network Requests**: Zero external HTTP queries, zero DNS lookups, zero WHOIS, zero VirusTotal/URLhaus lookups.
- **No Cryptographic Verification**: System audits reported headers and does not perform RSA/Ed25519 signature verification.
- **No Risk Scoring or Fraud Classifications**: No risk scores or malicious verdicts are calculated in Phase 4.
- **No JavaScript Execution**: Email HTML is never executed in the browser context.

---

## 5. Backend API Route

### `POST /api/parse-eml`
- **Request Body**:
  ```json
  {
    "emlContent": "From: sender@example.com\r\nReply-To: support@evil.com\r\n\r\nMessage body"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": {
      "metadata": { ... },
      "headers": { ... },
      "body": { ... },
      "mime": { ... },
      "attachments": [],
      "raw": { "size": 128 },
      "artifacts": { ... },
      "authentication": { ... },
      "senderIdentity": { ... }
    },
    "warnings": []
  }
  ```

---

## 6. Test Suite Verification

Run all test suites with:
```bash
npm test
```

### Covered Test Cases (57 Total Assertions):
#### Phase 1: Core RFC 5322 & MIME (Tests 1–11)
1. Simple plain-text email.
2. HTML email.
3. Multipart/alternative email (extracts text/plain and text/html).
4. Email with attachment metadata (filename, content type, exact base64 decoded size).
5. Email containing folded/multiline headers.
6. Email containing duplicate headers (multiple `Received:` hops).
7. Email using CRLF (`\r\n`) line endings.
8. Email using LF (`\n`) line endings.
9. Email with missing optional headers.
10. Malformed email handling (empty string, headerless input, missing boundary).
11. Backend API route verification (`POST /api/parse-eml`).

#### Phase 2: Artifact Extraction & Normalization (Tests 1–12)
12. Single HTTP URL extraction.
13. HTTPS URL extraction.
14. Multiple distinct URLs extraction.
15. Duplicate URL deduplication between text and HTML.
16. HTML `<a href="...">` extraction with source tagging.
17. URL normalization (default ports 80/443 removal, scheme/host lowercasing, path preservation).
18. IPv4 extraction from `Received` headers.
19. IPv6 extraction from `Received` headers.
20. Sender domains extraction (`From`, `Reply-To`, `Return-Path`).
21. Invalid IP rejection (`999.999.999.999`, timestamp `10:30:45`).
22. Multiple domains with subdomain preservation (`login.example.com`, `mail.example.com`).
23. URL punctuation cleanup (stripping trailing periods and commas).

#### Phase 3: Email Authentication Forensics (Tests 1–15)
24. Authentication-Results SPF PASS detection.
25. SPF FAIL detection.
26. SPF SOFTFAIL preservation.
27. Received-SPF parsing.
28. DKIM Signature tag parsing.
29. DKIM Authentication Result extraction.
30. DMARC result and policy parsing.
31. Multiple Authentication-Results headers preservation.
32. Multiple DKIM Signatures preservation.
33. ARC Chain inspection.
34. Folded Authentication Header unwrapping.
35. Missing Optional Authentication Fields handling.
36. Conflicting SPF Sources preservation.
37. Malformed Authentication Header resilience.
38. Mixed Header Casing case-insensitivity.

#### Phase 4: Sender Identity & Header Consistency (Tests 1–17)
39. **TEST 1 — From and Reply-To same domain**: Evaluates `match`, no mismatch finding.
40. **TEST 2 — From and Reply-To different domains**: Emits `FROM_REPLY_TO_DOMAIN_MISMATCH` with evidence.
41. **TEST 3 — From and Return-Path same domain**: Evaluates `match`, no mismatch finding.
42. **TEST 4 — From and Return-Path different domains**: Emits `FROM_RETURN_PATH_DOMAIN_MISMATCH`.
43. **TEST 5 — From and SPF domain same**: Evaluates `match` against SPF authenticated domain.
44. **TEST 6 — From and SPF domain different**: Emits `FROM_SPF_DOMAIN_MISMATCH`.
45. **TEST 7 — From and DKIM d= same**: Evaluates `match` against DKIM signing domain.
46. **TEST 8 — From and DKIM d= different**: Emits `FROM_DKIM_DOMAIN_MISMATCH`.
47. **TEST 9 — Multiple DKIM signatures evaluated independently**: Preserves independent matches and mismatches.
48. **TEST 10 — Multiple Reply-To addresses evaluated independently**: Evaluates each address without collapsing.
49. **TEST 11 — Case-insensitive domain comparison**: `Example.COM` vs `example.com` -> `match`.
50. **TEST 12 — Trailing-dot domain normalization**: `example.com.` vs `example.com` -> `match`.
51. **TEST 13 — Subdomain mismatch (exact-domain rule)**: `mail.example.com` vs `example.com` -> `mismatch`.
52. **TEST 14 — Missing SPF domain**: Recorded as `unavailable`, NOT a mismatch.
53. **TEST 15 — Missing DKIM domain**: Recorded as `unavailable`, NOT a mismatch.
54. **TEST 16 — From vs DMARC header.from mismatch**: Emits `FROM_DMARC_HEADER_FROM_MISMATCH`.
55. **TEST 17 — Missing From header handled gracefully**: Returns `null` from identity and `unavailable` comparisons without crashing.

