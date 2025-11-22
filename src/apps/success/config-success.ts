/**
 * M25 - Success Toolkit App Configuration
 */

import { Target } from 'lucide-react';
import type { AppModule } from '@/core/config/types';

export const successAppConfig: AppModule = {
  id: 'success',
  name: 'Success Toolkit',
  nameAr: 'أدوات النجاح',
  description: 'Tenant success and health monitoring',
  icon: Target,
  route: '/success',
  requiredPermission: 'tenant.access',
  color: 'hsl(var(--chart-5))',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة المعلومات',
      route: '/success',
      icon: Target,
      requiredPermission: 'tenant.access',
      showInSidebar: true,
      order: 1,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-01-22',
  },
};
