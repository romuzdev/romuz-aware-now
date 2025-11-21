/**
 * M20 - Threat Intelligence × Awareness Integration
 * Creates targeted awareness campaigns based on detected threats
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface ThreatCampaignConfig {
  threatId: string;
  targetAudience: 'all' | 'affected_users' | 'high_risk_users' | 'specific_departments';
  userIds?: string[];
  departmentIds?: string[];
  duration_days?: number;
  priority?: 'normal' | 'high' | 'urgent';
}

// ============================================================================
// THREAT → AWARENESS CAMPAIGN OPERATIONS
// ============================================================================

/**
 * Create a targeted awareness campaign from a threat indicator
 */
export async function createCampaignFromThreat({
  threatId,
  targetAudience = 'all',
  userIds = [],
  departmentIds = [],
  duration_days = 7,
  priority = 'high',
}: ThreatCampaignConfig): Promise<string> {
  try {
    // 1. Fetch threat details
    const { data: threat, error: threatError } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (threatError) throw threatError;

    // 2. Determine campaign content based on threat type
    const campaignContent = mapThreatToCampaignContent(
      threat.indicator_type,
      threat.threat_category
    );

    // 3. Get target users
    const targetUsers = await getTargetUsers(targetAudience, userIds, departmentIds);

    // 4. Create awareness campaign
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration_days);

    const { data: campaign, error: campaignError } = await supabase
      .from('awareness_campaigns')
      .insert({
        name: `حملة توعية طارئة: ${campaignContent.title_ar}`,
        name_ar: `حملة توعية طارئة: ${campaignContent.title_ar}`,
        description: campaignContent.description_ar,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        campaign_type: 'security_alert',
        priority,
        is_urgent: priority === 'urgent',
        metadata: {
          source_threat_id: threatId,
          threat_indicator: threat.indicator_value,
          threat_type: threat.indicator_type,
          threat_level: threat.threat_level,
          threat_category: threat.threat_category,
          auto_generated: true,
          content_modules: campaignContent.modules,
        },
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 5. Enroll target users
    if (targetUsers.length > 0) {
      const enrollments = targetUsers.map(userId => ({
        campaign_id: campaign.id,
        user_id: userId,
        enrollment_status: 'enrolled',
        enrolled_at: new Date().toISOString(),
        metadata: {
          auto_enrolled: true,
          reason: 'threat_based_targeting',
        },
      }));

      const { error: enrollError } = await supabase
        .from('campaign_enrollments')
        .insert(enrollments);

      if (enrollError) {
        console.error('[Threat-Awareness] Failed to enroll users:', enrollError);
      }
    }

    // 6. Create campaign content
    await createCampaignContent(campaign.id, campaignContent);

    console.log('[Threat-Awareness] Campaign created from threat:', campaign.id);
    return campaign.id;
  } catch (error) {
    console.error('[Threat-Awareness] Failed to create campaign from threat:', error);
    throw new Error(`فشل في إنشاء حملة توعية من التهديد: ${error.message}`);
  }
}

/**
 * Notify users about a critical threat
 */
export async function notifyUsersAboutThreat(
  threatId: string,
  userIds: string[],
  notificationMethod: 'email' | 'in_app' | 'both' = 'both'
): Promise<void> {
  try {
    // 1. Fetch threat details
    const { data: threat } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('id', threatId)
      .single();

    if (!threat) throw new Error('Threat not found');

    // 2. Create notification content
    const notificationContent = {
      title_ar: `تنبيه أمني: ${getThreatTypeLabel(threat.indicator_type)}`,
      title_en: `Security Alert: ${threat.indicator_type}`,
      message_ar: `تم الكشف عن تهديد أمني من نوع ${getThreatTypeLabel(threat.indicator_type)}. يرجى توخي الحذر والإبلاغ عن أي نشاط مشبوه.`,
      message_en: `A security threat of type ${threat.indicator_type} has been detected. Please be cautious and report any suspicious activity.`,
      severity: threat.threat_level,
      action_required: threat.threat_level === 'critical' || threat.threat_level === 'high',
    };

    // 3. Send notifications
    for (const userId of userIds) {
      if (notificationMethod === 'in_app' || notificationMethod === 'both') {
        await supabase.from('notifications').insert({
          user_id: userId,
          notification_type: 'security_alert',
          title: notificationContent.title_ar,
          message: notificationContent.message_ar,
          severity: notificationContent.severity,
          is_read: false,
          metadata: {
            threat_id: threatId,
            indicator_type: threat.indicator_type,
            action_required: notificationContent.action_required,
          },
        });
      }

      if (notificationMethod === 'email' || notificationMethod === 'both') {
        // Trigger email notification via edge function
        await supabase.functions.invoke('send-security-alert-email', {
          body: {
            userId,
            threat: {
              id: threatId,
              type: threat.indicator_type,
              level: threat.threat_level,
            },
            notification: notificationContent,
          },
        });
      }
    }

    console.log(`[Threat-Awareness] Notified ${userIds.length} users about threat`);
  } catch (error) {
    console.error('[Threat-Awareness] Failed to notify users:', error);
    throw new Error(`فشل في إرسال الإشعارات: ${error.message}`);
  }
}

/**
 * Create security awareness content based on recent threats
 */
export async function generateThreatAwarenessContent(
  threatCategory: string
): Promise<any> {
  try {
    // Fetch recent threats in this category
    const { data: threats } = await supabase
      .from('threat_indicators')
      .select('*')
      .eq('threat_category', threatCategory)
      .eq('is_whitelisted', false)
      .gte('last_seen_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('threat_level', { ascending: false })
      .limit(10);

    if (!threats || threats.length === 0) {
      return null;
    }

    // Generate content recommendations
    const contentTemplate = getThreatAwarenessTemplate(threatCategory);
    
    return {
      category: threatCategory,
      threat_count: threats.length,
      highest_severity: threats[0].threat_level,
      content_template: contentTemplate,
      recommended_modules: contentTemplate.modules,
      target_audience: contentTemplate.target_audience,
      urgency: threats.filter(t => t.threat_level === 'critical').length > 0 ? 'high' : 'medium',
    };
  } catch (error) {
    console.error('[Threat-Awareness] Failed to generate content:', error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map threat type to campaign content
 */
function mapThreatToCampaignContent(
  indicatorType: string,
  threatCategory?: string
): any {
  const contentMap: Record<string, any> = {
    'phishing': {
      title_ar: 'التوعية بهجمات التصيد الاحتيالي',
      title_en: 'Phishing Awareness',
      description_ar: 'تم اكتشاف محاولات تصيد احتيالي. تعلم كيفية التعرف عليها والإبلاغ عنها.',
      description_en: 'Phishing attempts detected. Learn how to identify and report them.',
      modules: ['phishing_identification', 'email_security', 'report_suspicious'],
      duration_days: 7,
      target_audience: 'all',
    },
    'malware': {
      title_ar: 'الحماية من البرمجيات الخبيثة',
      title_en: 'Malware Protection',
      description_ar: 'تم اكتشاف برمجيات خبيثة. تعلم كيفية حماية أجهزتك.',
      description_en: 'Malware detected. Learn how to protect your devices.',
      modules: ['malware_prevention', 'safe_downloads', 'antivirus_best_practices'],
      duration_days: 5,
      target_audience: 'all',
    },
    'ransomware': {
      title_ar: 'التوعية ببرمجيات الفدية',
      title_en: 'Ransomware Awareness',
      description_ar: 'تحذير من برمجيات الفدية. تعلم كيفية الوقاية والاستجابة.',
      description_en: 'Ransomware warning. Learn prevention and response strategies.',
      modules: ['ransomware_prevention', 'backup_importance', 'incident_response'],
      duration_days: 10,
      target_audience: 'all',
    },
    'data_breach': {
      title_ar: 'حماية البيانات',
      title_en: 'Data Protection',
      description_ar: 'تم اكتشاف محاولة اختراق للبيانات. تعلم كيفية حماية المعلومات الحساسة.',
      description_en: 'Data breach attempt detected. Learn how to protect sensitive information.',
      modules: ['data_classification', 'secure_sharing', 'access_control'],
      duration_days: 7,
      target_audience: 'data_handlers',
    },
  };

  const category = threatCategory?.toLowerCase() || indicatorType.toLowerCase();
  return contentMap[category] || contentMap['phishing'];
}

/**
 * Get target users based on audience type
 */
async function getTargetUsers(
  targetAudience: string,
  userIds: string[],
  departmentIds: string[]
): Promise<string[]> {
  if (targetAudience === 'specific_departments' && departmentIds.length > 0) {
    const { data: users } = await supabase
      .from('employees')
      .select('user_id')
      .in('department_id', departmentIds);
    
    return users?.map(u => u.user_id).filter(Boolean) || [];
  }

  if (userIds.length > 0) {
    return userIds;
  }

  if (targetAudience === 'all') {
    const { data: users } = await supabase
      .from('employees')
      .select('user_id')
      .eq('employment_status', 'active');
    
    return users?.map(u => u.user_id).filter(Boolean) || [];
  }

  return [];
}

/**
 * Create campaign content modules
 */
async function createCampaignContent(campaignId: string, content: any): Promise<void> {
  const contentModules = content.modules || [];
  
  for (let i = 0; i < contentModules.length; i++) {
    await supabase.from('campaign_content').insert({
      campaign_id: campaignId,
      content_type: 'module',
      title_ar: `${content.title_ar} - الجزء ${i + 1}`,
      title_en: `${content.title_en} - Part ${i + 1}`,
      module_code: contentModules[i],
      sequence_order: i + 1,
      is_mandatory: true,
      estimated_duration_minutes: 10,
    });
  }
}

/**
 * Get localized threat type label
 */
function getThreatTypeLabel(indicatorType: string): string {
  const labels: Record<string, string> = {
    'ip_address': 'عنوان IP مشبوه',
    'domain': 'نطاق خبيث',
    'url': 'رابط ضار',
    'file_hash': 'ملف خبيث',
    'email': 'بريد إلكتروني مشبوه',
    'malware_signature': 'برمجية خبيثة',
  };
  
  return labels[indicatorType] || 'تهديد أمني';
}

/**
 * Get threat awareness template
 */
function getThreatAwarenessTemplate(category: string): any {
  const templates: Record<string, any> = {
    'phishing': {
      modules: ['email_security', 'phishing_identification', 'safe_browsing'],
      target_audience: 'all_users',
      recommended_duration_days: 7,
    },
    'malware': {
      modules: ['antivirus_usage', 'safe_downloads', 'device_security'],
      target_audience: 'all_users',
      recommended_duration_days: 5,
    },
    'ransomware': {
      modules: ['backup_procedures', 'ransomware_prevention', 'incident_response'],
      target_audience: 'all_users',
      recommended_duration_days: 10,
    },
  };
  
  return templates[category] || templates['phishing'];
}
