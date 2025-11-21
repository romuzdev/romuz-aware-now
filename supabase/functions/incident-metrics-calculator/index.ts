/**
 * M18: Incident Response System - Metrics Calculator Edge Function
 * Purpose: Calculate and update incident metrics periodically
 * 
 * Supports:
 * - Batch calculation of metrics for all incidents
 * - SLA compliance tracking
 * - Performance analytics
 * - Trend analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateRequest {
  incident_id?: string; // Calculate for specific incident
  tenant_id?: string; // Calculate for all incidents in tenant
  batch_size?: number; // Number of incidents to process in one run
  mode?: 'single' | 'batch' | 'all'; // Calculation mode
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📊 incident-metrics-calculator: Starting metrics calculation');

    const {
      incident_id,
      tenant_id,
      batch_size = 50,
      mode = 'batch',
    }: CalculateRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let results: any[] = [];
    let processedCount = 0;
    let errorCount = 0;

    // Mode 1: Calculate for single incident
    if (mode === 'single' && incident_id) {
      console.log(`📈 Calculating metrics for incident: ${incident_id}`);
      
      try {
        const { error } = await supabase
          .rpc('calculate_incident_metrics', { p_incident_id: incident_id });

        if (error) throw error;

        results.push({
          incident_id,
          status: 'success',
        });
        processedCount++;
      } catch (error) {
        console.error(`❌ Error calculating metrics for ${incident_id}:`, error);
        results.push({
          incident_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }
    // Mode 2: Batch calculation
    else if (mode === 'batch') {
      console.log(`📦 Batch calculating metrics (batch size: ${batch_size})`);

      // Get incidents that need metrics calculation
      let query = supabase
        .from('security_incidents')
        .select('id, incident_number')
        .not('closed_at', 'is', null) // Only closed incidents
        .order('updated_at', { ascending: false })
        .limit(batch_size);

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data: incidents, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log(`📋 Found ${incidents?.length || 0} incidents to process`);

      // Process each incident
      for (const incident of incidents || []) {
        try {
          const { error } = await supabase
            .rpc('calculate_incident_metrics', { p_incident_id: incident.id });

          if (error) throw error;

          results.push({
            incident_id: incident.id,
            incident_number: incident.incident_number,
            status: 'success',
          });
          processedCount++;
        } catch (error) {
          console.error(`❌ Error calculating metrics for ${incident.incident_number}:`, error);
          results.push({
            incident_id: incident.id,
            incident_number: incident.incident_number,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          errorCount++;
        }
      }
    }
    // Mode 3: Calculate all incidents (use with caution)
    else if (mode === 'all') {
      console.log('🌐 Calculating metrics for ALL incidents');

      let query = supabase
        .from('security_incidents')
        .select('id, incident_number, tenant_id')
        .order('created_at', { ascending: false });

      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }

      const { data: incidents, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log(`📋 Found ${incidents?.length || 0} incidents to process`);

      // Process each incident
      for (const incident of incidents || []) {
        try {
          const { error } = await supabase
            .rpc('calculate_incident_metrics', { p_incident_id: incident.id });

          if (error) throw error;

          processedCount++;
        } catch (error) {
          console.error(`❌ Error calculating metrics for ${incident.incident_number}:`, error);
          errorCount++;
        }

        // Log progress every 10 incidents
        if ((processedCount + errorCount) % 10 === 0) {
          console.log(`Progress: ${processedCount + errorCount} incidents processed`);
        }
      }
    }

    // Step: Calculate aggregate statistics
    const aggregateStats = await calculateAggregateStats(supabase, tenant_id);

    console.log(`✅ Metrics calculation completed. Processed: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          mode,
          processed_count: processedCount,
          error_count: errorCount,
          batch_size: mode === 'batch' ? batch_size : undefined,
        },
        results: mode !== 'all' ? results : undefined,
        aggregate_stats: aggregateStats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in incident-metrics-calculator:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Calculate aggregate statistics across all incidents
 */
async function calculateAggregateStats(
  supabase: any,
  tenantId?: string
): Promise<any> {
  try {
    let query = supabase
      .from('incident_metrics')
      .select(`
        response_time_hours,
        containment_time_hours,
        resolution_time_hours,
        escalation_count,
        reassignment_count
      `);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data: metrics, error } = await query;

    if (error) throw error;

    if (!metrics || metrics.length === 0) {
      return {
        total_incidents: 0,
        message: 'No metrics available',
      };
    }

    // Calculate averages
    const validResponseTimes = metrics
      .filter((m: any) => m.response_time_hours !== null)
      .map((m: any) => m.response_time_hours);

    const validContainmentTimes = metrics
      .filter((m: any) => m.containment_time_hours !== null)
      .map((m: any) => m.containment_time_hours);

    const validResolutionTimes = metrics
      .filter((m: any) => m.resolution_time_hours !== null)
      .map((m: any) => m.resolution_time_hours);

    const avg = (arr: number[]) => 
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const totalEscalations = metrics.reduce((sum: number, m: any) => 
      sum + (m.escalation_count || 0), 0
    );

    const totalReassignments = metrics.reduce((sum: number, m: any) => 
      sum + (m.reassignment_count || 0), 0
    );

    return {
      total_incidents: metrics.length,
      avg_response_time_hours: Math.round(avg(validResponseTimes) * 100) / 100,
      avg_containment_time_hours: Math.round(avg(validContainmentTimes) * 100) / 100,
      avg_resolution_time_hours: Math.round(avg(validResolutionTimes) * 100) / 100,
      total_escalations: totalEscalations,
      total_reassignments: totalReassignments,
      escalation_rate: Math.round((totalEscalations / metrics.length) * 100) / 100,
      reassignment_rate: Math.round((totalReassignments / metrics.length) * 100) / 100,
    };
  } catch (error) {
    console.error('Error calculating aggregate stats:', error);
    return {
      error: 'Failed to calculate aggregate statistics',
    };
  }
}
