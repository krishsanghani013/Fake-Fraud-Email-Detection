'use client';

import React, { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, ArrowLeft, Sparkles, UserPlus } from 'lucide-react';
import { WelcomeCarousel } from '../../../components/auth/WelcomeCarousel';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';

export default function SignUpPage() {
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="min-h-screen bg-softWhite dark:bg-[#0F172A] text-deepSlate dark:text-[#FAFBFC] flex flex-col justify-between py-10 px-4 sm:px-6 transition-colors">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-deepSlate dark:bg-[#1E293B] border border-transparent dark:border-[#334155] flex items-center justify-center text-white shadow-xs group-hover:bg-accentBlue transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-deepSlate dark:text-white tracking-tight">AEGIS</span>
            <span className="text-xs text-neutralGray dark:text-slate-400 ml-1 font-mono">FORENSICS</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setShowTour(!showTour)}
            className="text-xs font-semibold text-accentBlue dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showTour ? 'View Sign Up' : 'Platform Tour'}
          </button>
          <Link
            href="/"
            className="text-xs text-neutralGray dark:text-slate-400 hover:text-deepSlate dark:hover:text-white flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
        {showTour ? (
          <div className="space-y-4">
            <WelcomeCarousel onComplete={() => setShowTour(false)} />
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold font-heading text-deepSlate dark:text-white tracking-tight">
                Join the Email Security Revolution
              </h1>
              <p className="text-xs text-neutralGray dark:text-slate-400">
                Start detecting advanced phishing, spoofing, and BEC wire fraud with transparent 8-phase forensics.
              </p>
            </div>

            {/* Clerk Sign Up Component */}
            <div className="flex justify-center">
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/dashboard"
              />
            </div>
          </>
        )}
      </div>

      {/* Trust Signals Footer */}
      <div className="max-w-md w-full mx-auto pt-6 border-t border-borderSubtle dark:border-slate-800 flex items-center justify-center gap-6 text-[11px] text-neutralGray dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-accentBlue" />
          <span>256-bit TLS Encrypted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-riskLow" />
          <span>RFC 5322 Compliant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-neutralGray dark:text-slate-500" />
          <span>Zero-Retention Option</span>
        </div>
      </div>
    </div>
  );
}
