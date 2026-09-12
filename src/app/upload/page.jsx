'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileCode,
  AlertCircle,
  File,
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { parseRawEmail } from '../../lib/emailParser';
import { EmailForensicPreview } from '../../components/upload/EmailForensicPreview';
import { addOrUpdateEmailInCache } from '../../lib/clientDataCache';

const DETERMINISTIC_SAMPLES = [
  {
    id: 'simple-plain',
    title: 'Plain Text Email',
    raw: `From: alice@example.com
To: analyst@example.com
Subject: Forensics Test: Plain Text
Date: Mon, 10 Aug 2026 10:00:00 +0000
Message-ID: <simple.001@example.com>
Content-Type: text/plain; charset="UTF-8"

Hello Analyst,

This is a clean RFC 5322 plain text email message for Phase 1 parsing validation.
No multipart or attachments are present.`
  },
  {
    id: 'multipart-alt',
    title: 'Multipart/Alternative Email',
    raw: `From: newsletter@company.org
To: analyst@example.com
Subject: Weekly Engineering Digest
Date: Sat, 12 Sep 2026 09:30:00 -0400
Message-ID: <digest.2026.09@company.org>
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="----=_Boundary_Alt_123"

------=_Boundary_Alt_123
Content-Type: text/plain; charset="UTF-8"

Welcome to the Weekly Engineering Digest.
Read our full write-up online.

------=_Boundary_Alt_123
Content-Type: text/html; charset="UTF-8"

<html>
  <body>
    <h2>Weekly Engineering Digest</h2>
    <p>Read our full write-up online.</p>
  </body>
</html>
------=_Boundary_Alt_123--`
  },
  {
    id: 'attachment-mime',
    title: 'Email with Attachment Metadata',
    raw: `From: billing@vendor.com
To: accounts@client.com
Subject: Monthly Invoice #9821 Attached
Date: Thu, 10 Sep 2026 14:15:22 +0000
Message-ID: <inv.9821@vendor.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Boundary_Mix_999"

------=_Boundary_Mix_999
Content-Type: text/plain; charset="UTF-8"

Dear Accounts Team,

Please find attached invoice #9821 in PDF format for services rendered.

Regards,
Billing Dept

------=_Boundary_Mix_999
Content-Type: application/pdf; name="Invoice_9821.pdf"
Content-Disposition: attachment; filename="Invoice_9821.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjQKJcTl8uXr...[BASE64_PAYLOAD]...
------=_Boundary_Mix_999--`
  },
  {
    id: 'paypal-phishing',
    title: 'PayPal Phishing Lure (High Risk)',
    raw: `From: "PayPal Security Desk" <service-notify@paypaI-support-update.org>
Reply-To: support@paypaI-support-update.org
To: victim@company.com
Subject: URGENT: Verify Your PayPal Account To Prevent Suspension
Date: Sat, 12 Sep 2026 07:11:55 -0700
Message-ID: <20260912.paypal.77102@paypaI-support-update.org>
MIME-Version: 1.0
Content-Type: text/html; charset="UTF-8"

<html>
  <body>
    <h2>Security Alert: Immediate Action Required</h2>
    <p>We detected unauthorized sign-in attempts on your profile. Your account will be suspended within 24 hours.</p>
    <p>Please click below to verify your account credentials:</p>
    <p><a href="https://paypaI-support-update.org/dispute-login">https://paypal.com/verify</a></p>
    <p>Failure to comply will result in permanent account deactivation.</p>
  </body>
</html>`
  },
  {
    id: 'executive-bec-wire',
    title: 'Executive BEC Wire Fraud',
    raw: `From: "CEO Executive Office" <tim.cook@sec-apple-verify.com>
Reply-To: wire-escrow-desk@offshore-transfers.ru
To: finance-team@corp-internal.com
Subject: Strictly Confidential: Urgent M&A Acquisition Wire Transfer
Date: Sat, 12 Sep 2026 08:45:08 -0700
Message-ID: <202609120845.x892KA9@sec-apple-verify.com>
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="----=_Part_8921_19284"

------=_Part_8921_19284
Content-Type: text/plain; charset="UTF-8"

Hi Finance Team,

Please review the attached confidential acquisition document immediately. Do not inform anyone on the team as this is strictly confidential.
Wire transfer $480,000 USD to the offshore escrow account before 2:00 PM today.
Confirm receipt at: https://sec-apple-verify.com/wire-confirm?id=9821

Regards,
Executive Office

------=_Part_8921_19284
Content-Type: application/vnd.ms-word.document.macroEnabled.12; name="Acquisition_Agreement.docm"
Content-Disposition: attachment; filename="Acquisition_Agreement.docm"
Content-Transfer-Encoding: base64

UEsDBBQAAAAIAKV6a1cAAAAAAAAAAAAAAA...
------=_Part_8921_19284--`
  }
];

export default function UploadPage() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Ingestion Mode: 'paste' | 'upload'
  const [ingestionMode, setIngestionMode] = useState('paste');

  // Input states
  const [rawText, setRawText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parsed Email & Validation
  const [parsedData, setParsedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [warnings, setWarnings] = useState([]);

  // Supabase Database Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const lastSavedFingerprintRef = useRef('');

  // Check for pre-loaded upload from dashboard drop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingUpload = sessionStorage.getItem('pending_eml_upload');
      if (pendingUpload) {
        sessionStorage.removeItem('pending_eml_upload');
        setRawText(pendingUpload);
        setIngestionMode('paste');
        toast('Email Loaded', 'Processing dropped email payload', 'info');
      }
    }
  }, [toast]);

  const saveEmailToSupabase = async (dataToPersist, customAnalysis = null) => {
    if (!dataToPersist) return;

    const sender = dataToPersist.metadata?.from || 'unknown@sender.com';
    const subject = dataToPersist.metadata?.subject || 'Untitled Email';
    const body = dataToPersist.body?.text || dataToPersist.body?.html || rawText || '';
    const riskScore = dataToPersist.risk?.totalScore || 0;
    const classification = dataToPersist.risk?.level || (riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 25 ? 'MEDIUM' : 'LOW');
    const aiExplanation = customAnalysis?.explanation || dataToPersist.aiAnalysis?.explanation;
    const explanation = aiExplanation || `Authoritative RFC 5322 & forensic evaluation: ${classification} level with risk score ${riskScore}/100.`;

    const fingerprint = `${sender}:::${subject}:::${body.slice(0, 100)}:::${riskScore}:::${aiExplanation ? 'ai' : 'raw'}`;
    if (!customAnalysis && lastSavedFingerprintRef.current === fingerprint) {
      return; // Already auto-saved this exact payload
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: dataToPersist,
          sender,
          subject,
          body,
          riskScore,
          classification,
          explanation
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to auto-save to Supabase');
      }

      lastSavedFingerprintRef.current = fingerprint;
      setSavedRecord(json.data);
      addOrUpdateEmailInCache(json.data);
      toast('Auto-Saved to Supabase', `Dynamic email saved to Supabase (ID: ${json.data.id.slice(0, 8)}...)`, 'success');
    } catch (err) {
      console.error('Supabase auto-persistence notice:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-parse pasted raw text with debounce & automatic Supabase persistence
  useEffect(() => {
    if (ingestionMode === 'paste') {
      if (!rawText.trim()) {
        setParsedData(null);
        setSavedRecord(null);
        lastSavedFingerprintRef.current = '';
        setErrorMessage('');
        setWarnings([]);
        return;
      }

      const timer = setTimeout(() => {
        const result = parseRawEmail(rawText);
        if (result.success) {
          setParsedData(result.data);
          setErrorMessage('');
          setWarnings(result.warnings || []);
          saveEmailToSupabase(result.data);
        } else {
          setParsedData(null);
          setSavedRecord(null);
          lastSavedFingerprintRef.current = '';
          setErrorMessage(result.error || 'Failed to parse RFC 5322 email.');
          setWarnings(result.warnings || []);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [rawText, ingestionMode]);

  // Process .eml file upload
  const processEmailFile = (file) => {
    setErrorMessage('');
    setWarnings([]);

    const isEml = file.name.toLowerCase().endsWith('.eml') || file.name.toLowerCase().endsWith('.msg');
    if (!isEml) {
      const err = `Invalid file format (${file.name}). Please select a valid .eml or .msg file.`;
      setErrorMessage(err);
      setParsedData(null);
      toast('Invalid File Type', err, 'error');
      return;
    }

    if (file.size === 0) {
      const err = 'The selected file is empty (0 bytes).';
      setErrorMessage(err);
      setParsedData(null);
      toast('Empty File Rejected', err, 'error');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      const result = parseRawEmail(content);

      if (result.success) {
        setParsedData(result.data);
        setErrorMessage('');
        setWarnings(result.warnings || []);
        setUploadedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`,
          bytes: file.size
        });
        toast('Email Ingested', `${file.name} successfully parsed into normalized structure`, 'success');
        saveEmailToSupabase(result.data);
      } else {
        setParsedData(null);
        setSavedRecord(null);
        lastSavedFingerprintRef.current = '';
        setErrorMessage(result.error || 'Failed to parse .eml file.');
        setWarnings(result.warnings || []);
        toast('Parsing Error', result.error, 'error');
      }
    };

    reader.onerror = () => {
      const err = 'Unable to read the selected file from disk.';
      setErrorMessage(err);
      toast('File Error', err, 'error');
    };

    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processEmailFile(e.dataTransfer.files[0]);
    }
  };

  const loadSample = (sample) => {
    setRawText(sample.raw);
    setIngestionMode('paste');
    toast('Sample Loaded', `Loaded "${sample.title}"`, 'info');
  };

  const handleReset = () => {
    setRawText('');
    setUploadedFile(null);
    setParsedData(null);
    setSavedRecord(null);
    lastSavedFingerprintRef.current = '';
    setErrorMessage('');
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast('Reset', 'Workbench input and parsed output cleared', 'info');
  };

  const hasContent = Boolean(rawText.trim() || uploadedFile || parsedData);

  return (
    <div className="min-h-screen bg-softWhite dark:bg-[#0F172A] text-deepSlate dark:text-softWhite flex transition-colors duration-200">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> RFC 5322 Ingestion Foundation
            </div>
            <h1 className="text-3xl font-bold font-heading tracking-tight text-slate-900 dark:text-white">
              Email Input & RFC 5322 Parsing
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Local, zero-retention RFC 5322 header and MIME body parser generating canonical normalized email objects.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIngestionMode('paste')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ingestionMode === 'paste'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FileCode className="w-4 h-4" /> Mode A: Paste Raw Email
              </button>
              <button
                onClick={() => setIngestionMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  ingestionMode === 'upload'
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Mode B: Upload .eml File
              </button>
            </div>

            {hasContent && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 text-xs font-medium transition-all self-start sm:self-auto cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear / Reset
              </button>
            )}
          </div>

          {/* Main Ingestion Input Card */}
          <Card className="p-6 md:p-8 space-y-6">
            {/* Mode A: Paste Raw Email */}
            {ingestionMode === 'paste' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Load Deterministic Test Samples:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {DETERMINISTIC_SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadSample(sample)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-[11px] font-mono text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste complete raw RFC 5322 email here (headers and body)...&#10;&#10;From: sender@example.com&#10;To: recipient@example.com&#10;Subject: Hello World&#10;Date: Mon, 10 Aug 2026 10:00:00 +0000&#10;Message-ID: <123@example.com>&#10;&#10;Message body text..."
                    className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors leading-relaxed selection:bg-blue-500/20"
                  />

                  <div className="absolute bottom-3 right-4 text-[10px] font-mono text-slate-600 dark:text-slate-300 pointer-events-none bg-white/95 dark:bg-slate-800/95 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
                    {rawText ? rawText.split(/\r?\n/).length : 0} lines • {rawText.length} bytes
                  </div>
                </div>
              </div>
            )}

            {/* Mode B: Upload .eml File */}
            {ingestionMode === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-[#0F172A]/40 hover:bg-slate-100/50 dark:hover:bg-[#0F172A]/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".eml,.msg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processEmailFile(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform border border-blue-100 dark:border-blue-900">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isDragging ? 'Drop .eml file here' : 'Drop .eml file here or click to browse'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Accepts standard RFC 5322 <strong className="text-slate-900 dark:text-white">.eml</strong> and <strong className="text-slate-900 dark:text-white">.msg</strong> files.
                  </p>

                  <div className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold group-hover:border-blue-500 transition-all shadow-xs">
                    Browse Files (.eml)
                  </div>
                </div>

                {uploadedFile && (
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{uploadedFile.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 font-mono">{uploadedFile.size}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Clear file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Feedback */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-700 dark:text-red-300">Validation Error</div>
                  <div className="text-red-600 dark:text-red-200">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Warnings Feedback */}
            {warnings.length > 0 && !errorMessage && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-700 dark:text-amber-300">Parsing Warnings</div>
                  <div className="text-amber-600 dark:text-amber-200">{warnings.join(' • ')}</div>
                </div>
              </div>
            )}
          </Card>

          {/* Parsed Email Display */}
          {parsedData && (
            <div className="space-y-6">
              {/* Automatic Supabase Persistence Confirmation & Action Bar */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                    savedRecord
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : isSaving
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Supabase Cloud Database
                      </span>
                      {savedRecord ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SYNCHRONIZED
                        </span>
                      ) : isSaving ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 animate-spin" /> AUTO-SAVING...
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-mono border border-amber-200 dark:border-amber-800">
                          PENDING...
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {savedRecord
                        ? `Live Supabase Record: ${savedRecord.subject || 'Ingested Email'}`
                        : 'Dynamic Email Automatically Synced to Supabase'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {savedRecord ? (
                        <>
                          UUID: <strong className="text-slate-900 dark:text-white font-semibold">{savedRecord.id}</strong> • Tables:{' '}
                          <span className="text-slate-900 dark:text-white font-semibold">public.emails</span> &{' '}
                          <span className="text-slate-900 dark:text-white font-semibold">public.analysis_results</span>
                        </>
                      ) : (
                        'Ingested headers, sender identity, body, and calculated risk score auto-persist immediately.'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
                  {savedRecord ? (
                    <>
                      <button
                        onClick={() => saveEmailToSupabase(parsedData)}
                        disabled={isSaving}
                        className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Re-synchronize latest forensic updates with Supabase"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                        <span>Re-sync</span>
                      </button>
                      <Link
                        href={`/results/${savedRecord.id}`}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(`/results/${savedRecord.id}`)}
                      >
                        <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          View Full Forensic Verdict
                        </Button>
                      </Link>
                      <Link
                        href="/dashboard"
                        prefetch={true}
                        onMouseEnter={() => router.prefetch('/dashboard')}
                      >
                        <Button variant="secondary" size="sm" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                          Dashboard Scans
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveEmailToSupabase(parsedData)}
                      disabled={isSaving}
                      icon={isSaving ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    >
                      {isSaving ? 'Auto-Saving to Supabase...' : 'Sync to Supabase Now'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Parsed Email Inspection View
                </h2>
              </div>

              <EmailForensicPreview
                emailData={parsedData}
                savedDbRecord={savedRecord}
                onSaveToDatabase={(customAnalysis) => saveEmailToSupabase(parsedData, customAnalysis)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
