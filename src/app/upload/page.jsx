'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  FileCode,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  File,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SAMPLE_SCANS } from '../../data/mockData';
import { useToast } from '../../components/ui/Toast';

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('raw');
  const [rawText, setRawText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` });
      toast('File Uploaded', `${file.name} ready for AI parsing`, 'success');
    }
  };

  const handleStartScan = () => {
    toast('Starting AI Scanning Pipeline', 'Executing 9-stage analysis...', 'info');
    router.push('/scanning');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-purpleAccent uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Neural Analysis Workbench
            </div>
            <h1 className="text-3xl font-bold font-heading">
              Analyze Email & Detect Fraud
            </h1>
            <p className="text-xs text-textSecondary">
              Upload raw email content or .eml files to trigger real-time cryptographic and LLM inspection.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'raw'
                  ? 'bg-primaryBlue text-white shadow-glowBlue'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <FileCode className="w-4 h-4" /> Upload Email
            </button>
            <button
              onClick={() => setActiveTab('drag')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'drag'
                  ? 'bg-primaryBlue text-white shadow-glowBlue'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Upload .eml File
            </button>
          </div>

          {/* Main Upload Box */}
          <Card className="p-8">
            {activeTab === 'raw' && (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-textSecondary">
                  Paste Complete Raw Email Source (Including Headers & Body)
                </label>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Delivered-To: victim@company.com&#10;Received: from mail.attacker.com...&#10;From: CEO <spoofed@domain.com>&#10;Subject: Urgent wire transfer..."
                  className="w-full bg-surfaceSecondary border border-borderSubtle rounded-2xl p-4 text-xs font-mono text-textPrimary placeholder:text-textSecondary/40 focus:outline-none focus:border-primaryBlue transition-colors leading-relaxed"
                />
              </div>
            )}

            {activeTab === 'drag' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-borderSubtle hover:border-primaryBlue/50 rounded-2xl p-12 text-center transition-all cursor-pointer bg-surfaceSecondary/40 group"
              >
                <div className="w-16 h-16 rounded-full bg-primaryBlue/10 text-primaryBlue flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-glowBlue">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">
                  Drag & Drop .eml file here
                </h3>
                <p className="text-xs text-textSecondary mt-1">
                  Supports <strong className="text-textPrimary">.EML</strong> or <strong className="text-textPrimary">.MSG</strong> files up to 50MB
                </p>

                <div className="mt-6 inline-flex items-center gap-3">
                  <label className="px-5 py-2.5 rounded-xl bg-surfaceSecondary border border-borderSubtle text-textPrimary text-xs font-semibold hover:border-white/20 transition-all cursor-pointer">
                    Browse Local .eml File
                    <input
                      type="file"
                      accept=".eml,.msg,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setUploadedFile({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Uploaded File Selected Bar */}
            {uploadedFile && (
              <div className="mt-6 p-4 rounded-2xl bg-surfaceSecondary border border-primaryBlue/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-primaryBlue" />
                  <div>
                    <div className="text-xs font-bold text-textPrimary">{uploadedFile.name}</div>
                    <div className="text-[11px] text-textSecondary font-mono">{uploadedFile.size} • Ready for analysis</div>
                  </div>
                </div>
                <button onClick={() => setUploadedFile(null)} className="text-textSecondary hover:text-dangerRed">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-borderSubtle flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-textSecondary font-mono">
                <ShieldCheck className="w-4 h-4 text-successGreen" />
                <span>Zero-Retention Cryptographic Sandbox</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleStartScan}
                icon={<Zap className="w-4 h-4" />}
              >
                Execute 9-Stage AI Scan <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
