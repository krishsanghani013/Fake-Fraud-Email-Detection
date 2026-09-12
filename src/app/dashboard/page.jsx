'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  UploadCloud,
  FileText,
  Database,
  ArrowUpRight,
  FileCode,
  Gauge
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { SAMPLE_SCANS } from '../../data/mockData';
import { getCachedEmailsSync, getEmailsWithSWR } from '../../lib/clientDataCache';

// Lazy load Recharts chart
const RiskDonutChart = dynamic(
  () => import('../../components/dashboard/RiskDonutChart').then((mod) => mod.RiskDonutChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-[#3B82F6] animate-spin" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  
  // Initialize from cache
  const [dbEmails, setDbEmails] = useState(() => getCachedEmailsSync() || []);
  const [isLoading, setIsLoading] = useState(() => !getCachedEmailsSync());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEmails = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const emails = await getEmailsWithSWR(
        (data) => {
          setDbEmails(data);
          setIsLoading(false);
        },
        { forceRefresh: showToast }
      );

      if (emails && Array.isArray(emails)) {
        setDbEmails(emails);
        if (showToast) {
          toast('Synced with Supabase', `Loaded ${emails.length} dynamic forensic records`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to fetch dynamic emails:', err);
      if (showToast) {
        toast('Sync Notice', 'Using cached offline records', 'warning');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Fallback to sample scans
  const displayList = dbEmails.length > 0 ? dbEmails : Object.values(SAMPLE_SCANS);

  // Compute statistics
  const totalCount = displayList.length;
  const criticalCount = displayList.filter((e) => (e.riskScore ?? 0) >= 80).length;
  const highCount = displayList.filter((e) => (e.riskScore ?? 0) >= 50 && (e.riskScore ?? 0) < 80).length;
  const mediumCount = displayList.filter((e) => (e.riskScore ?? 0) >= 20 && (e.riskScore ?? 0) < 50).length;
  const lowCount = displayList.filter((e) => (e.riskScore ?? 0) < 20).length;
  const threatsCount = criticalCount + highCount;

  const avgRisk = totalCount > 0
    ? Math.round(displayList.reduce((acc, e) => acc + (e.riskScore ?? 0), 0) / totalCount)
    : 0;

  const getRiskLevelString = (score) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  // Donut chart segments
  const chartData = [
    { name: 'Low Risk', value: lowCount, color: '#10B981', level: 'LOW' },
    { name: 'Medium Risk', value: mediumCount, color: '#F59E0B', level: 'MEDIUM' },
    { name: 'High Risk', value: highCount, color: '#EF4444', level: 'HIGH' },
    { name: 'Critical Risk', value: criticalCount, color: '#7C3AED', level: 'CRITICAL' },
  ].filter((d) => d.value > 0);

  // Filter by risk level
  const filteredList = displayList.filter((item) => {
    if (selectedRiskFilter === 'ALL') return true;
    const score = item.riskScore ?? 0;
    return getRiskLevelString(score) === selectedRiskFilter;
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const displayName = isLoaded && user
    ? user.fullName || user.firstName || (user.emailAddresses?.[0]?.emailAddress?.split('@')[0]) || 'Analyst'
    : 'Analyst';

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        sessionStorage.setItem('pending_eml_upload', event.target.result);
        router.push('/upload');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#FAFBFC] flex transition-colors duration-200">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Welcome Banner */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#3B82F6] dark:text-blue-400 uppercase tracking-wider">
                  Security Operations Center
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 text-[10px] font-semibold">
                  Online
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 text-[10px] font-semibold border border-[#BFDBFE] dark:border-blue-800 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> {dbEmails.length} Supabase Scans
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Monitor real-time RFC 5322 parsing, cryptographic authentication checks, and compound forensic risk.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchEmails(true)}
                disabled={isRefreshing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              >
                Sync Database
              </Button>
              <Link href="/upload">
                <Button variant="primary" size="sm" icon={<UploadCloud className="w-4 h-4" />}>
                  Analyze Email
                </Button>
              </Link>
            </div>
          </div>

          {/* Section 1: Quick Stats (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat 1: Total Emails Analyzed */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Analyzed</span>
                <FileText className="w-4 h-4 text-[#3B82F6] dark:text-blue-400" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">
                  {totalCount}
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 flex items-center gap-1">
                  <span className="text-[#10B981] dark:text-emerald-400 font-semibold">+100%</span> verified RFC 5322 messages
                </p>
              </div>
            </Card>

            {/* Stat 2: Average Risk Level */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Risk Score</span>
                <Gauge className="w-4 h-4 text-[#F59E0B] dark:text-amber-400" />
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#0F172A] dark:text-[#FAFBFC] tracking-tight">{avgRisk}</span>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">/ 100</span>
                </div>
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${avgRisk}%`,
                      backgroundColor: avgRisk >= 50 ? '#EF4444' : avgRisk >= 20 ? '#F59E0B' : '#10B981'
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Stat 3: Threats Detected */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
                <span className="text-xs font-semibold uppercase tracking-wider">Threats Detected</span>
                <ShieldAlert className="w-4 h-4 text-[#EF4444] dark:text-red-400" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-[#EF4444] dark:text-red-400 tracking-tight">
                  {threatsCount}
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                  {criticalCount} Critical • {highCount} High risk emails
                </p>
              </div>
            </Card>

            {/* Stat 4: Trend Indicator */}
            <Card className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8]">
                <span className="text-xs font-semibold uppercase tracking-wider">This Week Trend</span>
                <TrendingUp className="w-4 h-4 text-[#10B981] dark:text-emerald-400" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-[#10B981] dark:text-emerald-400 tracking-tight">
                  +14.8%
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Detection efficiency vs last 7 days
                </p>
              </div>
            </Card>
          </div>

          {/* Section 3 & Section 4 Grid: Upload Zone + Risk Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section 3: Prominent Upload Zone Card (2 cols on lg) */}
            <div className="lg:col-span-2">
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle>
                      <UploadCloud className="w-5 h-5 text-[#3B82F6] dark:text-blue-400" />
                      <span>Instant Email Forensic Ingestion</span>
                    </CardTitle>
                    <Badge level="INFO">Fast Parser</Badge>
                  </CardHeader>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
                    Upload an email file or raw text to inspect RFC 5322 boundaries, SPF/DKIM verification, hop latencies, and neural deception.
                  </p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-[#CBD5E1] dark:border-slate-700 hover:border-[#3B82F6] dark:hover:border-blue-500 rounded-xl p-8 text-center bg-[#FAFBFC] dark:bg-[#0F172A] hover:bg-[#EFF6FF]/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-3"
                  onClick={() => router.push('/upload')}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#3B82F6] dark:text-blue-400 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#FAFBFC]">
                      Drop .eml file here or click to browse
                    </h4>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                      Supports .eml, .msg, and raw plain text headers (up to 25MB)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button size="sm" variant="primary">
                      Upload Email
                    </Button>
                    <Button size="sm" variant="secondary" icon={<FileCode className="w-3.5 h-3.5" />}>
                      Paste Email Headers
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Section 4: Risk Distribution Donut Chart (1 col on lg) */}
            <div>
              <Card className="p-6 h-full flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle>
                      <ShieldCheck className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
                      <span>Risk Distribution</span>
                    </CardTitle>
                    {selectedRiskFilter !== 'ALL' && (
                      <button
                        onClick={() => setSelectedRiskFilter('ALL')}
                        className="text-[11px] text-[#3B82F6] dark:text-blue-400 font-semibold hover:underline"
                      >
                        Reset Filter
                      </button>
                    )}
                  </CardHeader>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Breakdown of analyzed emails by deterministic risk severity. Click any segment to filter.
                  </p>
                </div>

                <RiskDonutChart
                  chartData={chartData}
                  onSelectFilter={setSelectedRiskFilter}
                />

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F1F5F9] dark:border-[#334155] text-xs">
                  <button
                    onClick={() => setSelectedRiskFilter('LOW')}
                    className={`flex items-center gap-1.5 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${selectedRiskFilter === 'LOW' ? 'font-bold bg-emerald-50 dark:bg-emerald-950/50' : ''}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-slate-600 dark:text-slate-300">Low ({lowCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedRiskFilter('MEDIUM')}
                    className={`flex items-center gap-1.5 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${selectedRiskFilter === 'MEDIUM' ? 'font-bold bg-amber-50 dark:bg-amber-950/50' : ''}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="text-slate-600 dark:text-slate-300">Medium ({mediumCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedRiskFilter('HIGH')}
                    className={`flex items-center gap-1.5 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${selectedRiskFilter === 'HIGH' ? 'font-bold bg-red-50 dark:bg-red-950/50' : ''}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="text-slate-600 dark:text-slate-300">High ({highCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedRiskFilter('CRITICAL')}
                    className={`flex items-center gap-1.5 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${selectedRiskFilter === 'CRITICAL' ? 'font-bold bg-purple-50 dark:bg-purple-950/50' : ''}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                    <span className="text-slate-600 dark:text-slate-300">Critical ({criticalCount})</span>
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* Section 2: Recent Analysis Table */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9] dark:border-[#334155]">
              <div>
                <CardTitle>Recent Forensic Investigations</CardTitle>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Showing {filteredList.length} total investigations {selectedRiskFilter !== 'ALL' && `(filtered by ${selectedRiskFilter})`}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/reports">
                  <Button size="sm" variant="ghost" icon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                    View All History
                  </Button>
                </Link>
              </div>
            </div>

            {/* Table or Empty State */}
            {paginatedList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No emails analyzed yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Upload an .eml file or test an email in the analyzer workbench to view forensic results here.
                </p>
                <Link href="/upload">
                  <Button size="sm" variant="primary">
                    Upload Email
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Sender</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Risk Level</th>
                      <th className="py-3 px-4">Verdict Score</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800 text-xs">
                    {paginatedList.map((item, idx) => {
                      const score = item.riskScore ?? item.threatScore ?? 0;
                      const level = getRiskLevelString(score);
                      const dateStr = item.createdAt || item.scanTimestamp || new Date().toISOString();
                      const formattedDate = new Date(dateStr).toLocaleString();
                      const scanTargetId = item.id || `sample-${idx}`;

                      // Risk border styling
                      const borderColors = {
                        LOW: 'border-l-[#10B981]',
                        MEDIUM: 'border-l-[#F59E0B]',
                        HIGH: 'border-l-[#EF4444]',
                        CRITICAL: 'border-l-[#7C3AED]',
                      };

                      return (
                        <tr
                          key={scanTargetId}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors border-l-4 ${borderColors[level] || 'border-l-slate-300 dark:border-l-slate-600'}`}
                        >
                          <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={item.sender || item.senderEmail}>
                            {item.sender || item.senderEmail || 'Unknown Sender'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[260px]" title={item.subject}>
                            {item.subject || '(No Subject)'}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge level={level} size="xs">
                              {level}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {score} / 100
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/results/${scanTargetId}`}
                              prefetch={true}
                              onMouseEnter={() => router.prefetch(`/results/${scanTargetId}`)}
                            >
                              <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs">
                                <span>Inspect</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] dark:border-[#334155] text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
