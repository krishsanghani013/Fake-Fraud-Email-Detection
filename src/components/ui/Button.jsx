'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className,
  disabled,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-[0.99] cursor-pointer';

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5 font-semibold',
  };

  const variants = {
    primary: 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-sm active:bg-[#1D4ED8]',
    secondary: 'bg-[#F3F4F6] dark:bg-slate-800 text-[#0F172A] dark:text-[#FAFBFC] border border-[#D1D5DB] dark:border-slate-700 hover:bg-[#E5E7EB] dark:hover:bg-slate-700 shadow-sm',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm',
    ghost: 'bg-transparent text-[#3B82F6] dark:text-blue-400 hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40',
    outline: 'border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F172A] dark:text-[#FAFBFC] hover:bg-[#F8FAFC] dark:hover:bg-slate-700/80',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizes[size], variants[variant] || variants.primary, className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
