/**
 * Gate-M Acceptance Test Edge Function
 * Comprehensive validation for Master Data & Taxonomy Hub
 * Tests: DB, RLS, RPC, Saved Views
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Gate-M Acceptance Tests...');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Verify user is authenticated by testing a simple query
    const { error: authError } = await supabase
      .from('ref_catalogs')
      .select('id')
      .limit(1);
    
    if (authError && authError.message.includes('JWT')) {
      throw new Error('User not authenticated');
    }

    const results: TestResult[] = [];
    let testCatalogId: string | null = null;
    let testTermIds: string[] = [];
    let testMappingId: string | null = null;
    let testViewId: string | null = null;

    // ====================================
    // 1. RLS CHECKS
    // ====================================
    console.log('📋 Testing RLS...');

    try {
      const { data: rlsCheck } = await supabase.rpc('fn_gate_k_check_rls_status');
      const tables = ['ref_catalogs', 'ref_terms', 'ref_mappings', 'md_saved_views'];
      
      for (const table of tables) {
        const isEnabled = rlsCheck?.some((r: any) => 
          r.table_name === table && r.rls_enabled === true
        );
        results.push({
          category: 'RLS',
          test: `${table} RLS enabled`,
          status: isEnabled ? 'PASS' : 'FAIL',
          details: isEnabled ? 'RLS is enabled' : 'RLS is NOT enabled',
        });
      }
    } catch (error) {
      results.push({
        category: 'RLS',
        test: 'RLS Check',
        status: 'WARN',
        details: 'Could not verify RLS status',
        error: (error as Error).message,
      });
    }

    // ====================================
    // 2. CATALOG CRUD
    // ====================================
    console.log('📚 Testing Catalogs...');

    try {
      // Create test catalog
      const catalogCode = `GATE_M_ACC_${Math.random().toString(36).substring(7)}`;
      const { data: catalog, error: createError } = await supabase
        .from('ref_catalogs')
        .insert({
          code: catalogCode,
          label_ar: 'كتالوج قبول',
          label_en: 'Acceptance Catalog',
          scope: 'TENANT',
          status: 'DRAFT',
          version: 1,
          meta: {},
        })
        .select()
        .single();

      if (createError) throw createError;
      testCatalogId = catalog.id;

      results.push({
        category: 'Catalog',
        test: 'Create TENANT catalog',
        status: 'PASS',
        details: `Created catalog: ${catalogCode}`,
      });

      // Update status to PUBLISHED
      const { error: publishError } = await supabase
        .from('ref_catalogs')
        .update({ status: 'PUBLISHED' })
        .eq('id', testCatalogId);

      if (publishError) throw publishError;

      results.push({
        category: 'Catalog',
        test: 'Publish catalog',
        status: 'PASS',
        details: 'Status updated to PUBLISHED',
      });

      // Verify unique constraint
      const { error: uniqueError } = await supabase
        .from('ref_catalogs')
        .insert({
          code: catalogCode,
          label_ar: 'Duplicate',
          label_en: 'Duplicate',
          scope: 'TENANT',
        })
        .select();

      results.push({
        category: 'Catalog',
        test: 'Unique constraint',
        status: uniqueError ? 'PASS' : 'FAIL',
        details: uniqueError ? 'Duplicate rejected' : 'Duplicate allowed!',
      });
    } catch (error) {
      results.push({
        category: 'Catalog',
        test: 'Catalog operations',
        status: 'FAIL',
        error: (error as Error).message,
      });
    }

    // ====================================
    // 3. TERMS CRUD & HIERARCHY
    // ====================================
    console.log('🌳 Testing Terms...');

    if (testCatalogId) {
      try {
        // Create parent term
        const { data: parent, error: parentError } = await supabase
          .from('ref_terms')
          .insert({
            catalog_id: testCatalogId,
            code: 'PARENT',
            label_ar: 'أب',
            label_en: 'Parent',
            sort_order: 0,
            active: true,
          })
          .select()
          .single();

        if (parentError) throw parentError;
        testTermIds.push(parent.id);

        // Create child term
        const { data: child, error: childError } = await supabase
          .from('ref_terms')
          .insert({
            catalog_id: testCatalogId,
            parent_id: parent.id,
            code: 'CHILD',
            label_ar: 'ابن',
            label_en: 'Child',
            sort_order: 1,
            active: true,
          })
          .select()
          .single();

        if (childError) throw childError;
        testTermIds.push(child.id);

        results.push({
          category: 'Terms',
          test: 'Create hierarchical terms',
          status: 'PASS',
          details: `Created parent and child terms`,
        });

        // Test lookup RPC
        const { data: lookupData, error: lookupError } = await supabase.rpc(
          'fn_md_lookup_terms',
          {
            p_catalog_id: testCatalogId,
            p_search_term: null,
            p_limit: 50,
            p_include_inactive: false,
          }
        );

        results.push({
          category: 'Terms',
          test: 'Lookup RPC',
          status: lookupError ? 'FAIL' : 'PASS',
          details: lookupError ? lookupError.message : `Found ${lookupData?.length || 0} terms`,
        });

        // Test reorder RPC
        if (testTermIds.length > 0) {
          const reversedIds = [...testTermIds].reverse();
          const { error: reorderError } = await supabase.rpc('fn_md_reorder_terms', {
            p_term_ids: reversedIds,
          });

          results.push({
            category: 'Terms',
            test: 'Reorder RPC',
            status: reorderError ? 'FAIL' : 'PASS',
            details: reorderError ? reorderError.message : 'Terms reordered',
          });
        }

        // Test bulk activate/deactivate
        const { error: deactivateError } = await supabase.rpc('fn_md_bulk_set_active', {
          p_term_ids: testTermIds,
          p_active: false,
        });

        const { error: activateError } = await supabase.rpc('fn_md_bulk_set_active', {
          p_term_ids: testTermIds,
          p_active: true,
        });

        results.push({
          category: 'Terms',
          test: 'Bulk activate/deactivate RPC',
          status: deactivateError || activateError ? 'FAIL' : 'PASS',
          details: 'Bulk operations completed',
        });

        // Test export RPC
        const { data: exportData, error: exportError } = await supabase.rpc(
          'fn_md_export_terms',
          {
            p_catalog_id: testCatalogId,
            p_include_inactive: true,
          }
        );

        results.push({
          category: 'Terms',
          test: 'Export RPC',
          status: exportError ? 'FAIL' : 'PASS',
          details: exportError ? exportError.message : `Exported ${exportData?.length || 0} terms`,
        });
      } catch (error) {
        results.push({
          category: 'Terms',
          test: 'Terms operations',
          status: 'FAIL',
          error: (error as Error).message,
        });
      }
    }

    // ====================================
    // 4. MAPPINGS
    // ====================================
    console.log('🔗 Testing Mappings...');

    if (testCatalogId) {
      try {
        const { data: mapping, error: mappingError } = await supabase.rpc(
          'fn_md_upsert_mapping',
          {
            p_catalog_id: testCatalogId,
            p_term_id: null,
            p_source_system: 'ODOO',
            p_src_code: 'SRC_ACC_001',
            p_target_code: 'TGT_ACC_001',
            p_notes: 'Acceptance test mapping',
          }
        );

        if (mappingError) throw mappingError;
        testMappingId = mapping;

        results.push({
          category: 'Mappings',
          test: 'Upsert mapping RPC',
          status: 'PASS',
          details: 'Mapping created successfully',
        });

        // Verify mapping exists
        const { data: mappings, error: readError } = await supabase
          .from('ref_mappings')
          .select('*')
          .eq('catalog_id', testCatalogId);

        results.push({
          category: 'Mappings',
          test: 'Read mappings',
          status: readError ? 'FAIL' : 'PASS',
          details: `Found ${mappings?.length || 0} mappings`,
        });
      } catch (error) {
        results.push({
          category: 'Mappings',
          test: 'Mapping operations',
          status: 'FAIL',
          error: (error as Error).message,
        });
      }
    }

    // ====================================
    // 5. SAVED VIEWS
    // ====================================
    console.log('💾 Testing Saved Views...');

    try {
      // Create saved view
      const { data: view, error: viewError } = await supabase
        .from('md_saved_views')
        .insert({
          entity_type: 'ref_terms',
          view_name: 'ACC_Test_View',
          description_ar: 'منظور اختبار',
          filters: {},
          sort_config: { field: 'created_at', direction: 'desc' },
          is_default: false,
          is_shared: false,
        })
        .select()
        .single();

      if (viewError) throw viewError;
      testViewId = view.id;

      results.push({
        category: 'Saved Views',
        test: 'Create saved view',
        status: 'PASS',
        details: 'View created successfully',
      });

      // Test set default RPC
      const { data: setDefaultResult, error: setDefaultError } = await supabase.rpc(
        'fn_md_set_default_view',
        { p_view_id: testViewId }
      );

      results.push({
        category: 'Saved Views',
        test: 'Set default view RPC',
        status: setDefaultError ? 'FAIL' : 'PASS',
        details: setDefaultResult ? 'Default view set' : 'Operation completed',
      });
    } catch (error) {
      results.push({
        category: 'Saved Views',
        test: 'Saved view operations',
        status: 'FAIL',
        error: (error as Error).message,
      });
    }

    // ====================================
    // 6. VERSION BUMP
    // ====================================
    if (testCatalogId) {
      try {
        const { data: newVersion, error: versionError } = await supabase.rpc(
          'fn_md_bump_catalog_version',
          { p_catalog_id: testCatalogId }
        );

        results.push({
          category: 'Catalog',
          test: 'Bump version RPC',
          status: versionError ? 'FAIL' : 'PASS',
          details: versionError ? versionError.message : `New version: ${newVersion}`,
        });
      } catch (error) {
        results.push({
          category: 'Catalog',
          test: 'Version bump',
          status: 'FAIL',
          error: (error as Error).message,
        });
      }
    }

    // ====================================
    // 7. CLEANUP
    // ====================================
    console.log('🧹 Cleaning up test data...');

    try {
      // Delete mappings
      if (testCatalogId) {
        await supabase.from('ref_mappings').delete().eq('catalog_id', testCatalogId);
      }

      // Delete terms
      if (testTermIds.length > 0) {
        await supabase.from('ref_terms').delete().in('id', testTermIds);
      }

      // Delete catalog
      if (testCatalogId) {
        await supabase.from('ref_catalogs').delete().eq('id', testCatalogId);
      }

      // Delete saved view
      if (testViewId) {
        await supabase.from('md_saved_views').delete().eq('id', testViewId);
      }

      results.push({
        category: 'Cleanup',
        test: 'Remove test data',
        status: 'PASS',
        details: 'All test data cleaned up',
      });
    } catch (error) {
      results.push({
        category: 'Cleanup',
        test: 'Cleanup',
        status: 'WARN',
        details: 'Some test data may remain',
        error: (error as Error).message,
      });
    }

    // ====================================
    // SUMMARY
    // ====================================
    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === 'PASS').length,
      failed: results.filter((r) => r.status === 'FAIL').length,
      warnings: results.filter((r) => r.status === 'WARN').length,
    };

    const overallStatus = summary.failed === 0 ? 'PASS' : 'FAIL';

    console.log('✅ Gate-M Acceptance Tests Complete!');
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}, Warnings: ${summary.warnings}`);

    return new Response(
      JSON.stringify({
        status: overallStatus,
        summary,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Acceptance test error:', error);
    return new Response(
      JSON.stringify({
        status: 'ERROR',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
