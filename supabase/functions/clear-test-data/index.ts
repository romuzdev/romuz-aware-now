import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get tenant_id
    const { data: userTenant } = await supabaseClient
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    const tenantId = userTenant?.tenant_id;
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'No tenant found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting test data cleanup for tenant:', tenantId);

    let deletedCount = 0;

    // Delete in reverse order of dependencies

    // 1. Delete campaign participants (depends on campaigns)
    const { error: participantsError, count: participantsCount } = await supabaseClient
      .from('campaign_participants')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (participantsError) throw participantsError;
    deletedCount += participantsCount || 0;
    console.log('Deleted campaign participants:', participantsCount);

    // 2. Delete campaign modules
    // First get test campaign IDs
    const { data: testCampaigns } = await supabaseClient
      .from('awareness_campaigns')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (testCampaigns && testCampaigns.length > 0) {
      const campaignIds = testCampaigns.map((c: any) => c.id);
      
      const { error: modulesError, count: modulesCount } = await supabaseClient
        .from('campaign_modules')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenantId)
        .in('campaign_id', campaignIds);

      if (modulesError) console.warn('Error deleting modules:', modulesError);
      deletedCount += modulesCount || 0;
      console.log('Deleted campaign modules:', modulesCount);
    }

    // 3. Delete campaigns
    const { error: campaignsError, count: campaignsCount } = await supabaseClient
      .from('awareness_campaigns')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (campaignsError) throw campaignsError;
    deletedCount += campaignsCount || 0;
    console.log('Deleted campaigns:', campaignsCount);

    // 4. Delete policies
    const { error: policiesError, count: policiesCount } = await supabaseClient
      .from('policies')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (policiesError) throw policiesError;
    deletedCount += policiesCount || 0;
    console.log('Deleted policies:', policiesCount);

    // 5. Delete committee members (depends on committees)
    const { data: testCommittees } = await supabaseClient
      .from('committees')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (testCommittees && testCommittees.length > 0) {
      const committeeIds = testCommittees.map(c => c.id);

      const { error: membersError, count: membersCount } = await supabaseClient
        .from('committee_members')
        .delete({ count: 'exact' })
        .in('committee_id', committeeIds);

      if (membersError) console.warn('Error deleting committee members:', membersError);
      deletedCount += membersCount || 0;
      console.log('Deleted committee members:', membersCount);

      // Delete meetings
      const { error: meetingsError, count: meetingsCount } = await supabaseClient
        .from('meetings')
        .delete({ count: 'exact' })
        .in('committee_id', committeeIds);

      if (meetingsError) console.warn('Error deleting meetings:', meetingsError);
      deletedCount += meetingsCount || 0;
      console.log('Deleted meetings:', meetingsCount);
    }

    // 6. Delete committees
    const { error: committeesError, count: committeesCount } = await supabaseClient
      .from('committees')
      .delete({ count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('is_test', true);

    if (committeesError) throw committeesError;
    deletedCount += committeesCount || 0;
    console.log('Deleted committees:', committeesCount);

    // 7. Delete KPIs (depends on objectives)
    const { data: testObjectives } = await supabaseClient
      .from('objectives')
      .select('id')
      .eq('tenant_id', tenantId);

    if (testObjectives && testObjectives.length > 0) {
      const objectiveIds = testObjectives.map(o => o.id);

      const { error: kpisError, count: kpisCount } = await supabaseClient
        .from('kpi_catalog')
        .delete({ count: 'exact' })
        .in('objective_id', objectiveIds);

      if (kpisError) console.warn('Error deleting KPIs:', kpisError);
      deletedCount += kpisCount || 0;
      console.log('Deleted KPIs:', kpisCount);

      // Delete initiatives
      const { error: initiativesError, count: initiativesCount } = await supabaseClient
        .from('initiatives')
        .delete({ count: 'exact' })
        .in('objective_id', objectiveIds);

      if (initiativesError) console.warn('Error deleting initiatives:', initiativesError);
      deletedCount += initiativesCount || 0;
      console.log('Deleted initiatives:', initiativesCount);
    }

    // 8. Delete objectives (only test ones if we had a flag, otherwise skip for safety)
    // Since objectives don't have is_test flag, we'll skip deleting them
    // to avoid accidentally deleting real data

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم حذف البيانات التجريبية بنجاح',
        deletedCount,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error clearing test data:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'فشل في حذف البيانات التجريبية',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
