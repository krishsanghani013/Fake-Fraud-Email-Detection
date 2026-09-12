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
                            ▼
               ┌────────────────────────┐
               │   ARTIFACT EXTRACTOR   │
               │   (emailArtifacts.js)  │
               └────────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
      URLs                 IPs               Domains
(Text, HTML, href)  (IPv4 & IPv6 Valid)   (Subdomains Preserved)
        │
        ▼
URL NORMALIZATION
(:80/:443 port removal,
 lowercase scheme & host)

                            +

                     SENDER DOMAINS
                     ├── From
                     ├── Reply-To
                     └── Return-Path
                            │
                            ▼
                 CANONICAL ARTIFACT MODEL
                            │
                            ▼
          UI INSPECTION VIEW & POST /api/parse-eml
```

---

## 2. Canonical Data Models

### Normalized Email Object (Phase 1)
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
  "artifacts": { ... }
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

### URL Extraction & Normalization
- **Sources**: Plain-text body, HTML body, and HTML `<a href="...">` attributes (tagged with `source: 'html_href'`).
- **Punctuation Handling**: Trims surrounding quotes, angle brackets, parentheses, and trailing sentence punctuation (`.`, `,`, `;`, `:`, `!`, `?`).
- **Normalization**:
  - Lowercases scheme (`http://`, `https://`).
  - Lowercases hostname.
  - Strips default HTTP port `:80` and HTTPS port `:443`.
  - Removes trailing dot from hostname (`example.com.` → `example.com`).
  - Preserves path, query parameters, and fragments verbatim.
- **Deduplication**: Deterministically deduplicates by `normalized` URL while preserving the first observed `original` and `source`.

### IP Address Extraction & Validation
- **Source**: `Received` transmission headers.
- **IPv4 Validation**: Strict octet range validation (`0–255` per octet). Rejects invalid addresses (e.g. `999.999.999.999`) and ordinary numeric sequences.
- **IPv6 Validation**: Validates 16-bit hex groups and compressed `::` syntax. Rejects false positives such as ordinary timestamps (`10:30:45`).
- **Deduplication**: Deduplicated by clean IP address.

### Domain & Sender-Domain Extraction
- **Domains from URLs**: Extracts hostnames, preserving complete subdomains (e.g., `login.accounts.example.com`).
- **Sender Domains**:
  - `from`: Extracted from the `From:` header email address.
  - `replyTo`: Extracted from `Reply-To:` header email addresses.
  - `returnPath`: Extracted from `Return-Path:` header email address.
  - Strictly evidence-based: does NOT infer `Reply-To` from `From` or `Return-Path` from `From`.

---

## 4. Security & Privacy Protections

- **Untrusted Input**: All email contents, HTML, and extracted artifacts are treated as untrusted.
- **No Remote Network Requests**: Zero external HTTP queries, zero DNS lookups, zero VirusTotal/URLhaus lookups.
- **No JavaScript Execution**: HTML emails are never executed in the application DOM or browser context.
- **Zero Hallucination / Speculation**: No risk scores, no threat flags, no malicious badges. Only verifiable artifacts found directly within the email are extracted.

---

## 5. Backend API Route

### `POST /api/parse-eml`
- **Request Body**:
  ```json
  {
    "emlContent": "From: sender@example.com\r\nTo: dest@example.com\r\n\r\nVisit https://example.com:443/login."
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
      "attachments": [ ... ],
      "raw": { "size": 128 },
      "artifacts": {
        "urls": [
          {
            "original": "https://example.com:443/login",
            "normalized": "https://example.com/login",
            "domain": "example.com",
            "source": "body"
          }
        ],
        "ips": [],
        "domains": [
          {
            "original": "example.com",
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
          "replyTo": [],
          "returnPath": []
        }
      }
    },
    "warnings": []
  }
  ```
- **Error Response** (HTTP 400):
  ```json
  {
    "success": false,
    "error": "No email content was provided.",
    "warnings": []
  }
  ```

---

## 6. Test Suite Verification

Run all test suites with:
```bash
npm test
```

### Covered Test Cases (25 Total Assertions):
#### Phase 1: Core RFC 5322 & MIME
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

#### Phase 2: Artifact Extraction & Normalization
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
