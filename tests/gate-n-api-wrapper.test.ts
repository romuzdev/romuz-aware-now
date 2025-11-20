/**
 * Gate-N API Wrapper Tests
 * Tests the TypeScript API wrapper module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGateNStatus,
  getGateNJobs,
  triggerGateNJob,
  getGateNSettings,
  updateGateNSettings
} from '@/lib/api/gateN';

// Mock fetch globally
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getGateNStatus', () => {
  it('should return typed status data on success', async () => {
    const mockResponse = {
      success: true,
      data: {
        jobs: {
          total: 5,
          enabled: 4,
          runs_last_24h: {
            succeeded: 10,
            failed: 2,
            running: 1
          }
        },
        admin_settings: {
          updated_at: '2025-11-11T12:00:00Z'
        }
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await getGateNStatus();

    expect(result.success).toBe(true);
    expect(result.data?.jobs.total).toBe(5);
    expect(result.data?.jobs.runs_last_24h.succeeded).toBe(10);
  });

  it('should handle network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await getGateNStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should use correct URL', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} })
    });

    await getGateNStatus();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/gate-n-status'),
      expect.any(Object)
    );
  });
});

describe('getGateNJobs', () => {
  it('should return typed SystemJob array', async () => {
    const mockJobs = [
      {
        id: '123',
        job_key: 'refresh_kpis',
        job_type: 'cron',
        is_enabled: true,
        schedule_cron: '0 0 * * *'
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockJobs })
    });

    const result = await getGateNJobs();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data?.[0].job_key).toBe('refresh_kpis');
  });

  it('should handle empty job list', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    const result = await getGateNJobs();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe('triggerGateNJob', () => {
  it('should POST to correct URL with job_key', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: '456', status: 'queued' } })
    });

    await triggerGateNJob('refresh_reports');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/gate-n-trigger'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ job_key: 'refresh_reports' })
      })
    );
  });

  it('should return success false on server error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error_code: 'INTERNAL_ERROR' })
    });

    const result = await triggerGateNJob('test_job');

    expect(result.success).toBe(false);
  });
});

describe('getGateNSettings', () => {
  it('should return settings object', async () => {
    const mockSettings = {
      id: '789',
      tenant_id: 'abc',
      sla_config: { reminder_sla_hours: 48 },
      feature_flags: { enable_reports: true },
      limits: { max_users: 100 },
      notification_channels: { email: true }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSettings })
    });

    const result = await getGateNSettings();

    expect(result.success).toBe(true);
    expect(result.data?.sla_config.reminder_sla_hours).toBe(48);
  });

  it('should handle null settings (new tenant)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null })
    });

    const result = await getGateNSettings();

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});

describe('updateGateNSettings', () => {
  it('should PUT with correct payload', async () => {
    const settings = {
      sla_config: { reminder_sla_hours: 72 },
      feature_flags: { new_flag: true },
      limits: { max_campaigns: 50 },
      notification_channels: { sms: false }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: settings })
    });

    await updateGateNSettings(settings);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/gate-n-settings'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(settings)
      })
    );
  });

  it('should return updated settings on success', async () => {
    const updatedSettings = {
      id: '123',
      sla_config: { reminder_sla_hours: 96 }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: updatedSettings })
    });

    const result = await updateGateNSettings({
      sla_config: { reminder_sla_hours: 96 }
    });

    expect(result.success).toBe(true);
    expect(result.data?.sla_config.reminder_sla_hours).toBe(96);
  });

  it('should handle validation errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid SLA value'
      })
    });

    const result = await updateGateNSettings({
      sla_config: { reminder_sla_hours: -1 }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid');
  });
});
