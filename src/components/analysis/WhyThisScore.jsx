'use client';

import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Filter,
  CheckCircle2
} from 'lucide-react';
import EvidenceCard from './EvidenceCard';

const FILTER_TABS = [
  { id: 'all', label: 'All Evidence' },
  { id: 'phishing', label: 'Phishing & Deception' },
  { id: 'ai', label: 'AI Content Analysis' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'identity', label: 'Sender Identity' },
  { id: 'threatIntel', label: 'Threat Intel' }
];

export default function WhyThisScore({
  evidence = [],
  categoryScores = {},
  riskScore = 0,
  riskLevel = 'medium',
  verdict = '',
  steps = []
}) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const safeEvidence = Array.isArray(evidence) ? evidence : [];

  const filteredEvidence = safeEvidence.filter((item) => {
    if (selectedFilter === 'all') return true;
    const cat = String(item.category || '').toLowerCase();
    if (selectedFilter === 'phishing') return cat.includes('phish') || cat.includes('decept');
    if (selectedFilter === 'ai') return cat.includes('ai') || cat.includes('content');
    if (selectedFilter === 'authentication') return cat.includes('auth') || cat.includes('spf') || cat.includes('dkim') || cat.includes('dmarc');
    if (selectedFilter === 'identity') return cat.includes('ident') || cat.includes('sender') || cat.includes('mismatch');
    if (selectedFilter === 'threatIntel') return cat.includes('threat') || cat.includes('intel') || cat.includes('reputation');
    return true;
  });

  const defaultSteps = [
    { step: '1', title: 'Email Ingress', sub: 'RFC 5322 Ingress' },
    { step: '2', title: 'Observed Signals', sub: `${safeEvidence.length} Indicators` },
    { step: '3', title: 'Artifact Extraction', sub: 'URLs & Domains' },
    { step: '4', title: 'Deterministic Analysis', sub: 'SPF / DKIM / DMARC' },
    { step: '5', title: 'Risk Points', sub: `${riskScore} Total Points` },
    { step: '6', title: 'Verdict', sub: `${(verdict || riskLevel).toUpperCase()}` }
  ];

  const activeSteps = steps && steps.length > 0 ? steps : defaultSteps;

  const aiScore = categoryScores?.aiContent?.score ?? categoryScores?.ai?.score ?? 0;
  const threatScore = categoryScores?.threatIntel?.score ?? categoryScores?.threat_intelligence?.score ?? 0;
  const authScore = categoryScores?.authentication?.score ?? 0;
  const idScore = categoryScores?.senderIdentity?.score ?? categoryScores?.sender_identity?.score ?? 0;
  const phishScore = categoryScores?.phishing_heuristics?.score ?? categoryScores?.phishing?.score ?? 0;

  return (
    <div className="space-y-6 rounded-3xl border border-borderSubtle bg-surface p-6 md:p-8 shadow-sm">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-borderSubtle pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purpleAccent/10 text-purpleAccent border border-purpleAccent/30">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold uppercase tracking-wider text-textPrimary font-heading">
                Why This Email Is Risky — Evidence Chain
              </h3>
              {verdict && (
                <span className="font-mono text-[11px] font-bold text-purpleAccent bg-purpleAccent/10 border border-purpleAccent/30 px-2 py-0.5 rounded-full">
                  {verdict}
                </span>
              )}
            </div>
            <p className="text-xs text-textSecondary">
              Transparent, evidence-backed mathematical score composition across independent forensic vectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-textSecondary">
          <span>Final Score:</span>
          <span className="font-bold text-textPrimary text-base font-heading">{riskScore}</span>
          <span>/ 100</span>
        </div>
      </div>

      {/* 2. Visual 6-Step Evidence Flow */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-textSecondary font-semibold">
          Forensic Evidence Progression Flow
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
          {activeSteps.map((s, idx) => (
            <div key={idx} className="relative flex flex-col justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-borderSubtle">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold w-5 h-5 rounded-full bg-purpleAccent/20 text-purpleAccent flex items-center justify-center">
                  {s.step}
                </span>
                {idx < activeSteps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-borderSubtle hidden md:block" />
                )}
              </div>
              <div className="text-xs font-bold text-textPrimary truncate">{s.title}</div>
              <div className="text-[10px] text-textSecondary font-mono truncate">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Category Score Budget Distribution */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-textSecondary font-semibold">
          Vector Contribution Budgets (Max 100 Pts Total)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Phishing & Content Deception */}
          <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-textPrimary">Phishing Heuristics</span>
              <span className="font-mono font-bold text-amber-500 dark:text-amber-400">{phishScore} pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (phishScore / 50) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary font-mono">Credential Traps & Lures</div>
          </div>

          {/* AI Content Analysis (30 pts max) */}
          <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-textPrimary">AI Content & Deception</span>
              <span className="font-mono font-bold text-purpleAccent">{aiScore} / 30 pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purpleAccent transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (aiScore / 30) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary font-mono">Gemini 3.6 Deception Signals</div>
          </div>

          {/* Threat Intelligence (30 pts max) */}
          <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-textPrimary">Threat Intelligence</span>
              <span className="font-mono font-bold text-cyanAccent">{threatScore} / 30 pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyanAccent transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (threatScore / 30) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary font-mono">VirusTotal & IOC Reputation</div>
          </div>

          {/* Authentication (25 pts max) */}
          <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-textPrimary">Authentication (RFC)</span>
              <span className="font-mono font-bold text-warningYellow">{authScore} / 25 pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-warningYellow transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (authScore / 25) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary font-mono">SPF, DKIM, DMARC Checks</div>
          </div>

          {/* Sender Identity (15 pts max) */}
          <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-textPrimary">Sender Alignment</span>
              <span className="font-mono font-bold text-dangerRed">{idScore} / 15 pts</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-dangerRed transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (idScore / 15) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary font-mono">From vs Reply-To Mismatch</div>
          </div>
        </div>
      </div>

      {/* 4. Filterable Evidence List */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purpleAccent" />
            <span className="text-xs font-bold font-mono text-textPrimary uppercase tracking-wider">
              Forensic Evidence Items ({filteredEvidence.length})
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-purpleAccent text-white shadow-glowPurple'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surfaceSecondary border border-dashed border-borderSubtle text-xs text-textSecondary font-mono">
            No evidence findings match the selected category filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvidence.map((item, idx) => (
              <EvidenceCard key={item.id || idx} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
