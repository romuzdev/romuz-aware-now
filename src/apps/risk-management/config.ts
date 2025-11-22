/**
 * Risk Management App Configuration
 * 
 * Complete app module definition for Risk Management Platform
 */

import {
  AlertTriangle,
  Shield,
  BarChart3,
  TrendingUp,
  Activity,
  FileText,
  Building2,
  FileSearch,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Risk Management App Module
 * 
 * Comprehensive Risk Management Platform
 */
export const riskManagementApp: AppModule = {
  id: 'risk-management',
  name: 'Risk Management',
  nameAr: 'إدارة المخاطر',
  description: 'Comprehensive Risk Management Platform',
  icon: AlertTriangle,
  route: '/risk',
  requiredPermission: 'risk.view' as any,
  color: 'hsl(0, 84%, 60%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Risk Dashboard',
      nameAr: 'لوحة المخاطر',
      route: '/dashboard',
      icon: Shield,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 0,
    },
    {
      id: 'register',
      name: 'Risk Register',
      nameAr: 'سجل المخاطر',
      route: '/register',
      icon: AlertTriangle,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'analytics',
      name: 'Risk Analytics',
      nameAr: 'تحليلات المخاطر',
      route: '/analytics',
      icon: BarChart3,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'heatmap',
      name: 'Risk Heatmap',
      nameAr: 'خريطة المخاطر الحرارية',
      route: '/heatmap',
      icon: Activity,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'trends',
      name: 'Risk Trends',
      nameAr: 'اتجاهات المخاطر',
      route: '/trends',
      icon: TrendingUp,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'reports',
      name: 'Risk Reports',
      nameAr: 'تقارير المخاطر',
      route: '/reports',
      icon: FileText,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'vendors',
      name: 'Third-Party Vendors',
      nameAr: 'الموردون والأطراف الثالثة',
      route: '/vendors',
      icon: Building2,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 6,
    },
    {
      id: 'assessments',
      name: 'Vendor Risk Assessments',
      nameAr: 'تقييمات مخاطر الموردين',
      route: '/assessments',
      icon: FileSearch,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 7,
    },
    {
      id: 'contracts',
      name: 'Vendor Contracts',
      nameAr: 'عقود الموردين',
      route: '/contracts',
      icon: FileText,
      requiredPermission: 'risk.view' as any,
      showInSidebar: true,
      order: 8,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-22',
    owner: 'Risk Management Team',
  },
};
