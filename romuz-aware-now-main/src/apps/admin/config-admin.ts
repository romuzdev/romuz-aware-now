/**
 * Admin App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  Settings,
  FileText,
  Shield,
  Activity,
  Bell,
  Workflow,
  Users,
  BarChart3,
  Database,
  Folder,
  List,
  Link,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Admin App Module
 * 
 * System Administration & Configuration Platform
 */
export const adminApp: AppModule = {
  id: 'admin',
  name: 'Admin',
  nameAr: 'الإدارة',
  description: 'System Administration & Configuration',
  icon: Settings,
  route: '/platform',
  requiredPermission: 'admin.access' as any,
  color: 'hsl(280, 70%, 50%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '',
      icon: BarChart3,
      requiredPermission: 'admin.access' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'users',
      name: 'Users',
      nameAr: 'المستخدمون',
      route: '/users',
      icon: Users,
      requiredPermission: 'users.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'access-matrix',
      name: 'Access Control',
      nameAr: 'الصلاحيات',
      route: '/access-matrix',
      icon: Shield,
      requiredPermission: 'admin.access' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'audit-log',
      name: 'Audit Log',
      nameAr: 'سجل المراجعة',
      route: '/audit-log',
      icon: FileText,
      requiredPermission: 'audit.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'documents',
      name: 'Documents',
      nameAr: 'المستندات',
      route: '/documents',
      icon: FileText,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'alerts',
      name: 'Alerts',
      nameAr: 'التنبيهات',
      route: '/alerts',
      icon: Bell,
      requiredPermission: 'alerts.view' as any,
      showInSidebar: true,
      order: 6,
    },
    {
      id: 'automation',
      name: 'Automation',
      nameAr: 'الأتمتة',
      route: '/automation',
      icon: Workflow,
      requiredPermission: 'automation.view' as any,
      showInSidebar: true,
      order: 7,
    },
    {
      id: 'health',
      name: 'System Health',
      nameAr: 'صحة النظام',
      route: '/health',
      icon: Activity,
      requiredPermission: 'admin.access' as any,
      showInSidebar: true,
      order: 8,
    },
    {
      id: 'reports',
      name: 'Reports',
      nameAr: 'التقارير',
      route: '/reports',
      icon: FileText,
      requiredPermission: 'reports.view' as any,
      showInSidebar: true,
      order: 9,
    },
    // Gate-M: Master Data Management
    {
      id: 'master-data',
      name: 'Master Data',
      nameAr: 'البيانات المرجعية',
      route: '/platform/master-data',
      icon: Database,
      requiredPermission: 'platform.master_data.view' as any,
      showInSidebar: true,
      order: 10,
    },
    // Gate-M15: Integrations Framework
    {
      id: 'integrations',
      name: 'Integrations',
      nameAr: 'التكاملات',
      route: '/platform/integrations',
      icon: Link,
      requiredPermission: 'integrations.view' as any,
      showInSidebar: true,
      order: 11,
    },
    // M14: Unified KPI Dashboard
    {
      id: 'unified-dashboard',
      name: 'Unified Dashboard',
      nameAr: 'لوحة القيادة الموحدة',
      route: '/platform/admin/unified-dashboard',
      icon: BarChart3,
      requiredPermission: 'unified_dashboard.view' as any,
      showInSidebar: true,
      order: 12,
    },
    // M23: Backup & Recovery
    {
      id: 'backup',
      name: 'Backup & Recovery',
      nameAr: 'النسخ الاحتياطي والاستعادة',
      route: '/platform/admin/backup',
      icon: Database,
      requiredPermission: 'admin.access' as any,
      showInSidebar: true,
      order: 13,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-17',
    owner: 'Platform Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const adminConfig = {
  id: adminApp.id,
  name: adminApp.name,
  nameAr: adminApp.nameAr,
  description: adminApp.description,
  version: adminApp.metadata?.version,
  status: adminApp.status,
};
