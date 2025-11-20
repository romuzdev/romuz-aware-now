import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TestConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseAnonKey: string;
}

export function getTestConfig(): TestConfig {
  const url = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.E2E_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceKey || !anonKey) {
    throw new Error(
      'Missing E2E_SUPABASE_URL, E2E_SUPABASE_SERVICE_KEY, or E2E_SUPABASE_ANON_KEY env variables'
    );
  }

  return { supabaseUrl: url, supabaseServiceKey: serviceKey, supabaseAnonKey: anonKey };
}

export function createTestClient(accessToken?: string): SupabaseClient {
  const config = getTestConfig();
  
  if (accessToken) {
    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  return createClient(config.supabaseUrl, config.supabaseServiceKey);
}

export function createServiceClient(): SupabaseClient {
  const config = getTestConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceKey);
}
