/**
 * App Registry Hooks
 * 
 * React hooks for accessing the app registry
 */

import { useMemo } from 'react';
import { useCan } from '@/core/rbac';
import {
  getAllApps,
  getAppById,
  getActiveApps,
  getAppsByStatus,
  getSidebarFeatures,
} from '../registry';
import type { AppModule, AppFeature } from '../types';

/**
 * Get all apps available in the registry
 */
export function useAllApps(): AppModule[] {
  return useMemo(() => getAllApps(), []);
}

/**
 * Get active apps only
 */
export function useActiveApps(): AppModule[] {
  return useMemo(() => getActiveApps(), []);
}

/**
 * Get apps filtered by permission
 * Returns only apps the current user can access
 */
export function useAvailableApps(): AppModule[] {
  const can = useCan();
  const allApps = useAllApps();

  return useMemo(() => {
    return allApps.filter(app => {
      // Only show active apps
      if (app.status !== 'active') return false;
      
      // Check permission (with type casting for dynamic permissions)
      return can(app.requiredPermission as any);
    });
  }, [allApps, can]);
}

/**
 * Get a specific app by ID
 */
export function useApp(appId: string): AppModule | undefined {
  return useMemo(() => getAppById(appId), [appId]);
}

/**
 * Get features for a specific app
 */
export function useAppFeatures(appId: string): AppFeature[] {
  const app = useApp(appId);
  return useMemo(() => app?.features || [], [app]);
}

/**
 * Get sidebar features for a specific app
 * Filters by showInSidebar and sorts by order
 */
export function useSidebarFeatures(appId: string): AppFeature[] {
  const can = useCan();
  
  return useMemo(() => {
    const features = getSidebarFeatures(appId);
    
    // Filter by permission (with type casting for dynamic permissions)
    return features.filter(feature => can(feature.requiredPermission as any));
  }, [appId, can]);
}

/**
 * Get apps by status
 */
export function useAppsByStatus(status: AppModule['status']): AppModule[] {
  return useMemo(() => getAppsByStatus(status), [status]);
}

/**
 * Get coming soon apps
 */
export function useComingSoonApps(): AppModule[] {
  return useAppsByStatus('coming_soon');
}

/**
 * Get beta apps
 */
export function useBetaApps(): AppModule[] {
  return useAppsByStatus('beta');
}
