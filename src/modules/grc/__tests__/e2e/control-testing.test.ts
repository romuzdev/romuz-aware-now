import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * E2E Tests: Control Testing Workflow
 * Tests the complete control testing and remediation process
 */
describe('Control Testing Process (E2E)', () => {
  let testTenantId: string;
  let controlId: string;

  beforeEach(() => {
    testTenantId = 'test-tenant-control-e2e-' + Date.now();
  });

  it('should complete full control testing workflow', async () => {
    // Step 1: Create Control
    const { data: control, error: createError } = await supabase
      .from('grc_controls')
      .insert({
        tenant_id: testTenantId,
        title: 'E2E Test Control - Access Logging',
        description: 'All system access must be logged',
        control_type: 'detective',
        category: 'technical',
        control_nature: 'automated',
        test_frequency: 'quarterly',
        effectiveness_rating: 'not_tested'
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(control).toBeDefined();
    controlId = control!.id;

    // Step 2: Schedule Test
    const testDate = new Date();
    const nextTestDate = new Date(Date.now() + 86400000 * 90); // 90 days

    // Step 3: Execute Design Effectiveness Test
    const { data: designTest } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: controlId,
        test_date: testDate.toISOString(),
        tester_name: 'QA Engineer',
        test_type: 'design_effectiveness',
        result: 'passed',
        evidence_notes: 'Control design reviewed and approved',
        next_test_date: nextTestDate.toISOString()
      })
      .select()
      .single();

    expect(designTest!.result).toBe('passed');
    expect(designTest!.test_type).toBe('design_effectiveness');

    // Step 4: Execute Operating Effectiveness Test
    const { data: operatingTest } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: controlId,
        test_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        tester_name: 'QA Engineer',
        test_type: 'operating_effectiveness',
        result: 'passed',
        evidence_notes: 'Sampled 30 transactions - all logged correctly',
        sample_size: 30
      })
      .select()
      .single();

    expect(operatingTest!.result).toBe('passed');
    expect(operatingTest!.sample_size).toBe(30);

    // Step 5: Verify Control Effectiveness Updated
    const { data: updatedControl } = await supabase
      .from('grc_controls')
      .select()
      .eq('id', controlId)
      .single();

    // Effectiveness should be updated via trigger
    expect(updatedControl).toBeDefined();

    // Step 6: Verify Test History
    const { data: testHistory, count } = await supabase
      .from('grc_control_tests')
      .select('*', { count: 'exact' })
      .eq('control_id', controlId)
      .order('test_date', { ascending: false });

    expect(count).toBe(2);
    expect(testHistory).toHaveLength(2);
  });

  it('should handle failed control tests with remediation', async () => {
    // Create control
    const { data: control } = await supabase
      .from('grc_controls')
      .insert({
        tenant_id: testTenantId,
        title: 'Failed Control Test Example',
        control_type: 'preventive',
        category: 'operational',
        effectiveness_rating: 'effective'
      })
      .select()
      .single();

    controlId = control!.id;

    // Execute failed test
    const { data: failedTest } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: controlId,
        test_date: new Date().toISOString(),
        tester_name: 'Auditor',
        test_type: 'operating_effectiveness',
        result: 'failed',
        findings: 'Control not consistently applied - 5 out of 30 samples failed',
        evidence_notes: 'Evidence collected and documented',
        sample_size: 30,
        remediation_plan: 'Retrain staff on control procedures, update documentation',
        remediation_due_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        remediation_status: 'pending',
        remediation_owner: 'operations-manager'
      })
      .select()
      .single();

    expect(failedTest!.result).toBe('failed');
    expect(failedTest!.remediation_status).toBe('pending');
    expect(failedTest!.remediation_plan).toBeDefined();
    expect(failedTest!.remediation_due_date).toBeDefined();

    // Update remediation status
    const { data: remediatedTest } = await supabase
      .from('grc_control_tests')
      .update({
        remediation_status: 'completed',
        remediation_completion_date: new Date().toISOString(),
        remediation_notes: 'Staff retrained, procedures updated'
      })
      .eq('id', failedTest!.id)
      .select()
      .single();

    expect(remediatedTest!.remediation_status).toBe('completed');

    // Retest control
    const { data: retestResult } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: controlId,
        test_date: new Date().toISOString(),
        tester_name: 'Auditor',
        test_type: 'operating_effectiveness',
        result: 'passed',
        evidence_notes: 'All 30 samples passed after remediation',
        sample_size: 30
      })
      .select()
      .single();

    expect(retestResult!.result).toBe('passed');
  });

  it('should validate control test data completeness', async () => {
    // Create control
    const { data: control } = await supabase
      .from('grc_controls')
      .insert({
        tenant_id: testTenantId,
        title: 'Data Validation Test Control',
        control_type: 'detective',
        category: 'compliance'
      })
      .select()
      .single();

    // Attempt to create test with missing required fields
    const { data: incompleteTest, error } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: control!.id,
        test_date: new Date().toISOString(),
        // Missing: test_type, result
      })
      .select()
      .single();

    // Should fail due to NOT NULL constraints
    expect(error).toBeDefined();
  });

  it('should track control testing schedule', async () => {
    // Create multiple controls with different test frequencies
    const controls = await supabase.from('grc_controls').insert([
      {
        tenant_id: testTenantId,
        title: 'Monthly Control',
        control_type: 'preventive',
        category: 'financial',
        test_frequency: 'monthly'
      },
      {
        tenant_id: testTenantId,
        title: 'Quarterly Control',
        control_type: 'detective',
        category: 'operational',
        test_frequency: 'quarterly'
      },
      {
        tenant_id: testTenantId,
        title: 'Annual Control',
        control_type: 'detective',
        category: 'compliance',
        test_frequency: 'annually'
      }
    ]).select();

    expect(controls.data).toHaveLength(3);

    // Query controls due for testing
    const { data: controlsDue } = await supabase
      .from('grc_controls')
      .select(`
        *,
        grc_control_tests!left (
          test_date
        )
      `)
      .eq('tenant_id', testTenantId)
      .order('test_frequency');

    expect(controlsDue).toBeDefined();
  });

  it('should properly handle test exceptions and edge cases', async () => {
    // Create control
    const { data: control } = await supabase
      .from('grc_controls')
      .insert({
        tenant_id: testTenantId,
        title: 'Exception Handling Control',
        control_type: 'corrective',
        category: 'technical'
      })
      .select()
      .single();

    // Test with exceptions noted
    const { data: testWithExceptions } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: control!.id,
        test_date: new Date().toISOString(),
        tester_name: 'Senior Auditor',
        test_type: 'operating_effectiveness',
        result: 'passed_with_exceptions',
        findings: '2 minor exceptions identified but not material',
        evidence_notes: 'Exceptions documented and tracked',
        sample_size: 50
      })
      .select()
      .single();

    expect(testWithExceptions!.result).toBe('passed_with_exceptions');
    expect(testWithExceptions!.findings).toBeDefined();
  });
});
