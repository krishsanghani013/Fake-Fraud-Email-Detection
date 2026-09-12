'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Microscope,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Server,
  Globe,
  Fingerprint,
  Gauge,
  Brain,
  FileSearch,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const valueProps = [
    {
      title: 'Instant Risk Detection',
      icon: ShieldCheck,
      color: 'text-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950/50 border-[#A7F3D0] dark:border-emerald-800',
      desc: 'Know in seconds if an email is safe. Real-time forensic scoring across 8 layers of analysis.',
    },
    {
      title: 'Transparent Evidence',
      icon: Microscope,
      color: 'text-[#3B82F6] bg-[#EFF6FF] dark:bg-blue-950/50 border-[#BFDBFE] dark:border-blue-800',
      desc: 'Every risk point is explained with clear evidence. No black-box verdicts, 100% transparency.',
    },
    {
      title: 'AI-Powered Insights',
      icon: Sparkles,
      color: 'text-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-950/50 border-[#DDD6FE] dark:border-purple-800',
      desc: 'Gemini AI translates technical forensics into plain English. Understand the why behind every finding.',
    },
  ];

  const features = [
    {
      title: 'Authentication Forensics',
      icon: Lock,
      desc: 'Deep inspection of SPF, DKIM signatures, DMARC alignment, and ARC validation chains.',
      link: '/upload',
    },
    {
      title: 'Transmission Analysis',
      icon: Server,
      desc: 'Chronological MTA hop tracing, relay latency anomalies, and RFC 5737 network routing forensics.',
      link: '/upload',
    },
    {
      title: 'Threat Intelligence',
      icon: Globe,
      desc: 'Reputation cross-referencing for extracted public IPs, normalized URLs, and domains without external leaks.',
      link: '/upload',
    },
    {
      title: 'Sender Identity Forensics',
      icon: Fingerprint,
      desc: 'Cross-checks From, Reply-To, and Return-Path headers to uncover hidden redirection traps.',
      link: '/upload',
    },
    {
      title: 'Deterministic Risk Scoring',
      icon: Gauge,
      desc: 'Objective, evidence-first 0–100 point scale with strictly categorized risk contributions.',
      link: '/risk-indicators',
    },
    {
      title: 'Explainable AI',
      icon: Brain,
      desc: 'Natural language summaries that ground every security claim in explicit forensic findings.',
      link: '/ai-explanation',
    },
  ];

  const faqs = [
    {
      q: 'What makes Aegis Forensics different from standard spam filters?',
      a: 'Standard filters offer binary pass/quarantine decisions without evidence. Aegis performs deep, multi-phase RFC 5322 parsing, hop-by-hop latency calculation, and exact cryptographic alignment, presenting transparent evidence and plain-English AI explanations.',
    },
    {
      q: 'What email formats are supported for forensic analysis?',
      a: 'You can upload raw RFC 5322 text files, standard .eml exports from Thunderbird or Gmail, .msg files, or simply paste email headers and source bodies directly into the analysis workbench.',
    },
    {
      q: 'Is my email data kept private and confidential?',
      a: 'Yes. Aegis operates under strict data minimization standards. Header analysis and deterministic risk scoring run entirely offline or locally in memory. Raw email payloads are never sent to third-party ad networks.',
    },
    {
      q: 'Can both technical SOC teams and non-technical executives use this?',
      a: 'Absolutely. Aegis is built with progressive disclosure: non-technical users get an instant risk verdict and plain-English AI summary, while analysts have access to raw headers, hop timestamps, and granular evidence IDs.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#FAFBFC] selection:bg-blue-100 dark:selection:bg-blue-900/40 selection:text-blue-900 dark:selection:text-blue-200 transition-colors duration-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-[#0F172A] dark:text-[#FAFBFC]">
                AEGIS FORENSICS
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium uppercase tracking-wider">
                Email Security Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
            <a href="#features" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Capabilities</a>
            <a href="#evidence" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Why Aegis</a>
            <a href="#faq" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">FAQ</a>
            <Link href="/reports" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Audit Reports</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="sm" variant="ghost">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" variant="primary">Get Started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button size="sm" variant="secondary">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </Show>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Subtle grid accent */}
        <div className="absolute inset-0 bg-subtle-grid pointer-events-none -z-10 opacity-75" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 border border-[#BFDBFE] dark:border-blue-800 text-xs font-semibold text-[#2563EB] dark:text-blue-400"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen RFC 5322 & Multilayer AI Forensics</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#FAFBFC] leading-[1.15]"
          >
            Email Forensics at Your Fingertips
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-lg md:text-xl text-[#64748B] dark:text-[#94A3B8] max-w-3xl mx-auto leading-relaxed"
          >
            Analyze, authenticate, and understand every email with Aegis — the only forensic engine that explains what went wrong.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link href="/upload">
              <Button size="lg" variant="primary" icon={<FileSearch className="w-5 h-5" />}>
                Analyze Your First Email
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" icon={<ArrowRight className="w-5 h-5" />}>
                View Live Demo
              </Button>
            </Link>
          </motion.div>

          {/* Animated Hero Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-10 max-w-4xl mx-auto"
          >
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xl p-6 md:p-8 text-left relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#F1F5F9] dark:border-[#334155]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    EML
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#FAFBFC]">Sample Inspection: Urgent Wire Transfer Notification</h2>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">RFC 5322 Message Stream • 8 Forensic Phases</p>
                  </div>
                </div>
                <Badge level="CRITICAL">Score: 85/100 • Critical Risk</Badge>
              </div>

              {/* Forensic Node Pipeline Visualization */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                <div className="p-3.5 rounded-lg bg-[#FAFBFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block uppercase">1. Headers</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RFC Parsed
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#FAFBFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block uppercase">2. Auth</span>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    ❌ DMARC Fail
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#FAFBFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block uppercase">3. Identity</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                    ⚠️ Reply-To Mismatch
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[#FAFBFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block uppercase">4. AI Verdict</span>
                  <span className="text-xs font-bold text-violet-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                    ✨ Phishing Lure
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] text-xs text-[#334155] dark:text-slate-300 leading-relaxed">
                <strong className="text-[#0F172A] dark:text-white">Gemini Plain-English Synthesis:</strong> The sender claimed to be executive leadership, but reply-to destination directs traffic to an unrelated external domain. DMARC policy rejected envelope alignment, indicating spoofing.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition Section (3 Cards) */}
      <section id="evidence" className="py-20 bg-white dark:bg-[#1E293B]/50 border-y border-[#E2E8F0] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
              Forensic Confidence Built on Solid Proof
            </h2>
            <p className="text-base text-[#64748B] dark:text-[#94A3B8]">
              Every assessment is calculated with objective deterministic evidence and explained by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map((vp, idx) => {
              const Icon = vp.icon;
              return (
                <Card key={idx} hoverEffect className="space-y-4 p-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${vp.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] dark:text-[#FAFBFC]">{vp.title}</h3>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{vp.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section (6 Cards Grid) */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
            Comprehensive Analysis Matrix
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
            Six Specialized Forensic Engines
          </h2>
          <p className="text-base text-[#64748B] dark:text-[#94A3B8]">
            From low-level RFC MIME boundaries to neural deceptive pattern recognition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} hoverEffect className="p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 text-[#3B82F6] dark:text-blue-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#FAFBFC]">{feat.title}</h3>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{feat.desc}</p>
                </div>
                <Link href={feat.link} className="inline-flex items-center text-xs font-semibold text-[#3B82F6] dark:text-blue-400 hover:text-[#2563EB] gap-1 pt-2">
                  <span>Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Proof / Testimonial Section */}
      <section className="py-20 bg-white dark:bg-[#1E293B]/50 border-y border-[#E2E8F0] dark:border-[#334155]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
            Trusted by Security Teams
          </span>

          <div className="flex flex-wrap items-center justify-center gap-10 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="font-bold text-lg tracking-wider text-slate-700 dark:text-slate-300">CYBERGUARD</span>
            <span className="font-bold text-lg tracking-wider text-slate-700 dark:text-slate-300">NEXUS DEFENSE</span>
            <span className="font-bold text-lg tracking-wider text-slate-700 dark:text-slate-300">FORTRESS SOC</span>
            <span className="font-bold text-lg tracking-wider text-slate-700 dark:text-slate-300">AURA SECURITY</span>
          </div>

          <blockquote className="text-xl md:text-2xl font-medium text-[#0F172A] dark:text-[#FAFBFC] leading-relaxed italic pt-4">
            &ldquo;Aegis eliminated 80% of our manual header analysis time while giving our executives confidence in every threat verdict.&rdquo;
          </blockquote>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            — Lead Threat Analyst, Enterprise SOC Operations
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            Everything you need to know about Aegis Forensics and our inspection models.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-[#E2E8F0] dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-[#0F172A] dark:text-[#FAFBFC] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] dark:text-[#94A3B8] transition-transform ${
                    openFaq === idx ? 'rotate-180 text-[#3B82F6]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0F172A]/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0F172A] dark:bg-slate-950 text-white border-t dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to see inside your emails?
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Upload your first .eml file or paste email headers to get an instant, multi-phase forensic report with complete evidence transparency.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/upload">
              <Button size="lg" variant="primary">
                Get Started Free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] py-12 text-sm text-[#64748B] dark:text-[#94A3B8]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[#0F172A] dark:text-[#FAFBFC] font-bold">
            <Shield className="w-5 h-5 text-[#3B82F6]" />
            <span>AEGIS FORENSICS</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Dashboard</Link>
            <Link href="/upload" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Analyzer</Link>
            <Link href="/reports" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Reports</Link>
            <Link href="/settings" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">Settings</Link>
            <a href="https://github.com/krishsanghani013/Fake-Fraud-Email-Detection" target="_blank" rel="noreferrer" className="hover:text-[#0F172A] dark:hover:text-[#FAFBFC] transition-colors">GitHub</a>
          </div>

          <p className="text-xs text-[#94A3B8] dark:text-slate-500">
            &copy; {new Date().getFullYear()} Aegis Forensics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
