'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileJson,
  FileText,
  CheckCircle2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function ReportsPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('Acme Enterprise Security SOC');

  const history = [
    { id: 'REP-2026-09', name: 'September SOC Audit & BEC Threat Overview', format: 'PDF', date: '2026-09-12', size: '2.4 MB' },
    { id: 'REP-2026-08', name: 'August Email Authentication (SPF/DKIM/DMARC)', format: 'CSV', date: '2026-09-01', size: '890 KB' },
    { id: 'REP-2026-07', name: 'Q3 Incident Response & Mitigation Logs', format: 'JSON', date: '2026-08-15', size: '4.1 MB' },
  ];

  const handleGenerate = (format) => {
    toast(`Report Engine Triggered`, `Generating ${format} document for ${companyName}...`, 'success');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-purpleAccent uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" /> Compliance & Audit Reports
            </div>
            <h1 className="text-3xl font-bold font-heading">
              SOC Security Report Engine
            </h1>
            <p className="text-xs text-textSecondary">
              Export high-precision PDF, CSV, and JSON audit documents with customized enterprise branding.
            </p>
          </div>

          {/* Quick Generator Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect glowColor="blue" className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-primaryBlue/10 text-primaryBlue w-fit">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Executive PDF Report</h3>
                <p className="text-xs text-textSecondary leading-relaxed">
                  High-resolution executive PDF with circular risk score charts, highlighted text annotations, and SOC recommendations.
                </p>
              </div>
              <Button onClick={() => handleGenerate('PDF')} variant="primary" className="mt-6 w-full" icon={<Download className="w-4 h-4" />}>
                Generate PDF
              </Button>
            </Card>

            <Card hoverEffect glowColor="purple" className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-purpleAccent/10 text-purpleAccent w-fit">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Threat Metric CSV Dataset</h3>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Raw CSV export containing SPF/DKIM/DMARC headers, IP hops, WHOIS data, and VirusTotal detection counts.
                </p>
              </div>
              <Button onClick={() => handleGenerate('CSV')} variant="secondary" className="mt-6 w-full" icon={<Download className="w-4 h-4" />}>
                Export CSV Data
              </Button>
            </Card>

            <Card hoverEffect glowColor="cyan" className="p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-cyanAccent/10 text-cyanAccent w-fit">
                  <FileJson className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Full SIEM JSON Dump</h3>
                <p className="text-xs text-textSecondary leading-relaxed">
                  Standardized JSON payload formatted for Splunk, Datadog, Microsoft Sentinel, or Elastic SIEM ingestion.
                </p>
              </div>
              <Button onClick={() => handleGenerate('JSON')} variant="outline" className="mt-6 w-full" icon={<Download className="w-4 h-4" />}>
                Download SIEM JSON
              </Button>
            </Card>
          </div>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports Archive</CardTitle>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-borderSubtle text-[11px] font-mono text-textSecondary uppercase">
                    <th className="pb-3 font-medium">Report ID & Title</th>
                    <th className="pb-3 font-medium">Format</th>
                    <th className="pb-3 font-medium">Date Generated</th>
                    <th className="pb-3 font-medium">File Size</th>
                    <th className="pb-3 font-medium text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle/50 text-xs">
                  {history.map((rep) => (
                    <tr key={rep.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 font-bold text-textPrimary">{rep.name} <span className="font-mono text-[11px] text-textSecondary">({rep.id})</span></td>
                      <td className="py-4"><span className="px-2.5 py-1 rounded-full bg-primaryBlue/20 text-primaryBlue font-mono text-[10px] font-bold">{rep.format}</span></td>
                      <td className="py-4 font-mono text-textSecondary">{rep.date}</td>
                      <td className="py-4 font-mono text-textSecondary">{rep.size}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => toast('Downloading Report', rep.name, 'success')} className="px-3 py-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textPrimary text-xs font-semibold ml-auto flex items-center gap-1">
                          <Download className="w-3.5 h-3.5 text-primaryBlue" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
