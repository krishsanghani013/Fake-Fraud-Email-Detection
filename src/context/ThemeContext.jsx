'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Determine system preference
  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Apply theme class to documentElement
  const applyTheme = useCallback((targetResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (targetResolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
    setResolvedTheme(targetResolvedTheme);
  }, []);

  // Set theme & persist
  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('aegis_theme', newTheme);
      } catch (e) {
        console.warn('Unable to persist theme to localStorage', e);
      }

      const effectiveTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
      applyTheme(effectiveTheme);
    },
    [getSystemTheme, applyTheme]
  );

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Initial load
  useEffect(() => {
    let saved = 'system';
    try {
      saved = localStorage.getItem('aegis_theme') || 'system';
    } catch (e) {
      saved = 'system';
    }

    setThemeState(saved);
    const initialResolved = saved === 'system' ? getSystemTheme() : saved;
    applyTheme(initialResolved);
    setMounted(true);

    // Listen to OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      const currentSaved = localStorage.getItem('aegis_theme') || 'system';
      if (currentSaved === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    // Keyboard shortcut: Cmd/Ctrl + Shift + D to toggle theme
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        const currentResolved = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const next = currentResolved === 'dark' ? 'light' : 'dark';
        setTheme(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyTheme, getSystemTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
