/**
 * Predictive Analytics App Configuration
 */

import {
  TrendingUp,
  LineChart,
  Brain,
  Target,
  Activity,
  Settings,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

export const predictiveAnalyticsApp: AppModule = {
  id: 'predictive-analytics',
  name: 'Predictive Analytics',
  nameAr: 'التحليلات التنبؤية',
  description: 'AI-powered predictive analytics for proactive decision making',
  icon: TrendingUp,
  route: '/app/predictive-analytics',
  requiredPermission: 'app.predictive_analytics.access',
  color: 'hsl(280, 70%, 50%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '/app/predictive-analytics',
      icon: LineChart,
      requiredPermission: 'predictive_analytics.dashboard.view',
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'predictions',
      name: 'Predictions',
      nameAr: 'التنبؤات',
      route: '/app/predictive-analytics/predictions',
      icon: Brain,
      requiredPermission: 'predictive_analytics.predictions.view',
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'models',
      name: 'Models',
      nameAr: 'النماذج',
      route: '/app/predictive-analytics/models',
      icon: Target,
      requiredPermission: 'predictive_analytics.models.view',
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'performance',
      name: 'Performance',
      nameAr: 'الأداء',
      route: '/app/predictive-analytics/performance',
      icon: Activity,
      requiredPermission: 'predictive_analytics.performance.view',
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'settings',
      name: 'Settings',
      nameAr: 'الإعدادات',
      route: '/app/predictive-analytics/settings',
      icon: Settings,
      requiredPermission: 'predictive_analytics.settings.manage',
      showInSidebar: true,
      order: 5,
    },
  ],
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-11-21',
    owner: 'Analytics Team',
  },
};
