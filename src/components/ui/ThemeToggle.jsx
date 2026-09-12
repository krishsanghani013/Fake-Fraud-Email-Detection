'use client';

import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from './Toast';

export function ThemeToggle({ variant = 'icon', className = '' }) {
  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme();
  const { toast } = useToast();

  const handleQuickToggle = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    toggleTheme();
    if (toast) {
      toast(
        next === 'dark' ? 'Dark Mode Activated' : 'Light Mode Activated',
        next === 'dark'
          ? 'Switched to Deep Slate cyber forensics theme'
          : 'Switched to Soft White minimal aesthetic',
        'info'
      );
    }
  };

  // If not yet mounted on client, render a placeholder with consistent dimensions
  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-lg border border-borderSubtle bg-white/50 dark:bg-slate-800/50 ${className}`} />
    );
  }

  // Segmented 3-way control (used in Settings / Preferences)
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'light'
              ? 'bg-white text-deepSlate shadow-sm border border-slate-200/80'
              : 'text-neutralGray hover:text-deepSlate dark:hover:text-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'dark'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-neutralGray hover:text-deepSlate dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-blue-400" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-800 text-deepSlate dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
              : 'text-neutralGray hover:text-deepSlate dark:hover:text-slate-200'
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-neutralGray" />
          <span>System</span>
        </button>
      </div>
    );
  }

  // Default: Cool Animated Icon Toggle
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={handleQuickToggle}
      className={`group relative p-2 rounded-lg border transition-all duration-300 flex items-center justify-center overflow-hidden cursor-pointer ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode (Ctrl+Shift+D)' : 'Switch to Dark Mode (Ctrl+Shift+D)'}
      aria-label="Toggle Theme"
    >
      {/* Icon rotation container */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 transition-all duration-300 transform absolute ${
            isDark
              ? 'rotate-90 scale-0 opacity-0 text-amber-400'
              : 'rotate-0 scale-100 opacity-100 text-amber-500 group-hover:rotate-45'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 transition-all duration-300 transform absolute ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-blue-400 group-hover:-rotate-12'
              : '-rotate-90 scale-0 opacity-0 text-slate-400'
          }`}
        />
      </div>
    </button>
  );
}
