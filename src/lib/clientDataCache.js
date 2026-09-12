'use client';

// In-memory client cache with session storage
let memoryCache = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000;

const STORAGE_KEY = 'aegis_forensic_emails_cache_v1';

// Retrieve cached emails synchronously
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

// Update client cache
export function setCachedEmails(emails) {
  if (!Array.isArray(emails)) return;
  memoryCache = emails;
  lastFetchTime = Date.now();

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          emails: emails.slice(0, 100),
          timestamp: lastFetchTime,
        })
      );
    } catch (e) {
      console.warn('[Cache] Could not write sessionStorage cache:', e);
    }
  }
}

// Prepend or update email in cache
export function addOrUpdateEmailInCache(newEmail) {
  if (!newEmail || !newEmail.id) return;
  const current = getCachedEmailsSync() || [];
  const filtered = current.filter((e) => e.id !== newEmail.id);
  const updated = [newEmail, ...filtered];
  setCachedEmails(updated);
}

// Check if cache is stale
export function isCacheStale() {
  return Date.now() - lastFetchTime > CACHE_TTL_MS;
}

// Fetch emails with SWR pattern
export async function getEmailsWithSWR(onData, { forceRefresh = false } = {}) {
  const cached = getCachedEmailsSync();
  const stale = isCacheStale();

  if (cached && !forceRefresh) {
    if (onData) onData(cached, false);
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
