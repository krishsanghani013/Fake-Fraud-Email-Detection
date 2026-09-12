'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Plus, HelpCircle } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Forensic Dashboard';
    if (pathname === '/upload') return 'Email Analysis Workbench';
    if (pathname.startsWith('/results')) return 'Forensic Audit Report';
    if (pathname === '/reports') return 'History & Incident Reports';
    if (pathname === '/settings') return 'Platform Settings';
    if (pathname === '/ai-explanation') return 'Explainable AI Insights';
    if (pathname === '/ai-detector') return 'Dual-Matrix AI Content Detector';
    if (pathname === '/risk-indicators') return 'Forensic Risk Indicators';
    if (pathname === '/cases') return 'Incident Investigations';
    return 'Aegis Forensics';
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
        {/* Left: Title & Status */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Deterministic RFC 5322 & AI Multilayer Forensics
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#3B82F6]/50 text-[#64748B] dark:text-[#94A3B8] text-xs transition-all w-80 group cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#3B82F6] transition-colors" />
            <span className="flex-1 text-left">Search emails, IPs, headers...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-[#334155] text-[10px] text-slate-500 dark:text-slate-400 font-mono shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/upload"
            prefetch={true}
            onMouseEnter={() => router.prefetch('/upload')}
          >
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Analyze Email
            </Button>
          </Link>

          {/* Cool Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Link */}
          <Link
            href="/notifications"
            prefetch={true}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
            )}
          </Link>

          {/* Help link */}
          <Link
            href="/#faq"
            prefetch={true}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
            title="Help Center"
            aria-label="Help Center"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          <div className="h-5 w-px bg-[#E2E8F0] dark:bg-[#334155] hidden sm:block" />

          {/* Clerk Auth Controls */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button size="sm" variant="secondary">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" variant="primary">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </header>

      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
    </>
  );
}
