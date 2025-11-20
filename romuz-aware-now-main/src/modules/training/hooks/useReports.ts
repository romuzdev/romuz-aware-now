import { useQuery } from '@tanstack/react-query';
import { 
  fetchStudentProgressReports,
  fetchCourseAnalytics,
  fetchAssessmentReports,
  fetchCertificateStats,
  fetchOverallStats
} from '../integration';

export const reportKeys = {
  all: ['reports'] as const,
  studentProgress: (filters?: any) => [...reportKeys.all, 'student-progress', filters] as const,
  courseAnalytics: (courseId?: string) => [...reportKeys.all, 'course-analytics', courseId] as const,
  assessmentReports: (assessmentId?: string) => [...reportKeys.all, 'assessment-reports', assessmentId] as const,
  certificateStats: () => [...reportKeys.all, 'certificate-stats'] as const,
  overallStats: () => [...reportKeys.all, 'overall-stats'] as const,
};

export function useStudentProgressReports(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: reportKeys.studentProgress(filters),
    queryFn: () => fetchStudentProgressReports(filters),
  });
}

export function useCourseAnalytics(courseId?: string) {
  return useQuery({
    queryKey: reportKeys.courseAnalytics(courseId),
    queryFn: () => fetchCourseAnalytics(courseId),
  });
}

export function useAssessmentReports(assessmentId?: string) {
  return useQuery({
    queryKey: reportKeys.assessmentReports(assessmentId),
    queryFn: () => fetchAssessmentReports(assessmentId),
  });
}

export function useCertificateStats() {
  return useQuery({
    queryKey: reportKeys.certificateStats(),
    queryFn: fetchCertificateStats,
  });
}

export function useOverallStats() {
  return useQuery({
    queryKey: reportKeys.overallStats(),
    queryFn: fetchOverallStats,
  });
}
