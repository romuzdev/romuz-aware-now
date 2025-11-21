/**
 * M20 - Threat Intelligence Sync Edge Function
 * Syncs threat intelligence feeds from external sources
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  feed_id?: string;
  force?: boolean;
}

interface IndicatorData {
  indicator_type: string;
  indicator_value: string;
  threat_level: string;
  threat_category?: string;
  description_ar?: string;
  description_en?: string;
  tags?: string[];
  confidence_score?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get tenant ID
    const { data: userTenant } = await supabaseClient
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) {
      throw new Error('Tenant not found');
    }

    const tenantId = userTenant.tenant_id;

    // Parse request
    const { feed_id, force = false }: SyncRequest = await req.json().catch(() => ({}));

    // Get feeds to sync
    let query = supabaseClient
      .from('threat_intelligence_feeds')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (feed_id) {
      query = query.eq('id', feed_id);
    }

    const { data: feeds, error: feedsError } = await query;

    if (feedsError) throw feedsError;

    if (!feeds || feeds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active feeds to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalIndicatorsAdded = 0;
    let totalIndicatorsUpdated = 0;
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        console.log(`Syncing feed: ${feed.feed_name} (${feed.id})`);

        // Check if enough time has passed since last sync (unless forced)
        if (!force && feed.last_fetched_at) {
          const lastFetch = new Date(feed.last_fetched_at);
          const hoursSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastFetch < feed.sync_interval_hours) {
            console.log(`Skipping ${feed.feed_name}: synced ${hoursSinceLastFetch.toFixed(1)}h ago`);
            continue;
          }
        }

        // Fetch indicators from external source based on feed type
        const indicators = await fetchIndicatorsFromFeed(feed);

        console.log(`Fetched ${indicators.length} indicators from ${feed.feed_name}`);

        // Upsert indicators into database
        for (const indicator of indicators) {
          try {
            const { data: existing } = await supabaseClient
              .from('threat_indicators')
              .select('id, detection_count')
              .eq('tenant_id', tenantId)
              .eq('indicator_type', indicator.indicator_type)
              .eq('indicator_value', indicator.indicator_value)
              .maybeSingle();

            if (existing) {
              // Update existing
              await supabaseClient
                .from('threat_indicators')
                .update({
                  threat_level: indicator.threat_level,
                  threat_category: indicator.threat_category,
                  description_ar: indicator.description_ar,
                  description_en: indicator.description_en,
                  tags: indicator.tags || [],
                  last_seen_at: new Date().toISOString(),
                  detection_count: (existing.detection_count || 0) + 1,
                  metadata: indicator,
                })
                .eq('id', existing.id);

              totalIndicatorsUpdated++;
            } else {
              // Insert new
              await supabaseClient
                .from('threat_indicators')
                .insert({
                  tenant_id: tenantId,
                  feed_id: feed.id,
                  ...indicator,
                  tags: indicator.tags || [],
                  metadata: indicator,
                });

              totalIndicatorsAdded++;
            }
          } catch (indicatorError) {
            const errMsg = indicatorError instanceof Error ? indicatorError.message : 'Unknown error';
            console.error(`Error processing indicator ${indicator.indicator_value}:`, indicatorError);
            errors.push(`Failed to process ${indicator.indicator_value}: ${errMsg}`);
          }
        }

        // Update feed sync status
        await supabaseClient
          .from('threat_intelligence_feeds')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_fetch_status: 'success',
            last_error_message: null,
            total_indicators_fetched: feed.total_indicators_fetched + indicators.length,
            updated_by: user.id,
          })
          .eq('id', feed.id);

      } catch (feedError) {
        const errMsg = feedError instanceof Error ? feedError.message : 'Unknown error';
        console.error(`Error syncing feed ${feed.feed_name}:`, feedError);
        errors.push(`Feed ${feed.feed_name}: ${errMsg}`);

        // Update feed error status
        await supabaseClient
          .from('threat_intelligence_feeds')
          .update({
            last_fetch_status: 'failed',
            last_error_message: errMsg,
            updated_by: user.id,
          })
          .eq('id', feed.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        feeds_synced: feeds.length,
        indicators_added: totalIndicatorsAdded,
        indicators_updated: totalIndicatorsUpdated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch indicators from external threat intelligence feed
 */
async function fetchIndicatorsFromFeed(feed: any): Promise<IndicatorData[]> {
  const indicators: IndicatorData[] = [];

  // Mock data for demo purposes
  // In production, this would fetch from real threat feeds (OTX, Abuse.ch, MISP, etc.)
  
  console.log(`Fetching from ${feed.source_provider} feed...`);

  // Generate some sample indicators based on feed type
  if (feed.feed_type === 'ioc') {
    // Sample malicious IPs
    const sampleIPs = [
      '185.220.101.50',
      '192.42.116.198',
      '45.146.164.110',
      '91.219.236.218',
      '193.29.187.56',
    ];

    for (const ip of sampleIPs) {
      indicators.push({
        indicator_type: 'ip',
        indicator_value: ip,
        threat_level: Math.random() > 0.5 ? 'high' : 'critical',
        threat_category: 'malware_c2',
        description_ar: `عنوان IP مشبوه مرتبط بخوادم Command & Control`,
        description_en: `Suspicious IP associated with C&C servers`,
        tags: ['malware', 'c2', 'botnet'],
        confidence_score: 0.85 + Math.random() * 0.15,
      });
    }

    // Sample malicious domains
    const sampleDomains = [
      'evil-phishing-site.com',
      'malware-distribution.net',
      'fake-bank-login.org',
    ];

    for (const domain of sampleDomains) {
      indicators.push({
        indicator_type: 'domain',
        indicator_value: domain,
        threat_level: 'critical',
        threat_category: 'phishing',
        description_ar: `نطاق تصيد احتيالي معروف`,
        description_en: `Known phishing domain`,
        tags: ['phishing', 'social_engineering'],
        confidence_score: 0.9,
      });
    }
  }

  if (feed.feed_type === 'vulnerability') {
    // Sample CVEs
    const sampleCVEs = [
      { id: 'CVE-2024-1234', severity: 'critical' },
      { id: 'CVE-2024-5678', severity: 'high' },
    ];

    for (const cve of sampleCVEs) {
      indicators.push({
        indicator_type: 'vulnerability_id',
        indicator_value: cve.id,
        threat_level: cve.severity as any,
        threat_category: 'vulnerability',
        description_ar: `ثغرة أمنية خطيرة`,
        description_en: `Critical security vulnerability`,
        tags: ['vulnerability', 'cve'],
        confidence_score: 1.0,
      });
    }
  }

  return indicators;
}
