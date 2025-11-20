/**
 * M14 - Unified KPI Dashboard Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchUnifiedKPIs,
  fetchExecutiveSummary,
  fetchModuleKPIGroups,
  fetchKPIAlerts,
  acknowledgeAlert,
  captureKPISnapshot,
  detectKPIAlerts,
  fetchKPISnapshots,
  calculateHistoricalComparison
} from '../integration/unified-kpis.integration';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Unified KPI Dashboard Integration', () => {
  const mockTenantId = 'test-tenant-123';
  
  describe('fetchUnifiedKPIs', () => {
    it('should fetch all KPIs for a tenant', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockData = [
        {
          tenant_id: mockTenantId,
          module: 'risk',
          kpi_key: 'risk_001',
          kpi_name: 'Risk Score',
          current_value: 15,
          target_value: 25,
          status: 'active',
          last_updated: '2025-01-01',
          metadata: {}
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await fetchUnifiedKPIs(mockTenantId);
      
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('vw_unified_kpis');
    });

    it('should apply filters correctly', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await fetchUnifiedKPIs(mockTenantId, {
        modules: ['risk', 'compliance'],
        status: ['active']
      });

      expect(mockChain.in).toHaveBeenCalledWith('module', ['risk', 'compliance']);
      expect(mockChain.in).toHaveBeenCalledWith('status', ['active']);
    });

    it('should handle errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Database error') 
        })
      });

      await expect(fetchUnifiedKPIs(mockTenantId)).rejects.toThrow();
    });
  });

  describe('fetchExecutiveSummary', () => {
    it('should fetch executive summary', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockData = [
        {
          tenant_id: mockTenantId,
          module: 'risk',
          total_kpis: 10,
          avg_performance: 15.5,
          avg_target: 100,
          achievement_rate: 75.5,
          critical_count: 2
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      });

      const result = await fetchExecutiveSummary(mockTenantId);
      
      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('vw_kpi_executive_summary');
    });
  });

  describe('fetchModuleKPIGroups', () => {
    it('should group KPIs by module with metadata', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockKPIs = [
        {
          tenant_id: mockTenantId,
          module: 'risk' as const,
          kpi_key: 'risk_001',
          kpi_name: 'Risk Score',
          entity_id: '1',
          entity_name: 'Risk 1',
          current_value: 15,
          target_value: 25,
          status: 'active',
          last_updated: '2025-01-01',
          metadata: {}
        }
      ];

      const mockSummary = [
        {
          tenant_id: mockTenantId,
          module: 'risk' as const,
          total_kpis: 1,
          avg_performance: 15,
          avg_target: 25,
          achievement_rate: 60,
          critical_count: 0,
          last_update: '2025-01-01'
        }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        const data = table === 'vw_unified_kpis' ? mockKPIs : mockSummary;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data, error: null })
        };
      });

      const result = await fetchModuleKPIGroups(mockTenantId);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        module: 'risk',
        moduleName: 'المخاطر',
        moduleIcon: 'Shield',
        totalKPIs: 1,
        kpis: mockKPIs
      });
    });
  });

  describe('fetchKPIAlerts', () => {
    it('should fetch unacknowledged alerts', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockAlerts = [
        {
          id: 'alert-1',
          tenant_id: mockTenantId,
          module: 'risk',
          kpi_key: 'risk_001',
          kpi_name: 'Risk Score',
          alert_type: 'threshold_breach',
          severity: 'critical',
          current_value: 50,
          threshold_value: 25,
          message: 'Risk exceeded threshold',
          is_acknowledged: false,
          created_at: '2025-01-01'
        }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        mockResolvedValue: vi.fn().mockResolvedValue({ data: mockAlerts, error: null })
      });

      // Fix the mock chain to return the data properly
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      };
      
      mockChain.order = vi.fn().mockResolvedValue({ data: mockAlerts, error: null });
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await fetchKPIAlerts(mockTenantId, { acknowledged: false });
      
      expect(result).toEqual(mockAlerts);
    });

    it('should filter by severity', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis()
      };
      
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      (supabase.from as any).mockReturnValue(mockChain);

      await fetchKPIAlerts(mockTenantId, { severity: ['critical', 'high'] });
      
      expect(mockChain.in).toHaveBeenCalledWith('severity', ['critical', 'high']);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const alertId = 'alert-1';
      const userId = 'user-1';

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      });

      await acknowledgeAlert(alertId, userId);
      
      expect(supabase.from).toHaveBeenCalledWith('kpi_alerts');
    });
  });

  describe('captureKPISnapshot', () => {
    it('should call RPC function to capture snapshot', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.rpc as any).mockResolvedValue({ data: 15, error: null });

      const result = await captureKPISnapshot(mockTenantId, '2025-01-01');
      
      expect(result).toBe(15);
      expect(supabase.rpc).toHaveBeenCalledWith('capture_kpi_snapshot', {
        p_tenant_id: mockTenantId,
        p_snapshot_date: '2025-01-01'
      });
    });
  });

  describe('detectKPIAlerts', () => {
    it('should call RPC function to detect alerts', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.rpc as any).mockResolvedValue({ data: 3, error: null });

      const result = await detectKPIAlerts(mockTenantId);
      
      expect(result).toBe(3);
      expect(supabase.rpc).toHaveBeenCalledWith('detect_kpi_alerts', {
        p_tenant_id: mockTenantId
      });
    });
  });

  describe('calculateHistoricalComparison', () => {
    it('should calculate changes between current and historical data', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const currentKPIs = [
        {
          tenant_id: mockTenantId,
          module: 'risk' as const,
          kpi_key: 'risk_001',
          kpi_name: 'Risk Score',
          entity_id: '1',
          entity_name: 'Risk 1',
          current_value: 20,
          target_value: 25,
          status: 'active',
          last_updated: '2025-01-31',
          metadata: {}
        }
      ];

      const historicalSnapshots = [
        {
          id: 'snap-1',
          tenant_id: mockTenantId,
          snapshot_date: '2025-01-01',
          module: 'risk',
          kpi_key: 'risk_001',
          kpi_name: 'Risk Score',
          current_value: 15,
          target_value: 25,
          status: 'active',
          metadata: {},
          created_at: '2025-01-01'
        }
      ];

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        const data = callCount === 1 ? currentKPIs : historicalSnapshots;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data, error: null })
        };
      });

      const result = await calculateHistoricalComparison(mockTenantId, 30);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        module: 'risk',
        kpi_key: 'risk_001',
        current_value: 20,
        previous_value: 15,
        change_percentage: expect.closeTo(33.33, 2),
        change_direction: 'up'
      });
    });
  });
});
