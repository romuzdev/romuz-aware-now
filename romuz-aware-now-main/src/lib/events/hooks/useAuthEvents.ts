/**
 * Authentication & Authorization Module - Event Integration Hook
 * 
 * Integration between Auth module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useAuthEvents() {
  const { publishEvent } = useEventBus();

  /**
   * User Logged In Event
   */
  const publishUserLoggedIn = useCallback(async (
    userId: string,
    loginData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_logged_in',
      event_category: 'auth',
      source_module: 'authentication',
      entity_type: 'user',
      entity_id: userId,
      priority: 'low',
      payload: {
        user_id: userId,
        login_method: loginData.method,
        ip_address: loginData.ip_address,
        device_type: loginData.device_type,
        logged_in_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Logged Out Event
   */
  const publishUserLoggedOut = useCallback(async (
    userId: string,
    logoutData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_logged_out',
      event_category: 'auth',
      source_module: 'authentication',
      entity_type: 'user',
      entity_id: userId,
      priority: 'low',
      payload: {
        user_id: userId,
        session_duration_minutes: logoutData.session_duration_minutes,
        logged_out_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * User Role Changed Event
   */
  const publishUserRoleChanged = useCallback(async (
    userId: string,
    roleData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'user_role_changed',
      event_category: 'auth',
      source_module: 'authentication',
      entity_type: 'user',
      entity_id: userId,
      priority: 'high',
      payload: {
        user_id: userId,
        previous_role: roleData.previous_role,
        new_role: roleData.new_role,
        changed_by: roleData.changed_by,
        changed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishUserLoggedIn,
    publishUserLoggedOut,
    publishUserRoleChanged,
  };
}
