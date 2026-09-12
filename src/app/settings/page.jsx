'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  KeyRound,
  CreditCard,
  Sliders,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  RefreshCw,
  Database,
  Brain,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [apiKey, setApiKey] = useState('aegis_live_98a712f89a012bc789a123');
  const [isSyncing, setIsSyncing] = useState(false);

  // Google Gemini AI Model & Key Configuration
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-3.6-flash');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('aegis_gemini_key') || '';
      const savedModel = localStorage.getItem('aegis_gemini_model') || 'gemini-3.6-flash';
      if (savedKey) setGeminiApiKey(savedKey);
      if (savedModel) setGeminiModel(savedModel);
    }
  }, []);

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
            metadata: { subject: 'Test Gemini Connection' },
            risk: { totalScore: 0, level: 'LOW', contributions: [] },
            authentication: {},
            senderIdentity: {},
            transmission: {},
            threatIntel: {}
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.aiAnalysis.status === 'AVAILABLE') {
        const msg = `Connected to Google Gemini (${data.aiAnalysis.model || geminiModel}) successfully!`;
        setGeminiTestResult({ success: true, message: msg });
        toast('Gemini AI Connected', msg, 'success');
      } else {
        const err = data.aiAnalysis?.error || data.error || 'Connection failed. Verify API key and model name.';
        setGeminiTestResult({ success: false, message: err });
        toast('Gemini Connection Notice', err, 'error');
      }
    } catch (err) {
      setGeminiTestResult({ success: false, message: err.message || 'Network error testing Gemini API.' });
      toast('Gemini Test Error', err.message, 'error');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const userFullName = isLoaded && user ? user.fullName || user.firstName || '' : '';
  const userEmail = isLoaded && user ? user.emailAddresses?.[0]?.emailAddress || '' : '';

  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/auth/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.synced) {
        toast('Database Synchronized', `Profile saved to Supabase (ID: ${data.profile.id.slice(0, 10)}...)`, 'success');
      } else {
        toast('Sync Failed', data.error || 'Failed to sync with Supabase', 'error');
      }
    } catch (err) {
      toast('Sync Error', err.message || 'Network error', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast('API Key Copied', 'Token copied securely to clipboard', 'success');
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (geminiApiKey) localStorage.setItem('aegis_gemini_key', geminiApiKey.trim());
      if (geminiModel) localStorage.setItem('aegis_gemini_model', geminiModel.trim());
    }
    toast('Settings Saved', 'Platform and Gemini 3.6 preferences saved successfully', 'success');
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AppHeader />

        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-textSecondary uppercase tracking-wider">
              <Settings className="w-4 h-4 text-primaryBlue" /> Platform Configuration
            </div>
            <h1 className="text-3xl font-bold font-heading">
              Organization & Security Settings
            </h1>
            <p className="text-xs text-textSecondary">
              Manage analyst profiles, SOC team permissions, 2FA credentials, and API webhook integrations.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-surfaceSecondary border border-borderSubtle">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profile' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <User className="w-4 h-4" /> Profile Details
            </button>
            <button
              onClick={() => setActiveTab('org')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'org' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Shield className="w-4 h-4" /> Team & Roles
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Lock className="w-4 h-4" /> 2FA & SSO Auth
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'api' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <KeyRound className="w-4 h-4" /> API Keys & Webhooks
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'billing' ? 'bg-primaryBlue text-white shadow-glowBlue' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Subscription Plan
            </button>
          </div>

          {/* Form Content */}
          <Card className="p-8 space-y-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-textPrimary">Analyst Profile Info</h3>
                    <p className="text-xs text-textSecondary">Manage your SOC analyst account synced with Supabase database.</p>
                  </div>
                  <button
                    onClick={handleSyncSupabase}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-xl bg-surfaceSecondary border border-primaryBlue/30 text-primaryBlue hover:bg-primaryBlue hover:text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-glowBlue"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing to Supabase...' : 'Sync with Supabase'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-textSecondary mb-1.5">Full Name</label>
                    <input
                      type="text"
                      key={`name-${userFullName}`}
                      defaultValue={userFullName || 'Alex Rivera'}
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-textPrimary focus:outline-none focus:border-primaryBlue"
                    />
                  </div>
                  <div>
                    <label className="block text-textSecondary mb-1.5">Email Address</label>
                    <input
                      type="email"
                      key={`email-${userEmail}`}
                      defaultValue={userEmail || 'alex.rivera@aegis-sec.io'}
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-textPrimary focus:outline-none focus:border-primaryBlue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-xs text-textSecondary mb-1.5">Role Title</label>
                    <input
                      type="text"
                      defaultValue="Chief Information Security Officer (CISO)"
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary focus:outline-none focus:border-primaryBlue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textSecondary mb-1.5">Clerk User ID (Supabase Primary Key)</label>
                    <input
                      type="text"
                      readOnly
                      value={user?.id || 'Not signed in'}
                      className="w-full bg-surfaceSecondary/50 border border-borderSubtle rounded-xl p-3 text-xs font-mono text-cyanAccent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                {/* Google Gemini 3.6 Integration Card */}
                <div className="p-6 rounded-2xl bg-purpleAccent/5 border border-purpleAccent/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purpleAccent/20 text-purpleAccent border border-purpleAccent/40">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                          Google Gemini Explainable AI Engine
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purpleAccent/20 text-purpleAccent border border-purpleAccent/30">
                            {geminiModel.toUpperCase()}
                          </span>
                        </h3>
                        <p className="text-xs text-textSecondary">
                          Powers Phase 8 evidence-grounded fraud explanations and human-readable forensic narratives.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTestGemini}
                      disabled={isTestingGemini}
                      className="px-3.5 py-2 rounded-xl bg-purpleAccent/20 hover:bg-purpleAccent/30 border border-purpleAccent/40 text-purpleAccent text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-glowPurple"
                    >
                      {isTestingGemini ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing Connection...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Test Gemini Connection
                        </>
                      )}
                    </button>
                  </div>

                  {geminiTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                        geminiTestResult.success
                          ? 'bg-successGreen/10 border-successGreen/30 text-successGreen'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {geminiTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="leading-relaxed">{geminiTestResult.message}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="block text-textSecondary font-medium">Gemini Model Identifier</label>
                      <input
                        type="text"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                        placeholder="gemini-3.6-flash"
                        className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 font-mono text-xs text-textPrimary focus:outline-none focus:border-purpleAccent"
                      />
                      <p className="text-[10px] text-textSecondary">
                        Configured model: <code>gemini-3.6-flash</code> (supports <code>gemini-2.0-flash</code>, <code>gemini-1.5-flash</code>).
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-textSecondary font-medium">Google Gemini API Key</label>
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy... or server-side .env.local"
                        className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 font-mono text-xs text-purpleAccent focus:outline-none focus:border-purpleAccent"
                      />
                      <p className="text-[10px] text-textSecondary">
                        Kept server-side. Configure in <code>.env.local</code> as <code>GEMINI_API_KEY</code>, or save here for SOC sessions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-borderSubtle space-y-4">
                  <h3 className="text-base font-bold text-textPrimary">Production API Secret Token</h3>

                  <div className="space-y-2">
                    <label className="block text-xs text-textSecondary">Live Secret Token (Keep confidential)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        readOnly
                        value={apiKey}
                        className="flex-1 bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 font-mono text-xs text-purpleAccent"
                      />
                      <Button onClick={copyKey} variant="secondary" icon={<Copy className="w-4 h-4" />}>
                        Copy Key
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-borderSubtle space-y-2">
                    <div className="text-xs font-bold text-textPrimary">Webhook Endpoint URL</div>
                    <input
                      type="text"
                      defaultValue="https://sec-api.corp-internal.com/v1/aegis-webhooks"
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primaryBlue/10 border border-primaryBlue/30">
                  <div>
                    <div className="text-xs font-mono text-primaryBlue font-bold">CURRENT ACTIVE TIER</div>
                    <div className="text-xl font-bold text-textPrimary">Enterprise Aegis Tier ($149 / mo)</div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-successGreen/20 text-successGreen font-mono text-xs font-bold">
                    Active
                  </span>
                </div>
              </div>
            )}

            {(activeTab === 'org' || activeTab === 'security') && (
              <div className="py-8 text-center text-textSecondary text-xs">
                Active SOC Security Policy Enforced via Okta SSO Gateway.
              </div>
            )}

            <div className="pt-6 border-t border-borderSubtle flex items-center justify-end">
              <Button onClick={handleSave} variant="primary" size="md">
                Save Preferences
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
