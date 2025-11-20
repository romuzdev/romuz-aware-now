/**
 * GRC Module - Control Management Integration
 * Supabase integration layer for Control Library and Control Testing
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  Control,
  ControlTest,
  ControlWithDetails,
  CreateControlInput,
  UpdateControlInput,
  CreateControlTestInput,
  UpdateControlTestInput,
  ControlFilters,
  ControlTestFilters,
  ControlStatistics,
  ControlTestStatistics,
} from '../types/control.types';

/**
 * Fetch all controls for current tenant with optional filters
 */
export async function fetchControls(filters?: ControlFilters): Promise<Control[]> {
  let query = supabase
    .from('grc_controls')
    .select('*')
    .order(filters?.sortBy || 'created_at', { ascending: filters?.sortDir === 'asc' });

  // Apply filters
  if (filters?.q) {
    query = query.or(`control_code.ilike.%${filters.q}%,control_title.ilike.%${filters.q}%,control_description.ilike.%${filters.q}%`);
  }
  if (filters?.control_type) {
    query = query.eq('control_type', filters.control_type);
  }
  if (filters?.control_category) {
    query = query.eq('control_category', filters.control_category);
  }
  if (filters?.control_nature) {
    query = query.eq('control_nature', filters.control_nature);
  }
  if (filters?.control_status) {
    query = query.eq('control_status', filters.control_status);
  }
  if (filters?.effectiveness_rating) {
    query = query.eq('effectiveness_rating', filters.effectiveness_rating);
  }
  if (filters?.maturity_level) {
    query = query.eq('maturity_level', filters.maturity_level);
  }
  if (filters?.control_owner_id) {
    query = query.eq('control_owner_id', filters.control_owner_id);
  }
  if (filters?.testing_frequency) {
    query = query.eq('testing_frequency', filters.testing_frequency);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  if (filters?.linked_risk_ids && filters.linked_risk_ids.length > 0) {
    query = query.contains('linked_risk_ids', filters.linked_risk_ids);
  }
  if (filters?.from) {
    query = query.gte('created_at', filters.from);
  }
  if (filters?.to) {
    query = query.lte('created_at', filters.to);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching controls:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch single control by ID with details
 */
export async function fetchControlById(controlId: string): Promise<ControlWithDetails | null> {
  const { data: control, error: controlError } = await supabase
    .from('grc_controls')
    .select('*')
    .eq('id', controlId)
    .single();

  if (controlError) {
    console.error('Error fetching control:', controlError);
    throw controlError;
  }

  if (!control) return null;

  // Fetch related tests
  const { data: tests } = await supabase
    .from('grc_control_tests')
    .select('*')
    .eq('control_id', controlId)
    .order('test_date', { ascending: false });

  const testHistory = tests || [];
  const latestTest = testHistory[0];
  const totalTests = testHistory.length;
  const failedTests = testHistory.filter(t => t.test_result === 'failed').length;
  const passedTests = testHistory.filter(t => ['passed', 'passed_with_exceptions'].includes(t.test_result)).length;

  return {
    ...control,
    latest_test: latestTest,
    test_history: testHistory,
    total_tests: totalTests,
    failed_tests: failedTests,
    passed_tests: passedTests,
  } as ControlWithDetails;
}

/**
 * Create new control
 */
export async function createControl(input: CreateControlInput): Promise<Control> {
  const { data, error } = await supabase
    .from('grc_controls')
    .insert({
      ...input,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating control:', error);
    throw error;
  }

  return data;
}

/**
 * Update existing control
 */
export async function updateControl(controlId: string, input: UpdateControlInput): Promise<Control> {
  const { data, error } = await supabase
    .from('grc_controls')
    .update({
      ...input,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', controlId)
    .select()
    .single();

  if (error) {
    console.error('Error updating control:', error);
    throw error;
  }

  return data;
}

/**
 * Delete control (soft delete by setting is_active = false)
 */
export async function deleteControl(controlId: string): Promise<void> {
  const { error } = await supabase
    .from('grc_controls')
    .update({ is_active: false })
    .eq('id', controlId);

  if (error) {
    console.error('Error deleting control:', error);
    throw error;
  }
}

/**
 * Fetch all control tests with optional filters
 */
export async function fetchControlTests(filters?: ControlTestFilters): Promise<ControlTest[]> {
  let query = supabase
    .from('grc_control_tests')
    .select('*')
    .order(filters?.sortBy || 'test_date', { ascending: filters?.sortDir === 'asc' });

  // Apply filters
  if (filters?.q) {
    query = query.or(`test_code.ilike.%${filters.q}%,test_title.ilike.%${filters.q}%,test_description.ilike.%${filters.q}%`);
  }
  if (filters?.control_id) {
    query = query.eq('control_id', filters.control_id);
  }
  if (filters?.test_type) {
    query = query.eq('test_type', filters.test_type);
  }
  if (filters?.test_method) {
    query = query.eq('test_method', filters.test_method);
  }
  if (filters?.test_result) {
    query = query.eq('test_result', filters.test_result);
  }
  if (filters?.effectiveness_conclusion) {
    query = query.eq('effectiveness_conclusion', filters.effectiveness_conclusion);
  }
  if (filters?.remediation_status) {
    query = query.eq('remediation_status', filters.remediation_status);
  }
  if (filters?.tested_by) {
    query = query.eq('tested_by', filters.tested_by);
  }
  if (filters?.from) {
    query = query.gte('test_date', filters.from);
  }
  if (filters?.to) {
    query = query.lte('test_date', filters.to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching control tests:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create control test
 */
export async function createControlTest(input: CreateControlTestInput): Promise<ControlTest> {
  const { data, error } = await supabase
    .from('grc_control_tests')
    .insert({
      ...input,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating control test:', error);
    throw error;
  }

  return data;
}

/**
 * Update control test
 */
export async function updateControlTest(
  testId: string,
  input: UpdateControlTestInput
): Promise<ControlTest> {
  const { data, error } = await supabase
    .from('grc_control_tests')
    .update({
      ...input,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
    console.error('Error updating control test:', error);
    throw error;
  }

  return data;
}

/**
 * Delete control test
 */
export async function deleteControlTest(testId: string): Promise<void> {
  const { error } = await supabase
    .from('grc_control_tests')
    .delete()
    .eq('id', testId);

  if (error) {
    console.error('Error deleting control test:', error);
    throw error;
  }
}

/**
 * Fetch control statistics for dashboard
 */
export async function fetchControlStatistics(): Promise<ControlStatistics> {
  const { data: controls, error } = await supabase
    .from('grc_controls')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching control statistics:', error);
    throw error;
  }

  const stats: ControlStatistics = {
    total_controls: controls.length,
    active_controls: controls.filter(c => c.control_status === 'active').length,
    by_type: {
      preventive: 0,
      detective: 0,
      corrective: 0,
      directive: 0,
    },
    by_category: {
      access_control: 0,
      data_protection: 0,
      physical_security: 0,
      operational: 0,
      technical: 0,
      administrative: 0,
      compliance: 0,
    },
    by_effectiveness: {
      not_tested: 0,
      ineffective: 0,
      partially_effective: 0,
      effective: 0,
      highly_effective: 0,
    },
    by_nature: {
      manual: 0,
      automated: 0,
      hybrid: 0,
    },
    controls_needing_test: 0,
    overdue_tests: 0,
    average_effectiveness_score: 0,
  };

  const today = new Date();
  let totalEffectivenessScore = 0;
  let countWithEffectiveness = 0;

  controls.forEach(control => {
    // Count by type
    if (control.control_type in stats.by_type) {
      stats.by_type[control.control_type as keyof typeof stats.by_type]++;
    }

    // Count by category
    if (control.control_category in stats.by_category) {
      stats.by_category[control.control_category as keyof typeof stats.by_category]++;
    }

    // Count by effectiveness
    const effectiveness = control.effectiveness_rating || 'not_tested';
    if (effectiveness in stats.by_effectiveness) {
      stats.by_effectiveness[effectiveness as keyof typeof stats.by_effectiveness]++;
    }

    // Count by nature
    if (control.control_nature in stats.by_nature) {
      stats.by_nature[control.control_nature as keyof typeof stats.by_nature]++;
    }

    // Calculate effectiveness score (0-100)
    const effectivenessMap: Record<string, number> = {
      not_tested: 0,
      ineffective: 20,
      partially_effective: 50,
      effective: 80,
      highly_effective: 100,
    };
    if (effectiveness && effectiveness in effectivenessMap) {
      totalEffectivenessScore += effectivenessMap[effectiveness];
      countWithEffectiveness++;
    }

    // Count controls needing test
    if (!control.last_test_date || control.effectiveness_rating === 'not_tested') {
      stats.controls_needing_test++;
    }

    // Count overdue tests
    if (control.next_test_date && new Date(control.next_test_date) < today) {
      stats.overdue_tests++;
    }
  });

  stats.average_effectiveness_score =
    countWithEffectiveness > 0 ? totalEffectivenessScore / countWithEffectiveness : 0;

  return stats;
}

/**
 * Fetch control test statistics for dashboard
 */
export async function fetchControlTestStatistics(): Promise<ControlTestStatistics> {
  const { data: tests, error } = await supabase
    .from('grc_control_tests')
    .select('*');

  if (error) {
    console.error('Error fetching control test statistics:', error);
    throw error;
  }

  const stats: ControlTestStatistics = {
    total_tests: tests.length,
    tests_this_month: 0,
    by_result: {
      passed: 0,
      passed_with_exceptions: 0,
      failed: 0,
      not_applicable: 0,
    },
    by_type: {
      design: 0,
      operating_effectiveness: 0,
      compliance: 0,
      walkthrough: 0,
    },
    requiring_remediation: 0,
    remediation_completed: 0,
    remediation_overdue: 0,
    pass_rate: 0,
  };

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let passedCount = 0;

  tests.forEach(test => {
    // Count tests this month
    if (new Date(test.test_date) >= firstDayOfMonth) {
      stats.tests_this_month++;
    }

    // Count by result
    if (test.test_result in stats.by_result) {
      stats.by_result[test.test_result as keyof typeof stats.by_result]++;
    }

    // Count by type
    if (test.test_type in stats.by_type) {
      stats.by_type[test.test_type as keyof typeof stats.by_type]++;
    }

    // Count passed tests
    if (['passed', 'passed_with_exceptions'].includes(test.test_result)) {
      passedCount++;
    }

    // Count remediation status
    if (test.requires_remediation) {
      stats.requiring_remediation++;
      if (test.remediation_status === 'completed') {
        stats.remediation_completed++;
      }
      if (
        test.remediation_status !== 'completed' &&
        test.remediation_due_date &&
        new Date(test.remediation_due_date) < today
      ) {
        stats.remediation_overdue++;
      }
    }
  });

  stats.pass_rate = tests.length > 0 ? (passedCount / tests.length) * 100 : 0;

  return stats;
}
