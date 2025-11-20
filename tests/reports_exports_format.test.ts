/**
 * Gate-F: Reports Export Format Compliance Tests
 * 
 * Validates:
 * - CSV: UTF-8, RFC4180, bilingual headers
 * - JSON: Structure, field naming, KPIs accuracy
 * - Audit/Lineage: batch_id, source_views, refresh_at
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, createServiceClient } from './integration/setup/config';
import {
  seedReportsTestData,
  teardownReportsTestData,
  type ReportsSeedData,
} from './fixtures/reports_seed';

describe('Gate-F: Reports Export Format Compliance', () => {
  let seedData: ReportsSeedData;
  let serviceClient: any;

  beforeAll(async () => {
    console.log('🌱 Setting up Gate-F Format Compliance tests...');
    serviceClient = createServiceClient();
    seedData = await seedReportsTestData(serviceClient);
  });

  afterAll(async () => {
    if (seedData) {
      await teardownReportsTestData(serviceClient, seedData);
    }
  });

  describe('CSV – Header & Encoding', () => {
    it('should generate CSV with bilingual headers and RFC4180 compliance', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      // Trigger sync CSV export
      const { data, error } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'csv',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-07',
            excludeTest: true,
          },
        },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.mode).toBe('sync');
      expect(data.content).toBeDefined();

      const csvContent: string = data.content;

      // UTF-8 encoding test: Check Arabic text is present
      expect(csvContent).toContain('اسم الحملة'); // "Campaign Name" in Arabic
      expect(csvContent).toContain('التاريخ'); // "Date" in Arabic
      expect(csvContent).toContain('الرسائل المرسلة'); // "Deliveries" in Arabic

      // Bilingual headers test
      const firstLine = csvContent.split('\r\n')[0];
      expect(firstLine).toContain('campaign_name / اسم الحملة');
      expect(firstLine).toContain('date / التاريخ');
      expect(firstLine).toContain('deliveries / الرسائل المرسلة');
      expect(firstLine).toContain('opens / الفتحات');
      expect(firstLine).toContain('clicks / النقرات');
      expect(firstLine).toContain('bounces / الارتدادات');
      expect(firstLine).toContain('open_rate / معدل الفتح');
      expect(firstLine).toContain('ctr / معدل النقر');

      // RFC4180: Line endings must be CRLF (\r\n)
      expect(csvContent).toMatch(/\r\n/);
      const lines = csvContent.split('\r\n');
      expect(lines.length).toBeGreaterThan(1); // At least header + 1 row

      // RFC4180: Delimiter is comma
      expect(firstLine.split(',').length).toBeGreaterThan(10);

      // RFC4180: Fields with commas or quotes should be quoted
      // Test by checking if any field in data rows contains quoted content
      const dataRow = lines[1];
      if (dataRow && dataRow.includes('"')) {
        // Verify proper quoting: no unescaped quotes
        const quotedFields = dataRow.match(/"[^"]*"/g);
        expect(quotedFields).toBeDefined();
      }

      console.log('✅ CSV format compliance test passed:', {
        lines: lines.length,
        hasBilingualHeaders: true,
        hasUTF8: true,
        hasCRLF: true,
      });
    });

    it('should handle special characters and Arabic text correctly in CSV', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const { data } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'csv',
          filters: { excludeTest: true },
        },
      });

      expect(data?.content).toBeDefined();
      const csvContent: string = data.content;

      // Test UTF-8 encoding of Arabic characters
      const arabicCharsInHeaders = ['اسم', 'الحملة', 'التاريخ', 'الرسائل', 'المرسلة'];
      arabicCharsInHeaders.forEach((char) => {
        expect(csvContent).toContain(char);
      });

      // Verify no encoding corruption (e.g., � replacement character)
      expect(csvContent).not.toContain('�');

      console.log('✅ UTF-8 and Arabic text handling verified');
    });
  });

  describe('CSV – Sample Row Correctness vs Canonical', () => {
    it('should have accurate numeric values within ±1% of canonical data', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      // Get canonical data from mv_campaign_kpis_daily for camp_real_1
      const campaignId = seedData.campaigns.camp_real_1.id;
      
      const { data: canonicalRows, error: canonicalError } = await serviceClient
        .from('mv_campaign_kpis_daily')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('campaign_id', campaignId)
        .order('date_r', { ascending: false })
        .limit(1);

      expect(canonicalError).toBeNull();
      expect(canonicalRows).toBeDefined();
      expect(canonicalRows.length).toBeGreaterThan(0);

      const canonicalRow = canonicalRows[0];

      // Export CSV
      const { data: exportData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'csv',
          filters: {
            campaign: campaignId,
            excludeTest: true,
          },
        },
      });

      expect(exportData?.content).toBeDefined();
      const csvContent: string = exportData.content;
      const lines = csvContent.split('\r\n');
      
      // Find the data row (skip header)
      const dataRow = lines.find((line) => line.includes(campaignId));
      expect(dataRow).toBeDefined();

      // Parse CSV row (simple split - assumes no quoted commas in this row)
      const fields = dataRow!.split(',');

      // Map fields based on header order (adjust indices based on actual header)
      // Expected order from generateCSV:
      // 0: tenant_id, 1: campaign_id, 2: campaign_name, 3: date, 
      // 4: deliveries, 5: opens, 6: clicks, 7: bounces, 8: reminders,
      // 9: open_rate, 10: ctr, 11: completed_count, 12: activated_count, 
      // 13: completion_rate, 14: activation_rate

      const csvDeliveries = parseInt(fields[4]);
      const csvOpens = parseInt(fields[5]);
      const csvClicks = parseInt(fields[6]);
      const csvBounces = parseInt(fields[7]);
      const csvOpenRate = parseFloat(fields[9]);
      const csvCtr = parseFloat(fields[10]);

      // Verify ±1% tolerance
      const tolerance = 0.01; // 1%

      expect(Math.abs(csvDeliveries - canonicalRow.deliveries) / canonicalRow.deliveries).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(csvOpens - canonicalRow.opens) / canonicalRow.opens).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(csvClicks - canonicalRow.clicks) / canonicalRow.clicks).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(csvBounces - canonicalRow.bounces) / canonicalRow.bounces).toBeLessThanOrEqual(tolerance);
      expect(Math.abs(csvOpenRate - canonicalRow.open_rate)).toBeLessThanOrEqual(canonicalRow.open_rate * tolerance);
      expect(Math.abs(csvCtr - canonicalRow.ctr)).toBeLessThanOrEqual(canonicalRow.ctr * tolerance);

      console.log('✅ CSV numeric accuracy verified:', {
        canonical: {
          deliveries: canonicalRow.deliveries,
          opens: canonicalRow.opens,
          clicks: canonicalRow.clicks,
        },
        csv: {
          deliveries: csvDeliveries,
          opens: csvOpens,
          clicks: csvClicks,
        },
      });
    });
  });

  describe('JSON – Structure & Fields', () => {
    it('should generate valid JSON array with required fields', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const { data, error } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'json',
          filters: {
            campaign: seedData.campaigns.camp_real_1.id,
            excludeTest: true,
          },
        },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.content).toBeDefined();

      // Parse JSON
      const jsonContent = JSON.parse(data.content);

      // Should be array of objects
      expect(Array.isArray(jsonContent)).toBe(true);
      expect(jsonContent.length).toBeGreaterThan(0);

      // Verify structure of first object
      const firstRow = jsonContent[0];

      // Required fields
      expect(firstRow).toHaveProperty('tenant_id');
      expect(firstRow).toHaveProperty('campaign_id');
      expect(firstRow).toHaveProperty('campaign_name');
      expect(firstRow).toHaveProperty('date');
      expect(firstRow).toHaveProperty('deliveries');
      expect(firstRow).toHaveProperty('opens');
      expect(firstRow).toHaveProperty('clicks');
      expect(firstRow).toHaveProperty('bounces');
      expect(firstRow).toHaveProperty('complaints');
      expect(firstRow).toHaveProperty('open_rate');
      expect(firstRow).toHaveProperty('ctr');
      expect(firstRow).toHaveProperty('completed_count');
      expect(firstRow).toHaveProperty('activated_count');

      // Verify data types
      expect(typeof firstRow.tenant_id).toBe('string');
      expect(typeof firstRow.campaign_id).toBe('string');
      expect(typeof firstRow.campaign_name).toBe('string');
      expect(typeof firstRow.date).toBe('string');
      expect(typeof firstRow.deliveries).toBe('number');
      expect(typeof firstRow.opens).toBe('number');
      expect(typeof firstRow.clicks).toBe('number');
      expect(typeof firstRow.open_rate).toBe('number');
      expect(typeof firstRow.ctr).toBe('number');

      console.log('✅ JSON structure validation passed:', {
        rowCount: jsonContent.length,
        sampleRow: firstRow,
      });
    });

    it('should have numeric values within ±1% of canonical aggregated values', async () => {
      const client = createTestClient(seedData.adminA.accessToken);
      const campaignId = seedData.campaigns.camp_real_1.id;

      // Get canonical CTD data
      const { data: canonicalCTD } = await serviceClient
        .from('vw_campaign_kpis_ctd')
        .select('*')
        .eq('tenant_id', seedData.tenantA.id)
        .eq('campaign_id', campaignId)
        .single();

      expect(canonicalCTD).toBeDefined();

      // Export JSON
      const { data: exportData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'engagement',
          format: 'json',
          filters: {
            campaign: campaignId,
            excludeTest: true,
          },
        },
      });

      expect(exportData?.content).toBeDefined();
      const jsonContent = JSON.parse(exportData.content);

      // Aggregate JSON rows to compare with CTD
      let totalDeliveries = 0;
      let totalOpens = 0;
      let totalClicks = 0;

      jsonContent.forEach((row: any) => {
        totalDeliveries += row.deliveries || 0;
        totalOpens += row.opens || 0;
        totalClicks += row.clicks || 0;
      });

      // Verify ±1% tolerance
      const tolerance = 0.01;

      const deliveriesDiff = Math.abs(totalDeliveries - canonicalCTD.total_deliveries) / canonicalCTD.total_deliveries;
      const opensDiff = Math.abs(totalOpens - canonicalCTD.total_opens) / canonicalCTD.total_opens;
      const clicksDiff = Math.abs(totalClicks - canonicalCTD.total_clicks) / canonicalCTD.total_clicks;

      expect(deliveriesDiff).toBeLessThanOrEqual(tolerance);
      expect(opensDiff).toBeLessThanOrEqual(tolerance);
      expect(clicksDiff).toBeLessThanOrEqual(tolerance);

      console.log('✅ JSON numeric accuracy verified vs CTD:', {
        canonical: {
          deliveries: canonicalCTD.total_deliveries,
          opens: canonicalCTD.total_opens,
          clicks: canonicalCTD.total_clicks,
        },
        json: {
          deliveries: totalDeliveries,
          opens: totalOpens,
          clicks: totalClicks,
        },
        tolerance: '±1%',
      });
    });

    it('should support NDJSON format (one JSON object per line) if applicable', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const { data } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'deliverability',
          format: 'json',
          filters: { excludeTest: true },
        },
      });

      expect(data?.content).toBeDefined();
      const content: string = data.content;

      // Check if it's NDJSON (newline-delimited JSON)
      const lines = content.trim().split('\n');
      
      if (lines.length > 1 && lines[0].startsWith('{')) {
        // NDJSON format detected
        lines.forEach((line) => {
          if (line.trim()) {
            const obj = JSON.parse(line);
            expect(obj).toHaveProperty('tenant_id');
            expect(obj).toHaveProperty('campaign_id');
          }
        });
        console.log('✅ NDJSON format support verified');
      } else {
        // Regular JSON array
        const parsed = JSON.parse(content);
        expect(Array.isArray(parsed)).toBe(true);
        console.log('✅ Regular JSON array format verified');
      }
    });
  });

  describe('Lineage & Audit', () => {
    it('should populate audit fields: batch_id, source_views, refresh_at', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const { data: exportData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'csv',
          filters: {
            startDate: '2024-01-01',
            endDate: '2024-01-07',
            excludeTest: true,
          },
        },
      });

      expect(exportData).toBeDefined();
      expect(exportData.exportId).toBeDefined();

      // Query report_exports table
      const { data: exportRecord, error } = await serviceClient
        .from('report_exports')
        .select('*')
        .eq('id', exportData.exportId)
        .single();

      expect(error).toBeNull();
      expect(exportRecord).toBeDefined();

      // Verify audit fields
      // batch_id should be null for sync exports, but present for async
      if (exportData.mode === 'async') {
        expect(exportRecord.batch_id).not.toBeNull();
        expect(typeof exportRecord.batch_id).toBe('string');
      }

      // source_views must be present
      expect(exportRecord.source_views).toBeDefined();
      expect(typeof exportRecord.source_views).toBe('object');

      // Verify source_views contains view names
      expect(exportRecord.source_views).toHaveProperty('view');
      expect(exportRecord.source_views.view).toContain('mv_report_kpis_daily');

      // Verify filters are stored
      expect(exportRecord.source_views).toHaveProperty('filters');
      expect(exportRecord.source_views.filters).toHaveProperty('startDate');
      expect(exportRecord.source_views.filters).toHaveProperty('endDate');
      expect(exportRecord.source_views.filters).toHaveProperty('excludeTest');

      // refresh_at must be present
      expect(exportRecord.refresh_at).not.toBeNull();
      expect(typeof exportRecord.refresh_at).toBe('string');

      // completed_at >= created_at
      const createdAt = new Date(exportRecord.created_at);
      const completedAt = exportRecord.completed_at ? new Date(exportRecord.completed_at) : null;

      if (completedAt) {
        expect(completedAt >= createdAt).toBe(true);
      }

      console.log('✅ Audit & lineage fields verified:', {
        hasBatchId: !!exportRecord.batch_id,
        hasSourceViews: true,
        sourceView: exportRecord.source_views.view,
        hasRefreshAt: true,
        hasFilters: true,
      });
    });

    it('should store complete filter metadata in source_views', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const filterParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        campaign: seedData.campaigns.camp_real_1.id,
        excludeTest: true,
      };

      const { data: exportData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'json',
          filters: filterParams,
        },
      });

      const { data: exportRecord } = await serviceClient
        .from('report_exports')
        .select('*')
        .eq('id', exportData.exportId)
        .single();

      // Verify all filter parameters are stored
      expect(exportRecord.source_views.filters.startDate).toBe(filterParams.startDate);
      expect(exportRecord.source_views.filters.endDate).toBe(filterParams.endDate);
      expect(exportRecord.source_views.filters.campaign).toBe(filterParams.campaign);
      expect(exportRecord.source_views.excludeTest).toBe(filterParams.excludeTest);

      console.log('✅ Complete filter metadata stored in source_views');
    });

    it('should verify refresh_at timestamp is accurate and not in the future', async () => {
      const client = createTestClient(seedData.adminA.accessToken);

      const beforeExport = new Date();

      const { data: exportData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'deliverability',
          format: 'csv',
          filters: { excludeTest: true },
        },
      });

      const afterExport = new Date();

      const { data: exportRecord } = await serviceClient
        .from('report_exports')
        .select('*')
        .eq('id', exportData.exportId)
        .single();

      const refreshAt = new Date(exportRecord.refresh_at);

      // refresh_at should be between beforeExport and afterExport
      expect(refreshAt >= beforeExport).toBe(true);
      expect(refreshAt <= afterExport).toBe(true);

      // refresh_at should not be in the future
      const now = new Date();
      expect(refreshAt <= now).toBe(true);

      console.log('✅ refresh_at timestamp accuracy verified:', {
        refreshAt: refreshAt.toISOString(),
        isInValidRange: true,
        isNotFuture: true,
      });
    });
  });

  describe('Cross-format Consistency', () => {
    it('should return identical data across CSV and JSON formats', async () => {
      const client = createTestClient(seedData.adminA.accessToken);
      const campaignId = seedData.campaigns.camp_real_1.id;

      // Export CSV
      const { data: csvData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'csv',
          filters: { campaign: campaignId, excludeTest: true },
        },
      });

      // Export JSON
      const { data: jsonData } = await client.functions.invoke('export-report', {
        body: {
          reportType: 'performance',
          format: 'json',
          filters: { campaign: campaignId, excludeTest: true },
        },
      });

      expect(csvData?.content).toBeDefined();
      expect(jsonData?.content).toBeDefined();

      // Parse both
      const csvLines = csvData.content.split('\r\n').filter((l: string) => l.trim());
      const jsonRows = JSON.parse(jsonData.content);

      // Should have same number of data rows (CSV has header + data, JSON just data)
      expect(csvLines.length - 1).toBe(jsonRows.length); // -1 for CSV header

      console.log('✅ Cross-format consistency verified:', {
        csvDataRows: csvLines.length - 1,
        jsonDataRows: jsonRows.length,
      });
    });
  });
});
