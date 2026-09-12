'use client';

import React, { useState, useEffect } from 'react';
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
  Lightbulb,
  Loader2,
  RefreshCw,
  Code
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import AIInspectConsole from '../../components/analysis/AIInspectConsole';

const PRESETS = [
  {
    id: 'bec-wire',
    title: 'BEC Executive Wire Fraud',
    badge: 'CRITICAL',
    raw: `From: Tim Cook <ceo-office@sec-apple-verify.com>
Reply-To: wire-transfers-secure@fast-mail-route.ru
To: finance-team@apple-corp.internal
Subject: URGENT: Confidential Acquisition Wire Transfer
Date: Sat, 12 Sep 2026 12:00:00 +0000

Hi Finance Team,

Please review the attached confidential acquisition document immediately. Do not discuss this with anyone on the finance team yet as this is a strict SEC non-disclosure acquisition.

Transfer $480,000 USD via wire to the attached offshore escrow account before 2:00 PM EST today.

Confirm receipt as soon as the wire dispatch code is generated.

Best regards,
Tim Cook
Chief Executive Officer`
  },
  {
    id: 'phish-credential',
    title: 'PayPal Credential Phishing',
    badge: 'HIGH',
    raw: `From: service@paypal-security-alert.com
Reply-To: phish-collector@evil-server.net
To: victim@example.com
Subject: Security Alert: Unusual sign-in attempt detected
Date: Sat, 12 Sep 2026 11:30:00 +0000

Dear PayPal Customer,

We detected an unauthorized login attempt from an unrecognized device (IP: 198.51.100.22) in Moscow, Russia. If this was not you, your account may be compromised and will be suspended within 24 hours.

Please click here to verify your account credentials immediately:
https://paypal-login-portal-auth.fake/verify-my-account

Thank you,
PayPal Security Department`
  },
  {
    id: 'clean-digest',
    title: 'Clean Engineering Digest',
    badge: 'LOW',
    raw: `From: updates@engineering-digest.org
To: dev-team@company.internal
Subject: Weekly Engineering Digest #142
Date: Sat, 12 Sep 2026 09:00:00 +0000

Hello Team,

Here is your weekly summary of architecture updates, pull request reviews, and infrastructure optimizations.

Have a productive week!
Engineering Operations`
  }
];

export default function AIExplanationPage() {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState('bec-wire');
  const [emailText, setEmailText] = useState(PRESETS[0].raw);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionData, setInspectionData] = useState(null);
  const [showInputBox, setShowInputBox] = useState(false);

  // Auto-run inspection on mount or preset switch
  const runInspection = async (textToInspect) => {
    const target = textToInspect || emailText;
    if (!target.trim()) {
      toast('Empty Input', 'Please provide email text to inspect', 'error');
      return;
    }

    setIsInspecting(true);
    try {
      const res = await fetch('/api/ai-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText: target.trim() })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setInspectionData(json.data);
        toast('AI Inspection Complete', `Engine: ${json.data.engine} (${json.data.model})`, 'success');
      } else {
        toast('Inspection Notice', json.error || 'Failed to inspect email', 'error');
      }
    } catch (err) {
      toast('Inspection Error', err.message || 'Network error', 'error');
    } finally {
      setIsInspecting(false);
    }
  };

  useEffect(() => {
    // Check if session has a custom scan
    try {
      const stored = sessionStorage.getItem('current_scan_input');
      if (stored) {
        const parsed = JSON.parse(stored);
        const reconstructed = parsed.rawEmail || `Subject: ${parsed.subject || ''}\nFrom: ${parsed.sender?.email || ''}\n\n${parsed.body || ''}`;
        if (reconstructed.trim().length > 20) {
          setEmailText(reconstructed);
          runInspection(reconstructed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default to first preset
    runInspection(PRESETS[0].raw);
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setEmailText(preset.raw);
    runInspection(preset.raw);
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-surfaceSecondary/60 border border-borderSubtle">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-purpleAccent uppercase tracking-wider">
                <Brain className="w-4 h-4" /> Explainable AI (XAI) Forensic Studio
              </div>
              <h1 className="text-3xl font-bold font-heading">
                AI Forensic Inspector & Deception Engine
              </h1>
              <p className="text-xs text-textSecondary">
                Evidence-grounded behavioral deception analysis, psychological urgency metrics, and 6-stage evidence progression.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowInputBox(!showInputBox)}
                className="px-3.5 py-2 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-purpleAccent/40 text-textPrimary text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Code className="w-3.5 h-3.5 text-purpleAccent" />
                {showInputBox ? 'Hide Raw Input' : 'Edit / Paste Custom Email'}
              </button>
              <button
                onClick={() => runInspection()}
                disabled={isInspecting}
                className="px-4 py-2 rounded-xl bg-purpleAccent hover:bg-purpleAccent/90 disabled:opacity-50 text-white text-xs font-bold font-mono transition-all shadow-glowPurple flex items-center gap-2"
              >
                {isInspecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Inspecting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Re-Run AI Inspection
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Presets Bar */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-textSecondary uppercase tracking-wider">
              Quick Threat Presets
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                    selectedPreset === preset.id
                      ? 'bg-purpleAccent/10 border-purpleAccent text-textPrimary shadow-glowPurple'
                      : 'bg-surfaceSecondary/60 border-borderSubtle text-textSecondary hover:border-purpleAccent/30 hover:text-textPrimary'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-heading">{preset.title}</div>
                    <div className="text-[10px] font-mono text-textSecondary mt-0.5">Click to inspect</div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      preset.badge === 'CRITICAL'
                        ? 'bg-dangerRed/10 border-dangerRed/30 text-dangerRed'
                        : preset.badge === 'HIGH'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-successGreen/10 border-successGreen/30 text-successGreen'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Custom Input Box */}
          {showInputBox && (
            <Card className="p-6 space-y-4 border border-purpleAccent/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-textPrimary uppercase tracking-wider">
                  Raw RFC 5322 / Email Body Ingress
                </span>
                <span className="text-[11px] font-mono text-textSecondary">
                  {emailText.length} characters
                </span>
              </div>
              <textarea
                rows={8}
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Paste raw email headers and body here..."
                className="w-full bg-darkBg border border-borderSubtle rounded-xl p-4 font-mono text-xs text-textPrimary focus:outline-none focus:border-purpleAccent"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => runInspection()}
                  disabled={isInspecting}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Analyze Provided Email
                </Button>
              </div>
            </Card>
          )}

          {/* Live AI Inspect Console */}
          {isInspecting ? (
            <Card className="p-16 text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-purpleAccent mx-auto" />
              <h3 className="text-lg font-bold font-heading text-textPrimary">
                Performing Deep AI Forensic Inspection...
              </h3>
              <p className="text-xs text-textSecondary font-mono max-w-md mx-auto">
                Extracting textual deception signals, calculating urgency indices, and assembling the 6-stage evidence chain.
              </p>
            </Card>
          ) : inspectionData ? (
            <AIInspectConsole inspectionData={inspectionData} emailText={emailText} />
          ) : (
            <Card className="p-12 text-center text-xs text-textSecondary font-mono">
              Select a threat preset or paste custom email content to launch the AI Forensic Inspector.
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
