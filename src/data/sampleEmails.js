/**
 * Realistic RFC 5322 Sample Emails for Testing & Demonstration
 */

export const SAMPLE_EMAILS = [
  {
    id: 'ceo-bec-fraud',
    title: 'CEO BEC Wire Transfer Attack',
    type: 'BEC / Executive Impersonation',
    tag: 'High Risk (96%)',
    tagColor: 'dangerRed',
    description: 'Spoofed CEO display name, lookalike domain, offshore Reply-To diversion, and macro-enabled doc attachment.',
    raw: `Delivered-To: finance-lead@corp-internal.com
Received: by 2002:a05:6838:1208:: with SMTP id t8csp4910382nqc;
        Sat, 12 Sep 2026 08:45:12 -0700 (PDT)
Return-Path: <bounce@sec-apple-verify.com>
Received: from mail.sec-apple-verify.com (185.220.101.44)
        by gateway.corp-internal.com with ESMTPS id q19283011
        for <finance-lead@corp-internal.com>;
        Sat, 12 Sep 2026 08:45:10 -0700
Authentication-Results: gateway.corp-internal.com;
        spf=fail (sender IP 185.220.101.44 is not designated in SPF record) smtp.mailfrom=sec-apple-verify.com;
        dkim=fail header.d=sec-apple-verify.com header.s=s1;
        dmarc=fail (p=quarantine dis=quarantine) header.from=sec-apple-verify.com
Received-SPF: fail (gateway.corp-internal.com: domain of sec-apple-verify.com does not designate 185.220.101.44 as permitted sender)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=sec-apple-verify.com; s=s1;
        t=1726130710; bh=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855=;
        h=From:Reply-To:To:Subject:Date:Message-ID:MIME-Version:Content-Type;
From: Tim Cook <ceo-office@sec-apple-verify.com>
Reply-To: wire-transfers-secure@fast-mail-route.ru
To: finance-lead@corp-internal.com
Subject: URGENT: Confidential Acquisition Wire Transfer - Immediate Action Required
Date: Sat, 12 Sep 2026 08:45:08 -0700
Message-ID: <202609120845.x892KA9@sec-apple-verify.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_8921_19284.1726130708"

------=_Part_8921_19284.1726130708
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit

Hi Finance Team,

Please review the attached confidential acquisition document immediately. Do not discuss this with anyone on the finance team yet as this is a strict SEC non-disclosure acquisition.

Transfer $480,000 USD via wire to the attached offshore escrow account before 2:00 PM EST today.

Verify confirmation receipt at:
https://sec-apple-verify.com/wire-confirm?auth=9821a

Confirm receipt as soon as the wire dispatch code is generated at the portal:
https://fast-mail-route.ru/gateway/submit-credentials

Best regards,
Tim Cook
Chief Executive Officer

------=_Part_8921_19284.1726130708
Content-Type: application/vnd.ms-word.document.macroEnabled.12; name="Acquisition_Agreement_CONFIDENTIAL.docm"
Content-Disposition: attachment; filename="Acquisition_Agreement_CONFIDENTIAL.docm"
Content-Transfer-Encoding: base64

UEsDBBQAAAAIAKV6a1cAAAAAAAAAAAAAAA...[OBFUSCATED_MACRO_PAYLOAD]...==
------=_Part_8921_19284.1726130708--`
  },
  {
    id: 'paypal-invoice-phish',
    title: 'PayPal Typosquat Invoice Phishing',
    type: 'Invoice Fraud & Callback Trap',
    tag: 'High Risk (84%)',
    tagColor: 'warningAmber',
    description: 'Homoglyph domain (paypaI with uppercase I), fake crypto purchase alert, and fraudulent callback phone number.',
    raw: `Delivered-To: victim@company.com
Received: from smtp.paypaI-support-update.org (45.142.214.92)
        by mx.company.com with ESMTPS id p819283
        for <victim@company.com>;
        Sat, 12 Sep 2026 07:11:58 -0700
Authentication-Results: mx.company.com;
        spf=pass smtp.mailfrom=paypaI-support-update.org;
        dkim=pass header.d=paypaI-support-update.org;
        dmarc=pass header.from=paypaI-support-update.org
From: PayPal Billing Support <service-notify@paypaI-support-update.org>
Reply-To: support@paypaI-support-update.org
To: victim@company.com
Subject: Invoice Paid: $1,249.00 USD to Coinbase Inc (Call +1-888-901-2281 if unauthorized)
Date: Sat, 12 Sep 2026 07:11:55 -0700
Message-ID: <20260912.paypal.77102@paypaI-support-update.org>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"

Thank you for your purchase. $1,249.00 USD has been automatically charged to your PayPal balance for 0.42 BTC on Coinbase Inc.

If you did not authorize this payment or suspect unauthorized payment on your account, please call our fraud desk immediately at +1-888-901-2281.

You may also review or cancel this invoice directly at:
https://paypaI-support-update.org/dispute-login

Do not reply directly to this automated email. Contact the customer fraud support hotline immediately.

PayPal Billing Security Department`
  },
  {
    id: 'clean-github-newsletter',
    title: 'Legitimate Corporate Newsletter',
    type: 'Authentic Communication',
    tag: 'Clean (4%)',
    tagColor: 'successGreen',
    description: '100% SPF, DKIM, and DMARC domain alignment with clean corporate infrastructure and no threat cues.',
    raw: `Delivered-To: dev-lead@acme-corp.com
Received: from outbound.github.com (192.30.252.192)
        by mx.acme-corp.com with ESMTPS id gh-28194
        for <dev-lead@acme-corp.com>;
        Sat, 12 Sep 2026 06:30:14 -0700
Authentication-Results: mx.acme-corp.com;
        spf=pass (mx.acme-corp.com: domain of newsletter@github.com designates 192.30.252.192 as permitted sender) smtp.mailfrom=newsletter@github.com;
        dkim=pass header.d=github.com header.s=pf2024;
        dmarc=pass (p=reject dis=none) header.from=github.com
From: GitHub Enterprise Team <newsletter@github.com>
Reply-To: support@github.com
To: dev-lead@acme-corp.com
Subject: GitHub Security Monthly Roundup: September 2026 Edition
Date: Sat, 12 Sep 2026 06:30:12 -0700
Message-ID: <202609120630.gh10293@github.com>
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"

Hello Developer,

Welcome to the September 2026 edition of the GitHub Security Monthly Roundup.

In this edition:
- New Dependabot automated mitigation rules
- Secret scanning improvements across push protection
- Best practices for multi-factor authentication passkeys

Read the full report on the GitHub Engineering Blog:
https://github.com/blog/security-september-2026

To update your subscription preferences, visit your GitHub Enterprise account settings.

Happy coding,
The GitHub Security Team`
  }
];
