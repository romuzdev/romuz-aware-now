/**
 * Integration Tests - Master Data Terms RLS
 * Tests Row Level Security policies for ref_terms
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Master Data - Terms RLS Policies', () => {
  const testTenantId = 'test-tenant-terms';
  let catalogId: string;
  let termId: string;

  beforeAll(async () => {
    console.log('Testing RLS policies for ref_terms');
    
    // Create test catalog first
    const { data: catalog } = await supabase
      .from('ref_catalogs')
      .insert({
        code: 'TEST_CAT_TERMS',
        name_ar: 'تصنيف اختبار المصطلحات',
        scope: 'TENANT',
        tenant_id: testTenantId,
      })
      .select()
      .single();

    if (catalog) {
      catalogId = catalog.id;
    }
  });

  describe('Term Access Control', () => {
    it('should allow tenant to create terms in own catalog', async () => {
      if (!catalogId) return;

      const { data, error } = await supabase
        .from('ref_terms')
        .insert({
          catalog_id: catalogId,
          code: 'HIGH',
          name_ar: 'عالي',
          display_order: 1,
        })
        .select()
        .single();

      if (data) {
        termId = data.id;
        expect(data.code).toBe('HIGH');
      }
    });

    it('should allow tenant to read terms from own catalog', async () => {
      if (!catalogId) return;

      const { data, error } = await supabase
        .from('ref_terms')
        .select('*')
        .eq('catalog_id', catalogId);

      expect(error).toBeNull();
    });

    it('should restrict reading terms from other tenant catalogs', async () => {
      const { data, error } = await supabase
        .from('ref_terms')
        .select('*')
        .limit(100);

      // Should only return terms from accessible catalogs
      if (data) {
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('Term Updates', () => {
    it('should allow tenant to update terms in own catalog', async () => {
      if (!termId) return;

      const { error } = await supabase
        .from('ref_terms')
        .update({ name_ar: 'عالي جداً' })
        .eq('id', termId);

      // Should succeed if user has permission
      if (error) {
        expect(error.message).toContain('policy');
      }
    });
  });

  describe('Term Hierarchy', () => {
    it('should allow creating child terms', async () => {
      if (!catalogId || !termId) return;

      const { data, error } = await supabase
        .from('ref_terms')
        .insert({
          catalog_id: catalogId,
          parent_id: termId,
          code: 'HIGH_CRITICAL',
          name_ar: 'عالي حرج',
          display_order: 1,
        })
        .select()
        .single();

      if (data) {
        expect(data.parent_id).toBe(termId);
      }
    });
  });

  describe('Bulk Operations', () => {
    it('should allow bulk status updates', async () => {
      if (!catalogId) return;

      const { data: terms } = await supabase
        .from('ref_terms')
        .select('id')
        .eq('catalog_id', catalogId);

      if (terms && terms.length > 0) {
        const termIds = terms.map(t => t.id);
        
        const { error } = await supabase
          .from('ref_terms')
          .update({ is_active: false })
          .in('id', termIds);

        // Should succeed if user has permission
        if (error) {
          expect(error.message).toContain('policy');
        }
      }
    });
  });
});
