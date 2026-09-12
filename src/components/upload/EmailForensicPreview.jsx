'use client';

import React, { useState } from 'react';
import {
  FileText,
  Mail,
  Clock,
  Layers,
  Paperclip,
  Code,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Globe,
  Network,
  Send,
  Link2,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Info,
  Server,
  UserCheck,
  AlertTriangle,
  Fingerprint,
  MinusCircle,
  Route,
  ArrowDown
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export function EmailForensicPreview({ emailData }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' | 'identity' | 'transmission' | 'auth' | 'artifacts' | 'body' | 'mime' | 'attachments' | 'headers'
  const [copied, setCopied] = useState(false);
  const [headerFilter, setHeaderFilter] = useState('');

  if (!emailData) return null;

  const {
    metadata = {},
    headers = { all: [] },
    body = { text: '', html: '' },
    mime = { contentType: null, parts: [] },
    attachments = [],
    raw = { size: 0 },
    artifacts = {
      urls: [],
      ips: [],
      domains: [],
      senderDomains: { from: [], replyTo: [], returnPath: [] }
    },
    authentication = {
      authenticationResults: [],
      receivedSpf: [],
      spf: { results: [] },
      dkim: { signatures: [], results: [] },
      dmarc: { results: [] },
      arc: { seals: [], messageSignatures: [], authenticationResults: [] }
    },
    senderIdentity = {
      identities: { from: null, replyTo: [], returnPath: null, spf: [], dkim: [], dmarc: [] },
      comparisons: [],
      findings: []
    },
    transmission = {
      received: [],
      hops: [],
      latencies: [],
      findings: [],
      summary: { hopCount: 0, ipCount: 0, timestampCount: 0, totalLatencySeconds: null }
    },
    risk = {
      version: '1.0',
      totalScore: 0,
      rawScore: 0,
      level: 'LOW',
      contributions: [],
      summary: { totalContributions: 0, categories: { authentication: 0, sender_identity: 0, transmission: 0 } },
      methodology: { type: 'deterministic', version: '1.0' }
    }
  } = emailData;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Copied', `${label} copied to clipboard`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHeaders = headers.all.filter(
    (h) =>
      h.name.toLowerCase().includes(headerFilter.toLowerCase()) ||
      h.value.toLowerCase().includes(headerFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div className="glass-card p-6 border border-white/10 rounded-3xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primaryBlue/10 border border-primaryBlue/30 text-primaryBlue text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-successGreen" /> Normalized Forensic Email Object
            </span>
            <span className="text-xs font-mono text-textSecondary">
              Raw Size: {(raw.size / 1024).toFixed(2)} KB ({raw.size} bytes)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-textSecondary">
            {/* Deterministic Risk Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] border ${
                risk.level === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-glowRed'
                  : risk.level === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : risk.level === 'MEDIUM'
                  ? 'bg-warningYellow/20 text-warningYellow border-warningYellow/40'
                  : 'bg-successGreen/20 text-successGreen border-successGreen/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Risk: {risk.totalScore}/100 ({risk.level})
            </span>
            <span>•</span>
            <span>{headers.all.length} Headers</span>
            <span>•</span>
            <span>{mime.parts.length} MIME Parts</span>
            <span>•</span>
            <span>{artifacts.urls.length} URLs</span>
            <span>•</span>
            <span>{transmission.hops?.length || 0} Hops</span>
            <span>•</span>
            <span className={senderIdentity.findings?.length > 0 ? 'text-warningYellow font-bold' : ''}>
              {senderIdentity.findings?.length || 0} Identity Mismatches
            </span>
          </div>
        </div>

        {/* Email Core Subject & Sender */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-textPrimary leading-snug">
            {metadata.subject || '(No Subject Header)'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-textSecondary">
            <div>
              From: <strong className="text-textPrimary">{metadata.from || 'null'}</strong>
            </div>
            {metadata.date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primaryBlue" /> {metadata.date}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-borderSubtle pb-1">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'metadata'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Mail className="w-4 h-4" /> Metadata
        </button>

        <button
          onClick={() => setActiveTab('risk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'risk'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-warningYellow" /> Risk Analysis ({risk.totalScore}/100 • {risk.level})
        </button>

        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'identity'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Sender Identity ({senderIdentity.comparisons?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('transmission')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'transmission'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Route className="w-4 h-4" /> Mail Route ({transmission.hops?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'auth'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Authentication Evidence ({authentication.spf.results.length + authentication.dkim.signatures.length + authentication.dmarc.results.length})
        </button>

        <button
          onClick={() => setActiveTab('artifacts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'artifacts'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Globe className="w-4 h-4" /> Artifacts ({artifacts.urls.length + artifacts.ips.length + artifacts.domains.length})
        </button>

        <button
          onClick={() => setActiveTab('body')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'body'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <FileText className="w-4 h-4" /> Body
        </button>

        <button
          onClick={() => setActiveTab('mime')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'mime'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Layers className="w-4 h-4" /> MIME ({mime.parts.length})
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'attachments'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'headers'
              ? 'bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 shadow-glowBlue'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Code className="w-4 h-4" /> All Headers ({headers.all.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* TAB 1: METADATA */}
        {activeTab === 'metadata' && (
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textSecondary pb-2 border-b border-borderSubtle">
              Extracted RFC 5322 Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">From:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.from || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">To ({metadata.to.length}):</span>
                <div className="font-semibold text-textPrimary break-all">
                  {metadata.to.length > 0 ? metadata.to.join(', ') : '[]'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Subject:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.subject || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Date:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.date || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Reply-To ({metadata.replyTo.length}):</span>
                <div className="font-semibold text-textPrimary break-all">
                  {metadata.replyTo.length > 0 ? metadata.replyTo.join(', ') : '[]'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary">Return-Path:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.returnPath || 'null'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1 md:col-span-2">
                <span className="text-textSecondary">Message-ID:</span>
                <div className="font-semibold text-textPrimary break-all">{metadata.messageId || 'null'}</div>
              </div>

              {metadata.cc.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Cc:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.cc.join(', ')}</div>
                </div>
              )}

              {metadata.bcc.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Bcc:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.bcc.join(', ')}</div>
                </div>
              )}

              {metadata.inReplyTo && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">In-Reply-To:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.inReplyTo}</div>
                </div>
              )}

              {metadata.references.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1 md:col-span-2">
                  <span className="text-textSecondary">References:</span>
                  <div className="font-semibold text-textPrimary break-all">{metadata.references.join(' ')}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* TAB: RISK ANALYSIS (PHASE 6) */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Forensic Principle Notice */}
            <div className="p-4 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-primaryBlue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-textPrimary font-mono">
                  Deterministic Forensic Risk Analysis (Evidence-First Scoring)
                </div>
                <div className="text-textSecondary leading-relaxed font-sans">
                  Risk scoring is calculated deterministically from explicit observed evidence across Authentication, Sender Identity, and Header Transmission.
                  Points are awarded strictly when observable failures or inconsistencies exist; missing data is never penalized as a failure.
                  This assessment represents observed forensic risk and does NOT establish independent proof of malicious intent or confirmed phishing.
                </div>
              </div>
            </div>

            {/* Score Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2 md:col-span-1 flex flex-col justify-between">
                <span className="text-textSecondary text-[11px] uppercase tracking-wider">Total Risk Score</span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-extrabold ${
                      risk.level === 'CRITICAL'
                        ? 'text-red-400'
                        : risk.level === 'HIGH'
                        ? 'text-amber-400'
                        : risk.level === 'MEDIUM'
                        ? 'text-warningYellow'
                        : 'text-successGreen'
                    }`}
                  >
                    {risk.totalScore}
                  </span>
                  <span className="text-textSecondary text-xs">/ 100</span>
                </div>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
                      risk.level === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : risk.level === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : risk.level === 'MEDIUM'
                        ? 'bg-warningYellow/20 text-warningYellow border-warningYellow/40'
                        : 'bg-successGreen/20 text-successGreen border-successGreen/40'
                    }`}
                  >
                    {risk.level} Risk
                  </span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Authentication Failures:</span>
                <div className="text-2xl font-bold text-textPrimary">
                  +{risk.summary?.categories?.authentication || 0}
                </div>
                <span className="text-[10px] text-textSecondary">DMARC, SPF, DKIM reported failures</span>
              </div>

              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Sender Identity Mismatches:</span>
                <div className="text-2xl font-bold text-cyanAccent">
                  +{risk.summary?.categories?.sender_identity || 0}
                </div>
                <span className="text-[10px] text-textSecondary">From vs Reply-To/Return-Path/Auth</span>
              </div>

              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Transmission Anomalies:</span>
                <div className="text-2xl font-bold text-purpleAccent">
                  +{risk.summary?.categories?.transmission || 0}
                </div>
                <span className="text-[10px] text-textSecondary">Negative latency, host handoff</span>
              </div>
            </div>

            {/* Itemized Risk Contributions */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warningYellow" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Evidence-Backed Risk Contributions ({risk.contributions?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">
                  Methodology: Deterministic v{risk.version || '1.0'}
                </span>
              </div>

              {risk.contributions?.length === 0 ? (
                <div className="p-4 rounded-2xl bg-successGreen/10 border border-successGreen/20 text-xs font-mono text-successGreen flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No risk contributions detected. Evaluated email evidence shows no authentication failures, identity mismatches, or transmission anomalies.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {risk.contributions.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-2 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] font-bold">
                            +{c.points} pts
                          </span>
                          <span className="font-bold text-textPrimary text-xs">{c.id}</span>
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-textSecondary">
                            {c.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-textSecondary leading-relaxed text-[11px]">{c.reason}</p>

                      {c.evidence && (
                        <div className="p-2.5 rounded-xl bg-surfacePrimary/80 border border-borderSubtle text-[10px] space-y-1 break-all">
                          {c.evidence.source && <div><strong>Source:</strong> {c.evidence.source}</div>}
                          {c.evidence.result && <div><strong>Reported Result:</strong> {c.evidence.result}</div>}
                          {c.evidence.domain && <div><strong>Domain:</strong> {c.evidence.domain}</div>}
                          {c.evidence.policy && <div><strong>Policy:</strong> {c.evidence.policy}</div>}
                          {c.evidence.clientIp && <div><strong>Client IP:</strong> {c.evidence.clientIp}</div>}
                          {c.evidence.comparison && <div><strong>Comparison:</strong> {c.evidence.comparison}</div>}
                          {c.evidence.sourceA?.domain && (
                            <div><strong>Source A ({c.evidence.sourceA.type}):</strong> {c.evidence.sourceA.domain}</div>
                          )}
                          {c.evidence.sourceB?.domain && (
                            <div><strong>Source B ({c.evidence.sourceB.type}):</strong> {c.evidence.sourceB.domain}</div>
                          )}
                          {c.evidence.type && <div><strong>Anomaly Type:</strong> {c.evidence.type}</div>}
                          {c.evidence.raw && <div><strong>Raw Header:</strong> {c.evidence.raw}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: SENDER IDENTITY & CONSISTENCY (PHASE 4) */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            {/* Forensic Principle Notice */}
            <div className="p-4 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-primaryBlue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-textPrimary font-mono">
                  Deterministic Header Consistency Findings
                </div>
                <div className="text-textSecondary leading-relaxed font-sans">
                  The consistency checks below deterministically compare sender identities across message headers and authentication records.
                  Mismatches represent observed header discrepancies and NOT independent proof of maliciousness or fraud. Legitimate mailing lists, transactional gateways, and enterprise relays frequently show envelope discrepancies.
                </div>
              </div>
            </div>

            {/* Identities Overview Grid */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyanAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Primary Sender Identities
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Extracted from Headers & Auth</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* From Identity */}
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <div className="flex items-center justify-between text-textSecondary">
                    <span>From Header:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-primaryBlue font-semibold">Primary</span>
                  </div>
                  <div className="font-semibold text-textPrimary break-all">
                    {senderIdentity.identities?.from?.address || 'None'}
                  </div>
                  <div className="text-[11px] text-textSecondary">
                    Domain: <strong className="text-cyanAccent">{senderIdentity.identities?.from?.domain || 'None'}</strong>
                  </div>
                </div>

                {/* Reply-To Identity */}
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <div className="flex items-center justify-between text-textSecondary">
                    <span>Reply-To ({senderIdentity.identities?.replyTo?.length || 0}):</span>
                  </div>
                  {senderIdentity.identities?.replyTo?.length === 0 ? (
                    <div className="text-textSecondary italic">None</div>
                  ) : (
                    senderIdentity.identities.replyTo.map((rt, idx) => (
                      <div key={idx} className="space-y-0.5 border-b border-white/5 pb-1 last:border-none last:pb-0">
                        <div className="font-semibold text-textPrimary break-all">{rt.address || rt.raw}</div>
                        <div className="text-[11px] text-textSecondary">
                          Domain: <strong className="text-cyanAccent">{rt.domain || 'None'}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Return-Path Identity */}
                <div className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <div className="flex items-center justify-between text-textSecondary">
                    <span>Return-Path:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-textSecondary">Envelope</span>
                  </div>
                  <div className="font-semibold text-textPrimary break-all">
                    {senderIdentity.identities?.returnPath?.address || 'None'}
                  </div>
                  <div className="text-[11px] text-textSecondary">
                    Domain: <strong className="text-cyanAccent">{senderIdentity.identities?.returnPath?.domain || 'None'}</strong>
                  </div>
                </div>
              </div>

              {/* Authentication Domains Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-2">
                {/* SPF Domains */}
                <div className="p-3 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-1">
                  <span className="text-textSecondary text-[11px]">SPF Authenticated Domains:</span>
                  {senderIdentity.identities?.spf?.length === 0 ? (
                    <div className="text-textSecondary italic text-[11px]">None reported</div>
                  ) : (
                    senderIdentity.identities.spf.map((s, idx) => (
                      <div key={idx} className="text-textPrimary font-semibold flex items-center justify-between">
                        <span>{s.domain}</span>
                        <span className="text-[10px] text-textSecondary">{s.source}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* DKIM Signing Domains */}
                <div className="p-3 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-1">
                  <span className="text-textSecondary text-[11px]">DKIM Signing Domains (d=):</span>
                  {senderIdentity.identities?.dkim?.length === 0 ? (
                    <div className="text-textSecondary italic text-[11px]">None observed</div>
                  ) : (
                    senderIdentity.identities.dkim.map((d, idx) => (
                      <div key={idx} className="text-textPrimary font-semibold flex items-center justify-between">
                        <span>{d.domain}</span>
                        {d.selector && <span className="text-[10px] text-textSecondary">s={d.selector}</span>}
                      </div>
                    ))
                  )}
                </div>

                {/* DMARC header.from */}
                <div className="p-3 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-1">
                  <span className="text-textSecondary text-[11px]">DMARC header.from:</span>
                  {senderIdentity.identities?.dmarc?.length === 0 ? (
                    <div className="text-textSecondary italic text-[11px]">None reported</div>
                  ) : (
                    senderIdentity.identities.dmarc.map((dm, idx) => (
                      <div key={idx} className="text-textPrimary font-semibold">
                        {dm.domain || dm.headerFrom}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Consistency Checks Matrix */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-primaryBlue" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Identity Consistency Checks ({senderIdentity.comparisons?.length || 0})
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1 text-successGreen">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Match
                  </span>
                  <span className="inline-flex items-center gap-1 text-warningYellow">
                    <AlertTriangle className="w-3.5 h-3.5" /> Mismatch
                  </span>
                  <span className="inline-flex items-center gap-1 text-textSecondary">
                    <MinusCircle className="w-3.5 h-3.5" /> Unavailable
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {senderIdentity.comparisons?.map((comp, idx) => {
                  const isMatch = comp.status === 'match';
                  const isMismatch = comp.status === 'mismatch';
                  const isUnavailable = comp.status === 'unavailable';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs font-mono space-y-2 transition-all ${
                        isMatch
                          ? 'bg-successGreen/5 border-successGreen/20'
                          : isMismatch
                          ? 'bg-warningYellow/5 border-warningYellow/30'
                          : 'bg-surfaceSecondary border-borderSubtle'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-textPrimary uppercase">
                          {isMatch && <CheckCircle2 className="w-4 h-4 text-successGreen" />}
                          {isMismatch && <AlertTriangle className="w-4 h-4 text-warningYellow" />}
                          {isUnavailable && <MinusCircle className="w-4 h-4 text-textSecondary" />}
                          <span>{comp.type.replace(/_/g, ' ')}</span>
                        </div>

                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isMatch
                              ? 'bg-successGreen/20 text-successGreen border border-successGreen/40'
                              : isMismatch
                              ? 'bg-warningYellow/20 text-warningYellow border border-warningYellow/40'
                              : 'bg-white/10 text-textSecondary border border-white/10'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                        <div>
                          <span className="text-textSecondary">{comp.sourceA?.type}: </span>
                          <span className="text-textPrimary font-semibold">{comp.sourceA?.domain || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-textSecondary">{comp.sourceB?.type}: </span>
                          <span className="text-textPrimary font-semibold">{comp.sourceB?.domain || 'N/A'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-textSecondary leading-relaxed">{comp.message}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Detected Mismatch Findings */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warningYellow" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Detected Mismatch Findings ({senderIdentity.findings?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Deterministic Evidence Findings</span>
              </div>

              {senderIdentity.findings?.length === 0 ? (
                <div className="p-4 rounded-2xl bg-successGreen/10 border border-successGreen/20 text-xs font-mono text-successGreen flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No sender domain mismatches detected. All evaluated headers are consistent.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {senderIdentity.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-warningYellow/10 border border-warningYellow/30 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-textPrimary text-xs">{f.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-textSecondary">
                            {f.comparison}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-warningYellow uppercase px-2 py-0.5 rounded bg-warningYellow/20 border border-warningYellow/30">
                          Observed Mismatch
                        </span>
                      </div>

                      <p className="text-textSecondary leading-relaxed">{f.message}</p>

                      {f.evidence && (
                        <div className="p-2.5 rounded-xl bg-surfacePrimary/80 border border-borderSubtle text-[10px] space-y-1 break-all">
                          {f.evidence.fromRaw && <div><strong>From Raw:</strong> {f.evidence.fromRaw}</div>}
                          {f.evidence.replyToRaw && <div><strong>Reply-To Raw:</strong> {f.evidence.replyToRaw}</div>}
                          {f.evidence.returnPathRaw && <div><strong>Return-Path Raw:</strong> {f.evidence.returnPathRaw}</div>}
                          {f.evidence.spfRaw && <div><strong>SPF Raw:</strong> {f.evidence.spfRaw}</div>}
                          {f.evidence.dkimRaw && <div><strong>DKIM Raw:</strong> {f.evidence.dkimRaw}</div>}
                          {f.evidence.dmarcRaw && <div><strong>DMARC Raw:</strong> {f.evidence.dmarcRaw}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 3: TRANSMISSION & MAIL ROUTE (PHASE 5) */}
        {activeTab === 'transmission' && (
          <div className="space-y-6">
            {/* Forensic Principle Notice */}
            <div className="p-4 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-primaryBlue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-textPrimary font-mono">
                  Observed Mail Transmission Route (Received Header Chain)
                </div>
                <div className="text-textSecondary leading-relaxed font-sans">
                  The hops below are reconstructed from observed <code>Received:</code> headers in chronological transmission sequence (oldest to newest).
                  Received headers are server-reported claims recorded by MTAs along the path; observed anomalies (such as negative latency or host discrepancies) are recorded as forensic findings and not independent proof of forgery or maliciousness.
                </div>
              </div>
            </div>

            {/* Transmission Summary Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Total Hops:</span>
                <div className="text-lg font-bold text-textPrimary">{transmission.summary?.hopCount || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Observed IPs:</span>
                <div className="text-lg font-bold text-cyanAccent">{transmission.summary?.ipCount || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Valid Timestamps:</span>
                <div className="text-lg font-bold text-textPrimary">{transmission.summary?.timestampCount || 0}</div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                <span className="text-textSecondary text-[11px]">Total Transit Time:</span>
                <div className="text-lg font-bold text-purpleAccent">
                  {transmission.summary?.totalLatencySeconds !== null && transmission.summary?.totalLatencySeconds !== undefined
                    ? `${transmission.summary.totalLatencySeconds}s`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Chronological Hop Chain Visualizer */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-cyanAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Chronological Mail Route (Origin → Destination)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">
                  Oldest (Hop 0) to Newest (Hop {Math.max(0, (transmission.hops?.length || 1) - 1)})
                </span>
              </div>

              {transmission.hops?.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No Received headers found in email.</p>
              ) : (
                <div className="space-y-4 relative">
                  {transmission.hops.map((hop, idx) => {
                    const latency = transmission.latencies?.find((l) => l.fromHopIndex === hop.chronologicalIndex);

                    return (
                      <div key={idx} className="space-y-3">
                        <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-primaryBlue/20 text-primaryBlue border border-primaryBlue/40 text-[11px] font-bold">
                                Chronological Hop #{hop.chronologicalIndex}
                              </span>
                              <span className="text-[10px] text-textSecondary">
                                (Raw Header #{hop.headerIndex})
                              </span>
                              {hop.chronologicalIndex === 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-cyanAccent font-semibold">
                                  Earliest Reported Hop
                                </span>
                              )}
                              {hop.chronologicalIndex === transmission.hops.length - 1 && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-successGreen font-semibold">
                                  Final Receiving Hop
                                </span>
                              )}
                            </div>

                            {hop.timestamp?.normalized && (
                              <div className="text-[11px] text-textSecondary flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-primaryBlue" />
                                <span>{hop.timestamp.normalized}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
                            <div>
                              <span className="text-textSecondary">From Host: </span>
                              <span className="font-semibold text-textPrimary">{hop.from?.host || 'None reported'}</span>
                              {hop.from?.ip && (
                                <span className="text-cyanAccent ml-1.5 font-mono">[{hop.from.ip}]</span>
                              )}
                            </div>

                            <div>
                              <span className="text-textSecondary">Received By: </span>
                              <span className="font-semibold text-textPrimary">{hop.by?.host || 'None reported'}</span>
                              {hop.by?.ip && (
                                <span className="text-cyanAccent ml-1.5 font-mono">[{hop.by.ip}]</span>
                              )}
                            </div>

                            <div>
                              <span className="text-textSecondary">Protocol / With: </span>
                              <span className="text-textPrimary">{hop.with || 'None'}</span>
                            </div>

                            <div>
                              <span className="text-textSecondary">Message / Queue ID: </span>
                              <span className="text-textPrimary break-all">{hop.id || 'None'}</span>
                            </div>

                            {hop.for && (
                              <div className="md:col-span-2">
                                <span className="text-textSecondary">For Recipient: </span>
                                <span className="text-textPrimary">{hop.for}</span>
                              </div>
                            )}
                          </div>

                          {hop.ips?.length > 0 && (
                            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-[10px]">
                              <span className="text-textSecondary">Extracted IPs:</span>
                              {hop.ips.map((ipObj, ipIdx) => (
                                <span
                                  key={ipIdx}
                                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-cyanAccent flex items-center gap-1"
                                >
                                  <span>{ipObj.address}</span>
                                  <span className="text-[9px] uppercase px-1 rounded bg-white/10 text-textSecondary">
                                    {ipObj.type}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-[10px] text-textSecondary/70 break-all pt-1">
                            <strong>Raw:</strong> {hop.raw}
                          </div>
                        </div>

                        {/* Latency Transition to Next Hop */}
                        {latency && idx < transmission.hops.length - 1 && (
                          <div className="flex items-center justify-center my-1">
                            <div
                              className={`px-3 py-1 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1.5 ${
                                latency.status === 'valid'
                                  ? 'bg-primaryBlue/10 text-primaryBlue border border-primaryBlue/30'
                                  : latency.status === 'negative'
                                  ? 'bg-warningYellow/20 text-warningYellow border border-warningYellow/40 font-bold'
                                  : 'bg-white/5 text-textSecondary border border-white/10'
                              }`}
                            >
                              <ArrowDown className="w-3 h-3" />
                              {latency.status === 'valid' && (
                                <span>Transit Latency: +{latency.seconds}s</span>
                              )}
                              {latency.status === 'negative' && (
                                <span>Negative Latency Anomaly: {latency.seconds}s</span>
                              )}
                              {latency.status === 'unavailable' && (
                                <span>Transit Latency: Unavailable (Missing Timestamp)</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Transmission Findings Log */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warningYellow" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Transmission Findings ({transmission.findings?.length || 0})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Deterministic Route Anomalies</span>
              </div>

              {transmission.findings?.length === 0 ? (
                <div className="p-4 rounded-2xl bg-successGreen/10 border border-successGreen/20 text-xs font-mono text-successGreen flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No transmission route anomalies or negative latencies detected.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {transmission.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-warningYellow/10 border border-warningYellow/30 text-xs font-mono space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-textPrimary text-xs">{f.id}</span>
                        <span className="text-[10px] font-bold text-warningYellow uppercase px-2 py-0.5 rounded bg-warningYellow/20 border border-warningYellow/30">
                          Observed Anomaly
                        </span>
                      </div>

                      <p className="text-textSecondary leading-relaxed">{f.message}</p>

                      {f.evidence && (
                        <div className="p-2.5 rounded-xl bg-surfacePrimary/80 border border-borderSubtle text-[10px] space-y-1 break-all">
                          {f.evidence.latencySeconds !== undefined && (
                            <div><strong>Observed Latency:</strong> {f.evidence.latencySeconds}s</div>
                          )}
                          {f.evidence.olderTimestamp && (
                            <div><strong>Earlier Timestamp:</strong> {f.evidence.olderTimestamp}</div>
                          )}
                          {f.evidence.newerTimestamp && (
                            <div><strong>Later Timestamp:</strong> {f.evidence.newerTimestamp}</div>
                          )}
                          {f.evidence.rawTimestamp && (
                            <div><strong>Raw Timestamp:</strong> {f.evidence.rawTimestamp}</div>
                          )}
                          {f.evidence.priorByHost && (
                            <div><strong>Prior By Host:</strong> {f.evidence.priorByHost}</div>
                          )}
                          {f.evidence.nextFromHost && (
                            <div><strong>Next From Host:</strong> {f.evidence.nextFromHost}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 4: AUTHENTICATION EVIDENCE (PHASE 3) */}
        {activeTab === 'auth' && (
          <div className="space-y-6">
            {/* Forensic Principle Notice */}
            <div className="p-4 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-primaryBlue flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-textPrimary font-mono">
                  Observed Authentication Evidence (Reported by Message Headers)
                </div>
                <div className="text-textSecondary leading-relaxed font-sans">
                  The values below represent authentication outcomes reported directly within the email headers.
                  This phase extracts and organizes reported evidence and does not claim independent cryptographic verification.
                </div>
              </div>
            </div>

            {/* SPF Evidence Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyanAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    SPF Evidence ({authentication.spf.results.length} Observed Outcomes)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Authentication-Results & Received-SPF</span>
              </div>

              {authentication.spf.results.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No SPF authentication headers observed in message.</p>
              ) : (
                <div className="space-y-3">
                  {authentication.spf.results.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-textPrimary uppercase">Reported Result: {item.result}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-textSecondary">
                            Source: {item.source}
                          </span>
                        </div>
                        {item.clientIp && <span className="text-cyanAccent">{item.clientIp}</span>}
                      </div>

                      {item.domain && (
                        <div className="text-textSecondary">
                          Domain / MailFrom: <strong className="text-textPrimary">{item.domain}</strong>
                        </div>
                      )}

                      <div className="text-[11px] text-textSecondary/80 break-all pt-1">
                        Raw: {item.raw}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* DKIM Evidence Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purpleAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    DKIM Evidence ({authentication.dkim.signatures.length} Signatures, {authentication.dkim.results.length} Reported Results)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">DKIM-Signature & Authentication-Results</span>
              </div>

              {/* Reported Results */}
              {authentication.dkim.results.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-textSecondary font-mono uppercase">Reported DKIM Results:</div>
                  {authentication.dkim.results.map((res, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between font-bold text-textPrimary">
                        <span>Reported Result: {res.result}</span>
                        {res.domain && <span className="text-purpleAccent">header.d={res.domain}</span>}
                      </div>
                      {res.selector && <div className="text-[11px] text-textSecondary">Selector: header.s={res.selector}</div>}
                      <div className="text-[10px] text-textSecondary/80 break-all">Raw: {res.raw}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Parsed DKIM Signatures */}
              {authentication.dkim.signatures.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No DKIM-Signature headers observed in message.</p>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-textSecondary font-mono uppercase">Observed DKIM Signatures:</div>
                  {authentication.dkim.signatures.map((sig, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-primaryBlue font-bold">Domain (d=): {sig.domain || 'null'}</span>
                        <span className="text-textSecondary">Selector (s=): {sig.selector || 'null'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-textSecondary">
                        <div>Algorithm (a=): {sig.algorithm || 'null'}</div>
                        <div>Canonicalization (c=): {sig.canonicalization ? `${sig.canonicalization.header}/${sig.canonicalization.body}` : 'null'}</div>
                        <div>Version (v=): {sig.version || 'null'}</div>
                      </div>

                      {sig.signedHeaders && sig.signedHeaders.length > 0 && (
                        <div className="text-[11px] text-textSecondary">
                          Signed Headers (h=): <span className="text-textPrimary">{sig.signedHeaders.join(', ')}</span>
                        </div>
                      )}

                      {sig.bodyHash && (
                        <div className="text-[11px] text-textSecondary break-all">
                          Body Hash (bh=): {sig.bodyHash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* DMARC Evidence Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warningAmber" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    DMARC Evidence ({authentication.dmarc.results.length} Reported Results)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Reported from Authentication-Results</span>
              </div>

              {authentication.dmarc.results.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No DMARC result header observed in message.</p>
              ) : (
                <div className="space-y-3">
                  {authentication.dmarc.results.map((res, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-textPrimary uppercase">Reported Result: {res.result}</span>
                        {res.policy && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-warningAmber">
                            Explicit Policy: {res.policy}
                          </span>
                        )}
                      </div>

                      {res.domain && (
                        <div className="text-textSecondary">
                          Header Domain (header.from): <strong className="text-textPrimary">{res.domain}</strong>
                        </div>
                      )}

                      <div className="text-[11px] text-textSecondary/80 break-all pt-1">
                        Raw: {res.raw}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ARC Evidence Section */}
            {(authentication.arc.seals.length > 0 || authentication.arc.messageSignatures.length > 0 || authentication.arc.authenticationResults.length > 0) && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-primaryBlue" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                      Authenticated Received Chain (ARC) Evidence
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-textSecondary">
                    {authentication.arc.seals.length} Seals • {authentication.arc.messageSignatures.length} Msg Signatures
                  </span>
                </div>

                <div className="space-y-3">
                  {authentication.arc.seals.map((seal, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between font-bold text-textPrimary">
                        <span className="text-primaryBlue">ARC-Seal [Instance i={seal.instance}]</span>
                        <span>cv={seal.cv || 'null'}</span>
                      </div>
                      <div className="text-[11px] text-textSecondary">
                        Algorithm: {seal.algorithm} • Domain: {seal.domain} • Selector: {seal.selector}
                      </div>
                    </div>
                  ))}

                  {authentication.arc.messageSignatures.map((ms, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between font-bold text-textPrimary">
                        <span className="text-purpleAccent">ARC-Message-Signature [Instance i={ms.instance}]</span>
                        <span>d={ms.domain}</span>
                      </div>
                      <div className="text-[11px] text-textSecondary">
                        Algorithm: {ms.algorithm} • Selector: {ms.selector}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: ARTIFACTS (PHASE 2) */}
        {activeTab === 'artifacts' && (
          <div className="space-y-6">
            {/* Sender Domains Section */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-borderSubtle">
                <Send className="w-4 h-4 text-purpleAccent" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                  Sender Domains
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">From Domain(s):</span>
                  <div className="font-semibold text-textPrimary">
                    {artifacts.senderDomains.from.length > 0 ? artifacts.senderDomains.from.join(', ') : '[]'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Reply-To Domain(s):</span>
                  <div className="font-semibold text-textPrimary">
                    {artifacts.senderDomains.replyTo.length > 0 ? artifacts.senderDomains.replyTo.join(', ') : '[]'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle space-y-1">
                  <span className="text-textSecondary">Return-Path Domain(s):</span>
                  <div className="font-semibold text-textPrimary">
                    {artifacts.senderDomains.returnPath.length > 0 ? artifacts.senderDomains.returnPath.join(', ') : '[]'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Extracted URLs */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primaryBlue" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Extracted URLs ({artifacts.urls.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Original & Normalized</span>
              </div>

              {artifacts.urls.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No URLs extracted from email content.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {artifacts.urls.map((urlItem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-primaryBlue font-semibold">{urlItem.domain}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-textSecondary">
                          Source: {urlItem.source}
                        </span>
                      </div>
                      <div className="text-textPrimary break-all">
                        <span className="text-textSecondary">Normalized: </span>
                        {urlItem.normalized}
                      </div>
                      <div className="text-[11px] text-textSecondary break-all">
                        <span>Original: </span>
                        {urlItem.original}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Extracted IP Addresses */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyanAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Extracted IP Addresses ({artifacts.ips.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Validated Transmission IPs</span>
              </div>

              {artifacts.ips.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No IP addresses extracted from Received headers.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {artifacts.ips.map((ipItem, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1"
                    >
                      <div className="font-bold text-textPrimary flex items-center justify-between">
                        <span className="text-cyanAccent">{ipItem.address}</span>
                        <span className="text-[10px] text-textSecondary px-1.5 py-0.5 rounded bg-white/5">
                          IPv{ipItem.version}
                        </span>
                      </div>
                      <div className="text-[11px] text-textSecondary">Source: {ipItem.source}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Extracted Domains */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purpleAccent" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
                    Extracted Domains ({artifacts.domains.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-textSecondary">Subdomains Preserved</span>
              </div>

              {artifacts.domains.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No domains extracted.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {artifacts.domains.map((dom, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1"
                    >
                      <div className="font-semibold text-textPrimary break-all">{dom.normalized}</div>
                      <div className="text-[10px] text-textSecondary flex items-center justify-between">
                        <span>Orig: {dom.original}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/5">{dom.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 4: BODY */}
        {activeTab === 'body' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="text-xs font-bold font-mono text-textPrimary">Plain Text Body</div>
                <div className="text-xs font-mono text-textSecondary">{body.text.length} characters</div>
              </div>

              {body.text ? (
                <pre className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle font-mono text-xs text-textPrimary leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {body.text}
                </pre>
              ) : (
                <p className="text-xs text-textSecondary italic">No plain-text body content extracted.</p>
              )}
            </Card>

            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-borderSubtle">
                <div className="text-xs font-bold font-mono text-textPrimary">HTML Body Indicator & Source</div>
                <div className="text-xs font-mono text-textSecondary">
                  {body.html ? `${body.html.length} characters (HTML present)` : 'No HTML body present'}
                </div>
              </div>

              {body.html ? (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-purpleAccent/10 border border-purpleAccent/30 text-xs text-purpleAccent font-mono">
                    Note: Untrusted HTML source displayed for inspection. Scripts are never executed.
                  </div>
                  <pre className="p-4 rounded-2xl bg-black/80 border border-white/5 font-mono text-xs text-cyanAccent/90 leading-relaxed overflow-x-auto max-h-80 overflow-y-auto">
                    {body.html}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-textSecondary italic">No HTML body part present in email.</p>
              )}
            </Card>
          </div>
        )}

        {/* TAB 5: MIME STRUCTURE */}
        {activeTab === 'mime' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderSubtle text-xs font-mono">
              <span className="text-textSecondary">
                Top-Level Content-Type: <strong className="text-textPrimary">{mime.contentType || 'text/plain'}</strong>
              </span>
              <span className="text-textSecondary">Total Parts: {mime.parts.length}</span>
            </div>

            {mime.parts.length === 0 ? (
              <p className="text-xs text-textSecondary italic">No MIME parts extracted.</p>
            ) : (
              <div className="space-y-3">
                {mime.parts.map((part, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between font-bold text-textPrimary">
                      <span className="text-primaryBlue">Part #{idx + 1}: {part.contentType}</span>
                      {part.filename && (
                        <span className="text-purpleAccent">{part.filename}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-textSecondary">
                      <div>Disposition: {part.contentDisposition || 'inline'}</div>
                      <div>Encoding: {part.contentTransferEncoding || '7bit'}</div>
                      <div>File: {part.filename || 'none'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 6: ATTACHMENTS */}
        {activeTab === 'attachments' && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderSubtle text-xs font-mono text-textSecondary">
              <span>Detected Attachments ({attachments.length})</span>
              <span>Metadata extraction foundation</span>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-textSecondary italic">No attachments detected in this message.</p>
            ) : (
              <div className="space-y-3">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-textPrimary">
                      <span className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-purpleAccent" />
                        {att.filename}
                      </span>
                      <span className="text-textSecondary text-[11px]">
                        {att.size !== null ? `${att.size} bytes` : 'Size Unknown (null)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-textSecondary">
                      <div>Content-Type: {att.contentType}</div>
                      <div>Disposition: {att.contentDisposition}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 7: ALL HEADERS */}
        {activeTab === 'headers' && (
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
                <input
                  type="text"
                  value={headerFilter}
                  onChange={(e) => setHeaderFilter(e.target.value)}
                  placeholder="Filter headers..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primaryBlue"
                />
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    headers.all.map((h) => `${h.name}: ${h.value}`).join('\n'),
                    'All Headers'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono text-textPrimary hover:border-primaryBlue transition-all self-start sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-successGreen" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Headers</span>
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredHeaders.length === 0 ? (
                <p className="text-xs text-textSecondary italic">No headers match filter.</p>
              ) : (
                filteredHeaders.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs font-mono space-y-1 hover:border-white/20 transition-colors"
                  >
                    <div className="text-primaryBlue font-bold select-all">{h.name}:</div>
                    <div className="text-textPrimary break-all leading-relaxed select-all pl-2">
                      {h.value}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
