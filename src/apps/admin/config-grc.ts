/**
 * GRC App Configuration
 * 
 * Complete app module definition for Governance, Risk & Compliance
 */

import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  BarChart3,
  Bell,
  Zap,
  TrendingUp,
  Settings,
  ListTodo,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * GRC App Module
 * 
 * Governance, Risk & Compliance Management Platform
 */
export const grcApp: AppModule = {
  id: 'grc',
  name: 'GRC Platform',
  nameAr: 'إدارة المخاطر والامتثال',
  description: 'Governance, Risk & Compliance Management',
  icon: Shield,
  route: '/grc',
  requiredPermission: 'grc.view' as any,
  color: 'hsl(270, 70%, 50%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '/dashboard',
      icon: Shield,
      requiredPermission: 'grc.view' as any,
      showInSidebar: true,
      order: 0,
    },
    {
      id: 'risks',
      name: 'Risk Register',
      nameAr: 'سجل المخاطر',
      route: '/risks',
      icon: AlertTriangle,
      requiredPermission: 'grc.risks.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'controls',
      name: 'Control Library',
      nameAr: 'مكتبة الضوابط',
      route: '/controls',
      icon: CheckCircle2,
      requiredPermission: 'grc.controls.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'controls-dashboard',
      name: 'Control Dashboard',
      nameAr: 'لوحة الضوابط',
      route: '/controls-dashboard',
      icon: BarChart3,
      requiredPermission: 'grc.controls.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'compliance',
      name: 'Compliance Dashboard',
      nameAr: 'لوحة الامتثال',
      route: '/compliance',
      icon: FileCheck,
      requiredPermission: 'grc.compliance.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'frameworks',
      name: 'Frameworks',
      nameAr: 'الأطر التنظيمية',
      route: '/frameworks',
      icon: Shield,
      requiredPermission: 'grc.compliance.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'requirements',
      name: 'Requirements',
      nameAr: 'المتطلبات',
      route: '/requirements',
      icon: FileCheck,
      requiredPermission: 'grc.compliance.view' as any,
      showInSidebar: true,
      order: 6,
    },
    {
      id: 'gaps',
      name: 'Compliance Gaps',
      nameAr: 'فجوات الامتثال',
      route: '/gaps',
      icon: AlertTriangle,
      requiredPermission: 'grc.compliance.view' as any,
      showInSidebar: true,
      order: 7,
    },
    {
      id: 'reports',
      name: 'Reports',
      nameAr: 'التقارير',
      route: '/reports',
      icon: BarChart3,
      requiredPermission: 'grc.reports.view' as any,
      showInSidebar: true,
      order: 8,
    },
    {
      id: 'documents',
      name: 'Documents',
      nameAr: 'المستندات',
      route: '/grc/documents',
      icon: FileCheck,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 9,
    },
    {
      id: 'actions',
      name: 'Action Plans',
      nameAr: 'خطط العمل',
      route: '/actions',
      icon: ListTodo,
      requiredPermission: 'grc.actions.view' as any,
      showInSidebar: true,
      order: 10,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-16',
    owner: 'GRC Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const grcConfig = {
  id: grcApp.id,
  name: grcApp.name,
  nameAr: grcApp.nameAr,
  description: grcApp.description,
  version: grcApp.metadata?.version,
  status: grcApp.status,
};
