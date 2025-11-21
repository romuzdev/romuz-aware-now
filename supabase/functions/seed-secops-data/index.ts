/**
 * Seed SecOps Test Data
 * M18.5 - Generate comprehensive test data for SecOps app
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getTenantId } from '../_shared/tenant-utils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SecOps Seed] Starting data generation...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const tenantId = await getTenantId(supabaseClient, user.id);
    console.log(`[SecOps Seed] Generating data for tenant: ${tenantId}`);

    // 1. Create Connectors
    console.log('[SecOps Seed] Creating connectors...');
    const connectors = await createConnectors(supabaseClient, tenantId, user.id);

    // 2. Create Security Events
    console.log('[SecOps Seed] Creating security events...');
    const events = await createSecurityEvents(supabaseClient, tenantId);

    // 3. Create SOAR Playbooks
    console.log('[SecOps Seed] Creating SOAR playbooks...');
    const playbooks = await createSOARPlaybooks(supabaseClient, tenantId, user.id);

    // 4. Create SOAR Executions
    console.log('[SecOps Seed] Creating SOAR executions...');
    const executions = await createSOARExecutions(supabaseClient, tenantId, playbooks, events, user.id);

    // 5. Create Correlation Rules
    console.log('[SecOps Seed] Creating correlation rules...');
    const rules = await createCorrelationRules(supabaseClient, tenantId, user.id);

    // 6. Create Connector Sync Logs
    console.log('[SecOps Seed] Creating sync logs...');
    const syncLogs = await createConnectorSyncLogs(supabaseClient, tenantId, connectors);

    console.log('[SecOps Seed] Data generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء البيانات التجريبية بنجاح',
        data: {
          connectors: connectors.length,
          events: events.length,
          playbooks: playbooks.length,
          executions: executions.length,
          rules: rules.length,
          syncLogs: syncLogs.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[SecOps Seed] Error:', error);
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

async function createConnectors(supabase: any, tenantId: string, userId: string) {
  const connectors = [
    {
      tenant_id: tenantId,
      name_ar: 'جدار حماية Fortinet FortiGate',
      name_en: 'Fortinet FortiGate Firewall',
      connector_type: 'firewall',
      vendor: 'Fortinet',
      version: '7.2.0',
      connection_config: {
        host: '192.168.1.100',
        port: 443,
        protocol: 'https',
      },
      auth_config: {
        auth_type: 'api_key',
      },
      sync_enabled: true,
      sync_interval_minutes: 15,
      sync_status: 'success',
      is_active: true,
      created_by: userId,
      updated_by: userId,
      error_count: 0,
    },
    {
      tenant_id: tenantId,
      name_ar: 'نظام SIEM Splunk',
      name_en: 'Splunk SIEM',
      connector_type: 'siem',
      vendor: 'Splunk',
      version: '9.0',
      connection_config: {
        host: 'splunk.company.local',
        port: 8089,
      },
      auth_config: {
        auth_type: 'token',
      },
      sync_enabled: true,
      sync_interval_minutes: 10,
      sync_status: 'success',
      is_active: true,
      created_by: userId,
      updated_by: userId,
      error_count: 0,
    },
    {
      tenant_id: tenantId,
      name_ar: 'حماية النقاط الطرفية CrowdStrike',
      name_en: 'CrowdStrike Endpoint Protection',
      connector_type: 'endpoint_protection',
      vendor: 'CrowdStrike',
      version: '6.0',
      connection_config: {
        api_url: 'https://api.crowdstrike.com',
      },
      auth_config: {
        auth_type: 'oauth2',
      },
      sync_enabled: true,
      sync_interval_minutes: 20,
      sync_status: 'idle',
      is_active: true,
      created_by: userId,
      updated_by: userId,
      error_count: 0,
    },
    {
      tenant_id: tenantId,
      name_ar: 'نظام IDS/IPS Snort',
      name_en: 'Snort IDS/IPS',
      connector_type: 'ids_ips',
      vendor: 'Cisco',
      version: '3.0',
      connection_config: {
        host: '192.168.1.50',
        port: 22,
      },
      auth_config: {
        auth_type: 'ssh_key',
      },
      sync_enabled: false,
      sync_interval_minutes: 30,
      sync_status: 'error',
      is_active: false,
      created_by: userId,
      updated_by: userId,
      error_count: 3,
      last_error: 'Connection timeout after 30 seconds',
    },
    {
      tenant_id: tenantId,
      name_ar: 'أمان البريد الإلكتروني Proofpoint',
      name_en: 'Proofpoint Email Security',
      connector_type: 'email_security',
      vendor: 'Proofpoint',
      version: '8.0',
      connection_config: {
        api_url: 'https://api.proofpoint.com',
      },
      auth_config: {
        auth_type: 'api_key',
      },
      sync_enabled: true,
      sync_interval_minutes: 60,
      sync_status: 'success',
      is_active: true,
      created_by: userId,
      updated_by: userId,
      error_count: 0,
    },
  ];

  const { data, error } = await supabase
    .from('secops_connectors')
    .insert(connectors)
    .select();

  if (error) throw error;
  return data;
}

async function createSecurityEvents(supabase: any, tenantId: string) {
  const now = new Date();
  const events = [];

  // Critical Events
  for (let i = 0; i < 5; i++) {
    const eventTime = new Date(now.getTime() - i * 3600000); // Last 5 hours
    events.push({
      tenant_id: tenantId,
      event_timestamp: eventTime.toISOString(),
      event_type: i % 2 === 0 ? 'ransomware_detected' : 'data_exfiltration_attempt',
      severity: 'critical',
      source_system: i % 2 === 0 ? 'CrowdStrike' : 'Firewall',
      source_ip: `192.168.1.${100 + i}`,
      destination_ip: i % 2 === 0 ? undefined : `203.0.113.${50 + i}`,
      user_id: i % 3 === 0 ? 'user123' : undefined,
      event_data: {
        description: i % 2 === 0 
          ? 'تم اكتشاف نشاط برمجية فدية على الخادم' 
          : 'محاولة غير مصرح بها لتسريب بيانات حساسة',
        target_asset: i % 2 === 0 ? 'SERVER-DB-01' : 'WORKSTATION-15',
        tags: ['high_priority', 'investigate_immediately'],
        confidence: 0.95,
      },
      raw_log: `Critical security event detected at ${eventTime.toISOString()}`,
      normalized_fields: {
        has_source_ip: true,
        has_destination_ip: i % 2 !== 0,
        event_category: i % 2 === 0 ? 'malware' : 'data_loss',
      },
      is_processed: i > 2,
    });
  }

  // High Severity Events
  for (let i = 0; i < 8; i++) {
    const eventTime = new Date(now.getTime() - i * 1800000); // Last 4 hours
    events.push({
      tenant_id: tenantId,
      event_timestamp: eventTime.toISOString(),
      event_type: 'suspicious_login_attempt',
      severity: 'high',
      source_system: 'SIEM',
      source_ip: `10.0.${i}.${100 + i}`,
      user_id: `user${100 + i}`,
      event_data: {
        description: 'محاولة تسجيل دخول مشبوهة من موقع غير معتاد',
        login_attempts: 5 + i,
        tags: ['authentication', 'suspicious'],
        geo_location: i % 2 === 0 ? 'China' : 'Russia',
      },
      raw_log: `Failed login attempts detected from ${`10.0.${i}.${100 + i}`}`,
      normalized_fields: {
        has_source_ip: true,
        has_user_id: true,
        event_category: 'authentication',
      },
      is_processed: i > 5,
    });
  }

  // Medium Severity Events
  for (let i = 0; i < 12; i++) {
    const eventTime = new Date(now.getTime() - i * 900000); // Last 3 hours
    events.push({
      tenant_id: tenantId,
      event_timestamp: eventTime.toISOString(),
      event_type: 'policy_violation',
      severity: 'medium',
      source_system: 'DLP',
      source_ip: `192.168.2.${10 + i}`,
      user_id: `employee${i}`,
      event_data: {
        description: 'محاولة مشاركة ملف حساس خارج الشركة',
        file_name: `confidential_report_${i}.pdf`,
        tags: ['dlp', 'policy_violation'],
      },
      normalized_fields: {
        has_source_ip: true,
        has_user_id: true,
        event_category: 'data_loss',
      },
      is_processed: i > 8,
    });
  }

  // Low Severity Events
  for (let i = 0; i < 15; i++) {
    const eventTime = new Date(now.getTime() - i * 600000);
    events.push({
      tenant_id: tenantId,
      event_timestamp: eventTime.toISOString(),
      event_type: 'firewall_rule_triggered',
      severity: 'low',
      source_system: 'Firewall',
      source_ip: `172.16.0.${10 + i}`,
      destination_ip: `8.8.8.${i}`,
      event_data: {
        description: 'تم حظر حركة مرور غير معتادة',
        rule_name: `BLOCK_SUSPICIOUS_TRAFFIC_${i}`,
        tags: ['firewall', 'blocked'],
      },
      normalized_fields: {
        has_source_ip: true,
        has_destination_ip: true,
        event_category: 'firewall',
      },
      is_processed: true,
    });
  }

  const { data, error } = await supabase
    .from('security_events')
    .insert(events)
    .select();

  if (error) throw error;
  return data;
}

async function createSOARPlaybooks(supabase: any, tenantId: string, userId: string) {
  const playbooks = [
    {
      tenant_id: tenantId,
      playbook_name_ar: 'الاستجابة التلقائية لبرمجيات الفدية',
      playbook_name_en: 'Automated Ransomware Response',
      description_ar: 'عزل الأجهزة المصابة تلقائياً وإيقاف حسابات المستخدمين وإنشاء تذكرة حادث',
      description_en: 'Automatically isolate infected endpoints, disable user accounts, and create incident ticket',
      trigger_conditions: {
        event_type: ['ransomware_detected', 'malware_detected'],
        severity: ['critical', 'high'],
      },
      automation_steps: [
        {
          action: 'isolate_endpoint',
          parameters: { hostname: '{{event.target_asset}}' },
          on_failure: 'continue',
        },
        {
          action: 'disable_user',
          parameters: { userId: '{{event.user_id}}' },
          on_failure: 'continue',
        },
        {
          action: 'create_ticket',
          parameters: {
            title_ar: 'حادث برمجية فدية',
            severity: 'critical',
          },
          on_failure: 'stop',
        },
        {
          action: 'send_notification',
          parameters: {
            title: 'تنبيه أمني حرج',
            message: 'تم اكتشاف برمجية فدية واتخاذ إجراءات تلقائية',
            recipients: ['security-team@company.com'],
          },
        },
      ],
      approval_required: false,
      is_active: true,
      execution_count: 12,
      success_count: 11,
      created_by: userId,
      updated_by: userId,
    },
    {
      tenant_id: tenantId,
      playbook_name_ar: 'حظر IP المشبوه',
      playbook_name_en: 'Block Suspicious IP',
      description_ar: 'حظر عناوين IP المشبوهة على جدار الحماية وإرسال تنبيه',
      description_en: 'Block suspicious IP addresses on firewall and send alert',
      trigger_conditions: {
        event_type: ['suspicious_login_attempt', 'brute_force_attack'],
        severity: ['high', 'critical'],
      },
      automation_steps: [
        {
          action: 'block_ip',
          parameters: { ip: '{{event.source_ip}}' },
          on_failure: 'retry',
          retry_count: 3,
        },
        {
          action: 'update_firewall',
          parameters: {
            rule: 'BLOCK_MALICIOUS_IP',
            action: 'deny',
          },
        },
        {
          action: 'send_notification',
          parameters: {
            title: 'تم حظر IP مشبوه',
            message: 'تم حظر {{event.source_ip}} تلقائياً',
          },
        },
      ],
      approval_required: false,
      is_active: true,
      execution_count: 28,
      success_count: 26,
      created_by: userId,
      updated_by: userId,
    },
    {
      tenant_id: tenantId,
      playbook_name_ar: 'الاستجابة لتسريب البيانات',
      playbook_name_en: 'Data Exfiltration Response',
      description_ar: 'إيقاف محاولات تسريب البيانات وعزل المستخدم وإشعار فريق الأمن',
      description_en: 'Stop data exfiltration attempts, isolate user, and notify security team',
      trigger_conditions: {
        event_type: ['data_exfiltration_attempt', 'unauthorized_data_transfer'],
        severity: ['critical', 'high'],
      },
      automation_steps: [
        {
          action: 'disable_user',
          parameters: { userId: '{{event.user_id}}' },
        },
        {
          action: 'isolate_endpoint',
          parameters: { hostname: '{{event.target_asset}}' },
        },
        {
          action: 'create_ticket',
          parameters: {
            title_ar: 'محاولة تسريب بيانات',
            severity: 'critical',
          },
        },
      ],
      approval_required: true,
      is_active: true,
      execution_count: 5,
      success_count: 5,
      created_by: userId,
      updated_by: userId,
    },
    {
      tenant_id: tenantId,
      playbook_name_ar: 'حجر الملفات المشبوهة',
      playbook_name_en: 'Quarantine Suspicious Files',
      description_ar: 'وضع الملفات المشبوهة في الحجر الصحي تلقائياً',
      description_en: 'Automatically quarantine suspicious files',
      trigger_conditions: {
        event_type: ['malicious_file_detected'],
        severity: ['high', 'critical'],
      },
      automation_steps: [
        {
          action: 'quarantine_file',
          parameters: { file_path: '{{event.file_path}}' },
        },
        {
          action: 'send_notification',
          parameters: {
            title: 'تم حجر ملف مشبوه',
          },
        },
      ],
      approval_required: false,
      is_active: false,
      execution_count: 0,
      success_count: 0,
      created_by: userId,
      updated_by: userId,
    },
  ];

  const { data, error } = await supabase
    .from('soar_playbooks')
    .insert(playbooks)
    .select();

  if (error) throw error;
  return data;
}

async function createSOARExecutions(
  supabase: any,
  tenantId: string,
  playbooks: any[],
  events: any[],
  userId: string
) {
  const executions = [];
  const now = new Date();

  // Completed executions
  for (let i = 0; i < 8; i++) {
    const playbook = playbooks[i % playbooks.length];
    const event = events[i];
    const startTime = new Date(now.getTime() - (i + 1) * 3600000);
    const endTime = new Date(startTime.getTime() + 120000); // 2 minutes later

    executions.push({
      tenant_id: tenantId,
      playbook_id: playbook.id,
      trigger_event_id: event?.id,
      status: i % 7 === 0 ? 'failed' : 'completed',
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString(),
      execution_log: [
        {
          timestamp: startTime.toISOString(),
          action: 'isolate_endpoint',
          status: 'success',
          details: { hostname: 'SERVER-01' },
        },
        {
          timestamp: new Date(startTime.getTime() + 60000).toISOString(),
          action: 'create_ticket',
          status: i % 7 === 0 ? 'failed' : 'success',
          details: { incident_id: `INC-${1000 + i}` },
          error: i % 7 === 0 ? 'Failed to create incident ticket' : undefined,
        },
      ],
      actions_taken: ['isolate_endpoint', 'create_ticket'],
      result: {
        success: i % 7 !== 0,
        steps_executed: 2,
      },
      error_message: i % 7 === 0 ? 'One or more steps failed' : null,
      executed_by: userId,
    });
  }

  // Running executions
  for (let i = 0; i < 2; i++) {
    const playbook = playbooks[i % playbooks.length];
    const startTime = new Date(now.getTime() - i * 300000); // Last 10 minutes

    executions.push({
      tenant_id: tenantId,
      playbook_id: playbook.id,
      status: 'running',
      started_at: startTime.toISOString(),
      execution_log: [
        {
          timestamp: startTime.toISOString(),
          action: 'block_ip',
          status: 'success',
          details: { ip: '192.168.1.100' },
        },
      ],
      actions_taken: ['block_ip'],
      executed_by: userId,
    });
  }

  const { data, error } = await supabase
    .from('soar_executions')
    .insert(executions)
    .select();

  if (error) throw error;
  return data;
}

async function createCorrelationRules(supabase: any, tenantId: string, userId: string) {
  const rules = [
    {
      tenant_id: tenantId,
      rule_name_ar: 'هجوم القوة الغاشمة',
      rule_name_en: 'Brute Force Attack Detection',
      description_ar: 'كشف محاولات تسجيل دخول متعددة فاشلة من نفس IP',
      description_en: 'Detect multiple failed login attempts from same IP',
      event_patterns: [
        {
          event_type: 'login_failed',
          conditions: { attempts: { $gte: 5 } },
        },
      ],
      correlation_logic: 'threshold',
      time_window_minutes: 15,
      threshold_count: 5,
      severity_override: 'high',
      auto_create_incident: true,
      is_active: true,
      match_count: 23,
      created_by: userId,
      updated_by: userId,
    },
    {
      tenant_id: tenantId,
      rule_name_ar: 'انتشار البرمجيات الخبيثة',
      rule_name_en: 'Malware Spread Detection',
      description_ar: 'كشف انتشار البرمجيات الخبيثة عبر أجهزة متعددة',
      description_en: 'Detect malware spreading across multiple devices',
      event_patterns: [
        {
          event_type: 'malware_detected',
          conditions: { confidence: { $gte: 0.8 } },
        },
      ],
      correlation_logic: 'threshold',
      time_window_minutes: 60,
      threshold_count: 3,
      severity_override: 'critical',
      auto_create_incident: true,
      is_active: true,
      match_count: 8,
      created_by: userId,
      updated_by: userId,
    },
  ];

  const { data, error } = await supabase
    .from('event_correlation_rules')
    .insert(rules)
    .select();

  if (error) throw error;
  return data;
}

async function createConnectorSyncLogs(supabase: any, tenantId: string, connectors: any[]) {
  const logs = [];
  const now = new Date();

  for (const connector of connectors.slice(0, 3)) {
    // Last 5 syncs for each active connector
    for (let i = 0; i < 5; i++) {
      const syncStart = new Date(now.getTime() - (i + 1) * 3600000);
      const syncEnd = new Date(syncStart.getTime() + 180000); // 3 minutes

      logs.push({
        tenant_id: tenantId,
        connector_id: connector.id,
        sync_started_at: syncStart.toISOString(),
        sync_completed_at: syncEnd.toISOString(),
        status: i % 5 === 0 ? 'error' : 'success',
        records_processed: i % 5 === 0 ? 0 : 100 + i * 20,
        records_imported: i % 5 === 0 ? 0 : 95 + i * 18,
        records_failed: i % 5 === 0 ? 0 : 5 + i * 2,
        error_message: i % 5 === 0 ? 'Connection timeout' : null,
        sync_details: {
          duration_seconds: 180,
          source: connector.vendor,
        },
      });
    }
  }

  const { data, error } = await supabase
    .from('secops_connector_sync_logs')
    .insert(logs)
    .select();

  if (error) throw error;
  return data;
}
