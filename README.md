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
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│ARTIFACT EXTRACTOR││AUTHENTICATION    ││ SENDER IDENTITY  ││MAIL TRANSMISSION │
│(emailArtifacts.js││  (emailAuth.js)  ││(senderIdentity.js││(emailTransmission│
└─────────┬────────┘└─────────┬────────┘└─────────┬────────┘└─────────┬────────┘
          │                   │                   │                   │
    ┌─────┼─────┐       ┌─────┼─────┐             │             ┌─────┼─────┐
    ▼     ▼     ▼       ▼     ▼     ▼             ▼             ▼     ▼     ▼
  URLs   IPs  Domains  SPF   DKIM  DMARC   CONSISTENCY MATRIX  HOPS LATENCY ANOMALIES
(Norm.) (v4/6) (Sub.)         │            & FINDINGS LOG     (0->N) (Sec.) (Negative/
                              ▼            (From vs Reply-To,                Mismatch)
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

### Normalized Email Object (Phase 1, 2, 3, 4 & 5)
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
      { "name": "To", "value": "recipient@example.com" },
      { "name": "Received", "value": "from mail.example.com by mx.example.net; ..." }
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
  "senderIdentity": { ... },
  "transmission": { ... }
}
```

### Canonical Transmission Object (Phase 5)
Located under `data.transmission`:
```json
{
  "received": [
    {
      "headerIndex": 0,
      "chronologicalIndex": 1,
      "raw": "from relay.net by mx.dest.com with ESMTPS id XYZ789; Sat, 12 Sep 2026 10:15:30 +0000",
      "from": {
        "host": "relay.net",
        "ip": null,
        "raw": "relay.net"
      },
      "by": {
        "host": "mx.dest.com",
        "ip": null,
        "raw": "mx.dest.com with ESMTPS id XYZ789"
      },
      "with": "ESMTPS",
      "id": "XYZ789",
      "for": null,
      "timestamp": {
        "raw": "Sat, 12 Sep 2026 10:15:30 +0000",
        "normalized": "2026-09-12T10:15:30.000Z"
      },
      "ips": []
    }
  ],
  "hops": [
    {
      "headerIndex": 1,
      "chronologicalIndex": 0,
      "raw": "from origin.com ([198.51.100.25]) by relay.net with ESMTP; Sat, 12 Sep 2026 10:15:15 +0000",
      "from": {
        "host": "origin.com",
        "ip": "198.51.100.25",
        "raw": "origin.com ([198.51.100.25])"
      },
      "by": {
        "host": "relay.net",
        "ip": null,
        "raw": "relay.net with ESMTP"
      },
      "with": "ESMTP",
      "id": null,
      "for": null,
      "timestamp": {
        "raw": "Sat, 12 Sep 2026 10:15:15 +0000",
        "normalized": "2026-09-12T10:15:15.000Z"
      },
      "ips": [
        {
          "address": "198.51.100.25",
          "version": 4,
          "type": "public"
        }
      ]
    },
    {
      "headerIndex": 0,
      "chronologicalIndex": 1,
      "raw": "from relay.net by mx.dest.com with ESMTPS id XYZ789; Sat, 12 Sep 2026 10:15:30 +0000",
      "from": {
        "host": "relay.net",
        "ip": null,
        "raw": "relay.net"
      },
      "by": {
        "host": "mx.dest.com",
        "ip": null,
        "raw": "mx.dest.com with ESMTPS id XYZ789"
      },
      "with": "ESMTPS",
      "id": "XYZ789",
      "for": null,
      "timestamp": {
        "raw": "Sat, 12 Sep 2026 10:15:30 +0000",
        "normalized": "2026-09-12T10:15:30.000Z"
      },
      "ips": []
    }
  ],
  "latencies": [
    {
      "fromHopIndex": 0,
      "toHopIndex": 1,
      "fromHeaderIndex": 1,
      "toHeaderIndex": 0,
      "fromTimestamp": "2026-09-12T10:15:15.000Z",
      "toTimestamp": "2026-09-12T10:15:30.000Z",
      "seconds": 15,
      "status": "valid"
    }
  ],
  "findings": [],
  "summary": {
    "hopCount": 2,
    "ipCount": 1,
    "timestampCount": 2,
    "totalLatencySeconds": 15
  }
}
```

### Canonical Sender Identity Object (Phase 4)
Located under `data.senderIdentity`:
```json
{
  "identities": { ... },
  "comparisons": [ ... ],
  "findings": [ ... ]
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
  "arc": { ... }
}
```

### Canonical Artifact Object (Phase 2)
Located under `data.artifacts`:
```json
{
  "urls": [ ... ],
  "ips": [ ... ],
  "domains": [ ... ],
  "senderDomains": { ... }
}
```

---

## 3. Extraction & Normalization Specifications

### Header Transmission & Hop Analysis (Phase 5)
- **Forensic Principle**:
  - Phase 5 analyzes server-reported `Received:` headers as **observed transport evidence**. It does not independently verify the identity or physical location of any server or IP address.
  - Received headers represent claims made by MTAs along the transmission route. Observed inconsistencies (such as negative latency or host discrepancies) are recorded as deterministic findings and NOT proof of forgery or maliciousness.
- **Header Ordering & Chronological Hop Reconstruction**:
  - As messages travel across the Internet, each receiving MTA prepends a `Received:` header to the top of the message.
  - Consequently, the topmost header (Header Index 0) is the newest hop (final destination), while the bottommost header (Header Index N-1) is the oldest hop (originating or earliest recorded MTA).
  - Chronological path: Hop 0 (oldest origin) -> Hop 1 -> Hop N-1 (newest destination).
- **Component Parsing per Hop**:
  - `from`: Hostname, explicit IP address, and raw clause.
  - `by`: Receiving MTA hostname, IP address, and raw clause.
  - `with`: Transmission protocol (`ESMTPS`, `ESMTP`, `SMTP`, `HTTP`).
  - `id`: MTA message queue identifier.
  - `for`: Recipient envelope address (`<user@example.com>`).
  - `timestamp`: Original raw string and ISO 8601 normalized representation.
  - `ips`: All valid IPv4 and IPv6 addresses extracted from the hop.
- **Local IP Classification**:
  - Purely local, offline classification: `private` (RFC 1918 / ULA), `loopback` (127.0.0.0/8, ::1), `link-local` (169.254.0.0/16, fe80::/10), `unspecified`, and `public`. Zero external queries.
- **Latency & Anomaly Detection**:
  - **Positive Latency**: Normal transit delay in seconds between consecutive chronological hops.
  - **`NEGATIVE_TRANSMISSION_LATENCY`**: Triggered when a subsequent hop reports an earlier timestamp than the preceding hop (typically indicating server clock skew).
  - **`RECEIVED_TIMESTAMP_PARSE_ERROR`**: Triggered when a timestamp clause fails standard date parsing.
  - **`RECEIVED_HOP_HOST_MISMATCH`**: Triggered when the receiving MTA of hop N does not match the reporting sender of hop N+1.
- **Missing Data Handling**:
  - Missing timestamps or optional clauses result in `status: 'unavailable'` and do NOT trigger false anomaly findings.

### Sender Identity & Header Consistency Forensics (Phase 4)
- Deterministic sender identity comparisons across `From`, `Reply-To`, `Return-Path`, `SPF`, `DKIM`, and `DMARC`.
- Emits stable finding IDs (`FROM_REPLY_TO_DOMAIN_MISMATCH`, etc.) without risk scoring.

### Email Authentication Forensics (Phase 3)
- Strictly extracts reported/observed evidence from email headers without cryptographic verification.
- Parses `Authentication-Results`, `Received-SPF`, `DKIM-Signature`, `DMARC`, and `ARC` chain instances.

### URL & IP Extraction (Phase 2)
- Normalizes URLs (:80/:443 port removal, scheme lowercasing) and validates IPv4/IPv6 ranges strictly.

---

## 4. Security & Forensic Integrity

- **Untrusted Input**: All email contents, headers, and authentication claims are treated as untrusted attacker-controlled data.
- **Zero Network Calls**: Zero external HTTP queries, zero DNS lookups, zero reverse DNS, zero WHOIS, zero GeoIP, zero VirusTotal/URLhaus lookups.
- **No Cryptographic Verification**: System audits reported headers and does not perform RSA/Ed25519 signature verification.
- **No AI / LLM Classification**: 100% deterministic logic; Gemini / LLM models are not utilized.
- **No Risk Scoring or Fraud Classifications**: No risk scores or malicious verdicts are calculated.
- **No JavaScript Execution**: Email HTML is never executed in the browser context.

---

## 5. Backend API Route

### `POST /api/parse-eml`
- **Request Body**:
  ```json
  {
    "emlContent": "Received: from mail.example.com by mx.dest.com; Sat, 12 Sep 2026 10:00:00 +0000\r\nFrom: sender@example.com\r\n\r\nMessage body"
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
      "senderIdentity": { ... },
      "transmission": { ... }
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

### Covered Test Cases (77 Total Assertions):
#### Phase 1: Core RFC 5322 & MIME (Tests 1–11)
1. Simple plain-text email.
2. HTML email.
3. Multipart/alternative email.
4. Email with attachment metadata.
5. Folded/multiline headers.
6. Duplicate headers (multiple `Received:` hops).
7. CRLF line endings.
8. LF line endings.
9. Missing optional headers.
10. Malformed email handling (empty string, headerless input, missing boundary).
11. Backend API route verification (`POST /api/parse-eml`).

#### Phase 2: Artifact Extraction & Normalization (Tests 1–12)
12. Single HTTP URL extraction.
13. HTTPS URL extraction.
14. Multiple distinct URLs extraction.
15. Duplicate URL deduplication between text and HTML.
16. HTML `<a href="...">` extraction with source tagging.
17. URL normalization (:80/:443 port removal, scheme/host lowercasing).
18. IPv4 extraction from `Received` headers.
19. IPv6 extraction from `Received` headers.
20. Sender domains extraction (`From`, `Reply-To`, `Return-Path`).
21. Invalid IP rejection (`999.999.999.999`, timestamp `10:30:45`).
22. Multiple domains with subdomain preservation (`login.example.com`).
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
39. From and Reply-To same domain.
40. From and Reply-To different domains (`FROM_REPLY_TO_DOMAIN_MISMATCH`).
41. From and Return-Path same domain.
42. From and Return-Path different domains (`FROM_RETURN_PATH_DOMAIN_MISMATCH`).
43. From and SPF domain same.
44. From and SPF domain different (`FROM_SPF_DOMAIN_MISMATCH`).
45. From and DKIM d= same.
46. From and DKIM d= different (`FROM_DKIM_DOMAIN_MISMATCH`).
47. Multiple DKIM signatures evaluated independently.
48. Multiple Reply-To addresses evaluated independently.
49. Case-insensitive domain comparison.
50. Trailing-dot domain normalization.
51. Subdomain mismatch (`mail.example.com` vs `example.com`).
52. Missing SPF domain recorded as `unavailable`.
53. Missing DKIM domain recorded as `unavailable`.
54. From vs DMARC header.from mismatch (`FROM_DMARC_HEADER_FROM_MISMATCH`).
55. Missing From header handled gracefully.

#### Phase 5: Header Transmission & Hop Analysis (Tests 1–20)
56. **TEST 1 — One simple Received header extraction**: Verifies extraction of from, by, with, id.
57. **TEST 2 — Multiple Received headers preserved**: Preserves multiple Received headers without collapsing.
58. **TEST 3 — Folded Received header treated as one**: Multiline folded Received header handled seamlessly.
59. **TEST 4 — Extract from host and IP**: Extracts both host and bracketed IP from `from` clause.
60. **TEST 5 — Extract by host**: Extracts receiving MTA host from `by` clause.
61. **TEST 6 — Extract with protocol**: Extracts protocol (`ESMTPSA`).
62. **TEST 7 — Extract id**: Extracts queue identifier.
63. **TEST 8 — Extract for recipient**: Extracts envelope recipient address.
64. **TEST 9 — Extract IPv4 address from Received**: Strict IPv4 validation within Received header.
65. **TEST 10 — Extract IPv6 address from Received**: Strict bracketed and standalone IPv6 extraction.
66. **TEST 11 — Extract timestamp and normalize to ISO**: Parses RFC date-time into ISO string.
67. **TEST 12 — Received header ordering**: Verifies topmost header is newest (chronological N-1) and bottommost is oldest (chronological 0).
68. **TEST 13 — Construct chronological hop chain**: Verifies hops array is ordered oldest to newest.
69. **TEST 14 — Calculate positive transmission latency**: Calculates transit seconds between consecutive hops.
70. **TEST 15 — Detect negative transmission latency**: Emits `NEGATIVE_TRANSMISSION_LATENCY` for clock skew / backward time.
71. **TEST 16 — Missing timestamp handled gracefully**: Records latency as `unavailable` without false anomalies.
72. **TEST 17 — Multiple IPs and hostname evidence preservation**: Preserves multiple IPs across a single hop.
73. **TEST 18 — Offline verification**: Verifies local IP classification (`private`, `loopback`, `link-local`, `public`).
74. **TEST 19 — Malformed timestamp error detection**: Emits `RECEIVED_TIMESTAMP_PARSE_ERROR` for unparseable date text.
75. **TEST 20 — Hop continuity mismatch detection**: Emits `RECEIVED_HOP_HOST_MISMATCH` when prior `by` and next `from` hosts disagree.

