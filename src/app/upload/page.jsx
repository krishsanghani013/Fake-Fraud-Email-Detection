'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  FileText,
  AlertCircle,
  File,
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Send
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { parseRawEmail, validateEmailInput } from '../../lib/emailParser';
import { EmailForensicPreview } from '../../components/upload/EmailForensicPreview';

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

  // Auto-parse pasted raw text with debounce
  useEffect(() => {
    if (ingestionMode === 'paste') {
      if (!rawText.trim()) {
        setParsedData(null);
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
        } else {
          setParsedData(null);
          setErrorMessage(result.error || 'Failed to parse RFC 5322 email.');
          setWarnings(result.warnings || []);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [rawText, ingestionMode]);

  // Process .eml file upload
  const processEmailFile = (file) => {
    setErrorMessage('');
    setWarnings([]);

    // File validation: extension check (.eml strictly required per section 1.B)
    const isEml = file.name.toLowerCase().endsWith('.eml');
    if (!isEml) {
      const err = `Invalid file format (${file.name}). Please select a valid .eml file.`;
      setErrorMessage(err);
      setParsedData(null);
      toast('Invalid File Type', err, 'error');
      return;
    }

    // File validation: empty file check
    if (file.size === 0) {
      const err = 'The selected .eml file is empty (0 bytes).';
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
      } else {
        setParsedData(null);
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

  // Load sample email
  const loadSample = (sample) => {
    setRawText(sample.raw);
    setIngestionMode('paste');
    toast('Sample Loaded', `Loaded "${sample.title}"`, 'info');
  };

  // Clear / Reset
  const handleReset = () => {
    setRawText('');
    setUploadedFile(null);
    setParsedData(null);
    setErrorMessage('');
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast('Reset', 'Workbench input and parsed output cleared', 'info');
  };

  const hasContent = Boolean(rawText.trim() || uploadedFile || parsedData);

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-primaryBlue uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> RFC 5322 Ingestion Foundation
            </div>
            <h1 className="text-3xl font-bold font-heading">
              Email Input & RFC 5322 Parsing
            </h1>
            <p className="text-xs text-textSecondary">
              Local, zero-retention RFC 5322 header and MIME body parser generating canonical normalized email objects.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIngestionMode('paste')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  ingestionMode === 'paste'
                    ? 'bg-primaryBlue text-white shadow-glowBlue'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                <FileCode className="w-4 h-4" /> Mode A: Paste Raw Email
              </button>
              <button
                onClick={() => setIngestionMode('upload')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  ingestionMode === 'upload'
                    ? 'bg-primaryBlue text-white shadow-glowBlue'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Mode B: Upload .eml File
              </button>
            </div>

            {hasContent && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-borderSubtle text-textSecondary hover:text-dangerRed hover:border-dangerRed/40 text-xs font-semibold transition-all self-start sm:self-auto"
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
                  <span className="text-xs font-medium text-textSecondary">
                    Load Deterministic Test Samples:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {DETERMINISTIC_SAMPLES.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadSample(sample)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-borderSubtle hover:border-primaryBlue/50 text-[11px] font-mono text-textSecondary hover:text-textPrimary transition-all"
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
                    className="w-full bg-surfaceSecondary border border-borderSubtle rounded-2xl p-4 text-xs font-mono text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-primaryBlue transition-colors leading-relaxed selection:bg-primaryBlue/30"
                  />

                  <div className="absolute bottom-3 right-4 text-[10px] font-mono text-textSecondary/70 pointer-events-none bg-surfaceSecondary/90 px-2 py-0.5 rounded border border-white/5">
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
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer group ${
                    isDragging
                      ? 'border-primaryBlue bg-primaryBlue/10 shadow-glowBlue'
                      : 'border-borderSubtle hover:border-primaryBlue/50 bg-surfaceSecondary/40 hover:bg-surfaceSecondary/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".eml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processEmailFile(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-primaryBlue/10 text-primaryBlue flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>

                  <h3 className="text-sm font-bold text-textPrimary">
                    {isDragging ? 'Drop .eml file here' : 'Select or Drag & Drop .eml file'}
                  </h3>
                  <p className="text-xs text-textSecondary mt-1">
                    Accepts standard RFC 5322 <strong className="text-textPrimary">.eml</strong> files.
                  </p>

                  <div className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs font-semibold group-hover:border-primaryBlue/40 transition-all">
                    Browse File (.eml)
                  </div>
                </div>

                {uploadedFile && (
                  <div className="p-4 rounded-2xl bg-surfaceSecondary border border-primaryBlue/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-primaryBlue" />
                      <div>
                        <div className="text-xs font-bold text-textPrimary">{uploadedFile.name}</div>
                        <div className="text-[11px] text-textSecondary font-mono">{uploadedFile.size}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="p-1.5 rounded-lg text-textSecondary hover:text-dangerRed transition-colors"
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
              <div className="p-4 rounded-2xl bg-dangerRed/10 border border-dangerRed/30 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-dangerRed flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-dangerRed">Validation Error</div>
                  <div className="text-textSecondary">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Warnings Feedback */}
            {warnings.length > 0 && !errorMessage && (
              <div className="p-4 rounded-2xl bg-warningAmber/10 border border-warningAmber/30 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-warningAmber flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-warningAmber">Parsing Warnings</div>
                  <div className="text-textSecondary">{warnings.join(' • ')}</div>
                </div>
              </div>
            )}
          </Card>

          {/* Parsed Email Display */}
          {parsedData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-textSecondary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-successGreen" /> Parsed Email Inspection View
                </h2>
              </div>

              <EmailForensicPreview emailData={parsedData} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
