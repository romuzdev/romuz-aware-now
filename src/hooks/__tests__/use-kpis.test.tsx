/**
 * D4 Part 4: Integration Tests for useKPIs Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKPIs, useCreateKPI, useKPITargets, useCreateKPITarget } from '@/modules/objectives';
import * as objectivesApi from '@/modules/objectives/integration';

// Mock the objectives API
vi.mock('@/modules/objectives/integration', () => ({
  fetchKPIs: vi.fn(),
  fetchKPIById: vi.fn(),
  createKPI: vi.fn(),
  updateKPI: vi.fn(),
  deleteKPI: vi.fn(),
  fetchKPITargets: vi.fn(),
  createKPITarget: vi.fn(),
  updateKPITarget: vi.fn(),
  deleteKPITarget: vi.fn(),
  fetchKPIReadings: vi.fn(),
  createKPIReading: vi.fn(),
  updateKPIReading: vi.fn(),
  deleteKPIReading: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useKPIs Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useKPIs', () => {
    it('should fetch KPIs successfully', async () => {
      const mockKPIs = [
        {
          id: '1',
          code: 'KPI-001',
          title: 'Test KPI 1',
          unit: '%',
          direction: 'up' as const,
          objective_id: 'obj-1',
          tenant_id: 'tenant-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(objectivesApi.fetchKPIs).mockResolvedValue(mockKPIs);

      const { result } = renderHook(() => useKPIs(), { wrapper });

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockKPIs);
    });

    it('should filter KPIs by objective', async () => {
      const mockKPIs = [
        {
          id: '1',
          code: 'KPI-001',
          title: 'Test KPI 1',
          unit: '%',
          direction: 'up' as const,
          objective_id: 'obj-1',
          tenant_id: 'tenant-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(objectivesApi.fetchKPIs).mockResolvedValue(mockKPIs);

      const { result } = renderHook(
        () => useKPIs({ objective_id: 'obj-1' }),
        { wrapper }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(objectivesApi.fetchKPIs).toHaveBeenCalledWith({ objective_id: 'obj-1' });
    });
  });

  describe('useCreateKPI', () => {
    it('should create KPI successfully', async () => {
      const newKPI = {
        id: '1',
        code: 'KPI-001',
        title: 'New KPI',
        unit: '%',
        direction: 'up' as const,
        objective_id: 'obj-1',
        tenant_id: 'tenant-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(objectivesApi.createKPI).mockResolvedValue(newKPI);

      const { result } = renderHook(() => useCreateKPI(), { wrapper });

      result.current.mutate({
        objective_id: 'obj-1',
        code: 'KPI-001',
        title: 'New KPI',
        unit: '%',
        direction: 'up',
      });

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(newKPI);
    });
  });

  describe('useKPITargets', () => {
    it('should fetch KPI targets successfully', async () => {
      const mockTargets = [
        {
          id: '1',
          kpi_id: 'kpi-1',
          period: '2024-01',
          target_value: 80,
          tenant_id: 'tenant-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(objectivesApi.fetchKPITargets).mockResolvedValue(mockTargets);

      const { result } = renderHook(() => useKPITargets('kpi-1'), { wrapper });

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockTargets);
    });
  });

  describe('useCreateKPITarget', () => {
    it('should create KPI target successfully', async () => {
      const newTarget = {
        id: '1',
        kpi_id: 'kpi-1',
        period: '2024-01',
        target_value: 80,
        tenant_id: 'tenant-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(objectivesApi.createKPITarget).mockResolvedValue(newTarget);

      const { result } = renderHook(() => useCreateKPITarget(), { wrapper });

      result.current.mutate({
        kpi_id: 'kpi-1',
        period: '2024-01',
        target_value: 80,
      });

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(newTarget);
    });
  });
});
