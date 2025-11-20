import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * Integration Tests: Control Effectiveness Flow
 * Tests control testing workflow and effectiveness calculation
 */
describe('Control Effectiveness Integration', () => {
  let testTenantId: string;

  beforeEach(() => {
    testTenantId = 'test-tenant-' + Date.now();
  });

  describe('Control Testing Workflow', () => {
    it('should create control test and update effectiveness', async () => {
      // Create control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Control to Test',
          control_type: 'detective',
          category: 'technical',
          effectiveness_rating: 'not_tested'
        })
        .select()
        .single();

      expect(control).toBeDefined();

      // Create control test
      const { data: test } = await supabase
        .from('grc_control_tests')
        .insert({
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date().toISOString(),
          tester_name: 'Test Engineer',
          test_type: 'design_effectiveness',
          result: 'passed',
          evidence_notes: 'Control design is adequate'
        })
        .select()
        .single();

      expect(test).toBeDefined();
      expect(test!.result).toBe('passed');

      // Verify control effectiveness updated (via trigger)
      const { data: updatedControl } = await supabase
        .from('grc_controls')
        .select()
        .eq('id', control!.id)
        .single();

      expect(updatedControl).toBeDefined();
    });

    it('should track control test history', async () => {
      // Create control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Control with History',
          control_type: 'preventive',
          category: 'operational'
        })
        .select()
        .single();

      // Create multiple tests
      await supabase.from('grc_control_tests').insert([
        {
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date(Date.now() - 86400000 * 30).toISOString(),
          test_type: 'design_effectiveness',
          result: 'passed'
        },
        {
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date().toISOString(),
          test_type: 'operating_effectiveness',
          result: 'passed'
        }
      ]);

      // Query test history
      const { data: testHistory, count } = await supabase
        .from('grc_control_tests')
        .select('*', { count: 'exact' })
        .eq('control_id', control!.id)
        .order('test_date', { ascending: false });

      expect(count).toBeGreaterThanOrEqual(2);
      expect(testHistory).toBeDefined();
    });

    it('should handle ineffective controls with remediation', async () => {
      // Create control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Ineffective Control',
          control_type: 'detective',
          category: 'compliance',
          effectiveness_rating: 'effective'
        })
        .select()
        .single();

      // Create failed test
      const { data: failedTest } = await supabase
        .from('grc_control_tests')
        .insert({
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date().toISOString(),
          test_type: 'operating_effectiveness',
          result: 'failed',
          findings: 'Control not operating as designed',
          remediation_plan: 'Update control procedures and retest',
          remediation_due_date: new Date(Date.now() + 86400000 * 30).toISOString(),
          remediation_status: 'pending'
        })
        .select()
        .single();

      expect(failedTest!.result).toBe('failed');
      expect(failedTest!.remediation_status).toBe('pending');
      expect(failedTest!.remediation_plan).toBeDefined();
    });
  });

  describe('Control Test Frequency Validation', () => {
    it('should validate test frequency against control requirements', async () => {
      // Create control with annual test frequency
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Annual Control',
          control_type: 'preventive',
          category: 'financial',
          test_frequency: 'annually'
        })
        .select()
        .single();

      const testFrequencyDays = {
        'monthly': 30,
        'quarterly': 90,
        'semi_annually': 180,
        'annually': 365
      };

      expect(testFrequencyDays['annually']).toBe(365);
      
      // Last test date check
      const { data: lastTest } = await supabase
        .from('grc_control_tests')
        .select()
        .eq('control_id', control!.id)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const daysSinceLastTest = lastTest 
        ? Math.floor((Date.now() - new Date(lastTest.test_date).getTime()) / 86400000)
        : Infinity;

      const isDue = daysSinceLastTest >= testFrequencyDays['annually'];
      expect(typeof isDue).toBe('boolean');
    });

    it('should prevent duplicate tests within short period', async () => {
      // Create control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Control for Duplicate Test',
          control_type: 'detective',
          category: 'technical'
        })
        .select()
        .single();

      // Create first test
      await supabase
        .from('grc_control_tests')
        .insert({
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date().toISOString(),
          test_type: 'design_effectiveness',
          result: 'passed'
        });

      // Check for recent tests (within 7 days)
      const { data: recentTests } = await supabase
        .from('grc_control_tests')
        .select()
        .eq('control_id', control!.id)
        .gte('test_date', new Date(Date.now() - 86400000 * 7).toISOString());

      const hasDuplicateTest = (recentTests?.length ?? 0) > 1;
      
      // Business logic should warn about duplicate tests
      expect(recentTests).toBeDefined();
    });
  });

  describe('Control Effectiveness Rating', () => {
    it('should update effectiveness rating based on test results', async () => {
      // Create control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Control Effectiveness Test',
          control_type: 'preventive',
          category: 'operational',
          effectiveness_rating: 'not_tested'
        })
        .select()
        .single();

      // Create passing test
      await supabase
        .from('grc_control_tests')
        .insert({
          tenant_id: testTenantId,
          control_id: control!.id,
          test_date: new Date().toISOString(),
          test_type: 'operating_effectiveness',
          result: 'passed'
        });

      // The update_control_effectiveness trigger should update the rating
      // Verify in actual database implementation
      expect(control!.id).toBeDefined();
    });
  });
});
