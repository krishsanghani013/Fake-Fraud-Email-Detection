'use client';

import React from 'react';
import {
  GitCommit,
  Mail,
  FileCode,
  ShieldCheck,
  Globe,
  FileWarning,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function InvestigationTimelinePage() {
  const timelineSteps = [
    {
      id: 1,
      title: 'Email Received at Gateway',
      time: '08:45:10 UTC',
      status: 'INFO',
      icon: <Mail className="w-4 h-4 text-primaryBlue" />,
      details: 'Inbound message from relay.mx-server.net (185.220.101.44) directed to recipient finance-lead@corp-internal.com.',
    },
    {
      id: 2,
      title: 'Header Extraction & Routing Hops Parsed',
      time: '08:45:11 UTC',
      status: 'INFO',
      icon: <FileCode className="w-4 h-4 text-cyanAccent" />,
      details: '2 network hops identified. Envelope From domain (sec-apple-verify.com) extracted.',
    },
    {
      id: 3,
      title: 'Cryptographic Auth Failure (SPF/DKIM/DMARC)',
      time: '08:45:11 UTC',
      status: 'FAIL',
      icon: <ShieldCheck className="w-4 h-4 text-dangerRed" />,
      details: 'SPF FAIL: IP 185.220.101.44 not listed. DKIM signature hash failed. DMARC policy triggered quarantine.',
    },
    {
      id: 4,
      title: 'URL Typosquatting & Threat Intel Query',
      time: '08:45:12 UTC',
      status: 'FAIL',
      icon: <Globe className="w-4 h-4 text-dangerRed" />,
      details: '2 malicious links detected. Domain sec-apple-verify.com registered 3 days ago. 18 VirusTotal detections.',
    },
    {
      id: 5,
      title: 'Attachment Macro Sandbox Execution',
      time: '08:45:12 UTC',
      status: 'FAIL',
      icon: <FileWarning className="w-4 h-4 text-purpleAccent" />,
      details: 'Acquisition_Agreement_CONFIDENTIAL.docm executed in sandbox. Obfuscated PowerShell downloader script captured.',
    },
    {
      id: 6,
      title: 'LLM Neural Phishing & BEC Verdict',
      time: '08:45:12 UTC',
      status: 'CRITICAL',
      icon: <Brain className="w-4 h-4 text-purpleAccent" />,
      details: '99.2% confidence Executive Impersonation (Tim Cook wire transfer demand of $480,000 USD).',
    },
    {
      id: 7,
      title: 'Quarantined & Case Assigned to Analyst',
      time: '08:47:00 UTC',
      status: 'PASS',
      icon: <UserCheck className="w-4 h-4 text-successGreen" />,
      details: 'Message isolated from user inbox. Incident Case CASE-2026-901 auto-generated and assigned to Alex Rivera.',
    },
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-purpleAccent uppercase tracking-wider">
              <GitCommit className="w-4 h-4" /> Forensics Lifecycle Audit
            </div>
            <h1 className="text-3xl font-bold font-heading">
              Incident Investigation Timeline
            </h1>
            <p className="text-xs text-textSecondary">
              Step-by-step sequence tracking email reception, automated AI detection pipeline, and analyst mitigation.
            </p>
          </div>

          {/* Timeline Stack */}
          <Card className="p-8">
            <div className="relative border-l-2 border-borderSubtle ml-4 pl-6 space-y-8">
              {timelineSteps.map((step) => (
                <div key={step.id} className="relative group">
                  {/* Circle Node Marker */}
                  <div className="absolute -left-[35px] top-0.5 w-8 h-8 rounded-full bg-surfaceSecondary border border-borderSubtle flex items-center justify-center shadow-md group-hover:border-primaryBlue transition-colors">
                    {step.icon}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 rounded-2xl bg-surfaceSecondary/70 border border-borderSubtle space-y-2 group-hover:border-primaryBlue/40 transition-all">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                        {step.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-textSecondary flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyanAccent" /> {step.time}
                        </span>
                        <Badge level={step.status} size="sm">
                          {step.status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-textSecondary leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
