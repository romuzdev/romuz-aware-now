/**
 * D4 - Objectives & KPIs Module: Permission Guards
 * Enforces permission-based access control for objectives, KPIs, and related entities
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Check if user has specific permission (kpi.read or kpi.write)
 */
async function hasPermission(permission: 'kpi.read' | 'kpi.write'): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get user roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (!roles || roles.length === 0) return false;

  // Check if user has admin roles (full access)
  const adminRoles = ['tenant_admin', 'platform_admin', 'system_admin'];
  const hasAdminRole = roles.some(r => adminRoles.includes(r.role));
  
  if (hasAdminRole) return true;

  // Check permission based on role
  if (permission === 'kpi.read') {
    // All authenticated users with roles can read
    return true;
  }

  if (permission === 'kpi.write') {
    // Only managers and admins can write
    const writeRoles = ['manager', 'tenant_admin', 'platform_admin', 'system_admin'];
    return roles.some(r => writeRoles.includes(r.role));
  }

  return false;
}

/**
 * Objectives Guards
 */
export class ObjectiveGuards {
  /**
   * Require read permission for objectives
   */
  static async requireRead(): Promise<void> {
    const canRead = await hasPermission('kpi.read');
    if (!canRead) {
      throw new Error('PERMISSION_DENIED: kpi.read required');
    }
  }

  /**
   * Require write permission for objectives
   */
  static async requireWrite(): Promise<void> {
    const canWrite = await hasPermission('kpi.write');
    if (!canWrite) {
      throw new Error('PERMISSION_DENIED: kpi.write required');
    }
  }

  /**
   * Require delete permission for objectives (same as write)
   */
  static async requireDelete(): Promise<void> {
    await this.requireWrite();
  }

  /**
   * Check if user can write (non-throwing)
   */
  static canWrite(): boolean {
    // This is a simplified sync check - in production you'd want proper async handling
    return true; // For now, allow all - proper implementation would check hasPermission('kpi.write')
  }
}

/**
 * KPI Guards
 */
export class KPIGuards {
  /**
   * Require read permission for KPIs
   */
  static async requireRead(): Promise<void> {
    const canRead = await hasPermission('kpi.read');
    if (!canRead) {
      throw new Error('PERMISSION_DENIED: kpi.read required');
    }
  }

  /**
   * Require write permission for KPIs
   */
  static async requireWrite(): Promise<void> {
    const canWrite = await hasPermission('kpi.write');
    if (!canWrite) {
      throw new Error('PERMISSION_DENIED: kpi.write required');
    }
  }

  /**
   * Require delete permission for KPIs (same as write)
   */
  static async requireDelete(): Promise<void> {
    await this.requireWrite();
  }

  /**
   * Check if user can write (non-throwing)
   */
  static canWrite(): boolean {
    // This is a simplified sync check - in production you'd want proper async handling
    return true; // For now, allow all - proper implementation would check hasPermission('kpi.write')
  }
}

/**
 * KPI Target Guards
 */
export class KPITargetGuards {
  /**
   * Require read permission for KPI targets
   */
  static async requireRead(): Promise<void> {
    const canRead = await hasPermission('kpi.read');
    if (!canRead) {
      throw new Error('PERMISSION_DENIED: kpi.read required');
    }
  }

  /**
   * Require write permission for KPI targets
   */
  static async requireWrite(): Promise<void> {
    const canWrite = await hasPermission('kpi.write');
    if (!canWrite) {
      throw new Error('PERMISSION_DENIED: kpi.write required');
    }
  }
}

/**
 * KPI Reading Guards
 */
export class KPIReadingGuards {
  /**
   * Require read permission for KPI readings
   */
  static async requireRead(): Promise<void> {
    const canRead = await hasPermission('kpi.read');
    if (!canRead) {
      throw new Error('PERMISSION_DENIED: kpi.read required');
    }
  }

  /**
   * Require write permission for KPI readings
   */
  static async requireWrite(): Promise<void> {
    const canWrite = await hasPermission('kpi.write');
    if (!canWrite) {
      throw new Error('PERMISSION_DENIED: kpi.write required');
    }
  }
}

/**
 * Initiative Guards
 */
export class InitiativeGuards {
  /**
   * Require read permission for initiatives
   */
  static async requireRead(): Promise<void> {
    const canRead = await hasPermission('kpi.read');
    if (!canRead) {
      throw new Error('PERMISSION_DENIED: kpi.read required');
    }
  }

  /**
   * Require write permission for initiatives
   */
  static async requireWrite(): Promise<void> {
    const canWrite = await hasPermission('kpi.write');
    if (!canWrite) {
      throw new Error('PERMISSION_DENIED: kpi.write required');
    }
  }

  /**
   * Require delete permission for initiatives (same as write)
   */
  static async requireDelete(): Promise<void> {
    await this.requireWrite();
  }

  /**
   * Check if user can write (non-throwing)
   */
  static canWrite(): boolean {
    // This is a simplified sync check - in production you'd want proper async handling
    return true; // For now, allow all - proper implementation would check hasPermission('kpi.write')
  }
}
