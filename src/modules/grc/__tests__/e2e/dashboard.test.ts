import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

/**
 * E2E Tests: Dashboard Interactions
 * Tests dashboard data aggregation and visualization
 */
describe('GRC Dashboard Interactions (E2E)', () => {
  let testTenantId: string;

  beforeEach(() => {
    testTenantId = 'test-tenant-dashboard-' + Date.now();
  });

  describe('Risk Dashboard', () => {
    it('should aggregate risk statistics correctly', async () => {
      // Create sample risks
      await supabase.from('grc_risks').insert([
        {
          tenant_id: testTenantId,
          title: 'Critical Risk 1',
          category: 'strategic',
          status: 'assessed',
          inherent_likelihood: 5,
          inherent_impact: 5,
          inherent_score: 25
        },
        {
          tenant_id: testTenantId,
          title: 'High Risk 1',
          category: 'operational',
          status: 'assessed',
          inherent_likelihood: 4,
          inherent_impact: 3,
          inherent_score: 12
        },
        {
          tenant_id: testTenantId,
          title: 'Medium Risk 1',
          category: 'financial',
          status: 'treated',
          inherent_likelihood: 3,
          inherent_impact: 2,
          inherent_score: 6,
          residual_likelihood: 2,
          residual_impact: 2,
          residual_score: 4
        },
        {
          tenant_id: testTenantId,
          title: 'Low Risk 1',
          category: 'compliance',
          status: 'monitoring',
          inherent_likelihood: 1,
          inherent_impact: 2,
          inherent_score: 2
        }
      ]);

      // Query total risks
      const { count: totalCount } = await supabase
        .from('grc_risks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId);

      expect(totalCount).toBe(4);

      // Query by severity
      const { count: criticalCount } = await supabase
        .from('grc_risks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .gte('inherent_score', 20);

      const { count: highCount } = await supabase
        .from('grc_risks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .gte('inherent_score', 10)
        .lt('inherent_score', 20);

      expect(criticalCount).toBe(1);
      expect(highCount).toBe(1);

      // Query by status
      const { count: assessedCount } = await supabase
        .from('grc_risks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('status', 'assessed');

      const { count: treatedCount } = await supabase
        .from('grc_risks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('status', 'treated');

      expect(assessedCount).toBe(2);
      expect(treatedCount).toBe(1);
    });

    it('should display risk matrix data', async () => {
      // Create risks for matrix visualization
      const matrixRisks = [];
      for (let likelihood = 1; likelihood <= 5; likelihood++) {
        for (let impact = 1; impact <= 5; impact++) {
          matrixRisks.push({
            tenant_id: testTenantId,
            title: `Risk L${likelihood}I${impact}`,
            category: 'operational',
            status: 'assessed',
            inherent_likelihood: likelihood,
            inherent_impact: impact,
            inherent_score: likelihood * impact
          });
        }
      }

      await supabase.from('grc_risks').insert(matrixRisks);

      // Query for matrix data
      const { data: matrixData } = await supabase
        .from('grc_risks')
        .select('inherent_likelihood, inherent_impact, inherent_score')
        .eq('tenant_id', testTenantId)
        .eq('status', 'assessed');

      expect(matrixData).toBeDefined();
      expect(matrixData!.length).toBe(25); // 5x5 matrix
    });

    it('should show top risks by category', async () => {
      // Create categorized risks
      await supabase.from('grc_risks').insert([
        {
          tenant_id: testTenantId,
          title: 'Strategic Risk High',
          category: 'strategic',
          inherent_score: 20
        },
        {
          tenant_id: testTenantId,
          title: 'Operational Risk High',
          category: 'operational',
          inherent_score: 18
        },
        {
          tenant_id: testTenantId,
          title: 'Financial Risk High',
          category: 'financial',
          inherent_score: 16
        }
      ]);

      // Query top risks by category
      const { data: topRisks } = await supabase
        .from('grc_risks')
        .select('category, inherent_score, title')
        .eq('tenant_id', testTenantId)
        .order('inherent_score', { ascending: false })
        .limit(5);

      expect(topRisks).toBeDefined();
      expect(topRisks![0].inherent_score).toBe(20);
    });
  });

  describe('Control Dashboard', () => {
    it('should aggregate control statistics', async () => {
      // Create sample controls
      await supabase.from('grc_controls').insert([
        {
          tenant_id: testTenantId,
          title: 'Effective Control 1',
          control_type: 'preventive',
          category: 'technical',
          effectiveness_rating: 'effective'
        },
        {
          tenant_id: testTenantId,
          title: 'Ineffective Control 1',
          control_type: 'detective',
          category: 'operational',
          effectiveness_rating: 'ineffective'
        },
        {
          tenant_id: testTenantId,
          title: 'Not Tested Control 1',
          control_type: 'corrective',
          category: 'compliance',
          effectiveness_rating: 'not_tested'
        }
      ]);

      // Count by effectiveness
      const { count: effectiveCount } = await supabase
        .from('grc_controls')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('effectiveness_rating', 'effective');

      const { count: ineffectiveCount } = await supabase
        .from('grc_controls')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('effectiveness_rating', 'ineffective');

      expect(effectiveCount).toBe(1);
      expect(ineffectiveCount).toBe(1);

      // Count by type
      const { data: byType } = await supabase
        .from('grc_controls')
        .select('control_type')
        .eq('tenant_id', testTenantId);

      const typeCount = byType!.reduce((acc: any, control: any) => {
        acc[control.control_type] = (acc[control.control_type] || 0) + 1;
        return acc;
      }, {});

      expect(typeCount).toHaveProperty('preventive');
      expect(typeCount).toHaveProperty('detective');
      expect(typeCount).toHaveProperty('corrective');
    });

    it('should show control testing schedule', async () => {
      // Create controls with different test statuses
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Scheduled Control',
          control_type: 'preventive',
          category: 'technical',
          test_frequency: 'quarterly'
        })
        .select()
        .single();

      // Add test with next test date
      await supabase.from('grc_control_tests').insert({
        tenant_id: testTenantId,
        control_id: control!.id,
        test_date: new Date(Date.now() - 86400000 * 60).toISOString(), // 60 days ago
        test_type: 'operating_effectiveness',
        result: 'passed',
        next_test_date: new Date(Date.now() + 86400000 * 30).toISOString() // 30 days from now
      });

      // Query controls with upcoming tests
      const { data: upcomingTests } = await supabase
        .from('grc_control_tests')
        .select(`
          *,
          grc_controls!inner (*)
        `)
        .eq('grc_controls.tenant_id', testTenantId)
        .gte('next_test_date', new Date().toISOString())
        .order('next_test_date');

      expect(upcomingTests).toBeDefined();
    });

    it('should identify controls requiring remediation', async () => {
      // Create control with failed test
      const { data: control } = await supabase
        .from('grc_controls')
        .insert({
          tenant_id: testTenantId,
          title: 'Control Needing Remediation',
          control_type: 'detective',
          category: 'operational',
          effectiveness_rating: 'ineffective'
        })
        .select()
        .single();

      await supabase.from('grc_control_tests').insert({
        tenant_id: testTenantId,
        control_id: control!.id,
        test_date: new Date().toISOString(),
        test_type: 'operating_effectiveness',
        result: 'failed',
        remediation_status: 'pending',
        remediation_due_date: new Date(Date.now() + 86400000 * 30).toISOString()
      });

      // Query controls with pending remediation
      const { data: needingRemediation } = await supabase
        .from('grc_control_tests')
        .select(`
          *,
          grc_controls!inner (*)
        `)
        .eq('grc_controls.tenant_id', testTenantId)
        .eq('remediation_status', 'pending');

      expect(needingRemediation).toBeDefined();
      expect(needingRemediation!.length).toBeGreaterThan(0);
    });
  });

  describe('Treatment Plan Dashboard', () => {
    it('should show treatment plan progress', async () => {
      // Create risk and treatment plans in different statuses
      const { data: risk } = await supabase
        .from('grc_risks')
        .insert({
          tenant_id: testTenantId,
          title: 'Risk with Plans',
          category: 'operational',
          inherent_score: 15
        })
        .select()
        .single();

      await supabase.from('grc_treatment_plans').insert([
        {
          tenant_id: testTenantId,
          risk_id: risk!.id,
          strategy: 'mitigate',
          status: 'planned',
          target_likelihood: 2,
          target_impact: 3
        },
        {
          tenant_id: testTenantId,
          risk_id: risk!.id,
          strategy: 'transfer',
          status: 'in_progress',
          target_likelihood: 1,
          target_impact: 2
        },
        {
          tenant_id: testTenantId,
          risk_id: risk!.id,
          strategy: 'accept',
          status: 'completed',
          target_likelihood: 3,
          target_impact: 2,
          completion_date: new Date().toISOString()
        }
      ]);

      // Count by status
      const { count: plannedCount } = await supabase
        .from('grc_treatment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('status', 'planned');

      const { count: inProgressCount } = await supabase
        .from('grc_treatment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('status', 'in_progress');

      const { count: completedCount } = await supabase
        .from('grc_treatment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', testTenantId)
        .eq('status', 'completed');

      expect(plannedCount).toBe(1);
      expect(inProgressCount).toBe(1);
      expect(completedCount).toBe(1);
    });
  });
});
