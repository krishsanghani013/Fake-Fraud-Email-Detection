'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Shield, Command, Plus, Radio, User, ChevronDown } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';

export function AppHeader() {
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Executive Threat Dashboard';
    if (pathname === '/upload') return 'Email Analysis Workbench';
    if (pathname === '/scanning') return 'Live AI Threat Scanning';
    if (pathname.startsWith('/results')) return 'Detailed Security Audit Report';
    if (pathname === '/ai-explanation') return 'Explainable AI Neural Breakdown';
    if (pathname === '/risk-indicators') return '13 AI Threat Risk Indicators';
    if (pathname === '/investigation-timeline') return 'Incident Lifecycle Timeline';
    if (pathname === '/analytics') return 'Threat Intelligence Analytics';
    if (pathname === '/cases') return 'Incident Cases Workbench';
    if (pathname === '/reports') return 'Security Audit & Compliance Reports';
    if (pathname === '/notifications') return 'Real-time Security Alerts';
    if (pathname === '/settings') return 'Organization & Security Settings';
    if (pathname === '/auth') return 'Authentication Portal';
    return 'AEGIS AI Platform';
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 glass-panel border-b border-borderSubtle px-6 flex items-center justify-between">
        {/* Left: Title & Status */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-textPrimary flex items-center gap-2">
              {getPageTitle()}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-textSecondary font-mono">
              <span className="inline-flex items-center gap-1 text-successGreen">
                <Radio className="w-3 h-3 animate-pulse" /> Live AI Engine Active
              </span>
              <span>•</span>
              <span>Model v4.9 (99.8% Precision)</span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-surfaceSecondary/80 border border-borderSubtle hover:border-primaryBlue/40 text-textSecondary text-xs transition-all w-80 shadow-inner group"
          >
            <Search className="w-3.5 h-3.5 text-primaryBlue group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-left">Search emails, IPs, threats...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-textPrimary text-[10px] font-mono flex items-center gap-0.5">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primaryBlue to-purpleAccent text-white text-xs font-semibold shadow-glowBlue hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>
          </Link>

          {/* Notifications Link */}
          <Link href="/notifications" className="relative p-2 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-textSecondary hover:text-textPrimary transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-dangerRed text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primaryBlue to-purpleAccent flex items-center justify-center text-white text-xs font-bold shadow-glowBlue">
                AG
              </div>
              <span className="hidden lg:inline text-xs font-medium text-textPrimary">Alex Rivera (CISO)</span>
              <ChevronDown className="w-3.5 h-3.5 text-textSecondary" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl border border-white/10 shadow-2xl p-2 z-50 text-xs divide-y divide-borderSubtle">
                <div className="p-2">
                  <div className="font-semibold text-textPrimary">Alex Rivera</div>
                  <div className="text-textSecondary text-[11px]">alex.rivera@aegis-sec.io</div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-purpleAccent/20 text-purpleAccent font-mono text-[10px]">
                    Enterprise Tier
                  </div>
                </div>
                <div className="py-1">
                  <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-textPrimary">
                    <User className="w-3.5 h-3.5 text-primaryBlue" /> Profile & Security
                  </Link>
                  <Link href="/reports" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-textPrimary">
                    <Shield className="w-3.5 h-3.5 text-cyanAccent" /> SOC Audit Reports
                  </Link>
                </div>
                <div className="pt-1">
                  <Link href="/auth" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dangerRed/10 text-dangerRed">
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
