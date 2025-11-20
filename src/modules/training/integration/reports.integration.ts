/**
 * Reports Integration Layer
 */

import { supabase } from '@/integrations/supabase/client';

export interface StudentProgressReport {
  user_id: string;
  user_name: string;
  user_email: string;
  total_enrollments: number;
  completed_courses: number;
  in_progress_courses: number;
  average_progress: number;
  total_assessments: number;
  passed_assessments: number;
  average_score: number;
  certificates_earned: number;
}

export interface CourseAnalytics {
  course_id: string;
  course_name: string;
  course_code: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  completion_rate: number;
  average_progress: number;
  total_assessments: number;
  average_assessment_score: number;
  certificates_issued: number;
}

export interface AssessmentReport {
  assessment_id: string;
  assessment_title: string;
  course_name: string;
  total_attempts: number;
  passed_attempts: number;
  failed_attempts: number;
  pass_rate: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
}

export async function fetchStudentProgressReports(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<StudentProgressReport[]> {
  let query = supabase
    .from('lms_enrollments')
    .select(`
      user_id,
      status,
      progress_percentage,
      lms_courses!inner(id, name),
      lms_assessment_attempts!left(score, passed),
      lms_certificates!left(id)
    `);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('enrolled_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('enrolled_at', filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Group by user and aggregate
  const userMap = new Map<string, StudentProgressReport>();

  data?.forEach((enrollment: any) => {
    const userId = enrollment.user_id;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user_id: userId,
        user_name: 'User Name', // Would come from profiles
        user_email: 'user@example.com',
        total_enrollments: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        average_progress: 0,
        total_assessments: 0,
        passed_assessments: 0,
        average_score: 0,
        certificates_earned: 0,
      });
    }

    const report = userMap.get(userId)!;
    report.total_enrollments++;
    
    if (enrollment.status === 'completed') {
      report.completed_courses++;
    } else if (enrollment.status === 'in_progress') {
      report.in_progress_courses++;
    }

    report.average_progress += enrollment.progress_percentage || 0;
    report.certificates_earned += enrollment.lms_certificates?.length || 0;
  });

  return Array.from(userMap.values()).map(report => ({
    ...report,
    average_progress: report.total_enrollments > 0 
      ? report.average_progress / report.total_enrollments 
      : 0,
  }));
}

export async function fetchCourseAnalytics(courseId?: string): Promise<CourseAnalytics[]> {
  let query = supabase
    .from('lms_courses')
    .select(`
      id,
      name,
      code,
      lms_enrollments!inner(
        id,
        status,
        progress_percentage
      ),
      lms_assessments!inner(
        id,
        lms_assessment_attempts!inner(score)
      ),
      lms_certificates!inner(id)
    `)
    .eq('status', 'published');

  if (courseId) {
    query = query.eq('id', courseId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data?.map((course: any) => {
    const enrollments = course.lms_enrollments || [];
    const activeEnrollments = enrollments.filter((e: any) => e.status === 'in_progress');
    const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');
    const totalEnrollments = enrollments.length;
    
    const attempts = course.lms_assessments?.flatMap((a: any) => a.lms_assessment_attempts || []) || [];
    const totalScore = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);

    return {
      course_id: course.id,
      course_name: course.name,
      course_code: course.code,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments.length,
      completed_enrollments: completedEnrollments.length,
      completion_rate: totalEnrollments > 0 
        ? (completedEnrollments.length / totalEnrollments) * 100 
        : 0,
      average_progress: totalEnrollments > 0
        ? enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / totalEnrollments
        : 0,
      total_assessments: course.lms_assessments?.length || 0,
      average_assessment_score: attempts.length > 0 ? totalScore / attempts.length : 0,
      certificates_issued: course.lms_certificates?.length || 0,
    };
  }) || [];
}

export async function fetchAssessmentReports(assessmentId?: string): Promise<AssessmentReport[]> {
  let query = supabase
    .from('lms_assessments')
    .select(`
      id,
      title,
      lms_courses!inner(name),
      lms_assessment_attempts!inner(
        id,
        score,
        passed
      )
    `);

  if (assessmentId) {
    query = query.eq('id', assessmentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data?.map((assessment: any) => {
    const attempts = assessment.lms_assessment_attempts || [];
    const passedAttempts = attempts.filter((a: any) => a.passed);
    const failedAttempts = attempts.filter((a: any) => !a.passed);
    const scores = attempts.map((a: any) => a.score || 0);

    return {
      assessment_id: assessment.id,
      assessment_title: assessment.title,
      course_name: assessment.lms_courses?.name || '',
      total_attempts: attempts.length,
      passed_attempts: passedAttempts.length,
      failed_attempts: failedAttempts.length,
      pass_rate: attempts.length > 0 ? (passedAttempts.length / attempts.length) * 100 : 0,
      average_score: scores.length > 0 
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
        : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
    };
  }) || [];
}

export async function fetchCertificateStats() {
  const { data: totalCerts, error: totalError } = await supabase
    .from('lms_certificates')
    .select('id', { count: 'exact', head: true });

  const { data: activeCerts, error: activeError } = await supabase
    .from('lms_certificates')
    .select('id', { count: 'exact', head: true })
    .is('revoked_at', null);

  const { data: revokedCerts, error: revokedError } = await supabase
    .from('lms_certificates')
    .select('id', { count: 'exact', head: true })
    .not('revoked_at', 'is', null);

  if (totalError || activeError || revokedError) {
    throw totalError || activeError || revokedError;
  }

  return {
    total: totalCerts?.length || 0,
    active: activeCerts?.length || 0,
    revoked: revokedCerts?.length || 0,
  };
}

export async function fetchOverallStats() {
  const [courses, enrollments, assessments, certificates] = await Promise.all([
    supabase.from('lms_courses').select('id', { count: 'exact', head: true }),
    supabase.from('lms_enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('lms_assessments').select('id', { count: 'exact', head: true }),
    supabase.from('lms_certificates').select('id', { count: 'exact', head: true }),
  ]);

  return {
    total_courses: courses.count || 0,
    total_enrollments: enrollments.count || 0,
    total_assessments: assessments.count || 0,
    total_certificates: certificates.count || 0,
  };
}
