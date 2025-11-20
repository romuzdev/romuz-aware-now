/**
 * M18: Incident Response System - App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  Shield,
  AlertTriangle,
  Activity,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Incident Response App Module
 * 
 * Security Incident Detection, Response & Management
 */
export const incidentResponseApp: AppModule = {
  id: 'incident-response',
  name: 'Incident Response',
  nameAr: 'الاستجابة للحوادث',
  description: 'Security Incident Detection & Response Management',
  icon: Shield,
  route: '/incident-response',
  requiredPermission: 'incidents.view' as any,
  color: 'hsl(0, 84%, 60%)', // Red
  status: 'active',
  features: [
    {
      id: 'incident-dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '/incident-response',
      icon: Activity,
      requiredPermission: 'incidents.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'incident-active',
      name: 'Active Incidents',
      nameAr: 'الحوادث النشطة',
      route: '/incident-response/active',
      icon: AlertTriangle,
      requiredPermission: 'incidents.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'incident-response-plans',
      name: 'Response Plans',
      nameAr: 'خطط الاستجابة',
      route: '/incident-response/plans',
      icon: FileText,
      requiredPermission: 'incidents.manage' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'incident-reports',
      name: 'Reports & Analytics',
      nameAr: 'التقارير والتحليلات',
      route: '/incident-response/reports',
      icon: BarChart3,
      requiredPermission: 'incidents.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'incident-settings',
      name: 'Settings',
      nameAr: 'الإعدادات',
      route: '/incident-response/settings',
      icon: Settings,
      requiredPermission: 'incidents.manage' as any,
      showInSidebar: true,
      order: 5,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-20',
    owner: 'SecOps Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const incidentResponseConfig = {
  id: incidentResponseApp.id,
  name: incidentResponseApp.name,
  nameAr: incidentResponseApp.nameAr,
  description: incidentResponseApp.description,
  version: incidentResponseApp.metadata?.version,
  status: incidentResponseApp.status,
};
