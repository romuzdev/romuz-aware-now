/**
 * Learning Management System (LMS) - Event Integration Hook
 * 
 * Integration between LMS and Event System
 * Handles: Courses, Enrollments, Progress, Assessments, Certificates
 */

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events/useEventBus';
import type { PublishEventParams } from '@/lib/events/event.types';

export function useLMSEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Course Published Event
   */
  const publishCoursePublished = useCallback(async (
    courseId: string,
    courseData: {
      title: string;
      category: string;
      duration_hours: number;
      instructor: string;
      is_mandatory: boolean;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'course_published',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'course',
      entity_id: courseId,
      priority: 'medium',
      payload: {
        course_id: courseId,
        title: courseData.title,
        category: courseData.category,
        duration_hours: courseData.duration_hours,
        instructor: courseData.instructor,
        is_mandatory: courseData.is_mandatory,
        published_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Student Enrolled Event
   */
  const publishStudentEnrolled = useCallback(async (
    enrollmentId: string,
    enrollmentData: {
      course_id: string;
      student_id: string;
      enrolled_by: string;
      enrollment_type: 'self' | 'mandatory' | 'assigned';
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'student_enrolled',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'enrollment',
      entity_id: enrollmentId,
      priority: 'low',
      payload: {
        enrollment_id: enrollmentId,
        course_id: enrollmentData.course_id,
        student_id: enrollmentData.student_id,
        enrolled_by: enrollmentData.enrolled_by,
        enrollment_type: enrollmentData.enrollment_type,
        enrolled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Course Progress Updated Event
   */
  const publishCourseProgressUpdated = useCallback(async (
    enrollmentId: string,
    progressData: {
      course_id: string;
      student_id: string;
      previous_progress: number;
      current_progress: number;
      completed_lessons: number;
      total_lessons: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'course_progress_updated',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'enrollment',
      entity_id: enrollmentId,
      priority: 'low',
      payload: {
        enrollment_id: enrollmentId,
        course_id: progressData.course_id,
        student_id: progressData.student_id,
        previous_progress: progressData.previous_progress,
        current_progress: progressData.current_progress,
        completed_lessons: progressData.completed_lessons,
        total_lessons: progressData.total_lessons,
        updated_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Assessment Completed Event
   */
  const publishAssessmentCompleted = useCallback(async (
    assessmentId: string,
    assessmentData: {
      course_id: string;
      student_id: string;
      score: number;
      max_score: number;
      passed: boolean;
      attempts: number;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'assessment_completed',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'assessment',
      entity_id: assessmentId,
      priority: 'medium',
      payload: {
        assessment_id: assessmentId,
        course_id: assessmentData.course_id,
        student_id: assessmentData.student_id,
        score: assessmentData.score,
        max_score: assessmentData.max_score,
        passed: assessmentData.passed,
        attempts: assessmentData.attempts,
        completed_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Certificate Issued Event
   */
  const publishCertificateIssued = useCallback(async (
    certificateId: string,
    certificateData: {
      course_id: string;
      student_id: string;
      certificate_number: string;
      issue_date: string;
      expiry_date?: string;
    }
  ) => {
    const params: PublishEventParams = {
      event_type: 'certificate_issued',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'certificate',
      entity_id: certificateId,
      priority: 'high',
      payload: {
        certificate_id: certificateId,
        course_id: certificateData.course_id,
        student_id: certificateData.student_id,
        certificate_number: certificateData.certificate_number,
        issue_date: certificateData.issue_date,
        expiry_date: certificateData.expiry_date,
        issued_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishCoursePublished,
    publishStudentEnrolled,
    publishCourseProgressUpdated,
    publishAssessmentCompleted,
    publishCertificateIssued,
  };
}
