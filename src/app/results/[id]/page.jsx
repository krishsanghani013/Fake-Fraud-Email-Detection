'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Share2,
  FileJson,
  Brain,
  Globe,
  KeyRound,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Copy,
  ExternalLink,
  PlusCircle,
  FileText
} from 'lucide-react';
import { AppHeader } from '../../../components/layout/AppHeader';
import { AppSidebar } from '../../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SAMPLE_SCANS } from '../../../data/mockData';
import { useToast } from '../../../components/ui/Toast';

export default function ResultsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const scan = SAMPLE_SCANS['ceo-wire-fraud'];

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast('Copied to Clipboard', label, 'success');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-textSecondary">Scan ID: {scan.id}</span>
                <span>•</span>
                <span className="text-xs font-mono text-purpleAccent">{scan.scanTimestamp}</span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-textPrimary">
                {scan.subject}
              </h1>
              <p className="text-xs text-textSecondary font-mono">
                Sender: <strong className="text-textPrimary">{scan.senderEmail}</strong> ({scan.senderName})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => toast('PDF Security Report Generated', 'Downloading high-res PDF...', 'success')}
                className="px-4 py-2 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textPrimary text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-primaryBlue" /> PDF Report
              </button>
              <button
                onClick={() => copyToClipboard(JSON.stringify(scan, null, 2), 'JSON Scan Data')}
                className="px-4 py-2 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-purpleAccent/40 text-textPrimary text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <FileJson className="w-4 h-4 text-purpleAccent" /> Export JSON
              </button>
              <Link href="/cases">
                <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
                  Create SOC Incident Case
                </Button>
              </Link>
            </div>
          </div>

          {/* Risk Score & Executive Summary Top Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Circular Risk Score Gauge (4 cols) */}
            <div className="lg:col-span-4">
              <Card className="p-8 text-center flex flex-col justify-between h-full bg-gradient-to-b from-surface to-surfaceSecondary">
                <div>
                  <div className="text-xs font-mono uppercase text-textSecondary tracking-wider">
                    Calculated Threat Index
                  </div>

                  <div className="my-8 relative inline-flex items-center justify-center">
                    <svg className="w-44 h-44 transform -rotate-90">
                      <circle cx="88" cy="88" r="76" stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="transparent" />
                      <circle
                        cx="88"
                        cy="88"
                        r="76"
                        stroke="#7C5CFC"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={477}
                        strokeDashoffset={477 - (477 * scan.riskScore) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_15px_rgba(124,92,252,0.5)]"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold font-heading text-textPrimary">{scan.riskScore}</span>
                      <span className="text-[10px] text-textSecondary uppercase font-mono">/ 100 Score</span>
                    </div>
                  </div>

                  <Badge level={scan.riskLevel} size="md" className="mx-auto text-sm px-4 py-1.5">
                    {scan.riskLevel} THREAT
                  </Badge>
                </div>

                <div className="mt-8 pt-4 border-t border-borderSubtle flex items-center justify-between text-xs font-mono">
                  <span className="text-textSecondary">AI Neural Confidence:</span>
                  <span className="text-cyanAccent font-bold text-sm">{scan.aiConfidence}%</span>
                </div>
              </Card>
            </div>

            {/* Executive Summary & Threat Classification (8 cols) */}
            <div className="lg:col-span-8">
              <Card className="p-8 flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purpleAccent font-bold uppercase tracking-wider">
                      Executive Security Summary
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purpleAccent/20 text-purpleAccent text-xs font-mono font-bold">
                      {scan.threatType}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-textPrimary leading-relaxed font-medium">
                    {scan.executiveSummary}
                  </p>
                </div>

                {/* Quick Indicators Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-borderSubtle text-xs">
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                    <div className="text-textSecondary text-[11px]">SPF Check</div>
                    <div className="text-dangerRed font-mono font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> FAIL (Spoofed IP)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                    <div className="text-textSecondary text-[11px]">DKIM Alignment</div>
                    <div className="text-dangerRed font-mono font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> FAIL (Body Hash Mismatch)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                    <div className="text-textSecondary text-[11px]">Domain Age</div>
                    <div className="text-dangerRed font-mono font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 3 Days Old
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Detail Tabs */}
          <div className="flex items-center gap-2 border-b border-borderSubtle pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Overview & AI Reasoning
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'auth' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              SPF / DKIM / DMARC Hops
            </button>
            <button
              onClick={() => setActiveTab('urls')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'urls' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              URL & Typosquat Inspection ({scan.urls.length})
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'attachments' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Attachment Sandbox ({scan.attachments.length})
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'raw' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              Raw MIME Source
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Brain className="w-5 h-5 text-purpleAccent" /> Visual Reasoning & Evidence Cards
                  </CardTitle>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {scan.reasoningCards.map((card) => (
                    <div key={card.id} className="p-5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-4">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-purpleAccent font-bold">{card.category}</span>
                        <span className="text-cyanAccent font-bold">{card.confidence}% Conf</span>
                      </div>
                      <div className="text-sm font-bold text-textPrimary">{card.title}</div>
                      <p className="text-xs text-textSecondary leading-relaxed">{card.summary}</p>
                      
                      <div className="space-y-1 pt-2 border-t border-borderSubtle">
                        <div className="text-[10px] text-textSecondary font-mono uppercase">Key Evidence</div>
                        {card.evidence.map((ev, idx) => (
                          <div key={idx} className="text-[11px] text-dangerRed font-mono flex items-center gap-1.5">
                            • {ev}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SPF Authentication</CardTitle>
                  <Badge level={scan.authentication.spf.status} size="sm" />
                </CardHeader>
                <div className="space-y-3 text-xs">
                  <div><span className="text-textSecondary">Domain:</span> <span className="font-mono text-textPrimary">{scan.authentication.spf.domain}</span></div>
                  <div><span className="text-textSecondary">Sending IP:</span> <span className="font-mono text-textPrimary">{scan.authentication.spf.ip}</span></div>
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-[11px] text-textSecondary leading-relaxed">
                    {scan.authentication.spf.explanation}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">DKIM Signature</CardTitle>
                  <Badge level={scan.authentication.dkim.status} size="sm" />
                </CardHeader>
                <div className="space-y-3 text-xs">
                  <div><span className="text-textSecondary">Selector:</span> <span className="font-mono text-textPrimary">{scan.authentication.dkim.selector}</span></div>
                  <div><span className="text-textSecondary">Algorithm:</span> <span className="font-mono text-textPrimary">{scan.authentication.dkim.algorithm}</span></div>
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-[11px] text-textSecondary leading-relaxed">
                    {scan.authentication.dkim.explanation}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">DMARC Policy</CardTitle>
                  <Badge level={scan.authentication.dmarc.status} size="sm" />
                </CardHeader>
                <div className="space-y-3 text-xs">
                  <div><span className="text-textSecondary">Policy Enforced:</span> <span className="font-mono text-purpleAccent font-bold">{scan.authentication.dmarc.policy}</span></div>
                  <div><span className="text-textSecondary">Alignment:</span> <span className="font-mono text-dangerRed font-bold">FAILED</span></div>
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-[11px] text-textSecondary leading-relaxed">
                    {scan.authentication.dmarc.explanation}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'urls' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Globe className="w-5 h-5 text-cyanAccent" /> Detected URLs & Domain Typosquat Reputation
                </CardTitle>
              </CardHeader>

              <div className="space-y-4">
                {scan.urls.map((urlItem, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-textPrimary font-bold truncate max-w-xl">{urlItem.url}</span>
                      <span className="px-3 py-1 rounded-full bg-dangerRed/20 text-dangerRed font-mono font-bold">
                        {urlItem.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-textSecondary pt-2 border-t border-borderSubtle">
                      <div>Domain Age: <strong className="text-textPrimary">{urlItem.domainAgeDays} Days</strong></div>
                      <div>IP Country: <strong className="text-textPrimary">{urlItem.ipCountry}</strong></div>
                      <div>Redirects: <strong className="text-textPrimary">{urlItem.redirectsCount} Hops</strong></div>
                      <div>VT Detections: <strong className="text-dangerRed">{urlItem.virustotalPositives} Engines</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'attachments' && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <FileWarning className="w-5 h-5 text-dangerRed" /> Attachment Sandbox & Macro Execution Analysis
                </CardTitle>
              </CardHeader>

              {scan.attachments.map((att, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-textPrimary text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purpleAccent" /> {att.filename} ({att.fileSize})
                    </div>
                    <span className="px-3 py-1 rounded-full bg-dangerRed/20 text-dangerRed font-mono font-bold">
                      {att.sandboxVerdict} ({att.riskScore}% Risk)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/80 font-mono text-[11px] text-textSecondary space-y-1">
                    <div>SHA-256: <span className="text-cyanAccent">{att.sha256}</span></div>
                    <div>MIME: {att.mimeType}</div>
                    <div className="text-dangerRed font-bold">VBA Macro Executable Detected: TRUE</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'raw' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono">Raw RFC 822 MIME Source Code</CardTitle>
                <button
                  onClick={() => copyToClipboard(scan.rawEmailContent, 'Raw Email Content')}
                  className="px-3 py-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-xs text-textPrimary flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-primaryBlue" /> Copy Raw
                </button>
              </CardHeader>

              <pre className="p-5 rounded-2xl bg-black/90 font-mono text-xs text-textSecondary leading-relaxed overflow-x-auto max-h-96">
                {scan.rawEmailContent}
              </pre>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
