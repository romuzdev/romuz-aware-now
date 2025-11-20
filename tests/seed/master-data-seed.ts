#!/usr/bin/env tsx
/**
 * Master Data Test Seed Script
 * Run after logging in: tsx tests/seed/master-data-seed.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function seedMasterData() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🌱 Starting Master Data seeding...\n');

  try {
    // S1.1: إنشاء Catalogs
    console.log('📚 Creating catalogs...');
    
    const { data: tenantCatalog, error: tenantError } = await supabase
      .from('ref_catalogs')
      .upsert({
        code: 'AWARE_TAGS',
        label_ar: 'وسوم التوعية',
        label_en: 'Awareness Tags',
        scope: 'TENANT',
        status: 'DRAFT',
        version: 1,
        meta: {}
      }, { onConflict: 'code,scope,tenant_id', ignoreDuplicates: true })
      .select()
      .single();

    if (tenantError && tenantError.code !== '23505') {
      console.error('❌ Error creating TENANT catalog:', tenantError);
      throw tenantError;
    }

    const { data: globalCatalog, error: globalError } = await supabase
      .from('ref_catalogs')
      .upsert({
        code: 'RISK_CATEGORIES',
        label_ar: 'تصنيفات المخاطر',
        label_en: 'Risk Categories',
        scope: 'GLOBAL',
        tenant_id: null,
        status: 'DRAFT',
        version: 1,
        meta: {}
      }, { onConflict: 'code,scope,tenant_id', ignoreDuplicates: true })
      .select()
      .single();

    if (globalError && globalError.code !== '23505') {
      console.error('❌ Error creating GLOBAL catalog:', globalError);
      throw globalError;
    }

    console.log('✅ Catalogs created successfully');

    // S1.2: إنشاء Terms
    console.log('\n📝 Creating terms...');

    if (tenantCatalog?.id) {
      const awareTerms = [
        { code: 'PHISH', label_ar: 'تصيّد', label_en: 'Phishing', sort_order: 10, active: true },
        { code: 'PWD', label_ar: 'كلمة مرور', label_en: 'Password', sort_order: 20, active: true },
        { code: 'MFA', label_ar: 'تحقق متعدد', label_en: 'MFA', sort_order: 30, active: true }
      ];

      for (const term of awareTerms) {
        const { error } = await supabase
          .from('ref_terms')
          .upsert({
            catalog_id: tenantCatalog.id,
            parent_id: null,
            ...term,
            attrs: {}
          }, { onConflict: 'catalog_id,code', ignoreDuplicates: true });

        if (error && error.code !== '23505') {
          console.error(`❌ Error creating term ${term.code}:`, error);
        }
      }
      console.log('✅ AWARE_TAGS terms created');
    }

    if (globalCatalog?.id) {
      const riskTerms = [
        { code: 'OP', label_ar: 'تشغيلي', label_en: 'Operational', sort_order: 10, active: true },
        { code: 'CY', label_ar: 'سيبراني', label_en: 'Cyber', sort_order: 20, active: true },
        { code: 'CM', label_ar: 'امتثال', label_en: 'Compliance', sort_order: 30, active: true }
      ];

      for (const term of riskTerms) {
        const { error } = await supabase
          .from('ref_terms')
          .upsert({
            catalog_id: globalCatalog.id,
            parent_id: null,
            ...term,
            attrs: {}
          }, { onConflict: 'catalog_id,code', ignoreDuplicates: true });

        if (error && error.code !== '23505') {
          console.error(`❌ Error creating term ${term.code}:`, error);
        }
      }
      console.log('✅ RISK_CATEGORIES terms created');
    }

    // S1.3: إنشاء Mapping
    console.log('\n🔗 Creating mapping...');
    
    if (tenantCatalog?.id) {
      const { error: mappingError } = await supabase
        .from('ref_mappings')
        .upsert({
          catalog_id: tenantCatalog.id,
          term_id: null,
          source_system: 'Odoo',
          src_code: 'AWARE_TAGS',
          target_code: 'AWARE_TAGS',
          notes: 'Mirror code'
        }, { onConflict: 'catalog_id,term_id,source_system,src_code', ignoreDuplicates: true });

      if (mappingError && mappingError.code !== '23505') {
        console.error('❌ Error creating mapping:', mappingError);
      } else {
        console.log('✅ Mapping created');
      }
    }

    // S1.4: إنشاء Saved View
    console.log('\n👁️  Creating saved view...');
    
    const { error: viewError } = await supabase
      .from('md_saved_views')
      .insert({
        entity_type: 'ref_terms',
        view_name: 'منظور افتراضي',
        description_ar: 'فلترة بسيطة',
        filters: { active: true },
        sort_config: { orderBy: 'sort_order', orderDir: 'asc' },
        is_default: true,
        is_shared: true
      });

    if (viewError && viewError.code !== '23505') {
      console.error('❌ Error creating saved view:', viewError);
    } else {
      console.log('✅ Saved view created');
    }

    console.log('\n✅ Master Data seeded successfully! 🎉');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedMasterData();
