/**
 * Performance Tests: Campaign Loading & Queries
 * اختبارات الأداء لتحميل الحملات والاستعلامات
 */

import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Performance Tests - Campaigns Module', () => {
  describe('Query Performance', () => {
    it('should load campaigns list within acceptable time', async () => {
      const startTime = performance.now();

      const { data, error } = await supabase
        .from('awareness_campaigns')
        .select('*')
        .eq('is_test', true)
        .order('created_at', { ascending: false })
        .limit(50);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(300); // أقل من 300ms
      
      console.log(`✅ Campaigns list loaded in ${duration.toFixed(2)}ms`);
    });

    it('should handle pagination efficiently', async () => {
      const pageSize = 20;
      const startTime = performance.now();

      // صفحة 1
      const { data: page1 } = await supabase
        .from('awareness_campaigns')
        .select('*')
        .range(0, pageSize - 1);

      // صفحة 2
      const { data: page2 } = await supabase
        .from('awareness_campaigns')
        .select('*')
        .range(pageSize, pageSize * 2 - 1);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // أقل من 500ms للصفحتين
      console.log(`✅ Pagination (2 pages) completed in ${duration.toFixed(2)}ms`);
    });

    it('should perform filtered search efficiently', async () => {
      const startTime = performance.now();

      const { data, error } = await supabase
        .from('awareness_campaigns')
        .select('*')
        .eq('status', 'active')
        .gte('start_date', '2025-01-01')
        .order('created_at', { ascending: false })
        .limit(20);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(250); // أقل من 250ms
      
      console.log(`✅ Filtered search completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk participant creation efficiently', async () => {
      const participantCount = 100;
      const participants = Array.from({ length: participantCount }, (_, i) => ({
        tenant_id: 'test-tenant-perf',
        campaign_id: 'test-campaign-perf',
        employee_ref: `EMP-${i}`,
        status: 'invited',
        is_test: true,
      }));

      const startTime = performance.now();

      const { error } = await supabase
        .from('campaign_participants')
        .insert(participants);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(2000); // أقل من 2 ثانية لـ 100 مشارك
      
      console.log(`✅ Bulk insert (${participantCount} rows) in ${duration.toFixed(2)}ms`);

      // Cleanup
      await supabase
        .from('campaign_participants')
        .delete()
        .eq('campaign_id', 'test-campaign-perf');
    });

    it('should handle bulk status updates efficiently', async () => {
      const startTime = performance.now();

      const { error } = await supabase
        .from('campaign_participants')
        .update({ status: 'opened' })
        .eq('campaign_id', 'test-campaign-perf')
        .eq('status', 'invited');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // أقل من 1 ثانية
      
      console.log(`✅ Bulk update completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Aggregation Performance', () => {
    it('should calculate campaign KPIs efficiently', async () => {
      const campaignId = 'test-campaign-kpi';
      const startTime = performance.now();

      // Count total participants
      const { count: totalCount } = await supabase
        .from('campaign_participants')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      // Count completed
      const { count: completedCount } = await supabase
        .from('campaign_participants')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'completed');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(400); // أقل من 400ms
      
      console.log(`✅ KPI calculation completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should handle large result sets without memory issues', async () => {
      const memBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // تحميل 1000 سجل
      const { data } = await supabase
        .from('campaign_participants')
        .select('*')
        .limit(1000);

      const memAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memUsed = (memAfter - memBefore) / 1024 / 1024; // MB

      expect(data).toBeDefined();
      if (memUsed > 0) {
        expect(memUsed).toBeLessThan(50); // أقل من 50 MB
        console.log(`✅ Memory used for 1000 rows: ${memUsed.toFixed(2)} MB`);
      }
    });
  });
});
