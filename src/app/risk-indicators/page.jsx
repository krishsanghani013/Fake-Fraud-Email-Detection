'use client';

import React from 'react';
import {
  UserX,
  ShieldAlert,
  KeyRound,
  ShieldOff,
  CalendarX,
  EyeOff,
  Link2Off,
  FileWarning,
  Brain,
  Clock,
  ListX,
  UserCheck,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SAMPLE_SCANS } from '../../data/mockData';

export default function RiskIndicatorsPage() {
  const scan = SAMPLE_SCANS['ceo-wire-fraud'];
  const indicators = scan.riskIndicators;

  const iconMap = {
    UserX: <UserX className="w-5 h-5 text-dangerRed" />,
    ShieldAlert: <ShieldAlert className="w-5 h-5 text-dangerRed" />,
    KeyRound: <KeyRound className="w-5 h-5 text-warningAmber" />,
    ShieldOff: <ShieldOff className="w-5 h-5 text-dangerRed" />,
    CalendarX: <CalendarX className="w-5 h-5 text-dangerRed" />,
    EyeOff: <EyeOff className="w-5 h-5 text-warningAmber" />,
    Link2Off: <Link2Off className="w-5 h-5 text-dangerRed" />,
    FileWarning: <FileWarning className="w-5 h-5 text-dangerRed" />,
    Brain: <Brain className="w-5 h-5 text-purpleAccent" />,
    Clock: <Clock className="w-5 h-5 text-warningAmber" />,
    ListX: <ListX className="w-5 h-5 text-dangerRed" />,
    UserCheck: <UserCheck className="w-5 h-5 text-dangerRed" />,
    FileText: <FileText className="w-5 h-5 text-cyanAccent" />,
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyanAccent uppercase tracking-wider">
              <Sliders className="w-4 h-4" /> Comprehensive Cyber Assessment
            </div>
            <h1 className="text-3xl font-bold font-heading">
              13 Visual AI Threat Risk Indicators
            </h1>
            <p className="text-xs text-textSecondary">
              Granular breakdown of every security vector evaluated by the Aegis AI Threat Engine for Scan ID: <strong className="text-textPrimary">{scan.id}</strong>
            </p>
          </div>

          {/* 13 Risk Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((item) => (
              <Card
                key={item.id}
                hoverEffect
                glowColor={item.status === 'FAIL' ? 'red' : item.status === 'WARN' ? 'purple' : 'cyan'}
                className="flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-surfaceSecondary border border-borderSubtle">
                        {iconMap[item.iconName] || <Sliders className="w-5 h-5 text-primaryBlue" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-textPrimary">{item.name}</h3>
                        <span className="text-[10px] text-textSecondary font-mono">{item.category}</span>
                      </div>
                    </div>

                    <Badge level={item.status} size="sm">
                      {item.status}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-textSecondary">Vector Risk Level</span>
                      <span className={`font-bold ${item.score > 70 ? 'text-dangerRed' : item.score > 40 ? 'text-warningAmber' : 'text-successGreen'}`}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surfaceSecondary overflow-hidden border border-borderSubtle">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.score > 70 ? 'bg-dangerRed shadow-glowRed' : item.score > 40 ? 'bg-warningAmber' : 'bg-successGreen'
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="p-3 rounded-xl bg-surfaceSecondary border border-borderSubtle text-xs text-textSecondary leading-relaxed">
                    <strong className="text-textPrimary font-semibold">AI Analysis:</strong> {item.explanation}
                  </div>
                </div>

                {/* SOC Recommendation */}
                <div className="mt-4 pt-3 border-t border-borderSubtle text-xs text-primaryBlue font-medium flex items-center justify-between">
                  <span>Recommendation: <strong>{item.recommendation}</strong></span>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
