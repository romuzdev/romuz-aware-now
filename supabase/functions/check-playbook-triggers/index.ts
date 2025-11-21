/**
 * M18 Part 2: Check Playbook Triggers Edge Function
 * Monitors events and automatically triggers playbooks based on configured triggers
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, eventData, tenantId } = await req.json();

    if (!eventType || !tenantId) {
      throw new Error('eventType and tenantId are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Check-Triggers] Checking triggers for event:', eventType);

    // 1. Fetch all active triggers for this tenant
    const { data: triggers, error: triggersError } = await supabase
      .from('playbook_triggers')
      .select(`
        *,
        playbook:soar_playbooks(*)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true);

    if (triggersError) {
      throw new Error('Failed to fetch triggers');
    }

    console.log(`[Check-Triggers] Found ${triggers?.length || 0} active triggers`);

    const triggeredPlaybooks: string[] = [];

    // 2. Check each trigger to see if it matches the event
    for (const trigger of triggers || []) {
      const shouldTrigger = await evaluateTrigger(trigger, eventType, eventData);

      if (shouldTrigger) {
        // Check cooldown period
        if (trigger.last_triggered_at && trigger.cooldown_minutes > 0) {
          const lastTriggered = new Date(trigger.last_triggered_at);
          const cooldownEnd = new Date(lastTriggered.getTime() + trigger.cooldown_minutes * 60000);
          
          if (new Date() < cooldownEnd) {
            console.log(`[Check-Triggers] Trigger ${trigger.id} is in cooldown period`);
            continue;
          }
        }

        console.log(`[Check-Triggers] Trigger ${trigger.id} matched, executing playbook`);

        // Execute the playbook
        try {
          const executeResponse = await fetch(
            `${supabaseUrl}/functions/v1/execute-playbook`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                playbookId: trigger.playbook_id,
                contextData: eventData,
              }),
            }
          );

          if (executeResponse.ok) {
            triggeredPlaybooks.push(trigger.playbook_id);

            // Update trigger statistics
            await supabase
              .from('playbook_triggers')
              .update({
                last_triggered_at: new Date().toISOString(),
                trigger_count: (trigger.trigger_count || 0) + 1,
              })
              .eq('id', trigger.id);
          }
        } catch (execError) {
          console.error('[Check-Triggers] Failed to execute playbook:', execError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        triggered_playbooks: triggeredPlaybooks,
        checked_triggers: triggers?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Check-Triggers] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Evaluate if a trigger should fire based on event and configuration
 */
async function evaluateTrigger(
  trigger: any,
  eventType: string,
  eventData: any
): Promise<boolean> {
  const config = trigger.trigger_config || {};

  switch (trigger.trigger_type) {
    case 'event':
      return evaluateEventTrigger(config, eventType, eventData);
    
    case 'threshold':
      return evaluateThresholdTrigger(config, eventData);
    
    case 'schedule':
      // Schedule triggers are handled by cron jobs, not event-based
      return false;
    
    default:
      return false;
  }
}

/**
 * Evaluate event-based trigger
 */
function evaluateEventTrigger(config: any, eventType: string, eventData: any): boolean {
  // Check if event type matches
  const expectedEvents = config.event_types || [];
  if (!expectedEvents.includes(eventType)) {
    return false;
  }

  // Check additional conditions if specified
  if (config.conditions) {
    return evaluateConditions(config.conditions, eventData);
  }

  return true;
}

/**
 * Evaluate threshold-based trigger
 */
function evaluateThresholdTrigger(config: any, eventData: any): boolean {
  const { metric, operator, value } = config;

  if (!metric || !operator || value === undefined) {
    return false;
  }

  const metricValue = eventData[metric];
  if (metricValue === undefined) {
    return false;
  }

  switch (operator) {
    case '>':
      return metricValue > value;
    case '>=':
      return metricValue >= value;
    case '<':
      return metricValue < value;
    case '<=':
      return metricValue <= value;
    case '==':
      return metricValue === value;
    case '!=':
      return metricValue !== value;
    default:
      return false;
  }
}

/**
 * Evaluate complex conditions
 */
function evaluateConditions(conditions: any, data: any): boolean {
  // Placeholder for complex condition evaluation
  // This would support AND/OR logic and nested conditions
  
  if (!conditions || !Array.isArray(conditions)) {
    return true;
  }

  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const fieldValue = data[field];

    let conditionMet = false;
    switch (operator) {
      case 'equals':
        conditionMet = fieldValue === value;
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(value);
        break;
      case 'greater_than':
        conditionMet = fieldValue > value;
        break;
      case 'less_than':
        conditionMet = fieldValue < value;
        break;
      default:
        conditionMet = false;
    }

    if (!conditionMet) {
      return false;
    }
  }

  return true;
}
