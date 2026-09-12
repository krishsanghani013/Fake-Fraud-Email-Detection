'use client';

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Bot,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  RefreshCw,
  Zap,
  Gauge,
  Activity,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useToast } from '../ui/Toast';

export function AIContentDetectorCard({
  detection,
  onRerun,
  isLoading = false,
  rawText = '',
  subject = ''
}) {
  const { toast } = useToast();
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(null);
  const [filterLevel, setFilterLevel] = useState('ALL'); // 'ALL' | 'AI_ONLY' | 'HUMAN_ONLY'

  if (!detection) return null;

  const {
    aiProbability = 50,
    verdict = 'MIXED_OR_PARAPHRASED',
    confidence = 85,
    engine = 'AEGIS Forensic Engine',
    model = 'gemini-3.6-flash',
    isOfflineFallback = false,
    summary = '',
    metrics = {},
    hallmarks = [],
    linguisticIndicators = [],
    perSentenceAnalysis = [],
    suggestedAnalystAction = ''
  } = detection;

  const isHighAi = aiProbability >= 70;
  const isModerateAi = aiProbability >= 45 && aiProbability < 70;
  const isHuman = aiProbability < 45;

  const copyReport = () => {
    const reportText = `[AEGIS AI CONTENT FORENSIC REPORT]
Verdict: ${verdict}
AI Generation Probability: ${aiProbability}%
Confidence: ${confidence}%
Model/Engine: ${model} (${engine})
Burstiness CV: ${metrics?.burstiness?.cv || 'N/A'}
Predictability: ${metrics?.perplexity?.predictabilityScore || 'N/A'}/100
Hallmarks Detected: ${hallmarks.length}

SUMMARY:
${summary}

RECOMMENDATION:
${suggestedAnalystAction}`;

    navigator.clipboard.writeText(reportText);
    toast('Report Copied', 'Forensic synthetic content analysis copied to clipboard', 'success');
  };

  const selectedSentence =
    selectedSentenceIndex !== null
      ? perSentenceAnalysis.find((s) => s.index === selectedSentenceIndex)
      : null;

  const filteredSentences = perSentenceAnalysis.filter((s) => {
    if (filterLevel === 'AI_ONLY') return s.aiProbability >= 60;
    if (filterLevel === 'HUMAN_ONLY') return s.aiProbability < 50;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Probability Radial */}
      <Card className="p-6 border border-white/10 relative overflow-hidden bg-gradient-to-br from-surface to-surfaceSecondary">
        {/* Glow accent */}
        <div
          className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isHighAi ? 'bg-red-500' : isModerateAi ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide uppercase border ${
                  isHighAi
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-glowRed'
                    : isModerateAi
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-glowGreen'
                }`}
              >
                {isHighAi ? (
                  <Bot className="w-3.5 h-3.5" />
                ) : isModerateAi ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                {verdict.replace(/_/g, ' ')}
              </span>

              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-textSecondary">
                Model: {model}
              </span>

              {isOfflineFallback && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purpleAccent/20 text-purpleAccent border border-purpleAccent/30">
                  ⚡ Stylometric Baseline
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold font-heading text-textPrimary tracking-tight">
              {isHighAi
                ? 'High Probability of AI Synthetic Generation'
                : isModerateAi
                ? 'Mixed Content / AI-Assisted Generation'
                : 'Organic Human-Authored Communication'}
            </h3>

            <p className="text-xs text-textSecondary leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Big Score Gauge Display */}
          <div className="flex items-center gap-4 bg-darkBg/60 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-textSecondary mb-1">
                AI Generation Likelihood
              </div>
              <div
                className={`text-4xl font-extrabold font-mono tracking-tighter ${
                  isHighAi ? 'text-red-400' : isModerateAi ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {aiProbability}%
              </div>
              <div className="text-[10px] font-mono text-textSecondary mt-1">
                Confidence: <strong className="text-textPrimary">{confidence}%</strong>
              </div>
            </div>

            <div className="h-12 w-[1px] bg-white/10" />

            <div className="flex flex-col gap-2">
              <button
                onClick={copyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surfaceSecondary hover:bg-white/10 border border-borderSubtle text-[11px] font-mono text-textPrimary transition-all"
              >
                <Copy className="w-3 h-3 text-purpleAccent" /> Copy Report
              </button>

              {onRerun && (
                <button
                  onClick={() => onRerun(false)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purpleAccent/20 hover:bg-purpleAccent/30 border border-purpleAccent/30 text-[11px] font-mono text-purpleAccent transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Rescan AI
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Stylometric 4-Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Metric 1: Burstiness */}
          <div className="p-4 rounded-xl bg-surfaceSecondary/70 border border-borderSubtle space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-textSecondary">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primaryBlue" /> Sentence Burstiness
              </span>
              <span className="font-bold text-textPrimary">CV: {metrics.burstiness?.cv ?? '0.45'}</span>
            </div>
            <div className="w-full bg-darkBg/80 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-500 ${
                  (metrics.burstiness?.cv ?? 0.5) < 0.35
                    ? 'bg-red-500'
                    : (metrics.burstiness?.cv ?? 0.5) < 0.6
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, ((metrics.burstiness?.cv ?? 0.5) / 1.0) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary leading-tight">
              {metrics.burstiness?.interpretation || 'Measures sentence length variation'}
            </div>
          </div>

          {/* Metric 2: Perplexity / Predictability */}
          <div className="p-4 rounded-xl bg-surfaceSecondary/70 border border-borderSubtle space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-textSecondary">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-purpleAccent" /> Token Predictability
              </span>
              <span className="font-bold text-textPrimary">
                {metrics.perplexity?.predictabilityScore ?? 50}%
              </span>
            </div>
            <div className="w-full bg-darkBg/80 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-500 ${
                  (metrics.perplexity?.predictabilityScore ?? 50) > 70
                    ? 'bg-red-500'
                    : (metrics.perplexity?.predictabilityScore ?? 50) > 45
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.perplexity?.predictabilityScore ?? 50}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary leading-tight">
              {metrics.perplexity?.rating || 'Measures vocabulary transition predictability'}
            </div>
          </div>

          {/* Metric 3: Lexical Diversity */}
          <div className="p-4 rounded-xl bg-surfaceSecondary/70 border border-borderSubtle space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-textSecondary">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyanAccent" /> Vocabulary TTR
              </span>
              <span className="font-bold text-textPrimary">{metrics.lexical?.ttr ?? 0.6}</span>
            </div>
            <div className="w-full bg-darkBg/80 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-cyanAccent transition-all duration-500"
                style={{ width: `${Math.min(100, (metrics.lexical?.ttr ?? 0.6) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-textSecondary leading-tight">
              {metrics.lexical?.uniqueWords || 0} unique in {metrics.lexical?.totalTokens || 0} tokens
            </div>
          </div>

          {/* Metric 4: Hallmarks Count */}
          <div className="p-4 rounded-xl bg-surfaceSecondary/70 border border-borderSubtle space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-textSecondary">
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-warningYellow" /> LLM Hallmarks
              </span>
              <span className="font-bold text-warningYellow">{hallmarks.length}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {hallmarks.length === 0 ? (
                <span className="text-[10px] text-emerald-400 font-mono">0 clichés flagged</span>
              ) : (
                <span className="text-[10px] text-amber-400 font-mono">
                  {hallmarks.length} recognizable LLM signatures
                </span>
              )}
            </div>
            <div className="text-[10px] text-textSecondary leading-tight">
              Matches against 50+ classic synthetic patterns
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Interactive Sentence-by-Sentence Heatmap */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purpleAccent" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
              Interactive Sentence-by-Sentence Forensic Heatmap
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-textSecondary">Filter View:</span>
            <div className="flex rounded-lg bg-surfaceSecondary p-0.5 border border-borderSubtle text-[10px] font-mono">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2 py-0.5 rounded ${
                  filterLevel === 'ALL' ? 'bg-purpleAccent text-white' : 'text-textSecondary hover:text-white'
                }`}
              >
                All ({perSentenceAnalysis.length})
              </button>
              <button
                onClick={() => setFilterLevel('AI_ONLY')}
                className={`px-2 py-0.5 rounded ${
                  filterLevel === 'AI_ONLY' ? 'bg-red-500 text-white' : 'text-textSecondary hover:text-white'
                }`}
              >
                AI Sentences
              </button>
              <button
                onClick={() => setFilterLevel('HUMAN_ONLY')}
                className={`px-2 py-0.5 rounded ${
                  filterLevel === 'HUMAN_ONLY' ? 'bg-emerald-500 text-white' : 'text-textSecondary hover:text-white'
                }`}
              >
                Human
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-textSecondary pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
            <span>High AI Likelihood (&ge; 70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
            <span>Moderate / Mixed (45% - 69%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
            <span>Natural Human (&lt; 45%)</span>
          </div>
          <span className="text-textSecondary/60 italic ml-auto">
            (Click any sentence to inspect linguistic rationale)
          </span>
        </div>

        {/* Heatmap Text Canvas */}
        <div className="p-4 rounded-2xl bg-darkBg/60 border border-borderSubtle leading-relaxed font-sans text-xs space-y-2 max-h-[350px] overflow-y-auto">
          {filteredSentences.length === 0 ? (
            <p className="text-textSecondary italic">No sentences match the selected filter.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {filteredSentences.map((item) => {
                const isSelected = selectedSentenceIndex === item.index;
                const isItemHigh = item.aiProbability >= 70;
                const isItemMod = item.aiProbability >= 45 && item.aiProbability < 70;

                return (
                  <span
                    key={item.index}
                    onClick={() => setSelectedSentenceIndex(item.index)}
                    className={`cursor-pointer px-2 py-1 rounded-lg transition-all border ${
                      isSelected
                        ? 'ring-2 ring-purpleAccent scale-[1.01] shadow-lg'
                        : ''
                    } ${
                      isItemHigh
                        ? 'bg-red-500/15 border-red-500/30 text-red-200 hover:bg-red-500/25'
                        : isItemMod
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 hover:bg-amber-500/25'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20'
                    }`}
                  >
                    {item.sentence}
                    <span className="ml-1.5 text-[9px] font-mono opacity-60 font-bold">
                      [{item.aiProbability}%]
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Sentence Inspector Detail Drawer */}
        {selectedSentence && (
          <div className="p-4 rounded-xl bg-purpleAccent/10 border border-purpleAccent/30 space-y-2 animate-fadeIn text-xs">
            <div className="flex items-center justify-between border-b border-purpleAccent/20 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purpleAccent" />
                <strong className="font-mono text-textPrimary">
                  Sentence #{selectedSentence.index + 1} Analysis
                </strong>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedSentence.aiProbability >= 70
                      ? 'bg-red-500/20 text-red-300'
                      : selectedSentence.aiProbability >= 45
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {selectedSentence.aiProbability}% AI Probability
                </span>
              </div>
              <button
                onClick={() => setSelectedSentenceIndex(null)}
                className="text-textSecondary hover:text-white text-[11px] font-mono"
              >
                Close ×
              </button>
            </div>
            <p className="text-textPrimary italic font-sans">
              "{selectedSentence.sentence}"
            </p>
            {selectedSentence.reason && (
              <p className="text-textSecondary text-[11px]">
                <strong>Forensic Rationale:</strong> {selectedSentence.reason}
              </p>
            )}
            {selectedSentence.hallmarksFound?.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-textSecondary font-mono">Flagged Markers:</span>
                {selectedSentence.hallmarksFound.map((hf, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  >
                    "{hf}"
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Detected Hallmarks & Linguistic Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hallmarks Card */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-borderSubtle">
            <Bot className="w-4 h-4 text-warningYellow" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
              Detected LLM Signature Hallmarks ({hallmarks.length})
            </h4>
          </div>

          {hallmarks.length === 0 ? (
            <p className="text-xs text-textSecondary italic py-4">
              Zero classic LLM clichés or prompt leak phrases were detected.
            </p>
          ) : (
            <div className="space-y-2">
              {hallmarks.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-warningYellow font-bold">
                      "{h.matched}"
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-textSecondary">
                      {h.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary">{h.description}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Security Analyst Action Card */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-borderSubtle">
            <CheckCircle2 className="w-4 h-4 text-successGreen" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-textPrimary">
              Analyst Forensic Guidance
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs text-textPrimary leading-relaxed space-y-2">
            <div>
              <strong className="text-purpleAccent">Recommended Action:</strong>
              <p className="text-textSecondary mt-1">
                {suggestedAnalystAction ||
                  (isHighAi
                    ? 'Synthetic content detected. Treat email with elevated scrutiny for automated credential phishing or business email compromise (BEC).'
                    : 'Content displays natural human variation. Cross-reference with SPF/DKIM/DMARC authentication.')}
              </p>
            </div>
          </div>

          {linguisticIndicators?.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-textSecondary">
                Observed Stylistic Markers
              </div>
              <ul className="space-y-1.5 text-xs text-textSecondary">
                {linguisticIndicators.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primaryBlue">•</span>
                    <span>
                      <strong className="text-textPrimary">{ind.indicator}:</strong>{' '}
                      {ind.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
