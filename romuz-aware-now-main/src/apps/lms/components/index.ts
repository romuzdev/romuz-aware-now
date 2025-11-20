/**
 * LMS Components - Barrel Export
 */

export { AdminSidebar } from './AdminSidebar';
export { EmployeeSidebar } from './EmployeeSidebar';

// Common
export * from './common/PermissionGate';

// Enrollments
export * from './enrollments/EnrollmentForm';
export * from './enrollments/EnrollmentsList';
export { default as BulkEnrollmentDialog } from './enrollments/BulkEnrollmentDialog';

// Progress
export * from './progress/ProgressCard';

// Dashboard
export * from './dashboard/StudentDashboardStats';

// Assessments
export * from './assessments/QuestionCard';
export * from './assessments/AssessmentTimer';

// Reports
export * from './reports/CourseReportCard';
export * from './reports/StudentPerformanceTable';

// Analytics
export * from './analytics/CompletionTrendChart';
export * from './analytics/AssessmentScoreDistribution';

// Certificates
export * from './certificates/CertificatePreview';
