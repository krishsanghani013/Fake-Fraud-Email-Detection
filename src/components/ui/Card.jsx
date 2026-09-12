'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  hoverEffect = false,
  compact = false,
  className,
  ...props
}) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#FAFBFC] rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-all duration-200 relative overflow-hidden',
          compact ? 'p-4' : 'p-6',
          hoverEffect && 'hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={twMerge(clsx('flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9] dark:border-[#334155]', className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={twMerge(clsx('text-base font-semibold text-[#0F172A] dark:text-[#FAFBFC] flex items-center gap-2', className))} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={twMerge(clsx('text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5', className))} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={twMerge(clsx('space-y-4', className))} {...props}>
      {children}
    </div>
  );
}
