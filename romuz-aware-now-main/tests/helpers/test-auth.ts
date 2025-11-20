/**
 * ============================================================================
 * M23 - Test Authentication Helpers
 * Purpose: Manage test users and authentication for integration tests
 * ============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  tenantId: string;
  role?: string;
}

export interface TestTenant {
  id: string;
  name: string;
}

// Test data
export const TEST_TENANTS: TestTenant[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Test Tenant A' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Test Tenant B' },
];

export const TEST_USERS: TestUser[] = [
  {
    id: 'user-a1',
    email: 'tenant-a-user1@test.com',
    password: 'TestPassword123!',
    tenantId: TEST_TENANTS[0].id,
    role: 'tenant_admin'
  },
  {
    id: 'user-a2',
    email: 'tenant-a-user2@test.com',
    password: 'TestPassword123!',
    tenantId: TEST_TENANTS[0].id,
    role: 'manager'
  },
  {
    id: 'user-b1',
    email: 'tenant-b-user1@test.com',
    password: 'TestPassword123!',
    tenantId: TEST_TENANTS[1].id,
    role: 'tenant_admin'
  },
];

/**
 * Create Supabase client for testing
 */
export function createTestClient(authToken?: string): SupabaseClient {
  const headers: Record<string, string> = {};
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers,
    },
  });
}

/**
 * Create admin client with service role
 */
export function createAdminClient(): SupabaseClient {
  if (!supabaseServiceKey) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Sign in as test user
 */
export async function signInAsTestUser(
  email: string,
  password: string
): Promise<{ client: SupabaseClient; user: any; session: any }> {
  const client = createTestClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`);
  }

  if (!data.session || !data.user) {
    throw new Error('No session or user returned');
  }

  // Create authenticated client
  const authClient = createTestClient(data.session.access_token);

  return {
    client: authClient,
    user: data.user,
    session: data.session,
  };
}

/**
 * Sign in as tenant A admin
 */
export async function signInAsTenantA(): Promise<{
  client: SupabaseClient;
  user: any;
  session: any;
}> {
  return signInAsTestUser(TEST_USERS[0].email, TEST_USERS[0].password);
}

/**
 * Sign in as tenant B admin
 */
export async function signInAsTenantB(): Promise<{
  client: SupabaseClient;
  user: any;
  session: any;
}> {
  return signInAsTestUser(TEST_USERS[2].email, TEST_USERS[2].password);
}

/**
 * Sign out
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

/**
 * Setup test tenants (run once before tests)
 */
export async function setupTestTenants(): Promise<void> {
  const adminClient = createAdminClient();

  for (const tenant of TEST_TENANTS) {
    // Check if tenant exists
    const { data: existing } = await adminClient
      .from('tenants')
      .select('id')
      .eq('id', tenant.id)
      .single();

    if (!existing) {
      // Create tenant
      const { error } = await adminClient
        .from('tenants')
        .insert({
          id: tenant.id,
          name: tenant.name,
          is_active: true,
        });

      if (error) {
        console.warn(`Failed to create tenant ${tenant.id}:`, error.message);
      }
    }
  }
}

/**
 * Setup test users (run once before tests)
 */
export async function setupTestUsers(): Promise<void> {
  const adminClient = createAdminClient();

  for (const user of TEST_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          tenant_id: user.tenantId,
          role: user.role,
        },
      });

      if (authError) {
        console.warn(`Failed to create user ${user.email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.warn(`No user returned for ${user.email}`);
        continue;
      }

      // Link user to tenant in user_tenants table
      const { error: linkError } = await adminClient
        .from('user_tenants')
        .insert({
          user_id: authData.user.id,
          tenant_id: user.tenantId,
          role: user.role || 'employee',
          is_active: true,
        });

      if (linkError && !linkError.message.includes('duplicate')) {
        console.warn(`Failed to link user ${user.email} to tenant:`, linkError.message);
      }
    } catch (error) {
      console.warn(`Error setting up user ${user.email}:`, error);
    }
  }
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(): Promise<void> {
  const adminClient = createAdminClient();

  // Delete test data from backup tables
  const tablesToClean = [
    'backup_pitr_rollback_history',
    'backup_pitr_snapshots',
    'backup_restore_logs',
    'backup_recovery_tests',
    'backup_health_monitoring',
    'backup_disaster_recovery_plans',
    'backup_jobs',
  ];

  for (const table of tablesToClean) {
    try {
      await adminClient
        .from(table)
        .delete()
        .in('tenant_id', TEST_TENANTS.map(t => t.id));
    } catch (error) {
      console.warn(`Failed to clean ${table}:`, error);
    }
  }
}

/**
 * Get current user's tenant ID
 */
export async function getUserTenantId(client: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await client.auth.getUser();
  
  if (!user) return null;

  const { data } = await client
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  return data?.tenant_id || null;
}
