# Controlled EML Forensic Test Suite

This directory contains a suite of 10 realistic, standards-compliant RFC 5322 and MIME `.eml` test fixtures. These fixtures are designed to exercise the email parsing, artifact extraction, authentication analysis, sender identity forensics, transmission hop reconstruction, and deterministic risk engine within the project.

## Safety and Ethical Testing Policy

1. **Authorized Local Testing Only**: All fixtures are static files designed exclusively for offline and local unit/integration test suites.
2. **No Transmission**: These emails are never sent, routed, or transmitted across the public internet.
3. **No Impersonation**: All sender and receiver domains strictly use RFC 2606 reserved top-level domains (`.example`) or purely fictional identifiers (`company.example`, `notify-system.example`). No real organizations, brands, or trademarks are spoofed or impersonated.
4. **Documentation IP Ranges**: All network IP addresses belong to RFC 5737 dedicated documentation/test blocks (`198.51.100.0/24` - TEST-NET-2).
5. **Zero Malicious Payloads**: All attachments contain harmless, human-readable plain-text test data. No executables, scripts, macros, or active exploits are included.
6. **Integrity Preservation**: No production security checks or thresholds have been weakened to accommodate these tests.

---

## Fixture Specifications

### 01 — Legitimate Baseline (`01-legitimate.eml`)
- **Purpose**: Verifies that standard, RFC 5322 compliant email parsing works accurately and establishes a clean, low-risk forensic baseline.
- **Indicators**:
  - Consistent presentation `From` (`alice.smith@company.example`) and envelope `Return-Path` (`alice.smith@company.example`).
  - No `Reply-To` mismatch.
  - Standard headers: `To`, `Subject`, `Date`, `Message-ID`.
  - Normal plain text body (`text/plain`).
  - Passing authentication evidence (`spf=pass`, `dkim=pass`, `dmarc=pass`).
  - No attachments, no suspicious URLs.
- **Expected Forensic Findings**:
  - Full metadata parsed with matching From/Return-Path domains (`company.example`).
  - Single transmission hop extracted from `Received` header with RFC 5737 IP.
  - Authentication results extracted (`spf: pass`, `dkim: pass`, `dmarc: pass`).
  - Sender identity comparisons evaluate to `match` or `unavailable` with zero mismatch findings.
  - Risk engine calculates 0 penalty points.
- **Risk Expectation**: `LOW` (Total score: 0/100).

---

### 02 — Reply-To Mismatch (`02-suspicious-reply-to.eml`)
- **Purpose**: Verifies that sender identity forensics detects when the recipient's reply will be directed to a completely different domain than the visible sender.
- **Indicators**:
  - Presentation `From`: `security@company.example`.
  - Presentation `Reply-To`: `support@different-example.example`.
  - Normal, non-malicious account security wording in the body.
- **Expected Forensic Findings**:
  - Sender identity comparison generates `FROM_REPLY_TO_DOMAIN_MISMATCH`.
  - Extracted identities isolate `company.example` vs `different-example.example`.
  - Risk engine awards +15 points under `sender_identity`.
- **Risk Expectation**: `LOW` (Score: 15/100; thresholds: LOW is 0–19).

---

### 03 — Return-Path Mismatch (`03-return-path-mismatch.eml`)
- **Purpose**: Verifies detection of discrepancies between the RFC 5322 `From` header and the RFC 5321 envelope `Return-Path` bounce destination.
- **Indicators**:
  - Presentation `From`: `billing@company.example`.
  - Envelope `Return-Path`: `bounce@mailer-different.example`.
  - Delivery hop from `mailer.mailer-different.example`.
- **Expected Forensic Findings**:
  - Sender identity comparison generates `FROM_RETURN_PATH_DOMAIN_MISMATCH`.
  - Extracted identities isolate `company.example` vs `mailer-different.example`.
  - Risk engine awards +10 points under `sender_identity`.
- **Risk Expectation**: `LOW` (Score: 10/100; thresholds: LOW is 0–19).

---

### 04 — Suspicious URL Extraction (`04-suspicious-url.eml`)
- **Purpose**: Verifies artifact extraction from HTML email bodies, specifically anchor tags (`<a href="...">`), URLs, and domain extraction.
- **Indicators**:
  - HTML body with anchor tag linking to `https://login-security-test.example/verify-account`.
  - Plain visible text clearly indicating a controlled test.
  - Consistent sender headers.
- **Expected Forensic Findings**:
  - Artifact extraction identifies URL `https://login-security-test.example/verify-account`.
  - Domain extraction isolates `login-security-test.example`.
  - HTML body parsed into `data.body.html`.
- **Risk Expectation**: `LOW` (Score: 0/100 offline; URL threat intel enrichment is evaluated in Phase 7).

---

### 05 — Multi-Hop Transmission Route (`05-multiple-received-hops.eml`)
- **Purpose**: Verifies Received header parsing, chronological ordering (oldest to newest), RFC 5737 IP extraction, timestamp normalization, and positive latency calculation.
- **Indicators**:
  - Multiple `Received` headers:
    - Hop 0: `origin.example` (`198.51.100.25`) to `relay.example` (`198.51.100.50`) at `10:02:00 +0000`.
    - Hop 1: `relay.example` (`198.51.100.50`) to `mx.example` (`198.51.100.100`) at `10:02:15 +0000`.
- **Expected Forensic Findings**:
  - Exactly 2 hops extracted in `transmission.hops` in chronological order.
  - Chronological hop 0 is origin relay; chronological hop 1 is destination relay.
  - Transmission latency between Hop 0 and Hop 1 calculated as +15 seconds.
  - Continuity verified: receiving host of Hop 0 matches sending host of Hop 1 (`relay.example`).
  - Total latency across route: 15 seconds.
- **Risk Expectation**: `LOW` (Score: 0/100; transmission is clean and chronological).

---

### 06 — Authentication Evidence Failures (`06-authentication-failure.eml`)
- **Purpose**: Verifies extraction of explicit authentication failures reported in message headers and evaluates how the deterministic risk engine scores them.
- **Indicators**:
  - `Authentication-Results` reporting `spf=fail`, `dkim=fail`, `dmarc=fail (p=reject)`.
  - `Received-SPF: fail`.
  - Mismatched DKIM domain and From domain.
  - Explicit comments marking headers as synthetic test fixtures.
- **Expected Forensic Findings**:
  - Authentication module extracts explicit `fail` status for SPF, DKIM, and DMARC.
  - Sender identity module detects `FROM_SPF_DOMAIN_MISMATCH` and `FROM_DKIM_DOMAIN_MISMATCH`.
  - Risk engine contributions:
    - `DMARC_FAIL` (+20 pts)
    - `SPF_FAIL` (+15 pts)
    - `DKIM_FAIL` (+15 pts)
    - Identity mismatches (+10 pts each)
  - Total score >= 50.
- **Risk Expectation**: `HIGH` or `CRITICAL` (Score >= 50/100).

---

### 07 — MIME Multipart with Attachment (`07-mime-attachment.eml`)
- **Purpose**: Verifies recursive MIME tree traversal (`multipart/mixed` enclosing `multipart/alternative`), text/html body extraction, attachment detection, and base64 size calculation.
- **Indicators**:
  - `multipart/mixed` structure with boundary delimiter.
  - Inner `multipart/alternative` containing `text/plain` and `text/html` parts.
  - Attached file `security-report-test.txt` encoded in base64.
  - Harmless text content payload.
- **Expected Forensic Findings**:
  - `attachments` array contains exactly 1 item.
  - Attachment filename: `security-report-test.txt`.
  - Content type: `text/plain`.
  - Content disposition: `attachment`.
  - Size calculated accurately from base64 payload length.
  - Both text and HTML body parts extracted into `data.body`.
- **Risk Expectation**: `LOW` (Score: 0/100; benign attachment without header anomalies).

---

### 08 — HTML Phishing Simulation (`08-html-phishing.eml`)
- **Purpose**: Demonstrates co-occurrence of multiple independent indicators: urgent psychological trigger language, suspicious sender domain, Reply-To redirection, and simulated verification link.
- **Indicators**:
  - Urgent wording: "URGENT ACTION REQUIRED", "24 Hours", "immediate account suspension".
  - Fictional sender: `security-alert@notify-system.example`.
  - Reply-To redirection: `credential-collector@different-receiver.example`.
  - Styled HTML button linking to `https://login-security-test.example/verify-account`.
- **Expected Forensic Findings**:
  - `FROM_REPLY_TO_DOMAIN_MISMATCH` detected (+15 pts).
  - URL `https://login-security-test.example/verify-account` and domain extracted.
  - Sender domains extracted for all addresses.
  - HTML body parsed completely.
- **Risk Expectation**: `LOW` / `MEDIUM` (Base deterministic score: 15/100 from Reply-To mismatch; higher risk when enriched).

---

### 09 — Header Structure Anomalies (`09-header-anomaly.eml`)
- **Purpose**: Tests parser resilience against RFC 5322 header anomalies: folded continuation lines, duplicate headers, unusual header ordering, and mixed casing.
- **Indicators**:
  - Multiline folded header `X-Folded-Header` with leading whitespace.
  - Duplicate `X-Spam-Status` headers.
  - Multiple `Received` headers.
  - Non-standard order (`Subject` and `Message-ID` before `From`).
  - Mixed-case header name: `x-CuSToM-TrAcKeR`.
  - Omitted optional `Date` header.
- **Expected Forensic Findings**:
  - Parser succeeds (`success: true`) without throwing errors.
  - `X-Folded-Header` is unfolded into a single continuous value.
  - Both duplicate `X-Spam-Status` headers are preserved in `headers.all`.
  - Custom header `x-CuSToM-TrAcKeR` is captured.
  - Metadata `subject`, `messageId`, `from`, `to` correctly mapped regardless of header line order.
- **Risk Expectation**: `LOW` (Score: 0/100; syntactically compliant anomalies do not incur false risk points).

---

### 10 — Combined Multi-Vector High Risk (`10-combined-high-risk.eml`)
- **Purpose**: Exercises all forensic layers concurrently to verify that authentication failures, sender identity discrepancies, transmission continuity anomalies, suspicious links, and urgent language compound correctly into a high forensic risk result.
- **Indicators**:
  - Presentation `From`: `security-dept@compromised-host.example`.
  - Presentation `Reply-To`: `credential-drop@external-exfil.example` (Mismatch).
  - Envelope `Return-Path`: `bounce@unrelated-sender.example` (Mismatch).
  - Simulated authentication failures: `spf=fail`, `dkim=fail`, `dmarc=fail (policy=reject)`.
  - Transmission discrepancy: Hop 0 received by `rogue-proxy.example`, but subsequent Hop 1 reports receiving from `evil-relay.example` (`RECEIVED_HOP_HOST_MISMATCH`).
  - HTML lure with link to `https://login-security-test.example/emergency-auth`.
  - Harmless base64 attachment `audit-evidence-test.txt`.
  - High-urgency directive wording.
- **Expected Forensic Findings**:
  - Multiple forensic findings detected simultaneously across categories:
    - Authentication: `DMARC_FAIL`, `SPF_FAIL`, `DKIM_FAIL`.
    - Sender Identity: `FROM_REPLY_TO_DOMAIN_MISMATCH`, `FROM_RETURN_PATH_DOMAIN_MISMATCH`, `FROM_SPF_DOMAIN_MISMATCH`, `FROM_DKIM_DOMAIN_MISMATCH`.
    - Transmission: `RECEIVED_HOP_HOST_MISMATCH`.
  - Risk score reaches maximum bounded ceiling (100/100).
  - Risk level evaluated as `CRITICAL`.
  - Significantly higher risk than the legitimate baseline (`01-legitimate.eml`).
- **Risk Expectation**: `CRITICAL` (Score: 100/100).

---

## Test-Case Forensic Matrix

| # | Fixture File | Main Forensic Capability | Primary Forensic Finding(s) | Expected Risk Score & Level |
|---|---|---|---|---|
| **01** | `01-legitimate.eml` | Clean Baseline Parsing | No mismatches; passing SPF/DKIM/DMARC | `0` (`LOW`) |
| **02** | `02-suspicious-reply-to.eml` | Reply-To Forensics | `FROM_REPLY_TO_DOMAIN_MISMATCH` (+15) | `15` (`LOW`) |
| **03** | `03-return-path-mismatch.eml` | Return-Path Forensics | `FROM_RETURN_PATH_DOMAIN_MISMATCH` (+10) | `10` (`LOW`) |
| **04** | `04-suspicious-url.eml` | HTML Artifact Extraction | Extracted URL & domain artifact | `0` (`LOW`) (Offline) |
| **05** | `05-multiple-received-hops.eml` | Hop & Latency Analysis | 2 chronological hops; +15s latency; RFC 5737 IPs | `0` (`LOW`) |
| **06** | `06-authentication-failure.eml` | Auth Failure Scoring | `DMARC_FAIL`, `SPF_FAIL`, `DKIM_FAIL` (+50+) | `>= 50` (`HIGH` / `CRITICAL`) |
| **07** | `07-mime-attachment.eml` | MIME & Attachment Parser | 1 attachment extracted with valid size & MIME type | `0` (`LOW`) |
| **08** | `08-html-phishing.eml` | Phishing Lure Multi-Indicator | `FROM_REPLY_TO_DOMAIN_MISMATCH`, extracted URL, HTML body | `15` (`LOW` / `MEDIUM`) |
| **09** | `09-header-anomaly.eml` | Header Resilience | Unfolded headers; duplicate headers preserved | `0` (`LOW`) |
| **10** | `10-combined-high-risk.eml` | Multi-Vector Compound Engine | Auth fails + Identity mismatches + Hop discrepancy | `100` (`CRITICAL`) |

---

## How to Run the Tests

Run the complete EML fixture test suite:
```bash
node test/emlFixtures.test.mjs
```

Or via npm:
```bash
npm run test:eml
```

Run all project test suites (EML fixtures + Core parser + AI inspect + Dual-matrix content detection):
```bash
npm test
```
