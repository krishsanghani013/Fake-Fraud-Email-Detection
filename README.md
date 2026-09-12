# Aegis Forensics — Phase 1: Core Email Ingestion & RFC 5322 Parsing

A standard-compliant, zero-retention RFC 5322 email ingestion, validation, and parsing subsystem for email forensics.

---

## 1. Parser Architecture

```
RAW EMAIL (.eml / Text)
         ↓
  INPUT VALIDATION (validateEmailInput)
         ↓
RFC 5322 HEADER PARSING (CRLF/LF, Unfolding, Duplicate Preservation)
         ↓
  HEADER EXTRACTION (From, To, Subject, Date, Message-ID, etc.)
         ↓
  MIME STRUCTURE PARSING (multipart/mixed, multipart/alternative, multipart/related)
         ↓
  BODY & ATTACHMENT METADATA EXTRACTION
         ↓
NORMALIZED EMAIL OBJECT
         ↓
FRONTEND INSPECTION UI & BACKEND API (POST /api/parse-eml)
```

- **Standards Adherence**: Parses strictly according to RFC 5322. Unfolds continuation lines starting with spaces or tabs. Supports both `\r\n` (CRLF) and `\n` (LF) line delimiters.
- **Privacy & Security**: Zero third-party network requests. Operates locally in client memory and standard backend runtime. Never executes scripts in HTML content.
- **No Speculative Data**: Does not invent threat intelligence, risk scores, or AI classifications in Phase 1. Every extracted value originates solely from the user's provided email.

---

## 2. Canonical Normalized Email Object

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
  "attachments": [
    {
      "filename": "invoice.pdf",
      "contentType": "application/pdf",
      "size": 18,
      "contentDisposition": "attachment"
    }
  ],
  "raw": {
    "size": 1024
  }
}
```

---

## 3. Supported Headers & MIME Structures

### Extracted Headers
- `From`, `To` (array), `Cc` (array), `Bcc` (array), `Reply-To` (array), `Return-Path`
- `Subject`, `Date`, `Message-ID`, `In-Reply-To`, `References` (array)
- `MIME-Version`, `Content-Type`, `Content-Transfer-Encoding`
- `headers.all`: Complete list of all original header `{ name, value }` pairs in original order, including duplicate headers such as multiple `Received` hops.

### Supported MIME Structures
- `text/plain`
- `text/html`
- `multipart/mixed`
- `multipart/alternative`
- `multipart/related`
- Nested multi-level container structures.

---

## 4. Error Handling & Validation

- **Input Validation**: Rejects empty strings, whitespace, or strings lacking recognizable email headers with clear error messages (`{ success: false, error: "..." }`).
- **Partial/Malformed Emails**: Safely extracts readable headers and body; flags missing boundaries with non-crashing warnings (`warnings: [...]`).
- **No Stack Traces**: API and UI return sanitized error summaries without exposing server internals.

---

## 5. Backend API Route

### `POST /api/parse-eml`
- **Request Body**:
  ```json
  {
    "emlContent": "From: sender@example.com\r\nTo: dest@example.com\r\n\r\nHello"
  }
  ```
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": { ... },
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

## 6. Test Suite (10 Deterministic Cases)

Run the test suite with:
```bash
npm test
```

### Covered Test Cases:
1. **TEST 1**: Simple plain-text email.
2. **TEST 2**: HTML email.
3. **TEST 3**: Multipart/alternative email (extracts text/plain and text/html).
4. **TEST 4**: Email with attachment metadata (filename, content type, exact base64 decoded size).
5. **TEST 5**: Email containing folded/multiline headers.
6. **TEST 6**: Email containing duplicate headers (e.g. multiple `Received:` hops).
7. **TEST 7**: Email using CRLF (`\r\n`) line endings.
8. **TEST 8**: Email using LF (`\n`) line endings.
9. **TEST 9**: Email with missing optional headers.
10. **TEST 10**: Malformed email handling (empty string, headerless input, missing boundary).
11. **TEST 11**: Backend API route verification (`POST /api/parse-eml`).
