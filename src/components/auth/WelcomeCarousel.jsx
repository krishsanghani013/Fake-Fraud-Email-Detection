'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileSearch, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import Link from 'next/link';

export function WelcomeCarousel({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Analyze Emails Instantly',
      subtitle: 'Upload any raw .eml, .msg, or paste RFC 5322 headers to uncover hidden spoofing traps in milliseconds.',
      icon: FileSearch,
      color: 'text-[#3B82F6] bg-[#EFF6FF] border-[#BFDBFE]',
      badge: 'Step 1 of 3'
    },
    {
      title: 'Understand Authentication Failures',
      subtitle: 'Audit SPF, DKIM signatures, DMARC policy alignments, and multi-hop transport delays with zero guesswork.',
      icon: ShieldCheck,
      color: 'text-[#10B981] bg-[#ECFDF5] border-[#A7F3D0]',
      badge: 'Step 2 of 3'
    },
    {
      title: 'Get AI-Powered Forensic Insights',
      subtitle: 'Gemini AI translates intricate security telemetry into plain English verdicts that both analysts and executives trust.',
      icon: Sparkles,
      color: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
      badge: 'Step 3 of 3'
    }
  ];

  const current = steps[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xl p-8 text-center space-y-6 transition-colors">
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-[#3B82F6]' : 'w-2 bg-[#E2E8F0] dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xs"
               style={{ borderColor: step === 0 ? '#BFDBFE' : step === 1 ? '#A7F3D0' : '#DDD6FE',
                        backgroundColor: step === 0 ? '#EFF6FF' : step === 1 ? '#ECFDF5' : '#F5F3FF' }}>
            <Icon className={`w-8 h-8 ${step === 0 ? 'text-[#3B82F6]' : step === 1 ? 'text-[#10B981]' : 'text-[#7C3AED]'}`} />
          </div>

          <span className="inline-block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {current.badge}
          </span>

          <h3 className="text-xl font-bold text-[#0F172A] dark:text-white tracking-tight">
            {current.title}
          </h3>

          <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#F1F5F9] dark:border-slate-800">
        <Link href="/dashboard" className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          Skip Tutorial
        </Link>

        <Button
          onClick={handleNext}
          size="md"
          variant="primary"
          icon={step === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        >
          {step === steps.length - 1 ? 'Go to Dashboard' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
