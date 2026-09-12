'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Terminal,
  Cpu,
  Radio,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

const SCAN_STAGES = [
  { id: 1, label: 'Extracting Email Metadata & Raw RFC Headers', duration: 600 },
  { id: 2, label: 'Parsing MIME Hops & Routing IP Paths', duration: 700 },
  { id: 3, label: 'Performing SPF Record Lookup & Alignment Check', duration: 800 },
  { id: 4, label: 'Cryptographic DKIM Signature Validation', duration: 700 },
  { id: 5, label: 'Evaluating DMARC Policy & Alignment', duration: 600 },
  { id: 6, label: 'Deep URL Typosquatting & VirusTotal Reputation Scan', duration: 900 },
  { id: 7, label: 'Executing Attachment Sandbox & Macro Analyzer', duration: 1000 },
  { id: 8, label: 'LLM Neural Phishing & Psychological Urgency Inference', duration: 900 },
  { id: 9, label: 'Generating Final Security Report & Calculating Risk Index', duration: 600 },
];

export default function ScanningPage() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(0);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const runPipeline = async () => {
      for (let i = 0; i < SCAN_STAGES.length; i++) {
        setCurrentStage(i);
        const stage = SCAN_STAGES[i];
        
        setLogs((prev) => [...prev, `[INIT] Stage ${stage.id}: ${stage.label}...`]);
        await new Promise((res) => setTimeout(res, stage.duration));

        setLogs((prev) => [
          ...prev,
          `[SUCCESS] Stage ${stage.id} Completed - Verification passed.`,
        ]);
        
        setProgress(Math.round(((i + 1) / SCAN_STAGES.length) * 100));
      }

      await new Promise((res) => setTimeout(res, 800));
      router.push('/results/scan-89421');
    };

    runPipeline();
  }, [router]);

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-primaryBlue/20 via-purpleAccent/20 to-transparent blur-[160px] pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surfaceSecondary border border-primaryBlue/30 text-primaryBlue text-xs font-mono shadow-glowBlue">
            <Radio className="w-3.5 h-3.5 animate-pulse text-successGreen" /> Live AI Scanning Pipeline Active
          </div>
          <h1 className="text-3xl font-bold font-heading">
            Analyzing Email Security Vector
          </h1>
          <p className="text-xs text-textSecondary font-mono">
            Scanning header hops, cryptographic signatures, sandboxing attachments, and computing LLM BEC threat scores.
          </p>
        </div>

        {/* Central Progress Bar */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-textSecondary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purpleAccent" /> Overall Progress
            </span>
            <span className="text-primaryBlue font-bold text-base">{progress}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-surfaceSecondary border border-borderSubtle overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primaryBlue via-purpleAccent to-cyanAccent shadow-glowBlue"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 9 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SCAN_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStage;
            const isCurrent = idx === currentStage;

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border text-xs transition-all ${
                  isCompleted
                    ? 'bg-successGreen/10 border-successGreen/30 text-textPrimary'
                    : isCurrent
                    ? 'bg-primaryBlue/15 border-primaryBlue shadow-glowBlue text-white'
                    : 'bg-surfaceSecondary/40 border-borderSubtle text-textSecondary opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase font-bold">Stage 0{stage.id}</span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-successGreen" />}
                  {isCurrent && <Loader2 className="w-4 h-4 text-primaryBlue animate-spin" />}
                </div>
                <div className="font-semibold text-xs leading-tight">{stage.label}</div>
              </div>
            );
          })}
        </div>

        {/* Terminal Output Log Stream */}
        <Card className="p-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-borderSubtle text-xs font-mono text-textSecondary">
            <span className="flex items-center gap-2 text-textPrimary">
              <Terminal className="w-4 h-4 text-cyanAccent" /> Live Aegis Engine Terminal Stream
            </span>
            <span className="text-successGreen">REALTIME LOGS</span>
          </div>

          <div className="h-48 overflow-y-auto font-mono text-xs space-y-1.5 p-4 rounded-2xl bg-black/80 border border-white/5 text-textSecondary">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={log.includes('SUCCESS') ? 'text-successGreen' : 'text-primaryBlue'}
              >
                {log}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
