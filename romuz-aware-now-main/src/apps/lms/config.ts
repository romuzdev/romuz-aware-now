/**
 * LMS App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  Award,
  BarChart3,
  FileText,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * LMS App Module
 * 
 * Learning Management System - Training & Education Platform
 */
export const lmsApp: AppModule = {
  id: 'lms',
  name: 'LMS',
  nameAr: 'نظام التدريب',
  description: 'Learning Management System',
  icon: GraduationCap,
  route: '/lms',
  requiredPermission: 'lms.view' as any,
  color: 'hsl(var(--primary))',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '',
      icon: BarChart3,
      requiredPermission: 'lms.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'courses',
      name: 'Courses',
      nameAr: 'الدورات',
      route: '/courses',
      icon: BookOpen,
      requiredPermission: 'lms.courses.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'enrollments',
      name: 'Enrollments',
      nameAr: 'التسجيلات',
      route: '/enrollments',
      icon: Users,
      requiredPermission: 'lms.enrollments.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      nameAr: 'الاختبارات',
      route: '/assessments',
      icon: ClipboardCheck,
      requiredPermission: 'lms.assessments.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'certificates',
      name: 'Certificates',
      nameAr: 'الشهادات',
      route: '/certificates/templates',
      icon: Award,
      requiredPermission: 'lms.certificates.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'reports',
      name: 'Reports',
      nameAr: 'التقارير',
      route: '/reports',
      icon: FileText,
      requiredPermission: 'lms.reports.view' as any,
      showInSidebar: true,
      order: 6,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-16',
    owner: 'LMS Team',
  },
};

/**
 * Employee Portal App Module
 */
export const employeePortalApp: AppModule = {
  id: 'employee',
  name: 'Employee Portal',
  nameAr: 'منصة الموظف',
  description: 'Employee Learning Portal',
  icon: GraduationCap,
  route: '/employee',
  requiredPermission: 'employee.access' as any,
  color: 'hsl(var(--primary))',
  status: 'active',
  features: [
    {
      id: 'dashboard',
      name: 'Dashboard',
      nameAr: 'لوحة التحكم',
      route: '',
      icon: BarChart3,
      requiredPermission: 'employee.access' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'courses',
      name: 'Available Courses',
      nameAr: 'الدورات المتاحة',
      route: '/courses',
      icon: BookOpen,
      requiredPermission: 'employee.access' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'my-courses',
      name: 'My Courses',
      nameAr: 'دوراتي',
      route: '/my-courses',
      icon: GraduationCap,
      requiredPermission: 'employee.access' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'certificates',
      name: 'My Certificates',
      nameAr: 'شهاداتي',
      route: '/certificates',
      icon: Award,
      requiredPermission: 'employee.access' as any,
      showInSidebar: true,
      order: 4,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-16',
    owner: 'LMS Team',
  },
};
