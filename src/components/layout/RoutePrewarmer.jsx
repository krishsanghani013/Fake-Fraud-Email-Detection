'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getEmailsWithSWR } from '../../lib/clientDataCache';

const CORE_ROUTES = [
  '/dashboard',
  '/upload',
  '/reports',
  '/settings',
  '/results/scan-89421',
];

/**
 * RoutePrewarmer runs once during browser idle time to pre-compile and
 * prefetch core routes and warm up the client data cache.
 * Makes subsequent navigations virtually instantaneous.
 */
export function RoutePrewarmer() {
  const router = useRouter();
  const warmedRef = useRef(false);

  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;

    const schedulePrewarm = () => {
      // 1. Prefetch core route client bundles
      CORE_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch (e) {
          // Non-blocking
        }
      });

      // 2. Warm up client-side emails data cache quietly
      getEmailsWithSWR(() => {}, { forceRefresh: false }).catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(schedulePrewarm, { timeout: 2000 });
    } else {
      const timer = setTimeout(schedulePrewarm, 1200);
      return () => clearTimeout(timer);
    }
  }, [router]);

  return null;
}
