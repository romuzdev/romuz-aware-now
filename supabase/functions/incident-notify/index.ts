/**
 * M18: Incident Response System - Notification Edge Function
 * Purpose: Send notifications for incident events
 * 
 * Supports:
 * - Email notifications
 * - In-app notifications
 * - Future: Slack, Teams, SMS
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  incident_id: string;
  notification_type: 'new_incident' | 'status_change' | 'assignment' | 'escalation' | 'resolution';
  recipients?: string[]; // User IDs
  message_override?: {
    title_ar?: string;
    title_en?: string;
    body_ar?: string;
    body_en?: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 incident-notify: Starting notification process');

    const {
      incident_id,
      notification_type,
      recipients,
      message_override,
    }: NotificationRequest = await req.json();

    if (!incident_id || !notification_type) {
      throw new Error('incident_id and notification_type are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get incident details
    const { data: incident, error: incidentError } = await supabase
      .from('security_incidents')
      .select(`
        *,
        incident_response_plans(*)
      `)
      .eq('id', incident_id)
      .single();

    if (incidentError || !incident) {
      throw new Error('Incident not found');
    }

    console.log(`📋 Processing notification for incident: ${incident.incident_number}`);

    // Step 2: Determine recipients
    let recipientIds: string[] = recipients || [];

    if (recipientIds.length === 0) {
      // Get recipients from response plan or incident
      if (incident.assigned_to) {
        recipientIds.push(incident.assigned_to);
      }

      // Get notification rules from response plan
      const notificationRules = incident.incident_response_plans?.notification_rules;
      if (notificationRules?.notify_roles) {
        // TODO: Implement role-based recipient lookup
        console.log('📋 Role-based notifications not implemented yet');
      }
    }

    if (recipientIds.length === 0) {
      console.log('⚠️ No recipients found for notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Build notification message
    const message = buildNotificationMessage(incident, notification_type, message_override);

    // Step 4: Create timeline entry for notification
    await supabase
      .from('incident_timeline')
      .insert({
        incident_id: incident.id,
        timestamp: new Date().toISOString(),
        event_type: 'notification_sent',
        action_ar: `تم إرسال إشعار: ${message.title_ar}`,
        action_en: `Notification sent: ${message.title_en}`,
        details: {
          notification_type,
          recipients_count: recipientIds.length,
        },
      });

    // Step 5: Send notifications (placeholder - implement actual channels)
    console.log('📤 Sending notifications to:', recipientIds.length, 'recipients');
    console.log('📝 Message:', message);

    // TODO: Implement actual notification channels:
    // - Email
    // - Slack
    // - Microsoft Teams
    // - SMS
    // - Push notifications

    return new Response(
      JSON.stringify({
        success: true,
        incident_number: incident.incident_number,
        notification_type,
        recipients_count: recipientIds.length,
        message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in incident-notify:', error);
    
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
 * Build notification message based on incident and type
 */
function buildNotificationMessage(
  incident: any,
  notificationType: string,
  override?: any
) {
  const severityEmojiMap: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };
  const severityEmoji = severityEmojiMap[incident.severity] || '⚪';

  const messages = {
    new_incident: {
      title_ar: `${severityEmoji} حدث أمني جديد: ${incident.incident_number}`,
      title_en: `${severityEmoji} New Security Incident: ${incident.incident_number}`,
      body_ar: `تم الإبلاغ عن حدث أمني جديد بمستوى خطورة ${incident.severity}.\n\n${incident.title_ar}`,
      body_en: `A new security incident has been reported with ${incident.severity} severity.\n\n${incident.title_en || incident.title_ar}`,
    },
    status_change: {
      title_ar: `تحديث حالة الحدث: ${incident.incident_number}`,
      title_en: `Incident Status Update: ${incident.incident_number}`,
      body_ar: `تم تغيير حالة الحدث إلى: ${incident.status}`,
      body_en: `Incident status changed to: ${incident.status}`,
    },
    assignment: {
      title_ar: `تم تعيين حدث لك: ${incident.incident_number}`,
      title_en: `Incident Assigned to You: ${incident.incident_number}`,
      body_ar: `تم تعيين حدث أمني لك للمتابعة والمعالجة.`,
      body_en: `A security incident has been assigned to you for follow-up and resolution.`,
    },
    escalation: {
      title_ar: `🚨 تصعيد الحدث: ${incident.incident_number}`,
      title_en: `🚨 Incident Escalated: ${incident.incident_number}`,
      body_ar: `تم تصعيد الحدث الأمني للحصول على اهتمام فوري.`,
      body_en: `Security incident has been escalated for immediate attention.`,
    },
    resolution: {
      title_ar: `✅ تم حل الحدث: ${incident.incident_number}`,
      title_en: `✅ Incident Resolved: ${incident.incident_number}`,
      body_ar: `تم حل الحدث الأمني بنجاح.`,
      body_en: `Security incident has been successfully resolved.`,
    },
  };

  const defaultMessage = messages[notificationType as keyof typeof messages] || messages.new_incident;

  return {
    title_ar: override?.title_ar || defaultMessage.title_ar,
    title_en: override?.title_en || defaultMessage.title_en,
    body_ar: override?.body_ar || defaultMessage.body_ar,
    body_en: override?.body_en || defaultMessage.body_en,
  };
}
