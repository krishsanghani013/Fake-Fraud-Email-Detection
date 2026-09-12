'use client';

import React, { useState } from 'react';
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

export default function CasesPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [casesList, setCasesList] = useState(MOCK_CASES);
  const [statusFilter, setStatusFilter] = useState('ALL');

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
              </div>
              <h1 className="text-3xl font-bold font-heading">
                Security Cases Workbench
              </h1>
              <p className="text-xs text-textSecondary">
                Manage, investigate, and mitigate flagged email threats assigned across your SOC team.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => toast('New Case Form Opened', 'Fill details to submit manual incident', 'info')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Manual Case
            </Button>
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
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4">
                        <div className="font-bold text-textPrimary text-sm group-hover:text-primaryBlue transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] font-mono text-textSecondary flex items-center gap-2 mt-0.5">
                          <span>{item.id}</span> • <span>{item.sender}</span>
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
                  ))}
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
                    <span className="text-xs font-mono text-purpleAccent">{selectedCase.id}</span>
                    <h2 className="text-lg font-bold text-textPrimary">{selectedCase.title}</h2>
                  </div>
                  <button onClick={() => setSelectedCase(null)} className="p-2 text-textSecondary hover:text-textPrimary">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surfaceSecondary border border-borderSubtle space-y-2">
                    <div className="text-textSecondary">Executive Summary</div>
                    <div className="text-textPrimary leading-relaxed">
                      High-risk BEC wire transfer attack targeting {selectedCase.targetDomain}. Spoofed header domains and attached malware dropper captured.
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
                    <Link href={`/results/scan-89421`}>
                      <button className="px-4 py-2 rounded-xl bg-primaryBlue text-white text-xs font-semibold shadow-glowBlue flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Full Audit Report
                      </button>
                    </Link>
                    <button
                      onClick={() => {
                        toast('Case Marked Mitigated', `${selectedCase.id} closed cleanly`, 'success');
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
