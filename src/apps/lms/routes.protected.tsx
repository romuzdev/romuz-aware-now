/**
 * LMS Protected Routes with RBAC
 * 
 * All LMS routes protected by permission checks
 */

import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleGuard } from '@/core/components/routing';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AdminDashboardPage = lazy(() => import('./pages/dashboard/AdminDashboardPage'));
const EmployeeDashboardPage = lazy(() => import('./pages/dashboard/EmployeeDashboardPage'));
const CoursesListPage = lazy(() => import('./pages/courses/CoursesListPage'));
const CourseFormPage = lazy(() => import('./pages/courses/CourseFormPage'));
const CourseDetailsPage = lazy(() => import('./pages/courses/CourseDetailsPage'));
const CourseBuilderPage = lazy(() => import('./pages/courses/CourseBuilderPage'));
const EnrollmentsManagementPage = lazy(() => import('./pages/enrollments/EnrollmentsManagementPage'));
const EmployeeCoursesPage = lazy(() => import('./pages/employee/EmployeeCoursesPage'));
const CoursePlayerPage = lazy(() => import('./pages/employee/CoursePlayerPage'));
const MyCoursesPage = lazy(() => import('./pages/employee/MyCoursesPage'));
const CourseViewPage = lazy(() => import('./pages/employee/CourseViewPage'));
const AssessmentsListPage = lazy(() => import('./pages/assessments/AssessmentsListPage'));
const AssessmentBuilderPage = lazy(() => import('./pages/assessments/AssessmentBuilderPage'));
const TakeAssessmentPage = lazy(() => import('./pages/assessments/TakeAssessmentPage'));
const MyCertificatesPage = lazy(() => import('./pages/certificates/MyCertificatesPage'));
const CertificatesPage = lazy(() => import('./pages/certificates/CertificatesPage'));
const CertificateTemplatesPage = lazy(() => import('./pages/certificates/CertificateTemplatesPage'));
const InstructorCoursesPage = lazy(() => import('./pages/instructor/InstructorCoursesPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));

export const lmsProtectedRoutes: RouteObject[] = [
  // Admin Routes - Require training.manage
  {
    path: '/admin/lms',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="training.manage">
          <AdminDashboardPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/courses',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="courses.view">
          <CoursesListPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/courses/new',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="courses.create">
          <CourseFormPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/courses/:id',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="courses.view">
          <CourseDetailsPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/courses/:id/edit',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="courses.edit">
          <CourseFormPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/courses/:id/builder',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="courses.edit">
          <CourseBuilderPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/enrollments',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="enrollments.manage">
          <EnrollmentsManagementPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/assessments',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="assessment.view">
          <AssessmentsListPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/assessments/:id/builder',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="assessment.create">
          <AssessmentBuilderPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/certificates/templates',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="training.manage">
          <CertificateTemplatesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/reports',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="reports.view">
          <ReportsPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/admin/lms/instructor',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission="instructor.view">
          <InstructorCoursesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  
  // Employee Routes - Require employee permissions
  {
    path: '/employee',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_courses" as any}>
          <EmployeeDashboardPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/courses',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_courses" as any}>
          <EmployeeCoursesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/my-courses',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_courses" as any}>
          <MyCoursesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/courses/:id/play',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_courses" as any}>
          <CoursePlayerPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/courses/:courseId',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_courses" as any}>
          <CourseViewPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/assessments/:id/take',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.take_assessment" as any}>
          <TakeAssessmentPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/certificates',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_certificates" as any}>
          <MyCertificatesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
  {
    path: '/employee/my-certificates',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RoleGuard requiredPermission={"employee.view_certificates" as any}>
          <CertificatesPage />
        </RoleGuard>
      </Suspense>
    ),
  },
];
