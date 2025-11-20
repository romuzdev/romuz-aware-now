/**
 * System Job Templates
 * Pre-configured job templates for common operations
 */

export interface JobTemplate {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  category: 'kpi' | 'report' | 'alert' | 'awareness' | 'maintenance';
  icon: string;
  recommended_schedule: string;
  schedule_description_ar: string;
  default_config: {
    job_key: string;
    display_name: string;
    description: string;
    gate_code: string;
    job_type: string;
    schedule_cron: string;
    is_enabled: boolean;
    config: Record<string, any>;
  };
}

export const JOB_TEMPLATES: JobTemplate[] = [
  // KPI Templates
  {
    id: 'refresh_all_kpis',
    name_ar: 'تحديث جميع مؤشرات الأداء',
    name_en: 'Refresh All KPIs',
    description_ar: 'تحديث جميع مؤشرات الأداء (KPIs) من مصادر البيانات وإعادة حساب القيم',
    description_en: 'Refresh all KPI metrics from data sources and recalculate values',
    category: 'kpi',
    icon: 'BarChart3',
    recommended_schedule: '0 2 * * *',
    schedule_description_ar: 'يومياً الساعة 2 صباحاً',
    default_config: {
      job_key: 'refresh_all_kpis',
      display_name: 'تحديث جميع مؤشرات الأداء',
      description: 'تحديث دوري لجميع مؤشرات الأداء الرئيسية من مصادر البيانات',
      gate_code: 'Gate-K',
      job_type: 'scheduled',
      schedule_cron: '0 2 * * *',
      is_enabled: true,
      config: {
        refresh_mode: 'full',
        include_materialized_views: true,
        timeout_seconds: 300,
      },
    },
  },
  {
    id: 'refresh_weekly_kpis',
    name_ar: 'تحديث مؤشرات الأداء الأسبوعية',
    name_en: 'Refresh Weekly KPIs',
    description_ar: 'تحديث مؤشرات الأداء الأسبوعية والإحصائيات المجمعة',
    description_en: 'Refresh weekly KPI metrics and aggregated statistics',
    category: 'kpi',
    icon: 'TrendingUp',
    recommended_schedule: '0 3 * * 1',
    schedule_description_ar: 'كل يوم إثنين الساعة 3 صباحاً',
    default_config: {
      job_key: 'refresh_weekly_kpis',
      display_name: 'تحديث مؤشرات الأداء الأسبوعية',
      description: 'تحديث أسبوعي لمؤشرات الأداء والإحصائيات المجمعة',
      gate_code: 'Gate-K',
      job_type: 'scheduled',
      schedule_cron: '0 3 * * 1',
      is_enabled: true,
      config: {
        refresh_mode: 'weekly',
        include_trends: true,
      },
    },
  },
  {
    id: 'detect_kpi_anomalies',
    name_ar: 'كشف الانحرافات في مؤشرات الأداء',
    name_en: 'Detect KPI Anomalies',
    description_ar: 'فحص مؤشرات الأداء للكشف عن الانحرافات والقيم الشاذة',
    description_en: 'Scan KPIs to detect anomalies and outlier values',
    category: 'kpi',
    icon: 'AlertTriangle',
    recommended_schedule: '0 4 * * *',
    schedule_description_ar: 'يومياً الساعة 4 صباحاً',
    default_config: {
      job_key: 'detect_kpi_anomalies',
      display_name: 'كشف الانحرافات في مؤشرات الأداء',
      description: 'فحص يومي للكشف عن القيم الشاذة والانحرافات في مؤشرات الأداء',
      gate_code: 'Gate-K',
      job_type: 'scheduled',
      schedule_cron: '0 4 * * *',
      is_enabled: false,
      config: {
        detection_method: 'zscore',
        threshold: 2.5,
        notify_on_detection: true,
      },
    },
  },

  // Report Templates
  {
    id: 'generate_daily_report',
    name_ar: 'تقرير يومي',
    name_en: 'Daily Report',
    description_ar: 'إنشاء تقرير يومي شامل بإحصائيات الحملات والأداء',
    description_en: 'Generate comprehensive daily report with campaign and performance statistics',
    category: 'report',
    icon: 'FileText',
    recommended_schedule: '0 6 * * *',
    schedule_description_ar: 'يومياً الساعة 6 صباحاً',
    default_config: {
      job_key: 'generate_daily_report',
      display_name: 'تقرير يومي',
      description: 'إنشاء تقرير يومي شامل يتضمن إحصائيات الحملات ومؤشرات الأداء',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '0 6 * * *',
      is_enabled: true,
      config: {
        report_type: 'daily',
        include_kpis: true,
        include_campaigns: true,
        export_format: 'pdf',
      },
    },
  },
  {
    id: 'generate_weekly_report',
    name_ar: 'تقرير أسبوعي',
    name_en: 'Weekly Report',
    description_ar: 'إنشاء تقرير أسبوعي مفصل مع تحليل الاتجاهات',
    description_en: 'Generate detailed weekly report with trend analysis',
    category: 'report',
    icon: 'FileBarChart',
    recommended_schedule: '0 7 * * 1',
    schedule_description_ar: 'كل يوم إثنين الساعة 7 صباحاً',
    default_config: {
      job_key: 'generate_weekly_report',
      display_name: 'تقرير أسبوعي',
      description: 'إنشاء تقرير أسبوعي مفصل يتضمن تحليل الاتجاهات والمقارنات',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '0 7 * * 1',
      is_enabled: true,
      config: {
        report_type: 'weekly',
        include_trends: true,
        include_comparisons: true,
        export_format: 'pdf',
      },
    },
  },
  {
    id: 'generate_monthly_report',
    name_ar: 'تقرير شهري',
    name_en: 'Monthly Report',
    description_ar: 'إنشاء تقرير شهري تنفيذي مع توصيات',
    description_en: 'Generate executive monthly report with recommendations',
    category: 'report',
    icon: 'FileCheck',
    recommended_schedule: '0 8 1 * *',
    schedule_description_ar: 'أول كل شهر الساعة 8 صباحاً',
    default_config: {
      job_key: 'generate_monthly_report',
      display_name: 'تقرير شهري',
      description: 'إنشاء تقرير شهري تنفيذي شامل مع توصيات استراتيجية',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '0 8 1 * *',
      is_enabled: true,
      config: {
        report_type: 'monthly',
        include_executive_summary: true,
        include_recommendations: true,
        export_format: 'pdf',
      },
    },
  },

  // Alert Templates
  {
    id: 'check_alert_policies',
    name_ar: 'فحص سياسات التنبيهات',
    name_en: 'Check Alert Policies',
    description_ar: 'فحص سياسات التنبيهات وإرسال الإشعارات للانتهاكات',
    description_en: 'Check alert policies and send notifications for violations',
    category: 'alert',
    icon: 'Bell',
    recommended_schedule: '*/15 * * * *',
    schedule_description_ar: 'كل 15 دقيقة',
    default_config: {
      job_key: 'check_alert_policies',
      display_name: 'فحص سياسات التنبيهات',
      description: 'فحص دوري لسياسات التنبيهات وإرسال الإشعارات عند الانتهاكات',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '*/15 * * * *',
      is_enabled: true,
      config: {
        check_enabled_only: true,
        respect_cooldown: true,
        batch_notifications: true,
      },
    },
  },
  {
    id: 'dispatch_pending_alerts',
    name_ar: 'إرسال التنبيهات المعلقة',
    name_en: 'Dispatch Pending Alerts',
    description_ar: 'إرسال التنبيهات المعلقة إلى القنوات المحددة',
    description_en: 'Dispatch pending alerts to configured channels',
    category: 'alert',
    icon: 'Send',
    recommended_schedule: '*/5 * * * *',
    schedule_description_ar: 'كل 5 دقائق',
    default_config: {
      job_key: 'dispatch_pending_alerts',
      display_name: 'إرسال التنبيهات المعلقة',
      description: 'إرسال التنبيهات المعلقة إلى قنوات الإشعارات المحددة',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '*/5 * * * *',
      is_enabled: true,
      config: {
        max_batch_size: 50,
        retry_failed: true,
        max_retries: 3,
      },
    },
  },

  // Awareness Templates
  {
    id: 'sync_campaign_status',
    name_ar: 'مزامنة حالة الحملات',
    name_en: 'Sync Campaign Status',
    description_ar: 'تحديث حالة الحملات التوعوية بناءً على التواريخ',
    description_en: 'Update awareness campaign status based on dates',
    category: 'awareness',
    icon: 'Users',
    recommended_schedule: '0 1 * * *',
    schedule_description_ar: 'يومياً الساعة 1 صباحاً',
    default_config: {
      job_key: 'sync_campaign_status',
      display_name: 'مزامنة حالة الحملات',
      description: 'تحديث تلقائي لحالة الحملات التوعوية (active/completed) بناءً على التواريخ',
      gate_code: 'Gate-D',
      job_type: 'scheduled',
      schedule_cron: '0 1 * * *',
      is_enabled: true,
      config: {
        auto_activate: true,
        auto_complete: true,
        notify_owners: false,
      },
    },
  },
  {
    id: 'compute_impact_scores',
    name_ar: 'حساب درجات التأثير',
    name_en: 'Compute Impact Scores',
    description_ar: 'حساب درجات تأثير التوعية للوحدات التنظيمية',
    description_en: 'Calculate awareness impact scores for organizational units',
    category: 'awareness',
    icon: 'Target',
    recommended_schedule: '0 5 * * *',
    schedule_description_ar: 'يومياً الساعة 5 صباحاً',
    default_config: {
      job_key: 'compute_impact_scores',
      display_name: 'حساب درجات التأثير',
      description: 'حساب درجات تأثير التوعية بناءً على المشاركة والأداء',
      gate_code: 'Gate-D',
      job_type: 'scheduled',
      schedule_cron: '0 5 * * *',
      is_enabled: false,
      config: {
        period_type: 'monthly',
        include_historical: false,
      },
    },
  },

  // Maintenance Templates
  {
    id: 'cleanup_old_logs',
    name_ar: 'تنظيف السجلات القديمة',
    name_en: 'Cleanup Old Logs',
    description_ar: 'حذف السجلات والبيانات القديمة لتحسين الأداء',
    description_en: 'Delete old logs and data to improve performance',
    category: 'maintenance',
    icon: 'Trash2',
    recommended_schedule: '0 2 * * 0',
    schedule_description_ar: 'كل يوم أحد الساعة 2 صباحاً',
    default_config: {
      job_key: 'cleanup_old_logs',
      display_name: 'تنظيف السجلات القديمة',
      description: 'حذف السجلات والبيانات الأقدم من المدة المحددة',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '0 2 * * 0',
      is_enabled: false,
      config: {
        retention_days: 90,
        tables: ['audit_log', 'system_job_runs', 'alert_events'],
        dry_run: false,
      },
    },
  },
  {
    id: 'vacuum_database',
    name_ar: 'صيانة قاعدة البيانات',
    name_en: 'Database Maintenance',
    description_ar: 'تحسين وصيانة قاعدة البيانات للأداء الأمثل',
    description_en: 'Optimize and maintain database for optimal performance',
    category: 'maintenance',
    icon: 'Database',
    recommended_schedule: '0 3 * * 0',
    schedule_description_ar: 'كل يوم أحد الساعة 3 صباحاً',
    default_config: {
      job_key: 'vacuum_database',
      display_name: 'صيانة قاعدة البيانات',
      description: 'تحسين الفهارس وصيانة قاعدة البيانات للأداء الأمثل',
      gate_code: 'Gate-N',
      job_type: 'scheduled',
      schedule_cron: '0 3 * * 0',
      is_enabled: false,
      config: {
        vacuum_full: false,
        analyze: true,
        reindex: false,
      },
    },
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: JobTemplate['category']): JobTemplate[] {
  return JOB_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): JobTemplate | undefined {
  return JOB_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all categories
 */
export function getCategories(): Array<{ value: JobTemplate['category']; label_ar: string; label_en: string }> {
  return [
    { value: 'kpi', label_ar: 'مؤشرات الأداء', label_en: 'KPIs' },
    { value: 'report', label_ar: 'التقارير', label_en: 'Reports' },
    { value: 'alert', label_ar: 'التنبيهات', label_en: 'Alerts' },
    { value: 'awareness', label_ar: 'التوعية', label_en: 'Awareness' },
    { value: 'maintenance', label_ar: 'الصيانة', label_en: 'Maintenance' },
  ];
}
