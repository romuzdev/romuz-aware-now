/**
 * App Registry
 * 
 * Central registry for all applications available on the platform
 */

import {
  GraduationCap,
  Fish,
  Shield,
  Scale,
  AlertTriangle,
  TrendingUp,
  Target as TargetIcon,
  FileText,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { AppModule } from './types';
import { awarenessApp } from '@/apps/awareness/config';
import { adminApp } from '@/apps/admin/config-admin';
import { grcApp } from '@/apps/admin/config-grc';
import { auditApp } from '@/apps/admin/config-audit';
import { lmsApp, employeePortalApp } from '@/apps/lms/config';
import { knowledgeHubApp } from '@/apps/knowledge-hub/config';
import { incidentResponseApp } from '@/apps/incident-response/config';
import { predictiveAnalyticsApp } from '@/apps/predictive-analytics/config';
import { threatIntelligenceApp } from '@/apps/threat-intelligence/config';
import { secOpsApp } from '@/apps/secops/config';

/**
 * App Registry - All available apps on the platform
 * 
 * Apps are organized by their status:
 * - active: Fully functional and available
 * - beta: In testing, available with known limitations
 * - coming_soon: Planned but not yet available
 * - deprecated: Being phased out
 */
export const APP_REGISTRY: AppModule[] = [
  // Active Apps
  awarenessApp,
  adminApp,
  grcApp,
  auditApp,
  lmsApp,
  employeePortalApp,
  knowledgeHubApp,
  incidentResponseApp,
  predictiveAnalyticsApp,
  threatIntelligenceApp,
  secOpsApp,
  
  // Coming Soon Apps
  {
    id: 'phishing',
    name: 'Phishing Simulation',
    nameAr: 'محاكاة التصيد',
    description: 'Phishing Attack Simulation & Testing',
    icon: Fish,
    route: '/app/phishing',
    requiredPermission: 'app.phishing.access',
    color: 'hsl(0, 70%, 50%)',
    status: 'coming_soon',
    features: [],
    metadata: {
      version: '1.0',
      lastUpdated: '2025-11-14',
      owner: 'Security Team',
    },
  },
];

/**
 * Get all apps
 */
export function getAllApps(): AppModule[] {
  return APP_REGISTRY;
}

/**
 * Get app by ID
 */
export function getAppById(id: string): AppModule | undefined {
  return APP_REGISTRY.find(app => app.id === id);
}

/**
 * Get active apps only
 */
export function getActiveApps(): AppModule[] {
  return APP_REGISTRY.filter(app => app.status === 'active');
}

/**
 * Get apps by status
 */
export function getAppsByStatus(status: AppModule['status']): AppModule[] {
  return APP_REGISTRY.filter(app => app.status === status);
}

/**
 * Check if app is available
 */
export function isAppAvailable(appId: string): boolean {
  const app = getAppById(appId);
  return app ? app.status === 'active' : false;
}

/**
 * Get app features by app ID
 */
export function getAppFeatures(appId: string) {
  const app = getAppById(appId);
  return app?.features || [];
}

/**
 * Get visible sidebar features for an app
 */
export function getSidebarFeatures(appId: string) {
  return getAppFeatures(appId)
    .filter(feature => feature.showInSidebar)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}
