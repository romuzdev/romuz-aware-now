/**
 * M20 - Threat Intelligence App Configuration
 */

import {
  Shield,
  Database,
  AlertTriangle,
  Activity,
  Settings,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

export const threatIntelligenceApp: AppModule = {
  id: 'threat-intelligence',
  name: 'Threat Intelligence',
  nameAr: 'ذكاء التهديدات',
  description: 'Threat intelligence feeds and IOC management',
  icon: Shield,
  route: '/app/threat-intelligence',
  requiredPermission: 'app.threat_intelligence.access',
  color: 'hsl(0, 70%, 50%)',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '/app/threat-intelligence',
      icon: Activity,
      requiredPermission: 'threat_intelligence.dashboard.view',
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'indicators',
      name: 'Indicators',
      nameAr: 'المؤشرات',
      route: '/app/threat-intelligence/indicators',
      icon: AlertTriangle,
      requiredPermission: 'threat_intelligence.indicators.view',
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'feeds',
      name: 'Feeds',
      nameAr: 'المصادر',
      route: '/app/threat-intelligence/feeds',
      icon: Database,
      requiredPermission: 'threat_intelligence.feeds.view',
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'matches',
      name: 'Matches',
      nameAr: 'التطابقات',
      route: '/app/threat-intelligence/matches',
      icon: Shield,
      requiredPermission: 'threat_intelligence.matches.view',
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'settings',
      name: 'Settings',
      nameAr: 'الإعدادات',
      route: '/app/threat-intelligence/settings',
      icon: Settings,
      requiredPermission: 'threat_intelligence.settings.manage',
      showInSidebar: true,
      order: 5,
    },
  ],
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-11-21',
    owner: 'Security Operations Team',
  },
};
