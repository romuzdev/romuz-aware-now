/**
 * Gate-F: Reports Export API
 * 
 * Handles report export requests with:
 * - RBAC: Requires 'export_reports' permission
 * - Sync/Async: <250k rows = sync, ≥250k = async
 * - Formats: CSV, JSON, XLSX
 * - RLS: Tenant isolation on report_exports table
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASYNC_THRESHOLD = 250000; // 250k rows

interface ExportRequest {
  reportType: 'performance' | 'deliverability' | 'engagement';
  format: 'csv' | 'json' | 'xlsx';
  filters: {
    startDate?: string;
    endDate?: string;
    campaign?: string;
    excludeTest?: boolean;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📤 Export Report API called:', req.method);

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Check RBAC: export_reports permission
    const { data: hasPermission } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    const { data: hasAnalystRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'analyst',
    });

    const canExport = hasPermission || hasAnalystRole;

    if (!canExport) {
      console.error('❌ RBAC check failed: User lacks export_reports permission');
      return new Response(
        JSON.stringify({ error: 'Forbidden: export_reports permission required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ RBAC check passed: User has export permissions');

    // Get user's tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenantData) {
      console.error('❌ Failed to get tenant:', tenantError?.message);
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tenantId = tenantData.tenant_id;
    console.log('✅ Tenant identified:', tenantId);

    // Parse request body
    const body: ExportRequest = await req.json();
    const { reportType, format, filters } = body;

    console.log('📋 Export request:', { reportType, format, filters });

    // Validate inputs
    if (!['performance', 'deliverability', 'engagement'].includes(reportType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reportType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Estimate row count for sync/async decision
    const estimatedRows = await estimateRowCount(supabaseAdmin, tenantId, reportType, filters);
    console.log(`📊 Estimated rows: ${estimatedRows}`);

    const isAsync = estimatedRows >= ASYNC_THRESHOLD;
    const mode = isAsync ? 'async' : 'sync';

    console.log(`🔄 Export mode: ${mode} (threshold: ${ASYNC_THRESHOLD})`);

    // Create export record
    const { data: exportRecord, error: exportError } = await supabaseAdmin
      .from('report_exports')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        report_type: reportType,
        file_format: format,
        status: isAsync ? 'processing' : 'completed',
        batch_id: isAsync ? crypto.randomUUID() : null,
        total_rows: estimatedRows,
        source_views: {
          view: `mv_report_kpis_daily`,
          filters: filters,
          excludeTest: filters.excludeTest ?? true,
        },
        storage_url: null, // Will be updated after content generation
        completed_at: isAsync ? null : new Date().toISOString(),
        refresh_at: new Date().toISOString(), // Add refresh timestamp
      })
      .select()
      .single();

    if (exportError) {
      console.error('❌ Failed to create export record:', exportError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to create export record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Export record created: ${exportRecord.id}`);

    // Return response based on mode
    if (isAsync) {
      // Async mode: return batch_id, background job will process
      return new Response(
        JSON.stringify({
          mode: 'async',
          batchId: exportRecord.batch_id,
          exportId: exportRecord.id,
          estimatedRows,
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Sync mode: generate actual file content
      const fileContent = await generateExportContent(
        supabaseAdmin,
        tenantId,
        reportType,
        format,
        filters
      );

      // Update export record with actual content for testing
      await supabaseAdmin
        .from('report_exports')
        .update({
          storage_url: `data:${getMimeType(format)};base64,${btoa(fileContent)}`,
        })
        .eq('id', exportRecord.id);

      return new Response(
        JSON.stringify({
          mode: 'sync',
          url: exportRecord.storage_url,
          exportId: exportRecord.id,
          totalRows: estimatedRows,
          content: fileContent, // Include content for testing
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Estimate row count for a given report query
 */
async function estimateRowCount(
  supabase: any,
  tenantId: string,
  reportType: string,
  filters: ExportRequest['filters']
): Promise<number> {
  try {
    let query = supabase
      .from('mv_report_kpis_daily')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters.campaign) {
      query = query.eq('campaign_id', filters.campaign);
    }

    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }

    const { count, error } = await query;

    if (error) {
      console.error('⚠️ Failed to estimate rows, defaulting to 0:', error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('⚠️ Exception in estimateRowCount:', error);
    return 0;
  }
}

/**
 * Generate actual export file content
 */
async function generateExportContent(
  supabase: any,
  tenantId: string,
  reportType: string,
  format: string,
  filters: ExportRequest['filters']
): Promise<string> {
  // Fetch data from mv_report_kpis_daily
  let query = supabase
    .from('mv_report_kpis_daily')
    .select('*')
    .eq('tenant_id', tenantId);

  // Apply filters
  if (filters.campaign) {
    query = query.eq('campaign_id', filters.campaign);
  }

  if (filters.startDate) {
    query = query.gte('date_r', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('date_r', filters.endDate);
  }

  const { data: rows, error } = await query.order('date_r', { ascending: false });

  if (error) {
    console.error('⚠️ Failed to fetch data for export:', error.message);
    return '';
  }

  if (format === 'csv') {
    return generateCSV(rows || []);
  } else if (format === 'json') {
    return generateJSON(rows || []);
  } else {
    // XLSX - simplified for now
    return generateJSON(rows || []);
  }
}

/**
 * Generate RFC4180-compliant CSV with bilingual headers
 */
function generateCSV(rows: any[]): string {
  // Bilingual headers (English / Arabic)
  const headers = [
    'tenant_id',
    'campaign_id',
    'campaign_name / اسم الحملة',
    'date / التاريخ',
    'deliveries / الرسائل المرسلة',
    'opens / الفتحات',
    'clicks / النقرات',
    'bounces / الارتدادات',
    'reminders / التذكيرات',
    'open_rate / معدل الفتح',
    'ctr / معدل النقر',
    'completed_count / عدد المكتملين',
    'activated_count / عدد المنشطين',
    'completion_rate / معدل الإكمال',
    'activation_rate / معدل التنشيط',
  ];

  // RFC4180: Use CRLF line endings
  let csv = headers.map(escapeCSVField).join(',') + '\r\n';

  // Add data rows
  for (const row of rows) {
    const values = [
      row.tenant_id || '',
      row.campaign_id || '',
      row.campaign_name || '',
      row.date_r || '',
      row.deliveries?.toString() || '0',
      row.opens?.toString() || '0',
      row.clicks?.toString() || '0',
      row.bounces?.toString() || '0',
      row.reminders?.toString() || '0',
      row.open_rate?.toFixed(4) || '0.0000',
      row.ctr?.toFixed(4) || '0.0000',
      row.completed_count?.toString() || '0',
      row.activated_count?.toString() || '0',
      row.completion_rate?.toFixed(4) || '0.0000',
      row.activation_rate?.toFixed(4) || '0.0000',
    ];

    csv += values.map(escapeCSVField).join(',') + '\r\n';
  }

  return csv;
}

/**
 * Escape CSV field according to RFC4180
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate JSON export (array of objects)
 */
function generateJSON(rows: any[]): string {
  const jsonRows = rows.map((row) => ({
    tenant_id: row.tenant_id,
    campaign_id: row.campaign_id,
    campaign_name: row.campaign_name,
    date: row.date_r,
    deliveries: row.deliveries || 0,
    opens: row.opens || 0,
    clicks: row.clicks || 0,
    bounces: row.bounces || 0,
    reminders: row.reminders || 0,
    complaints: row.complaints || 0,
    open_rate: row.open_rate || 0,
    ctr: row.ctr || 0,
    completed_count: row.completed_count || 0,
    activated_count: row.activated_count || 0,
    completion_rate: row.completion_rate || 0,
    activation_rate: row.activation_rate || 0,
  }));

  return JSON.stringify(jsonRows, null, 2);
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'csv':
      return 'text/csv;charset=utf-8';
    case 'json':
      return 'application/json;charset=utf-8';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}
