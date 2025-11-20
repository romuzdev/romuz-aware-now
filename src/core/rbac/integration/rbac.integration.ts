// Gate-F: RBAC Integration Layer
// Gate-U: Extended with persona-based roles
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type AppRole = 
  | 'platform_admin'
  | 'platform_support'
  | 'super_admin'
  | 'tenant_admin'
  | 'tenant_manager'
  | 'tenant_employee'
  | 'awareness_manager'
  | 'risk_manager'
  | 'compliance_officer'
  | 'hr_manager'
  | 'it_manager'
  | 'executive'
  | 'employee'
  // Legacy roles (kept for backward compatibility)
  | 'admin'
  | 'analyst'
  | 'manager'
  | 'viewer';

// Check if user has specific role (calls security definer function)
export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    logger.error('Error checking role:', error);
    return false;
  }

  return data ?? false;
}

// Get all roles for a user
export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.rpc('get_user_roles', {
    _user_id: userId,
  });

  if (error) {
    logger.error('Error fetching roles:', error);
    return [];
  }

  return (data ?? []).map((r: any) => r.role as AppRole);
}

// Fetch user_roles from table directly (for current user only - RLS enforced)
export async function fetchMyRoles(): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role');

  if (error) {
    logger.error('Error fetching my roles:', error);
    return [];
  }

  return (data ?? []).map(r => r.role as AppRole);
}

// RBAC permission mapping
export const PERMISSIONS = {
  // Legacy permissions (backward compatibility)
  'view_reports': ['admin', 'analyst', 'manager', 'tenant_admin', 'executive'],
  'export_reports': ['admin', 'analyst', 'tenant_admin'],
  'campaigns.manage': ['admin', 'manager', 'tenant_admin', 'awareness_manager'],
  'campaigns.view': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'awareness_manager', 'employee'],
  'manage_campaigns': ['admin', 'manager', 'tenant_admin', 'awareness_manager'],
  'view_campaigns': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'awareness_manager', 'employee'],
  'manage_policies': ['admin', 'tenant_admin', 'compliance_officer'],
  'view_policies': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'employee'],
  'manage_users': ['admin', 'tenant_admin', 'hr_manager'],
  'view_audit': ['admin', 'analyst', 'tenant_admin'],
  'documents.create': ['admin', 'manager', 'tenant_admin', 'compliance_officer'],
  'documents.view': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'employee'],
  'documents.manage': ['admin', 'tenant_admin', 'compliance_officer'],
  'documents.delete': ['admin', 'tenant_admin'],
  'awareness.insights.view': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'awareness_manager', 'executive'],
  
  // M21: Committees Module Permissions
  'committee.read': ['platform_admin', 'platform_support', 'admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'executive', 'employee'],
  'committee.write': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'committee.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer'],
  'committee.delete': ['platform_admin', 'admin', 'tenant_admin'],
  'meeting.create': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'meeting.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'meeting.close': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer'],
  'decision.create': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'followup.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager', 'employee'],
  
  // M22: Objectives & KPIs Module Permissions
  'objective.read': ['platform_admin', 'platform_support', 'admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'executive', 'employee'],
  'objective.write': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'objective.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer'],
  'objective.delete': ['platform_admin', 'admin', 'tenant_admin'],
  'kpi.read': ['platform_admin', 'platform_support', 'admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'executive', 'employee'],
  'kpi.write': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'kpi.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer'],
  'kpi.delete': ['platform_admin', 'admin', 'tenant_admin'],
  'initiative.read': ['platform_admin', 'platform_support', 'admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'compliance_officer', 'executive', 'employee'],
  'initiative.write': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer', 'manager'],
  'initiative.manage': ['platform_admin', 'admin', 'tenant_admin', 'compliance_officer'],
  'initiative.delete': ['platform_admin', 'admin', 'tenant_admin'],
  
  // Platform Console
  'platform.admin': ['platform_admin', 'super_admin'],
  'platform.support': ['platform_admin', 'platform_support', 'super_admin'],
  'platform.tenants.manage': ['platform_admin', 'super_admin'],
  'platform.users.manage': ['platform_admin', 'super_admin'],
  'platform.settings.manage': ['platform_admin', 'super_admin'],
  
  
  // Assessment
  'assessment.view': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'assessment.create': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'assessment.edit': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'assessment.delete': ['platform_admin', 'tenant_admin'],
  
  // LMS / Training
  'training.view': ['platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_employee'],
  'training.manage': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'training.create': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'training.edit': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'training.delete': ['platform_admin', 'tenant_admin'],
  
  // LMS Courses
  'courses.view': ['platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_employee'],
  'courses.manage': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'courses.create': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'courses.edit': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'courses.delete': ['platform_admin', 'tenant_admin'],
  'courses.publish': ['platform_admin', 'tenant_admin'],
  
  // LMS Enrollments
  'enrollments.view': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'enrollments.manage': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'enrollments.create': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'enrollments.delete': ['platform_admin', 'tenant_admin'],
  
  // LMS Student
  'student.view_courses': ['platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_employee'],
  'student.enroll': ['tenant_employee'],
  'student.take_assessment': ['tenant_employee'],
  'student.view_certificates': ['platform_admin', 'tenant_admin', 'tenant_manager', 'tenant_employee'],
  
  // LMS Instructor
  'instructor.view': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'instructor.manage_courses': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  
  // LMS Reports
  'reports.view': ['platform_admin', 'tenant_admin', 'tenant_manager'],
  'reports.export': ['platform_admin', 'tenant_admin'],
  
  // Awareness App
  'awareness.campaigns.view': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'awareness_manager', 'employee'],
  'awareness.campaigns.create': ['admin', 'manager', 'tenant_admin', 'awareness_manager'],
  'awareness.campaigns.manage': ['admin', 'tenant_admin', 'awareness_manager'],
  'awareness.insights.view2': ['admin', 'analyst', 'manager', 'viewer', 'tenant_admin', 'awareness_manager', 'executive'],
  
  // M14: Unified KPI Dashboard
  'unified_dashboard.view': ['platform_admin', 'platform_support', 'admin', 'tenant_admin', 'executive', 'manager', 'analyst'],
  'unified_dashboard.export': ['platform_admin', 'admin', 'tenant_admin', 'executive', 'manager'],
  'unified_dashboard.manage': ['platform_admin', 'admin', 'tenant_admin'],
  'awareness.impact.view': ['admin', 'analyst', 'tenant_admin', 'awareness_manager', 'executive'],
  'awareness.impact.manage': ['admin', 'tenant_admin', 'awareness_manager'],
  
  // M15: Integrations Framework Permissions
  'integrations.view': ['platform_admin', 'tenant_admin', 'it_manager', 'manager'],
  'integrations.manage': ['platform_admin', 'tenant_admin', 'it_manager'],
  'integrations.webhooks.manage': ['platform_admin', 'tenant_admin', 'it_manager'],
  'integrations.api_keys.manage': ['platform_admin', 'tenant_admin', 'it_manager'],
  'integrations.logs.view': ['platform_admin', 'tenant_admin', 'it_manager', 'manager'],
  
  // Gate-U: Persona-based route permissions
  'route.user': ['employee', 'awareness_manager', 'risk_manager', 'compliance_officer', 'hr_manager', 'it_manager', 'executive', 'tenant_admin', 'super_admin'],
  'route.awareness': ['awareness_manager', 'tenant_admin', 'super_admin'],
  'route.risk': ['risk_manager', 'tenant_admin', 'super_admin'],
  'route.admin': ['tenant_admin', 'super_admin'],
  'route.executive': ['executive', 'tenant_admin', 'super_admin'],
  'route.hr': ['hr_manager', 'tenant_admin', 'super_admin'],
  'route.it': ['it_manager', 'tenant_admin', 'super_admin'],
  'route.compliance': ['compliance_officer', 'tenant_admin', 'super_admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if roles have specific permission
export function rolesHavePermission(roles: AppRole[], permission: string): boolean {
  if (!roles || roles.length === 0) return false;
  
  const allowedRoles = PERMISSIONS[permission as Permission] as readonly string[] | undefined;
  if (!allowedRoles) return false;
  
  return roles.some(role => allowedRoles.includes(role));
}

// Get all permissions for given roles
export function getPermissionsForRoles(roles: AppRole[]): Permission[] {
  if (!roles || roles.length === 0) return [];
  
  return Object.keys(PERMISSIONS).filter(permission => 
    rolesHavePermission(roles, permission)
  ) as Permission[];
}

// User with roles type
export interface UserWithRoles {
  user_id: string;
  email: string;
  full_name: string | null;
  tenant_name: string | null;
  roles: AppRole[];
}

// Get all users with their roles
export async function getUsersWithRoles(): Promise<UserWithRoles[]> {
  const { data, error } = await supabase.rpc('get_users_with_roles');

  if (error) {
    console.error('Error fetching users with roles:', error);
    throw error;
  }

  return data || [];
}

// Assign role to user
export async function assignRole(userId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc('assign_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
}

// Remove role from user
export async function removeRole(userId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc('remove_role', {
    _user_id: userId,
    _role: role,
  });

  if (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}

// Get role statistics
export async function getRoleStats() {
  const { data, error } = await supabase.rpc('get_role_stats');

  if (error) {
    console.error('Error fetching role stats:', error);
    throw error;
  }

  return data || [];
}

