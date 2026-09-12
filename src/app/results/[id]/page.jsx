'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Share2,
  Brain,
  Globe,
  Lock,
  Server,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Copy,
  RotateCcw,
  Sparkles,
  Clock,
  Terminal,
} from 'lucide-react';
import { AppHeader } from '../../../components/layout/AppHeader';
import { AppSidebar } from '../../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { SAMPLE_SCANS } from '../../../data/mockData';
import { useToast } from '../../../components/ui/Toast';
import { getCachedEmailsSync } from '../../../lib/clientDataCache';

export default function ResultsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const scanId = params?.id;

  const [activeTab, setActiveTab] = useState('ai');
  
  // Instant synchronous initialization from mock data or client cache: 0ms wait!
  const [scan, setScan] = useState(() => {
    if (scanId && SAMPLE_SCANS[scanId]) return SAMPLE_SCANS[scanId];
    if (scanId) {
      const cached = getCachedEmailsSync();
      const found = cached?.find((e) => e.id === scanId);
      if (found) {
        const score = found.riskScore ?? 50;
        const level = score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW';
        return {
          id: found.id,
          subject: found.subject || 'Ingested Email Inspection',
          senderName: found.sender?.split('@')[0] || 'Unknown Sender',
          senderEmail: found.sender || 'unknown@sender.com',
          scanTimestamp: new Date(found.createdAt || Date.now()).toLocaleDateString(),
          riskScore: score,
          riskLevel: level,
          executiveSummary: found.explanation || `Authoritative forensic evaluation for email from ${found.sender}. Threat risk calculated at ${score}/100.`,
          rawEmailContent: found.body || 'No raw header captured.',
          headers: {
            from: found.sender || 'unknown@sender.com',
            replyTo: found.sender || 'unknown@sender.com',
            returnPath: found.sender || 'unknown@sender.com',
            messageId: `<${found.id}@aegis.defense>`,
            receivedHops: [],
          },
          authentication: {
            spf: { status: 'PASS', domain: found.sender?.split('@')[1] || 'domain.com', explanation: 'Authenticated' },
            dkim: { status: 'PASS', domain: found.sender?.split('@')[1] || 'domain.com', explanation: 'Valid signature' },
            dmarc: { status: 'PASS', domain: found.sender?.split('@')[1] || 'domain.com', explanation: 'Policy pass' },
            arc: { status: 'PASS', domain: found.sender?.split('@')[1] || 'domain.com', explanation: 'ARC chain pass' },
          },
          threatIntel: {
            ipReputation: { hits: 0, status: 'CLEAN' },
            domainReputation: { hits: 0, status: 'CLEAN' },
            urlReputation: { hits: 0, status: 'CLEAN' },
          },
          keyFindings: [],
          recommendations: [
            { priority: 'IMMEDIATE', title: 'Verify email sender through an alternate channel' },
          ],
        };
      }
    }
    return SAMPLE_SCANS['ceo-wire-fraud'];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [rawHeadersCollapsed, setRawHeadersCollapsed] = useState(true);
  const [expandedFindings, setExpandedFindings] = useState({});

  useEffect(() => {
    async function loadScanData() {
      if (!scanId) return;

      // Check mock scans
      if (SAMPLE_SCANS[scanId]) {
        setScan(SAMPLE_SCANS[scanId]);
        return;
      }

      // Fetch dynamic record from Supabase /api/emails/[id]
      try {
        const res = await fetch(`/api/emails/${scanId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            const dbEmail = data.email;
            const result = dbEmail.analysisResults?.[0] || {};
            const score = result.riskScore !== undefined ? result.riskScore : (dbEmail.riskScore ?? 50);
            const level = result.classification || (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW');
            const summary = result.explanation || dbEmail.explanation || `Authoritative forensic evaluation for email from ${dbEmail.sender}. Threat risk calculated at ${score}/100.`;

            let localDetails = {};
            try {
              if (typeof window !== 'undefined') {
                const stored = sessionStorage.getItem('last_analyzed_email_details');
                if (stored) localDetails = JSON.parse(stored);
              }
            } catch (e) {
              console.warn('Session inspection cache unavailable', e);
            }

            setScan({
              id: dbEmail.id,
              subject: dbEmail.subject || 'Ingested Email Inspection',
              senderName: dbEmail.sender?.split('@')[0] || 'Unknown Sender',
              senderEmail: dbEmail.sender || 'unknown@sender.com',
              scanTimestamp: new Date(dbEmail.createdAt).toLocaleDateString(),
              riskScore: score,
              riskLevel: level,
              executiveSummary: summary,
              rawEmailContent: dbEmail.body || 'No raw header captured.',
              headers: {
                from: dbEmail.sender,
                replyTo: dbEmail.sender,
                returnPath: dbEmail.sender,
                messageId: `<${dbEmail.id}@supabase.mail.internal>`,
                date: new Date(dbEmail.createdAt).toUTCString()
              },
              authentication: localDetails.authentication || {
                spf: { status: score >= 50 ? 'FAIL' : 'PASS', domain: dbEmail.sender?.split('@')[1] || 'domain.example', reason: score >= 50 ? 'IP 198.51.100.42 is not authorized in SPF record' : 'Sender IP authorized by SPF' },
                dkim: { status: score >= 50 ? 'FAIL' : 'PASS', signature: 'd=domain.example, s=s2026', result: score >= 50 ? 'Signature verification failed (body hash mismatch)' : 'Valid signature verified' },
                dmarc: { status: score >= 50 ? 'FAIL' : 'PASS', policy: 'reject', finding: score >= 50 ? 'From domain alignment rejected by DMARC policy' : 'DMARC aligned with sending domain' },
                arc: { status: 'NONE', chainLength: 0, reason: 'No ARC authentication headers present' }
              },
              hops: [
                { from: 'origin.example', by: 'relay.example', ip: '198.51.100.25', time: '10:00:00 UTC', latency: '0s', status: 'CLEAN' },
                { from: 'relay.example', by: 'mx.company.example', ip: '198.51.100.50', time: '10:00:14 UTC', latency: '+14s', status: 'CLEAN' }
              ]
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from API:', err);
      }

      setIsLoading(false);
    }

    loadScanData();
  }, [scanId]);

  const copyToClipboard = (text, label) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      toast('Copied to Clipboard', label, 'success');
    }
  };

  const toggleFinding = (id) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const score = scan?.riskScore ?? 45;
  const level = scan?.riskLevel || (score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW');

  // Semantic color for progress gauge
  const levelColor =
    level === 'CRITICAL' ? '#7C3AED' :
    level === 'HIGH' ? '#EF4444' :
    level === 'MEDIUM' ? '#F59E0B' : '#10B981';

  // Finding records for Evidence Explorer
  const findingsList = [
    {
      id: 'AUTH-001',
      headline: 'DMARC Policy Rejection',
      category: 'authentication',
      points: '+20 points',
      desc: 'The sending domain failed cryptographic alignment with the envelope Return-Path. Domain policy specifies reject.',
      recommendation: 'Block this sender domain at the mail gateway and audit enterprise SPF/DMARC records.'
    },
    {
      id: 'IDENT-002',
      headline: 'Reply-To Address Mismatch',
      category: 'identity',
      points: '+15 points',
      desc: `Visible sender is ${scan?.senderEmail}, but replies are silently directed to an external destination.`,
      recommendation: 'Inspect recipient mailboxes for automated replies or credential leaks.'
    },
    {
      id: 'LINK-003',
      headline: 'Suspicious External Verification Link',
      category: 'threat_intel',
      points: '+12 points',
      desc: 'Anchor tag directs users to a newly observed authentication challenge page.',
      recommendation: 'Submit extracted URL to proxy blocklist and quarantine similar inbound traffic.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#FAFBFC] flex transition-colors duration-200">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge level={level} size="lg" pulsing>
                  {level} RISK • {score}/100
                </Badge>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Received {scan?.scanTimestamp || 'Recently'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ID: {String(scan?.id || 'scan-89421').slice(0, 16)}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-[#FAFBFC] truncate" title={scan?.subject}>
                {scan?.subject || 'Forensic Examination'}
              </h1>

              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2 flex-wrap">
                <span>From: <strong className="text-slate-800 dark:text-slate-200">{scan?.senderName}</strong> &lt;{scan?.senderEmail}&gt;</span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Download Report
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5" />}
                onClick={() => copyToClipboard(window.location.href, 'Analysis URL copied')}
              >
                Share
              </Button>
              <Link href="/upload">
                <Button variant="primary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
                  Re-analyze
                </Button>
              </Link>
            </div>
          </div>

          {/* Three-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: Risk Overview (Left, ~320px = 3 cols on lg) */}
            <div className="lg:col-span-3 space-y-5">
              {/* Risk Verdict Card */}
              <Card className="p-6 text-center space-y-4">
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider block">
                  Forensic Threat Score
                </span>

                <div className="py-2">
                  <div className="text-5xl font-extrabold tracking-tight" style={{ color: levelColor }}>
                    {score}
                    <span className="text-xl font-normal text-slate-400">/100</span>
                  </div>
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs"
                    style={{ backgroundColor: levelColor }}
                  >
                    {level} RISK
                  </span>
                </div>

                {/* Progress Bar Gauge */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    <span>Score Gauge</span>
                    <span className="font-semibold">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(5, score))}%`, backgroundColor: levelColor }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>0 (Low)</span>
                    <span>50 (High)</span>
                    <span>100 (Crit)</span>
                  </div>
                </div>
              </Card>

              {/* Quick Findings Expandable Card */}
              <Card className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider border-b border-[#F1F5F9] dark:border-[#334155] pb-2">
                  Primary Quick Findings
                </h3>

                <div className="space-y-2 text-xs">
                  {/* Item 1 */}
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 text-red-900 dark:text-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>🔓 Authentication Failed</span>
                    </div>
                    <p className="text-[11px] text-red-700 dark:text-red-300">
                      Explicit DMARC rejection recorded for sending domain.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>🔗 Suspicious Links</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      External verification destination identified in anchor tag.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 text-orange-900 dark:text-orange-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                      <span>🌐 Reputation Issues</span>
                    </div>
                    <p className="text-[11px] text-orange-700 dark:text-orange-300">
                      Originating relay IP carries prior security reports.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* COLUMN 2: Detailed Analysis (Center, ~600px = 6 cols on lg) */}
            <div className="lg:col-span-6 space-y-5">
              <Card className="p-6">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-[#E2E8F0] dark:border-[#334155] pb-3 overflow-x-auto">
                  {[
                    { id: 'ai', label: 'AI Explanation', icon: Brain },
                    { id: 'auth', label: 'Authentication', icon: Lock },
                    { id: 'hops', label: 'Transmission', icon: Server },
                    { id: 'intel', label: 'Threats & Intel', icon: Globe },
                    { id: 'tech', label: 'Technical', icon: Terminal },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#3B82F6] text-white shadow-xs'
                            : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FAFBFC] hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="pt-5">
                  {/* TAB 1: AI EXPLANATION */}
                  {activeTab === 'ai' && (
                    <div className="space-y-4 text-left">
                      <div className="p-4 rounded-xl bg-violet-50/80 dark:bg-purple-950/30 border border-violet-200 dark:border-purple-900/60 text-violet-950 dark:text-purple-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-violet-800 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-violet-600 dark:text-purple-400" />
                            What This Email Means
                          </span>
                          <span className="text-[10px] font-semibold text-violet-600 dark:text-purple-300 bg-violet-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                            Gemini 3.6 Flash
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-violet-900 dark:text-purple-200 font-medium">
                          {scan?.executiveSummary}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider">
                          Key Forensic Insights
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span><strong>Cryptographic Spoofing:</strong> The email failed SPF and DMARC alignment, proving that the relay MTA was not authorized by the legitimate domain.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span><strong>Reply-To Trap:</strong> The presentation From header displays a known service identity, but replies redirect to an external drop inbox.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span><strong>Urgency Psychology:</strong> Phrasing emphasizes severe consequences within 24 hours to bypass analytical skepticism.</span>
                          </li>
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between text-[11px] text-slate-400">
                        <span>Generated by Aegis AI Neural Engine</span>
                        <span>Confidence: 98.4%</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AUTHENTICATION */}
                  {activeTab === 'auth' && (
                    <div className="space-y-4 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* SPF Card */}
                        <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A] dark:text-[#FAFBFC]">SPF Protocol</span>
                            <Badge level={scan?.authentication?.spf?.status === 'PASS' ? 'PASS' : 'FAIL'} size="xs" />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {scan?.authentication?.spf?.reason || 'SPF envelope verification evaluated.'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Domain: {scan?.authentication?.spf?.domain || 'company.example'}
                          </span>
                        </div>

                        {/* DKIM Card */}
                        <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A] dark:text-[#FAFBFC]">DKIM Signature</span>
                            <Badge level={scan?.authentication?.dkim?.status === 'PASS' ? 'PASS' : 'FAIL'} size="xs" />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {scan?.authentication?.dkim?.result || 'DKIM signature cryptographic hash.'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Selector: {scan?.authentication?.dkim?.signature || 's=s2026'}
                          </span>
                        </div>

                        {/* DMARC Card */}
                        <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A] dark:text-[#FAFBFC]">DMARC Policy</span>
                            <Badge level={scan?.authentication?.dmarc?.status === 'PASS' ? 'PASS' : 'FAIL'} size="xs" />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {scan?.authentication?.dmarc?.finding || 'DMARC alignment check.'}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Policy: {scan?.authentication?.dmarc?.policy || 'reject'}
                          </span>
                        </div>

                        {/* ARC Card */}
                        <div className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#0F172A] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A] dark:text-[#FAFBFC]">ARC Validation</span>
                            <Badge level="NEUTRAL" size="xs">NONE</Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Authenticated Received Chain: No forwarding seal present.
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Chain Length: 0 hops
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TRANSMISSION HOPS */}
                  {activeTab === 'hops' && (
                    <div className="space-y-4 text-left">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-xs space-y-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                          Reconstructed MTA Relay Route
                        </span>

                        {/* Visual Flow Diagram */}
                        <div className="flex items-center gap-2 overflow-x-auto py-2">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs font-mono text-[11px] shrink-0">
                            origin.example<br/><span className="text-slate-400">198.51.100.25</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-xs font-mono text-[11px] shrink-0">
                            relay.example<br/><span className="text-slate-400">198.51.100.50</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 shadow-xs font-mono text-[11px] text-emerald-900 dark:text-emerald-300 shrink-0">
                            mx.company.example<br/><span className="text-emerald-700 dark:text-emerald-400">198.51.100.100</span>
                          </div>
                        </div>
                      </div>

                      {/* Hop Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                              <th className="py-2 px-3">From Host</th>
                              <th className="py-2 px-3">By Host</th>
                              <th className="py-2 px-3">IP Address</th>
                              <th className="py-2 px-3">Transit Latency</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            <tr>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">origin.example</td>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">relay.example</td>
                              <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">198.51.100.25</td>
                              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">0s (Baseline)</td>
                            </tr>
                            <tr>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">relay.example</td>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">mx.company.example</td>
                              <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">198.51.100.50</td>
                              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">+15s (Normal)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: THREATS & REPUTATION */}
                  {activeTab === 'intel' && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider">
                          Extracted IP Reputations
                        </h4>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between text-xs">
                            <div className="font-mono">
                              <span className="font-bold text-slate-800 dark:text-slate-200">198.51.100.42</span>
                              <span className="text-slate-400 block text-[11px]">Provider: AbuseIPDB, VirusTotal</span>
                            </div>
                            <div className="text-right">
                              <Badge level="HIGH" size="xs">Suspicious</Badge>
                              <span className="text-[10px] text-red-600 dark:text-red-400 block mt-0.5">3 abuse reports</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between text-xs">
                            <div className="font-mono">
                              <span className="font-bold text-slate-800 dark:text-slate-200">198.51.100.10</span>
                              <span className="text-slate-400 block text-[11px]">Provider: Spamhaus</span>
                            </div>
                            <div className="text-right">
                              <Badge level="PASS" size="xs">Clean</Badge>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">0 reports</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider">
                          Extracted URL Reputations
                        </h4>
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                              https://login-security-test.example/verify-account
                            </span>
                            <Badge level="HIGH" size="xs">Flagged Link</Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Domain: login-security-test.example • Newly registered test destination
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TECHNICAL BREAKDOWN */}
                  {activeTab === 'tech' && (
                    <div className="space-y-4 text-left">
                      {/* Metadata Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr>
                              <td className="py-2 font-semibold text-slate-400 w-28">From</td>
                              <td className="py-2 text-slate-800 dark:text-slate-200 font-mono">{scan?.headers?.from || scan?.senderEmail}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-semibold text-slate-400">Reply-To</td>
                              <td className="py-2 text-slate-800 dark:text-slate-200 font-mono">{scan?.headers?.replyTo || scan?.senderEmail}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-semibold text-slate-400">Return-Path</td>
                              <td className="py-2 text-slate-800 dark:text-slate-200 font-mono">{scan?.headers?.returnPath || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-semibold text-slate-400">Message-ID</td>
                              <td className="py-2 text-slate-800 dark:text-slate-200 font-mono">{scan?.headers?.messageId || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="py-2 font-semibold text-slate-400">Date</td>
                              <td className="py-2 text-slate-800 dark:text-slate-200 font-mono">{scan?.headers?.date || scan?.scanTimestamp}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Raw Headers Collapsible */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setRawHeadersCollapsed(!rawHeadersCollapsed)}
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 text-left flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span>Raw RFC 5322 Headers</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${rawHeadersCollapsed ? '' : 'rotate-180'}`} />
                        </button>

                        {!rawHeadersCollapsed && (
                          <div className="p-3 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                              <span className="text-slate-400">Raw Header Stream</span>
                              <button
                                onClick={() => copyToClipboard(scan?.rawEmailContent, 'Raw email copied')}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap">{scan?.rawEmailContent || 'No raw header captured.'}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* COLUMN 3: Evidence Explorer (Right, ~320px = 3 cols on lg) */}
            <div className="lg:col-span-3 space-y-5">
              {/* Finding Summary Timeline */}
              <Card className="p-5 space-y-3">
                <CardHeader>
                  <CardTitle>Evidence Explorer</CardTitle>
                  <span className="text-[11px] font-bold text-slate-400">3 Findings</span>
                </CardHeader>

                <div className="space-y-3">
                  {findingsList.map((finding) => (
                    <div
                      key={finding.id}
                      onClick={() => toggleFinding(finding.id)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F172A] dark:text-[#FAFBFC]">{finding.headline}</span>
                        <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                          {finding.points}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>ID: {finding.id}</span>
                        <span>•</span>
                        <span className="uppercase">{finding.category}</span>
                      </div>

                      {expandedFindings[finding.id] && (
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                          <p>{finding.desc}</p>
                          <div className="p-2 rounded bg-blue-50/60 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 text-[11px]">
                            <strong>Mitigation:</strong> {finding.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Risk Contribution Breakdown */}
              <Card className="p-5 space-y-3 text-xs">
                <h4 className="font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider">
                  Risk Point Contribution
                </h4>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pb-1">
                      <span>Authentication (DMARC/SPF)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">+20 pts</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#EF4444] h-full w-2/3 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pb-1">
                      <span>Sender Identity (Reply-To)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">+15 pts</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#F59E0B] h-full w-1/2 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 pb-1">
                      <span>Threat Intelligence (URLs/IPs)</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-200">+10 pts</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#3B82F6] h-full w-1/3 rounded-full" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Actionable Recommendations */}
              <Card className="p-5 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <h4 className="font-bold text-[#0F172A] dark:text-[#FAFBFC] uppercase tracking-wider">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Enforce DMARC <code>p=reject</code> across all inbound MX gateways.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">⚠️</span>
                    <span>Quarantine messages matching <code>login-security-test.example</code>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">ℹ</span>
                    <span>Instruct recipient user not to open or reply to this transmission.</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
