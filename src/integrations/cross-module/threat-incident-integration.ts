/**
 * M20 - Threat Intelligence × Incident Response Integration
 * Links threats with security incidents and enriches incident data
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface ThreatToIncidentLink {
  threatId: string;
  incidentId: string;
  relationship: 'causedBy' | 'relatedTo' | 'indicatorOf';
  confidence: number;
  notes?: string;
}

// ============================================================================
// THREAT → INCIDENT OPERATIONS
// ============================================================================

/**
 * Link a threat indicator to an existing incident
 */
export async function linkThreatToIncident({
  threatId,
  incidentId,
  relationship = 'relatedTo',
  confidence = 0.8,
  notes,
}: ThreatToIncidentLink): Promise<void> {
  try {
    // 1. Fetch threat details
    const { data: threat, error: threatError } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (threatError) throw threatError;

    // 2. Fetch incident details
    const { data: incident, error: incidentError } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (incidentError) throw incidentError;

    // 3. Update incident with threat intelligence
    const { error: updateError } = await supabase
      .from('security_incidents')
      .update({
        threat_intel_enriched: true,
        metadata: {
          ...incident.metadata,
          linked_threats: [
            ...(incident.metadata?.linked_threats || []),
            {
              threat_id: threatId,
              indicator_type: threat.indicator_type,
              indicator_value: threat.indicator_value,
              threat_level: threat.threat_level,
              threat_category: threat.threat_category,
              linked_at: new Date().toISOString(),
              relationship,
              confidence,
              notes,
            }
          ],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId);

    if (updateError) throw updateError;

    // 4. Create threat match record
    const { error: matchError } = await supabase
      .from('threat_matches')
      .insert({
        indicator_id: threatId,
        indicator_type: threat.indicator_type,
        indicator_value: threat.indicator_value,
        matched_entity_type: 'incident',
        matched_entity_id: incidentId,
        matched_field: 'incident_data',
        match_confidence: confidence,
        threat_severity: threat.threat_level,
        threat_category: threat.threat_category,
        status: 'confirmed',
        context_data: {
          relationship,
          incident_number: incident.incident_number,
          incident_severity: incident.severity,
        },
      });

    if (matchError) throw matchError;

    console.log('[Threat-Incident] Threat linked to incident successfully');
  } catch (error) {
    console.error('[Threat-Incident] Failed to link threat to incident:', error);
    throw new Error(`فشل في ربط التهديد بالحادث: ${error.message}`);
  }
}

/**
 * Create a new security incident from a critical threat indicator
 */
export async function createIncidentFromThreat(
  threatId: string,
  additionalData?: {
    detected_by?: string;
    affected_assets?: string[];
    notes_ar?: string;
  }
): Promise<string> {
  try {
    // 1. Fetch threat details
    const { data: threat, error: threatError } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (threatError) throw threatError;

    // 2. Determine incident severity based on threat level
    const severity = threat.threat_level === 'critical' ? 'critical' :
                     threat.threat_level === 'high' ? 'high' :
                     threat.threat_level === 'medium' ? 'medium' : 'low';

    // 3. Create incident
    const { data: newIncident, error: createError } = await supabase
      .from('security_incidents')
      .insert({
        incident_type: threat.threat_category || 'malicious_activity',
        title_ar: `حادث أمني مرتبط بمؤشر التهديد: ${threat.indicator_value}`,
        title_en: `Security incident related to IOC: ${threat.indicator_value}`,
        description_ar: threat.description_ar || `تم الكشف عن نشاط مشبوه مرتبط بمؤشر التهديد`,
        description_en: threat.description_en || `Suspicious activity detected related to threat indicator`,
        severity,
        status: 'open',
        priority: threat.threat_level === 'critical' ? 'urgent' : 'high',
        source: 'threat_intelligence',
        detected_at: new Date().toISOString(),
        detected_by: additionalData?.detected_by,
        threat_intel_enriched: true,
        affected_assets: additionalData?.affected_assets,
        metadata: {
          source_threat_id: threatId,
          indicator_type: threat.indicator_type,
          indicator_value: threat.indicator_value,
          threat_category: threat.threat_category,
          auto_generated: true,
          detection_count: threat.detection_count,
        },
      })
      .select()
      .single();

    if (createError) throw createError;

    // 4. Link threat to incident
    await linkThreatToIncident({
      threatId,
      incidentId: newIncident.id,
      relationship: 'causedBy',
      confidence: 0.9,
      notes: 'Auto-generated incident from threat intelligence',
    });

    // 5. Check if MITRE mapping exists and copy to incident
    const { data: mitreMappings } = await supabase
      .from('mitre_attack_mapping')
      .select('*')
      .eq('entity_type', 'threat_indicator')
      .eq('entity_id', threatId);

    if (mitreMappings && mitreMappings.length > 0) {
      // Copy MITRE mappings to incident
      for (const mapping of mitreMappings) {
        await supabase.from('mitre_attack_mapping').insert({
          entity_type: 'incident',
          entity_id: newIncident.id,
          mitre_tactic_id: mapping.mitre_tactic_id,
          mitre_tactic_name: mapping.mitre_tactic_name,
          mitre_technique_id: mapping.mitre_technique_id,
          mitre_technique_name: mapping.mitre_technique_name,
          mitre_subtechnique_id: mapping.mitre_subtechnique_id,
          mitre_subtechnique_name: mapping.mitre_subtechnique_name,
          confidence_score: mapping.confidence_score,
          detection_method: 'threat_intel',
          evidence_description: 'Inherited from threat indicator',
        });
      }
    }

    console.log('[Threat-Incident] Incident created from threat:', newIncident.id);
    return newIncident.id;
  } catch (error) {
    console.error('[Threat-Incident] Failed to create incident from threat:', error);
    throw new Error(`فشل في إنشاء حادث من التهديد: ${error.message}`);
  }
}

/**
 * Enrich an existing incident with threat intelligence data
 */
export async function enrichIncidentWithThreat(incidentId: string): Promise<void> {
  try {
    // 1. Fetch incident details
    const { data: incident, error: incidentError } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    if (incidentError) throw incidentError;

    // 2. Extract IOCs from incident data
    const iocs = extractIOCsFromIncident(incident);
    if (iocs.length === 0) {
      console.log('[Threat-Incident] No IOCs found in incident');
      return;
    }

    // 3. Check each IOC against threat indicators
    const matchedThreats = [];
    for (const ioc of iocs) {
      const { data: threat } = await supabase
        .from('threat_indicators')
        .select('*')
        .eq('indicator_type', ioc.type)
        .eq('indicator_value', ioc.value)
        .eq('is_whitelisted', false)
        .maybeSingle();

      if (threat) {
        matchedThreats.push(threat);
        
        // Create threat match
        await supabase.from('threat_matches').insert({
          indicator_id: threat.id,
          indicator_type: threat.indicator_type,
          indicator_value: threat.indicator_value,
          matched_entity_type: 'incident',
          matched_entity_id: incidentId,
          matched_field: ioc.field,
          match_confidence: 0.95,
          threat_severity: threat.threat_level,
          threat_category: threat.threat_category,
          status: 'new',
          context_data: {
            incident_number: incident.incident_number,
            incident_type: incident.incident_type,
          },
        });
      }
    }

    // 4. Update incident with enrichment data
    if (matchedThreats.length > 0) {
      const highestThreatLevel = matchedThreats.reduce((max, t) => {
        const levels = { low: 1, medium: 2, high: 3, critical: 4 };
        return levels[t.threat_level] > levels[max] ? t.threat_level : max;
      }, 'low');

      await supabase
        .from('security_incidents')
        .update({
          threat_intel_enriched: true,
          severity: highestThreatLevel,
          metadata: {
            ...incident.metadata,
            threat_enrichment: {
              matched_threats_count: matchedThreats.length,
              highest_threat_level: highestThreatLevel,
              enriched_at: new Date().toISOString(),
              iocs_analyzed: iocs.length,
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      console.log(`[Threat-Incident] Incident enriched with ${matchedThreats.length} threats`);
    }
  } catch (error) {
    console.error('[Threat-Incident] Failed to enrich incident:', error);
    throw new Error(`فشل في إثراء الحادث بمعلومات التهديدات: ${error.message}`);
  }
}

/**
 * Find incidents that should be linked to a threat indicator
 */
export async function findRelatedIncidents(threatId: string): Promise<any[]> {
  try {
    const { data: threat } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (!threat) return [];

    // Find recent incidents
    const { data: incidents } = await supabase
      .from('security_incidents')
      .select('*')
      .in('status', ['open', 'investigating'])
      .gte('detected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false })
      .limit(20);

    return incidents || [];
  } catch (error) {
    console.error('[Threat-Incident] Failed to find related incidents:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract IOCs from incident data (simplified version)
 */
function extractIOCsFromIncident(incident: any): Array<{
  type: string;
  value: string;
  field: string;
}> {
  const iocs: Array<{ type: string; value: string; field: string }> = [];
  
  // Extract from description
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi;
  
  const description = `${incident.description_ar} ${incident.description_en}`;
  
  const ips = description.match(ipRegex) || [];
  ips.forEach(ip => {
    iocs.push({ type: 'ip_address', value: ip, field: 'description' });
  });
  
  const domains = description.match(domainRegex) || [];
  domains.forEach(domain => {
    iocs.push({ type: 'domain', value: domain.toLowerCase(), field: 'description' });
  });
  
  return iocs;
}
