'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  hoverEffect = false,
  glowColor = 'none',
  className,
  ...props
}) {
  const glowStyles = {
    none: '',
    blue: 'hover:border-primaryBlue/50 hover:shadow-glowBlue',
    purple: 'hover:border-purpleAccent/50 hover:shadow-glowPurple',
    cyan: 'hover:border-cyanAccent/50 hover:shadow-glowCyan',
    red: 'hover:border-dangerRed/50 hover:shadow-glowRed',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'glass-card p-6 transition-all duration-300 relative overflow-hidden',
          hoverEffect && 'glass-card-hover cursor-pointer',
          glowStyles[glowColor],
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
    <div className={twMerge(clsx('flex items-center justify-between pb-4 mb-4 border-b border-borderSubtle', className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={twMerge(clsx('text-lg font-semibold text-textPrimary flex items-center gap-2', className))} {...props}>
      {children}
    </h3>
  );
}
