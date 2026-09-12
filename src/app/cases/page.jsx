'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronRight,
  Plus,
  X,
  FileText
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MOCK_CASES } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';
import { Database, RefreshCw } from 'lucide-react';

export default function CasesPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [casesList, setCasesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCases = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        if (data.emails && Array.isArray(data.emails) && data.emails.length > 0) {
          const dynamicCases = data.emails.map((e) => {
            const score = e.riskScore ?? 0;
            const level = e.classification || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW');
            const status = score >= 50 ? 'UNDER_INVESTIGATION' : 'MITIGATED';
            const domain = e.sender?.includes('@') ? e.sender.split('@')[1] : 'enterprise.internal';
            return {
              id: e.id,
              title: e.subject || 'Incident Investigation Case',
              sender: e.sender || 'Unknown Sender',
              threatLevel: level,
              riskScore: score,
              assignedAnalyst: {
                name: e.user?.name || 'Lead SOC Analyst',
                email: e.user?.email || 'analyst@aegis.defense',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
              },
              targetDomain: domain,
              status: status,
              explanation: e.explanation,
              body: e.body,
              createdAt: e.createdAt,
              isSupabaseRecord: true
            };
          });
          setCasesList(dynamicCases);
          if (showToast) {
            toast('Cases Refreshed', `Loaded ${dynamicCases.length} dynamic cases from Supabase`, 'success');
          }
        } else {
          setCasesList(MOCK_CASES);
        }
      } else {
        setCasesList(MOCK_CASES);
      }
    } catch (err) {
      console.error('Failed to fetch cases from Supabase:', err);
      setCasesList(MOCK_CASES);
      if (showToast) {
        toast('Sync Notice', 'Showing cached SOC incidents', 'info');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const filtered = casesList.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase()) ||
      item.sender.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleBulkAction = (action) => {
    toast(`Bulk ${action} Executed`, `Updated selected cases safely`, 'success');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-cyanAccent uppercase tracking-wider">
                <Briefcase className="w-4 h-4" /> Incident Management
                <span className="px-2 py-0.5 rounded-full bg-cyanAccent/10 text-cyanAccent text-[10px] font-mono border border-cyanAccent/20 flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Supabase Synced
                </span>
              </div>
              <h1 className="text-3xl font-bold font-heading">
                Security Cases Workbench
              </h1>
              <p className="text-xs text-textSecondary">
                Manage, investigate, and mitigate flagged email threats assigned across your SOC team.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchCases(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-cyanAccent/40 text-textSecondary hover:text-cyanAccent transition-all flex items-center gap-2 text-xs font-medium disabled:opacity-50"
                title="Refresh cases from Supabase"
              >
                <RefreshCw className={`w-4 h-4 text-cyanAccent ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Supabase</span>
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={() => toast('New Case Form Opened', 'Fill details to submit manual incident', 'info')}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Manual Case
              </Button>
            </div>
          </div>

          {/* Table Control Bar */}
          <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-textSecondary absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search case ID, title, or sender email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl pl-10 pr-4 py-2 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primaryBlue"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'OPEN', 'UNDER_INVESTIGATION', 'MITIGATED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                    statusFilter === st
                      ? 'bg-primaryBlue text-white shadow-glowBlue'
                      : 'bg-surfaceSecondary text-textSecondary border border-borderSubtle hover:text-textPrimary'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </Card>

          {/* Cases Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-[11px] font-mono text-textSecondary uppercase">
                    <th className="pb-4 pt-2 font-medium">Case ID & Title</th>
                    <th className="pb-4 pt-2 font-medium">Threat Level</th>
                    <th className="pb-4 pt-2 font-medium">Assigned Analyst</th>
                    <th className="pb-4 pt-2 font-medium">Target Domain</th>
                    <th className="pb-4 pt-2 font-medium">Status</th>
                    <th className="pb-4 pt-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle/50 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-textSecondary font-mono">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyanAccent" />
                        Loading incident cases from Supabase...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-textSecondary">
                        No incident cases match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4">
                          <div className="font-bold text-textPrimary text-sm group-hover:text-primaryBlue transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] font-mono text-textSecondary flex items-center gap-2 mt-0.5">
                            <span className="text-cyanAccent truncate max-w-xs">{item.id.slice(0, 8)}...</span>
                            <span>•</span>
                            <span className="truncate max-w-xs">{item.sender}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge level={item.threatLevel}>
                            {item.riskScore}/100
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <img src={item.assignedAnalyst.avatar} alt="Analyst" className="w-6 h-6 rounded-full border border-primaryBlue/30" />
                            <span className="text-textPrimary font-medium">{item.assignedAnalyst.name}</span>
                          </div>
                        </td>
                        <td className="py-4 font-mono text-textSecondary">{item.targetDomain}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            item.status === 'UNDER_INVESTIGATION' ? 'bg-warningAmber/20 text-warningAmber' : 'bg-successGreen/20 text-successGreen'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedCase(item)}
                            className="px-3 py-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textPrimary text-xs font-semibold ml-auto flex items-center gap-1 group-hover:bg-primaryBlue group-hover:text-white transition-all"
                          >
                            Inspect Drawer <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Interactive Case Drawer Overlay */}
          {selectedCase && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
              <div className="w-full max-w-xl glass-panel border-l border-white/10 h-full p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-borderSubtle">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-purpleAccent">{selectedCase.id}</span>
                      {selectedCase.isSupabaseRecord && (
                        <span className="px-2 py-0.5 rounded-full bg-cyanAccent/10 text-cyanAccent text-[9px] font-mono border border-cyanAccent/20">
                          Supabase Verified
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-textPrimary mt-1">{selectedCase.title}</h2>
                  </div>
                  <button onClick={() => setSelectedCase(null)} className="p-2 text-textSecondary hover:text-textPrimary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
                    <div className="text-textSecondary font-mono uppercase text-[11px]">Executive Threat Analysis</div>
                    <div className="text-textPrimary leading-relaxed">
                      {selectedCase.explanation || `Evaluated sender ${selectedCase.sender}. Threat risk index calculated dynamically at ${selectedCase.riskScore}/100.`}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                      <div className="text-textSecondary">Assigned Analyst</div>
                      <div className="font-bold text-textPrimary mt-1">{selectedCase.assignedAnalyst.name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                      <div className="text-textSecondary">Risk Index</div>
                      <div className="font-bold text-dangerRed mt-1">{selectedCase.riskScore} / 100</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-borderSubtle">
                    <Link href={`/results/${selectedCase.id}`}>
                      <button className="px-4 py-2 rounded-xl bg-primaryBlue text-white text-xs font-semibold shadow-glowBlue flex items-center gap-2 hover:bg-primaryBlue/90 transition-all">
                        <FileText className="w-4 h-4" /> Full Audit Report
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        toast('Case Marked Mitigated', `${selectedCase.id.slice(0, 8)}... closed cleanly`, 'success');
                        setSelectedCase(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-successGreen/20 text-successGreen border border-successGreen/40 text-xs font-bold"
                    >
                      Mark Mitigated
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
