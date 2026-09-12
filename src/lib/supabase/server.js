import 'server-only';
import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

/**
 * Creates or retrieves a singleton Supabase client for server-only backend operations.
 *
 * Environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase Project URL
 * - SUPABASE_SECRET_KEY: Supabase Secret / Service Role Key (server-only)
 *
 * Auth session persistence is disabled since authentication is managed by Clerk.
 */
export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to .env.local.'
    );
  }

  if (!supabaseSecretKey) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY environment variable. Please add it to .env.local.'
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return cachedClient;
}

export const getSupabaseServerClient = createSupabaseServerClient;
export const createServerClient = createSupabaseServerClient;

/**
 * Lazily evaluated server instance for direct query access:
 * e.g. await supabaseServer.from('emails').select('*')
 */
export const supabaseServer = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = createSupabaseServerClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

export default supabaseServer;
