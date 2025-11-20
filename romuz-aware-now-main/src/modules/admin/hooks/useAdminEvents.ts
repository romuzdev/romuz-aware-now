/**
 * Admin Module - Event Integration Hook
 * 
 * Integration between Admin module and Event System
 * Handles: Settings, Users, Roles, Permissions, System Config
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function useAdminEvents() {
  const { publishEvent } = useEventBus();

  /**
   * System Settings Updated Event
   */
  const publishSettingsUpdated = useCallback(async (
    settingsData: {
      category: string;
      settings: Record<string, any>;
      updated_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'settings_updated',
      event_category: 'admin',
      source_module: 'admin',
      entity_type: 'settings',
      entity_id: settingsData.category,
      priority: 'high',
      payload: {
        category: settingsData.category,
        changes: settingsData.settings,
        updated_by: settingsData.updated_by,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Account Created Event
   */
  const publishUserAccountCreated = useCallback(async (
    userId: string,
    userData: {
      email: string;
      role: string;
      department?: string;
      created_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_account_created',
      event_category: 'admin',
      source_module: 'admin',
      entity_type: 'user',
      entity_id: userId,
      priority: 'medium',
      payload: {
        user_id: userId,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        created_by: userData.created_by,
        created_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Role Assignment Changed Event
   */
  const publishRoleAssignmentChanged = useCallback(async (
    userId: string,
    roleData: {
      old_role: string;
      new_role: string;
      changed_by: string;
      reason?: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'role_assignment_changed',
      event_category: 'admin',
      source_module: 'admin',
      entity_type: 'user_role',
      entity_id: userId,
      priority: 'high',
      payload: {
        user_id: userId,
        old_role: roleData.old_role,
        new_role: roleData.new_role,
        changed_by: roleData.changed_by,
        reason: roleData.reason,
        changed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Permission Granted Event
   */
  const publishPermissionGranted = useCallback(async (
    permissionData: {
      user_id: string;
      permission_code: string;
      scope: string;
      granted_by: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'permission_granted',
      event_category: 'admin',
      source_module: 'admin',
      entity_type: 'permission',
      entity_id: `${permissionData.user_id}_${permissionData.permission_code}`,
      priority: 'medium',
      payload: {
        user_id: permissionData.user_id,
        permission_code: permissionData.permission_code,
        scope: permissionData.scope,
        granted_by: permissionData.granted_by,
        granted_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * System Health Alert Event
   */
  const publishSystemHealthAlert = useCallback(async (
    alertData: {
      alert_type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      component: string;
      message: string;
      metrics?: Record<string, any>;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'system_health_alert',
      event_category: 'admin',
      source_module: 'admin',
      entity_type: 'system_alert',
      entity_id: `alert_${Date.now()}`,
      priority: alertData.severity === 'critical' ? 'critical' : 'high',
      payload: {
        alert_type: alertData.alert_type,
        severity: alertData.severity,
        component: alertData.component,
        message: alertData.message,
        metrics: alertData.metrics,
        triggered_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishSettingsUpdated,
    publishUserAccountCreated,
    publishRoleAssignmentChanged,
    publishPermissionGranted,
    publishSystemHealthAlert,
  };
}
