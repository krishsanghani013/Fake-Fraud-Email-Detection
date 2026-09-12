'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

// Syncs Clerk user with Supabase
export function UserSync() {
  const { isSignedIn, user, isLoaded } = useUser();
  const syncedUserIdRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    // Deduplicate user sync
    if (syncedUserIdRef.current === user.id) return;

    const syncUserToSupabase = async () => {
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          syncedUserIdRef.current = user.id;
          console.log('[AEGIS Sync] Supabase profile synchronized successfully:', data.profile);
        } else {
          console.warn('[AEGIS Sync] Profile sync returned status:', res.status);
        }
      } catch (err) {
        console.error('[AEGIS Sync] Failed to sync user to Supabase:', err);
      }
    };

    syncUserToSupabase();
  }, [isLoaded, isSignedIn, user]);

  return null;
}

export default UserSync;
