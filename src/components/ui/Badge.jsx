'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({
  children,
  level = 'INFO',
  size = 'md',
  className,
  ...props
}) {
  const styles = {
    SAFE: 'bg-successGreen/10 text-successGreen border-successGreen/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]',
    PASS: 'bg-successGreen/10 text-successGreen border-successGreen/30',
    SUSPICIOUS: 'bg-warningAmber/10 text-warningAmber border-warningAmber/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    WARN: 'bg-warningAmber/10 text-warningAmber border-warningAmber/30',
    FRAUD: 'bg-dangerRed/10 text-dangerRed border-dangerRed/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    FAIL: 'bg-dangerRed/10 text-dangerRed border-dangerRed/30',
    CRITICAL: 'bg-purpleAccent/15 text-purpleAccent border-purpleAccent/40 shadow-[0_0_15px_rgba(124,92,252,0.3)]',
    INFO: 'bg-primaryBlue/10 text-primaryBlue border-primaryBlue/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-mono tracking-wider',
    md: 'px-3 py-1 text-xs font-semibold tracking-wide',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider select-none',
          styles[level] || styles.INFO,
          sizes[size],
          className
        )
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {children || level}
    </span>
  );
}
