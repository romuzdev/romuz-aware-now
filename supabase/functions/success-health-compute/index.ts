/**
 * M25 - Success Health Compute Edge Function
 * Computes tenant health scores based on multiple dimensions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  adoption_score: number;
  data_quality_score: number;
  compliance_score: number;
  risk_hygiene_score: number;
  overall_score: number;
  health_status: string;
  metrics: Record<string, any>;
  recommendations_count: number;
  critical_issues_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Computing health scores for user:', user.id);

    // Get tenant ID
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (rolesError || !userRoles) {
      throw new Error('Tenant not found');
    }

    const tenantId = userRoles.tenant_id;
    console.log('Computing for tenant:', tenantId);

    // Compute health metrics
    const metrics = await computeHealthMetrics(supabase, tenantId);

    // Save snapshot
    const { data: snapshot, error: insertError } = await supabase
      .from('success_health_snapshots')
      .insert({
        tenant_id: tenantId,
        org_unit_id: null,
        snapshot_date: new Date().toISOString().split('T')[0],
        overall_score: metrics.overall_score,
        adoption_score: metrics.adoption_score,
        data_quality_score: metrics.data_quality_score,
        compliance_score: metrics.compliance_score,
        risk_hygiene_score: metrics.risk_hygiene_score,
        health_status: metrics.health_status,
        metrics: metrics.metrics,
        recommendations_count: metrics.recommendations_count,
        critical_issues_count: metrics.critical_issues_count,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Health snapshot created:', snapshot.id);

    return new Response(
      JSON.stringify({ success: true, snapshot }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function computeHealthMetrics(supabase: any, tenantId: string): Promise<HealthMetrics> {
  // 1. Adoption Score (30% weight)
  const adoptionScore = await computeAdoptionScore(supabase, tenantId);

  // 2. Data Quality Score (20% weight)
  const dataQualityScore = await computeDataQualityScore(supabase, tenantId);

  // 3. Compliance Score (25% weight)
  const complianceScore = await computeComplianceScore(supabase, tenantId);

  // 4. Risk Hygiene Score (25% weight)
  const riskHygieneScore = await computeRiskHygieneScore(supabase, tenantId);

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    adoptionScore * 0.30 +
    dataQualityScore * 0.20 +
    complianceScore * 0.25 +
    riskHygieneScore * 0.25
  );

  // Determine health status
  const healthStatus = determineHealthStatus(overallScore);

  // Count recommendations and critical issues
  const { recommendations_count, critical_issues_count } = await countIssues(
    supabase,
    tenantId,
    {
      adoptionScore,
      dataQualityScore,
      complianceScore,
      riskHygieneScore,
    }
  );

  return {
    adoption_score: adoptionScore,
    data_quality_score: dataQualityScore,
    compliance_score: complianceScore,
    risk_hygiene_score: riskHygieneScore,
    overall_score: overallScore,
    health_status: healthStatus,
    metrics: {
      adoption: await getAdoptionMetrics(supabase, tenantId),
      dataQuality: await getDataQualityMetrics(supabase, tenantId),
      compliance: await getComplianceMetrics(supabase, tenantId),
      riskHygiene: await getRiskHygieneMetrics(supabase, tenantId),
    },
    recommendations_count,
    critical_issues_count,
  };
}

async function computeAdoptionScore(supabase: any, tenantId: string): Promise<number> {
  // Active users percentage
  const { count: totalUsers } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: activeUsers } = await supabase
    .from('audit_log')
    .select('actor', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const userEngagement = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

  // Active campaigns
  const { count: activeCampaigns } = await supabase
    .from('awareness_campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const campaignScore = activeCampaigns > 0 ? Math.min(activeCampaigns * 20, 100) : 0;

  // Weighted average
  return Math.round(userEngagement * 0.6 + campaignScore * 0.4);
}

async function computeDataQualityScore(supabase: any, tenantId: string): Promise<number> {
  // Policies with descriptions
  const { data: policies } = await supabase
    .from('policies')
    .select('description_ar')
    .eq('tenant_id', tenantId);

  const policiesWithDesc = policies?.filter((p: any) => p.description_ar)?.length || 0;
  const policiesScore = policies?.length > 0
    ? (policiesWithDesc / policies.length) * 100
    : 50;

  // Documents with metadata
  const { data: documents } = await supabase
    .from('documents')
    .select('description')
    .eq('tenant_id', tenantId);

  const docsWithDesc = documents?.filter((d: any) => d.description)?.length || 0;
  const docsScore = documents?.length > 0
    ? (docsWithDesc / documents.length) * 100
    : 50;

  // Weighted average
  return Math.round(policiesScore * 0.5 + docsScore * 0.5);
}

async function computeComplianceScore(supabase: any, tenantId: string): Promise<number> {
  // Active policies
  const { count: activePolicies } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const policyScore = activePolicies > 0 ? Math.min(activePolicies * 10, 100) : 0;

  // Recent audits
  const { data: audits } = await supabase
    .from('grc_audits')
    .select('status')
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  const completedAudits = audits?.filter((a: any) => a.status === 'completed')?.length || 0;
  const auditScore = audits?.length > 0
    ? (completedAudits / audits.length) * 100
    : 50;

  // Weighted average
  return Math.round(policyScore * 0.4 + auditScore * 0.6);
}

async function computeRiskHygieneScore(supabase: any, tenantId: string): Promise<number> {
  // Risks with treatment plans
  const { data: risks } = await supabase
    .from('grc_risks')
    .select('risk_status')
    .eq('tenant_id', tenantId);

  const treatedRisks = risks?.filter((r: any) => r.risk_status === 'treated')?.length || 0;
  const riskScore = risks?.length > 0
    ? (treatedRisks / risks.length) * 100
    : 50;

  // Recent risk assessments
  const { count: recentAssessments } = await supabase
    .from('grc_risks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const assessmentScore = recentAssessments > 0 ? Math.min(recentAssessments * 15, 100) : 0;

  // Weighted average
  return Math.round(riskScore * 0.6 + assessmentScore * 0.4);
}

function determineHealthStatus(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs_attention';
  return 'critical';
}

async function countIssues(
  supabase: any,
  tenantId: string,
  scores: any
): Promise<{ recommendations_count: number; critical_issues_count: number }> {
  let recommendationsCount = 0;
  let criticalIssuesCount = 0;

  // Check each dimension
  if (scores.adoptionScore < 50) {
    recommendationsCount++;
    if (scores.adoptionScore < 30) criticalIssuesCount++;
  }

  if (scores.dataQualityScore < 50) {
    recommendationsCount++;
    if (scores.dataQualityScore < 30) criticalIssuesCount++;
  }

  if (scores.complianceScore < 50) {
    recommendationsCount++;
    if (scores.complianceScore < 30) criticalIssuesCount++;
  }

  if (scores.riskHygieneScore < 50) {
    recommendationsCount++;
    if (scores.riskHygieneScore < 30) criticalIssuesCount++;
  }

  return { recommendations_count: recommendationsCount, critical_issues_count: criticalIssuesCount };
}

async function getAdoptionMetrics(supabase: any, tenantId: string): Promise<any> {
  const { count: totalUsers } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: activeUsers } = await supabase
    .from('audit_log')
    .select('actor', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return { totalUsers, activeUsers };
}

async function getDataQualityMetrics(supabase: any, tenantId: string): Promise<any> {
  const { count: totalPolicies } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: totalDocuments } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return { totalPolicies, totalDocuments };
}

async function getComplianceMetrics(supabase: any, tenantId: string): Promise<any> {
  const { count: activePolicies } = await supabase
    .from('policies')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  const { count: totalAudits } = await supabase
    .from('grc_audits')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return { activePolicies, totalAudits };
}

async function getRiskHygieneMetrics(supabase: any, tenantId: string): Promise<any> {
  const { count: totalRisks } = await supabase
    .from('grc_risks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const { count: treatedRisks } = await supabase
    .from('grc_risks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('risk_status', 'treated');

  return { totalRisks, treatedRisks };
}
