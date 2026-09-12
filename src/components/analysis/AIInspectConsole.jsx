'use client';

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Terminal,
  ExternalLink,
  DollarSign,
  Clock,
  KeyRound,
  UserX
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import WhyThisScore from './WhyThisScore';

export default function AIInspectConsole({ inspectionData, emailText }) {
  if (!inspectionData) return null;

  const {
    classification = 'suspicious',
    riskLevel = 'medium',
    riskScore = 50,
    confidence = 90,
    urgencyIndex = 65,
    primaryThreatVector = 'BEC Wire Transfer Scheme',
    indicators = [],
    textAnnotations = [],
    summary = '',
    recommendation = '',
    evidenceChain = null,
    model = 'gemini-3.6-flash',
    engine = 'gemini-api'
  } = inspectionData;

  const displayText = emailText || inspectionData.emailText || '';

  // Render highlighted spans for detected anomalies in email text
  const renderAnnotatedText = () => {
    const rawAnnotations = inspectionData.textAnnotations || textAnnotations || [];
    if (!displayText || rawAnnotations.length === 0) {
      return displayText;
    }

    const valid = rawAnnotations
      .filter((a) => {
        if (!a || typeof a.text !== 'string' || !a.text) return false;
        if (typeof a.startIndex !== 'number' || a.startIndex < 0) {
          const foundIndex = displayText.toLowerCase().indexOf(a.text.toLowerCase());
          if (foundIndex !== -1) {
            a.startIndex = foundIndex;
            a.endIndex = foundIndex + a.text.length;
            return true;
          }
          return false;
        }
        return a.startIndex >= 0 && a.endIndex <= displayText.length && a.startIndex < a.endIndex;
      })
      .sort((a, b) => a.startIndex - b.startIndex);

    const nonOverlapping = [];
    let lastEnd = 0;
    for (const ann of valid) {
      if (ann.startIndex >= lastEnd) {
        nonOverlapping.push(ann);
        lastEnd = ann.endIndex;
      }
    }

    if (nonOverlapping.length === 0) {
      return displayText;
    }

    const elements = [];
    let currentIndex = 0;

    nonOverlapping.forEach((ann, idx) => {
      if (ann.startIndex > currentIndex) {
        elements.push(displayText.slice(currentIndex, ann.startIndex));
      }

      const colorClasses = {
        red: 'bg-dangerRed/25 text-dangerRed border border-dangerRed/50 font-semibold px-1 py-0.5 rounded',
        purple: 'bg-purpleAccent/25 text-purple-300 border border-purpleAccent/50 font-semibold px-1 py-0.5 rounded',
        orange: 'bg-orange-500/25 text-orange-300 border border-orange-500/50 font-semibold px-1 py-0.5 rounded',
        amber: 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-semibold px-1 py-0.5 rounded'
      };

      const appliedClass = colorClasses[ann.color] || colorClasses.red;

      elements.push(
        <mark
          key={`ann-${idx}`}
          title={`${ann.label}: ${ann.text}`}
          className={`inline-block my-0.5 transition-all cursor-help ${appliedClass}`}
        >
          {displayText.slice(ann.startIndex, ann.endIndex)}
          <span className="ml-1 text-[9px] uppercase px-1 py-0.2 rounded bg-black/60 text-white font-sans font-normal border border-white/20">
            {ann.label}
          </span>
        </mark>
      );

      currentIndex = ann.endIndex;
    });

    if (currentIndex < displayText.length) {
      elements.push(displayText.slice(currentIndex));
    }

    return elements;
  };

  // Reason cards from indicators
  const reasoningCards = indicators.map((ind, idx) => ({
    id: ind.id || `RSN-${idx + 1}`,
    category: ind.type,
    confidence: ind.confidence || 90,
    title: ind.type,
    severity: ind.severity || 'high',
    summary: ind.description,
    evidence: ind.evidence ? [ind.evidence] : [],
    recommendation: recommendation || 'Review sender credentials and isolate communication.'
  }));

  return (
    <div className="space-y-8 max-w-7xl w-full mx-auto">
      {/* 1. Header with Model & Engine info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surfaceSecondary/60 border border-borderSubtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purpleAccent font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Explainable AI (XAI) Forensic Inspection
            </span>
            <span>•</span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purpleAccent/20 text-purpleAccent border border-purpleAccent/30">
              {model.toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-textPrimary">
            {summary || `Why Was This Email Classified as ${classification.toUpperCase()}?`}
          </h2>
          <p className="text-xs text-textSecondary">
            Engine: <strong className="text-textPrimary font-mono">{engine}</strong> • Verified against behavioral deception taxonomy & RFC deterministic pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              riskLevel === 'critical'
                ? 'bg-dangerRed/20 text-dangerRed border-dangerRed/40'
                : riskLevel === 'high'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : riskLevel === 'medium'
                ? 'bg-warningYellow/20 text-warningYellow border-warningYellow/40'
                : 'bg-successGreen/20 text-successGreen border-successGreen/40'
            }`}
          >
            VERDICT: {classification.toUpperCase()} ({riskScore}/100)
          </span>
        </div>
      </div>

      {/* 2. Top AI Confidence & Threat Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glowColor="purple" className="p-6 space-y-2">
          <div className="text-xs text-textSecondary font-mono uppercase tracking-wider">Neural Confidence</div>
          <div className="text-3xl font-bold font-heading text-purpleAccent">{confidence}%</div>
          <div className="text-xs text-textSecondary">Statistical certainty of indicator pattern match</div>
        </Card>

        <Card glowColor="red" className="p-6 space-y-2">
          <div className="text-xs text-textSecondary font-mono uppercase tracking-wider">Primary Threat Vector</div>
          <div className="text-2xl font-bold font-heading text-dangerRed truncate">{primaryThreatVector}</div>
          <div className="text-xs text-textSecondary">Dominant attack taxonomy classification</div>
        </Card>

        <Card glowColor="cyan" className="p-6 space-y-2">
          <div className="text-xs text-textSecondary font-mono uppercase tracking-wider">Psychological Urgency Index</div>
          <div className="text-3xl font-bold font-heading text-cyanAccent">{urgencyIndex} / 100</div>
          <div className="text-xs text-textSecondary">Measurement of artificial time pressure and coercion</div>
        </Card>
      </div>

      {/* 3. Color Coded Email Highlights Panel */}
      {displayText && (
        <Card className="p-6 md:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderSubtle">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primaryBlue" />
              <h3 className="text-sm font-bold font-heading text-textPrimary uppercase tracking-wider">
                Highlighted Email Text & Anomaly Annotations
              </h3>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-dangerRed/30 border border-dangerRed" />
                <span className="text-[11px] text-textSecondary">Payment Demand</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-purpleAccent/30 border border-purpleAccent" />
                <span className="text-[11px] text-textSecondary">Urgency Trap</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500" />
                <span className="text-[11px] text-textSecondary">Credential Phish</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-warningYellow/30 border border-warningYellow" />
                <span className="text-[11px] text-textSecondary">Domain Mismatch</span>
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surfaceSecondary border border-borderSubtle font-mono text-xs leading-relaxed text-textPrimary overflow-x-auto whitespace-pre-wrap select-text">
            {renderAnnotatedText()}
          </div>

          <div className="p-4 rounded-xl bg-purpleAccent/10 border border-purpleAccent/30 text-xs text-textSecondary flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-purpleAccent flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-textPrimary">SOC Recommendation:</strong> {recommendation}
            </p>
          </div>
        </Card>
      )}

      {/* 4. Visual Reasoning Cards Breakdown */}
      {reasoningCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-warningYellow" />
            <h3 className="text-lg font-bold font-heading text-textPrimary">
              Observed Deception Indicators & Visual Reasoning
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reasoningCards.map((card) => (
              <Card key={card.id} hoverEffect glowColor="purple" className="p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-purpleAccent font-bold text-[11px]">{card.category}</span>
                    <span className="text-cyanAccent font-bold">{card.confidence}% Conf</span>
                  </div>

                  <h4 className="text-base font-bold text-textPrimary mb-2">{card.title}</h4>
                  <p className="text-xs text-textSecondary leading-relaxed">{card.summary}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-borderSubtle">
                  {card.evidence.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono uppercase text-textSecondary">Observed Quote</div>
                      {card.evidence.map((ev, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-darkBg text-xs font-mono text-dangerRed border border-dangerRed/20 break-all">
                          &ldquo;{ev}&rdquo;
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-darkBg/60 border border-primaryBlue/30 text-xs text-primaryBlue font-medium">
                    💡 <strong>SOC Action:</strong> {card.recommendation}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. Complete WhyThisScore Evidence Chain */}
      {evidenceChain && (
        <WhyThisScore
          evidence={evidenceChain.evidenceList}
          categoryScores={evidenceChain.categoryScores}
          riskScore={evidenceChain.totalScore}
          riskLevel={evidenceChain.riskLevel}
          verdict={classification.toUpperCase()}
          steps={evidenceChain.steps}
        />
      )}
    </div>
  );
}
