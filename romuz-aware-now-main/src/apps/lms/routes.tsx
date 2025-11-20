import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import LMSLayout from './components/layout/LMSLayout';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrapper to add Suspense AND Layout to lazy components
const withLayout = (Component: React.LazyExoticComponent<() => JSX.Element>) => (
  <LMSLayout>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </LMSLayout>
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

export const lmsRoutes: RouteObject[] = [
  {
    path: '/admin/lms',
    element: withLayout(AdminDashboardPage),
  },
  {
    path: '/admin/lms/courses',
    element: withLayout(CoursesListPage),
  },
  {
    path: '/admin/lms/courses/new',
    element: withLayout(CourseFormPage),
  },
  {
    path: '/admin/lms/courses/:id',
    element: withLayout(CourseDetailsPage),
  },
  {
    path: '/admin/lms/courses/:id/edit',
    element: withLayout(CourseFormPage),
  },
  {
    path: '/admin/lms/courses/:id/builder',
    element: withLayout(CourseBuilderPage),
  },
  {
    path: '/admin/lms/enrollments',
    element: withLayout(EnrollmentsManagementPage),
  },
  {
    path: '/admin/lms/assessments',
    element: withLayout(AssessmentsListPage),
  },
  {
    path: '/admin/lms/assessments/:id/builder',
    element: withLayout(AssessmentBuilderPage),
  },
  {
    path: '/admin/lms/certificates/templates',
    element: withLayout(CertificateTemplatesPage),
  },
  {
    path: '/admin/lms/reports',
    element: withLayout(ReportsPage),
  },
  {
    path: '/admin/lms/instructor',
    element: withLayout(InstructorCoursesPage),
  },
  {
    path: '/employee',
    element: withLayout(EmployeeDashboardPage),
  },
  {
    path: '/employee/courses',
    element: withLayout(EmployeeCoursesPage),
  },
  {
    path: '/employee/my-courses',
    element: withLayout(MyCoursesPage),
  },
  {
    path: '/employee/courses/:id/play',
    element: withLayout(CoursePlayerPage),
  },
  {
    path: '/employee/courses/:courseId',
    element: withLayout(CourseViewPage),
  },
  {
    path: '/employee/assessments/:id/take',
    element: withLayout(TakeAssessmentPage),
  },
  {
    path: '/employee/certificates',
    element: withLayout(MyCertificatesPage),
  },
  {
    path: '/employee/my-certificates',
    element: withLayout(CertificatesPage),
  },
];
