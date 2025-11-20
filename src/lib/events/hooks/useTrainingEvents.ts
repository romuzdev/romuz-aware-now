/**
 * Training/LMS Module - Event Integration Hook
 * 
 * Integration between Training module and Event System
 */

import { useCallback } from 'react';
import { useEventBus } from '../useEventBus';
import type { PublishEventParams } from '../event.types';

export function useTrainingEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Course Created Event
   */
  const publishCourseCreated = useCallback(async (courseId: string, courseData: any) => {
    const params: PublishEventParams = {
      event_type: 'course_created',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'course',
      entity_id: courseId,
      priority: 'medium',
      payload: {
        course_title: courseData.title,
        category: courseData.category,
        duration_hours: courseData.duration_hours,
        difficulty_level: courseData.difficulty_level,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Enrollment Created Event
   */
  const publishEnrollmentCreated = useCallback(async (
    enrollmentId: string,
    courseId: string,
    userId: string,
    enrollmentData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'enrollment_created',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'enrollment',
      entity_id: enrollmentId,
      priority: 'low',
      payload: {
        course_id: courseId,
        user_id: userId,
        course_title: enrollmentData.course_title,
        enrolled_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Progress Updated Event
   */
  const publishProgressUpdated = useCallback(async (
    enrollmentId: string,
    progressData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'progress_updated',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'enrollment',
      entity_id: enrollmentId,
      priority: 'low',
      payload: {
        course_id: progressData.course_id,
        user_id: progressData.user_id,
        progress_percentage: progressData.progress_percentage,
        completed_modules: progressData.completed_modules,
        total_modules: progressData.total_modules,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Certificate Issued Event
   */
  const publishCertificateIssued = useCallback(async (
    certificateId: string,
    certificateData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'certificate_issued',
      event_category: 'training',
      source_module: 'lms',
      entity_type: 'certificate',
      entity_id: certificateId,
      priority: 'high',
      payload: {
        course_id: certificateData.course_id,
        user_id: certificateData.user_id,
        course_title: certificateData.course_title,
        issued_at: new Date().toISOString(),
        score: certificateData.score,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishCourseCreated,
    publishEnrollmentCreated,
    publishProgressUpdated,
    publishCertificateIssued,
  };
}
