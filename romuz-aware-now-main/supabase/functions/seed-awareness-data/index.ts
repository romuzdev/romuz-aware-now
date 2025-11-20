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

    console.log('Starting seed data creation for tenant:', tenantId);

    // 1. Seed Campaigns
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('awareness_campaigns')
      .insert([
        {
          tenant_id: tenantId,
          name: 'حملة التوعية بأمن المعلومات',
          description: 'حملة شاملة للتوعية بأساسيات أمن المعلومات وحماية البيانات',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          status: 'active',
          owner_name: 'إدارة أمن المعلومات',
          is_test: true,
        },
        {
          tenant_id: tenantId,
          name: 'حملة الأمن السيبراني',
          description: 'التوعية بمخاطر الهجمات السيبرانية وطرق الحماية منها',
          start_date: '2025-02-01',
          end_date: '2025-04-30',
          status: 'planned',
          owner_name: 'فريق الأمن السيبراني',
          is_test: true,
        },
        {
          tenant_id: tenantId,
          name: 'حملة حماية البيانات الشخصية',
          description: 'التوعية بأهمية حماية البيانات الشخصية والامتثال للوائح',
          start_date: '2024-12-01',
          end_date: '2025-02-28',
          status: 'completed',
          owner_name: 'قسم الامتثال',
          is_test: true,
        },
      ])
      .select();

    if (campaignsError) throw campaignsError;
    console.log('Created campaigns:', campaigns?.length);

    // 2. Seed Policies
    const { data: policies, error: policiesError } = await supabaseClient
      .from('policies')
      .insert([
        {
          tenant_id: tenantId,
          code: 'POL-001',
          title: 'سياسة أمن المعلومات',
          version: '1.0',
          status: 'active',
          effective_date: '2025-01-01',
          review_date: '2026-01-01',
          owner_user_id: user.id,
          is_test: true,
        },
        {
          tenant_id: tenantId,
          code: 'POL-002',
          title: 'سياسة إدارة الوصول',
          version: '2.1',
          status: 'active',
          effective_date: '2025-01-15',
          review_date: '2026-01-15',
          owner_user_id: user.id,
          is_test: true,
        },
        {
          tenant_id: tenantId,
          code: 'POL-003',
          title: 'سياسة النسخ الاحتياطي',
          version: '1.5',
          status: 'draft',
          effective_date: '2025-02-01',
          review_date: '2026-02-01',
          owner_user_id: user.id,
          is_test: true,
        },
      ])
      .select();

    if (policiesError) throw policiesError;
    console.log('Created policies:', policies?.length);

    // 3. Seed Committees
    const { data: committees, error: committeesError } = await supabaseClient
      .from('committees')
      .insert([
        {
          tenant_id: tenantId,
          name: 'لجنة أمن المعلومات',
          description: 'لجنة مسؤولة عن الإشراف على سياسات وإجراءات أمن المعلومات',
          status: 'active',
          meeting_frequency: 'monthly',
          is_test: true,
        },
        {
          tenant_id: tenantId,
          name: 'لجنة إدارة المخاطر',
          description: 'لجنة متخصصة في تحديد وتقييم ومعالجة المخاطر المؤسسية',
          status: 'active',
          meeting_frequency: 'quarterly',
          is_test: true,
        },
      ])
      .select();

    if (committeesError) throw committeesError;
    console.log('Created committees:', committees?.length);

    // 4. Seed Objectives
    const { data: objectives, error: objectivesError } = await supabaseClient
      .from('objectives')
      .insert([
        {
          tenant_id: tenantId,
          code: 'OBJ-001',
          title: 'تحسين الوعي الأمني',
          status: 'active',
          horizon: '2025',
          owner_user_id: user.id,
        },
        {
          tenant_id: tenantId,
          code: 'OBJ-002',
          title: 'تقليل الحوادث الأمنية',
          status: 'active',
          horizon: '2025',
          owner_user_id: user.id,
        },
      ])
      .select();

    if (objectivesError) throw objectivesError;
    console.log('Created objectives:', objectives?.length);

    // 5. Seed KPIs
    if (objectives && objectives.length > 0) {
      const { data: kpis, error: kpisError } = await supabaseClient
        .from('kpi_catalog')
        .insert([
          {
            tenant_id: tenantId,
            objective_id: objectives[0].id,
            code: 'KPI-001',
            name: 'نسبة إكمال التدريب الأمني',
            measurement_unit: 'percentage',
            direction: 'maximize',
            data_source: 'LMS System',
            frequency: 'monthly',
            status: 'active',
          },
          {
            tenant_id: tenantId,
            objective_id: objectives[1].id,
            code: 'KPI-002',
            name: 'عدد الحوادث الأمنية',
            measurement_unit: 'count',
            direction: 'minimize',
            data_source: 'Security System',
            frequency: 'monthly',
            status: 'active',
          },
        ])
        .select();

      if (kpisError) throw kpisError;
      console.log('Created KPIs:', kpis?.length);
    }

    // 6. Add some campaign participants for the first campaign
    if (campaigns && campaigns.length > 0) {
      const { error: participantsError } = await supabaseClient
        .from('campaign_participants')
        .insert([
          {
            tenant_id: tenantId,
            campaign_id: campaigns[0].id,
            employee_ref: 'EMP001',
            status: 'completed',
            invited_at: '2025-01-01T10:00:00Z',
            opened_at: '2025-01-02T09:00:00Z',
            completed_at: '2025-01-05T14:30:00Z',
            score: 85,
            is_test: true,
          },
          {
            tenant_id: tenantId,
            campaign_id: campaigns[0].id,
            employee_ref: 'EMP002',
            status: 'in_progress',
            invited_at: '2025-01-01T10:00:00Z',
            opened_at: '2025-01-03T11:00:00Z',
            is_test: true,
          },
          {
            tenant_id: tenantId,
            campaign_id: campaigns[0].id,
            employee_ref: 'EMP003',
            status: 'invited',
            invited_at: '2025-01-01T10:00:00Z',
            is_test: true,
          },
        ]);

      if (participantsError) throw participantsError;
      console.log('Created campaign participants');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء البيانات التجريبية بنجاح',
        data: {
          campaigns: campaigns?.length || 0,
          policies: policies?.length || 0,
          committees: committees?.length || 0,
          objectives: objectives?.length || 0,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error seeding data:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'فشل في إنشاء البيانات التجريبية',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
