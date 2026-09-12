'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  FileJson,
  Calendar,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { SAMPLE_SCANS } from '../../data/mockData';
import { getCachedEmailsSync, getEmailsWithSWR } from '../../lib/clientDataCache';

export default function ReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'templates'
  // Initialize from cache
  const [dbEmails, setDbEmails] = useState(() => getCachedEmailsSync() || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'risk-desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    getEmailsWithSWR((emails) => {
      setDbEmails(emails);
    });
  }, []);

  const allItems = dbEmails.length > 0 ? dbEmails : Object.values(SAMPLE_SCANS);

  const getRiskLevel = (score) => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  // Filter reports
  const filteredItems = allItems.filter((item) => {
    const sender = (item.sender || item.senderEmail || '').toLowerCase();
    const subject = (item.subject || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || sender.includes(query) || subject.includes(query);

    const score = item.riskScore ?? 0;
    const level = getRiskLevel(score);
    const matchesRisk = selectedRisk === 'ALL' || level === selectedRisk;

    return matchesSearch && matchesRisk;
  });

  // Sort reports
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'risk-desc') {
      return (b.riskScore ?? 0) - (a.riskScore ?? 0);
    }
    const dateA = new Date(a.createdAt || a.scanTimestamp || 0).getTime();
    const dateB = new Date(b.createdAt || b.scanTimestamp || 0).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = (templateName, format) => {
    toast(`Exporting ${templateName}`, `Preparing ${format} document...`, 'success');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#FAFBFC] flex transition-colors duration-200">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Banner */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-[#3B82F6] dark:text-blue-400 uppercase tracking-wider">
                  Audits & Archival
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
                History & Forensic Reports
              </h1>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Access past email investigations, filter by threat severity, and generate executive or technical reports.
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-xs'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                Analysis History
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white shadow-xs'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                Report Templates
              </button>
            </div>
          </div>

          {/* VIEW 1: ANALYSIS HISTORY */}
          {activeTab === 'history' && (
            <Card className="p-6 space-y-5">
              {/* Filters Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by sender, subject, or domain..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800/80 transition-colors"
                  />
                </div>

                {/* Filter Pills & Sorting */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setSelectedRisk(r);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedRisk === r
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="risk-desc">Highest Risk First</option>
                  </select>
                </div>
              </div>

              {/* Table or Empty State */}
              {paginatedItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No investigations match your filters
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Try clearing your search query or selecting &ldquo;ALL&rdquo; risk levels.
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRisk('ALL');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Sender</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                      {paginatedItems.map((item, idx) => {
                        const score = item.riskScore ?? 0;
                        const level = getRiskLevel(score);
                        const dateStr = item.createdAt || item.scanTimestamp || new Date().toISOString();
                        const formattedDate = new Date(dateStr).toLocaleDateString();
                        const targetId = item.id || `sample-${idx}`;

                        const borderColors = {
                          LOW: 'border-l-[#10B981]',
                          MEDIUM: 'border-l-[#F59E0B]',
                          HIGH: 'border-l-[#EF4444]',
                          CRITICAL: 'border-l-[#7C3AED]',
                        };

                        return (
                          <tr
                            key={targetId}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors border-l-4 ${borderColors[level] || 'border-l-slate-300 dark:border-l-slate-700'}`}
                          >
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={item.sender || item.senderEmail}>
                              {item.sender || item.senderEmail || 'Unknown'}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[280px]" title={item.subject}>
                              {item.subject || '(No Subject)'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge level={level} size="xs">
                                {level}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {score}/100
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/results/${targetId}`}
                                prefetch={true}
                                onMouseEnter={() => router.prefetch(`/results/${targetId}`)}
                              >
                                <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs">
                                  <span>View Report</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                      <span>Showing page {currentPage} of {totalPages}</span>
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
          )}

          {/* VIEW 2: REPORT TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Template 1 */}
                <Card className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#3B82F6] dark:text-blue-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Executive Summary Report
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                      Clean 2-page brief with risk gauge graphics, plain-English Gemini explanations, and strategic mitigation recommendations.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExport('Executive Summary', 'PDF')}
                    variant="primary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Generate PDF Brief
                  </Button>
                </Card>

                {/* Template 2 */}
                <Card className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#10B981] dark:text-emerald-400 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Technical Forensics Audit
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                      Comprehensive CSV dataset including raw SPF/DKIM tags, MTA hop latencies, RFC 5737 IPs, and extracted URLs.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExport('Technical Audit', 'CSV')}
                    variant="secondary"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Export Full CSV
                  </Button>
                </Card>

                {/* Template 3 */}
                <Card className="p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      SIEM & Telemetry JSON
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                      Pre-formatted normalized JSON output for ingestion into Splunk, Microsoft Sentinel, Elastic, or Datadog.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleExport('SIEM Telemetry', 'JSON')}
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download SIEM JSON
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
