'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, User, ArrowRight, CheckCircle2, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('alex.rivera@aegis-sec.io');
  const [password, setPassword] = useState('SuperSecretPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['4', '8', '1', '9', '2', '0']);
  const { toast } = useToast();

  // Password Strength Logic
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      toast('Signed in successfully', 'Welcome back, Alex Rivera!', 'success');
      window.location.href = '/dashboard';
    } else if (mode === 'signup') {
      setMode('otp');
      toast('Verification Code Sent', `Enter the 6-digit OTP sent to ${email}`, 'info');
    } else if (mode === 'forgot') {
      setMode('otp');
      toast('Password Reset Link Sent', 'Check your inbox for OTP validation', 'info');
    } else if (mode === 'otp') {
      toast('Identity Verified!', 'Password updated safely', 'success');
      setMode('login');
    } else if (mode === 'reset') {
      toast('Password Updated!', 'Please login with your new credentials', 'success');
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primaryBlue/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purpleAccent/20 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left Side: Illustration & Branding */}
        <div className="lg:col-span-5 p-8 bg-gradient-to-br from-surface to-surfaceSecondary border-b lg:border-b-0 lg:border-r border-borderSubtle flex flex-col justify-between relative overflow-hidden">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primaryBlue via-purpleAccent to-cyanAccent flex items-center justify-center shadow-glowBlue">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold font-heading tracking-tight gradient-text-blue">AEGIS AI</span>
              <span className="text-[10px] text-textSecondary font-mono uppercase tracking-wider">Enterprise Security</span>
            </div>
          </Link>

          <div className="my-12 text-center relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="w-48 h-48 mx-auto rounded-full border border-primaryBlue/30 border-dashed flex items-center justify-center relative shadow-glowBlue"
            >
              <div className="w-36 h-36 rounded-full border border-purpleAccent/40 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primaryBlue to-purpleAccent/40 flex items-center justify-center shadow-glowPurple">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>
            <div className="mt-6 text-sm font-semibold text-textPrimary">Zero-Trust Identity Guard</div>
            <div className="text-xs text-textSecondary mt-1">Multi-factor RSA-2048 Cryptographic Authentication</div>
          </div>

          <div className="text-[11px] text-textSecondary flex items-center justify-between border-t border-borderSubtle/60 pt-4 font-mono">
            <span className="flex items-center gap-1.5 text-successGreen"><Sparkles className="w-3 h-3" /> SOC2 Type II Certified</span>
            <span>2FA Mandatory</span>
          </div>
        </div>

        {/* Right Side: Interactive Forms */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold font-heading text-textPrimary">
                  {mode === 'login' && 'Sign In to Aegis SOC'}
                  {mode === 'signup' && 'Create Enterprise Account'}
                  {mode === 'forgot' && 'Reset Your Password'}
                  {mode === 'otp' && 'Two-Factor Authentication'}
                  {mode === 'reset' && 'Enter New Password'}
                </h2>
                <p className="text-xs text-textSecondary mt-1">
                  {mode === 'login' && 'Enter your authorization credentials to access threat data.'}
                  {mode === 'signup' && 'Deploy Aegis email fraud protection across your enterprise.'}
                  {mode === 'forgot' && 'We will send a 6-digit OTP code to verify your identity.'}
                  {mode === 'otp' && `Enter 6-digit OTP sent to ${email}`}
                  {mode === 'reset' && 'Choose a strong password compliant with SOC2 rules.'}
                </p>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1.5">Work Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-textSecondary absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="analyst@enterprise-corp.com"
                        className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primaryBlue transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-textSecondary">Security Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-xs text-primaryBlue hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-textSecondary absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-surfaceSecondary border border-borderSubtle rounded-xl pl-10 pr-10 py-2.5 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primaryBlue transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-textSecondary hover:text-textPrimary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Indicator for Signup / Reset */}
                    {(mode === 'signup' || mode === 'reset') && (
                      <div className="mt-3 p-3 rounded-xl bg-surfaceSecondary/50 border border-borderSubtle space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-textSecondary">Password Strength</span>
                          <span className={`font-bold font-mono ${
                            strengthScore <= 1 ? 'text-dangerRed' : strengthScore <= 3 ? 'text-warningAmber' : 'text-successGreen'
                          }`}>
                            {strengthScore <= 1 ? 'Weak' : strengthScore <= 3 ? 'Moderate' : 'Strong'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-1.5 rounded-full transition-all ${
                                step <= strengthScore
                                  ? strengthScore <= 1 ? 'bg-dangerRed' : strengthScore <= 3 ? 'bg-warningAmber' : 'bg-successGreen'
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-textSecondary">
                          <span className={hasMinLength ? 'text-successGreen flex items-center gap-1' : ''}>
                            ✓ 8+ Characters
                          </span>
                          <span className={hasUppercase ? 'text-successGreen flex items-center gap-1' : ''}>
                            ✓ Uppercase Letter
                          </span>
                          <span className={hasNumber ? 'text-successGreen flex items-center gap-1' : ''}>
                            ✓ Number
                          </span>
                          <span className={hasSpecial ? 'text-successGreen flex items-center gap-1' : ''}>
                            ✓ Special Symbol
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* OTP Input Boxes */}
                {mode === 'otp' && (
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-2">6-Digit Verification Code</label>
                    <div className="flex gap-2 justify-between">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => {
                            const newOtp = [...otpCode];
                            newOtp[idx] = e.target.value;
                            setOtpCode(newOtp);
                          }}
                          className="w-12 h-12 text-center bg-surfaceSecondary border border-borderSubtle rounded-xl text-lg font-bold font-mono text-primaryBlue focus:outline-none focus:border-primaryBlue"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="primary" className="w-full py-3 mt-4" size="lg">
                  {mode === 'login' && 'Authenticate Session'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Security OTP'}
                  {mode === 'otp' && 'Verify Code'}
                  {mode === 'reset' && 'Save New Password'}
                </Button>
              </form>

              {/* Social Login Options */}
              {mode === 'login' && (
                <div className="space-y-4 pt-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-borderSubtle" />
                    <span className="bg-surface px-3 text-[11px] text-textSecondary uppercase font-mono absolute">
                      Or Enterprise SSO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { toast('Okta Single Sign-On Activated', 'Redirecting...', 'info'); }}
                      className="py-2.5 px-4 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-xs font-semibold text-textPrimary flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-purpleAccent" /> Okta SSO
                    </button>
                    <button
                      onClick={() => { toast('Google Enterprise Active', 'Authenticated!', 'success'); window.location.href = '/dashboard'; }}
                      className="py-2.5 px-4 rounded-xl bg-surfaceSecondary border border-borderSubtle hover:border-white/20 text-xs font-semibold text-textPrimary flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4 text-primaryBlue" /> Google Workspace
                    </button>
                  </div>
                </div>
              )}

              {/* Switch View Links */}
              <div className="text-center text-xs text-textSecondary pt-2">
                {mode === 'login' ? (
                  <span>
                    New to Aegis AI?{' '}
                    <button onClick={() => setMode('signup')} className="text-primaryBlue font-semibold hover:underline">
                      Create an Enterprise account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{' '}
                    <button onClick={() => setMode('login')} className="text-primaryBlue font-semibold hover:underline">
                      Back to Sign In
                    </button>
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
