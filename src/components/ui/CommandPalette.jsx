'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Shield, FileSearch, BarChart3, Settings, Bell, Zap, ArrowRight, X } from 'lucide-react';

export function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dashboard', label: 'Go to Executive Dashboard', category: 'Navigation', icon: <Shield className="w-4 h-4 text-primaryBlue" />, href: '/dashboard' },
    { id: 'upload', label: 'Scan & Analyze Email (.eml / .msg)', category: 'Actions', icon: <Zap className="w-4 h-4 text-purpleAccent" />, href: '/upload' },
    { id: 'cases', label: 'View Security Cases Workbench', category: 'Navigation', icon: <FileSearch className="w-4 h-4 text-cyanAccent" />, href: '/cases' },
    { id: 'analytics', label: 'Threat Analytics & Intelligence', category: 'Navigation', icon: <BarChart3 className="w-4 h-4 text-successGreen" />, href: '/analytics' },
    { id: 'indicators', label: 'Inspect 13 AI Risk Indicators', category: 'Deep Dive', icon: <Command className="w-4 h-4 text-warningAmber" />, href: '/risk-indicators' },
    { id: 'notifications', label: 'Open Real-time Alerts', category: 'Activity', icon: <Bell className="w-4 h-4 text-primaryBlue" />, href: '/notifications' },
    { id: 'settings', label: 'Organization & API Settings', category: 'System', icon: <Settings className="w-4 h-4 text-textSecondary" />, href: '/settings' },
  ];

  const filtered = actions.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Input Header */}
          <div className="flex items-center px-4 py-3 border-b border-borderSubtle gap-3">
            <Search className="w-5 h-5 text-primaryBlue shrink-0" />
            <input
              type="text"
              placeholder="Type a command or search platform (e.g. 'scan', 'cases', 'analytics')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent text-textPrimary placeholder:text-textSecondary/60 focus:outline-none text-sm font-medium"
            />
            <button onClick={onClose} className="p-1 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action List */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-borderSubtle/40">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-textSecondary text-sm">
                No commands matching &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-surfaceSecondary border border-borderSubtle group-hover:border-primaryBlue/40 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-textPrimary group-hover:text-primaryBlue transition-colors">
                        {item.label}
                      </div>
                      <div className="text-xs text-textSecondary">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-textSecondary">Jump</span>
                    <ArrowRight className="w-4 h-4 text-primaryBlue" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-surfaceSecondary/60 border-t border-borderSubtle flex items-center justify-between text-xs text-textSecondary">
            <div className="flex items-center gap-3">
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">↵</kbd> select</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">ESC</kbd> close</span>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3 text-primaryBlue" />
              <span>Aegis AI Core</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
