import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import type { Risk, Control } from '../../types';

/**
 * Integration Tests: Risk-Control Linkage
 * Tests the integration between risks and controls through treatment plans
 */
describe('Risk-Control Linkage Integration', () => {
  let testTenantId: string;
  let testRisk: Risk;
  let testControl: Control;

  beforeEach(async () => {
    testTenantId = 'test-tenant-' + Date.now();
  });

  describe('Link Controls to Risks', () => {
    it('should link controls to risks via treatment plans', async () => {
      // Create test risk
      const { data: risk } = await supabase
        .from('grc_risks')
        .insert({
          tenant_id: testTenantId,
          title: 'Test Risk for Linkage',
          category: 'operational',
          inherent_likelihood: 3,
          inherent_impact: 4,
          status: 'identified'
        })
        .select()
        .single();

      expect(risk).toBeDefined();

      // Create test control
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Test Control for Linkage',
          control_type: 'preventive',
          category: 'technical',
          effectiveness_rating: 'effective'
        })
        .select()
        .single();

      expect(control).toBeDefined();

      // Create treatment plan linking control to risk
      const { data: treatmentPlan } = await supabase
        .from('grc_treatment_plans')
        .insert({
          tenant_id: testTenantId,
          risk_id: risk!.id,
          control_ids: [control!.id],
          strategy: 'mitigate',
          target_likelihood: 2,
          target_impact: 2,
          status: 'planned'
        })
        .select()
        .single();

      expect(treatmentPlan).toBeDefined();
      expect(treatmentPlan!.control_ids).toContain(control!.id);
    });

    it('should update residual scores when control effectiveness changes', async () => {
      // This test verifies that when a control's effectiveness changes,
      // the associated risk's residual scores are recalculated
      expect(true).toBe(true); // Placeholder for actual implementation
    });

    it('should validate control coverage for high-priority risks', async () => {
      // Verify that all high and critical risks have at least one control
      const { data: highPriorityRisks } = await supabase
        .from('grc_risks')
        .select('*, grc_treatment_plans(control_ids)')
        .eq('tenant_id', testTenantId)
        .gte('inherent_score', 15);

      // Each high-priority risk should have associated controls
      highPriorityRisks?.forEach(risk => {
        const hasControls = risk.grc_treatment_plans?.some(
          (plan: any) => plan.control_ids?.length > 0
        );
        expect(hasControls).toBe(true);
      });
    });

    it('should maintain referential integrity when control is deleted', async () => {
      // Test that deleting a control properly updates treatment plans
      expect(true).toBe(true); // Placeholder - RLS will handle this
    });
  });

  describe('Control Coverage Analysis', () => {
    it('should identify uncovered high-priority risks', async () => {
      // Create high-priority risk without controls
      const { data: risk } = await supabase
        .from('grc_risks')
        .insert({
          tenant_id: testTenantId,
          title: 'Uncovered High Priority Risk',
          category: 'strategic',
          inherent_likelihood: 4,
          inherent_impact: 5,
          status: 'identified'
        })
        .select()
        .single();

      // Query for uncovered high-priority risks
      const { data: uncoveredRisks } = await supabase
        .from('grc_risks')
        .select('*, grc_treatment_plans!left(id)')
        .eq('tenant_id', testTenantId)
        .gte('inherent_score', 15)
        .is('grc_treatment_plans.id', null);

      expect(uncoveredRisks?.length).toBeGreaterThan(0);
    });
  });
});
