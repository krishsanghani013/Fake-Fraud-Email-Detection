'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SAMPLE_SCANS } from '../../data/mockData';

export default function AIExplanationPage() {
  const scan = SAMPLE_SCANS['ceo-wire-fraud'];
  const [selectedTag, setSelectedTag] = useState(null);

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-purpleAccent uppercase tracking-wider">
              <Brain className="w-4 h-4" /> Explainable AI (XAI) Neural Breakdown
            </div>
            <h1 className="text-3xl font-bold font-heading">
              Why Was This Email Flagged as BEC Wire Fraud?
            </h1>
            <p className="text-xs text-textSecondary">
              Aegis AI inspects structural, psychological, and cryptographic anomaly patterns to provide transparent reasoning.
            </p>
          </div>

          {/* Top AI Confidence Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card glowColor="purple" className="p-6">
              <div className="text-xs text-textSecondary font-mono uppercase">Neural Confidence</div>
              <div className="mt-2 text-3xl font-bold font-heading text-purpleAccent">99.2%</div>
              <div className="text-xs text-textSecondary mt-1">High certainty classification</div>
            </Card>

            <Card glowColor="red" className="p-6">
              <div className="text-xs text-textSecondary font-mono uppercase">Primary Threat Vector</div>
              <div className="mt-2 text-2xl font-bold font-heading text-dangerRed">Executive Impersonation</div>
              <div className="text-xs text-textSecondary mt-1">BEC Wire Transfer Scheme</div>
            </Card>

            <Card glowColor="cyan" className="p-6">
              <div className="text-xs text-textSecondary font-mono uppercase">Psychological Urgency Index</div>
              <div className="mt-2 text-3xl font-bold font-heading text-cyanAccent">94 / 100</div>
              <div className="text-xs text-textSecondary mt-1">Extreme pressure applied</div>
            </Card>
          </div>

          {/* Color Coded Email Highlights Panel */}
          <Card className="p-8">
            <CardHeader>
              <CardTitle>
                <FileText className="w-5 h-5 text-primaryBlue" /> Highlighted Email Text & Anomaly Annotations
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-dangerRed/30 border border-dangerRed" /> Payment Demand</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purpleAccent/30 border border-purpleAccent" /> Urgency Trap</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warningAmber/30 border border-warningAmber" /> Domain Mismatch</span>
              </div>
            </CardHeader>

            <div className="p-6 rounded-2xl bg-surfaceSecondary border border-borderSubtle font-mono text-xs leading-relaxed space-y-4 text-textSecondary">
              <div className="p-3 rounded-xl bg-black/60 border border-borderSubtle text-[11px] space-y-1">
                <div>From: <mark className="bg-warningAmber/30 text-warningAmber px-1 py-0.5 rounded font-bold border border-warningAmber">Tim Cook &lt;ceo-office@sec-apple-verify.com&gt;</mark></div>
                <div>Reply-To: <mark className="bg-dangerRed/30 text-dangerRed px-1 py-0.5 rounded font-bold border border-dangerRed">wire-transfers-secure@fast-mail-route.ru</mark></div>
                <div>Subject: URGENT: Confidential Acquisition Wire Transfer</div>
              </div>

              <div className="space-y-3 text-textPrimary leading-relaxed">
                <p>Hi Finance Team,</p>
                <p>
                  Please review the attached confidential acquisition document immediately.{' '}
                  <mark className="bg-purpleAccent/30 text-purpleAccent px-1.5 py-0.5 rounded font-semibold border border-purpleAccent">
                    Do not discuss this with anyone on the finance team yet as this is a strict SEC non-disclosure acquisition.
                  </mark>
                </p>
                <p>
                  <mark className="bg-dangerRed/30 text-dangerRed px-1.5 py-0.5 rounded font-bold border border-dangerRed">
                    Transfer $480,000 USD via wire to the attached offshore escrow account before 2:00 PM EST today.
                  </mark>
                </p>
                <p>Confirm receipt as soon as the wire dispatch code is generated.</p>
                <p>Best regards,<br />Tim Cook<br />Chief Executive Officer</p>
              </div>
            </div>
          </Card>

          {/* Visual Reasoning Cards List */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-heading flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warningAmber" /> Visual Reasoning Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scan.reasoningCards.map((card) => (
                <Card key={card.id} hoverEffect glowColor="purple">
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="text-purpleAccent font-bold">{card.category}</span>
                    <span className="text-cyanAccent font-bold">{card.confidence}% Conf</span>
                  </div>

                  <h3 className="text-base font-bold text-textPrimary mb-2">{card.title}</h3>
                  <p className="text-xs text-textSecondary leading-relaxed mb-4">{card.summary}</p>

                  <div className="space-y-2 pt-4 border-t border-borderSubtle">
                    <div className="text-[10px] font-mono uppercase text-textSecondary">Evidence Verified</div>
                    {card.evidence.map((ev, idx) => (
                      <div key={idx} className="text-xs text-dangerRed flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-surfaceSecondary border border-primaryBlue/30 text-xs text-primaryBlue font-medium">
                    💡 <strong>SOC Action:</strong> {card.recommendation}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
