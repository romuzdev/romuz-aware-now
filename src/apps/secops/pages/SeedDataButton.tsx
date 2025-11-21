/**
 * Seed Test Data Button
 * M18.5 - Add test data for SecOps demo
 */

import { Button } from '@/core/components/ui/button';
import { Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { toast } from 'sonner';
import { useState } from 'react';

export function SeedDataButton() {
  const { tenantId } = useAppContext();
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    if (!tenantId) {
      toast.error('لا يمكن تحديد المستأجر');
      return;
    }

    setLoading(true);
    toast.info('جاري إضافة البيانات التجريبية...');

    try {
      // 1. Add Connectors
      const { data: connectors } = await supabase
        .from('secops_connectors')
        .insert([
          {
            tenant_id: tenantId,
            name_ar: 'جدار حماية Fortinet FortiGate',
            name_en: 'Fortinet FortiGate Firewall',
            connector_type: 'firewall',
            vendor: 'Fortinet',
            version: '7.2.0',
            connection_config: { host: '192.168.1.100', port: 443 },
            auth_config: { auth_type: 'api_key' },
            sync_enabled: true,
            sync_interval_minutes: 15,
            sync_status: 'success',
            is_active: true,
            error_count: 0,
          },
          {
            tenant_id: tenantId,
            name_ar: 'نظام SIEM Splunk',
            name_en: 'Splunk SIEM',
            connector_type: 'siem',
            vendor: 'Splunk',
            version: '9.0',
            connection_config: { host: 'splunk.company.local', port: 8089 },
            auth_config: { auth_type: 'token' },
            sync_enabled: true,
            sync_interval_minutes: 10,
            sync_status: 'success',
            is_active: true,
            error_count: 0,
          },
          {
            tenant_id: tenantId,
            name_ar: 'حماية النقاط الطرفية CrowdStrike',
            name_en: 'CrowdStrike Endpoint Protection',
            connector_type: 'endpoint_protection',
            vendor: 'CrowdStrike',
            version: '6.0',
            connection_config: { api_url: 'https://api.crowdstrike.com' },
            auth_config: { auth_type: 'oauth2' },
            sync_enabled: true,
            sync_interval_minutes: 20,
            sync_status: 'idle',
            is_active: true,
            error_count: 0,
          },
        ])
        .select();

      // 2. Add Security Events
      await supabase.from('security_events').insert([
        {
          tenant_id: tenantId,
          event_timestamp: new Date(Date.now() - 3600000).toISOString(),
          event_type: 'ransomware_detected',
          severity: 'critical',
          source_system: 'CrowdStrike',
          source_ip: '192.168.1.100',
          event_data: {
            description: 'تم اكتشاف نشاط برمجية فدية على الخادم',
            target_asset: 'SERVER-DB-01',
            tags: ['high_priority', 'investigate_immediately'],
          },
          raw_log: 'Critical ransomware detected',
          normalized_fields: { has_source_ip: true, event_category: 'malware' },
          is_processed: false,
        },
        {
          tenant_id: tenantId,
          event_timestamp: new Date(Date.now() - 7200000).toISOString(),
          event_type: 'data_exfiltration_attempt',
          severity: 'critical',
          source_system: 'Firewall',
          source_ip: '192.168.1.101',
          destination_ip: '203.0.113.50',
          event_data: {
            description: 'محاولة غير مصرح بها لتسريب بيانات حساسة',
            target_asset: 'WORKSTATION-15',
            tags: ['high_priority'],
          },
          raw_log: 'Data exfiltration attempt',
          normalized_fields: { has_source_ip: true, event_category: 'data_loss' },
          is_processed: false,
        },
        {
          tenant_id: tenantId,
          event_timestamp: new Date(Date.now() - 1800000).toISOString(),
          event_type: 'suspicious_login_attempt',
          severity: 'high',
          source_system: 'SIEM',
          source_ip: '10.0.0.100',
          user_id: 'user100',
          event_data: {
            description: 'محاولة تسجيل دخول مشبوهة من الصين',
            login_attempts: 5,
            geo_location: 'China',
          },
          normalized_fields: { has_source_ip: true, event_category: 'authentication' },
          is_processed: false,
        },
        {
          tenant_id: tenantId,
          event_timestamp: new Date(Date.now() - 3600000).toISOString(),
          event_type: 'policy_violation',
          severity: 'medium',
          source_system: 'DLP',
          source_ip: '192.168.2.10',
          user_id: 'employee0',
          event_data: {
            description: 'محاولة مشاركة ملف حساس',
            file_name: 'confidential.pdf',
          },
          normalized_fields: { has_source_ip: true, event_category: 'data_loss' },
          is_processed: true,
        },
      ]);

      // 3. Add SOAR Playbooks
      await supabase.from('soar_playbooks').insert([
        {
          tenant_id: tenantId,
          playbook_name_ar: 'الاستجابة التلقائية لبرمجيات الفدية',
          playbook_name_en: 'Automated Ransomware Response',
          description_ar: 'عزل الأجهزة المصابة وإنشاء تذكرة حادث',
          trigger_conditions: {
            event_type: ['ransomware_detected'],
            severity: ['critical'],
          },
          automation_steps: [
            {
              action: 'isolate_endpoint',
              parameters: { hostname: '{{event.target_asset}}' },
            },
            {
              action: 'create_ticket',
              parameters: { title_ar: 'حادث برمجية فدية', severity: 'critical' },
            },
          ],
          approval_required: false,
          is_active: true,
          execution_count: 12,
          success_count: 11,
        },
        {
          tenant_id: tenantId,
          playbook_name_ar: 'حظر IP المشبوه',
          playbook_name_en: 'Block Suspicious IP',
          description_ar: 'حظر عناوين IP المشبوهة تلقائياً',
          trigger_conditions: {
            event_type: ['suspicious_login_attempt'],
            severity: ['high'],
          },
          automation_steps: [
            {
              action: 'block_ip',
              parameters: { ip: '{{event.source_ip}}' },
            },
          ],
          approval_required: false,
          is_active: true,
          execution_count: 28,
          success_count: 26,
        },
      ]);

      toast.success('تم إضافة البيانات التجريبية بنجاح!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast.error(`فشل في إضافة البيانات: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeedData}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Database className="h-4 w-4" />
      {loading ? 'جاري الإضافة...' : 'إضافة بيانات تجريبية'}
    </Button>
  );
}
