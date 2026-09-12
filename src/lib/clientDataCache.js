'use client';

/**
 * High-performance client-side cache for Aegis Forensic records.
 * Uses in-memory caching backed by sessionStorage for instant (0ms) route transitions.
 */

let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds fresh TTL

const STORAGE_KEY = 'aegis_forensic_emails_cache_v1';

/**
 * Synchronously retrieves cached emails for instant component initialization.
 * Prevents loading flickers and allows instant rendering on page transitions.
 */
export function getCachedEmailsSync() {
  if (memoryCache && Array.isArray(memoryCache)) {
    return memoryCache;
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.emails)) {
          memoryCache = parsed.emails;
          lastFetchTime = parsed.timestamp || Date.now();
          return memoryCache;
        }
      }
    } catch (e) {
      console.warn('[Cache] Could not read sessionStorage cache:', e);
    }
  }

  return null;
}

/**
 * Updates the client cache in memory and sessionStorage.
 */
export function setCachedEmails(emails) {
  if (!Array.isArray(emails)) return;
  memoryCache = emails;
  lastFetchTime = Date.now();

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          emails: emails.slice(0, 100), // Keep top 100 for lightweight storage
          timestamp: lastFetchTime,
        })
      );
    } catch (e) {
      console.warn('[Cache] Could not write sessionStorage cache:', e);
    }
  }
}

/**
 * Prepend or update an email in the cache immediately after ingestion/analysis.
 */
export function addOrUpdateEmailInCache(newEmail) {
  if (!newEmail || !newEmail.id) return;
  const current = getCachedEmailsSync() || [];
  const filtered = current.filter((e) => e.id !== newEmail.id);
  const updated = [newEmail, ...filtered];
  setCachedEmails(updated);
}

/**
 * Checks if the cached data is stale.
 */
export function isCacheStale() {
  return Date.now() - lastFetchTime > CACHE_TTL_MS;
}

/**
 * Fetches emails with Stale-While-Revalidate pattern.
 * If cached data exists, calls onData immediately, then revalidates in the background.
 */
export async function getEmailsWithSWR(onData, { forceRefresh = false } = {}) {
  const cached = getCachedEmailsSync();
  const stale = isCacheStale();

  // If we have cache and don't require forceRefresh, feed cache immediately
  if (cached && !forceRefresh) {
    if (onData) onData(cached, false);
    // If cache is fresh, skip background revalidation
    if (!stale) return cached;
  }

  try {
    const res = await fetch('/api/emails');
    if (res.ok) {
      const json = await res.json();
      if (json.emails && Array.isArray(json.emails)) {
        setCachedEmails(json.emails);
        if (onData) onData(json.emails, true);
        return json.emails;
      }
    }
  } catch (err) {
    console.warn('[Cache] Background revalidation fetch failed, keeping cache:', err);
  }

  return cached || [];
}
