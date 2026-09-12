'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCheck,
  ChevronDown,
  Globe,
  Database,
  Cpu,
  Layers
} from 'lucide-react';
import { SAMPLE_SCANS } from '../data/mockData';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export default function LandingPage() {
  const [selectedPreset, setSelectedPreset] = useState('ceo-wire-fraud');
  const [pricingCycle, setPricingCycle] = useState('annual');
  const [openFaq, setOpenFaq] = useState(0);

  const currentSample = SAMPLE_SCANS[selectedPreset];

  const faqs = [
    {
      q: 'How does Aegis AI detect spoofed and fake emails?',
      a: 'Aegis AI inspects raw MIME headers, verifies cryptographic alignment across SPF, DKIM, and DMARC, measures domain registration age, performs deep sandbox URL/attachment analysis, and leverages large language models (LLMs) to identify psychological urgency and BEC impersonation patterns.',
    },
    {
      q: 'Can Aegis AI integrate with Google Workspace & Microsoft 365?',
      a: 'Yes! Aegis AI offers 1-click API integration with Microsoft Exchange, Office 365, and Google Workspace via OAuth, scanning inbound emails prior to delivery.',
    },
    {
      q: 'Is my email data kept private?',
      a: 'Absolutely. Aegis AI operates under zero-retention privacy protocols. Raw email contents are processed in volatile memory during scanning and are immediately purged after report generation unless explicitly logged by your SOC team.',
    },
    {
      q: 'What file formats can be uploaded for instant scanning?',
      a: 'Aegis AI supports raw RFC 822 text, `.eml`, `.msg` files, header-only pastes, and email attachments including Word macros, PDFs, and executable archives.',
    },
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary relative overflow-x-hidden">
      {/* Background Radial Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primaryBlue/20 via-purpleAccent/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-cyanAccent/10 blur-[160px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-borderSubtle px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primaryBlue via-purpleAccent to-cyanAccent flex items-center justify-center shadow-glowBlue">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold font-heading tracking-tight gradient-text-blue">
                AEGIS AI
              </span>
              <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider">
                Fraud Detection Engine
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-textSecondary">
            <a href="#features" className="hover:text-textPrimary transition-colors">Features</a>
            <a href="#demo" className="hover:text-textPrimary transition-colors">Live Demo</a>
            <a href="#explainability" className="hover:text-textPrimary transition-colors">Explainable AI</a>
            <a href="#faq" className="hover:text-textPrimary transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-xs font-medium text-textSecondary hover:text-textPrimary transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primaryBlue to-purpleAccent text-white text-xs font-semibold shadow-glowBlue hover:opacity-95 transition-all cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <button className="px-4 py-2 text-xs font-medium text-textSecondary hover:text-textPrimary transition-colors">
                  Dashboard
                </button>
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surfaceSecondary border border-primaryBlue/30 text-primaryBlue text-xs font-mono mb-8 shadow-glowBlue"
        >
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Neural Email Fraud Shield v4.9
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold font-heading tracking-tight max-w-5xl mx-auto leading-tight"
        >
          Detect Fake Emails <br className="hidden sm:inline" />
          <span className="gradient-text-rainbow">Before They Fool You.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base md:text-xl text-textSecondary max-w-2xl mx-auto leading-relaxed"
        >
          Enterprise AI platform engineered to uncover BEC wire fraud, typosquatted impersonations, malicious macro drop attachments, and SPF/DKIM/DMARC bypasses in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/upload">
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-primaryBlue to-purpleAccent text-white font-semibold shadow-glowBlue hover:scale-105 transition-all flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" /> Analyze Email Now
            </button>
          </Link>
          <a href="#demo">
            <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle text-textPrimary hover:bg-surfaceSecondary/80 hover:border-white/20 transition-all flex items-center justify-center gap-2">
              <Search className="w-5 h-5 text-primaryBlue" /> Watch Interactive Sandbox
            </button>
          </a>
        </motion.div>

        {/* Hero Cyber Radar Graphic */}
        <div className="mt-16 max-w-5xl mx-auto relative glass-card p-4 md:p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-borderSubtle text-xs text-textSecondary">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-dangerRed/80" />
              <span className="w-3 h-3 rounded-full bg-warningAmber/80" />
              <span className="w-3 h-3 rounded-full bg-successGreen/80" />
              <span className="ml-2 font-mono text-textPrimary">AEGIS Neural Live Monitor</span>
            </div>
            <div className="font-mono text-cyanAccent">99.82% ACCURACY</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-2">
              <div className="text-xs text-textSecondary">Total Threat Queries</div>
              <div className="text-3xl font-bold font-heading text-textPrimary">2,489,102</div>
              <div className="text-xs text-successGreen font-mono">↑ 24% vs last week</div>
            </div>
            <div className="p-5 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-2">
              <div className="text-xs text-textSecondary">BEC & Phishing Prevented</div>
              <div className="text-3xl font-bold font-heading text-purpleAccent">342,810</div>
              <div className="text-xs text-purpleAccent font-mono">Zero false positives</div>
            </div>
            <div className="p-5 rounded-2xl bg-surfaceSecondary/60 border border-borderSubtle space-y-2">
              <div className="text-xs text-textSecondary">Avg Inspection Latency</div>
              <div className="text-3xl font-bold font-heading text-cyanAccent">184 ms</div>
              <div className="text-xs text-textSecondary font-mono">Parallel Sandbox</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Teaser Section */}
      <section id="demo" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">
            Try Live Email Threat Inspector
          </h2>
          <p className="text-textSecondary mt-2 text-sm">
            Select a sample threat email preset below to inspect instant AI reasoning.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setSelectedPreset('ceo-wire-fraud')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedPreset === 'ceo-wire-fraud'
                  ? 'bg-purpleAccent/20 text-purpleAccent border-purpleAccent shadow-glowPurple'
                  : 'bg-surfaceSecondary text-textSecondary border-borderSubtle'
              }`}
            >
              🚨 CEO Wire Transfer Phish (96% Risk)
            </button>
            <button
              onClick={() => setSelectedPreset('paypal-invoice-phish')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedPreset === 'paypal-invoice-phish'
                  ? 'bg-dangerRed/20 text-dangerRed border-dangerRed shadow-glowRed'
                  : 'bg-surfaceSecondary text-textSecondary border-borderSubtle'
              }`}
            >
              ⚠️ PayPal Invoice Callback (84% Risk)
            </button>
            <button
              onClick={() => setSelectedPreset('clean-corporate-newsletter')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                selectedPreset === 'clean-corporate-newsletter'
                  ? 'bg-successGreen/20 text-successGreen border-successGreen'
                  : 'bg-surfaceSecondary text-textSecondary border-borderSubtle'
              }`}
            >
              ✅ Authentic Newsletter (4% Risk)
            </button>
          </div>
        </div>

        {/* Live Preset Preview Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Email Content */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
              <div className="flex items-center justify-between text-xs text-textSecondary">
                <span>From: <strong className="text-textPrimary">{currentSample.senderName}</strong></span>
                <span className="font-mono text-purpleAccent">{currentSample.authentication.spf.status === 'PASS' ? 'SPF PASS' : 'SPF FAIL'}</span>
              </div>
              <div className="text-sm font-semibold text-textPrimary">{currentSample.subject}</div>
              <div className="text-xs text-textSecondary font-mono">To: {currentSample.recipientEmail}</div>
            </div>

            <div className="p-5 rounded-2xl bg-darkBg/90 border border-borderSubtle font-mono text-xs leading-relaxed text-textSecondary whitespace-pre-wrap max-h-60 overflow-y-auto">
              {currentSample.rawEmailContent}
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/results/${currentSample.id}`}>
                <button className="px-5 py-2.5 rounded-xl bg-primaryBlue text-white text-xs font-semibold shadow-glowBlue hover:bg-primaryBlue/90 transition-all flex items-center gap-2">
                  Full Audit Report <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/upload">
                <button className="px-5 py-2.5 rounded-xl bg-surfaceSecondary text-textPrimary text-xs font-semibold border border-borderSubtle hover:border-white/20 transition-all">
                  Upload Custom .EML File
                </button>
              </Link>
            </div>
          </div>

          {/* Right AI Verdict */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-surfaceSecondary/80 border border-borderSubtle flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-textSecondary">AI Risk Verdict</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  currentSample.riskLevel === 'CRITICAL' || currentSample.riskLevel === 'FRAUD'
                    ? 'bg-dangerRed/20 text-dangerRed border border-dangerRed/40'
                    : 'bg-successGreen/20 text-successGreen border border-successGreen/40'
                }`}>
                  {currentSample.riskLevel} ({currentSample.riskScore}/100)
                </span>
              </div>

              <div className="mt-6 text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-primaryBlue/30">
                  <div className="text-3xl font-bold font-heading text-textPrimary">{currentSample.riskScore}</div>
                  <div className="absolute bottom-4 text-[10px] text-textSecondary uppercase font-mono">Risk Index</div>
                </div>
              </div>

              <p className="mt-6 text-xs text-textSecondary leading-relaxed">
                {currentSample.executiveSummary}
              </p>
            </div>

            <div className="pt-4 border-t border-borderSubtle flex items-center justify-between text-xs font-mono">
              <span className="text-textSecondary">Confidence:</span>
              <span className="text-cyanAccent font-bold">{currentSample.aiConfidence}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-primaryBlue">Engine Capabilities</span>
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-2">
            Complete Cyber Protection Suite
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-primaryBlue/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30 flex items-center justify-center text-primaryBlue mb-6">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading">SPF / DKIM / DMARC Alignment</h3>
            <p className="text-textSecondary text-xs mt-3 leading-relaxed">
              Cryptographically validates header hops, envelope From domains, alignment policies, and DKIM signature body hash consistency.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-purpleAccent/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purpleAccent/10 border border-purpleAccent/30 flex items-center justify-center text-purpleAccent mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading">Explainable AI Reasoning</h3>
            <p className="text-textSecondary text-xs mt-3 leading-relaxed">
              Generates plain-English threat breakdowns detailing why an email is flagged, highlighting urgency traps and impersonations.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-cyanAccent/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyanAccent/10 border border-cyanAccent/30 flex items-center justify-center text-cyanAccent mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-heading">Attachment Macro Sandbox</h3>
            <p className="text-textSecondary text-xs mt-3 leading-relaxed">
              Executes attached Word, PDF, and archive files inside a isolated container to capture malicious PowerShell drop scripts.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between font-semibold text-sm text-textPrimary"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-primaryBlue transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-6 text-xs text-textSecondary leading-relaxed border-t border-borderSubtle/40 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-borderSubtle py-12 px-6 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-textSecondary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primaryBlue to-purpleAccent flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold font-heading text-textPrimary">AEGIS AI</span>
            <span>© 2026 Aegis Cyber Security Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-textPrimary transition-colors">Dashboard</Link>
            <Link href="/upload" className="hover:text-textPrimary transition-colors">Scan</Link>
            <Link href="/cases" className="hover:text-textPrimary transition-colors">Cases</Link>
            <Link href="/settings" className="hover:text-textPrimary transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
