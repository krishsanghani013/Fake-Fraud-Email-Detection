'use client';

import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [apiKey, setApiKey] = useState('aegis_live_98a712f89a012bc789a123');

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast('API Key Copied', 'Token copied securely to clipboard', 'success');
  };

  const handleSave = () => {
    toast('Settings Saved', 'Organization preferences updated safely', 'success');
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
                <h3 className="text-base font-bold text-textPrimary">Analyst Profile Info</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-textSecondary mb-1.5">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Alex Rivera"
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-textPrimary focus:outline-none focus:border-primaryBlue"
                    />
                  </div>
                  <div>
                    <label className="block text-textSecondary mb-1.5">Email Address</label>
                    <input
                      type="email"
                      defaultValue="alex.rivera@aegis-sec.io"
                      className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-textPrimary focus:outline-none focus:border-primaryBlue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-textSecondary mb-1.5">Role Title</label>
                  <input
                    type="text"
                    defaultValue="Chief Information Security Officer (CISO)"
                    className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl p-3 text-xs text-textPrimary focus:outline-none focus:border-primaryBlue"
                  />
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
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
