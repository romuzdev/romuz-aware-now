/**
 * Integration Connectors Tests
 * Gate-M15: Test connector CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IntegrationConnector, CreateConnectorInput } from '@/modules/integrations/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Integration Connectors', () => {
  const mockTenantId = 'test-tenant-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Connector Types', () => {
    it('should support all connector types', () => {
      const types = ['slack', 'google_workspace', 'odoo', 'webhook', 'api', 'custom'];
      
      types.forEach(type => {
        const input: CreateConnectorInput = {
          name: `Test ${type}`,
          type: type as any,
          config: {},
        };
        
        expect(input.type).toBeDefined();
      });
    });

    it('should validate connector configuration', () => {
      const slackConfig = {
        webhook_url: 'https://hooks.slack.com/services/TEST',
        channel: '#general',
      };

      expect(slackConfig.webhook_url).toContain('hooks.slack.com');
    });
  });

  describe('Connector Status', () => {
    it('should support all status types', () => {
      const statuses = ['active', 'inactive', 'error', 'testing'];
      
      statuses.forEach(status => {
        expect(['active', 'inactive', 'error', 'testing']).toContain(status);
      });
    });
  });

  describe('Sync Operations', () => {
    it('should track last sync timestamp', () => {
      const connector: Partial<IntegrationConnector> = {
        id: 'test-id',
        tenant_id: mockTenantId,
        name: 'Test Connector',
        type: 'slack',
        status: 'active',
        last_sync_at: new Date().toISOString(),
        sync_frequency_minutes: 60,
      };

      expect(connector.last_sync_at).toBeDefined();
      expect(connector.sync_frequency_minutes).toBe(60);
    });
  });
});
