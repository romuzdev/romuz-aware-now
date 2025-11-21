/**
 * M18.5: SecOps Integration - App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  Shield,
  Activity,
  Workflow,
  Link,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * SecOps App Module
 * 
 * Security Operations Center - SIEM, SOAR & Integration Platform
 */
export const secOpsApp: AppModule = {
  id: 'secops',
  name: 'SecOps',
  nameAr: 'عمليات الأمن',
  description: 'Security Operations Center - SIEM, SOAR & Integrations',
  icon: Shield,
  route: '/secops',
  requiredPermission: 'secops.view' as any,
  color: 'hsl(210, 100%, 50%)', // Blue
  status: 'active',
  features: [
    {
      id: 'secops-dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '/secops',
      icon: Activity,
      requiredPermission: 'secops.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'security-events',
      name: 'Security Events',
      nameAr: 'الأحداث الأمنية',
      route: '/secops/events',
      icon: Activity,
      requiredPermission: 'secops.events.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'soar-playbooks',
      name: 'SOAR Playbooks',
      nameAr: 'سيناريوهات SOAR',
      route: '/secops/playbooks',
      icon: Workflow,
      requiredPermission: 'secops.playbooks.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'connectors',
      name: 'Connectors',
      nameAr: 'الموصلات',
      route: '/secops/connectors',
      icon: Link,
      requiredPermission: 'secops.connectors.view' as any,
      showInSidebar: true,
      order: 4,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-21',
    owner: 'SecOps Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const secOpsConfig = {
  id: secOpsApp.id,
  name: secOpsApp.name,
  nameAr: secOpsApp.nameAr,
  description: secOpsApp.description,
  version: secOpsApp.metadata?.version,
  status: secOpsApp.status,
};
