'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Brain,
  Zap,
  ArrowUpRight,
  Radio,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Download,
  Database
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SAMPLE_SCANS, MOCK_NOTIFICATIONS } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const sampleList = Object.values(SAMPLE_SCANS);

  const displayName = isLoaded && user
    ? user.fullName || user.firstName || (user.emailAddresses?.[0]?.emailAddress?.split('@')[0]) || 'Analyst'
    : 'Analyst';

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Welcome Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purpleAccent font-bold uppercase tracking-wider">
                  SOC Analyst Workbench
                </span>
                <span className="px-2 py-0.5 rounded-full bg-successGreen/20 text-successGreen text-[10px] font-mono">
                  Online
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyanAccent/10 text-cyanAccent text-[10px] font-mono flex items-center gap-1 border border-cyanAccent/20">
                  <Database className="w-2.5 h-2.5" /> Supabase Synced
                </span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-textPrimary">
                Welcome back, {displayName}
              </h1>
              <p className="text-xs text-textSecondary">
                Aegis AI has scanned <strong className="text-textPrimary">2,890 emails</strong> in the last 24 hours. 2 critical BEC threats intercepted.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/upload">
                <Button variant="primary" size="md" icon={<Zap className="w-4 h-4" />}>
                  Analyze New Email
                </Button>
              </Link>
              <button
                onClick={() => toast('SOC Audit Report Generated', 'Downloading PDF...', 'success')}
                className="p-2.5 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-2 text-xs font-medium"
              >
                <Download className="w-4 h-4 text-cyanAccent" /> Export Audit Log
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <Card hoverEffect glowColor="blue">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textSecondary font-mono uppercase">Total Scanned (24h)</span>
                <div className="p-2 rounded-xl bg-primaryBlue/10 text-primaryBlue">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold font-heading text-textPrimary">2,890</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-successGreen font-mono font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +14.2%
                </span>
                <span className="text-textSecondary text-[11px]">vs previous day</span>
              </div>
            </Card>

            {/* Card 2 */}
            <Card hoverEffect glowColor="red">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textSecondary font-mono uppercase">Phishing & BEC Flagged</span>
                <div className="p-2 rounded-xl bg-dangerRed/10 text-dangerRed">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold font-heading text-dangerRed">426</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-dangerRed font-mono font-bold">14.7% threat rate</span>
                <span className="text-textSecondary text-[11px]">Quarantined</span>
              </div>
            </Card>

            {/* Card 3 */}
            <Card hoverEffect glowColor="purple">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textSecondary font-mono uppercase">Avg Organization Risk</span>
                <div className="p-2 rounded-xl bg-purpleAccent/10 text-purpleAccent">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold font-heading text-purpleAccent">34.2 / 100</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-successGreen font-mono font-bold">Low Exposure</span>
                <span className="text-textSecondary text-[11px]">Updated 5m ago</span>
              </div>
            </Card>

            {/* Card 4 */}
            <Card hoverEffect glowColor="cyan">
              <div className="flex items-center justify-between">
                <span className="text-xs text-textSecondary font-mono uppercase">AI Detection Accuracy</span>
                <div className="p-2 rounded-xl bg-cyanAccent/10 text-cyanAccent">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
              </div>
              <div className="mt-4 text-3xl font-bold font-heading text-cyanAccent">99.82%</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-cyanAccent font-mono font-bold">0 False Positives</span>
                <span className="text-textSecondary text-[11px]">Model v4.9</span>
              </div>
            </Card>
          </div>

          {/* Center Section: AI Engine Status & Recent Scans Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Recent Email Scans (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <FileCheck2 className="w-5 h-5 text-primaryBlue" /> Recent Threat Scans
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href="/upload">
                      <Button variant="ghost" size="sm" icon={<Zap className="w-3.5 h-3.5 text-purpleAccent" />}>
                        New Analysis
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-borderSubtle text-[11px] font-mono text-textSecondary uppercase">
                        <th className="pb-3 font-medium">Timestamp</th>
                        <th className="pb-3 font-medium">Sender & Domain</th>
                        <th className="pb-3 font-medium">Subject</th>
                        <th className="pb-3 font-medium">Risk Score</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderSubtle/50 text-xs">
                      {sampleList.map((scan) => (
                        <tr key={scan.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-4 font-mono text-textSecondary text-[11px]">
                            {scan.scanTimestamp.substring(11, 16)} UTC
                          </td>
                          <td className="py-4 font-medium text-textPrimary">
                            <div>{scan.senderName}</div>
                            <div className="text-[11px] text-textSecondary font-mono">{scan.senderEmail}</div>
                          </td>
                          <td className="py-4 text-textSecondary max-w-xs truncate">
                            {scan.subject}
                          </td>
                          <td className="py-4">
                            <Badge level={scan.riskLevel}>
                              {scan.riskScore}/100
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <Link href={`/results/${scan.id}`}>
                              <button className="px-3 py-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textPrimary text-xs font-semibold flex items-center gap-1 ml-auto group-hover:bg-primaryBlue group-hover:text-white transition-all">
                                View <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right: Quick Links (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Links Card */}
              <Card>
                <CardTitle className="text-sm">Deep Inspection Utilities</CardTitle>
                <div className="mt-4 space-y-2">
                  <Link href="/risk-indicators" className="flex items-center justify-between p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-xs font-semibold text-textPrimary transition-all">
                    <span>Inspect 13 Risk Indicators</span>
                    <ArrowUpRight className="w-4 h-4 text-primaryBlue" />
                  </Link>
                  <Link href="/ai-explanation" className="flex items-center justify-between p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-purpleAccent/40 text-xs font-semibold text-textPrimary transition-all">
                    <span>Explainable AI Neural View</span>
                    <ArrowUpRight className="w-4 h-4 text-purpleAccent" />
                  </Link>
                  <Link href="/investigation-timeline" className="flex items-center justify-between p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-cyanAccent/40 text-xs font-semibold text-textPrimary transition-all">
                    <span>Incident Investigation Timeline</span>
                    <ArrowUpRight className="w-4 h-4 text-cyanAccent" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
