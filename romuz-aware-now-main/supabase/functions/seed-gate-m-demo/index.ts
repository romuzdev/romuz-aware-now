/**
 * Seed Gate-M Demo Data
 * Creates sample catalogs, terms, and mappings for testing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🌱 Starting Gate-M demo data seeding...');

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '').trim();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      console.error('❌ No user found');
      throw new Error('No authenticated user found');
    }
    
    console.log('✅ Authenticated user:', user.id);

    // Get user's tenant
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (tenantError) {
      console.error('❌ Error fetching tenant:', tenantError);
    }
    
    const tenantId = userTenant?.tenant_id;
    console.log('📌 Using tenant_id:', tenantId || 'null (GLOBAL)');

    const results: any = {
      catalogs: [],
      terms: [],
      mappings: [],
      errors: [],
    };

    // ============================================================================
    // 1. Create Catalogs
    // ============================================================================
    console.log('📚 Creating catalogs...');

    const catalogsData = [
      {
        code: 'DEPARTMENTS_DEMO',
        label_ar: 'الأقسام (تجريبي)',
        label_en: 'Departments (Demo)',
        scope: 'TENANT',
        tenant_id: tenantId,
        status: 'PUBLISHED',
        version: 1,
        created_by: user.id,
        updated_by: user.id,
        meta: { type: 'demo', description: 'هيكل الأقسام التنظيمية' },
      },
      {
        code: 'RISK_LEVELS_DEMO',
        label_ar: 'مستويات المخاطر (تجريبي)',
        label_en: 'Risk Levels (Demo)',
        scope: 'GLOBAL',
        tenant_id: null,
        status: 'PUBLISHED',
        version: 1,
        created_by: user.id,
        updated_by: user.id,
        meta: { type: 'demo', description: 'تصنيف درجات المخاطر' },
      },
      {
        code: 'COMPLIANCE_DEMO',
        label_ar: 'معايير الامتثال (تجريبي)',
        label_en: 'Compliance Standards (Demo)',
        scope: 'GLOBAL',
        tenant_id: null,
        status: 'PUBLISHED',
        version: 1,
        created_by: user.id,
        updated_by: user.id,
        meta: { type: 'demo', description: 'المعايير التنظيمية العالمية' },
      },
    ];

    for (const catalog of catalogsData) {
      const { data, error } = await supabase
        .from('ref_catalogs')
        .insert(catalog)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create catalog ${catalog.code}:`, error);
        results.errors.push({ type: 'catalog', code: catalog.code, error: error.message });
      } else {
        console.log(`✅ Created catalog: ${catalog.code}`);
        results.catalogs.push(data);
      }
    }

    // Get catalog IDs
    const deptCatalog = results.catalogs.find((c: any) => c.code === 'DEPARTMENTS_DEMO');
    const riskCatalog = results.catalogs.find((c: any) => c.code === 'RISK_LEVELS_DEMO');
    const complianceCatalog = results.catalogs.find((c: any) => c.code === 'COMPLIANCE_DEMO');

    // ============================================================================
    // 2. Create Terms - Departments (Hierarchical)
    // ============================================================================
    console.log('📝 Creating department terms...');

    if (deptCatalog) {
      // Main departments
      const mainDepts = [
        { code: 'IT', label_ar: 'تقنية المعلومات', label_en: 'IT', sort_order: 0, attrs: { budget: 500000 } },
        { code: 'HR', label_ar: 'الموارد البشرية', label_en: 'HR', sort_order: 1, attrs: { budget: 200000 } },
        { code: 'FIN', label_ar: 'المالية', label_en: 'Finance', sort_order: 2, attrs: { budget: 300000 } },
        { code: 'OPS', label_ar: 'العمليات', label_en: 'Operations', sort_order: 3, attrs: { budget: 400000 } },
      ];

      for (const dept of mainDepts) {
        const { data, error } = await supabase
          .from('ref_terms')
          .insert({
            catalog_id: deptCatalog.id,
            parent_id: null,
            created_by: user.id,
            updated_by: user.id,
            ...dept,
            active: true,
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to create department ${dept.code}:`, error);
          results.errors.push({ type: 'term', code: dept.code, error: error.message });
        } else if (data) {
          results.terms.push(data);
          console.log(`✅ Created department: ${dept.code}`);
        }
      }

      // IT Sub-departments
      const itDept = results.terms.find((t: any) => t.code === 'IT');
      if (itDept) {
        const itSubDepts = [
          { code: 'IT_DEV', label_ar: 'التطوير', label_en: 'Development', sort_order: 0 },
          { code: 'IT_OPS', label_ar: 'العمليات التقنية', label_en: 'IT Operations', sort_order: 1 },
          { code: 'IT_SEC', label_ar: 'الأمن السيبراني', label_en: 'Security', sort_order: 2 },
        ];

        for (const subdept of itSubDepts) {
          const { data, error } = await supabase
            .from('ref_terms')
            .insert({
              catalog_id: deptCatalog.id,
              parent_id: itDept.id,
              created_by: user.id,
              updated_by: user.id,
              ...subdept,
              active: true,
              attrs: {},
            })
            .select()
            .single();

          if (error) {
            console.error(`❌ Failed to create IT subdept ${subdept.code}:`, error);
            results.errors.push({ type: 'term', code: subdept.code, error: error.message });
          } else if (data) {
            results.terms.push(data);
            console.log(`✅ Created IT subdept: ${subdept.code}`);
          }
        }
      }
    }

    // ============================================================================
    // 3. Create Terms - Risk Levels
    // ============================================================================
    console.log('📊 Creating risk level terms...');

    if (riskCatalog) {
      const riskLevels = [
        { code: 'CRITICAL', label_ar: 'حرج', label_en: 'Critical', sort_order: 0, attrs: { score: '20-25', color: '#dc2626' } },
        { code: 'HIGH', label_ar: 'عالي', label_en: 'High', sort_order: 1, attrs: { score: '15-19', color: '#ea580c' } },
        { code: 'MEDIUM', label_ar: 'متوسط', label_en: 'Medium', sort_order: 2, attrs: { score: '10-14', color: '#f59e0b' } },
        { code: 'LOW', label_ar: 'منخفض', label_en: 'Low', sort_order: 3, attrs: { score: '5-9', color: '#84cc16' } },
      ];

      for (const level of riskLevels) {
        const { data, error } = await supabase
          .from('ref_terms')
          .insert({
            catalog_id: riskCatalog.id,
            parent_id: null,
            created_by: user.id,
            updated_by: user.id,
            ...level,
            active: true,
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to create risk level ${level.code}:`, error);
          results.errors.push({ type: 'term', code: level.code, error: error.message });
        } else if (data) {
          results.terms.push(data);
          console.log(`✅ Created risk level: ${level.code}`);
        }
      }
    }

    // ============================================================================
    // 4. Create Terms - Compliance Standards
    // ============================================================================
    console.log('🔐 Creating compliance standards...');

    if (complianceCatalog) {
      const standards = [
        { code: 'ISO27001', label_ar: 'آيزو 27001', label_en: 'ISO 27001', sort_order: 0, attrs: { authority: 'ISO' } },
        { code: 'SOC2', label_ar: 'SOC 2', label_en: 'SOC 2', sort_order: 1, attrs: { authority: 'AICPA' } },
        { code: 'GDPR', label_ar: 'اللائحة الأوروبية', label_en: 'GDPR', sort_order: 2, attrs: { authority: 'EU' } },
        { code: 'PDPL', label_ar: 'نظام حماية البيانات', label_en: 'PDPL', sort_order: 3, attrs: { authority: 'SDAIA' } },
      ];

      for (const std of standards) {
        const { data, error } = await supabase
          .from('ref_terms')
          .insert({
            catalog_id: complianceCatalog.id,
            parent_id: null,
            created_by: user.id,
            updated_by: user.id,
            ...std,
            active: true,
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to create standard ${std.code}:`, error);
          results.errors.push({ type: 'term', code: std.code, error: error.message });
        } else if (data) {
          results.terms.push(data);
          console.log(`✅ Created standard: ${std.code}`);
        }
      }
    }

    // ============================================================================
    // 5. Create Mappings (External System Integration)
    // ============================================================================
    console.log('🔗 Creating mappings...');

    if (deptCatalog) {
      const itDevTerm = results.terms.find((t: any) => t.code === 'IT_DEV');
      const itOpsTerm = results.terms.find((t: any) => t.code === 'IT_OPS');

      if (itDevTerm && itOpsTerm) {
        const mappings = [
          { term_id: itDevTerm.id, source_system: 'SAP', src_code: 'DEPT-IT-001', target_code: 'IT_DEV', notes: 'SAP Development Dept' },
          { term_id: itOpsTerm.id, source_system: 'SAP', src_code: 'DEPT-IT-002', target_code: 'IT_OPS', notes: 'SAP Operations Dept' },
          { term_id: itDevTerm.id, source_system: 'ODOO', src_code: 'DEV-TEAM', target_code: 'IT_DEV', notes: 'ODOO Dev Team' },
        ];

        for (const mapping of mappings) {
          const { data, error } = await supabase
            .from('ref_mappings')
            .insert({
              catalog_id: deptCatalog.id,
              created_by: user.id,
              ...mapping,
            })
            .select()
            .single();

          if (error) {
            console.error(`❌ Failed to create mapping ${mapping.source_system} - ${mapping.src_code}:`, error);
            results.errors.push({ type: 'mapping', code: mapping.src_code, error: error.message });
          } else if (data) {
            results.mappings.push(data);
            console.log(`✅ Created mapping: ${mapping.source_system} - ${mapping.src_code}`);
          }
        }
      }
    }

    console.log('✅ Gate-M demo data seeding completed!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء البيانات التجريبية بنجاح',
        summary: {
          catalogs: results.catalogs.length,
          terms: results.terms.length,
          mappings: results.mappings.length,
          errors: results.errors.length,
        },
        data: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Seeding error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
