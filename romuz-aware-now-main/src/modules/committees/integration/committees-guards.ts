/**
 * D3-M21: Committees RBAC Guards
 * Permission checks for committee operations
 */

import { supabase } from '@/integrations/supabase/client';
import { rolesHavePermission, fetchMyRoles, type Permission } from '@/core/rbac';

/**
 * Check if current user has permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const roles = await fetchMyRoles();
  return rolesHavePermission(roles, permission);
}

/**
 * Assert permission or throw error
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const hasPermission = await checkPermission(permission);
  
  if (!hasPermission) {
    throw new Error(`PERMISSION_DENIED: Required permission '${permission}'`);
  }
}

/**
 * Guards for Committee operations
 */
export const CommitteeGuards = {
  /**
   * Check if user can read committees
   */
  async canRead(): Promise<boolean> {
    return checkPermission('committee.read');
  },

  /**
   * Check if user can write (create/update) committees
   */
  async canWrite(): Promise<boolean> {
    return checkPermission('committee.write');
  },

  /**
   * Check if user can manage committees
   */
  async canManage(): Promise<boolean> {
    return checkPermission('committee.manage');
  },

  /**
   * Check if user can delete committees
   */
  async canDelete(): Promise<boolean> {
    return checkPermission('committee.delete');
  },

  /**
   * Require read permission or throw
   */
  async requireRead(): Promise<void> {
    return requirePermission('committee.read');
  },

  /**
   * Require write permission or throw
   */
  async requireWrite(): Promise<void> {
    return requirePermission('committee.write');
  },

  /**
   * Require manage permission or throw
   */
  async requireManage(): Promise<void> {
    return requirePermission('committee.manage');
  },

  /**
   * Require delete permission or throw
   */
  async requireDelete(): Promise<void> {
    return requirePermission('committee.delete');
  },
};

/**
 * Guards for Meeting operations
 */
export const MeetingGuards = {
  /**
   * Check if user can create meetings
   */
  async canCreate(): Promise<boolean> {
    return checkPermission('meeting.create');
  },

  /**
   * Check if user can manage meetings
   */
  async canManage(): Promise<boolean> {
    return checkPermission('meeting.manage');
  },

  /**
   * Check if user can close meetings
   */
  async canClose(): Promise<boolean> {
    return checkPermission('meeting.close');
  },

  /**
   * Require create permission or throw
   */
  async requireCreate(): Promise<void> {
    return requirePermission('meeting.create');
  },

  /**
   * Require manage permission or throw
   */
  async requireManage(): Promise<void> {
    return requirePermission('meeting.manage');
  },

  /**
   * Require close permission or throw
   */
  async requireClose(): Promise<void> {
    return requirePermission('meeting.close');
  },
};

/**
 * Guards for Decision operations
 */
export const DecisionGuards = {
  /**
   * Check if user can create decisions
   */
  async canCreate(): Promise<boolean> {
    return checkPermission('decision.create');
  },

  /**
   * Require create permission or throw
   */
  async requireCreate(): Promise<void> {
    return requirePermission('decision.create');
  },
};

/**
 * Guards for Followup operations
 */
export const FollowupGuards = {
  /**
   * Check if user can manage followups
   */
  async canManage(): Promise<boolean> {
    return checkPermission('followup.manage');
  },

  /**
   * Require manage permission or throw
   */
  async requireManage(): Promise<void> {
    return requirePermission('followup.manage');
  },
};
