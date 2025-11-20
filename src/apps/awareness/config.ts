/**
 * Awareness App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  Target,
  Megaphone,
  Users,
  BarChart3,
  FileText,
  Settings,
  ScrollText,
  UsersRound,
  TrendingUp,
  Plug,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Awareness App Module
 * 
 * Security Awareness Campaigns & Training Platform
 */
export const awarenessApp: AppModule = {
  id: 'awareness',
  name: 'Awareness',
  nameAr: 'التوعية الأمنية',
  description: 'Security Awareness Campaigns & Training',
  icon: Target,
  route: '/awareness',
  requiredPermission: 'campaigns.view' as any,
  color: 'hsl(var(--primary))',
  status: 'active',
  features: [
    {
      id: 'campaigns',
      name: 'Campaigns',
      nameAr: 'الحملات',
      route: '/awareness/campaigns',
      icon: Megaphone,
      requiredPermission: 'campaigns.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة المعلومات',
      route: '/awareness/dashboards',
      icon: BarChart3,
      requiredPermission: 'campaigns.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'participants',
      name: 'Participants',
      nameAr: 'المشاركون',
      route: '/awareness/campaigns',
      icon: Users,
      requiredPermission: 'campaigns.view' as any,
      showInSidebar: false,
      order: 3,
    },
    {
      id: 'content',
      name: 'Content Hub',
      nameAr: 'مكتبة المحتوى',
      route: '/awareness/content',
      icon: FileText,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 4,
    },
    // D2 - Policies Module
    {
      id: 'policies',
      name: 'Policies',
      nameAr: 'السياسات',
      route: '/awareness/policies',
      icon: ScrollText,
      requiredPermission: 'policy.read' as any,
      showInSidebar: true,
      order: 5,
    },
    // D3 - Committees Module
    {
      id: 'committees',
      name: 'Committees',
      nameAr: 'اللجان',
      route: '/awareness/committees',
      icon: UsersRound,
      requiredPermission: 'committee.read' as any,
      showInSidebar: true,
      order: 6,
    },
    {
      id: 'committees-documents',
      name: 'Committee Documents',
      nameAr: 'مستندات اللجان',
      route: '/awareness/committees/documents',
      icon: FileText,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 6.5,
    },
    // D4 - Objectives & KPIs Module
    {
      id: 'objectives',
      name: 'Objectives',
      nameAr: 'الأهداف الاستراتيجية',
      route: '/awareness/objectives',
      icon: Target,
      requiredPermission: 'objective.read' as any,
      showInSidebar: true,
      order: 7,
    },
    {
      id: 'kpis',
      name: 'KPIs',
      nameAr: 'مؤشرات الأداء',
      route: '/awareness/kpis',
      icon: TrendingUp,
      requiredPermission: 'kpi.read' as any,
      showInSidebar: true,
      order: 8,
    },
    // M15 - Integrations Module
    {
      id: 'integrations',
      name: 'Integrations',
      nameAr: 'التكاملات',
      route: '/awareness/integrations',
      icon: Plug,
      requiredPermission: 'campaigns.view' as any,
      showInSidebar: true,
      order: 9,
    },
    {
      id: 'settings',
      name: 'Settings',
      nameAr: 'الإعدادات',
      route: '/awareness/settings',
      icon: Settings,
      requiredPermission: 'campaigns.manage' as any,
      showInSidebar: true,
      order: 10,
    },
  ],
  metadata: {
    version: '2.0',
    lastUpdated: '2025-11-14',
    owner: 'Awareness Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const awarenessConfig = {
  id: awarenessApp.id,
  name: awarenessApp.name,
  nameAr: awarenessApp.nameAr,
  description: awarenessApp.description,
  version: awarenessApp.metadata?.version,
  status: awarenessApp.status,
};
