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

// Prewarm core routes on idle
export function RoutePrewarmer() {
  const router = useRouter();
  const warmedRef = useRef(false);

  useEffect(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;

    const schedulePrewarm = () => {
      // Prefetch route bundles
      CORE_ROUTES.forEach((route) => {
        try {
          router.prefetch(route);
        } catch (e) {}
      });

      // Warm email cache
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
