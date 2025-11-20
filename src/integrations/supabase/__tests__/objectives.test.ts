/**
 * D4 Part 4: Unit Tests for Objectives Services Layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../client';
import {
  fetchObjectives,
  fetchObjectiveById,
  createObjective,
  updateObjective,
  deleteObjective,
  fetchKPIs,
  fetchKPIById,
  createKPI,
  updateKPI,
  deleteKPI,
} from '@/modules/objectives/integration';

// Mock Supabase client
vi.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        ilike: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock Guards
vi.mock('@/modules/objectives/integration/objectives-guards', () => ({
  ObjectiveGuards: {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireDelete: vi.fn(),
  },
  KPIGuards: {
    requireRead: vi.fn(),
    requireWrite: vi.fn(),
    requireDelete: vi.fn(),
  },
}));

describe('Objectives Services Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchObjectives', () => {
    it('should fetch all objectives successfully', async () => {
      const mockObjectives = [
        { id: '1', code: 'OBJ-001', title: 'Test Objective 1', status: 'active' },
        { id: '2', code: 'OBJ-002', title: 'Test Objective 2', status: 'archived' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockObjectives, error: null }),
        }),
      } as any);

      const result = await fetchObjectives();
      expect(result).toEqual(mockObjectives);
    });

    it('should filter objectives by status', async () => {
      const mockObjectives = [
        { id: '1', code: 'OBJ-001', title: 'Test Objective 1', status: 'active' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockObjectives, error: null }),
          }),
        }),
      } as any);

      const result = await fetchObjectives({ status: 'active' });
      expect(result).toEqual(mockObjectives);
    });

    it('should throw error when permission denied', async () => {
      const { ObjectiveGuards } = await import('@/modules/objectives/integration/objectives-guards');
      vi.mocked(ObjectiveGuards.requireRead).mockRejectedValue(
        new Error('PERMISSION_DENIED')
      );

      await expect(fetchObjectives()).rejects.toThrow('PERMISSION_DENIED');
    });
  });

  describe('createObjective', () => {
    it('should create objective successfully', async () => {
      const mockObjective = {
        id: '1',
        code: 'OBJ-001',
        title: 'New Objective',
        status: 'active' as const,
        tenant_id: 'tenant-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { tenant_id: 'tenant-1' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockObjective, error: null }),
          }),
        }),
      } as any);

      const input = {
        code: 'OBJ-001',
        title: 'New Objective',
        status: 'active' as const,
      };

      const result = await createObjective(input);
      expect(result).toEqual(mockObjective);
    });
  });

  describe('updateObjective', () => {
    it('should update objective successfully', async () => {
      const mockObjective = {
        id: '1',
        code: 'OBJ-001',
        title: 'Updated Objective',
        status: 'active' as const,
        tenant_id: 'tenant-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockObjective, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await updateObjective('1', { title: 'Updated Objective' });
      expect(result).toEqual(mockObjective);
    });
  });

  describe('deleteObjective', () => {
    it('should delete objective successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as any);

      await expect(deleteObjective('1')).resolves.not.toThrow();
    });
  });

  describe('KPIs Services', () => {
    it('should fetch KPIs successfully', async () => {
      const mockKPIs = [
        {
          id: '1',
          code: 'KPI-001',
          title: 'Test KPI',
          unit: '%',
          direction: 'up' as const,
          objective_id: 'obj-1',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockKPIs, error: null }),
        }),
      } as any);

      const result = await fetchKPIs();
      expect(result).toEqual(mockKPIs);
    });

    it('should create KPI successfully', async () => {
      const mockKPI = {
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

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { tenant_id: 'tenant-1' },
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockKPI, error: null }),
          }),
        }),
      } as any);

      const input = {
        objective_id: 'obj-1',
        code: 'KPI-001',
        title: 'New KPI',
        unit: '%',
        direction: 'up' as const,
      };

      const result = await createKPI(input);
      expect(result).toEqual(mockKPI);
    });
  });
});
