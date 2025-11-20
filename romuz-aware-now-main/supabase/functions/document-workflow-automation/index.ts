/**
 * Document Workflow Automation Edge Function
 * 
 * Handles automated document workflows:
 * - Auto-approval based on rules
 * - Expiration alerts
 * - AI smart tagging
 * - Version comparison
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowRequest {
  action: 'execute_rule' | 'check_expirations' | 'suggest_tags' | 'compare_versions';
  rule_id?: string;
  document_id?: string;
  version_ids?: string[];
  tenant_id: string;
}

interface WorkflowRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  actions: any;
  is_enabled: boolean;
  priority: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WorkflowRequest = await req.json();
    console.log('Workflow request:', body);

    let result;

    switch (body.action) {
      case 'execute_rule':
        result = await executeRule(supabase, body);
        break;
      case 'check_expirations':
        result = await checkExpirations(supabase, body);
        break;
      case 'suggest_tags':
        result = await suggestTags(supabase, body);
        break;
      case 'compare_versions':
        result = await compareVersions(supabase, body);
        break;
      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Workflow error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Execute a workflow rule
 */
async function executeRule(supabase: any, request: WorkflowRequest) {
  const startTime = Date.now();
  const { rule_id, document_id, tenant_id } = request;

  if (!rule_id || !document_id) {
    throw new Error('rule_id and document_id are required');
  }

  // Fetch rule
  const { data: rule, error: ruleError } = await supabase
    .from('document_workflow_rules')
    .select('*')
    .eq('id', rule_id)
    .eq('tenant_id', tenant_id)
    .eq('is_enabled', true)
    .single();

  if (ruleError || !rule) {
    throw new Error('Rule not found or disabled');
  }

  // Fetch document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', document_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (docError || !document) {
    throw new Error('Document not found');
  }

  // Check conditions
  const conditionsMet = evaluateConditions(rule.conditions, document);
  
  if (!conditionsMet) {
    await logExecution(supabase, {
      tenant_id,
      rule_id,
      document_id,
      execution_status: 'skipped',
      execution_duration_ms: Date.now() - startTime,
      trigger_event: 'manual',
      metadata: { reason: 'Conditions not met' },
    });

    return { success: false, reason: 'Conditions not met' };
  }

  // Execute actions
  const actionsPerformed = await executeActions(supabase, rule.actions, document);

  // Update rule execution count
  await supabase
    .from('document_workflow_rules')
    .update({
      execution_count: rule.execution_count + 1,
      last_executed_at: new Date().toISOString(),
    })
    .eq('id', rule_id);

  // Log execution
  await logExecution(supabase, {
    tenant_id,
    rule_id,
    document_id,
    execution_status: 'success',
    execution_duration_ms: Date.now() - startTime,
    actions_performed: actionsPerformed,
    trigger_event: 'manual',
  });

  return { success: true, actions_performed: actionsPerformed };
}

/**
 * Check document expirations and send alerts
 */
async function checkExpirations(supabase: any, request: WorkflowRequest) {
  const { tenant_id } = request;
  const today = new Date();
  const alerts = [];

  // Find documents expiring in the next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, created_at, tenant_id')
    .eq('tenant_id', tenant_id)
    .eq('status', 'active')
    .gte('created_at', today.toISOString())
    .lte('created_at', thirtyDaysFromNow.toISOString());

  if (documents && documents.length > 0) {
    for (const doc of documents) {
      // Publish event for expiration alert
      const { error: eventError } = await supabase
        .from('system_events')
        .insert({
          tenant_id: doc.tenant_id,
          event_type: 'document_expired',
          event_category: 'document',
          source_module: 'document_management',
          entity_type: 'document',
          entity_id: doc.id,
          priority: 'high',
          payload: {
            document_name: doc.title,
            alert_type: 'expiration_warning',
          },
        });

      if (!eventError) {
        alerts.push({
          document_id: doc.id,
          document_title: doc.title,
          alert_type: 'expiration_warning',
        });
      }
    }
  }

  return { alerts, count: alerts.length };
}

/**
 * AI-powered smart tag suggestions
 */
async function suggestTags(supabase: any, request: WorkflowRequest) {
  const { document_id, tenant_id } = request;

  if (!document_id) {
    throw new Error('document_id is required');
  }

  // Fetch document
  const { data: document } = await supabase
    .from('documents')
    .select('title, description, doc_type')
    .eq('id', document_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!document) {
    throw new Error('Document not found');
  }

  // Simple keyword-based tagging
  const tags = [];
  const text = `${document.title} ${document.description || ''}`.toLowerCase();

  // Predefined keywords
  const keywords = {
    security: ['security', 'أمن', 'حماية', 'أمان'],
    compliance: ['compliance', 'التزام', 'امتثال'],
    policy: ['policy', 'سياسة'],
    procedure: ['procedure', 'إجراء'],
    risk: ['risk', 'مخاطر', 'خطر'],
    audit: ['audit', 'مراجعة', 'تدقيق'],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      tags.push(category);
    }
  }

  return { document_id, suggested_tags: tags };
}

/**
 * Compare document versions
 */
async function compareVersions(supabase: any, request: WorkflowRequest) {
  const { version_ids, tenant_id } = request;

  if (!version_ids || version_ids.length !== 2) {
    throw new Error('Exactly 2 version_ids are required');
  }

  const { data: versions } = await supabase
    .from('document_versions')
    .select('*')
    .in('id', version_ids)
    .eq('tenant_id', tenant_id);

  if (!versions || versions.length !== 2) {
    throw new Error('Versions not found');
  }

  const [v1, v2] = versions.sort((a: any, b: any) => a.version_number - b.version_number);

  return {
    version1: {
      id: v1.id,
      version_number: v1.version_number,
      uploaded_at: v1.uploaded_at,
      file_size_bytes: v1.file_size_bytes,
    },
    version2: {
      id: v2.id,
      version_number: v2.version_number,
      uploaded_at: v2.uploaded_at,
      file_size_bytes: v2.file_size_bytes,
    },
    comparison: {
      version_diff: v2.version_number - v1.version_number,
      size_diff_bytes: v2.file_size_bytes - v1.file_size_bytes,
      time_diff_days: Math.floor(
        (new Date(v2.uploaded_at).getTime() - new Date(v1.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    },
  };
}

/**
 * Evaluate rule conditions against document
 */
function evaluateConditions(conditions: any, document: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions means always execute
  }

  // Check doc_type condition
  if (conditions.doc_type && conditions.doc_type !== document.doc_type) {
    return false;
  }

  // Check status condition
  if (conditions.status && conditions.status !== document.status) {
    return false;
  }

  // Check linked_module condition
  if (conditions.linked_module && conditions.linked_module !== document.linked_module) {
    return false;
  }

  return true;
}

/**
 * Execute rule actions
 */
async function executeActions(supabase: any, actions: any, document: any): Promise<any[]> {
  const performed: any[] = [];

  if (!actions || Object.keys(actions).length === 0) {
    return performed;
  }

  // Auto-approve action
  if (actions.auto_approve === true) {
    await supabase
      .from('documents')
      .update({ status: 'approved' })
      .eq('id', document.id);
    
    performed.push({ action: 'auto_approve', status: 'completed' });
  }

  // Set status action
  if (actions.set_status) {
    await supabase
      .from('documents')
      .update({ status: actions.set_status })
      .eq('id', document.id);
    
    performed.push({ action: 'set_status', value: actions.set_status, status: 'completed' });
  }

  // Send notification action
  if (actions.send_notification) {
    await supabase
      .from('system_events')
      .insert({
        tenant_id: document.tenant_id,
        event_type: 'document_workflow_action',
        event_category: 'document',
        source_module: 'document_management',
        entity_type: 'document',
        entity_id: document.id,
        priority: 'medium',
        payload: {
          notification: actions.send_notification,
          document_title: document.title,
        },
      });

    performed.push({ action: 'send_notification', status: 'completed' });
  }

  return performed;
}

/**
 * Log workflow execution
 */
async function logExecution(supabase: any, execution: any) {
  const completedAt = new Date().toISOString();
  
  await supabase
    .from('document_workflow_executions')
    .insert({
      ...execution,
      execution_completed_at: completedAt,
    });
}
