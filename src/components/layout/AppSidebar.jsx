'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  BrainCircuit,
  Sliders,
  GitCommit,
  BarChart3,
  Briefcase,
  FileSpreadsheet,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Lock
} from 'lucide-react';
import { clsx } from 'clsx';

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, badge: null },
    { label: 'Analyze Email', href: '/upload', icon: UploadCloud, badge: 'Scanner' },
    { label: 'Analysis Report', href: '/results/scan-89421', icon: FileCheck2, badge: null },
    { label: 'Explainable AI View', href: '/ai-explanation', icon: BrainCircuit, badge: null },
    { label: 'AI Content Detector', href: '/ai-detector', icon: Sparkles, badge: 'New' },
    { label: '13 Risk Indicators', href: '/risk-indicators', icon: Sliders, badge: '13' },
    { label: 'Investigation Timeline', href: '/investigation-timeline', icon: GitCommit, badge: null },
    { label: 'Threat Analytics', href: '/analytics', icon: BarChart3, badge: null },
    { label: 'Incident Cases', href: '/cases', icon: Briefcase, badge: '4 Active' },
  ];

  const secondaryItems = [
    { label: 'Auth Portal', href: '/auth', icon: Lock },
    { label: 'Landing Page', href: '/', icon: ExternalLink },
  ];

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 z-40 glass-panel border-r border-borderSubtle transition-all duration-300 flex flex-col justify-between select-none',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-borderSubtle">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primaryBlue via-purpleAccent to-cyanAccent flex items-center justify-center shadow-glowBlue shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight gradient-text-blue font-heading">
                  AEGIS AI
                </span>
                <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider">
                  Fraud Email Guard
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textSecondary hover:text-textPrimary transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div className={clsx('px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-textSecondary', collapsed && 'hidden')}>
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href.startsWith('/results') && pathname.startsWith('/results'));

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-gradient-to-r from-primaryBlue/20 to-purpleAccent/10 text-white border border-primaryBlue/40 shadow-glowBlue'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-white/5 border border-transparent'
                  )}
                >
                  <Icon className={clsx('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-primaryBlue' : 'text-textSecondary')} />
                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primaryBlue/10 text-primaryBlue border border-primaryBlue/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          <div className={clsx('pt-4 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-textSecondary', collapsed && 'hidden')}>
            External & Auth
          </div>

          {secondaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-all">
                  <Icon className="w-4 h-4 shrink-0 text-textSecondary" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* AI Health Footer Box */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-surfaceSecondary to-surface border border-borderSubtle text-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-textPrimary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purpleAccent" /> AI Guard Active
            </span>
            <span className="w-2 h-2 rounded-full bg-successGreen animate-pulse" />
          </div>
          <p className="text-[11px] text-textSecondary">
            99.8% precision across 2.4M verified headers.
          </p>
        </div>
      )}
    </aside>
  );
}
