/**
 * Test Data Management
 * 
 * Functions to seed and clear test data for Awareness app
 */

import { supabase } from './client';

export interface TestDataResponse {
  success: boolean;
  message: string;
  data?: Record<string, number>;
  deletedCount?: number;
  error?: string;
}

/**
 * Seed test data for Awareness app
 */
export async function seedAwarenessTestData(): Promise<TestDataResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('seed-awareness-data', {
      method: 'POST',
    });

    if (error) throw error;

    return data as TestDataResponse;
  } catch (error: any) {
    console.error('Error seeding test data:', error);
    throw new Error(error.message || 'فشل في إنشاء البيانات التجريبية');
  }
}

/**
 * Clear all test data
 */
export async function clearTestData(): Promise<TestDataResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('clear-test-data', {
      method: 'POST',
    });

    if (error) throw error;

    return data as TestDataResponse;
  } catch (error: any) {
    console.error('Error clearing test data:', error);
    throw new Error(error.message || 'فشل في حذف البيانات التجريبية');
  }
}
