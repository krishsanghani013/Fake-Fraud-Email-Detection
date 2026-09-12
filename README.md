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
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌────────────────────────┐     ┌────────────────────────┐
│   ARTIFACT EXTRACTOR   │     │ AUTHENTICATION FORENSIC│
│   (emailArtifacts.js)  │     │   (emailAuth.js)       │
└───────────┬────────────┘     └───────────┬────────────┘
            │                              │
    ┌───────┼───────┐              ┌───────┼───────┐
    ▼       ▼       ▼              ▼       ▼       ▼
  URLs     IPs   Domains          SPF    DKIM    DMARC
(Norm.)  (v4/v6) (Subdomains)              │
                                           ▼
                                          ARC

                            │
                            ▼
         CANONICAL OBJECT WITH ARTIFACTS & AUTHENTICATION
                            │
                            ▼
          UI INSPECTION VIEW & POST /api/parse-eml
```

---

## 2. Canonical Data Models

### Normalized Email Object (Phase 1, 2 & 3)
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
  "authentication": { ... }
}
```

### Canonical Authentication Object (Phase 3)
Located under `data.authentication`:
```json
{
  "authenticationResults": [
    {
      "server": "mx.example.com",
      "raw": "mx.example.com; spf=pass smtp.mailfrom=example.com; dkim=pass header.d=example.com; dmarc=pass header.from=example.com",
      "spf": {
        "result": "pass",
        "rawResult": "pass",
        "mailFrom": "example.com",
        "domain": "example.com"
      },
      "dkim": {
        "result": "pass",
        "rawResult": "pass",
        "headerD": "example.com",
        "domain": "example.com"
      },
      "dmarc": {
        "result": "pass",
        "rawResult": "pass",
        "headerFrom": "example.com",
        "domain": "example.com"
      },
      "arc": null
    }
  ],
  "receivedSpf": [
    {
      "result": "pass",
      "rawResult": "pass",
      "clientIp": "203.0.113.10",
      "domain": "example.com",
      "raw": "pass (domain of example.com designates 203.0.113.10 as permitted sender) client-ip=203.0.113.10;"
    }
  ],
  "spf": {
    "results": [ ... ]
  },
  "dkim": {
    "signatures": [
      {
        "version": "1",
        "algorithm": "rsa-sha256",
        "canonicalization": { "header": "relaxed", "body": "relaxed" },
        "domain": "example.com",
        "selector": "selector1",
        "signedHeaders": ["from", "to", "subject", "date"],
        "bodyHash": "abc123==",
        "signature": "sig==",
        "raw": "v=1; a=rsa-sha256; ..."
      }
    ],
    "results": [ ... ]
  },
  "dmarc": {
    "results": [ ... ]
  },
  "arc": {
    "seals": [
      {
        "instance": 1,
        "algorithm": "rsa-sha256",
        "cv": "none",
        "domain": "example.com",
        "selector": "arc1",
        "signature": "sig==",
        "raw": "i=1; a=rsa-sha256; cv=none; ..."
      }
    ],
    "messageSignatures": [
      {
        "instance": 1,
        "algorithm": "rsa-sha256",
        "domain": "example.com",
        "selector": "arc1",
        "raw": "i=1; a=rsa-sha256; ..."
      }
    ],
    "authenticationResults": [
      {
        "instance": 1,
        "server": "mx.example.com",
        "spf": { "result": "pass" },
        "dkim": { "result": "pass" },
        "dmarc": { "result": "pass" },
        "raw": "i=1; mx.example.com; ..."
      }
    ]
  }
}
```

### Canonical Artifact Object (Phase 2)
Located under `data.artifacts`:
```json
{
  "urls": [
    {
      "original": "HTTPS://Example.COM:443/Login.",
      "normalized": "https://example.com/Login",
      "domain": "example.com",
      "source": "html_href"
    }
  ],
  "ips": [
    {
      "address": "203.0.113.10",
      "version": 4,
      "source": "received_header"
    },
    {
      "address": "2001:db8::1",
      "version": 6,
      "source": "received_header"
    }
  ],
  "domains": [
    {
      "original": "Example.COM",
      "normalized": "example.com",
      "source": "url"
    },
    {
      "original": "example.com",
      "normalized": "example.com",
      "source": "sender"
    }
  ],
  "senderDomains": {
    "from": ["example.com"],
    "replyTo": ["external.example"],
    "returnPath": ["example.com"]
  }
}
```

---

## 3. Extraction & Normalization Specifications

### Email Authentication Forensics (Phase 3)
- **Observed vs Verified Principle**:
  - The module strictly extracts **reported/observed evidence** from email headers.
  - It does NOT perform cryptographic verification, DNS lookups, or external reputation calls.
  - Observed headers (like `Authentication-Results: spf=pass`) are attacker-controlled input and clearly demarcated as *Reported by Message Headers (Unverified)*.
- **Authentication-Results**:
  - Parsed case-insensitively across multiple occurrences without overwriting.
  - Extracts server/receiver, SPF result, DKIM result, DMARC result, ARC result, and all associated tags (`smtp.mailfrom`, `header.d`, `header.s`, `header.from`, `policy`).
  - Missing fields remain `null` or omitted; no fields are fabricated.
- **SPF & Received-SPF Reconciliation**:
  - Supports standard SPF states: `pass`, `fail`, `softfail`, `neutral`, `none`, `temperror`, `permerror`, and unknown values.
  - Never collapses `softfail` into `fail`.
  - Both `Authentication-Results` and `Received-SPF` are retained in `spf.results: []`. If values conflict (e.g. one reports `pass` while another reports `fail`), both are preserved for future deterministic rule evaluation.
- **DKIM Signatures vs. DKIM Results**:
  - Strict separation: `DKIM-Signature` (structural signature metadata in message) is stored under `dkim.signatures`, while verifier reports in `Authentication-Results` are stored under `dkim.results`.
  - Parses canonicalization (`header`/`body`), selector `s=`, domain `d=`, algorithm `a=`, signed headers `h=`, body hash `bh=`, and signature `b=`.
- **DMARC Forensics**:
  - Extracts result (`pass`, `fail`, `none`, `temperror`, `permerror`), `headerFrom`, `domain`, and explicit `policy` (`none`, `quarantine`, `reject`).
  - Does NOT infer `policy=reject` from `result=fail` unless explicitly stated.
  - Does NOT infer `headerFrom` from `metadata.from`.
- **ARC (Authenticated Received Chain)**:
  - Preserves instances `i=1, 2, ...` across `ARC-Seal`, `ARC-Message-Signature`, and `ARC-Authentication-Results`.
  - Parses seal CV (`cv=none`, `cv=pass`, `cv=fail`), selector, domain, and message signatures without cryptographic verification.

### URL Extraction & Normalization (Phase 2)
- **Sources**: Plain-text body, HTML body, and HTML `<a href="...">` attributes (tagged with `source: 'html_href'`).
- **Punctuation Handling**: Trims surrounding quotes, angle brackets, parentheses, and trailing sentence punctuation (`.`, `,`, `;`, `:`, `!`, `?`).
- **Normalization**:
  - Lowercases scheme (`http://`, `https://`).
  - Lowercases hostname.
  - Strips default HTTP port `:80` and HTTPS port `:443`.
  - Removes trailing dot from hostname (`example.com.` → `example.com`).
  - Preserves path, query parameters, and fragments verbatim.
- **Deduplication**: Deterministically deduplicates by `normalized` URL while preserving the first observed `original` and `source`.

### IP Address Extraction & Validation (Phase 2)
- **Source**: `Received` transmission headers.
- **IPv4 Validation**: Strict octet range validation (`0–255` per octet). Rejects invalid addresses (e.g. `999.999.999.999`) and ordinary numeric sequences.
- **IPv6 Validation**: Validates 16-bit hex groups and compressed `::` syntax. Rejects false positives such as ordinary timestamps (`10:30:45`).
- **Deduplication**: Deduplicated by clean IP address.

### Domain & Sender-Domain Extraction (Phase 2)
- **Domains from URLs**: Extracts hostnames, preserving complete subdomains (e.g., `login.accounts.example.com`).
- **Sender Domains**:
  - `from`: Extracted from the `From:` header email address.
  - `replyTo`: Extracted from `Reply-To:` header email addresses.
  - `returnPath`: Extracted from `Return-Path:` header email address.
  - Strictly evidence-based: does NOT infer `Reply-To` from `From` or `Return-Path` from `From`.

---

## 4. Security & Forensic Integrity

- **Untrusted Input**: All email contents, headers, and authentication claims are treated as untrusted attacker-controlled data.
- **No Remote Network Requests**: Zero external HTTP queries, zero DNS lookups, zero WHOIS, zero VirusTotal/URLhaus lookups.
- **No Cryptographic Verification**: The system does NOT pretend to cryptographically verify SPF, DKIM, DMARC, or ARC signatures offline. It strictly audits reported evidence.
- **No Risk Scoring or Fraud Classifications**: No risk scores, confidence points, or malicious verdicts are calculated in Phase 3.
- **No JavaScript Execution**: HTML emails are never executed in the application DOM or browser context.

---

## 5. Backend API Route

### `POST /api/parse-eml`
- **Request Body**:
  ```json
  {
    "emlContent": "From: sender@example.com\r\nAuthentication-Results: mx.example.com; spf=pass\r\n\r\nVisit https://example.com"
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
      "authentication": { ... }
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

### Covered Test Cases (40 Total Assertions):
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
24. **TEST 1 — Authentication-Results SPF PASS**: Detects Authentication-Results header, extracts SPF result (`pass`), `mailfrom`, and `domain`.
25. **TEST 2 — SPF FAIL**: Extracts `spf=fail` and preserves failed state.
26. **TEST 3 — SPF SOFTFAIL**: Verifies `softfail` is preserved exactly and not converted to `fail`.
27. **TEST 4 — Received-SPF**: Parses `Received-SPF` header for result (`pass`), client IP (`203.0.113.10`), and domain.
28. **TEST 5 — DKIM Signature**: Parses structured tags (`v`, `a`, `c`, `d`, `s`, `h`, `bh`, `b`) and canonicalization.
29. **TEST 6 — DKIM Authentication Result**: Extracts reported verifier outcome (`dkim=pass`), `header.d`, and `header.s`.
30. **TEST 7 — DMARC**: Extracts DMARC result (`fail`), `header.from` domain, and explicit `policy=reject`.
31. **TEST 8 — Multiple Authentication-Results**: Preserves multiple distinct `Authentication-Results` headers.
32. **TEST 9 — Multiple DKIM Signatures**: Preserves multiple distinct `DKIM-Signature` headers.
33. **TEST 10 — ARC**: Parses `ARC-Seal`, `ARC-Message-Signature`, and `ARC-Authentication-Results` with instance `i=1`.
34. **TEST 11 — Folded Authentication Header**: Correctly unwraps folded multiline `Authentication-Results` and extracts SPF, DKIM, and DMARC.
35. **TEST 12 — Missing Optional Authentication Fields**: Verifies missing fields remain `null`/empty without inventing values.
36. **TEST 13 — Conflicting SPF Sources**: Preserves both `Authentication-Results` (`pass`) and `Received-SPF` (`fail`) without choosing one.
37. **TEST 14 — Malformed Authentication Header**: Resilient against malformed syntax; preserves raw evidence without crashing.
38. **TEST 15 — Mixed Header Casing**: Case-insensitive detection for `authentication-results:`, `received-spf:`, and `dkim-signature:`.

