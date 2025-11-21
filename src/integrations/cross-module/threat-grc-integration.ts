/**
 * M20 - Threat Intelligence × GRC Integration
 * Links threats with risks and compliance obligations
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface ThreatToRiskLink {
  threatId: string;
  riskId: string;
  linkType: 'direct' | 'indirect' | 'potential';
  confidence: number;
  notes?: string;
}

// ============================================================================
// THREAT → RISK OPERATIONS
// ============================================================================

/**
 * Link a threat indicator to an existing GRC risk
 */
export async function linkThreatToRisk({
  threatId,
  riskId,
  linkType = 'direct',
  confidence = 0.8,
  notes,
}: ThreatToRiskLink): Promise<void> {
  try {
    // 1. Fetch threat indicator details
    const { data: threat, error: threatError } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (threatError) throw threatError;

    // 2. Fetch risk details
    const { data: risk, error: riskError } = await supabase
      .from('grc_risks')
      .select('*')
      .eq('id', riskId)
      .single();

    if (riskError) throw riskError;

    // 3. Update risk likelihood based on threat level
    const likelihoodIncrease = threat.threat_level === 'critical' ? 2 : 
                                threat.threat_level === 'high' ? 1 : 0;

    const newLikelihood = Math.min((risk.likelihood_score || 3) + likelihoodIncrease, 5);

    // 4. Update risk with threat intelligence data
    const { error: updateError } = await supabase
      .from('grc_risks')
      .update({
        likelihood_score: newLikelihood,
        risk_level: calculateRiskLevel(risk.impact_score || 3, newLikelihood),
        metadata: {
          ...risk.metadata,
          linked_threats: [
            ...(risk.metadata?.linked_threats || []),
            {
              threat_id: threatId,
              indicator_value: threat.indicator_value,
              threat_level: threat.threat_level,
              linked_at: new Date().toISOString(),
              link_type: linkType,
              confidence,
              notes,
            }
          ],
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', riskId);

    if (updateError) throw updateError;

    // 5. Log audit entry
    await logAuditAction({
      entityType: 'threat_risk_link',
      entityId: `${threatId}_${riskId}`,
      action: 'create',
      payload: {
        threat_id: threatId,
        risk_id: riskId,
        link_type: linkType,
        confidence,
      },
    });

    console.log('[Threat-GRC] Threat linked to risk successfully');
  } catch (error) {
    console.error('[Threat-GRC] Failed to link threat to risk:', error);
    throw new Error(`فشل في ربط التهديد بالخطر: ${error.message}`);
  }
}

/**
 * Create a new GRC risk from a critical threat indicator
 */
export async function createRiskFromThreat(
  threatId: string,
  additionalData?: {
    risk_category?: string;
    owner_id?: string;
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

    // 2. Determine risk parameters based on threat level
    const impactScore = threat.threat_level === 'critical' ? 5 :
                        threat.threat_level === 'high' ? 4 :
                        threat.threat_level === 'medium' ? 3 : 2;
    
    const likelihoodScore = threat.detection_count > 10 ? 5 :
                            threat.detection_count > 5 ? 4 :
                            threat.detection_count > 2 ? 3 : 2;

    // 3. Create risk
    const { data: newRisk, error: createError } = await supabase
      .from('grc_risks')
      .insert({
        risk_name_ar: `خطر مرتبط بمؤشر التهديد: ${threat.indicator_value}`,
        risk_name_en: `Risk associated with IOC: ${threat.indicator_value}`,
        risk_type: 'cybersecurity',
        risk_category: additionalData?.risk_category || 'external_threat',
        likelihood_score: likelihoodScore,
        impact_score: impactScore,
        risk_level: calculateRiskLevel(impactScore, likelihoodScore),
        status: 'identified',
        source: 'threat_intelligence',
        owner_id: additionalData?.owner_id,
        description_ar: threat.description_ar || `تم الكشف عن تهديد محتمل من نوع ${threat.indicator_type}`,
        description_en: threat.description_en || `Potential threat detected of type ${threat.indicator_type}`,
        notes_ar: additionalData?.notes_ar,
        metadata: {
          source_threat_id: threatId,
          indicator_type: threat.indicator_type,
          indicator_value: threat.indicator_value,
          threat_category: threat.threat_category,
          first_detected: threat.first_seen_at,
          detection_count: threat.detection_count,
        },
      })
      .select()
      .single();

    if (createError) throw createError;

    // 4. Link threat to risk
    await linkThreatToRisk({
      threatId,
      riskId: newRisk.id,
      linkType: 'direct',
      confidence: 0.95,
      notes: 'Auto-generated risk from threat intelligence',
    });

    console.log('[Threat-GRC] Risk created from threat:', newRisk.id);
    return newRisk.id;
  } catch (error) {
    console.error('[Threat-GRC] Failed to create risk from threat:', error);
    throw new Error(`فشل في إنشاء خطر من التهديد: ${error.message}`);
  }
}

/**
 * Update risk assessment based on ongoing threat intelligence
 */
export async function updateRiskFromThreatIntel(riskId: string): Promise<void> {
  try {
    // 1. Fetch risk with linked threats
    const { data: risk, error: riskError } = await supabase
      .from('grc_risks')
      .select('*')
      .eq('id', riskId)
      .single();

    if (riskError) throw riskError;

    const linkedThreats = risk.metadata?.linked_threats || [];
    if (linkedThreats.length === 0) return;

    // 2. Fetch current status of all linked threats
    const threatIds = linkedThreats.map((t: any) => t.threat_id);
    const { data: threats, error: threatsError } = await supabase
      .from('threat_indicators')
      .select('*')
      .in('id', threatIds);

    if (threatsError) throw threatsError;

    // 3. Calculate updated risk level
    const activeCriticalThreats = threats.filter(
      t => t.threat_level === 'critical' && !t.is_whitelisted
    ).length;

    const activeHighThreats = threats.filter(
      t => t.threat_level === 'high' && !t.is_whitelisted
    ).length;

    // 4. Adjust likelihood based on active threats
    let likelihoodAdjustment = 0;
    if (activeCriticalThreats > 0) likelihoodAdjustment = 2;
    else if (activeHighThreats > 0) likelihoodAdjustment = 1;

    const newLikelihood = Math.min((risk.likelihood_score || 3) + likelihoodAdjustment, 5);

    // 5. Update risk
    const { error: updateError } = await supabase
      .from('grc_risks')
      .update({
        likelihood_score: newLikelihood,
        risk_level: calculateRiskLevel(risk.impact_score || 3, newLikelihood),
        metadata: {
          ...risk.metadata,
          threat_intel_last_updated: new Date().toISOString(),
          active_threats: {
            critical: activeCriticalThreats,
            high: activeHighThreats,
            total: threats.filter(t => !t.is_whitelisted).length,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', riskId);

    if (updateError) throw updateError;

    console.log('[Threat-GRC] Risk updated from threat intelligence');
  } catch (error) {
    console.error('[Threat-GRC] Failed to update risk from threat intel:', error);
    throw new Error(`فشل في تحديث الخطر من معلومات التهديدات: ${error.message}`);
  }
}

/**
 * Find risks that should be linked to a threat indicator
 */
export async function findRelatedRisks(threatId: string): Promise<any[]> {
  try {
    const { data: threat } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (!threat) return [];

    // Find risks in the same category
    const { data: risks } = await supabase
      .from('grc_risks')
      .select('*')
      .eq('risk_category', 'external_threat')
      .eq('status', 'identified')
      .limit(10);

    return risks || [];
  } catch (error) {
    console.error('[Threat-GRC] Failed to find related risks:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateRiskLevel(impact: number, likelihood: number): string {
  const score = impact * likelihood;
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

async function logAuditAction(entry: {
  entityType: string;
  entityId: string;
  action: string;
  payload?: Record<string, any>;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userTenant } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!userTenant?.tenant_id) return;

    await supabase.from('audit_log').insert({
      tenant_id: userTenant.tenant_id,
      actor: user.id,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      payload: entry.payload || {},
    });
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
  }
}
