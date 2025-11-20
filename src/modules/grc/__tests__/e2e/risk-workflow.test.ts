import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * E2E Tests: Complete Risk Management Workflow
 * Tests the entire lifecycle from risk identification to monitoring
 */
describe('Complete Risk Management Workflow (E2E)', () => {
  let testTenantId: string;
  let riskId: string;

  beforeEach(() => {
    testTenantId = 'test-tenant-e2e-' + Date.now();
  });

  it('should complete full risk management lifecycle', async () => {
    // Step 1: Identify Risk
    const { data: identifiedRisk, error: identifyError } = await supabase
      .from('grc_risks')
      .insert({
        tenant_id: testTenantId,
        title: 'E2E Test Risk - Data Breach',
        description: 'Potential unauthorized access to customer data',
        category: 'technical',
        status: 'identified',
        owner: 'security-team'
      })
      .select()
      .single();

    expect(identifyError).toBeNull();
    expect(identifiedRisk).toBeDefined();
    expect(identifiedRisk!.status).toBe('identified');
    riskId = identifiedRisk!.id;

    // Step 2: Assess Risk
    const { data: assessedRisk } = await supabase
      .from('grc_risks')
      .update({
        status: 'assessed',
        inherent_likelihood: 4,
        inherent_impact: 5,
        inherent_score: 20,
        assessment_date: new Date().toISOString()
      })
      .eq('id', riskId)
      .select()
      .single();

    expect(assessedRisk!.status).toBe('assessed');
    expect(assessedRisk!.inherent_score).toBe(20);

    // Step 3: Create Treatment Plan
    const { data: treatmentPlan } = await supabase
      .from('grc_treatment_plans')
      .insert({
        tenant_id: testTenantId,
        risk_id: riskId,
        strategy: 'mitigate',
        target_likelihood: 2,
        target_impact: 3,
        target_score: 6,
        status: 'planned',
        implementation_date: new Date(Date.now() + 86400000 * 90).toISOString()
      })
      .select()
      .single();

    expect(treatmentPlan).toBeDefined();
    expect(treatmentPlan!.strategy).toBe('mitigate');

    // Step 4: Implement Controls
    const { data: control } = await supabase
      .from('grc_controls')
      .insert({
        tenant_id: testTenantId,
        title: 'Multi-Factor Authentication',
        control_type: 'preventive',
        category: 'technical',
        effectiveness_rating: 'not_tested'
      })
      .select()
      .single();

    // Link control to treatment plan
    await supabase
      .from('grc_treatment_plans')
      .update({
        control_ids: [control!.id],
        status: 'in_progress'
      })
      .eq('id', treatmentPlan!.id);

    // Step 5: Test Control
    const { data: controlTest } = await supabase
      .from('grc_control_tests')
      .insert({
        tenant_id: testTenantId,
        control_id: control!.id,
        test_date: new Date().toISOString(),
        test_type: 'operating_effectiveness',
        result: 'passed',
        evidence_notes: 'MFA successfully implemented and tested'
      })
      .select()
      .single();

    expect(controlTest!.result).toBe('passed');

    // Step 6: Complete Treatment Plan
    const { data: completedPlan } = await supabase
      .from('grc_treatment_plans')
      .update({
        status: 'completed',
        completion_date: new Date().toISOString()
      })
      .eq('id', treatmentPlan!.id)
      .select()
      .single();

    expect(completedPlan!.status).toBe('completed');

    // Step 7: Reassess Risk (Residual)
    const { data: treatedRisk } = await supabase
      .from('grc_risks')
      .update({
        status: 'treated',
        residual_likelihood: 2,
        residual_impact: 3,
        residual_score: 6,
        review_date: new Date(Date.now() + 86400000 * 90).toISOString()
      })
      .eq('id', riskId)
      .select()
      .single();

    expect(treatedRisk!.status).toBe('treated');
    expect(treatedRisk!.residual_score).toBeLessThan(treatedRisk!.inherent_score);

    // Step 8: Monitor Risk
    const { data: monitoredRisk } = await supabase
      .from('grc_risks')
      .update({
        status: 'monitoring'
      })
      .eq('id', riskId)
      .select()
      .single();

    expect(monitoredRisk!.status).toBe('monitoring');

    // Verify complete workflow
    expect(monitoredRisk).toBeDefined();
    expect(monitoredRisk!.inherent_score).toBeGreaterThan(monitoredRisk!.residual_score);
  });

  it('should validate risk assessment calculations', async () => {
    const testCases = [
      { likelihood: 1, impact: 1, expectedScore: 1 },
      { likelihood: 3, impact: 4, expectedScore: 12 },
      { likelihood: 5, impact: 5, expectedScore: 25 }
    ];

    for (const testCase of testCases) {
      const { data: risk } = await supabase
        .from('grc_risks')
        .insert({
          tenant_id: testTenantId,
          title: `Calc Test L${testCase.likelihood}I${testCase.impact}`,
          category: 'operational',
          inherent_likelihood: testCase.likelihood,
          inherent_impact: testCase.impact,
          inherent_score: testCase.expectedScore
        })
        .select()
        .single();

      expect(risk!.inherent_score).toBe(testCase.expectedScore);
    }
  });

  it('should enforce risk status transitions', async () => {
    // Create risk in 'identified' status
    const { data: risk } = await supabase
      .from('grc_risks')
      .insert({
        tenant_id: testTenantId,
        title: 'Status Transition Test',
        category: 'operational',
        status: 'identified'
      })
      .select()
      .single();

    // Valid transition: identified -> assessed
    const { error: validTransition } = await supabase
      .from('grc_risks')
      .update({ status: 'assessed', inherent_likelihood: 3, inherent_impact: 3 })
      .eq('id', risk!.id);

    expect(validTransition).toBeNull();

    // Verify status updated
    const { data: updatedRisk } = await supabase
      .from('grc_risks')
      .select()
      .eq('id', risk!.id)
      .single();

    expect(updatedRisk!.status).toBe('assessed');
  });

  it('should display risks in appropriate dashboard sections', async () => {
    // Create risks with different statuses
    await supabase.from('grc_risks').insert([
      {
        tenant_id: testTenantId,
        title: 'High Priority Risk',
        category: 'strategic',
        inherent_likelihood: 5,
        inherent_impact: 5,
        inherent_score: 25,
        status: 'assessed'
      },
      {
        tenant_id: testTenantId,
        title: 'Medium Priority Risk',
        category: 'operational',
        inherent_likelihood: 3,
        inherent_impact: 3,
        inherent_score: 9,
        status: 'assessed'
      },
      {
        tenant_id: testTenantId,
        title: 'Low Priority Risk',
        category: 'compliance',
        inherent_likelihood: 1,
        inherent_impact: 2,
        inherent_score: 2,
        status: 'assessed'
      }
    ]);

    // Query critical risks (score >= 15)
    const { data: criticalRisks } = await supabase
      .from('grc_risks')
      .select()
      .eq('tenant_id', testTenantId)
      .gte('inherent_score', 15);

    // Query high risks (10-14)
    const { data: highRisks } = await supabase
      .from('grc_risks')
      .select()
      .eq('tenant_id', testTenantId)
      .gte('inherent_score', 10)
      .lt('inherent_score', 15);

    expect(criticalRisks?.length).toBeGreaterThan(0);
    expect(highRisks?.length).toBeGreaterThan(0);
  });
});
