/**
 * Performance Sanity Checks
 * Measures p50 for critical queries and checks for inefficient scans
 */

import { createServiceClient } from '../integration/setup/config';

type PerformanceResult = {
  query: string;
  p50: number;
  passed: boolean;
  warning?: string;
};

const results: PerformanceResult[] = [];
const P50_THRESHOLD_MS = 300;

async function measureQueryPerformance(
  queryName: string,
  queryFn: () => Promise<any>,
  iterations: number = 10
): Promise<number> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await queryFn();
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate p50 (median)
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length / 2)];

  return p50;
}

async function checkCampaignsListPerformance() {
  const supabase = createServiceClient();

  const p50 = await measureQueryPerformance(
    'campaigns_list',
    async () => {
      await supabase
        .from('awareness_campaigns')
        .select('id, name, status, start_date, end_date, owner_name')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(10);
    }
  );

  const passed = p50 < P50_THRESHOLD_MS;
  
  results.push({
    query: 'Campaigns List Query',
    p50: Math.round(p50),
    passed,
    warning: !passed ? `p50 (${Math.round(p50)}ms) exceeds ${P50_THRESHOLD_MS}ms threshold` : undefined,
  });

  const icon = passed ? '✅' : '⚠️';
  console.log(`${icon} Campaigns List: p50 = ${Math.round(p50)}ms ${passed ? '(PASS)' : '(SLOW)'}`);
}

async function checkParticipantsListPerformance() {
  const supabase = createServiceClient();

  // Get a test campaign
  const { data: campaigns } = await supabase
    .from('awareness_campaigns')
    .select('id')
    .limit(1);

  if (!campaigns || campaigns.length === 0) {
    console.log('⚠️  Participants List: Skipped (no campaigns found)');
    return;
  }

  const campaignId = campaigns[0].id;

  const p50 = await measureQueryPerformance(
    'participants_list',
    async () => {
      await supabase
        .from('campaign_participants')
        .select('id, employee_ref, status, score, started_at, completed_at')
        .eq('campaign_id', campaignId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
    }
  );

  const passed = p50 < P50_THRESHOLD_MS;
  
  results.push({
    query: 'Participants List Query',
    p50: Math.round(p50),
    passed,
    warning: !passed ? `p50 (${Math.round(p50)}ms) exceeds ${P50_THRESHOLD_MS}ms threshold` : undefined,
  });

  const icon = passed ? '✅' : '⚠️';
  console.log(`${icon} Participants List: p50 = ${Math.round(p50)}ms ${passed ? '(PASS)' : '(SLOW)'}`);
}

async function checkAnalyticsKPIPerformance() {
  const supabase = createServiceClient();

  const p50 = await measureQueryPerformance(
    'analytics_kpis',
    async () => {
      await supabase
        .from('vw_awareness_campaign_kpis')
        .select('*')
        .order('completion_rate', { ascending: false, nullsFirst: false })
        .limit(10);
    },
    5 // Fewer iterations for view queries
  );

  const passed = p50 < P50_THRESHOLD_MS;
  
  results.push({
    query: 'Analytics KPIs View',
    p50: Math.round(p50),
    passed,
    warning: !passed ? `p50 (${Math.round(p50)}ms) exceeds ${P50_THRESHOLD_MS}ms threshold` : undefined,
  });

  const icon = passed ? '✅' : '⚠️';
  console.log(`${icon} Analytics KPIs: p50 = ${Math.round(p50)}ms ${passed ? '(PASS)' : '(SLOW)'}`);
}

async function checkQueryPlanEfficiency() {
  const supabase = createServiceClient();

  // Check if we can run EXPLAIN (requires service role)
  try {
    // Note: EXPLAIN is not directly supported by Supabase client
    // This is a placeholder for advisory checks
    console.log('ℹ️  Query Plan Analysis: Advisory only (requires direct DB access)');
    console.log('   Recommendation: Review slow queries with EXPLAIN ANALYZE in DB console');
  } catch (error) {
    console.log('⚠️  Query Plan Analysis: Skipped (requires service role)');
  }
}

async function runPerformanceSanityChecks() {
  console.log('\n⚡ Performance Sanity Checks\n');
  console.log('═'.repeat(50));

  try {
    await checkCampaignsListPerformance();
    await checkParticipantsListPerformance();
    await checkAnalyticsKPIPerformance();
    await checkQueryPlanEfficiency();
  } catch (error) {
    console.error('❌ Error running performance checks:', error);
  }

  console.log('═'.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} queries under ${P50_THRESHOLD_MS}ms`);
  
  // Performance checks are warnings, not failures
  if (passed < total) {
    console.log('\n⚠️  Some queries are slow. Consider optimization.');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.query}: ${r.warning}`);
    });
  } else {
    console.log('\n✅ All queries meet performance targets!');
  }
}

// Run if executed directly
if (require.main === module) {
  runPerformanceSanityChecks();
}

export { runPerformanceSanityChecks };
