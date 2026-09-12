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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-primaryBlue/50';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5 font-semibold',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-primaryBlue to-purpleAccent text-white shadow-glowBlue hover:opacity-95 hover:shadow-glowPurple active:scale-[0.98]',
    glow: 'bg-primaryBlue text-white shadow-glowBlue hover:bg-primaryBlue/90 active:scale-[0.98]',
    secondary: 'bg-surfaceSecondary/90 text-textPrimary border border-borderSubtle hover:bg-surfaceSecondary hover:border-primaryBlue/40 active:scale-[0.98]',
    outline: 'border border-borderSubtle bg-transparent text-textPrimary hover:bg-surfaceSecondary hover:border-white/20 active:scale-[0.98]',
    ghost: 'text-textSecondary hover:text-textPrimary hover:bg-white/5 active:scale-[0.98]',
    danger: 'bg-dangerRed/10 text-dangerRed border border-dangerRed/30 hover:bg-dangerRed/20 active:scale-[0.98]',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizes[size], variants[variant], className))}
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
