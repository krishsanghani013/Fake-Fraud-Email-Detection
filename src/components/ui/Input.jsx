'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = React.forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon,
    className,
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-800 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <div className="relative rounded">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full rounded border border-[#D1D5DB] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-[#FAFBFC] placeholder-[#9CA3AF] dark:placeholder-slate-500 transition-all duration-150 focus:border-[#3B82F6] dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] shadow-sm',
              icon && 'pl-10',
              error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
});
