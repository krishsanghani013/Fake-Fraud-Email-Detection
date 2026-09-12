'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = (title, description, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white/95 dark:bg-[#1E293B]/95 border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-xl transition-all"
            >
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</h4>
                {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>}
              </div>

              <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
