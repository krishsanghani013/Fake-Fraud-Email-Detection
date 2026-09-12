'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  UploadCloud,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const primaryNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Analyze Email', href: '/upload', icon: UploadCloud, badge: 'Scanner' },
    { label: 'History & Reports', href: '/reports', icon: FileText },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const forensicTools = [
    { label: 'AI Content Detector', href: '/ai-detector', icon: Sparkles },
    { label: '13 Risk Indicators', href: '/risk-indicators', icon: Sliders },
    { label: 'Explainable AI View', href: '/ai-explanation', icon: HelpCircle },
  ];

  const userName = isLoaded && user
    ? user.fullName || user.firstName || (user.emailAddresses?.[0]?.emailAddress?.split('@')[0]) || 'Analyst'
    : 'Analyst';

  const userEmail = isLoaded && user
    ? user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'analyst@aegis.defense'
    : 'analyst@aegis.defense';

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 z-40 bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155] shadow-sm transition-all duration-200 flex flex-col justify-between select-none shrink-0',
        collapsed ? 'w-16' : 'w-[280px]'
      )}
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155]">
          <Link
            href="/"
            prefetch={true}
            onMouseEnter={() => router.prefetch('/')}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-sm shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-[#0F172A] dark:text-[#FAFBFC] truncate font-sans">
                  AEGIS FORENSICS
                </span>
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-medium tracking-wide uppercase">
                  Email Fraud Defense
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FAFBFC] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {!collapsed && (
            <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>
          )}

          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/reports' && pathname.startsWith('/reports'));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onMouseEnter={() => router.prefetch(item.href)}
              >
                <div
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative cursor-pointer',
                    isActive
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold shadow-sm border border-[#BFDBFE] dark:border-blue-800/80'
                      : 'text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-[#FAFBFC] hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                      isActive ? 'text-[#3B82F6] dark:text-blue-400' : 'text-[#64748B] dark:text-[#94A3B8]'
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] dark:bg-blue-900/60 text-[#1D4ED8] dark:text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Collapsible Forensic Tools */}
          {!collapsed && (
            <div className="pt-4">
              <button
                onClick={() => setToolsOpen(!toolsOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8] dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <span>Forensic Engines</span>
                <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', toolsOpen && 'rotate-180')} />
              </button>

              {toolsOpen && (
                <div className="mt-1 space-y-1 pl-1">
                  {forensicTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = pathname === tool.href;
                    return (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        prefetch={true}
                        onMouseEnter={() => router.prefetch(tool.href)}
                      >
                        <div
                          className={clsx(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                            isActive
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>{tool.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Documentation Link */}
          <div className="pt-2">
            <Link href="/#faq">
              <div
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#FAFBFC] hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? 'Help & Docs' : undefined}
              >
                <HelpCircle className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                {!collapsed && <span>Help & Docs</span>}
              </div>
            </Link>
          </div>
        </nav>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#FAFBFC] dark:bg-[#1E293B]">
        <div className={clsx('flex items-center gap-3', collapsed ? 'justify-center' : 'justify-between')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <UserButton afterSignOutUrl="/" />
            {!collapsed && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#FAFBFC] truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate max-w-[140px]">
                  {userEmail}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => signOut?.({ redirectUrl: '/' })}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
