export const SAMPLE_SCANS = {
  'ceo-wire-fraud': {
    id: 'scan-89421',
    scanTimestamp: '2026-09-12T08:45:12Z',
    senderEmail: 'ceo-office@sec-apple-verify.com',
    senderName: 'Tim Cook (Urgent Executive)',
    recipientEmail: 'finance-lead@corp-internal.com',
    subject: 'URGENT: Confidential Acquisition Wire Transfer - Immediate Action Required',
    riskScore: 96,
    riskLevel: 'CRITICAL',
    aiConfidence: 99.2,
    executiveSummary: 'Extremely high probability of Executive Impersonation (CEO BEC Phishing). The email employs lookalike domain spoofing, urgency manipulation, and bypassed standard authentication headers. Immediate containment recommended.',
    threatType: 'Business Email Compromise (BEC)',
    headers: {
      from: 'Tim Cook <ceo-office@sec-apple-verify.com>',
      replyTo: 'wire-transfers-secure@fast-mail-route.ru',
      returnPath: 'bounce@sec-apple-verify.com',
      messageId: '<202609120845.x892KA9@sec-apple-verify.com>',
      receivedHops: [
        { hop: 1, from: 'mail.sec-apple-verify.com', by: 'relay.mx-server.net', timestamp: '08:45:10', ip: '185.220.101.44' },
        { hop: 2, from: 'relay.mx-server.net', by: 'gateway.corp-internal.com', timestamp: '08:45:12', ip: '10.0.4.12' },
      ],
    },
    authentication: {
      spf: {
        status: 'FAIL',
        domain: 'sec-apple-verify.com',
        ip: '185.220.101.44',
        record: 'v=spf1 include:_spf.sec-apple-verify.com -all',
        aligned: false,
        explanation: 'IP 185.220.101.44 is not designated in SPF record for sec-apple-verify.com',
      },
      dkim: {
        status: 'FAIL',
        selector: 's1',
        domain: 'sec-apple-verify.com',
        algorithm: 'rsa-sha256',
        aligned: false,
        explanation: 'DKIM Signature body hash did not match signed payload',
      },
      dmarc: {
        status: 'FAIL',
        policy: 'quarantine',
        domain: 'sec-apple-verify.com',
        disposition: 'quarantine',
        aligned: false,
        explanation: 'Neither SPF nor DKIM passed in alignment with the From header domain',
      },
    },
    domainInfo: {
      domain: 'sec-apple-verify.com',
      ageDays: 3,
      createdDate: '2026-09-09',
      registrar: 'NameCheap, Inc.',
      whoisPrivacy: true,
      blacklisted: true,
    },
    urls: [
      {
        url: 'https://sec-apple-verify.com/wire-confirm?auth=9821a',
        status: 'TYPOSQUATTED',
        domainAgeDays: 3,
        ipCountry: 'RU',
        redirectsCount: 3,
        virustotalPositives: 18,
        explanation: 'Newly registered domain impersonating Apple domain structure with suspicious routing.',
      },
      {
        url: 'https://fast-mail-route.ru/gateway/submit-credentials',
        status: 'MALICIOUS',
        domainAgeDays: 12,
        ipCountry: 'RU',
        redirectsCount: 1,
        virustotalPositives: 34,
        explanation: 'Known malicious credential harvesting endpoint on threat blacklist.',
      },
    ],
    attachments: [
      {
        filename: 'Acquisition_Agreement_CONFIDENTIAL.docm',
        fileSize: '412 KB',
        mimeType: 'application/vnd.ms-word.document.macroEnabled.12',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        riskScore: 94,
        macrosFound: true,
        executableDetected: true,
        sandboxVerdict: 'MALICIOUS',
        explanation: 'Contains auto-executing VBA macros spawning PowerShell subprocesses to download remote payload.',
      },
    ],
    highlightedSnippets: [
      {
        text: 'Do not discuss this with anyone on the finance team yet as this is a strict SEC non-disclosure acquisition.',
        type: 'URGENCY',
        description: 'Imposes psychological isolation and secrecy to evade standard internal review.',
        severity: 'critical',
      },
      {
        text: 'Transfer $480,000 USD via wire to the attached offshore escrow account before 2:00 PM EST today.',
        type: 'PAYMENT_DEMAND',
        description: 'High-value wire transfer demand with artificial time crunch.',
        severity: 'critical',
      },
      {
        text: 'From: Tim Cook <ceo-office@sec-apple-verify.com>',
        type: 'DOMAIN_MISMATCH',
        description: 'Sender uses apple.com executive name but sends from unauthorized lookalike domain sec-apple-verify.com.',
        severity: 'high',
      },
      {
        text: 'Reply-To: wire-transfers-secure@fast-mail-route.ru',
        type: 'SPOOFING',
        description: 'Reply-To header diverts response to an untrusted external server.',
        severity: 'critical',
      },
    ],
    reasoningCards: [
      {
        id: 'r1',
        title: 'Executive Brand Impersonation',
        category: 'Identity & Spoofing',
        confidence: 99.4,
        impactScore: 98,
        summary: 'Attacker used Tim Cook\'s display name paired with a newly registered lookalike domain.',
        evidence: [
          'Domain age is 3 days old',
          'Display name matches Apple CEO',
          'Reply-To points to fast-mail-route.ru'
        ],
        recommendation: 'Block domain immediately across mail gateway & flag sender in SOC.',
      },
      {
        id: 'r2',
        title: 'Malicious Macro Payload Attached',
        category: 'Malware & Sandbox',
        confidence: 96.8,
        impactScore: 95,
        summary: 'Attached Word document contains auto-open obfuscated PowerShell downloader script.',
        evidence: [
          'Word macro spawns cmd.exe /c powershell -enc...',
          'VirusTotal flag: 34 AV engines detected payload',
          'Executable payload drop attempted in temp dir'
        ],
        recommendation: 'Quarantine attachment and reset endpoint credentials if opened.',
      },
      {
        id: 'r3',
        title: 'Psychological Urgency & Isolation Tactics',
        category: 'AI NLP Analysis',
        confidence: 94.1,
        impactScore: 88,
        summary: 'Language model identified extreme coercion techniques commonly present in BEC attacks.',
        evidence: [
          'Strict secrecy mandate to bypass verification',
          'Tight deadline (before 2:00 PM EST)',
          'High monetary transaction threshold ($480k)'
        ],
        recommendation: 'Require out-of-band voice confirmation for all wire requests.',
      },
    ],
    riskIndicators: [
      { id: 'i1', name: 'Sender Reputation', category: 'Domain', status: 'FAIL', score: 98, iconName: 'UserX', explanation: 'Domain registered 3 days ago with bad IP reputation.', recommendation: 'Block domain' },
      { id: 'i2', name: 'SPF Authentication', category: 'Auth', status: 'FAIL', score: 95, iconName: 'ShieldAlert', explanation: 'Sending IP not in authorized SPF record list.', recommendation: 'Enforce strict SPF check' },
      { id: 'i3', name: 'DKIM Validation', category: 'Auth', status: 'FAIL', score: 90, iconName: 'KeyRound', explanation: 'DKIM signature hash verification failed.', recommendation: 'Reject unsigned mails' },
      { id: 'i4', name: 'DMARC Alignment', category: 'Auth', status: 'FAIL', score: 96, iconName: 'ShieldOff', explanation: 'DMARC alignment failed for envelope domain.', recommendation: 'Enforce p=reject' },
      { id: 'i5', name: 'Domain Age', category: 'WHOIS', status: 'FAIL', score: 99, iconName: 'CalendarX', explanation: 'Domain is only 3 days old.', recommendation: 'Flag domains < 30 days' },
      { id: 'i6', name: 'WHOIS Privacy', category: 'WHOIS', status: 'WARN', score: 65, iconName: 'EyeOff', explanation: 'Registrant details hidden behind proxy.', recommendation: 'Verify registrant' },
      { id: 'i7', name: 'URL Reputation', category: 'Links', status: 'FAIL', score: 97, iconName: 'Link2Off', explanation: '2 URLs flagged malicious by VirusTotal.', recommendation: 'Disable link click' },
      { id: 'i8', name: 'Attachment Risk', category: 'Payload', status: 'FAIL', score: 95, iconName: 'FileWarning', explanation: 'VBA macro dropper detected in .docm file.', recommendation: 'Quarantine file' },
      { id: 'i9', name: 'AI NLP Confidence', category: 'AI', status: 'FAIL', score: 99, iconName: 'Brain', explanation: 'LLM model predicts BEC threat with 99.2% certainty.', recommendation: 'Isolate email' },
      { id: 'i10', name: 'Urgency & Pressure', category: 'Language', status: 'FAIL', score: 92, iconName: 'Clock', explanation: 'High emotional pressure and deadline tactics.', recommendation: 'Warn recipient' },
      { id: 'i11', name: 'Blacklist Status', category: 'Threat Intel', status: 'FAIL', score: 94, iconName: 'ListX', explanation: 'IP 185.220.101.44 listed on 8 spam blacklists.', recommendation: 'Block IP range' },
      { id: 'i12', name: 'Spoof Detection', category: 'Identity', status: 'FAIL', score: 98, iconName: 'UserCheck', explanation: 'Executive display name matched against executive roster.', recommendation: 'Flag display name' },
      { id: 'i13', name: 'Language Pattern', category: 'NLP', status: 'WARN', score: 78, iconName: 'FileText', explanation: 'Grammatical anomalies and atypical tone.', recommendation: 'Review tone' },
    ],
    rawEmailContent: `Delivered-To: finance-lead@corp-internal.com
Received: by 2002:a05:6838:1208:: with SMTP id t8csp4910382nqc;
        Sat, 12 Sep 2026 08:45:12 -0700 (PDT)
Return-Path: <bounce@sec-apple-verify.com>
Received: from mail.sec-apple-verify.com (185.220.101.44)
        by gateway.corp-internal.com with ESMTPS id q19283011
        for <finance-lead@corp-internal.com>;
        Sat, 12 Sep 2026 08:45:10 -0700
From: Tim Cook <ceo-office@sec-apple-verify.com>
Reply-To: wire-transfers-secure@fast-mail-route.ru
To: finance-lead@corp-internal.com
Subject: URGENT: Confidential Acquisition Wire Transfer - Immediate Action Required
Date: Sat, 12 Sep 2026 08:45:08 -0700
Message-ID: <202609120845.x892KA9@sec-apple-verify.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_NextPart_000_001D_01D8C12"

------=_NextPart_000_001D_01D8C12
Content-Type: text/plain; charset="UTF-8"

Hi Finance Team,

Please review the attached confidential acquisition document immediately. Do not discuss this with anyone on the finance team yet as this is a strict SEC non-disclosure acquisition.

Transfer $480,000 USD via wire to the attached offshore escrow account before 2:00 PM EST today.

Confirm receipt as soon as the wire dispatch code is generated.

Best regards,
Tim Cook
Chief Executive Officer`,
  },
  'paypal-invoice-phish': {
    id: 'scan-77102',
    scanTimestamp: '2026-09-12T07:12:00Z',
    senderEmail: 'service-notify@paypaI-support-update.org',
    senderName: 'PayPal Invoice Billing',
    recipientEmail: 'john.doe@acme-corp.com',
    subject: 'Invoice Paid: $1,249.00 USD to Coinbase Inc (Call +1-888-901-2281 if unauthorized)',
    riskScore: 84,
    riskLevel: 'FRAUD',
    aiConfidence: 97.5,
    executiveSummary: 'Phishing email using fake receipt alert and call center fraud trap. Spoofed typo domain "paypaI" (with capital I replacing l).',
    threatType: 'Callback Phishing & Invoice Fraud',
    headers: {
      from: 'PayPal Billing <service-notify@paypaI-support-update.org>',
      replyTo: 'support@paypaI-support-update.org',
      returnPath: 'bounce@paypaI-support-update.org',
      messageId: '<20260912.paypal.77102@paypaI-support-update.org>',
      receivedHops: [
        { hop: 1, from: 'smtp.paypaI-support-update.org', by: 'mx.acme-corp.com', timestamp: '07:11:58', ip: '45.142.214.92' },
      ],
    },
    authentication: {
      spf: { status: 'PASS', domain: 'paypaI-support-update.org', ip: '45.142.214.92', record: 'v=spf1 a mx ~all', aligned: true, explanation: 'SPF aligned with fake domain' },
      dkim: { status: 'PASS', selector: 'default', domain: 'paypaI-support-update.org', algorithm: 'rsa-sha256', aligned: true, explanation: 'Signed by fake domain' },
      dmarc: { status: 'PASS', policy: 'none', domain: 'paypaI-support-update.org', disposition: 'none', aligned: true, explanation: 'Attacker owns fake domain' },
    },
    domainInfo: {
      domain: 'paypaI-support-update.org',
      ageDays: 8,
      createdDate: '2026-09-04',
      registrar: 'Dynadot Inc',
      whoisPrivacy: true,
      blacklisted: true,
    },
    urls: [
      { url: 'https://paypaI-support-update.org/dispute-login', status: 'SUSPICIOUS', domainAgeDays: 8, ipCountry: 'NL', redirectsCount: 2, virustotalPositives: 9, explanation: 'Fake PayPal login form collecting credentials.' }
    ],
    attachments: [],
    highlightedSnippets: [
      { text: 'If you did not authorize this payment of $1,249.00 USD, call our support line immediately at +1-888-901-2281.', type: 'URGENCY', description: 'Callback phishing ploy urging recipient to ring fraud call center.', severity: 'high' }
    ],
    reasoningCards: [
      { id: 'rc-1', title: 'Homograph / Typosquatting Domain', category: 'Domain', confidence: 98.2, impactScore: 89, summary: 'Replaced lowercase letter l with uppercase letter I in paypal.', evidence: ['Domain: paypaI-support-update.org', 'Authentic Domain: paypal.com'], recommendation: 'Block domain and alert user of homograph trick.' }
    ],
    riskIndicators: [
      { id: 'i1', name: 'Sender Reputation', category: 'Domain', status: 'FAIL', score: 88, iconName: 'UserX', explanation: 'Typosquatted domain impersonating PayPal.', recommendation: 'Block domain' },
      { id: 'i2', name: 'SPF Authentication', category: 'Auth', status: 'PASS', score: 10, iconName: 'ShieldCheck', explanation: 'SPF valid for fake domain.', recommendation: 'Check DMARC alignment' },
      { id: 'i3', name: 'DKIM Validation', category: 'Auth', status: 'PASS', score: 10, iconName: 'KeyRound', explanation: 'DKIM valid for fake domain.', recommendation: 'Verify actual brand domain' },
      { id: 'i4', name: 'DMARC Alignment', category: 'Auth', status: 'PASS', score: 10, iconName: 'ShieldCheck', explanation: 'DMARC aligned with fake domain.', recommendation: 'Check brand identity' },
      { id: 'i5', name: 'Domain Age', category: 'WHOIS', status: 'FAIL', score: 92, iconName: 'CalendarX', explanation: 'Domain age is 8 days old.', recommendation: 'Flag domain' },
      { id: 'i6', name: 'WHOIS Privacy', category: 'WHOIS', status: 'WARN', score: 50, iconName: 'EyeOff', explanation: 'WHOIS private.', recommendation: 'Verify registrant' },
      { id: 'i7', name: 'URL Reputation', category: 'Links', status: 'FAIL', score: 85, iconName: 'Link2Off', explanation: 'URL flagged by security vendors.', recommendation: 'Block URL' },
      { id: 'i8', name: 'Attachment Risk', category: 'Payload', status: 'PASS', score: 0, iconName: 'FileCheck', explanation: 'No attachment included.', recommendation: 'N/A' },
      { id: 'i9', name: 'AI NLP Confidence', category: 'AI', status: 'FAIL', score: 97, iconName: 'Brain', explanation: 'Callback phishing detected.', recommendation: 'Isolate mail' },
      { id: 'i10', name: 'Urgency & Pressure', category: 'Language', status: 'FAIL', score: 88, iconName: 'Clock', explanation: 'Fake transaction panic lure.', recommendation: 'Warn recipient' },
      { id: 'i11', name: 'Blacklist Status', category: 'Threat Intel', status: 'FAIL', score: 80, iconName: 'ListX', explanation: 'IP listed on phish blacklists.', recommendation: 'Block IP' },
      { id: 'i12', name: 'Spoof Detection', category: 'Identity', status: 'FAIL', score: 95, iconName: 'UserCheck', explanation: 'Impersonating PayPal brand.', recommendation: 'Flag brand misuse' },
      { id: 'i13', name: 'Language Pattern', category: 'NLP', status: 'WARN', score: 70, iconName: 'FileText', explanation: 'Customer support fraud template.', recommendation: 'Review template' },
    ],
    rawEmailContent: `From: PayPal Billing <service-notify@paypaI-support-update.org>
To: john.doe@acme-corp.com
Subject: Invoice Paid: $1,249.00 USD to Coinbase Inc

Thank you for your purchase. $1,249.00 USD has been charged to your PayPal account for 0.42 BTC on Coinbase Inc.
If you did not authorize this payment, call our fraud desk immediately at +1-888-901-2281.`,
  },
  'clean-corporate-newsletter': {
    id: 'scan-10293',
    scanTimestamp: '2026-09-12T06:30:15Z',
    senderEmail: 'newsletter@github.com',
    senderName: 'GitHub Enterprise Team',
    recipientEmail: 'dev-lead@acme-corp.com',
    subject: 'GitHub Security Monthly Roundup: September 2026 Edition',
    riskScore: 4,
    riskLevel: 'SAFE',
    aiConfidence: 99.8,
    executiveSummary: 'Legitimate corporate communication from GitHub. SPF, DKIM, and DMARC alignment verified 100%. No malicious URLs or suspicious language patterns detected.',
    threatType: 'Clean Communication',
    headers: {
      from: 'GitHub Enterprise Team <newsletter@github.com>',
      replyTo: 'support@github.com',
      returnPath: 'bounces@github.com',
      messageId: '<202609120630.gh10293@github.com>',
      receivedHops: [
        { hop: 1, from: 'outbound.github.com', by: 'mx.acme-corp.com', timestamp: '06:30:14', ip: '192.30.252.192' },
      ],
    },
    authentication: {
      spf: { status: 'PASS', domain: 'github.com', ip: '192.30.252.192', record: 'v=spf1 include:mailgun.org include:_spf.google.com ~all', aligned: true, explanation: 'IP officially listed in GitHub SPF record.' },
      dkim: { status: 'PASS', selector: 'pf2024', domain: 'github.com', algorithm: 'rsa-sha256', aligned: true, explanation: 'Valid cryptographic signature from github.com.' },
      dmarc: { status: 'PASS', policy: 'reject', domain: 'github.com', disposition: 'none', aligned: true, explanation: 'DMARC fully aligned and passing.' },
    },
    domainInfo: {
      domain: 'github.com',
      ageDays: 6820,
      createdDate: '2007-10-09',
      registrar: 'MarkMonitor Inc.',
      whoisPrivacy: false,
      blacklisted: false,
    },
    urls: [
      { url: 'https://github.com/blog/security-september-2026', status: 'CLEAN', domainAgeDays: 6820, ipCountry: 'US', redirectsCount: 0, virustotalPositives: 0, explanation: 'Official clean GitHub URL.' }
    ],
    attachments: [],
    highlightedSnippets: [],
    reasoningCards: [
      { id: 'rc-clean-1', title: 'Cryptographic Authentication Passed', category: 'Authentication', confidence: 99.9, impactScore: 5, summary: 'All email authentication standards (SPF, DKIM, DMARC) passed with 100% domain alignment.', evidence: ['SPF: PASS', 'DKIM: PASS', 'DMARC: PASS'], recommendation: 'Allow message to inbox.' }
    ],
    riskIndicators: [
      { id: 'i1', name: 'Sender Reputation', category: 'Domain', status: 'PASS', score: 2, iconName: 'UserCheck', explanation: 'High reputation official GitHub domain.', recommendation: 'Safe sender' },
      { id: 'i2', name: 'SPF Authentication', category: 'Auth', status: 'PASS', score: 0, iconName: 'ShieldCheck', explanation: 'SPF valid and aligned.', recommendation: 'Pass' },
      { id: 'i3', name: 'DKIM Validation', category: 'Auth', status: 'PASS', score: 0, iconName: 'KeyRound', explanation: 'DKIM signature valid.', recommendation: 'Pass' },
      { id: 'i4', name: 'DMARC Alignment', category: 'Auth', status: 'PASS', score: 0, iconName: 'ShieldCheck', explanation: 'DMARC policy passing.', recommendation: 'Pass' },
      { id: 'i5', name: 'Domain Age', category: 'WHOIS', status: 'PASS', score: 0, iconName: 'Calendar', explanation: 'Domain established 18+ years.', recommendation: 'Pass' },
      { id: 'i6', name: 'WHOIS Privacy', category: 'WHOIS', status: 'PASS', score: 0, iconName: 'Eye', explanation: 'Verified corporate WHOIS record.', recommendation: 'Pass' },
      { id: 'i7', name: 'URL Reputation', category: 'Links', status: 'PASS', score: 0, iconName: 'Link2', explanation: 'All URLs clean.', recommendation: 'Pass' },
      { id: 'i8', name: 'Attachment Risk', category: 'Payload', status: 'PASS', score: 0, iconName: 'FileCheck', explanation: 'No attachments.', recommendation: 'Pass' },
      { id: 'i9', name: 'AI NLP Confidence', category: 'AI', status: 'PASS', score: 2, iconName: 'Brain', explanation: 'Normal newsletter tone.', recommendation: 'Pass' },
      { id: 'i10', name: 'Urgency & Pressure', category: 'Language', status: 'PASS', score: 5, iconName: 'Clock', explanation: 'No artificial urgency detected.', recommendation: 'Pass' },
      { id: 'i11', name: 'Blacklist Status', category: 'Threat Intel', status: 'PASS', score: 0, iconName: 'ListCheck', explanation: 'Not listed on any threat blacklists.', recommendation: 'Pass' },
      { id: 'i12', name: 'Spoof Detection', category: 'Identity', status: 'PASS', score: 0, iconName: 'UserCheck', explanation: 'Authenticated sender match.', recommendation: 'Pass' },
      { id: 'i13', name: 'Language Pattern', category: 'NLP', status: 'PASS', score: 2, iconName: 'FileText', explanation: 'Standard promotional newsletter text.', recommendation: 'Pass' },
    ],
    rawEmailContent: `From: GitHub Enterprise Team <newsletter@github.com>
To: dev-lead@acme-corp.com
Subject: GitHub Security Monthly Roundup: September 2026 Edition

Hello Developer,
Here is your monthly summary of developer security tools, security advisory updates, and platform features...`,
  },
};

export const MOCK_CASES = [
  {
    id: 'CASE-2026-901',
    title: 'BEC Wire Transfer - Tim Cook Impersonation',
    threatLevel: 'CRITICAL',
    assignedAnalyst: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', email: 'alex.rivera@aegis-sec.io' },
    targetDomain: 'corp-internal.com',
    status: 'UNDER_INVESTIGATION',
    createdAt: '2026-09-12 08:47',
    updatedAt: '2026-09-12 09:10',
    riskScore: 96,
    sender: 'ceo-office@sec-apple-verify.com',
    subject: 'URGENT: Confidential Acquisition Wire Transfer',
    notesCount: 4,
  },
  {
    id: 'CASE-2026-894',
    title: 'PayPal Typosquatted Invoice Callback Scheme',
    threatLevel: 'FRAUD',
    assignedAnalyst: { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80', email: 'sarah.chen@aegis-sec.io' },
    targetDomain: 'acme-corp.com',
    status: 'MITIGATED',
    createdAt: '2026-09-12 07:15',
    updatedAt: '2026-09-12 08:00',
    riskScore: 84,
    sender: 'service-notify@paypaI-support-update.org',
    subject: 'Invoice Paid: $1,249.00 USD to Coinbase Inc',
    notesCount: 2,
  },
  {
    id: 'CASE-2026-880',
    title: 'Office365 Password Reset Phishing Campaign',
    threatLevel: 'CRITICAL',
    assignedAnalyst: { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80', email: 'marcus.vance@aegis-sec.io' },
    targetDomain: 'enterprise-health.org',
    status: 'OPEN',
    createdAt: '2026-09-11 18:22',
    updatedAt: '2026-09-11 19:00',
    riskScore: 91,
    sender: 'no-reply@microsoft-security-auth-check.com',
    subject: 'Action Required: Your password expires in 2 hours',
    notesCount: 7,
  },
  {
    id: 'CASE-2026-871',
    title: 'DocuSign Document Impersonation Dropper',
    threatLevel: 'SUSPICIOUS',
    assignedAnalyst: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', email: 'alex.rivera@aegis-sec.io' },
    targetDomain: 'tech-corp.io',
    status: 'CLOSED',
    createdAt: '2026-09-11 14:10',
    updatedAt: '2026-09-11 16:45',
    riskScore: 68,
    sender: 'docusign@review-secure-docs-online.net',
    subject: 'Please sign: Q3 Executive Compensation Review',
    notesCount: 3,
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Critical Threat Detected!',
    description: 'High-risk CEO BEC wire transfer email flagged for target user finance-lead@corp-internal.com',
    severity: 'CRITICAL',
    timestamp: '2 mins ago',
    read: false,
    scanId: 'scan-89421',
  },
  {
    id: 'notif-2',
    title: 'Threat Campaign Detected',
    description: '14 similar typosquatted domain emails blocked targeting PayPal users across your organization.',
    severity: 'WARNING',
    timestamp: '45 mins ago',
    read: false,
    scanId: 'scan-77102',
  },
  {
    id: 'notif-3',
    title: 'Model Retrained & Updated',
    description: 'Neural Threat Intelligence Model v4.9 auto-trained with 12,000 new phishing signatures.',
    severity: 'INFO',
    timestamp: '3 hours ago',
    read: true,
  },
];

export const THREAT_TRENDS = [
  { date: 'Sep 06', totalScans: 1420, phishingCount: 84, fraudCount: 42, cleanCount: 1294 },
  { date: 'Sep 07', totalScans: 1680, phishingCount: 110, fraudCount: 56, cleanCount: 1514 },
  { date: 'Sep 08', totalScans: 1950, phishingCount: 145, fraudCount: 68, cleanCount: 1737 },
  { date: 'Sep 09', totalScans: 1820, phishingCount: 98, fraudCount: 45, cleanCount: 1677 },
  { date: 'Sep 10', totalScans: 2210, phishingCount: 192, fraudCount: 88, cleanCount: 1930 },
  { date: 'Sep 11', totalScans: 2540, phishingCount: 230, fraudCount: 115, cleanCount: 2195 },
  { date: 'Sep 12', totalScans: 2890, phishingCount: 284, fraudCount: 142, cleanCount: 2464 },
];
