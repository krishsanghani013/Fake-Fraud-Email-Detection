import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

// Server-only Supabase client
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

// Lazy server instance proxy
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
