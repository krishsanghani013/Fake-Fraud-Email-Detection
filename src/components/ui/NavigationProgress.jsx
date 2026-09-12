'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * NavigationProgress provides instant visual feedback (< 1ms)
 * when a user clicks any navigation link.
 * Smoothly animates along the top edge of the screen and completes on pathname change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  // When route changes, complete progress quickly and fade out
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Global click interceptor for internal links to trigger progress immediately on mousedown/click
  useEffect(() => {
    const handleLinkClick = (e) => {
      // Find closest anchor tag
      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore external, hash, target blank, or download links
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Check if navigating to the same path
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Start navigation indicator immediately
      setIsNavigating(true);
      setProgress(25);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 70) return prev + 15;
          if (prev < 90) return prev + 3;
          return prev;
        });
      }, 100);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px]"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '200ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
