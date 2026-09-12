'use client';

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Bot,
  UserCheck,
  Send,
  Trash2,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { AIContentDetectorCard } from '../../components/analysis/AIContentDetectorCard';

const SAMPLE_EMAILS = [
  {
    label: '1. AI + Harmful Phish (ChatGPT)',
    quadrant: 'AI_GENERATED_HARMFUL',
    subject: 'URGENT: Verify Your Account Credentials Immediately',
    text: `I hope this email finds you well.

Please be advised that our automated security system has detected unauthorized access attempts on your account. In today's fast-paced digital landscape, protecting your personal data is of paramount importance to our organization.

To ensure that your services remain uninterrupted, it is crucial that you verify your identity promptly. By following these simple steps, you can secure your account within minutes:

1. Click the secure verification portal link provided below.
2. Confirm your existing login credentials and secondary backup details.
3. Review your recent transactions to ensure no unauthorized changes occurred.

Furthermore, please do not hesitate to contact our dedicated support team if you require any additional assistance. Rest assured that we are taking every necessary precaution to protect your digital assets.

Sincerely,
Customer Support Operations`
  },
  {
    label: '2. AI + Legitimate (Marketing Draft)',
    quadrant: 'AI_GENERATED_LEGITIMATE',
    subject: 'Transforming Your Digital Enterprise with Next-Gen Intelligence',
    text: `I hope this message finds you in good health and high spirits.

As we delve deeply into the transformative era of cloud computing, our latest enterprise suite stands as a true testament to our enduring commitment to technological excellence. Our platform serves as a beacon of innovation, seamlessly bridging legacy infrastructure with state-of-the-art agility.

Furthermore, we foster an environment where collaborative synergy thrives across diverse operational ecosystems. To delve into our comprehensive whitepaper and discover how we can optimize your operational workflows, please review the attached documentation.

Do not hesitate to reach out if you have any questions or wish to schedule a personalized demonstration.

Best regards,
Enterprise Strategy Team`
  },
  {
    label: '3. Human + Harmful Fraud (CEO Wire Scam)',
    quadrant: 'HUMAN_AUTHORED_HARMFUL',
    subject: 'Urgent Wire Transfer Needed Before 3pm Today',
    text: `Hey,

I am in a confidential board meeting right now and cannot take phone calls. I need you to process an urgent wire transfer of $48,500 to a new vendor for our acquisition closing today. 

Please update payment instructions with the bank routing details I will send over shortly. Wire the funds immediately so the contract doesn't fall through. Do not inform anyone else on the finance team yet as this is strictly confidential. 

Let me know as soon as you are at your desk so I can send the bank account details.

Thanks,
Mark`
  },
  {
    label: '4. Human + Legitimate Safe (Organic Work)',
    quadrant: 'HUMAN_AUTHORED_LEGITIMATE',
    subject: 'quick question about the meeting notes',
    text: `Hey Sarah,

Just saw your ping from earlier. Sorry for the delay, was stuck in traffic on the way back from the client site. 

Did you get a chance to push the updated slides to the shared drive? Mark said he needed them by 4pm today so he can prep for tomorrow's standup. If not, no worries, I can grab them from the email thread we had yesterday. 

Let me know if you want to hop on a quick 5 min call before EOD!

Thanks,
Dave`
  }
];

export default function AiDetectorPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);

  const loadSample = (sample) => {
    setSubject(sample.subject);
    setText(sample.text);
    setDetectionResult(null);
    toast('Sample Loaded', `Loaded "${sample.label}"`, 'info');
  };

  const handleRunDetection = async (forceOffline = false) => {
    if (!text.trim() && !subject.trim()) {
      toast('Empty Input', 'Please enter email body or subject text to analyze.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/detect-ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          subject,
          forceOffline: Boolean(forceOffline),
          timeoutMs: 35000
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Detection failed');
      }

      setDetectionResult(data.detection);
      toast(
        'Detection Complete',
        data.detection.isOfflineFallback
          ? 'Stylometric analysis complete.'
          : 'Deep AI & stylometric forensic analysis complete.',
        'success'
      );
    } catch (err) {
      toast('Analysis Notice', err.message || 'Failed to complete AI detection', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSubject('');
    setText('');
    setDetectionResult(null);
  };

  return (
    <div className="flex min-h-screen bg-darkBg text-textPrimary">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purpleAccent/10 border border-purpleAccent/30 text-purpleAccent text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Phase 9 Dual-Matrix Forensic Engine
            </div>
            <h1 className="text-3xl font-extrabold font-heading text-textPrimary tracking-tight">
              AI Origin & Threat / Harm Forensic Detector
            </h1>
            <p className="text-sm text-textSecondary max-w-3xl leading-relaxed">
              Dual-matrix forensic engine simultaneously predicting <strong>Authorship Origin</strong> (AI-Generated vs Human-Authored) and <strong>Threat Intent</strong> (Fake / Harmful Phishing vs Authentic Legitimate Communication).
            </p>
          </div>

          {/* Preset Sample Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-textSecondary mr-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Load Pre-built Test Samples:
            </span>
            {SAMPLE_EMAILS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => loadSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-surfaceSecondary hover:bg-white/10 border border-borderSubtle text-xs font-mono text-textPrimary transition-all flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-purpleAccent" />
                {sample.label}
              </button>
            ))}
          </div>

          {/* Input Form Card */}
          <Card className="p-6 space-y-4 border border-white/10">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-textSecondary mb-1.5">
                  Email Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Action Required: Your Account Verification..."
                  className="w-full px-4 py-2.5 rounded-xl bg-darkBg/80 border border-borderSubtle focus:border-purpleAccent focus:outline-none text-xs font-sans text-textPrimary placeholder:text-textSecondary/50 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-textSecondary">
                    Email Body Content (Raw or Plaintext)
                  </label>
                  <span className="text-[11px] font-mono text-textSecondary">
                    {text.length} characters • {text.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste email text here to evaluate synthetic probability, burstiness, token predictability, and sentence-by-sentence heatmap..."
                  className="w-full px-4 py-3 rounded-2xl bg-darkBg/80 border border-borderSubtle focus:border-purpleAccent focus:outline-none text-xs font-mono text-textPrimary placeholder:text-textSecondary/50 transition-all leading-relaxed"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-borderSubtle">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surfaceSecondary hover:bg-white/10 border border-borderSubtle text-xs font-mono text-textSecondary hover:text-textPrimary transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleRunDetection(true)}
                  disabled={isLoading || (!text.trim() && !subject.trim())}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surfaceSecondary hover:bg-white/10 border border-borderSubtle text-xs font-mono font-semibold text-textPrimary transition-all disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-cyanAccent" /> Instant Stylometric Scan (0ms)
                </button>

                <button
                  onClick={() => handleRunDetection(false)}
                  disabled={isLoading || (!text.trim() && !subject.trim())}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primaryBlue to-purpleAccent hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold font-mono transition-all shadow-glowPurple"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Linguistics...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Run Deep AI Origin Detection
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* Results Section */}
          {detectionResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading text-textPrimary flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purpleAccent" /> Forensic Detection Report
                </h3>
                <span className="text-xs font-mono text-textSecondary">
                  Generated at {new Date(detectionResult.generatedAt).toLocaleTimeString()}
                </span>
              </div>

              <AIContentDetectorCard
                detection={detectionResult}
                onRerun={(forceOffline) => handleRunDetection(forceOffline)}
                isLoading={isLoading}
                rawText={text}
                subject={subject}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
