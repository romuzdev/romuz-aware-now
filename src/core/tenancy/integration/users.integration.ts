/**
 * Gate-N: User Management Integration
 * Handles user-tenant link operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserWithTenant {
  user_id: string;
  email: string;
  user_created_at: string;
  tenant_id: string | null;
  tenant_name: string | null;
}

/**
 * Fetch all users with their tenant information
 */
export async function fetchUsersWithTenant(): Promise<UserWithTenant[]> {
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    throw authError;
  }

  // Get user-tenant mappings
  const { data: userTenants, error: utError } = await supabase
    .from('user_tenants')
    .select('user_id, tenant_id, tenants(name)');

  if (utError) {
    console.error('Error fetching user tenants:', utError);
    throw utError;
  }

  // Combine data
  const usersWithTenant = authUsers.users.map(user => {
    const userTenant = userTenants?.find(ut => ut.user_id === user.id);
    const tenant = userTenant?.tenants as any;
    return {
      user_id: user.id,
      email: user.email || '',
      user_created_at: user.created_at,
      tenant_id: userTenant?.tenant_id || null,
      tenant_name: tenant?.name || null,
    };
  });

  return usersWithTenant.sort((a, b) => 
    new Date(b.user_created_at).getTime() - new Date(a.user_created_at).getTime()
  );
}

/**
 * Update user-tenant link (tenant_admin only)
 */
export async function updateUserTenant(userId: string, newTenantId: string): Promise<void> {
  const { data, error } = await supabase.rpc('fn_admin_update_user_tenant', {
    p_user_id: userId,
    p_new_tenant_id: newTenantId,
  });

  if (error) {
    console.error('Error updating user tenant:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch all tenants for dropdown selection
 */
export async function fetchAllTenants() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, status')
    .order('name');

  if (error) {
    console.error('Error fetching tenants:', error);
    throw error;
  }

  return data || [];
}
