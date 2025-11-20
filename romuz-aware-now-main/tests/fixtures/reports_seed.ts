/**
 * Gate-F: Reports & Exports Test Fixtures
 * Multi-tenant seed data with deterministic KPIs for validation
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface ReportTestTenant {
  id: string;
  name: string;
}

export interface ReportTestUser {
  id: string;
  email: string;
  tenantId: string;
  accessToken: string;
  roles: string[];
}

export interface ReportTestCampaign {
  id: string;
  tenantId: string;
  name: string;
  isTest: boolean;
  startDate: string;
  endDate: string;
  ownerName: string;
}

export interface DailyKPIRow {
  tenant_id: string;
  campaign_id: string;
  date: string;
  deliveries: number;
  opens: number;
  clicks: number;
  bounces: number;
  reminders: number;
  completed_count: number;
  activated_count: number;
}

export interface KPISnapshot {
  campaign_id: string;
  campaign_name: string;
  total_deliveries: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  total_reminders: number;
  total_completed: number;
  total_activated: number;
  avg_open_rate: number;
  avg_ctr: number;
  avg_completion_rate: number;
  avg_activation_rate: number;
}

export interface ReportsSeedData {
  tenantA: ReportTestTenant;
  tenantB: ReportTestTenant;
  adminA: ReportTestUser;
  analystA: ReportTestUser;
  employeeB: ReportTestUser;
  campaigns: {
    camp_real_1: ReportTestCampaign;
    camp_real_2: ReportTestCampaign;
    camp_test_1: ReportTestCampaign;
  };
  kpisSnapshot: KPISnapshot[];
}

/**
 * Generate deterministic KPI values for a given day index (0-6)
 */
function generateKPIsForDay(dayIndex: number, campaignSeed: number): {
  deliveries: number;
  opens: number;
  clicks: number;
  bounces: number;
  reminders: number;
  completed: number;
  activated: number;
} {
  // Base values multiplied by campaign seed for variation
  const baseDeliveries = 100 + dayIndex * 10;
  const deliveries = baseDeliveries * campaignSeed;
  
  // Realistic ratios
  const opens = Math.floor(deliveries * 0.65); // 65% open rate
  const clicks = Math.floor(opens * 0.35); // 35% click rate of opens
  const bounces = Math.floor(deliveries * 0.02); // 2% bounce rate
  const reminders = Math.floor(deliveries * 0.15); // 15% reminders sent
  const completed = Math.floor(clicks * 0.8); // 80% of clickers complete
  const activated = Math.floor(completed * 0.9); // 90% of completers activate
  
  return {
    deliveries,
    opens,
    clicks,
    bounces,
    reminders,
    completed,
    activated,
  };
}

/**
 * Get date in Riyadh timezone for a given offset (days ago)
 * Returns YYYY-MM-DD format
 */
function getRiyadhDate(daysAgo: number): string {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Convert to Riyadh timezone (UTC+3)
  const riyadhOffset = 3 * 60; // minutes
  const localOffset = targetDate.getTimezoneOffset(); // minutes
  const riyadhTime = new Date(targetDate.getTime() + (riyadhOffset + localOffset) * 60 * 1000);
  
  return riyadhTime.toISOString().split('T')[0];
}

/**
 * Seed comprehensive test data for Gate-F Reports & Exports
 */
export async function seedReportsTestData(supabase: SupabaseClient): Promise<ReportsSeedData> {
  console.log('🌱 Seeding Gate-F Reports test data...');

  // ============ 1. Create Tenants ============
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .insert([
      { name: 'Tenant Alpha Corp', domain: 'alpha-reports.test', is_active: true },
      { name: 'Tenant Beta Inc', domain: 'beta-reports.test', is_active: true },
    ])
    .select();

  if (tenantsError) throw new Error(`Failed to seed tenants: ${tenantsError.message}`);
  if (!tenants || tenants.length < 2) throw new Error('Failed to create tenants');

  const tenantA = tenants[0];
  const tenantB = tenants[1];

  console.log(`  ✓ Created tenants: ${tenantA.name}, ${tenantB.name}`);

  // ============ 2. Create Users ============
  const timestamp = Date.now();
  const adminAEmail = `admin-a-${timestamp}@reports.test`;
  const analystAEmail = `analyst-a-${timestamp}@reports.test`;
  const employeeBEmail = `employee-b-${timestamp}@reports.test`;

  // Create auth users
  const { data: authAdminA, error: authAdminAError } = await supabase.auth.admin.createUser({
    email: adminAEmail,
    password: 'ReportsTest123!',
    email_confirm: true,
  });

  const { data: authAnalystA, error: authAnalystAError } = await supabase.auth.admin.createUser({
    email: analystAEmail,
    password: 'ReportsTest123!',
    email_confirm: true,
  });

  const { data: authEmployeeB, error: authEmployeeBError } = await supabase.auth.admin.createUser({
    email: employeeBEmail,
    password: 'ReportsTest123!',
    email_confirm: true,
  });

  if (authAdminAError || !authAdminA.user) {
    throw new Error(`Failed to create adminA: ${authAdminAError?.message}`);
  }
  if (authAnalystAError || !authAnalystA.user) {
    throw new Error(`Failed to create analystA: ${authAnalystAError?.message}`);
  }
  if (authEmployeeBError || !authEmployeeB.user) {
    throw new Error(`Failed to create employeeB: ${authEmployeeBError?.message}`);
  }

  // Map users to tenants
  await supabase.from('user_tenants').insert([
    { user_id: authAdminA.user.id, tenant_id: tenantA.id, role: 'admin' },
    { user_id: authAnalystA.user.id, tenant_id: tenantA.id, role: 'member' },
    { user_id: authEmployeeB.user.id, tenant_id: tenantB.id, role: 'member' },
  ]);

  // Assign RBAC roles for reporting
  await supabase.from('user_roles').insert([
    // adminA: admin role (has view_reports + export_reports)
    { user_id: authAdminA.user.id, role: 'admin', created_by: authAdminA.user.id },
    // analystA: analyst role (has view_reports + export_reports)
    { user_id: authAnalystA.user.id, role: 'analyst', created_by: authAdminA.user.id },
    // employeeB: no reporting roles (viewer only - no reports access)
  ]);

  console.log(`  ✓ Created users with RBAC:`);
  console.log(`    - ${adminAEmail} (admin - full reports access)`);
  console.log(`    - ${analystAEmail} (analyst - full reports access)`);
  console.log(`    - ${employeeBEmail} (employee - no reports access)`);

  // Generate access tokens
  const { data: sessionAdminA } = await supabase.auth.signInWithPassword({
    email: adminAEmail,
    password: 'ReportsTest123!',
  });

  const { data: sessionAnalystA } = await supabase.auth.signInWithPassword({
    email: analystAEmail,
    password: 'ReportsTest123!',
  });

  const { data: sessionEmployeeB } = await supabase.auth.signInWithPassword({
    email: employeeBEmail,
    password: 'ReportsTest123!',
  });

  if (!sessionAdminA?.session?.access_token || !sessionAnalystA?.session?.access_token || !sessionEmployeeB?.session?.access_token) {
    throw new Error('Failed to get access tokens');
  }

  const adminA: ReportTestUser = {
    id: authAdminA.user.id,
    email: adminAEmail,
    tenantId: tenantA.id,
    accessToken: sessionAdminA.session.access_token,
    roles: ['admin'],
  };

  const analystA: ReportTestUser = {
    id: authAnalystA.user.id,
    email: analystAEmail,
    tenantId: tenantA.id,
    accessToken: sessionAnalystA.session.access_token,
    roles: ['analyst'],
  };

  const employeeB: ReportTestUser = {
    id: authEmployeeB.user.id,
    email: employeeBEmail,
    tenantId: tenantB.id,
    accessToken: sessionEmployeeB.session.access_token,
    roles: [],
  };

  // ============ 3. Create Campaigns ============
  const today = getRiyadhDate(0);
  const startDate = getRiyadhDate(30); // 30 days ago
  const endDate = getRiyadhDate(-30); // 30 days future

  const { data: campaigns, error: campaignsError } = await supabase
    .from('awareness_campaigns')
    .insert([
      {
        tenant_id: tenantA.id,
        name: 'Real Campaign 1',
        description: 'Production campaign with real traffic',
        owner_name: 'Admin A',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        is_test: false,
        created_by: adminA.id,
      },
      {
        tenant_id: tenantA.id,
        name: 'Real Campaign 2',
        description: 'Production campaign with real traffic',
        owner_name: 'Analyst A',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        is_test: false,
        created_by: analystA.id,
      },
      {
        tenant_id: tenantA.id,
        name: 'Test Campaign 1',
        description: 'Test campaign for internal testing',
        owner_name: 'Admin A',
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        is_test: true, // Mark as test traffic
        created_by: adminA.id,
      },
    ])
    .select();

  if (campaignsError) throw new Error(`Failed to seed campaigns: ${campaignsError.message}`);
  if (!campaigns || campaigns.length < 3) throw new Error('Failed to create campaigns');

  const camp_real_1: ReportTestCampaign = {
    id: campaigns[0].id,
    tenantId: tenantA.id,
    name: campaigns[0].name,
    isTest: false,
    startDate,
    endDate,
    ownerName: 'Admin A',
  };

  const camp_real_2: ReportTestCampaign = {
    id: campaigns[1].id,
    tenantId: tenantA.id,
    name: campaigns[1].name,
    isTest: false,
    startDate,
    endDate,
    ownerName: 'Analyst A',
  };

  const camp_test_1: ReportTestCampaign = {
    id: campaigns[2].id,
    tenantId: tenantA.id,
    name: campaigns[2].name,
    isTest: true,
    startDate,
    endDate,
    ownerName: 'Admin A',
  };

  console.log(`  ✓ Created campaigns:`);
  console.log(`    - ${camp_real_1.name} (real traffic)`);
  console.log(`    - ${camp_real_2.name} (real traffic)`);
  console.log(`    - ${camp_test_1.name} (test traffic - is_test=true)`);

  // ============ 4. Seed Base Data for KPIs (Participants + Notifications) ============
  const participantsToCreate: any[] = [];
  const notificationLogsToCreate: any[] = [];

  // Create participants and notification logs for each campaign
  const campaignsToSeed = [
    { campaign: camp_real_1, seed: 1 },
    { campaign: camp_real_2, seed: 2 },
    { campaign: camp_test_1, seed: 3 },
  ];

  for (const { campaign, seed } of campaignsToSeed) {
    for (let day = 6; day >= 0; day--) {
      const kpis = generateKPIsForDay(day, seed);
      const dateStr = getRiyadhDate(day);
      const createdAt = new Date(dateStr + 'T08:00:00+03:00').toISOString(); // 8 AM Riyadh time

      // Create participants for this day
      // Each delivery = 1 participant
      for (let i = 0; i < kpis.deliveries; i++) {
        const employeeRef = `EMP-${campaign.name.slice(-1)}-${dateStr}-${String(i).padStart(4, '0')}`;
        
        let status = 'not_started';
        let completedAt = null;
        let score = null;

        if (i < kpis.activated) {
          status = 'in_progress';
        }
        if (i < kpis.completed) {
          status = 'completed';
          completedAt = new Date(new Date(createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString(); // 12 hours later
          score = 70 + Math.floor(Math.random() * 30); // 70-100
        }

        participantsToCreate.push({
          tenant_id: tenantA.id,
          campaign_id: campaign.id,
          employee_ref: employeeRef,
          status,
          completed_at: completedAt,
          score,
          created_at: createdAt,
        });

        // Create notification logs for deliveries, opens, clicks, bounces, reminders
        if (i < kpis.deliveries) {
          // Delivery
          notificationLogsToCreate.push({
            tenant_id: tenantA.id,
            campaign_id: campaign.id,
            participant_id: null, // Will be filled after participant creation
            employee_ref: employeeRef,
            transport: 'email',
            template_key: 'campaign_invite',
            status: i < kpis.bounces ? 'bounced' : 'delivered',
            sent_at: createdAt,
          });
        }

        if (i < kpis.opens) {
          // Open
          notificationLogsToCreate.push({
            tenant_id: tenantA.id,
            campaign_id: campaign.id,
            participant_id: null,
            employee_ref: employeeRef,
            transport: 'email',
            template_key: 'campaign_opened',
            status: 'delivered',
            sent_at: new Date(new Date(createdAt).getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour later
          });
        }

        if (i < kpis.clicks) {
          // Click
          notificationLogsToCreate.push({
            tenant_id: tenantA.id,
            campaign_id: campaign.id,
            participant_id: null,
            employee_ref: employeeRef,
            transport: 'email',
            template_key: 'campaign_clicked',
            status: 'delivered',
            sent_at: new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
          });
        }

        if (i < kpis.reminders) {
          // Reminder
          notificationLogsToCreate.push({
            tenant_id: tenantA.id,
            campaign_id: campaign.id,
            participant_id: null,
            employee_ref: employeeRef,
            transport: 'email',
            template_key: 'campaign_reminder',
            status: 'delivered',
            sent_at: new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours later
          });
        }
      }
    }
  }

  // Insert participants in batches (Supabase limit: 1000 per batch)
  const BATCH_SIZE = 1000;
  let totalParticipants = 0;

  for (let i = 0; i < participantsToCreate.length; i += BATCH_SIZE) {
    const batch = participantsToCreate.slice(i, i + BATCH_SIZE);
    const { error: participantsError } = await supabase
      .from('campaign_participants')
      .insert(batch);

    if (participantsError) {
      throw new Error(`Failed to seed participants (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${participantsError.message}`);
    }
    totalParticipants += batch.length;
  }

  console.log(`  ✓ Seeded ${totalParticipants} campaign participants (7 days × 3 campaigns)`);

  // Get participant IDs to link notification logs
  const { data: createdParticipants, error: fetchParticipantsError } = await supabase
    .from('campaign_participants')
    .select('id, employee_ref, campaign_id')
    .eq('tenant_id', tenantA.id)
    .in('campaign_id', [camp_real_1.id, camp_real_2.id, camp_test_1.id]);

  if (fetchParticipantsError) {
    throw new Error(`Failed to fetch created participants: ${fetchParticipantsError.message}`);
  }

  // Map employee_ref to participant_id
  const participantMap = new Map<string, string>();
  createdParticipants?.forEach(p => {
    participantMap.set(`${p.campaign_id}:${p.employee_ref}`, p.id);
  });

  // Update notification logs with participant IDs
  notificationLogsToCreate.forEach(log => {
    const key = `${log.campaign_id}:${log.employee_ref}`;
    log.participant_id = participantMap.get(key) || log.participant_id;
    delete log.employee_ref; // Remove temporary field
  });

  // Insert notification logs in batches
  let totalNotifications = 0;

  for (let i = 0; i < notificationLogsToCreate.length; i += BATCH_SIZE) {
    const batch = notificationLogsToCreate.slice(i, i + BATCH_SIZE);
    const { error: notificationError } = await supabase
      .from('notification_log')
      .insert(batch);

    if (notificationError) {
      throw new Error(`Failed to seed notification logs (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${notificationError.message}`);
    }
    totalNotifications += batch.length;
  }

  console.log(`  ✓ Seeded ${totalNotifications} notification log entries (deliveries, opens, clicks, bounces, reminders)`);

  // ============ 5. Refresh Materialized Views ============
  await refreshReportViews(supabase);

  // ============ 6. Generate Canonical Snapshot ============
  const kpisSnapshot = generateCanonicalSnapshot([
    { campaign: camp_real_1, seed: 1 },
    { campaign: camp_real_2, seed: 2 },
    { campaign: camp_test_1, seed: 3 },
  ]);

  console.log(`  ✓ Generated canonical KPI snapshot for validation`);
  console.log('✅ Gate-F Reports test data seeded successfully\n');

  return {
    tenantA,
    tenantB,
    adminA,
    analystA,
    employeeB,
    campaigns: {
      camp_real_1,
      camp_real_2,
      camp_test_1,
    },
    kpisSnapshot,
  };
}

/**
 * Refresh report materialized views
 */
export async function refreshReportViews(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc('refresh_report_views');
  
  if (error) throw new Error(`Failed to refresh report views: ${error.message}`);
  
  console.log(`  ✓ Refreshed mv_report_kpis_daily and vw_report_kpis_ctd`);
}

/**
 * Generate canonical snapshot of expected aggregated KPIs
 * Used for cross-checking in tests (±1% tolerance)
 */
function generateCanonicalSnapshot(campaigns: Array<{ campaign: ReportTestCampaign; seed: number }>): KPISnapshot[] {
  return campaigns.map(({ campaign, seed }) => {
    let totalDeliveries = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalBounces = 0;
    let totalReminders = 0;
    let totalCompleted = 0;
    let totalActivated = 0;

    // Aggregate 7 days
    for (let day = 0; day <= 6; day++) {
      const kpis = generateKPIsForDay(day, seed);
      totalDeliveries += kpis.deliveries;
      totalOpens += kpis.opens;
      totalClicks += kpis.clicks;
      totalBounces += kpis.bounces;
      totalReminders += kpis.reminders;
      totalCompleted += kpis.completed;
      totalActivated += kpis.activated;
    }

    const avgOpenRate = totalDeliveries > 0 ? totalOpens / totalDeliveries : 0;
    const avgCtr = totalOpens > 0 ? totalClicks / totalOpens : 0;
    const avgCompletionRate = totalClicks > 0 ? totalCompleted / totalClicks : 0;
    const avgActivationRate = totalCompleted > 0 ? totalActivated / totalCompleted : 0;

    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      total_deliveries: totalDeliveries,
      total_opens: totalOpens,
      total_clicks: totalClicks,
      total_bounces: totalBounces,
      total_reminders: totalReminders,
      total_completed: totalCompleted,
      total_activated: totalActivated,
      avg_open_rate: avgOpenRate,
      avg_ctr: avgCtr,
      avg_completion_rate: avgCompletionRate,
      avg_activation_rate: avgActivationRate,
    };
  });
}

/**
 * Clean up Gate-F Reports test data
 */
export async function teardownReportsTestData(
  supabase: SupabaseClient,
  seedData: ReportsSeedData
): Promise<void> {
  console.log('🧹 Cleaning up Gate-F Reports test data...');

  // Delete in reverse order of dependencies
  await supabase.from('report_exports').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('mv_campaign_kpis_daily').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('campaign_participants').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('awareness_campaigns').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('saved_views').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  await supabase.from('audit_log').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);
  
  // Delete user roles
  await supabase.from('user_roles').delete().in('user_id', [
    seedData.adminA.id,
    seedData.analystA.id,
    seedData.employeeB.id,
  ]);
  
  await supabase.from('user_tenants').delete().in('tenant_id', [seedData.tenantA.id, seedData.tenantB.id]);

  // Delete auth users
  await supabase.auth.admin.deleteUser(seedData.adminA.id);
  await supabase.auth.admin.deleteUser(seedData.analystA.id);
  await supabase.auth.admin.deleteUser(seedData.employeeB.id);

  // Delete tenants
  await supabase.from('tenants').delete().in('id', [seedData.tenantA.id, seedData.tenantB.id]);

  console.log('✅ Gate-F Reports test data cleaned up\n');
}
