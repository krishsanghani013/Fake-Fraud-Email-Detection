'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { MOCK_NOTIFICATIONS } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [list, setList] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('ALL');

  const filtered = list.filter((n) => filter === 'ALL' || n.severity === filter);

  const markAllRead = () => {
    setList((prev) => prev.map((item) => ({ ...item, read: true })));
    toast('All Notifications Read', 'Alert feed updated', 'success');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-primaryBlue uppercase tracking-wider">
                <Bell className="w-4 h-4" /> Live Threat Activity Stream
              </div>
              <h1 className="text-3xl font-bold font-heading">
                Real-Time Security Notifications
              </h1>
              <p className="text-xs text-textSecondary">
                Instant alert log capturing high-priority BEC threats, model updates, and SOC policy triggers.
              </p>
            </div>

            <button
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-textPrimary text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
            >
              <Check className="w-4 h-4 text-successGreen" /> Mark All as Read
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all ${
                  filter === f ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className={`p-6 transition-all ${!item.read ? 'border-primaryBlue/40 bg-surfaceSecondary/90' : 'opacity-80'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      item.severity === 'CRITICAL' ? 'bg-dangerRed/10 text-dangerRed' : item.severity === 'WARNING' ? 'bg-warningAmber/10 text-warningAmber' : 'bg-primaryBlue/10 text-primaryBlue'
                    }`}>
                      {item.severity === 'CRITICAL' && <AlertTriangle className="w-5 h-5" />}
                      {item.severity === 'WARNING' && <AlertTriangle className="w-5 h-5" />}
                      {item.severity === 'INFO' && <Info className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-textPrimary">{item.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          item.severity === 'CRITICAL' ? 'bg-dangerRed/20 text-dangerRed' : 'bg-warningAmber/20 text-warningAmber'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-textSecondary leading-relaxed">{item.description}</p>
                      <div className="text-[11px] font-mono text-textSecondary pt-1">{item.timestamp}</div>
                    </div>
                  </div>

                  {item.scanId && (
                    <Link href={`/results/${item.scanId}`}>
                      <button className="px-3 py-1.5 rounded-lg bg-surfaceSecondary border border-borderSubtle hover:border-primaryBlue/40 text-textPrimary text-xs font-semibold flex items-center gap-1 shrink-0">
                        Inspect Threat <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
