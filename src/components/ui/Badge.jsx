'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({
  children,
  level = 'LOW',
  size = 'md',
  pulsing = false,
  className,
  ...props
}) {
  const normLevel = String(level || 'LOW').toUpperCase();

  const styles = {
    LOW: 'bg-[#10B981] text-white border-transparent',
    SAFE: 'bg-[#10B981] text-white border-transparent',
    PASS: 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-800',
    
    MEDIUM: 'bg-[#F59E0B] text-white border-transparent',
    SUSPICIOUS: 'bg-[#F59E0B] text-white border-transparent',
    WARN: 'bg-[#FFFBEB] dark:bg-amber-950/60 text-[#D97706] dark:text-amber-400 border-[#FDE68A] dark:border-amber-800',
    
    HIGH: 'bg-[#EF4444] text-white border-transparent shadow-sm',
    FRAUD: 'bg-[#EF4444] text-white border-transparent shadow-sm',
    FAIL: 'bg-[#FEF2F2] dark:bg-red-950/60 text-[#DC2626] dark:text-red-400 border-[#FECACA] dark:border-red-800',
    
    CRITICAL: 'bg-[#7C3AED] dark:bg-purple-900 text-white border-transparent shadow-sm dark:shadow-[0_0_12px_rgba(124,58,237,0.35)]',
    
    INFO: 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 border-[#BFDBFE] dark:border-blue-800',
    NEUTRAL: 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 border-[#E2E8F0] dark:border-slate-700',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] font-semibold leading-none',
    sm: 'px-2 py-0.5 text-[11px] font-semibold tracking-wide',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide',
    lg: 'px-3.5 py-1.5 text-sm font-bold tracking-wide',
  };

  const shouldPulse = pulsing || normLevel === 'HIGH' || normLevel === 'CRITICAL' || normLevel === 'FRAUD';

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border uppercase select-none transition-all',
          styles[normLevel] || styles.INFO,
          sizes[size] || sizes.md,
          shouldPulse && 'ring-2 ring-current/20',
          className
        )
      )}
      {...props}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full bg-current', shouldPulse ? 'animate-pulse' : '')} />
      <span>{children || normLevel}</span>
    </span>
  );
}
