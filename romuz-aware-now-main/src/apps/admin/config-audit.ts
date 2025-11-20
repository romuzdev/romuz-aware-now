/**
 * Audit App Configuration
 * 
 * Complete app module definition for Internal & External Audit Management
 */

import {
  FileCheck,
  ClipboardCheck,
  AlertCircle,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Audit App Module
 * 
 * Internal & External Audit Management Platform
 * M12: Complete audit workflow from planning to reporting
 */
export const auditApp: AppModule = {
  id: 'audit',
  name: 'Audit Management',
  nameAr: 'إدارة التدقيق',
  description: 'Internal & External Audit Management System',
  icon: FileCheck,
  route: '/audit',
  requiredPermission: 'audit.view' as any,
  color: 'hsl(200, 70%, 50%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Audit Dashboard',
      nameAr: 'لوحة التدقيق',
      route: '/dashboard',
      icon: BarChart3,
      requiredPermission: 'audit.view' as any,
      showInSidebar: true,
      order: 0,
    },
    {
      id: 'audits',
      name: 'Audit Plans',
      nameAr: 'خطط التدقيق',
      route: '/audits',
      icon: FileCheck,
      requiredPermission: 'audit.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'workflows',
      name: 'Audit Workflows',
      nameAr: 'سير عمل التدقيق',
      route: '/workflows',
      icon: TrendingUp,
      requiredPermission: 'audit.workflows.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'findings',
      name: 'Findings',
      nameAr: 'نتائج التدقيق',
      route: '/findings',
      icon: AlertCircle,
      requiredPermission: 'audit.findings.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'reports',
      name: 'Audit Reports',
      nameAr: 'تقارير التدقيق',
      route: '/reports',
      icon: FileText,
      requiredPermission: 'audit.reports.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'compliance-gaps',
      name: 'Compliance Gaps',
      nameAr: 'فجوات الامتثال',
      route: '/compliance-gaps',
      icon: AlertCircle,
      requiredPermission: 'audit.compliance.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'auditors',
      name: 'Auditors',
      nameAr: 'المدققون',
      route: '/auditors',
      icon: Users,
      requiredPermission: 'audit.auditors.view' as any,
      showInSidebar: true,
      order: 6,
    },
    {
      id: 'documents',
      name: 'Documents',
      nameAr: 'المستندات',
      route: '/audit/documents',
      icon: FileText,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 7,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-18',
    owner: 'Audit Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const auditConfig = {
  id: auditApp.id,
  name: auditApp.name,
  nameAr: auditApp.nameAr,
  description: auditApp.description,
  version: auditApp.metadata?.version,
  status: auditApp.status,
};
