/**
 * M18: Incident Response System - Auto-Detection Edge Function
 * Purpose: Automatically detect and create incidents from critical alerts using AI
 * 
 * This function:
 * 1. Monitors critical alerts from alert_events table
 * 2. Uses AI to classify the incident type and severity
 * 3. Creates incidents automatically
 * 4. Links to appropriate response plans
 * 5. Sends notifications
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertEvent {
  id: string;
  tenant_id: string;
  policy_id: string;
  severity: string;
  metric_value: number;
  created_at: string;
  target_ref?: string;
  metadata?: any;
}

interface IncidentClassification {
  incident_type: string;
  severity: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  impact_level: string;
  priority: number;
  affected_systems: string[];
  recommended_actions: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚨 incident-auto-detect: Starting auto-detection process');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Lovable AI API Key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Fetch recent critical alerts (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    
    const { data: criticalAlerts, error: alertsError } = await supabase
      .from('alert_events')
      .select('*')
      .eq('severity', 'critical')
      .eq('status', 'pending')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) {
      console.error('❌ Error fetching alerts:', alertsError);
      throw alertsError;
    }

    console.log(`📊 Found ${criticalAlerts?.length || 0} critical alerts`);

    if (!criticalAlerts || criticalAlerts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No critical alerts to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    const createdIncidents = [];

    // Step 2: Process each alert
    for (const alert of criticalAlerts as AlertEvent[]) {
      try {
        // Check if incident already exists for this alert
        const { data: existingIncident } = await supabase
          .from('security_incidents')
          .select('id')
          .eq('metadata->>alert_id', alert.id)
          .single();

        if (existingIncident) {
          console.log(`⏭️  Skipping alert ${alert.id} - incident already exists`);
          continue;
        }

        // Step 3: Classify incident using AI
        console.log(`🤖 Classifying alert ${alert.id} using AI...`);
        const classification = await classifyIncidentWithAI(alert, LOVABLE_API_KEY);

        // Step 4: Find appropriate response plan
        const { data: responsePlan } = await supabase
          .from('incident_response_plans')
          .select('*')
          .eq('tenant_id', alert.tenant_id)
          .eq('incident_type', classification.incident_type)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(1)
          .single();

        // Step 5: Generate incident number
        const { data: incidentNumber } = await supabase
          .rpc('generate_incident_number', { p_tenant_id: alert.tenant_id });

        // Step 6: Create incident
        const { data: incident, error: incidentError } = await supabase
          .from('security_incidents')
          .insert({
            tenant_id: alert.tenant_id,
            incident_number: incidentNumber,
            title_ar: classification.title_ar,
            title_en: classification.title_en,
            description_ar: classification.description_ar,
            description_en: classification.description_en,
            severity: classification.severity,
            incident_type: classification.incident_type,
            status: 'open',
            detected_at: alert.created_at,
            reported_at: new Date().toISOString(),
            reported_by: 'system',
            response_plan_id: responsePlan?.id || null,
            impact_level: classification.impact_level,
            priority: classification.priority,
            affected_systems: classification.affected_systems,
            metadata: {
              alert_id: alert.id,
              auto_detected: true,
              ai_classification: classification,
            },
            created_by: 'system',
            updated_by: 'system',
          })
          .select()
          .single();

        if (incidentError) {
          console.error(`❌ Error creating incident for alert ${alert.id}:`, incidentError);
          continue;
        }

        console.log(`✅ Created incident: ${incident.incident_number}`);

        // Step 7: Create timeline entry
        await supabase
          .from('incident_timeline')
          .insert({
            incident_id: incident.id,
            timestamp: new Date().toISOString(),
            event_type: 'detected',
            action_ar: 'تم اكتشاف الحدث تلقائياً من خلال نظام التنبيهات الأمنية',
            action_en: 'Incident automatically detected through security alert system',
            details: {
              alert_id: alert.id,
              classification: classification,
              detection_method: 'ai_auto_detect',
            },
          });

        // Step 8: Update alert status
        await supabase
          .from('alert_events')
          .update({ status: 'processed' })
          .eq('id', alert.id);

        // Step 9: Auto-assign if rules exist
        if (responsePlan?.notification_rules?.auto_assign_to_role) {
          // TODO: Implement role-based auto-assignment
          console.log('📋 Auto-assignment rules found but not implemented yet');
        }

        // Step 10: Send notification (call incident-notify function)
        try {
          await supabase.functions.invoke('incident-notify', {
            body: {
              incident_id: incident.id,
              notification_type: 'new_incident',
            },
          });
        } catch (notifyError) {
          console.error('⚠️ Failed to send notification:', notifyError);
          // Don't fail the whole process if notification fails
        }

        processedCount++;
        createdIncidents.push({
          incident_number: incident.incident_number,
          title: classification.title_ar,
          severity: classification.severity,
        });

      } catch (alertError) {
        console.error(`❌ Error processing alert ${alert.id}:`, alertError);
        // Continue with next alert
      }
    }

    console.log(`✅ Auto-detection complete: ${processedCount} incidents created`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        total_alerts: criticalAlerts.length,
        incidents_created: createdIncidents,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in incident-auto-detect:', error);
    
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
 * Classify incident using Lovable AI
 */
async function classifyIncidentWithAI(
  alert: AlertEvent,
  apiKey: string
): Promise<IncidentClassification> {
  const systemPrompt = `أنت خبير في أمن المعلومات والاستجابة للحوادث الأمنية.
مهمتك هي تحليل التنبيهات الأمنية وتصنيف الحوادث بدقة.

عند تحليل التنبيه، حدد:
1. نوع الحادث (incident_type)
2. درجة الخطورة (severity: low, medium, high, critical)
3. مستوى التأثير (impact_level: minimal, moderate, significant, severe)
4. الأولوية (priority: 1-5، حيث 1 أعلى أولوية)
5. العنوان والوصف بالعربية والإنجليزية
6. الأنظمة المتأثرة المحتملة
7. الإجراءات الموصى بها

كن دقيقاً ومهنياً في تحليلك.`;

  const userPrompt = `قم بتحليل التنبيه الأمني التالي وتصنيف الحادث:

معلومات التنبيه:
- مستوى الخطورة: ${alert.severity}
- قيمة المقياس: ${alert.metric_value}
- المرجع: ${alert.target_ref || 'غير محدد'}
- البيانات الإضافية: ${JSON.stringify(alert.metadata || {}, null, 2)}

قدم تصنيفاً شاملاً للحادث.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Fast and accurate
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'classify_incident',
            description: 'Classify a security incident based on alert data',
            parameters: {
              type: 'object',
              properties: {
                incident_type: {
                  type: 'string',
                  enum: [
                    'data_breach', 'malware', 'phishing', 'unauthorized_access',
                    'dos_attack', 'ddos_attack', 'policy_violation', 'system_failure',
                    'social_engineering', 'insider_threat', 'ransomware', 'other'
                  ],
                },
                severity: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                title_ar: { type: 'string' },
                title_en: { type: 'string' },
                description_ar: { type: 'string' },
                description_en: { type: 'string' },
                impact_level: {
                  type: 'string',
                  enum: ['minimal', 'moderate', 'significant', 'severe'],
                },
                priority: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                },
                affected_systems: {
                  type: 'array',
                  items: { type: 'string' },
                },
                recommended_actions: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: [
                'incident_type', 'severity', 'title_ar', 'title_en',
                'description_ar', 'description_en', 'impact_level', 'priority'
              ],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'classify_incident' } },
        temperature: 0.3, // Lower for consistent classification
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to Lovable AI workspace.');
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const classification = JSON.parse(toolCall.function.arguments);
    
    console.log('✅ AI Classification:', classification);
    
    return classification;

  } catch (error) {
    console.error('❌ AI classification error:', error);
    
    // Fallback to basic classification
    return {
      incident_type: 'other',
      severity: alert.severity as any,
      title_ar: 'حدث أمني تلقائي',
      title_en: 'Auto-detected Security Incident',
      description_ar: `تم اكتشاف تنبيه أمني بمستوى خطورة ${alert.severity}`,
      description_en: `Security alert detected with severity level ${alert.severity}`,
      impact_level: 'moderate',
      priority: 3,
      affected_systems: [],
      recommended_actions: ['تحقيق فوري', 'Immediate investigation'],
    };
  }
}
