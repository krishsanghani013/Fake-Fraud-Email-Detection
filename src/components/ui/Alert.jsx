'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export function Alert({
  children,
  type = 'info',
  title,
  className,
  icon,
  onClose,
  ...props
}) {
  const configs = {
    info: {
      bg: 'bg-[#EFF6FF] dark:bg-blue-950/40',
      border: 'border-l-[#3B82F6]',
      text: 'text-[#0F172A] dark:text-blue-100',
      iconColor: 'text-[#3B82F6] dark:text-blue-400',
      defaultIcon: Info,
    },
    warning: {
      bg: 'bg-[#FFFBEB] dark:bg-amber-950/40',
      border: 'border-l-[#F59E0B]',
      text: 'text-[#0F172A] dark:text-amber-100',
      iconColor: 'text-[#F59E0B] dark:text-amber-400',
      defaultIcon: AlertTriangle,
    },
    success: {
      bg: 'bg-[#ECFDF5] dark:bg-emerald-950/40',
      border: 'border-l-[#10B981]',
      text: 'text-[#0F172A] dark:text-emerald-100',
      iconColor: 'text-[#10B981] dark:text-emerald-400',
      defaultIcon: CheckCircle2,
    },
    error: {
      bg: 'bg-[#FEF2F2] dark:bg-red-950/40',
      border: 'border-l-[#EF4444]',
      text: 'text-[#0F172A] dark:text-red-100',
      iconColor: 'text-[#EF4444] dark:text-red-400',
      defaultIcon: XCircle,
    },
  };

  const current = configs[type] || configs.info;
  const IconComponent = icon || current.defaultIcon;

  return (
    <div
      className={twMerge(
        clsx(
          'p-4 rounded-r-lg border border-l-4 border-slate-200/80 dark:border-slate-800 flex items-start gap-3 text-sm shadow-sm',
          current.bg,
          current.border,
          current.text,
          className
        )
      )}
      role="alert"
      {...props}
    >
      <IconComponent className={clsx('w-5 h-5 shrink-0 mt-0.5', current.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
}
