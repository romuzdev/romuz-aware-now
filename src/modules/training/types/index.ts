/**
 * LMS Types - Barrel Export
 */

// Base Types
export * from './category.types';
export * from './course.types';
export * from './module.types';
export * from './lesson.types';
export * from './resource.types';
export * from './enrollment.types';
export * from './progress.types';
export * from './assessment.types';
export * from './certificate.types';

// Validation Schemas (with namespace to avoid conflicts)
export * as CourseValidation from './course.types.validation';
export * as EnrollmentValidation from './enrollment.types.validation';
export * as LessonValidation from './lesson.types.validation';
export * as AssessmentValidation from './assessment.types.validation';
export * as ModuleValidation from './module.types.validation';
export * as ProgressValidation from './progress.types.validation';
export * as CertificateValidation from './certificate.types.validation';
export * as ResourceValidation from './resource.types.validation';
