'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Globe,
  PieChart as PieIcon,
  Filter,
  Download,
  ShieldAlert,
  Brain
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { THREAT_TRENDS } from '../../data/mockData';

export default function AnalyticsPage() {
  const categoryData = [
    { name: 'BEC Wire Fraud', value: 42, color: '#7C5CFC' },
    { name: 'Typosquat Phishing', value: 28, color: '#5B8CFF' },
    { name: 'Invoice Callback', value: 18, color: '#EF4444' },
    { name: 'Malware Macro Drop', value: 12, color: '#14B8A6' },
  ];

  const authData = [
    { name: 'SPF/DKIM Passed', value: 74, color: '#22C55E' },
    { name: 'SPF Failed', value: 14, color: '#EF4444' },
    { name: 'DKIM Failed', value: 8, color: '#F59E0B' },
    { name: 'DMARC Failed', value: 4, color: '#7C5CFC' },
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-successGreen uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" /> Real-time Security Intelligence
              </div>
              <h1 className="text-3xl font-bold font-heading">
                Threat Trends & Detection Analytics
              </h1>
              <p className="text-xs text-textSecondary">
                Historical detection patterns, attack category distribution, and top target domain metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-xl bg-surfaceSecondary border border-borderSubtle text-textSecondary text-xs font-medium flex items-center gap-2">
                <Filter className="w-4 h-4 text-primaryBlue" /> Last 7 Days
              </button>
              <button className="px-4 py-2 rounded-xl bg-primaryBlue text-white text-xs font-semibold shadow-glowBlue flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV Metrics
              </button>
            </div>
          </div>

          {/* Chart 1: 7-Day Threat Trend Volume (Area Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="w-5 h-5 text-primaryBlue" /> 7-Day Scan & Threat Detection Trend
              </CardTitle>
              <span className="text-xs font-mono text-textSecondary">2,890 total emails scanned</span>
            </CardHeader>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={THREAT_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B8CFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#5B8CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPhish" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#111216', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="totalScans" stroke="#5B8CFF" fillOpacity={1} fill="url(#colorTotal)" name="Total Scans" />
                  <Area type="monotone" dataKey="phishingCount" stroke="#EF4444" fillOpacity={1} fill="url(#colorPhish)" name="Phishing Intercepted" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grid 2: Distribution Pie & Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Category Bar Chart (7 cols) */}
            <div className="lg:col-span-7">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <ShieldAlert className="w-5 h-5 text-purpleAccent" /> Attack Category Distribution (%)
                  </CardTitle>
                </CardHeader>

                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={130} />
                      <Tooltip contentStyle={{ backgroundColor: '#111216', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Right: Auth Pass/Fail Pie Chart (5 cols) */}
            <div className="lg:col-span-5">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <PieIcon className="w-5 h-5 text-cyanAccent" /> Protocol Pass / Fail Ratio
                  </CardTitle>
                </CardHeader>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={authData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {authData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111216', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
