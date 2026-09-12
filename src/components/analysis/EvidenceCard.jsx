'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  Flame,
  Link2,
  KeyRound,
  DollarSign,
  UserX,
  Clock,
  Terminal,
  ShieldCheck,
  Globe,
  GitCompare,
  Bot,
  Copy,
  Check
} from 'lucide-react';

function getEvidenceIcon(category, typeString) {
  const lowerCat = String(category || '').toLowerCase();
  const lowerType = String(typeString || '').toLowerCase();

  if (lowerCat.includes('threat') || lowerType.includes('url') || lowerType.includes('domain') || lowerType.includes('ip')) {
    if (lowerType.includes('url')) return Link2;
    return Globe;
  }
  if (lowerCat.includes('auth') || lowerType.includes('spf') || lowerType.includes('dkim') || lowerType.includes('dmarc')) {
    return ShieldCheck;
  }
  if (lowerCat.includes('ident') || lowerType.includes('mismatch') || lowerType.includes('sender')) {
    return GitCompare;
  }
  if (lowerType.includes('credential') || lowerType.includes('harvest') || lowerType.includes('password')) {
    return KeyRound;
  }
  if (lowerType.includes('financial') || lowerType.includes('wire') || lowerType.includes('invoice') || lowerType.includes('escrow')) {
    return DollarSign;
  }
  if (lowerType.includes('impersonat') || lowerType.includes('brand')) {
    return UserX;
  }
  if (lowerType.includes('urgency') || lowerType.includes('time')) {
    return Clock;
  }
  return Bot;
}

const SEVERITY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    badgeClass: 'border border-dangerRed/40 bg-dangerRed/10 text-dangerRed font-mono',
    borderClass: 'border-l-4 border-l-dangerRed border-borderSubtle',
    icon: AlertOctagon
  },
  high: {
    label: 'HIGH',
    badgeClass: 'border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono',
    borderClass: 'border-l-4 border-l-amber-500 border-borderSubtle',
    icon: Flame
  },
  medium: {
    label: 'MEDIUM',
    badgeClass: 'border border-warningYellow/40 bg-warningYellow/10 text-warningYellow font-mono',
    borderClass: 'border-l-4 border-l-warningYellow border-borderSubtle',
    icon: AlertTriangle
  },
  low: {
    label: 'LOW',
    badgeClass: 'border border-cyanAccent/40 bg-cyanAccent/10 text-cyanAccent font-mono',
    borderClass: 'border-l-4 border-l-cyanAccent border-borderSubtle',
    icon: Info
  }
};

export default function EvidenceCard({ item }) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const id = item.id || null;
  const category = item.category || 'ai';
  const rawType = item.type || item.finding || 'Forensic Observation';
  const source = item.source || (category === 'ai' ? 'AI Behavioral Inspector' : 'Deterministic Engine');
  const explanation = item.description || item.explanation || item.finding || '';
  const observedEvidence = item.evidence || null;
  const points = item.riskContribution ?? item.contribution ?? null;
  const conf = item.confidence ? (item.confidence <= 1 ? Math.round(item.confidence * 100) : item.confidence) : null;

  const normSev = String(item.severity || '').toLowerCase().trim();
  const config = SEVERITY_CONFIG[normSev] || SEVERITY_CONFIG.medium;
  const SeverityIcon = config.icon;
  const IconComponent = getEvidenceIcon(category, rawType);

  const handleCopy = () => {
    if (observedEvidence) {
      navigator.clipboard.writeText(observedEvidence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-surfaceSecondary/80 p-5 shadow-sm transition-all hover:border-purpleAccent/40 hover:bg-surfaceSecondary ${config.borderClass}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-darkBg text-purpleAccent border border-borderSubtle group-hover:border-purpleAccent/40">
            <IconComponent className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {id && (
                <span className="font-mono text-[10px] font-bold text-purpleAccent bg-purpleAccent/10 border border-purpleAccent/30 px-2 py-0.5 rounded-md">
                  {id}
                </span>
              )}
              <h4 className="text-xs font-bold text-textPrimary truncate">
                {rawType}
              </h4>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[10px] text-textSecondary font-mono">
              <span>Source: <strong className="text-textPrimary">{source}</strong></span>
              {conf && (
                <>
                  <span>•</span>
                  <span>Confidence: <strong className="text-cyanAccent">{conf}%</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badges & Points */}
        <div className="flex items-center gap-2 shrink-0">
          {points !== null && points > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-dangerRed bg-dangerRed/10 border border-dangerRed/30 px-2 py-0.5 rounded-md">
              +{points} pts
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}
          >
            <SeverityIcon className="h-3 w-3" />
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      {/* Explanation Text */}
      {explanation && (
        <p className="mt-3 text-xs leading-relaxed text-textSecondary">
          {explanation}
        </p>
      )}

      {/* Observed Evidence Snippet Box */}
      {observedEvidence && (
        <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 p-3 border border-borderSubtle text-xs font-mono text-textPrimary relative">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-borderSubtle text-[9px] uppercase tracking-wider text-textSecondary font-sans font-semibold">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
              <Terminal className="h-3 w-3" />
              <span>Observed Forensic Evidence (Quoted Snippet)</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3 h-3 text-successGreen" /> : <Copy className="w-3 h-3" />}
              <span className="text-[9px] font-mono">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] leading-relaxed text-purple-700 dark:text-purple-300 font-mono select-all">
            {observedEvidence}
          </pre>
        </div>
      )}
    </div>
  );
}
