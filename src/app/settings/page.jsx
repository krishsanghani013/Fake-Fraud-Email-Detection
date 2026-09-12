'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Sliders,
  KeyRound,
  Layers,
  CreditCard,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  RefreshCw,
  Brain,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Download,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Lead SOC Analyst & Forensic Lead');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Preferences state
  const [emailAlerts, setEmailAlerts] = useState({
    criticalFailures: true,
    highRiskDetected: true,
    weeklySummary: true,
    newThreatSignatures: false
  });
  const [riskAlertThreshold, setRiskAlertThreshold] = useState('HIGH');

  // API keys state
  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key_1',
      name: 'Production SIEM Stream',
      prefix: 'aegis_live_89f...b42c',
      fullKey: 'aegis_live_89f1a23c0487dfb42c98e100',
      created: 'Sep 02, 2026',
      lastUsed: '2 hours ago'
    },
    {
      id: 'key_2',
      name: 'SOC Automated Triage Worker',
      prefix: 'aegis_live_34d...77e9',
      fullKey: 'aegis_live_34d98a0021cbb77e91122ab3',
      created: 'Aug 18, 2026',
      lastUsed: 'Yesterday'
    }
  ]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);

  // Integrations state
  const [emailIntegrations, setEmailIntegrations] = useState({
    gmail: false,
    outlook: true
  });
  const [webhookUrl, setWebhookUrl] = useState('https://soc-gateway.internal.corp/v1/aegis-alerts');
  const [webhookSecret, setWebhookSecret] = useState('whsec_99182ab900cde...');
  const [showSecret, setShowSecret] = useState(false);

  // Gemini configuration
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.6-flash');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  // Privacy state
  const [retentionPeriod, setRetentionPeriod] = useState('30_days');
  const [zeroRetentionMode, setZeroRetentionMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('aegis_gemini_key') || '';
      const savedModel = localStorage.getItem('aegis_gemini_model') || 'gemini-3.6-flash';
      if (savedKey) setGeminiApiKey(savedKey);
      if (savedModel) setGeminiModel(savedModel);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      setDisplayName(user.fullName || user.firstName || 'Security Analyst');
    }
  }, [isLoaded, user]);

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: geminiApiKey.trim() || undefined,
          model: geminiModel.trim() || 'gemini-3.6-flash',
          timeoutMs: 30000,
          emailData: {
            metadata: { subject: 'Test Gemini Forensic Connection' },
            risk: { totalScore: 0, level: 'LOW', contributions: [] },
            authentication: {},
            senderIdentity: {},
            transmission: {},
            threatIntel: {}
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.aiAnalysis?.status === 'AVAILABLE') {
        const msg = `Connected to Google Gemini (${data.aiAnalysis.model || geminiModel}) successfully!`;
        setGeminiTestResult({ success: true, message: msg });
        toast('Gemini AI Connected', msg, 'success');
      } else {
        const err = data.aiAnalysis?.error || data.error || 'Connection failed. Check API key and quota.';
        setGeminiTestResult({ success: false, message: err });
        toast('Gemini Notice', err, 'error');
      }
    } catch (err) {
      setGeminiTestResult({ success: false, message: err.message || 'Network error testing Gemini API.' });
      toast('Gemini Error', err.message, 'error');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await fetch('/api/auth/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.synced) {
        toast('Database Synchronized', `Profile securely synced with Supabase (ID: ${data.profile.id.slice(0, 10)}...)`, 'success');
      } else {
        toast('Sync Notice', data.error || 'Supabase profile sync completed', 'info');
      }
    } catch (err) {
      toast('Sync Error', err.message || 'Network connection failed', 'error');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast('Copied', `${label} copied to clipboard`, 'success');
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast('Input Required', 'Please enter a name for the API key', 'error');
      return;
    }
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKeyString = `aegis_live_${rand}`;
    const newEntry = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `${newKeyString.slice(0, 14)}...${newKeyString.slice(-4)}`,
      fullKey: newKeyString,
      created: 'Just now',
      lastUsed: 'Never'
    };
    setApiKeys([newEntry, ...apiKeys]);
    setGeneratedKey(newKeyString);
    setNewKeyName('');
    toast('API Key Created', 'New API token generated successfully', 'success');
  };

  const handleRevokeKey = (id) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast('Key Revoked', 'API key has been permanently invalidated', 'info');
  };

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const exportPayload = {
        exportDate: new Date().toISOString(),
        user: {
          id: user?.id || 'usr_demo',
          email: user?.emailAddresses?.[0]?.emailAddress || 'analyst@aegis-sec.io',
          name: displayName
        },
        settings: {
          retentionPeriod,
          riskAlertThreshold,
          emailAlerts,
          geminiModel,
          theme
        }
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aegis-forensics-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Data Export Complete', 'Forensic settings and profile archive downloaded', 'success');
    } catch (err) {
      toast('Export Failed', err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      if (geminiApiKey) localStorage.setItem('aegis_gemini_key', geminiApiKey.trim());
      if (geminiModel) localStorage.setItem('aegis_gemini_model', geminiModel.trim());
    }
    toast('Settings Saved', 'All preferences and forensic configurations updated', 'success');
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences & Theme', icon: <Sliders className="w-4 h-4" /> },
    { id: 'api', label: 'API Keys', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations & AI', icon: <Layers className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Security', icon: <Lock className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-softWhite dark:bg-[#0F172A] text-deepSlate dark:text-softWhite flex transition-colors duration-200">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neutralGray dark:text-slate-400 uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5 text-accentBlue" /> Account & System Preferences
            </div>
            <h1 className="text-3xl font-bold font-heading tracking-tight text-deepSlate dark:text-softWhite">
              Settings
            </h1>
            <p className="text-sm text-neutralGray dark:text-slate-400">
              Configure analyst authentication, Gemini 3.6 explainable AI parameters, appearance theme, and API tokens.
            </p>
          </div>

          {/* Settings Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-[#1E293B] border border-borderSubtle dark:border-[#334155] rounded-xl shadow-elevation1 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-deepSlate dark:bg-accentBlue text-white shadow-sm'
                      : 'text-neutralGray dark:text-slate-400 hover:text-deepSlate dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Analyst Profile</CardTitle>
                      <p className="text-xs text-neutralGray dark:text-slate-400 mt-0.5">
                        Manage your display identity and account credentials synced with Supabase.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncSupabase}
                      disabled={isSyncingSupabase}
                      icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />}
                    >
                      {isSyncingSupabase ? 'Syncing...' : 'Sync with Supabase'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar upload & info */}
                  <div className="flex items-center gap-4 pb-6 border-b border-borderSubtle dark:border-[#334155]">
                    <div className="w-16 h-16 rounded-full bg-accentBlue/10 dark:bg-blue-950/60 border-2 border-accentBlue/20 flex items-center justify-center text-accentBlue dark:text-blue-400 font-bold text-xl uppercase overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0) || 'A'
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-deepSlate dark:text-softWhite">{displayName}</div>
                      <div className="text-xs text-neutralGray dark:text-slate-400">
                        {user?.emailAddresses?.[0]?.emailAddress || 'analyst@aegis-sec.io'}
                      </div>
                      <div className="pt-1 flex items-center gap-2">
                        <label className="cursor-pointer">
                          <span className="text-xs text-accentBlue dark:text-blue-400 hover:underline font-medium">Upload New Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const url = URL.createObjectURL(e.target.files[0]);
                                setAvatarPreview(url);
                                toast('Avatar Updated', 'Preview loaded successfully', 'info');
                              }
                            }}
                          />
                        </label>
                        {avatarPreview && (
                          <button
                            onClick={() => setAvatarPreview(null)}
                            className="text-xs text-neutralGray hover:text-riskHigh"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alex Rivera"
                      helperText="Visible on forensic inspection exports and analyst notes"
                    />
                    <Input
                      label="Email Address (Clerk Authentication)"
                      value={user?.emailAddresses?.[0]?.emailAddress || 'analyst@aegis-sec.io'}
                      readOnly
                      helperText="Managed via Clerk Single Sign-On"
                    />
                    <Input
                      label="SOC Role / Job Title"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="Senior Forensics Lead"
                    />
                    <Input
                      label="Clerk User ID"
                      value={user?.id || 'usr_offline_demo_soc'}
                      readOnly
                      helperText="Supabase primary key mapping"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button variant="primary" onClick={handleSavePreferences}>
                      Save Profile Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20">
                <CardHeader>
                  <CardTitle className="text-riskHigh flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Danger Zone
                  </CardTitle>
                  <p className="text-xs text-neutralGray dark:text-slate-400">
                    Irreversible actions affecting your analyst account and historical scan records.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Delete Account & Forensic Data</div>
                    <div className="text-xs text-neutralGray dark:text-slate-400 mt-0.5">
                      Permanently delete your profile, saved scans, and API access tokens.
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: PREFERENCES & THEME */}
          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance, Alerts & System Preferences</CardTitle>
                <p className="text-xs text-neutralGray dark:text-slate-400">
                  Switch between Light, Dark, or System mode, and tune forensic alert thresholds.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Theme Selector */}
                <div className="p-4 rounded-xl border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-deepSlate dark:text-softWhite flex items-center gap-2">
                      {resolvedTheme === 'dark' ? (
                        <Moon className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      Workspace Interface Theme
                    </div>
                    <div className="text-xs text-neutralGray dark:text-slate-400 mt-0.5">
                      Choose between Soft White minimal aesthetic, Deep Slate cyber forensics theme, or sync with your OS.
                    </div>
                    <div className="text-[11px] font-mono text-accentBlue dark:text-blue-400 mt-1">
                      Quick shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-borderSubtle dark:border-slate-700 shadow-xs">Ctrl+Shift+D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-borderSubtle dark:border-slate-700 shadow-xs">⌘+Shift+D</kbd>
                    </div>
                  </div>

                  <ThemeToggle variant="segmented" />
                </div>

                {/* Alert Threshold */}
                <div className="space-y-2 pb-6 border-b border-borderSubtle dark:border-[#334155]">
                  <label className="text-xs font-semibold text-deepSlate dark:text-softWhite">Minimum Alert Trigger Threshold</label>
                  <p className="text-xs text-neutralGray dark:text-slate-400">
                    Send automated alerts when an analyzed email reaches or exceeds this risk classification:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {[
                      { level: 'LOW', label: 'Low (25+)', color: 'border-riskLow bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' },
                      { level: 'MEDIUM', label: 'Medium (50+)', color: 'border-riskMedium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' },
                      { level: 'HIGH', label: 'High (75+)', color: 'border-riskHigh bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300' },
                      { level: 'CRITICAL', label: 'Critical (90+)', color: 'border-riskCritical bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300' }
                    ].map((item) => (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => setRiskAlertThreshold(item.level)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          riskAlertThreshold === item.level
                            ? `${item.color} font-semibold ring-2 ring-accentBlue/30 shadow-sm`
                            : 'border-borderSubtle dark:border-slate-700 bg-white dark:bg-slate-800 text-neutralGray dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.level}</div>
                        <div className="text-[11px] opacity-80">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Notification Toggles */}
                <div className="space-y-3 pb-6 border-b border-borderSubtle dark:border-[#334155]">
                  <label className="text-xs font-semibold text-deepSlate dark:text-softWhite">Email Notification Channels</label>
                  
                  <label className="flex items-center justify-between p-3 rounded-lg border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Critical DMARC / SPF Spoofing Failures</div>
                      <div className="text-[11px] text-neutralGray dark:text-slate-400">Immediate email trigger when severe sender impersonation is verified.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts.criticalFailures}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, criticalFailures: e.target.checked })}
                      className="w-4 h-4 rounded text-accentBlue focus:ring-accentBlue"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">High Risk Detection Alerts</div>
                      <div className="text-[11px] text-neutralGray dark:text-slate-400">Receive alerts when multiple risk contributors compound beyond threshold.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts.highRiskDetected}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, highRiskDetected: e.target.checked })}
                      className="w-4 h-4 rounded text-accentBlue focus:ring-accentBlue"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Weekly SOC Threat Digest</div>
                      <div className="text-[11px] text-neutralGray dark:text-slate-400">Aggregated summary of email volume, authentication breakdown, and top threats.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts.weeklySummary}
                      onChange={(e) => setEmailAlerts({ ...emailAlerts, weeklySummary: e.target.checked })}
                      className="w-4 h-4 rounded text-accentBlue focus:ring-accentBlue"
                    />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: API KEYS */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle>REST API Keys</CardTitle>
                      <p className="text-xs text-neutralGray dark:text-slate-400 mt-0.5">
                        Authenticate programmatic RFC 5322 parsing and threat scoring requests via Aegis REST endpoints.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setShowNewKeyModal(true);
                        setGeneratedKey(null);
                      }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Generate New Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-borderSubtle dark:border-[#334155] text-neutralGray dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Token Prefix</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3">Last Used</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderSubtle dark:divide-slate-800 font-mono">
                        {apiKeys.map((key) => (
                          <tr key={key.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-3 font-sans font-medium text-deepSlate dark:text-softWhite">{key.name}</td>
                            <td className="py-3 px-3 text-neutralGray dark:text-slate-400">{key.prefix}</td>
                            <td className="py-3 px-3 font-sans text-neutralGray dark:text-slate-400">{key.created}</td>
                            <td className="py-3 px-3 font-sans text-neutralGray dark:text-slate-400">{key.lastUsed}</td>
                            <td className="py-3 px-3 text-right space-x-2 font-sans">
                              <button
                                onClick={() => copyToClipboard(key.fullKey, 'API Key')}
                                className="p-1.5 text-neutralGray dark:text-slate-400 hover:text-accentBlue dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Copy Key"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevokeKey(key.id)}
                                className="p-1.5 text-neutralGray dark:text-slate-400 hover:text-riskHigh rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Revoke Key"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Alert
                    variant="info"
                    title="API Authentication Header Format"
                    className="mt-4"
                  >
                    Include your secret key in the request headers as: <code className="bg-blue-100/60 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono text-[11px]">Authorization: Bearer aegis_live_...</code>. Never expose this key in client-side bundles.
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: INTEGRATIONS & AI */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Google Gemini 3.6 Card */}
              <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/20">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-riskCritical/10 dark:bg-purple-950/60 border border-riskCritical/20 flex items-center justify-center text-riskCritical dark:text-purple-400">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Google Gemini Explainable AI Engine
                          <Badge variant="critical">
                            {geminiModel.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs text-neutralGray dark:text-slate-400">
                          Powers Phase 8 evidence-grounded fraud narratives and human-readable forensic explanations.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTestGemini}
                      disabled={isTestingGemini}
                      icon={isTestingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    >
                      {isTestingGemini ? 'Testing Connection...' : 'Test Gemini Connection'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {geminiTestResult && (
                    <div
                      className={`p-3.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                        geminiTestResult.success
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {geminiTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="leading-relaxed">{geminiTestResult.message}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-deepSlate dark:text-softWhite">Gemini Model Identifier</label>
                      <input
                        type="text"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        placeholder="gemini-3.6-flash"
                        className="w-full bg-white dark:bg-[#0F172A] border border-borderSubtle dark:border-[#334155] rounded-lg p-2.5 font-mono text-xs text-deepSlate dark:text-softWhite focus:outline-none focus:border-accentBlue"
                      />
                      <p className="text-[11px] text-neutralGray dark:text-slate-400">
                        Default: <code>gemini-3.6-flash</code> (also supports <code>gemini-2.0-flash</code>, <code>gemini-1.5-flash</code>).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-deepSlate dark:text-softWhite">Google Gemini API Key</label>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy... or leave blank for .env.local"
                        className="w-full bg-white dark:bg-[#0F172A] border border-borderSubtle dark:border-[#334155] rounded-lg p-2.5 font-mono text-xs text-deepSlate dark:text-softWhite focus:outline-none focus:border-accentBlue"
                      />
                      <p className="text-[11px] text-neutralGray dark:text-slate-400">
                        Leave blank to inherit from <code>GEMINI_API_KEY</code> in your environment file.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Provider Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Client & SIEM Integrations</CardTitle>
                  <p className="text-xs text-neutralGray dark:text-slate-400">
                    Connect enterprise mailboxes for automated inbox quarantine and webhook ingestion.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm">
                          M
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Google Workspace / Gmail</div>
                          <div className="text-[11px] text-neutralGray dark:text-slate-400">Real-time add-on analysis</div>
                        </div>
                      </div>
                      <Button
                        variant={emailIntegrations.gmail ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                          setEmailIntegrations({ ...emailIntegrations, gmail: !emailIntegrations.gmail });
                          toast(
                            emailIntegrations.gmail ? 'Gmail Disconnected' : 'Gmail Connected',
                            emailIntegrations.gmail ? 'Inbox stream disconnected' : 'Authorized via OAuth 2.0',
                            'info'
                          );
                        }}
                      >
                        {emailIntegrations.gmail ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                          O
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Microsoft 365 / Outlook</div>
                          <div className="text-[11px] text-neutralGray dark:text-slate-400">Graph API mailbox webhook</div>
                        </div>
                      </div>
                      <Button
                        variant={emailIntegrations.outlook ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                          setEmailIntegrations({ ...emailIntegrations, outlook: !emailIntegrations.outlook });
                          toast(
                            emailIntegrations.outlook ? 'Outlook Disconnected' : 'Outlook Connected',
                            emailIntegrations.outlook ? 'Graph stream disconnected' : 'Authorized via Graph API',
                            'info'
                          );
                        }}
                      >
                        {emailIntegrations.outlook ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>

                  {/* Webhook Endpoint */}
                  <div className="pt-4 border-t border-borderSubtle dark:border-[#334155] space-y-3">
                    <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">SIEM Webhook Notifications</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Webhook Endpoint URL"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <div>
                        <label className="block text-xs font-semibold text-deepSlate dark:text-softWhite mb-1.5">Webhook Signing Secret</label>
                        <div className="flex items-center gap-2">
                          <input
                            type={showSecret ? 'text' : 'password'}
                            value={webhookSecret}
                            readOnly
                            className="flex-1 bg-white dark:bg-[#0F172A] border border-borderSubtle dark:border-[#334155] rounded-lg p-2.5 font-mono text-xs text-deepSlate dark:text-softWhite focus:outline-none"
                          />
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="p-2.5 rounded-lg border border-borderSubtle dark:border-[#334155] text-neutralGray dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(webhookSecret, 'Webhook Secret')}
                            className="p-2.5 rounded-lg border border-borderSubtle dark:border-[#334155] text-neutralGray dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button variant="primary" onClick={handleSavePreferences}>
                      Save Integrations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 5: BILLING */}
          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subscription & Quota</CardTitle>
                    <p className="text-xs text-neutralGray dark:text-slate-400 mt-0.5">
                      Manage enterprise seat licenses, analysis volume, and payment method.
                    </p>
                  </div>
                  <Badge variant="low">Active Plan</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-accentBlue dark:text-blue-400">CURRENT TIER</div>
                    <div className="text-xl font-bold text-deepSlate dark:text-softWhite">Enterprise Aegis Forensic Tier</div>
                    <div className="text-xs text-neutralGray dark:text-slate-400 mt-1">
                      Includes unlimited RFC 5322 parsing, Gemini 3.6 explainability, and Supabase cloud persistence.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-deepSlate dark:text-softWhite">$149<span className="text-xs font-normal text-neutralGray dark:text-slate-400"> / mo</span></div>
                    <div className="text-[11px] text-neutralGray dark:text-slate-400">Renews October 01, 2026</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-neutralGray dark:text-slate-400">Monthly Scan Volume</span>
                    <span className="text-deepSlate dark:text-softWhite font-semibold">1,842 / 10,000 emails</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-accentBlue rounded-full" style={{ width: '18.4%' }} />
                  </div>
                </div>

                <div className="pt-4 border-t border-borderSubtle dark:border-[#334155] flex items-center justify-between">
                  <span className="text-xs text-neutralGray dark:text-slate-400">Mastercard ending in <strong>9821</strong></span>
                  <div className="space-x-2">
                    <Button variant="secondary" size="sm">Update Payment Method</Button>
                    <Button variant="secondary" size="sm">Download Invoices</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: PRIVACY & SECURITY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention & Compliance</CardTitle>
                  <p className="text-xs text-neutralGray dark:text-slate-400">
                    Control how long email headers, MIME payloads, and forensic verdicts are retained.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-deepSlate dark:text-softWhite">Retention Window</label>
                    <select
                      value={retentionPeriod}
                      onChange={(e) => setRetentionPeriod(e.target.value)}
                      className="w-full sm:w-80 bg-white dark:bg-[#0F172A] border border-borderSubtle dark:border-[#334155] rounded-lg p-2.5 text-xs text-deepSlate dark:text-softWhite focus:outline-none focus:border-accentBlue"
                    >
                      <option value="7_days">7 Days (Strict Minimal Compliance)</option>
                      <option value="30_days">30 Days (Standard SOC Retrospective)</option>
                      <option value="90_days">90 Days (Enterprise Audit Trail)</option>
                      <option value="365_days">1 Year (Regulatory Archival)</option>
                    </select>
                    <p className="text-[11px] text-neutralGray dark:text-slate-400">
                      Past the retention duration, raw email payloads and extracted header traces are automatically purged.
                    </p>
                  </div>

                  <label className="flex items-center justify-between p-3.5 rounded-lg border border-borderSubtle dark:border-[#334155] bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Zero-Retention Mode (Stateless Inspection)</div>
                      <div className="text-[11px] text-neutralGray dark:text-slate-400">
                        When enabled, no email headers or bodies are stored in Supabase; analysis results exist in memory only.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={zeroRetentionMode}
                      onChange={(e) => setZeroRetentionMode(e.target.checked)}
                      className="w-4 h-4 rounded text-accentBlue focus:ring-accentBlue"
                    />
                  </label>

                  {/* Export Data Button */}
                  <div className="pt-4 border-t border-borderSubtle dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-deepSlate dark:text-softWhite">Export My Forensic Data</div>
                      <div className="text-[11px] text-neutralGray dark:text-slate-400">
                        Download a machine-readable JSON archive of your profile, rules, and configuration.
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleExportData}
                      disabled={isExporting}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      {isExporting ? 'Exporting...' : 'Export JSON Data'}
                    </Button>
                  </div>

                  {/* Legal Links */}
                  <div className="pt-4 border-t border-borderSubtle dark:border-[#334155] flex items-center gap-6 text-xs text-neutralGray dark:text-slate-400">
                    <a href="#" className="hover:text-accentBlue hover:underline flex items-center gap-1">
                      <span>Privacy Policy</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="#" className="hover:text-accentBlue hover:underline flex items-center gap-1">
                      <span>Terms of Service</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a href="#" className="hover:text-accentBlue hover:underline flex items-center gap-1">
                      <span>SOC 2 Type II Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Generate API Key Modal */}
      <Modal
        isOpen={showNewKeyModal}
        onClose={() => setShowNewKeyModal(false)}
        title="Generate New API Key"
        footer={
          generatedKey ? (
            <Button variant="primary" onClick={() => setShowNewKeyModal(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowNewKeyModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGenerateKey}>
                Generate Token
              </Button>
            </>
          )
        }
      >
        {generatedKey ? (
          <div className="space-y-4">
            <Alert variant="warning" title="Save Your Secret Key">
              This token will only be displayed once. Store it in your secret manager immediately.
            </Alert>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-deepSlate dark:text-softWhite">Live Secret Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedKey}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-borderSubtle dark:border-slate-700 rounded-lg p-2.5 font-mono text-xs text-deepSlate dark:text-softWhite"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(generatedKey, 'New Key')}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Key Identifier / Friendly Name"
              placeholder="e.g. Splunk Ingestion Daemon"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              helperText="Describe where or what application will use this credential"
            />
          </div>
        )}
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isDeletingAccount}
              onClick={() => {
                setIsDeletingAccount(true);
                setTimeout(() => {
                  setIsDeletingAccount(false);
                  setShowDeleteModal(false);
                  toast('Notice', 'Account deletion request queued for SOC administrator approval.', 'info');
                }, 1000);
              }}
            >
              {isDeletingAccount ? 'Deleting...' : 'Permanently Delete Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Alert variant="error" title="Warning: This action cannot be undone">
            Deleting your account will immediately revoke all active API keys, purge personal forensic inspection notes, and remove your authorization from the Aegis SOC instance.
          </Alert>
          <p className="text-xs text-neutralGray dark:text-slate-400">
            Please confirm that you want to delete your analyst account.
          </p>
        </div>
      </Modal>
    </div>
  );
}
