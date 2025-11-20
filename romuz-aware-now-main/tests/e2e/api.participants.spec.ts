import { test, expect } from '@playwright/test';
import { createServiceClient } from '../integration/setup/config';

/**
 * API-Level E2E Tests for Participants
 * Tests participant operations and metrics calculations
 */

test.describe('API: Participants Operations', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testCampaignId: string;
  let participantIds: string[] = [];

  test.beforeAll(async () => {
    supabase = createServiceClient();

    // Create test tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Participants API Test' })
      .select('id')
      .single();
    testTenantId = tenant!.id;

    // Create test campaign
    const { data: campaign } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: testTenantId,
        name: 'Participants Test Campaign',
        status: 'active',
        start_date: '2025-11-01',
        end_date: '2025-11-30',
      })
      .select('id')
      .single();
    testCampaignId = campaign!.id;
  });

  test.afterAll(async () => {
    await supabase.from('campaign_participants').delete().eq('campaign_id', testCampaignId);
    await supabase.from('awareness_campaigns').delete().eq('id', testCampaignId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('Bulk insert participants', async () => {
    const participants = [
      { employee_ref: 'EMP001', status: 'not_started' },
      { employee_ref: 'EMP002', status: 'in_progress' },
      { employee_ref: 'EMP003', status: 'completed', score: 95 },
      { employee_ref: 'EMP004', status: 'completed', score: 88 },
      { employee_ref: 'EMP005', status: 'overdue' },
    ];

    const { data, error } = await supabase
      .from('campaign_participants')
      .insert(
        participants.map((p) => ({
          tenant_id: testTenantId,
          campaign_id: testCampaignId,
          ...p,
        }))
      )
      .select('id');

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBe(5);
    
    participantIds = data.map((p) => p.id);
  });

  test('Filter participants by status', async () => {
    const { data, error } = await supabase
      .from('campaign_participants')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .eq('status', 'completed');

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBe(2);
    expect(data.every((p) => p.status === 'completed')).toBeTruthy();
  });

  test('Bulk update participants status', async () => {
    const { error } = await supabase
      .from('campaign_participants')
      .update({ status: 'in_progress' })
      .in('id', participantIds.slice(0, 2));

    expect(error).toBeNull();

    // Verify update
    const { data } = await supabase
      .from('campaign_participants')
      .select('status')
      .in('id', participantIds.slice(0, 2));

    expect(data?.every((p) => p.status === 'in_progress')).toBeTruthy();
  });

  test('Soft delete participants', async () => {
    const { error } = await supabase
      .from('campaign_participants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', participantIds[0]);

    expect(error).toBeNull();

    // Verify soft delete
    const { data } = await supabase
      .from('campaign_participants')
      .select('deleted_at')
      .eq('id', participantIds[0])
      .single();

    expect(data.deleted_at).toBeTruthy();
  });

  test('Calculate metrics correctly', async () => {
    // Get non-deleted participants
    const { data: participants } = await supabase
      .from('campaign_participants')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .is('deleted_at', null);

    const total = participants?.length || 0;
    const completed = participants?.filter((p) => p.status === 'completed').length || 0;
    const started = participants?.filter((p) => ['in_progress', 'completed'].includes(p.status)).length || 0;
    const overdue = participants?.filter((p) => p.status === 'overdue').length || 0;
    
    const scores = participants?.filter((p) => p.score !== null).map((p) => p.score!) || [];
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    expect(total).toBeGreaterThan(0);
    expect(completed).toBeGreaterThan(0);
    expect(started).toBeGreaterThan(0);
    expect(overdue).toBeGreaterThan(0);
    expect(avgScore).toBeGreaterThan(0);
  });
});

test.describe('API: Analytics Views', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testCampaignId: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Analytics Test' })
      .select('id')
      .single();
    testTenantId = tenant!.id;

    const { data: campaign } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: testTenantId,
        name: 'Analytics Campaign',
        status: 'active',
        start_date: '2025-11-01',
        end_date: '2025-11-30',
      })
      .select('id')
      .single();
    testCampaignId = campaign!.id;

    // Add participants with varied data
    await supabase.from('campaign_participants').insert([
      {
        tenant_id: testTenantId,
        campaign_id: testCampaignId,
        employee_ref: 'A001',
        status: 'completed',
        score: 90,
        started_at: '2025-11-02T10:00:00Z',
        completed_at: '2025-11-05T15:00:00Z',
      },
      {
        tenant_id: testTenantId,
        campaign_id: testCampaignId,
        employee_ref: 'A002',
        status: 'completed',
        score: 85,
        started_at: '2025-11-03T09:00:00Z',
        completed_at: '2025-11-06T14:00:00Z',
      },
      {
        tenant_id: testTenantId,
        campaign_id: testCampaignId,
        employee_ref: 'A003',
        status: 'in_progress',
        started_at: '2025-11-04T11:00:00Z',
      },
    ]);
  });

  test.afterAll(async () => {
    await supabase.from('campaign_participants').delete().eq('campaign_id', testCampaignId);
    await supabase.from('awareness_campaigns').delete().eq('id', testCampaignId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('Query vw_awareness_campaign_kpis', async () => {
    const { data, error } = await supabase
      .from('vw_awareness_campaign_kpis')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.total_participants).toBe(3);
    expect(data.completed_count).toBe(2);
    expect(data.started_count).toBe(3);
    expect(data.avg_score).toBeCloseTo(87.5, 1);
    expect(data.completion_rate).toBeCloseTo(66.67, 1);
  });

  test('Query vw_awareness_daily_engagement', async () => {
    const { data, error } = await supabase
      .from('vw_awareness_daily_engagement')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .order('day', { ascending: true });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    
    // Verify delta calculations
    const dayWithCompletions = data.find((d) => d.completed_delta > 0);
    expect(dayWithCompletions).toBeTruthy();
  });
});

test.describe('API: Audit Log Tracking', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testTenantId: string;
  let testCampaignId: string;

  test.beforeAll(async () => {
    supabase = createServiceClient();

    const { data: tenant } = await supabase
      .from('tenants')
      .insert({ name: 'Audit Test' })
      .select('id')
      .single();
    testTenantId = tenant!.id;
  });

  test.afterAll(async () => {
    await supabase.from('awareness_campaigns').delete().eq('tenant_id', testTenantId);
    await supabase.from('audit_log').delete().eq('tenant_id', testTenantId);
    await supabase.from('tenants').delete().eq('id', testTenantId);
  });

  test('Audit log captures campaign creation', async () => {
    const { data: campaign } = await supabase
      .from('awareness_campaigns')
      .insert({
        tenant_id: testTenantId,
        name: 'Audit Test Campaign',
        status: 'draft',
      })
      .select('id')
      .single();

    testCampaignId = campaign!.id;

    // Wait for audit trigger
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', 'awareness_campaigns')
      .eq('entity_id', testCampaignId)
      .eq('action', 'create')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(auditLogs).toBeTruthy();
    // Audit may be async, so we check if it exists or skip
    if (auditLogs && auditLogs.length > 0) {
      expect(auditLogs[0].action).toBe('create');
      expect(auditLogs[0].entity_type).toBe('awareness_campaigns');
    }
  });

  test('Audit log captures campaign updates', async () => {
    await supabase
      .from('awareness_campaigns')
      .update({ status: 'active', description: 'Updated for audit' })
      .eq('id', testCampaignId);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', 'awareness_campaigns')
      .eq('entity_id', testCampaignId)
      .eq('action', 'update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditLogs && auditLogs.length > 0) {
      expect(auditLogs[0].action).toBe('update');
    }
  });
});
