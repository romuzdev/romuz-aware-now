export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _gate_g_rls_intentions: {
        Row: {
          created_at: string
          notes: string | null
          policy_intent: string
          rbac_roles: string
          table_name: string
        }
        Insert: {
          created_at?: string
          notes?: string | null
          policy_intent: string
          rbac_roles: string
          table_name: string
        }
        Update: {
          created_at?: string
          notes?: string | null
          policy_intent?: string
          rbac_roles?: string
          table_name?: string
        }
        Relationships: []
      }
      _security_documentation: {
        Row: {
          approved: boolean | null
          category: string
          entity_name: string
          entity_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          security_rationale: string
        }
        Insert: {
          approved?: boolean | null
          category: string
          entity_name: string
          entity_type: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_rationale: string
        }
        Update: {
          approved?: boolean | null
          category?: string
          entity_name?: string
          entity_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_rationale?: string
        }
        Relationships: []
      }
      action_plan_dependencies: {
        Row: {
          created_at: string
          created_by: string
          dependency_type: string
          id: string
          is_active: boolean
          lag_days: number | null
          notes_ar: string | null
          source_action_id: string
          target_action_id: string
          tenant_id: string
          updated_at: string
          violation_status: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          dependency_type: string
          id?: string
          is_active?: boolean
          lag_days?: number | null
          notes_ar?: string | null
          source_action_id: string
          target_action_id: string
          tenant_id: string
          updated_at?: string
          violation_status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          id?: string
          is_active?: boolean
          lag_days?: number | null
          notes_ar?: string | null
          source_action_id?: string
          target_action_id?: string
          tenant_id?: string
          updated_at?: string
          violation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_dependencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_milestones: {
        Row: {
          action_id: string
          actual_date: string | null
          completion_pct: number | null
          created_at: string
          created_by: string
          deliverables: Json | null
          description_ar: string | null
          evidence_urls: string[] | null
          id: string
          milestone_type: string
          planned_date: string
          sequence_order: number
          status: string
          tenant_id: string
          title_ar: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          action_id: string
          actual_date?: string | null
          completion_pct?: number | null
          created_at?: string
          created_by: string
          deliverables?: Json | null
          description_ar?: string | null
          evidence_urls?: string[] | null
          id?: string
          milestone_type: string
          planned_date: string
          sequence_order: number
          status?: string
          tenant_id: string
          title_ar: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          action_id?: string
          actual_date?: string | null
          completion_pct?: number | null
          created_at?: string
          created_by?: string
          deliverables?: Json | null
          description_ar?: string | null
          evidence_urls?: string[] | null
          id?: string
          milestone_type?: string
          planned_date?: string
          sequence_order?: number
          status?: string
          tenant_id?: string
          title_ar?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_milestones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_id: string
          created_at: string
          delivery_channels: string[] | null
          delivery_status: string | null
          id: string
          message_ar: string
          metadata: Json | null
          notification_type: string
          recipient_user_ids: string[]
          sent_at: string | null
          severity: string
          tenant_id: string
          title_ar: string
          trigger_condition: Json | null
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_id: string
          created_at?: string
          delivery_channels?: string[] | null
          delivery_status?: string | null
          id?: string
          message_ar: string
          metadata?: Json | null
          notification_type: string
          recipient_user_ids: string[]
          sent_at?: string | null
          severity: string
          tenant_id: string
          title_ar: string
          trigger_condition?: Json | null
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_id?: string
          created_at?: string
          delivery_channels?: string[] | null
          delivery_status?: string | null
          id?: string
          message_ar?: string
          metadata?: Json | null
          notification_type?: string
          recipient_user_ids?: string[]
          sent_at?: string | null
          severity?: string
          tenant_id?: string
          title_ar?: string
          trigger_condition?: Json | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_tracking: {
        Row: {
          action_id: string
          blockers_count: number | null
          created_at: string
          days_elapsed: number | null
          days_remaining: number | null
          health_score: number | null
          id: string
          is_at_risk: boolean | null
          is_on_track: boolean | null
          is_overdue: boolean | null
          issues_summary: Json | null
          metadata: Json | null
          milestones_completed: number
          milestones_total: number
          progress_pct: number
          snapshot_at: string
          tenant_id: string
          velocity_score: number | null
        }
        Insert: {
          action_id: string
          blockers_count?: number | null
          created_at?: string
          days_elapsed?: number | null
          days_remaining?: number | null
          health_score?: number | null
          id?: string
          is_at_risk?: boolean | null
          is_on_track?: boolean | null
          is_overdue?: boolean | null
          issues_summary?: Json | null
          metadata?: Json | null
          milestones_completed?: number
          milestones_total?: number
          progress_pct: number
          snapshot_at?: string
          tenant_id: string
          velocity_score?: number | null
        }
        Update: {
          action_id?: string
          blockers_count?: number | null
          created_at?: string
          days_elapsed?: number | null
          days_remaining?: number | null
          health_score?: number | null
          id?: string
          is_at_risk?: boolean | null
          is_on_track?: boolean | null
          is_overdue?: boolean | null
          issues_summary?: Json | null
          metadata?: Json | null
          milestones_completed?: number
          milestones_total?: number
          progress_pct?: number
          snapshot_at?: string
          tenant_id?: string
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_tracking_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          allowed_domains: string[] | null
          api_rate_limit_per_hour: number | null
          api_rate_limit_per_minute: number | null
          api_unlimited: boolean | null
          backup_settings: Json | null
          blocked_ips: string[] | null
          branding_app_name: string | null
          branding_logo_url: string | null
          branding_primary_color: string | null
          branding_secondary_color: string | null
          branding_support_email: string | null
          branding_support_phone: string | null
          created_at: string
          created_by: string | null
          current_database_size_gb: number | null
          custom_css: string | null
          custom_js: string | null
          email_quota_monthly: number | null
          email_quota_reset_date: string | null
          email_used_current_month: number | null
          feature_flags: Json
          id: string
          ip_whitelist_enabled: boolean | null
          ip_whitelist_ranges: Json | null
          limits: Json
          login_lockout_duration_minutes: number | null
          login_notification_enabled: boolean | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          max_concurrent_users: number | null
          max_database_size_gb: number | null
          max_file_upload_size_mb: number | null
          max_login_attempts: number | null
          mfa_methods: Json | null
          mfa_required: boolean | null
          notification_channels: Json
          password_min_length: number | null
          password_require_lowercase: boolean | null
          password_require_numbers: boolean | null
          password_require_special_chars: boolean | null
          password_require_uppercase: boolean | null
          security_headers: Json | null
          session_absolute_timeout_minutes: number | null
          session_timeout_minutes: number | null
          sla_config: Json
          storage_limit_mb: number | null
          storage_used_mb: number | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          api_rate_limit_per_hour?: number | null
          api_rate_limit_per_minute?: number | null
          api_unlimited?: boolean | null
          backup_settings?: Json | null
          blocked_ips?: string[] | null
          branding_app_name?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          branding_support_email?: string | null
          branding_support_phone?: string | null
          created_at?: string
          created_by?: string | null
          current_database_size_gb?: number | null
          custom_css?: string | null
          custom_js?: string | null
          email_quota_monthly?: number | null
          email_quota_reset_date?: string | null
          email_used_current_month?: number | null
          feature_flags?: Json
          id?: string
          ip_whitelist_enabled?: boolean | null
          ip_whitelist_ranges?: Json | null
          limits?: Json
          login_lockout_duration_minutes?: number | null
          login_notification_enabled?: boolean | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          max_concurrent_users?: number | null
          max_database_size_gb?: number | null
          max_file_upload_size_mb?: number | null
          max_login_attempts?: number | null
          mfa_methods?: Json | null
          mfa_required?: boolean | null
          notification_channels?: Json
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_numbers?: boolean | null
          password_require_special_chars?: boolean | null
          password_require_uppercase?: boolean | null
          security_headers?: Json | null
          session_absolute_timeout_minutes?: number | null
          session_timeout_minutes?: number | null
          sla_config?: Json
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          api_rate_limit_per_hour?: number | null
          api_rate_limit_per_minute?: number | null
          api_unlimited?: boolean | null
          backup_settings?: Json | null
          blocked_ips?: string[] | null
          branding_app_name?: string | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          branding_support_email?: string | null
          branding_support_phone?: string | null
          created_at?: string
          created_by?: string | null
          current_database_size_gb?: number | null
          custom_css?: string | null
          custom_js?: string | null
          email_quota_monthly?: number | null
          email_quota_reset_date?: string | null
          email_used_current_month?: number | null
          feature_flags?: Json
          id?: string
          ip_whitelist_enabled?: boolean | null
          ip_whitelist_ranges?: Json | null
          limits?: Json
          login_lockout_duration_minutes?: number | null
          login_notification_enabled?: boolean | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          max_concurrent_users?: number | null
          max_database_size_gb?: number | null
          max_file_upload_size_mb?: number | null
          max_login_attempts?: number | null
          mfa_methods?: Json | null
          mfa_required?: boolean | null
          notification_channels?: Json
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_numbers?: boolean | null
          password_require_special_chars?: boolean | null
          password_require_uppercase?: boolean | null
          security_headers?: Json | null
          session_absolute_timeout_minutes?: number | null
          session_timeout_minutes?: number | null
          sla_config?: Json
          storage_limit_mb?: number | null
          storage_used_mb?: number | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      agenda_items: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          owner_user_id: string | null
          seq: number | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          owner_user_id?: string | null
          seq?: number | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          owner_user_id?: string | null
          seq?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decision_logs: {
        Row: {
          confidence_score: number | null
          context_id: string | null
          context_type: string
          decided_at: string
          decision_maker: string | null
          decision_type: string
          error_message: string | null
          id: string
          last_backed_up_at: string | null
          model_used: string | null
          outcome: string | null
          outcome_details: Json | null
          processing_time_ms: number | null
          prompt_used: string | null
          recommendation_id: string | null
          response_received: string | null
          tenant_id: string
          tokens_used: number | null
        }
        Insert: {
          confidence_score?: number | null
          context_id?: string | null
          context_type: string
          decided_at?: string
          decision_maker?: string | null
          decision_type: string
          error_message?: string | null
          id?: string
          last_backed_up_at?: string | null
          model_used?: string | null
          outcome?: string | null
          outcome_details?: Json | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          recommendation_id?: string | null
          response_received?: string | null
          tenant_id: string
          tokens_used?: number | null
        }
        Update: {
          confidence_score?: number | null
          context_id?: string | null
          context_type?: string
          decided_at?: string
          decision_maker?: string | null
          decision_type?: string
          error_message?: string | null
          id?: string
          last_backed_up_at?: string | null
          model_used?: string | null
          outcome?: string | null
          outcome_details?: Json | null
          processing_time_ms?: number | null
          prompt_used?: string | null
          recommendation_id?: string | null
          response_received?: string | null
          tenant_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_decision_logs_recommendation"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_decision_logs_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_metrics: {
        Row: {
          acceptance_rate: number | null
          avg_confidence_score: number | null
          avg_feedback_rating: number | null
          common_rejection_reasons: string[] | null
          context_type: string
          created_at: string | null
          feedback_count: number | null
          id: string
          improvement_suggestions: Json | null
          last_backed_up_at: string | null
          model_performance_score: number | null
          period_end: string
          period_start: string
          recommendation_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          avg_confidence_score?: number | null
          avg_feedback_rating?: number | null
          common_rejection_reasons?: string[] | null
          context_type: string
          created_at?: string | null
          feedback_count?: number | null
          id?: string
          improvement_suggestions?: Json | null
          last_backed_up_at?: string | null
          model_performance_score?: number | null
          period_end: string
          period_start: string
          recommendation_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          avg_confidence_score?: number | null
          avg_feedback_rating?: number | null
          common_rejection_reasons?: string[] | null
          context_type?: string
          created_at?: string | null
          feedback_count?: number | null
          id?: string
          improvement_suggestions?: Json | null
          last_backed_up_at?: string | null
          model_performance_score?: number | null
          period_end?: string
          period_start?: string
          recommendation_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_metrics_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ai_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          category: string | null
          confidence_score: number | null
          context_id: string
          context_snapshot: Json | null
          context_type: string
          created_at: string
          description_ar: string
          description_en: string | null
          expires_at: string | null
          feedback_at: string | null
          feedback_by: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          generated_at: string
          id: string
          implementation_notes: string | null
          implemented_at: string | null
          implemented_by: string | null
          last_backed_up_at: string | null
          metadata: Json | null
          model_used: string
          priority: string
          rationale_ar: string | null
          rationale_en: string | null
          rejected_at: string | null
          rejected_by: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          category?: string | null
          confidence_score?: number | null
          context_id: string
          context_snapshot?: Json | null
          context_type: string
          created_at?: string
          description_ar: string
          description_en?: string | null
          expires_at?: string | null
          feedback_at?: string | null
          feedback_by?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          generated_at?: string
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          last_backed_up_at?: string | null
          metadata?: Json | null
          model_used?: string
          priority?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          category?: string | null
          confidence_score?: number | null
          context_id?: string
          context_snapshot?: Json | null
          context_type?: string
          created_at?: string
          description_ar?: string
          description_en?: string | null
          expires_at?: string | null
          feedback_at?: string | null
          feedback_by?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          generated_at?: string
          id?: string
          implementation_notes?: string | null
          implemented_at?: string | null
          implemented_by?: string | null
          last_backed_up_at?: string | null
          metadata?: Json | null
          model_used?: string
          priority?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_recommendations_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_channels: {
        Row: {
          config_json: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string | null
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string | null
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_events: {
        Row: {
          baseline_value: number | null
          created_at: string
          dedupe_key: string
          delta_pct: number | null
          dispatched_at: string | null
          error_message: string | null
          id: string
          metric_value: number
          policy_id: string
          severity: string
          status: string
          target_ref: string | null
          tenant_id: string
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string
          dedupe_key: string
          delta_pct?: number | null
          dispatched_at?: string | null
          error_message?: string | null
          id?: string
          metric_value: number
          policy_id: string
          severity: string
          status?: string
          target_ref?: string | null
          tenant_id: string
        }
        Update: {
          baseline_value?: number | null
          created_at?: string
          dedupe_key?: string
          delta_pct?: number | null
          dispatched_at?: string | null
          error_message?: string | null
          id?: string
          metric_value?: number
          policy_id?: string
          severity?: string
          status?: string
          target_ref?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "alert_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_policies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          lookback_days: number | null
          metric: string
          name: string
          notify_cooldown_minutes: number
          operator: string
          scope: string
          severity: string
          template_code: string | null
          tenant_id: string
          threshold_value: number
          time_window: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          lookback_days?: number | null
          metric: string
          name: string
          notify_cooldown_minutes?: number
          operator: string
          scope: string
          severity: string
          template_code?: string | null
          tenant_id: string
          threshold_value: number
          time_window: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          lookback_days?: number | null
          metric?: string
          name?: string
          notify_cooldown_minutes?: number
          operator?: string
          scope?: string
          severity?: string
          template_code?: string | null
          tenant_id?: string
          threshold_value?: number
          time_window?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_policy_channels: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          policy_id: string
          subject_prefix: string | null
          tenant_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          policy_id: string
          subject_prefix?: string | null
          tenant_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          policy_id?: string
          subject_prefix?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_policy_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "alert_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_policy_channels_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "alert_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_policy_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_policy_targets: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          policy_id: string
          tag: string | null
          tenant_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          policy_id: string
          tag?: string | null
          tenant_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          policy_id?: string
          tag?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "alert_policy_targets_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "alert_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_policy_targets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_templates: {
        Row: {
          body_tpl: string
          code: string
          created_at: string
          created_by: string | null
          id: string
          locale: string
          subject_tpl: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_tpl: string
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string
          subject_tpl: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_tpl?: string
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          locale?: string
          subject_tpl?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          document_id: string | null
          file_size_bytes: number
          filename: string
          id: string
          is_private: boolean
          linked_entity_id: string | null
          linked_module: string | null
          mime_type: string
          notes: string | null
          storage_path: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          document_id?: string | null
          file_size_bytes: number
          filename: string
          id?: string
          is_private?: boolean
          linked_entity_id?: string | null
          linked_module?: string | null
          mime_type: string
          notes?: string | null
          storage_path: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          document_id?: string | null
          file_size_bytes?: number
          filename?: string
          id?: string
          is_private?: boolean
          linked_entity_id?: string | null
          linked_module?: string | null
          mime_type?: string
          notes?: string | null
          storage_path?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings_categories: {
        Row: {
          assigned_to: string | null
          audit_id: string
          category_code: string
          category_name: string
          category_name_ar: string | null
          control_ref: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          evidence_urls: string[] | null
          finding_ar: string
          finding_en: string | null
          framework_ref: string | null
          id: string
          impact_description: string | null
          last_backed_up_at: string | null
          recommendation_ar: string | null
          recommendation_en: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          severity: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_id: string
          category_code: string
          category_name: string
          category_name_ar?: string | null
          control_ref?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          evidence_urls?: string[] | null
          finding_ar: string
          finding_en?: string | null
          framework_ref?: string | null
          id?: string
          impact_description?: string | null
          last_backed_up_at?: string | null
          recommendation_ar?: string | null
          recommendation_en?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_id?: string
          category_code?: string
          category_name?: string
          category_name_ar?: string | null
          control_ref?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          evidence_urls?: string[] | null
          finding_ar?: string
          finding_en?: string | null
          framework_ref?: string | null
          id?: string
          impact_description?: string | null
          last_backed_up_at?: string | null
          recommendation_ar?: string | null
          recommendation_en?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_categories_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "grc_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_backed_up_at: string | null
          payload: Json | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_backed_up_at?: string | null
          payload?: Json | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_backed_up_at?: string | null
          payload?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_workflow_stages: {
        Row: {
          approval_required: boolean | null
          approver_role: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          required_actions: Json | null
          sequence_order: number
          stage_name: string
          stage_name_ar: string | null
          started_at: string | null
          status: string | null
          tenant_id: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          approval_required?: boolean | null
          approver_role?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          required_actions?: Json | null
          sequence_order: number
          stage_name: string
          stage_name_ar?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          approval_required?: boolean | null
          approver_role?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          required_actions?: Json | null
          sequence_order?: number
          stage_name?: string
          stage_name_ar?: string | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_workflow_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "audit_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_workflows: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          audit_id: string
          completed_date: string | null
          created_at: string
          created_by: string | null
          current_stage: string
          due_date: string | null
          id: string
          last_backed_up_at: string | null
          metadata: Json | null
          notes: string | null
          priority: string | null
          progress_pct: number | null
          stage_sequence: number | null
          start_date: string | null
          status: string
          tenant_id: string
          total_stages: number | null
          updated_at: string
          updated_by: string | null
          workflow_type: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          audit_id: string
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          current_stage: string
          due_date?: string | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string | null
          progress_pct?: number | null
          stage_sequence?: number | null
          start_date?: string | null
          status?: string
          tenant_id: string
          total_stages?: number | null
          updated_at?: string
          updated_by?: string | null
          workflow_type: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          audit_id?: string
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string
          due_date?: string | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string | null
          progress_pct?: number | null
          stage_sequence?: number | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          total_stages?: number | null
          updated_at?: string
          updated_by?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_workflows_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "grc_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          created_by: string | null
          description_ar: string | null
          execution_count: number | null
          execution_mode: string | null
          id: string
          is_enabled: boolean | null
          last_executed_at: string | null
          priority: number | null
          retry_config: Json | null
          rule_name: string
          schedule_config: Json | null
          tenant_id: string
          trigger_event_types: string[]
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          execution_count?: number | null
          execution_mode?: string | null
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          retry_config?: Json | null
          rule_name: string
          schedule_config?: Json | null
          tenant_id: string
          trigger_event_types: string[]
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          execution_count?: number | null
          execution_mode?: string | null
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          retry_config?: Json | null
          rule_name?: string
          schedule_config?: Json | null
          tenant_id?: string
          trigger_event_types?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_automation_rules_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      awareness_campaigns: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          end_date: string
          id: string
          is_test: boolean
          last_backed_up_at: string | null
          name: string
          owner_name: string | null
          start_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          end_date: string
          id?: string
          is_test?: boolean
          last_backed_up_at?: string | null
          name: string
          owner_name?: string | null
          start_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          end_date?: string
          id?: string
          is_test?: boolean
          last_backed_up_at?: string | null
          name?: string
          owner_name?: string | null
          start_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      awareness_impact_calibration_cells: {
        Row: {
          actual_bucket: string
          actual_score_max: number | null
          actual_score_min: number | null
          avg_actual_score: number | null
          avg_gap: number | null
          avg_predicted_score: number | null
          calibration_run_id: string
          count_samples: number
          created_at: string
          gap_direction: string | null
          id: string
          is_outlier_bucket: boolean
          notes: string | null
          predicted_bucket: string
          predicted_score_max: number | null
          predicted_score_min: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_bucket: string
          actual_score_max?: number | null
          actual_score_min?: number | null
          avg_actual_score?: number | null
          avg_gap?: number | null
          avg_predicted_score?: number | null
          calibration_run_id: string
          count_samples?: number
          created_at?: string
          gap_direction?: string | null
          id?: string
          is_outlier_bucket?: boolean
          notes?: string | null
          predicted_bucket: string
          predicted_score_max?: number | null
          predicted_score_min?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_bucket?: string
          actual_score_max?: number | null
          actual_score_min?: number | null
          avg_actual_score?: number | null
          avg_gap?: number | null
          avg_predicted_score?: number | null
          calibration_run_id?: string
          count_samples?: number
          created_at?: string
          gap_direction?: string | null
          id?: string
          is_outlier_bucket?: boolean
          notes?: string | null
          predicted_bucket?: string
          predicted_score_max?: number | null
          predicted_score_min?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      awareness_impact_calibration_runs: {
        Row: {
          avg_validation_gap: number | null
          correlation_score: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_validation_gap: number | null
          min_validation_gap: number | null
          model_version: number
          overall_status: string | null
          period_end: string | null
          period_start: string | null
          run_label: string | null
          sample_size: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avg_validation_gap?: number | null
          correlation_score?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_validation_gap?: number | null
          min_validation_gap?: number | null
          model_version?: number
          overall_status?: string | null
          period_end?: string | null
          period_start?: string | null
          run_label?: string | null
          sample_size?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avg_validation_gap?: number | null
          correlation_score?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_validation_gap?: number | null
          min_validation_gap?: number | null
          model_version?: number
          overall_status?: string | null
          period_end?: string | null
          period_start?: string | null
          run_label?: string | null
          sample_size?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      awareness_impact_scores: {
        Row: {
          completion_score: number
          compliance_linkage_score: number
          confidence_level: number | null
          created_at: string
          data_source: string | null
          engagement_score: number
          feedback_quality_score: number
          id: string
          impact_score: number
          notes: string | null
          org_unit_id: string
          period_month: number
          period_year: number
          risk_level: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completion_score?: number
          compliance_linkage_score?: number
          confidence_level?: number | null
          created_at?: string
          data_source?: string | null
          engagement_score?: number
          feedback_quality_score?: number
          id?: string
          impact_score?: number
          notes?: string | null
          org_unit_id: string
          period_month: number
          period_year: number
          risk_level?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completion_score?: number
          compliance_linkage_score?: number
          confidence_level?: number | null
          created_at?: string
          data_source?: string | null
          engagement_score?: number
          feedback_quality_score?: number
          id?: string
          impact_score?: number
          notes?: string | null
          org_unit_id?: string
          period_month?: number
          period_year?: number
          risk_level?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      awareness_impact_validations: {
        Row: {
          actual_behavior_score: number | null
          compliance_alignment_score: number | null
          computed_impact_score: number
          confidence_gap: number | null
          created_at: string
          data_source: string | null
          id: string
          notes: string | null
          org_unit_id: string
          period_month: number
          period_year: number
          risk_incident_count: number | null
          tenant_id: string
          updated_at: string
          validation_gap: number | null
          validation_status: string | null
        }
        Insert: {
          actual_behavior_score?: number | null
          compliance_alignment_score?: number | null
          computed_impact_score: number
          confidence_gap?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          notes?: string | null
          org_unit_id: string
          period_month: number
          period_year: number
          risk_incident_count?: number | null
          tenant_id: string
          updated_at?: string
          validation_gap?: number | null
          validation_status?: string | null
        }
        Update: {
          actual_behavior_score?: number | null
          compliance_alignment_score?: number | null
          computed_impact_score?: number
          confidence_gap?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          notes?: string | null
          org_unit_id?: string
          period_month?: number
          period_year?: number
          risk_incident_count?: number | null
          tenant_id?: string
          updated_at?: string
          validation_gap?: number | null
          validation_status?: string | null
        }
        Relationships: []
      }
      awareness_impact_weight_suggestions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calibration_run_id: string
          created_at: string
          id: string
          rationale: string | null
          source_weight_version: number
          status: string | null
          suggested_completion_weight: number | null
          suggested_compliance_linkage_weight: number | null
          suggested_engagement_weight: number | null
          suggested_feedback_quality_weight: number | null
          suggested_weight_version: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calibration_run_id: string
          created_at?: string
          id?: string
          rationale?: string | null
          source_weight_version: number
          status?: string | null
          suggested_completion_weight?: number | null
          suggested_compliance_linkage_weight?: number | null
          suggested_engagement_weight?: number | null
          suggested_feedback_quality_weight?: number | null
          suggested_weight_version: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calibration_run_id?: string
          created_at?: string
          id?: string
          rationale?: string | null
          source_weight_version?: number
          status?: string | null
          suggested_completion_weight?: number | null
          suggested_compliance_linkage_weight?: number | null
          suggested_engagement_weight?: number | null
          suggested_feedback_quality_weight?: number | null
          suggested_weight_version?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      awareness_impact_weights: {
        Row: {
          completion_weight: number
          compliance_linkage_weight: number
          created_at: string
          engagement_weight: number
          feedback_quality_weight: number
          id: string
          is_active: boolean
          label: string | null
          notes: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          completion_weight?: number
          compliance_linkage_weight?: number
          created_at?: string
          engagement_weight?: number
          feedback_quality_weight?: number
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          completion_weight?: number
          compliance_linkage_weight?: number
          created_at?: string
          engagement_weight?: number
          feedback_quality_weight?: number
          id?: string
          is_active?: boolean
          label?: string | null
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      backup_disaster_recovery_plans: {
        Row: {
          alert_on_failure: boolean | null
          alert_on_test_due: boolean | null
          backup_frequency: string
          backup_types: string[]
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          last_test_date: string | null
          last_test_status: string | null
          metadata: Json | null
          next_test_date: string | null
          notification_emails: string[] | null
          plan_name: string
          priority: string | null
          retention_days: number
          rpo_minutes: number
          rto_minutes: number
          tenant_id: string
          test_frequency: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alert_on_failure?: boolean | null
          alert_on_test_due?: boolean | null
          backup_frequency?: string
          backup_types?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_test_date?: string | null
          last_test_status?: string | null
          metadata?: Json | null
          next_test_date?: string | null
          notification_emails?: string[] | null
          plan_name: string
          priority?: string | null
          retention_days?: number
          rpo_minutes?: number
          rto_minutes?: number
          tenant_id: string
          test_frequency?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alert_on_failure?: boolean | null
          alert_on_test_due?: boolean | null
          backup_frequency?: string
          backup_types?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_test_date?: string | null
          last_test_status?: string | null
          metadata?: Json | null
          next_test_date?: string | null
          notification_emails?: string[] | null
          plan_name?: string
          priority?: string | null
          retention_days?: number
          rpo_minutes?: number
          rto_minutes?: number
          tenant_id?: string
          test_frequency?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_disaster_recovery_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_fk_constraints_cache: {
        Row: {
          constraint_definition: string
          constraint_name: string
          created_at: string | null
          disabled_at: string | null
          id: string
          is_disabled: boolean | null
          re_enabled_at: string | null
          rollback_id: string | null
          table_name: string
          table_schema: string
          tenant_id: string
        }
        Insert: {
          constraint_definition: string
          constraint_name: string
          created_at?: string | null
          disabled_at?: string | null
          id?: string
          is_disabled?: boolean | null
          re_enabled_at?: string | null
          rollback_id?: string | null
          table_name: string
          table_schema: string
          tenant_id: string
        }
        Update: {
          constraint_definition?: string
          constraint_name?: string
          created_at?: string | null
          disabled_at?: string | null
          id?: string
          is_disabled?: boolean | null
          re_enabled_at?: string | null
          rollback_id?: string | null
          table_name?: string
          table_schema?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_fk_constraints_cache_rollback_id_fkey"
            columns: ["rollback_id"]
            isOneToOne: false
            referencedRelation: "backup_pitr_rollback_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_fk_constraints_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_health_monitoring: {
        Row: {
          active_issues: Json | null
          avg_backup_duration_seconds: number | null
          avg_restore_duration_seconds: number | null
          checked_at: string
          created_at: string
          failed_backups: number | null
          health_score: number
          health_status: string
          id: string
          last_backup_at: string | null
          last_successful_restore_at: string | null
          metadata: Json | null
          next_scheduled_backup: string | null
          recommendations: Json | null
          retention_compliance_pct: number | null
          rpo_compliance_pct: number | null
          rto_compliance_pct: number | null
          storage_growth_rate: number | null
          storage_utilization_pct: number | null
          successful_backups: number | null
          tenant_id: string
          total_backups: number | null
          total_storage_bytes: number | null
          warnings: Json | null
        }
        Insert: {
          active_issues?: Json | null
          avg_backup_duration_seconds?: number | null
          avg_restore_duration_seconds?: number | null
          checked_at?: string
          created_at?: string
          failed_backups?: number | null
          health_score?: number
          health_status: string
          id?: string
          last_backup_at?: string | null
          last_successful_restore_at?: string | null
          metadata?: Json | null
          next_scheduled_backup?: string | null
          recommendations?: Json | null
          retention_compliance_pct?: number | null
          rpo_compliance_pct?: number | null
          rto_compliance_pct?: number | null
          storage_growth_rate?: number | null
          storage_utilization_pct?: number | null
          successful_backups?: number | null
          tenant_id: string
          total_backups?: number | null
          total_storage_bytes?: number | null
          warnings?: Json | null
        }
        Update: {
          active_issues?: Json | null
          avg_backup_duration_seconds?: number | null
          avg_restore_duration_seconds?: number | null
          checked_at?: string
          created_at?: string
          failed_backups?: number | null
          health_score?: number
          health_status?: string
          id?: string
          last_backup_at?: string | null
          last_successful_restore_at?: string | null
          metadata?: Json | null
          next_scheduled_backup?: string | null
          recommendations?: Json | null
          retention_compliance_pct?: number | null
          rpo_compliance_pct?: number | null
          rto_compliance_pct?: number | null
          storage_growth_rate?: number | null
          storage_utilization_pct?: number | null
          successful_backups?: number | null
          tenant_id?: string
          total_backups?: number | null
          total_storage_bytes?: number | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_health_monitoring_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_name: string
          backup_size_bytes: number | null
          base_backup_id: string | null
          changes_count: number | null
          completed_at: string | null
          compressed_size_bytes: number | null
          created_at: string
          created_by: string
          description: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          files_count: number | null
          id: string
          is_incremental: boolean | null
          job_type: string
          metadata: Json | null
          parent_backup_id: string | null
          retry_count: number | null
          rows_count: number | null
          started_at: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          tables_count: number | null
          tags: string[] | null
          tenant_id: string
          transaction_log_end: string | null
          transaction_log_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          backup_name: string
          backup_size_bytes?: number | null
          base_backup_id?: string | null
          changes_count?: number | null
          completed_at?: string | null
          compressed_size_bytes?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          files_count?: number | null
          id?: string
          is_incremental?: boolean | null
          job_type: string
          metadata?: Json | null
          parent_backup_id?: string | null
          retry_count?: number | null
          rows_count?: number | null
          started_at?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tables_count?: number | null
          tags?: string[] | null
          tenant_id: string
          transaction_log_end?: string | null
          transaction_log_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          backup_name?: string
          backup_size_bytes?: number | null
          base_backup_id?: string | null
          changes_count?: number | null
          completed_at?: string | null
          compressed_size_bytes?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          files_count?: number | null
          id?: string
          is_incremental?: boolean | null
          job_type?: string
          metadata?: Json | null
          parent_backup_id?: string | null
          retry_count?: number | null
          rows_count?: number | null
          started_at?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tables_count?: number | null
          tags?: string[] | null
          tenant_id?: string
          transaction_log_end?: string | null
          transaction_log_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_base_backup_id_fkey"
            columns: ["base_backup_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_jobs_parent_backup_id_fkey"
            columns: ["parent_backup_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_pitr_rollback_history: {
        Row: {
          current_step: string | null
          duration_seconds: number | null
          error_details: Json | null
          errors_encountered: number | null
          fk_constraints_handled: Json | null
          id: string
          initiated_by: string
          metadata: Json | null
          notes: string | null
          reason: string | null
          restoration_steps: Json | null
          restore_log_id: string | null
          rollback_completed_at: string | null
          rollback_started_at: string
          rows_restored: number | null
          snapshot_id: string
          status: string
          tables_affected: string[] | null
          tables_restored: string[] | null
          tenant_id: string
          transaction_ids: string[] | null
        }
        Insert: {
          current_step?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          errors_encountered?: number | null
          fk_constraints_handled?: Json | null
          id?: string
          initiated_by: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          restoration_steps?: Json | null
          restore_log_id?: string | null
          rollback_completed_at?: string | null
          rollback_started_at?: string
          rows_restored?: number | null
          snapshot_id: string
          status?: string
          tables_affected?: string[] | null
          tables_restored?: string[] | null
          tenant_id: string
          transaction_ids?: string[] | null
        }
        Update: {
          current_step?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          errors_encountered?: number | null
          fk_constraints_handled?: Json | null
          id?: string
          initiated_by?: string
          metadata?: Json | null
          notes?: string | null
          reason?: string | null
          restoration_steps?: Json | null
          restore_log_id?: string | null
          rollback_completed_at?: string | null
          rollback_started_at?: string
          rows_restored?: number | null
          snapshot_id?: string
          status?: string
          tables_affected?: string[] | null
          tables_restored?: string[] | null
          tenant_id?: string
          transaction_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_pitr_rollback_history_restore_log_id_fkey"
            columns: ["restore_log_id"]
            isOneToOne: false
            referencedRelation: "backup_restore_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_pitr_rollback_history_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "backup_pitr_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_pitr_rollback_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_pitr_snapshots: {
        Row: {
          affected_tables: string[]
          checksum: string | null
          compression_used: boolean | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_rolled_back: boolean | null
          metadata: Json | null
          restore_log_id: string | null
          rollback_notes: string | null
          rolled_back_at: string | null
          rolled_back_by: string | null
          snapshot_data: Json
          snapshot_name: string
          snapshot_size_bytes: number | null
          snapshot_type: string
          status: string
          storage_path: string | null
          tenant_id: string
          total_rows_count: number | null
        }
        Insert: {
          affected_tables: string[]
          checksum?: string | null
          compression_used?: boolean | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_rolled_back?: boolean | null
          metadata?: Json | null
          restore_log_id?: string | null
          rollback_notes?: string | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          snapshot_data: Json
          snapshot_name: string
          snapshot_size_bytes?: number | null
          snapshot_type?: string
          status?: string
          storage_path?: string | null
          tenant_id: string
          total_rows_count?: number | null
        }
        Update: {
          affected_tables?: string[]
          checksum?: string | null
          compression_used?: boolean | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_rolled_back?: boolean | null
          metadata?: Json | null
          restore_log_id?: string | null
          rollback_notes?: string | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          snapshot_data?: Json
          snapshot_name?: string
          snapshot_size_bytes?: number | null
          snapshot_type?: string
          status?: string
          storage_path?: string | null
          tenant_id?: string
          total_rows_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_pitr_snapshots_restore_log_id_fkey"
            columns: ["restore_log_id"]
            isOneToOne: false
            referencedRelation: "backup_restore_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_pitr_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_recovery_tests: {
        Row: {
          backup_job_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          data_integrity_check: boolean | null
          dr_plan_id: string | null
          duration_seconds: number | null
          id: string
          issues_details: Json | null
          issues_found: number | null
          metadata: Json | null
          notes: string | null
          performance_metrics: Json | null
          recommendations: string | null
          records_validated: number | null
          report_path: string | null
          started_at: string | null
          tables_tested: string[] | null
          tenant_id: string
          test_log_path: string | null
          test_name: string
          test_status: string
          test_type: string
          validation_results: Json | null
        }
        Insert: {
          backup_job_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          data_integrity_check?: boolean | null
          dr_plan_id?: string | null
          duration_seconds?: number | null
          id?: string
          issues_details?: Json | null
          issues_found?: number | null
          metadata?: Json | null
          notes?: string | null
          performance_metrics?: Json | null
          recommendations?: string | null
          records_validated?: number | null
          report_path?: string | null
          started_at?: string | null
          tables_tested?: string[] | null
          tenant_id: string
          test_log_path?: string | null
          test_name: string
          test_status?: string
          test_type: string
          validation_results?: Json | null
        }
        Update: {
          backup_job_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          data_integrity_check?: boolean | null
          dr_plan_id?: string | null
          duration_seconds?: number | null
          id?: string
          issues_details?: Json | null
          issues_found?: number | null
          metadata?: Json | null
          notes?: string | null
          performance_metrics?: Json | null
          recommendations?: string | null
          records_validated?: number | null
          report_path?: string | null
          started_at?: string | null
          tables_tested?: string[] | null
          tenant_id?: string
          test_log_path?: string | null
          test_name?: string
          test_status?: string
          test_type?: string
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_recovery_tests_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_recovery_tests_dr_plan_id_fkey"
            columns: ["dr_plan_id"]
            isOneToOne: false
            referencedRelation: "backup_disaster_recovery_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_recovery_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_restore_logs: {
        Row: {
          backup_job_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          initiated_by: string
          metadata: Json | null
          notes: string | null
          restore_point: string | null
          restore_type: string
          rollback_at: string | null
          rollback_executed: boolean | null
          rows_restored: number | null
          started_at: string | null
          status: string
          tables_restored: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          backup_job_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          initiated_by: string
          metadata?: Json | null
          notes?: string | null
          restore_point?: string | null
          restore_type: string
          rollback_at?: string | null
          rollback_executed?: boolean | null
          rows_restored?: number | null
          started_at?: string | null
          status?: string
          tables_restored?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          backup_job_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          initiated_by?: string
          metadata?: Json | null
          notes?: string | null
          restore_point?: string | null
          restore_type?: string
          rollback_at?: string | null
          rollback_executed?: boolean | null
          rows_restored?: number | null
          started_at?: string | null
          status?: string
          tables_restored?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_restore_logs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_schedules: {
        Row: {
          created_at: string
          created_by: string
          cron_expression: string
          description: string | null
          id: string
          is_enabled: boolean
          job_type: string
          last_run_at: string | null
          last_run_status: string | null
          max_backups_count: number | null
          metadata: Json | null
          next_run_at: string | null
          notification_emails: string[] | null
          notify_on_failure: boolean | null
          notify_on_success: boolean | null
          retention_days: number | null
          schedule_name: string
          tenant_id: string
          timezone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          cron_expression: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          job_type: string
          last_run_at?: string | null
          last_run_status?: string | null
          max_backups_count?: number | null
          metadata?: Json | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          notify_on_failure?: boolean | null
          notify_on_success?: boolean | null
          retention_days?: number | null
          schedule_name: string
          tenant_id: string
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          cron_expression?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          job_type?: string
          last_run_at?: string | null
          last_run_status?: string | null
          max_backups_count?: number | null
          metadata?: Json | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          notify_on_failure?: boolean | null
          notify_on_success?: boolean | null
          retention_days?: number | null
          schedule_name?: string
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      backup_transaction_logs: {
        Row: {
          backup_job_id: string | null
          changed_at: string
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          operation: string
          record_id: string
          table_name: string
          tenant_id: string
        }
        Insert: {
          backup_job_id?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          record_id: string
          table_name: string
          tenant_id: string
        }
        Update: {
          backup_job_id?: string | null
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          record_id?: string
          table_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_transaction_logs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backup_transaction_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_operation_logs: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          entity_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          module_name: string
          operation_type: string
          started_at: string | null
          status: string
          tenant_id: string
          total_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          entity_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          module_name: string
          operation_type: string
          started_at?: string | null
          status?: string
          tenant_id: string
          total_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          module_name?: string
          operation_type?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          total_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_feedback: {
        Row: {
          campaign_id: string
          comment: string | null
          created_at: string
          id: string
          participant_id: string | null
          score: number | null
          submitted_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          comment?: string | null
          created_at?: string
          id?: string
          participant_id?: string | null
          score?: number | null
          submitted_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          participant_id?: string | null
          score?: number | null
          submitted_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_modules: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          is_required: boolean
          position: number
          tenant_id: string
          title: string
          type: string
          updated_at: string
          url_or_ref: string | null
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          position: number
          tenant_id: string
          title: string
          type: string
          updated_at?: string
          url_or_ref?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          position?: number
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
          url_or_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          employee_ref: string
          id: string
          invited_at: string | null
          is_test: boolean
          notes: string | null
          opened_at: string | null
          score: number | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_ref: string
          id?: string
          invited_at?: string | null
          is_test?: boolean
          notes?: string | null
          opened_at?: string | null
          score?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          employee_ref?: string
          id?: string
          invited_at?: string | null
          is_test?: boolean
          notes?: string | null
          opened_at?: string | null
          score?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_analytics_snapshots: {
        Row: {
          active_members: number
          approved_decisions: number
          avg_attendance_rate: number | null
          avg_completion_days: number | null
          avg_meeting_duration_minutes: number | null
          avg_workflow_duration_days: number | null
          cancelled_meetings: number
          committee_id: string | null
          completed_followups: number
          completed_meetings: number
          completed_workflows: number
          created_at: string
          efficiency_score: number | null
          id: string
          metadata: Json | null
          overdue_followups: number
          pending_decisions: number
          rejected_decisions: number
          snapshot_date: string
          tenant_id: string
          total_decisions: number
          total_followups: number
          total_meetings: number
          total_members: number
          total_workflows: number
          updated_at: string
        }
        Insert: {
          active_members?: number
          approved_decisions?: number
          avg_attendance_rate?: number | null
          avg_completion_days?: number | null
          avg_meeting_duration_minutes?: number | null
          avg_workflow_duration_days?: number | null
          cancelled_meetings?: number
          committee_id?: string | null
          completed_followups?: number
          completed_meetings?: number
          completed_workflows?: number
          created_at?: string
          efficiency_score?: number | null
          id?: string
          metadata?: Json | null
          overdue_followups?: number
          pending_decisions?: number
          rejected_decisions?: number
          snapshot_date: string
          tenant_id: string
          total_decisions?: number
          total_followups?: number
          total_meetings?: number
          total_members?: number
          total_workflows?: number
          updated_at?: string
        }
        Update: {
          active_members?: number
          approved_decisions?: number
          avg_attendance_rate?: number | null
          avg_completion_days?: number | null
          avg_meeting_duration_minutes?: number | null
          avg_workflow_duration_days?: number | null
          cancelled_meetings?: number
          committee_id?: string | null
          completed_followups?: number
          completed_meetings?: number
          completed_workflows?: number
          created_at?: string
          efficiency_score?: number | null
          id?: string
          metadata?: Json | null
          overdue_followups?: number
          pending_decisions?: number
          rejected_decisions?: number
          snapshot_date?: string
          tenant_id?: string
          total_decisions?: number
          total_followups?: number
          total_meetings?: number
          total_members?: number
          total_workflows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_analytics_snapshots_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_members: {
        Row: {
          committee_id: string
          created_at: string
          end_at: string | null
          id: string
          is_voting: boolean
          role: string | null
          start_at: string | null
          user_id: string
        }
        Insert: {
          committee_id: string
          created_at?: string
          end_at?: string | null
          id?: string
          is_voting?: boolean
          role?: string | null
          start_at?: string | null
          user_id: string
        }
        Update: {
          committee_id?: string
          created_at?: string
          end_at?: string | null
          id?: string
          is_voting?: boolean
          role?: string | null
          start_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_members_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          committee_id: string | null
          created_at: string
          delivered_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: Database["public"]["Enums"]["committee_notification_type"]
          priority: string | null
          read_at: string | null
          recipient_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          committee_id?: string | null
          created_at?: string
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: Database["public"]["Enums"]["committee_notification_type"]
          priority?: string | null
          read_at?: string | null
          recipient_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          committee_id?: string | null
          created_at?: string
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: Database["public"]["Enums"]["committee_notification_type"]
          priority?: string | null
          read_at?: string | null
          recipient_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_notifications_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_workflow_stages: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          stage_name: string
          stage_order: number
          stage_type: string
          started_at: string | null
          state: Database["public"]["Enums"]["committee_workflow_state"]
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          stage_name: string
          stage_order: number
          stage_type: string
          started_at?: string | null
          state?: Database["public"]["Enums"]["committee_workflow_state"]
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          stage_name?: string
          stage_order?: number
          stage_type?: string
          started_at?: string | null
          state?: Database["public"]["Enums"]["committee_workflow_state"]
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "committee_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_workflows: {
        Row: {
          cancelled_at: string | null
          committee_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          current_stage_id: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string | null
          started_at: string | null
          state: Database["public"]["Enums"]["committee_workflow_state"]
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
          workflow_type: Database["public"]["Enums"]["committee_workflow_type"]
        }
        Insert: {
          cancelled_at?: string | null
          committee_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_stage_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["committee_workflow_state"]
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          workflow_type: Database["public"]["Enums"]["committee_workflow_type"]
        }
        Update: {
          cancelled_at?: string | null
          committee_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_stage_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["committee_workflow_state"]
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          workflow_type?: Database["public"]["Enums"]["committee_workflow_type"]
        }
        Relationships: [
          {
            foreignKeyName: "committee_workflows_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          charter: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          charter?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          charter?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      content_bookmarks: {
        Row: {
          content_id: string
          created_at: string
          folder_name: string | null
          id: string
          notes: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          folder_name?: string | null
          id?: string
          notes?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          folder_name?: string | null
          id?: string
          notes?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_bookmarks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_bookmarks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          backup_metadata: Json | null
          color: string | null
          content_count: number | null
          created_at: string
          created_by: string
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          last_backup_at: string | null
          metadata: Json | null
          name_ar: string
          name_en: string | null
          parent_category_id: string | null
          tenant_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          backup_metadata?: Json | null
          color?: string | null
          content_count?: number | null
          created_at?: string
          created_by: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_backup_at?: string | null
          metadata?: Json | null
          name_ar: string
          name_en?: string | null
          parent_category_id?: string | null
          tenant_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          backup_metadata?: Json | null
          color?: string | null
          content_count?: number | null
          created_at?: string
          created_by?: string
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          last_backup_at?: string | null
          metadata?: Json | null
          name_ar?: string
          name_en?: string | null
          parent_category_id?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_categories_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          comment_text: string
          content_id: string
          created_at: string
          id: string
          is_approved: boolean
          is_flagged: boolean
          last_backed_up_at: string | null
          like_count: number
          parent_comment_id: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          content_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          last_backed_up_at?: string | null
          like_count?: number
          parent_comment_id?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          content_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          last_backed_up_at?: string | null
          like_count?: number
          parent_comment_id?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          ai_generated: boolean | null
          author_id: string
          backup_metadata: Json | null
          bookmark_count: number
          category: string
          comment_count: number
          content_body_ar: string | null
          content_body_en: string | null
          content_type: string
          created_at: string
          created_by: string
          downloads_count: number | null
          id: string
          last_backup_at: string | null
          likes_count: number | null
          media_url: string | null
          metadata: Json | null
          published_at: string | null
          quality_score: number | null
          reading_time_minutes: number | null
          scheduled_publish_at: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          shares_count: number | null
          status: string
          tags: string[] | null
          template_id: string | null
          tenant_id: string
          thumbnail_url: string | null
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string
          views_count: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_id: string
          backup_metadata?: Json | null
          bookmark_count?: number
          category: string
          comment_count?: number
          content_body_ar?: string | null
          content_body_en?: string | null
          content_type: string
          created_at?: string
          created_by: string
          downloads_count?: number | null
          id?: string
          last_backup_at?: string | null
          likes_count?: number | null
          media_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          quality_score?: number | null
          reading_time_minutes?: number | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shares_count?: number | null
          status?: string
          tags?: string[] | null
          template_id?: string | null
          tenant_id: string
          thumbnail_url?: string | null
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by: string
          views_count?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string
          backup_metadata?: Json | null
          bookmark_count?: number
          category?: string
          comment_count?: number
          content_body_ar?: string | null
          content_body_en?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          downloads_count?: number | null
          id?: string
          last_backup_at?: string | null
          likes_count?: number | null
          media_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          quality_score?: number | null
          reading_time_minutes?: number | null
          scheduled_publish_at?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          shares_count?: number | null
          status?: string
          tags?: string[] | null
          template_id?: string | null
          tenant_id?: string
          thumbnail_url?: string | null
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          ai_prompt_template: string | null
          content_type: string
          created_at: string
          created_by: string
          default_values: Json | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          last_backed_up_at: string | null
          name: string
          structure: Json
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          ai_prompt_template?: string | null
          content_type: string
          created_at?: string
          created_by: string
          default_values?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          last_backed_up_at?: string | null
          name: string
          structure: Json
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          ai_prompt_template?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          default_values?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          last_backed_up_at?: string | null
          name?: string
          structure?: Json
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          last_backed_up_at: string | null
          layout: Json
          name_ar: string
          name_en: string | null
          refresh_interval: number | null
          shared_with_roles: string[] | null
          tenant_id: string
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          last_backed_up_at?: string | null
          layout?: Json
          name_ar: string
          name_en?: string | null
          refresh_interval?: number | null
          shared_with_roles?: string[] | null
          tenant_id: string
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          last_backed_up_at?: string | null
          layout?: Json
          name_ar?: string
          name_en?: string | null
          refresh_interval?: number | null
          shared_with_roles?: string[] | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_kpi_formulas: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          formula: string
          id: string
          is_active: boolean | null
          kpi_name: string
          kpi_name_ar: string | null
          target_value: number | null
          tenant_id: string
          unit: string | null
          updated_at: string | null
          variables: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          formula: string
          id?: string
          is_active?: boolean | null
          kpi_name: string
          kpi_name_ar?: string | null
          target_value?: number | null
          tenant_id: string
          unit?: string | null
          updated_at?: string | null
          variables?: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          formula?: string
          id?: string
          is_active?: boolean | null
          kpi_name?: string
          kpi_name_ar?: string | null
          target_value?: number | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_kpi_formulas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          grid_layout: string | null
          id: string
          is_default: boolean | null
          layout_name: string
          tenant_id: string
          updated_at: string | null
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          grid_layout?: string | null
          id?: string
          is_default?: boolean | null
          layout_name?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          grid_layout?: string | null
          id?: string
          is_default?: boolean | null
          layout_name?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widget_cache: {
        Row: {
          cached_at: string
          cached_data: Json
          expires_at: string
          id: string
          tenant_id: string
          widget_id: string
        }
        Insert: {
          cached_at?: string
          cached_data: Json
          expires_at: string
          id?: string
          tenant_id: string
          widget_id: string
        }
        Update: {
          cached_at?: string
          cached_data?: Json
          expires_at?: string
          id?: string
          tenant_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widget_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_widget_cache_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "dashboard_widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          category: string | null
          config: Json
          created_at: string
          created_by: string | null
          data_source: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          last_backed_up_at: string | null
          name_ar: string
          name_en: string | null
          query_config: Json | null
          refresh_interval: number | null
          tenant_id: string
          updated_at: string
          widget_type: string
        }
        Insert: {
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          data_source: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          last_backed_up_at?: string | null
          name_ar: string
          name_en?: string | null
          query_config?: Json | null
          refresh_interval?: number | null
          tenant_id: string
          updated_at?: string
          widget_type: string
        }
        Update: {
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          data_source?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          last_backed_up_at?: string | null
          name_ar?: string
          name_en?: string | null
          query_config?: Json | null
          refresh_interval?: number | null
          tenant_id?: string
          updated_at?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          agenda_item_id: string | null
          created_at: string
          decided_at: string | null
          id: string
          meeting_id: string
          resolution: string | null
          title: string
          vote_result: string | null
        }
        Insert: {
          agenda_item_id?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          meeting_id: string
          resolution?: string | null
          title: string
          vote_result?: string | null
        }
        Update: {
          agenda_item_id?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          meeting_id?: string
          resolution?: string | null
          title?: string
          vote_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_summary: string | null
          checksum: string | null
          document_id: string
          file_size_bytes: number
          id: string
          is_major: boolean
          mime_type: string
          source_version_id: string | null
          storage_path: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          checksum?: string | null
          document_id: string
          file_size_bytes: number
          id?: string
          is_major?: boolean
          mime_type: string
          source_version_id?: string | null
          storage_path: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          checksum?: string | null
          document_id?: string
          file_size_bytes?: number
          id?: string
          is_major?: boolean
          mime_type?: string
          source_version_id?: string | null
          storage_path?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflow_executions: {
        Row: {
          actions_performed: Json | null
          created_at: string
          document_id: string
          error_details: Json | null
          error_message: string | null
          execution_completed_at: string | null
          execution_duration_ms: number | null
          execution_started_at: string
          execution_status: string
          id: string
          metadata: Json | null
          rule_id: string
          tenant_id: string
          trigger_event: string | null
        }
        Insert: {
          actions_performed?: Json | null
          created_at?: string
          document_id: string
          error_details?: Json | null
          error_message?: string | null
          execution_completed_at?: string | null
          execution_duration_ms?: number | null
          execution_started_at?: string
          execution_status: string
          id?: string
          metadata?: Json | null
          rule_id: string
          tenant_id: string
          trigger_event?: string | null
        }
        Update: {
          actions_performed?: Json | null
          created_at?: string
          document_id?: string
          error_details?: Json | null
          error_message?: string | null
          execution_completed_at?: string | null
          execution_duration_ms?: number | null
          execution_started_at?: string
          execution_status?: string
          id?: string
          metadata?: Json | null
          rule_id?: string
          tenant_id?: string
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_workflow_executions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflow_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "document_workflow_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflow_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflow_rules: {
        Row: {
          actions: Json
          app_code: string | null
          conditions: Json
          created_at: string
          created_by: string
          description: string | null
          execution_count: number
          execution_order: number
          id: string
          is_enabled: boolean
          last_executed_at: string | null
          priority: number
          rule_name: string
          rule_type: string
          schedule_config: Json | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actions?: Json
          app_code?: string | null
          conditions?: Json
          created_at?: string
          created_by: string
          description?: string | null
          execution_count?: number
          execution_order?: number
          id?: string
          is_enabled?: boolean
          last_executed_at?: string | null
          priority?: number
          rule_name: string
          rule_type: string
          schedule_config?: Json | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actions?: Json
          app_code?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          execution_count?: number
          execution_order?: number
          id?: string
          is_enabled?: boolean
          last_executed_at?: string | null
          priority?: number
          rule_name?: string
          rule_type?: string
          schedule_config?: Json | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_workflow_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          app_code: string | null
          created_at: string
          created_by: string
          current_version_id: string | null
          description: string | null
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          last_backed_up_at: string | null
          linked_entity_id: string | null
          linked_module: string | null
          status: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          app_code?: string | null
          created_at?: string
          created_by: string
          current_version_id?: string | null
          description?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          last_backed_up_at?: string | null
          linked_entity_id?: string | null
          linked_module?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          app_code?: string | null
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          description?: string | null
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          last_backed_up_at?: string | null
          linked_entity_id?: string | null
          linked_module?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_profiles: {
        Row: {
          created_at: string
          department: string
          full_name: string
          hire_date: string
          id: string
          manager_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          full_name: string
          hire_date?: string
          id: string
          manager_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          full_name?: string
          hire_date?: string
          id?: string
          manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employee_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_correlation_rules: {
        Row: {
          auto_create_incident: boolean | null
          correlation_logic: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          event_patterns: Json
          id: string
          is_active: boolean | null
          last_backed_up_at: string | null
          last_matched_at: string | null
          match_count: number | null
          rule_name_ar: string
          rule_name_en: string | null
          severity_override: string | null
          tenant_id: string
          threshold_count: number | null
          time_window_minutes: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_create_incident?: boolean | null
          correlation_logic: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          event_patterns?: Json
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_matched_at?: string | null
          match_count?: number | null
          rule_name_ar: string
          rule_name_en?: string | null
          severity_override?: string | null
          tenant_id: string
          threshold_count?: number | null
          time_window_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_create_incident?: boolean | null
          correlation_logic?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          event_patterns?: Json
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_matched_at?: string | null
          match_count?: number | null
          rule_name_ar?: string
          rule_name_en?: string | null
          severity_override?: string | null
          tenant_id?: string
          threshold_count?: number | null
          time_window_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_correlation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_execution_log: {
        Row: {
          error_message: string | null
          event_id: string | null
          executed_at: string | null
          execution_duration_ms: number | null
          execution_result: Json | null
          execution_status: string
          id: string
          rule_id: string | null
          tenant_id: string
        }
        Insert: {
          error_message?: string | null
          event_id?: string | null
          executed_at?: string | null
          execution_duration_ms?: number | null
          execution_result?: Json | null
          execution_status: string
          id?: string
          rule_id?: string | null
          tenant_id: string
        }
        Update: {
          error_message?: string | null
          event_id?: string | null
          executed_at?: string | null
          execution_duration_ms?: number | null
          execution_result?: Json | null
          execution_status?: string
          id?: string
          rule_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_execution_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "system_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_execution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_execution_log_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_subscriptions: {
        Row: {
          callback_url: string | null
          created_at: string | null
          event_types: string[]
          id: string
          is_active: boolean | null
          metadata: Json | null
          subscriber_module: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          callback_url?: string | null
          created_at?: string | null
          event_types: string[]
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subscriber_module: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          callback_url?: string | null
          created_at?: string | null
          event_types?: string[]
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          subscriber_module?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_subscriptions_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_step_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          execution_id: string
          id: string
          input_data: Json | null
          last_backed_up_at: string | null
          output_data: Json | null
          retry_count: number | null
          started_at: string | null
          status: string
          step_id: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          execution_id: string
          id?: string
          input_data?: Json | null
          last_backed_up_at?: string | null
          output_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status: string
          step_id: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          execution_id?: string
          id?: string
          input_data?: Json | null
          last_backed_up_at?: string | null
          output_data?: Json | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          step_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_step_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "soar_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_step_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "playbook_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_step_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          created_by: string | null
          flag_key: string
          id: string
          is_enabled: boolean
          metadata: Json | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          flag_key: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          flag_key?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          decision_id: string
          due_at: string | null
          id: string
          meeting_id: string | null
          owner_user_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          decision_id: string
          due_at?: string | null
          id?: string
          meeting_id?: string | null
          owner_user_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          decision_id?: string
          due_at?: string | null
          id?: string
          meeting_id?: string | null
          owner_user_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_f_bulk_operations: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          operation_data: Json | null
          operation_type: string
          policy_ids: string[]
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type: string
          policy_ids: string[]
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type?: string
          policy_ids?: string[]
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gate_f_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          status?: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      gate_f_policy_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          sort_config: Json | null
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      gate_h_action_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          sort_config: Json | null
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_h_action_views_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_h_bulk_operations: {
        Row: {
          action_ids: string[]
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          operation_data: Json
          operation_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          action_ids: string[]
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data: Json
          operation_type: string
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          action_ids?: string[]
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json
          operation_type?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_h_bulk_operations_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_h_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          status?: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_h_import_history_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_h_json_schemas: {
        Row: {
          created_at: string
          domain: string
          id: number
          name: string
          schema_json: Json
          version: string
        }
        Insert: {
          created_at?: string
          domain?: string
          id?: number
          name: string
          schema_json: Json
          version: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: number
          name?: string
          schema_json?: Json
          version?: string
        }
        Relationships: []
      }
      gate_i_bulk_operations: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          kpi_ids: string[]
          operation_data: Json
          operation_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          kpi_ids: string[]
          operation_data?: Json
          operation_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          kpi_ids?: string[]
          operation_data?: Json
          operation_type?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gate_i_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          status: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      gate_i_kpi_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          sort_config?: Json
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          sort_config?: Json
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      gate_j_bulk_operations: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          impact_score_ids: string[]
          operation_data: Json
          operation_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          impact_score_ids: string[]
          operation_data?: Json
          operation_type: string
          status: string
          tenant_id: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          impact_score_ids?: string[]
          operation_data?: Json
          operation_type?: string
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gate_j_impact_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          sort_config?: Json
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          sort_config?: Json
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      gate_j_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          status: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      gate_k_bulk_operations: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          operation_data: Json | null
          operation_type: string
          status: string
          target_ids: string[]
          tenant_id: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type: string
          status?: string
          target_ids: string[]
          tenant_id: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type?: string
          status?: string
          target_ids?: string[]
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gate_k_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          import_type: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          import_type: string
          status?: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          import_type?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      gate_k_job_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          sort_config: Json | null
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      gate_l_bulk_operations: {
        Row: {
          affected_count: number
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          operation_data: Json | null
          operation_type: string
          status: string
          target_ids: string[]
          tenant_id: string
          user_id: string
        }
        Insert: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type: string
          status?: string
          target_ids: string[]
          tenant_id: string
          user_id: string
        }
        Update: {
          affected_count?: number
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          operation_data?: Json | null
          operation_type?: string
          status?: string
          target_ids?: string[]
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gate_l_import_history: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          format: string
          id: string
          import_type: string
          status: string
          success_count: number
          tenant_id: string
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          format: string
          id?: string
          import_type: string
          status?: string
          success_count?: number
          tenant_id: string
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          format?: string
          id?: string
          import_type?: string
          status?: string
          success_count?: number
          tenant_id?: string
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      gate_l_report_views: {
        Row: {
          created_at: string
          description_ar: string | null
          filters: Json | null
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          sort_config: Json | null
          tenant_id: string
          updated_at: string
          user_id: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id: string
          updated_at?: string
          user_id: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          filters?: Json | null
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          sort_config?: Json | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_name?: string
        }
        Relationships: []
      }
      grc_audit_findings: {
        Row: {
          actual_closure_date: string | null
          audit_id: string
          category: string | null
          cause: string | null
          condition: string | null
          created_at: string
          created_by: string | null
          criteria: string | null
          effect: string | null
          evidence_files: string[] | null
          finding_code: string
          finding_description: string
          finding_description_ar: string | null
          finding_status: string
          finding_title: string
          finding_title_ar: string | null
          finding_type: string
          id: string
          identified_by: string | null
          identified_date: string
          last_backed_up_at: string | null
          linked_action_id: string | null
          linked_control_id: string | null
          linked_gap_id: string | null
          linked_requirement_id: string | null
          linked_risk_id: string | null
          management_response: string | null
          management_response_date: string | null
          notes: string | null
          recommendation: string
          recommendation_ar: string | null
          responsible_user_id: string | null
          severity: string
          tags: string[] | null
          target_closure_date: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          verified_by: string | null
          verified_date: string | null
        }
        Insert: {
          actual_closure_date?: string | null
          audit_id: string
          category?: string | null
          cause?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: string | null
          effect?: string | null
          evidence_files?: string[] | null
          finding_code: string
          finding_description: string
          finding_description_ar?: string | null
          finding_status?: string
          finding_title: string
          finding_title_ar?: string | null
          finding_type: string
          id?: string
          identified_by?: string | null
          identified_date?: string
          last_backed_up_at?: string | null
          linked_action_id?: string | null
          linked_control_id?: string | null
          linked_gap_id?: string | null
          linked_requirement_id?: string | null
          linked_risk_id?: string | null
          management_response?: string | null
          management_response_date?: string | null
          notes?: string | null
          recommendation: string
          recommendation_ar?: string | null
          responsible_user_id?: string | null
          severity: string
          tags?: string[] | null
          target_closure_date?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Update: {
          actual_closure_date?: string | null
          audit_id?: string
          category?: string | null
          cause?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: string | null
          effect?: string | null
          evidence_files?: string[] | null
          finding_code?: string
          finding_description?: string
          finding_description_ar?: string | null
          finding_status?: string
          finding_title?: string
          finding_title_ar?: string | null
          finding_type?: string
          id?: string
          identified_by?: string | null
          identified_date?: string
          last_backed_up_at?: string | null
          linked_action_id?: string | null
          linked_control_id?: string | null
          linked_gap_id?: string | null
          linked_requirement_id?: string | null
          linked_risk_id?: string | null
          management_response?: string | null
          management_response_date?: string | null
          notes?: string | null
          recommendation?: string
          recommendation_ar?: string | null
          responsible_user_id?: string | null
          severity?: string
          tags?: string[] | null
          target_closure_date?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "grc_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_audit_findings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_audits: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          audit_code: string
          audit_description: string | null
          audit_description_ar: string | null
          audit_scope: string
          audit_status: string
          audit_team_ids: string[] | null
          audit_title: string
          audit_title_ar: string | null
          audit_type: string
          created_at: string
          created_by: string | null
          critical_findings: number | null
          final_report_url: string | null
          framework_id: string | null
          high_findings: number | null
          id: string
          last_backed_up_at: string | null
          lead_auditor_id: string | null
          low_findings: number | null
          management_response_date: string | null
          medium_findings: number | null
          notes: string | null
          overall_rating: string | null
          planned_end_date: string
          planned_start_date: string
          report_issued_date: string | null
          tags: string[] | null
          tenant_id: string
          total_findings: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          audit_code: string
          audit_description?: string | null
          audit_description_ar?: string | null
          audit_scope: string
          audit_status?: string
          audit_team_ids?: string[] | null
          audit_title: string
          audit_title_ar?: string | null
          audit_type: string
          created_at?: string
          created_by?: string | null
          critical_findings?: number | null
          final_report_url?: string | null
          framework_id?: string | null
          high_findings?: number | null
          id?: string
          last_backed_up_at?: string | null
          lead_auditor_id?: string | null
          low_findings?: number | null
          management_response_date?: string | null
          medium_findings?: number | null
          notes?: string | null
          overall_rating?: string | null
          planned_end_date: string
          planned_start_date: string
          report_issued_date?: string | null
          tags?: string[] | null
          tenant_id: string
          total_findings?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          audit_code?: string
          audit_description?: string | null
          audit_description_ar?: string | null
          audit_scope?: string
          audit_status?: string
          audit_team_ids?: string[] | null
          audit_title?: string
          audit_title_ar?: string | null
          audit_type?: string
          created_at?: string
          created_by?: string | null
          critical_findings?: number | null
          final_report_url?: string | null
          framework_id?: string | null
          high_findings?: number | null
          id?: string
          last_backed_up_at?: string | null
          lead_auditor_id?: string | null
          low_findings?: number | null
          management_response_date?: string | null
          medium_findings?: number | null
          notes?: string | null
          overall_rating?: string | null
          planned_end_date?: string
          planned_start_date?: string
          report_issued_date?: string | null
          tags?: string[] | null
          tenant_id?: string
          total_findings?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_audits_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "grc_compliance_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_compliance_frameworks: {
        Row: {
          applicability: string | null
          compliant_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          effective_date: string | null
          external_url: string | null
          framework_code: string
          framework_name: string
          framework_name_ar: string | null
          framework_status: string
          framework_type: string
          framework_version: string | null
          id: string
          issuing_authority: string | null
          last_review_date: string | null
          next_review_date: string | null
          non_compliant_count: number | null
          notes: string | null
          overall_compliance_score: number | null
          owner_user_id: string | null
          partial_compliant_count: number | null
          tags: string[] | null
          tenant_id: string
          total_requirements: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          applicability?: string | null
          compliant_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          effective_date?: string | null
          external_url?: string | null
          framework_code: string
          framework_name: string
          framework_name_ar?: string | null
          framework_status?: string
          framework_type: string
          framework_version?: string | null
          id?: string
          issuing_authority?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          non_compliant_count?: number | null
          notes?: string | null
          overall_compliance_score?: number | null
          owner_user_id?: string | null
          partial_compliant_count?: number | null
          tags?: string[] | null
          tenant_id: string
          total_requirements?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          applicability?: string | null
          compliant_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          effective_date?: string | null
          external_url?: string | null
          framework_code?: string
          framework_name?: string
          framework_name_ar?: string | null
          framework_status?: string
          framework_type?: string
          framework_version?: string | null
          id?: string
          issuing_authority?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          non_compliant_count?: number | null
          notes?: string | null
          overall_compliance_score?: number | null
          owner_user_id?: string | null
          partial_compliant_count?: number | null
          tags?: string[] | null
          tenant_id?: string
          total_requirements?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_compliance_frameworks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_compliance_gaps: {
        Row: {
          business_impact: string | null
          closed_by: string | null
          closure_date: string | null
          compliance_risk: string | null
          created_at: string
          created_by: string | null
          current_state: string | null
          estimated_cost: number | null
          estimated_effort_days: number | null
          gap_description: string
          gap_description_ar: string | null
          gap_status: string
          gap_title: string
          gap_title_ar: string | null
          gap_type: string
          id: string
          identified_by: string | null
          identified_date: string
          linked_action_id: string | null
          linked_control_id: string | null
          notes: string | null
          remediation_plan: string | null
          requirement_id: string
          responsible_user_id: string | null
          root_cause: string | null
          severity: string
          tags: string[] | null
          target_closure_date: string | null
          target_state: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_impact?: string | null
          closed_by?: string | null
          closure_date?: string | null
          compliance_risk?: string | null
          created_at?: string
          created_by?: string | null
          current_state?: string | null
          estimated_cost?: number | null
          estimated_effort_days?: number | null
          gap_description: string
          gap_description_ar?: string | null
          gap_status?: string
          gap_title: string
          gap_title_ar?: string | null
          gap_type: string
          id?: string
          identified_by?: string | null
          identified_date?: string
          linked_action_id?: string | null
          linked_control_id?: string | null
          notes?: string | null
          remediation_plan?: string | null
          requirement_id: string
          responsible_user_id?: string | null
          root_cause?: string | null
          severity?: string
          tags?: string[] | null
          target_closure_date?: string | null
          target_state?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_impact?: string | null
          closed_by?: string | null
          closure_date?: string | null
          compliance_risk?: string | null
          created_at?: string
          created_by?: string | null
          current_state?: string | null
          estimated_cost?: number | null
          estimated_effort_days?: number | null
          gap_description?: string
          gap_description_ar?: string | null
          gap_status?: string
          gap_title?: string
          gap_title_ar?: string | null
          gap_type?: string
          id?: string
          identified_by?: string | null
          identified_date?: string
          linked_action_id?: string | null
          linked_control_id?: string | null
          notes?: string | null
          remediation_plan?: string | null
          requirement_id?: string
          responsible_user_id?: string | null
          root_cause?: string | null
          severity?: string
          tags?: string[] | null
          target_closure_date?: string | null
          target_state?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_compliance_gaps_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "grc_compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_compliance_gaps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_compliance_requirements: {
        Row: {
          assessment_method: string | null
          category: string | null
          compliance_status: string
          control_objective: string | null
          created_at: string
          created_by: string | null
          domain: string | null
          evidence_required: string | null
          external_reference: string | null
          framework_id: string
          id: string
          last_assessment_date: string | null
          linked_control_ids: string[] | null
          linked_policy_ids: string[] | null
          linked_risk_ids: string[] | null
          next_assessment_date: string | null
          notes: string | null
          owner_user_id: string | null
          priority: string
          requirement_code: string
          requirement_description: string | null
          requirement_description_ar: string | null
          requirement_title: string
          requirement_title_ar: string | null
          responsible_user_id: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assessment_method?: string | null
          category?: string | null
          compliance_status?: string
          control_objective?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          evidence_required?: string | null
          external_reference?: string | null
          framework_id: string
          id?: string
          last_assessment_date?: string | null
          linked_control_ids?: string[] | null
          linked_policy_ids?: string[] | null
          linked_risk_ids?: string[] | null
          next_assessment_date?: string | null
          notes?: string | null
          owner_user_id?: string | null
          priority?: string
          requirement_code: string
          requirement_description?: string | null
          requirement_description_ar?: string | null
          requirement_title: string
          requirement_title_ar?: string | null
          responsible_user_id?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assessment_method?: string | null
          category?: string | null
          compliance_status?: string
          control_objective?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          evidence_required?: string | null
          external_reference?: string | null
          framework_id?: string
          id?: string
          last_assessment_date?: string | null
          linked_control_ids?: string[] | null
          linked_policy_ids?: string[] | null
          linked_risk_ids?: string[] | null
          next_assessment_date?: string | null
          notes?: string | null
          owner_user_id?: string | null
          priority?: string
          requirement_code?: string
          requirement_description?: string | null
          requirement_description_ar?: string | null
          requirement_title?: string
          requirement_title_ar?: string | null
          responsible_user_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_compliance_requirements_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "grc_compliance_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_compliance_requirements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_control_tests: {
        Row: {
          approved_by: string | null
          control_id: string
          created_at: string
          created_by: string | null
          effectiveness_conclusion: string | null
          evidence_collected: string[] | null
          evidence_file_paths: string[] | null
          exceptions_noted: string | null
          id: string
          population_size: number | null
          remediation_due_date: string | null
          remediation_plan: string | null
          remediation_status: string | null
          requires_remediation: boolean | null
          reviewed_by: string | null
          sample_size: number | null
          tenant_id: string
          test_code: string
          test_date: string
          test_description: string | null
          test_findings: string | null
          test_method: string
          test_result: string
          test_title: string
          test_type: string
          tested_by: string
          testing_period_end: string | null
          testing_period_start: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_by?: string | null
          control_id: string
          created_at?: string
          created_by?: string | null
          effectiveness_conclusion?: string | null
          evidence_collected?: string[] | null
          evidence_file_paths?: string[] | null
          exceptions_noted?: string | null
          id?: string
          population_size?: number | null
          remediation_due_date?: string | null
          remediation_plan?: string | null
          remediation_status?: string | null
          requires_remediation?: boolean | null
          reviewed_by?: string | null
          sample_size?: number | null
          tenant_id: string
          test_code: string
          test_date: string
          test_description?: string | null
          test_findings?: string | null
          test_method: string
          test_result: string
          test_title: string
          test_type: string
          tested_by: string
          testing_period_end?: string | null
          testing_period_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_by?: string | null
          control_id?: string
          created_at?: string
          created_by?: string | null
          effectiveness_conclusion?: string | null
          evidence_collected?: string[] | null
          evidence_file_paths?: string[] | null
          exceptions_noted?: string | null
          id?: string
          population_size?: number | null
          remediation_due_date?: string | null
          remediation_plan?: string | null
          remediation_status?: string | null
          requires_remediation?: boolean | null
          reviewed_by?: string | null
          sample_size?: number | null
          tenant_id?: string
          test_code?: string
          test_date?: string
          test_description?: string | null
          test_findings?: string | null
          test_method?: string
          test_result?: string
          test_title?: string
          test_type?: string
          tested_by?: string
          testing_period_end?: string | null
          testing_period_start?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_control_tests_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "grc_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_controls: {
        Row: {
          control_category: string
          control_code: string
          control_description: string | null
          control_nature: string
          control_objective: string | null
          control_operator_id: string | null
          control_owner_id: string | null
          control_procedures: string | null
          control_status: string
          control_title: string
          control_type: string
          created_at: string
          created_by: string | null
          effectiveness_rating: string | null
          evidence_requirements: string[] | null
          framework_references: Json | null
          id: string
          implementation_date: string | null
          is_active: boolean
          last_backed_up_at: string | null
          last_test_date: string | null
          linked_risk_ids: string[] | null
          maturity_level: string | null
          next_test_date: string | null
          tags: string[] | null
          tenant_id: string
          testing_frequency: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          control_category: string
          control_code: string
          control_description?: string | null
          control_nature: string
          control_objective?: string | null
          control_operator_id?: string | null
          control_owner_id?: string | null
          control_procedures?: string | null
          control_status?: string
          control_title: string
          control_type: string
          created_at?: string
          created_by?: string | null
          effectiveness_rating?: string | null
          evidence_requirements?: string[] | null
          framework_references?: Json | null
          id?: string
          implementation_date?: string | null
          is_active?: boolean
          last_backed_up_at?: string | null
          last_test_date?: string | null
          linked_risk_ids?: string[] | null
          maturity_level?: string | null
          next_test_date?: string | null
          tags?: string[] | null
          tenant_id: string
          testing_frequency: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          control_category?: string
          control_code?: string
          control_description?: string | null
          control_nature?: string
          control_objective?: string | null
          control_operator_id?: string | null
          control_owner_id?: string | null
          control_procedures?: string | null
          control_status?: string
          control_title?: string
          control_type?: string
          created_at?: string
          created_by?: string | null
          effectiveness_rating?: string | null
          evidence_requirements?: string[] | null
          framework_references?: Json | null
          id?: string
          implementation_date?: string | null
          is_active?: boolean
          last_backed_up_at?: string | null
          last_test_date?: string | null
          linked_risk_ids?: string[] | null
          maturity_level?: string | null
          next_test_date?: string | null
          tags?: string[] | null
          tenant_id?: string
          testing_frequency?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      grc_risk_assessments: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          assessed_by: string
          assessment_date: string
          assessment_method: string | null
          assessment_status: string
          assessment_type: string
          assumptions: string | null
          attachments_json: Json | null
          control_effectiveness_rating: string | null
          created_at: string
          created_by: string | null
          id: string
          impact_score: number
          key_findings: string | null
          likelihood_score: number
          limitations: string | null
          notes: string | null
          recommendations: string | null
          reviewed_by: string | null
          risk_id: string
          risk_level: string
          risk_score: number | null
          scenario_description: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          assessed_by: string
          assessment_date?: string
          assessment_method?: string | null
          assessment_status?: string
          assessment_type?: string
          assumptions?: string | null
          attachments_json?: Json | null
          control_effectiveness_rating?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          impact_score: number
          key_findings?: string | null
          likelihood_score: number
          limitations?: string | null
          notes?: string | null
          recommendations?: string | null
          reviewed_by?: string | null
          risk_id: string
          risk_level: string
          risk_score?: number | null
          scenario_description?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          assessed_by?: string
          assessment_date?: string
          assessment_method?: string | null
          assessment_status?: string
          assessment_type?: string
          assumptions?: string | null
          attachments_json?: Json | null
          control_effectiveness_rating?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          impact_score?: number
          key_findings?: string | null
          likelihood_score?: number
          limitations?: string | null
          notes?: string | null
          recommendations?: string | null
          reviewed_by?: string | null
          risk_id?: string
          risk_level?: string
          risk_score?: number | null
          scenario_description?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_risk_assessments_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "grc_risks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_risk_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_risk_treatment_plans: {
        Row: {
          actions_json: Json | null
          actual_cost: number | null
          approval_date: string | null
          approved_by: string | null
          attachments_json: Json | null
          completion_date: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          effectiveness_notes: string | null
          effectiveness_rating: string | null
          estimated_cost: number | null
          id: string
          last_review_date: string | null
          next_review_date: string | null
          notes: string | null
          plan_description: string | null
          plan_owner_id: string
          plan_status: string
          plan_title: string
          priority: string
          progress_percentage: number | null
          resources_required: string | null
          risk_id: string
          start_date: string | null
          target_impact_score: number | null
          target_likelihood_score: number | null
          target_risk_score: number | null
          tenant_id: string
          treatment_strategy: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actions_json?: Json | null
          actual_cost?: number | null
          approval_date?: string | null
          approved_by?: string | null
          attachments_json?: Json | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          effectiveness_notes?: string | null
          effectiveness_rating?: string | null
          estimated_cost?: number | null
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          plan_description?: string | null
          plan_owner_id: string
          plan_status?: string
          plan_title: string
          priority?: string
          progress_percentage?: number | null
          resources_required?: string | null
          risk_id: string
          start_date?: string | null
          target_impact_score?: number | null
          target_likelihood_score?: number | null
          target_risk_score?: number | null
          tenant_id: string
          treatment_strategy: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actions_json?: Json | null
          actual_cost?: number | null
          approval_date?: string | null
          approved_by?: string | null
          attachments_json?: Json | null
          completion_date?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          effectiveness_notes?: string | null
          effectiveness_rating?: string | null
          estimated_cost?: number | null
          id?: string
          last_review_date?: string | null
          next_review_date?: string | null
          notes?: string | null
          plan_description?: string | null
          plan_owner_id?: string
          plan_status?: string
          plan_title?: string
          priority?: string
          progress_percentage?: number | null
          resources_required?: string | null
          risk_id?: string
          start_date?: string | null
          target_impact_score?: number | null
          target_likelihood_score?: number | null
          target_risk_score?: number | null
          tenant_id?: string
          treatment_strategy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_risk_treatment_plans_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "grc_risks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grc_risk_treatment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grc_risks: {
        Row: {
          created_at: string
          created_by: string | null
          current_impact_score: number | null
          current_likelihood_score: number | null
          id: string
          identified_date: string
          impact_level: string
          impact_score: number
          inherent_risk_score: number | null
          is_active: boolean
          last_backed_up_at: string | null
          last_review_date: string | null
          likelihood_level: string
          likelihood_score: number
          next_review_date: string | null
          notes: string | null
          related_objective_ids: string[] | null
          related_policy_ids: string[] | null
          residual_risk_score: number | null
          risk_appetite: string | null
          risk_category: string
          risk_code: string
          risk_description: string | null
          risk_owner_id: string | null
          risk_status: string
          risk_title: string
          risk_type: string
          tags: string[] | null
          tenant_id: string
          treatment_strategy: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_impact_score?: number | null
          current_likelihood_score?: number | null
          id?: string
          identified_date?: string
          impact_level?: string
          impact_score?: number
          inherent_risk_score?: number | null
          is_active?: boolean
          last_backed_up_at?: string | null
          last_review_date?: string | null
          likelihood_level?: string
          likelihood_score?: number
          next_review_date?: string | null
          notes?: string | null
          related_objective_ids?: string[] | null
          related_policy_ids?: string[] | null
          residual_risk_score?: number | null
          risk_appetite?: string | null
          risk_category: string
          risk_code: string
          risk_description?: string | null
          risk_owner_id?: string | null
          risk_status?: string
          risk_title: string
          risk_type?: string
          tags?: string[] | null
          tenant_id: string
          treatment_strategy?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_impact_score?: number | null
          current_likelihood_score?: number | null
          id?: string
          identified_date?: string
          impact_level?: string
          impact_score?: number
          inherent_risk_score?: number | null
          is_active?: boolean
          last_backed_up_at?: string | null
          last_review_date?: string | null
          likelihood_level?: string
          likelihood_score?: number
          next_review_date?: string | null
          notes?: string | null
          related_objective_ids?: string[] | null
          related_policy_ids?: string[] | null
          residual_risk_score?: number | null
          risk_appetite?: string | null
          risk_category?: string
          risk_code?: string
          risk_description?: string | null
          risk_owner_id?: string | null
          risk_status?: string
          risk_title?: string
          risk_type?: string
          tags?: string[] | null
          tenant_id?: string
          treatment_strategy?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grc_risks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      import_export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_type: string
          error_log: Json | null
          failed_rows: number | null
          file_format: string
          file_path: string | null
          file_size_bytes: number | null
          id: string
          job_type: string
          metadata: Json | null
          module_name: string
          options: Json | null
          processed_rows: number | null
          started_at: string | null
          status: string
          success_rows: number | null
          tenant_id: string
          total_rows: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_type: string
          error_log?: Json | null
          failed_rows?: number | null
          file_format?: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          job_type: string
          metadata?: Json | null
          module_name: string
          options?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string
          success_rows?: number | null
          tenant_id: string
          total_rows?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_type?: string
          error_log?: Json | null
          failed_rows?: number | null
          file_format?: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          job_type?: string
          metadata?: Json | null
          module_name?: string
          options?: Json | null
          processed_rows?: number | null
          started_at?: string | null
          status?: string
          success_rows?: number | null
          tenant_id?: string
          total_rows?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incident_external_sources: {
        Row: {
          alert_threshold: string | null
          auto_create_incident: boolean
          created_at: string
          exclude_filters: Json | null
          id: string
          include_filters: Json | null
          integration_id: string
          is_monitored: boolean
          last_event_at: string | null
          source_identifier: string
          source_name: string
          source_type: string
          tenant_id: string
          total_events: number | null
          total_incidents_created: number | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: string | null
          auto_create_incident?: boolean
          created_at?: string
          exclude_filters?: Json | null
          id?: string
          include_filters?: Json | null
          integration_id: string
          is_monitored?: boolean
          last_event_at?: string | null
          source_identifier: string
          source_name: string
          source_type: string
          tenant_id: string
          total_events?: number | null
          total_incidents_created?: number | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: string | null
          auto_create_incident?: boolean
          created_at?: string
          exclude_filters?: Json | null
          id?: string
          include_filters?: Json | null
          integration_id?: string
          is_monitored?: boolean
          last_event_at?: string | null
          source_identifier?: string
          source_name?: string
          source_type?: string
          tenant_id?: string
          total_events?: number | null
          total_incidents_created?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_external_sources_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "incident_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_external_sources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_integrations: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          config_json: Json
          created_at: string
          created_by: string
          field_mapping: Json | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean
          is_verified: boolean
          last_error: string | null
          last_event_at: string | null
          last_sync_at: string | null
          provider: string
          severity_mapping: Json | null
          sync_status: string | null
          tenant_id: string
          total_events_received: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          config_json?: Json
          created_at?: string
          created_by: string
          field_mapping?: Json | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean
          is_verified?: boolean
          last_error?: string | null
          last_event_at?: string | null
          last_sync_at?: string | null
          provider: string
          severity_mapping?: Json | null
          sync_status?: string | null
          tenant_id: string
          total_events_received?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          config_json?: Json
          created_at?: string
          created_by?: string
          field_mapping?: Json | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean
          is_verified?: boolean
          last_error?: string | null
          last_event_at?: string | null
          last_sync_at?: string | null
          provider?: string
          severity_mapping?: Json | null
          sync_status?: string | null
          tenant_id?: string
          total_events_received?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_metrics: {
        Row: {
          calculated_at: string
          id: string
          impact_cost: number | null
          incident_id: string
          met_sla: boolean | null
          response_cost: number | null
          response_plan_followed: boolean | null
          sla_target_minutes: number | null
          sla_variance_minutes: number | null
          steps_completed: number | null
          steps_total: number | null
          tenant_id: string
          time_to_acknowledge_minutes: number | null
          time_to_contain_minutes: number | null
          time_to_detect_minutes: number | null
          time_to_resolve_minutes: number | null
          total_response_time_minutes: number | null
        }
        Insert: {
          calculated_at?: string
          id?: string
          impact_cost?: number | null
          incident_id: string
          met_sla?: boolean | null
          response_cost?: number | null
          response_plan_followed?: boolean | null
          sla_target_minutes?: number | null
          sla_variance_minutes?: number | null
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id: string
          time_to_acknowledge_minutes?: number | null
          time_to_contain_minutes?: number | null
          time_to_detect_minutes?: number | null
          time_to_resolve_minutes?: number | null
          total_response_time_minutes?: number | null
        }
        Update: {
          calculated_at?: string
          id?: string
          impact_cost?: number | null
          incident_id?: string
          met_sla?: boolean | null
          response_cost?: number | null
          response_plan_followed?: boolean | null
          sla_target_minutes?: number | null
          sla_variance_minutes?: number | null
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id?: string
          time_to_acknowledge_minutes?: number | null
          time_to_contain_minutes?: number | null
          time_to_detect_minutes?: number | null
          time_to_resolve_minutes?: number | null
          total_response_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_metrics_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: true
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_response_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          description_ar: string | null
          description_en: string | null
          escalation_rules: Json | null
          id: string
          incident_type: string
          is_active: boolean | null
          is_default: boolean | null
          last_backed_up_at: string | null
          last_reviewed_at: string | null
          next_review_date: string | null
          notification_rules: Json | null
          plan_code: string | null
          plan_name_ar: string
          plan_name_en: string | null
          priority: number | null
          response_steps: Json
          severity_level: string | null
          tenant_id: string
          updated_at: string
          updated_by: string
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          description_ar?: string | null
          description_en?: string | null
          escalation_rules?: Json | null
          id?: string
          incident_type: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_backed_up_at?: string | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          notification_rules?: Json | null
          plan_code?: string | null
          plan_name_ar: string
          plan_name_en?: string | null
          priority?: number | null
          response_steps?: Json
          severity_level?: string | null
          tenant_id: string
          updated_at?: string
          updated_by: string
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          description_ar?: string | null
          description_en?: string | null
          escalation_rules?: Json | null
          id?: string
          incident_type?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_backed_up_at?: string | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          notification_rules?: Json | null
          plan_code?: string | null
          plan_name_ar?: string
          plan_name_en?: string | null
          priority?: number | null
          response_steps?: Json
          severity_level?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_response_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_response_teams: {
        Row: {
          availability_schedule: Json | null
          contact_info: Json | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          last_backed_up_at: string | null
          members: string[] | null
          name_ar: string
          name_en: string
          specializations: string[] | null
          team_lead_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          contact_info?: Json | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          members?: string[] | null
          name_ar: string
          name_en: string
          specializations?: string[] | null
          team_lead_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          contact_info?: Json | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          members?: string[] | null
          name_ar?: string
          name_en?: string
          specializations?: string[] | null
          team_lead_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_response_teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_sla_config: {
        Row: {
          business_hours_only: boolean | null
          created_at: string | null
          escalation_time_minutes: number | null
          id: string
          incident_type: string
          is_active: boolean | null
          resolution_time_hours: number
          response_time_minutes: number
          severity: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          created_at?: string | null
          escalation_time_minutes?: number | null
          id?: string
          incident_type: string
          is_active?: boolean | null
          resolution_time_hours: number
          response_time_minutes: number
          severity: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          created_at?: string | null
          escalation_time_minutes?: number | null
          id?: string
          incident_type?: string
          is_active?: boolean | null
          resolution_time_hours?: number
          response_time_minutes?: number
          severity?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_sla_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_timeline: {
        Row: {
          action_ar: string
          action_en: string | null
          actor_id: string | null
          actor_role: string | null
          attachment_ids: string[] | null
          created_at: string
          details: Json | null
          event_type: string
          evidence_urls: string[] | null
          id: string
          incident_id: string
          new_value: string | null
          previous_value: string | null
          timestamp: string
        }
        Insert: {
          action_ar: string
          action_en?: string | null
          actor_id?: string | null
          actor_role?: string | null
          attachment_ids?: string[] | null
          created_at?: string
          details?: Json | null
          event_type: string
          evidence_urls?: string[] | null
          id?: string
          incident_id: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
        }
        Update: {
          action_ar?: string
          action_en?: string | null
          actor_id?: string | null
          actor_role?: string | null
          attachment_ids?: string[] | null
          created_at?: string
          details?: Json | null
          event_type?: string
          evidence_urls?: string[] | null
          id?: string
          incident_id?: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_timeline_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_timeline_events: {
        Row: {
          actor_id: string
          created_at: string | null
          event_data: Json | null
          event_description_ar: string | null
          event_description_en: string | null
          event_title_ar: string
          event_title_en: string
          event_type: string
          id: string
          incident_id: string
          last_backed_up_at: string | null
          occurred_at: string | null
          tenant_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          event_data?: Json | null
          event_description_ar?: string | null
          event_description_en?: string | null
          event_title_ar: string
          event_title_en: string
          event_type: string
          id?: string
          incident_id: string
          last_backed_up_at?: string | null
          occurred_at?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          event_data?: Json | null
          event_description_ar?: string | null
          event_description_en?: string | null
          event_title_ar?: string
          event_title_en?: string
          event_type?: string
          id?: string
          incident_id?: string
          last_backed_up_at?: string | null
          occurred_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_timeline_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_timeline_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_webhook_logs: {
        Row: {
          action_taken: string | null
          created_at: string
          headers: Json | null
          http_method: string
          id: string
          incident_id: string | null
          integration_id: string | null
          parsed_payload: Json | null
          processed_at: string | null
          processing_duration_ms: number | null
          processing_error: string | null
          processing_status: string
          raw_payload: Json
          received_at: string
          source_identifier: string | null
          tenant_id: string
          webhook_source: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          headers?: Json | null
          http_method: string
          id?: string
          incident_id?: string | null
          integration_id?: string | null
          parsed_payload?: Json | null
          processed_at?: string | null
          processing_duration_ms?: number | null
          processing_error?: string | null
          processing_status?: string
          raw_payload: Json
          received_at?: string
          source_identifier?: string | null
          tenant_id: string
          webhook_source: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          headers?: Json | null
          http_method?: string
          id?: string
          incident_id?: string | null
          integration_id?: string | null
          parsed_payload?: Json | null
          processed_at?: string | null
          processing_duration_ms?: number | null
          processing_error?: string | null
          processing_status?: string
          raw_payload?: Json
          received_at?: string
          source_identifier?: string | null
          tenant_id?: string
          webhook_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_webhook_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_webhook_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "incident_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_webhook_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          created_at: string
          end_at: string | null
          id: string
          objective_id: string
          owner_user_id: string | null
          start_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at?: string | null
          id?: string
          objective_id: string
          owner_user_id?: string | null
          start_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string | null
          id?: string
          objective_id?: string
          owner_user_id?: string | null
          start_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_actions: {
        Row: {
          action_category: string
          action_config: Json
          action_name: string
          created_at: string | null
          created_by: string
          id: string
          input_schema: Json | null
          integration_type: string
          is_active: boolean | null
          last_backed_up_at: string | null
          output_schema: Json | null
          rate_limit_per_minute: number | null
          requires_auth: boolean | null
          tenant_id: string
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          action_category: string
          action_config: Json
          action_name: string
          created_at?: string | null
          created_by: string
          id?: string
          input_schema?: Json | null
          integration_type: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          output_schema?: Json | null
          rate_limit_per_minute?: number | null
          requires_auth?: boolean | null
          tenant_id: string
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          action_category?: string
          action_config?: Json
          action_name?: string
          created_at?: string | null
          created_by?: string
          id?: string
          input_schema?: Json | null
          integration_type?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          output_schema?: Json | null
          rate_limit_per_minute?: number | null
          requires_auth?: boolean | null
          tenant_id?: string
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_api_keys: {
        Row: {
          allowed_ips: string[] | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          key_hash: string
          key_name: string
          key_prefix: string
          last_backed_up_at: string | null
          last_used_at: string | null
          permissions: Json
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allowed_ips?: string[] | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_name: string
          key_prefix: string
          last_backed_up_at?: string | null
          last_used_at?: string | null
          permissions?: Json
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allowed_ips?: string[] | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_backed_up_at?: string | null
          last_used_at?: string | null
          permissions?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connectors: {
        Row: {
          auto_retry_enabled: boolean | null
          average_response_time_ms: number | null
          config: Json
          created_at: string
          created_by: string
          description: string | null
          error_count: number | null
          health_status: string | null
          id: string
          last_backed_up_at: string | null
          last_error_at: string | null
          last_error_message: string | null
          last_health_check: string | null
          last_sync_at: string | null
          max_retries: number | null
          name: string
          rate_limit_remaining: number | null
          rate_limit_reset_at: string | null
          retry_count: number | null
          status: string
          success_count: number | null
          sync_frequency_minutes: number | null
          tenant_id: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_retry_enabled?: boolean | null
          average_response_time_ms?: number | null
          config?: Json
          created_at?: string
          created_by: string
          description?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string
          last_backed_up_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_health_check?: string | null
          last_sync_at?: string | null
          max_retries?: number | null
          name: string
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          retry_count?: number | null
          status?: string
          success_count?: number | null
          sync_frequency_minutes?: number | null
          tenant_id: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_retry_enabled?: boolean | null
          average_response_time_ms?: number | null
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          error_count?: number | null
          health_status?: string | null
          id?: string
          last_backed_up_at?: string | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_health_check?: string | null
          last_sync_at?: string | null
          max_retries?: number | null
          name?: string
          rate_limit_remaining?: number | null
          rate_limit_reset_at?: string | null
          retry_count?: number | null
          status?: string
          success_count?: number | null
          sync_frequency_minutes?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health_logs: {
        Row: {
          checked_at: string
          connector_id: string
          error_details: Json | null
          error_message: string | null
          health_status: string
          id: string
          last_backed_up_at: string | null
          request_payload: Json | null
          response_payload: Json | null
          response_time_ms: number | null
          tenant_id: string
        }
        Insert: {
          checked_at?: string
          connector_id: string
          error_details?: Json | null
          error_message?: string | null
          health_status: string
          id?: string
          last_backed_up_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          tenant_id: string
        }
        Update: {
          checked_at?: string
          connector_id?: string
          error_details?: Json | null
          error_message?: string | null
          health_status?: string
          id?: string
          last_backed_up_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          response_time_ms?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_health_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_health_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          connector_id: string | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          event_category: string | null
          event_type: string
          id: string
          last_backed_up_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          payload: Json | null
          response: Json | null
          retry_count: number | null
          status: string
          tenant_id: string
        }
        Insert: {
          connector_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          event_category?: string | null
          event_type: string
          id?: string
          last_backed_up_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          response?: Json | null
          retry_count?: number | null
          status?: string
          tenant_id: string
        }
        Update: {
          connector_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          event_category?: string | null
          event_type?: string
          id?: string
          last_backed_up_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json | null
          response?: Json | null
          retry_count?: number | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_rate_limits: {
        Row: {
          connector_id: string
          created_at: string
          endpoint: string
          id: string
          limit_remaining: number
          limit_reset_at: string
          limit_total: number
          tenant_id: string
          updated_at: string
          window_start: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          endpoint: string
          id?: string
          limit_remaining: number
          limit_reset_at: string
          limit_total: number
          tenant_id: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          limit_remaining?: number
          limit_reset_at?: string
          limit_total?: number
          tenant_id?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_rate_limits_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_rate_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_jobs: {
        Row: {
          completed_at: string | null
          connector_id: string
          created_at: string
          error_details: Json | null
          error_message: string | null
          id: string
          job_type: string
          last_backed_up_at: string | null
          metadata: Json | null
          next_retry_at: string | null
          records_failed: number | null
          records_synced: number | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          connector_id: string
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          records_failed?: number | null
          records_synced?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          connector_id?: string
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          next_retry_at?: string | null
          records_failed?: number | null
          records_synced?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_jobs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          created_at: string | null
          event_types: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_backed_up_at: string | null
          last_triggered_at: string | null
          retry_count: number | null
          success_count: number | null
          tenant_id: string
          timeout_seconds: number | null
          updated_at: string | null
          url: string
          webhook_name: string
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          created_at?: string | null
          event_types: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_triggered_at?: string | null
          retry_count?: number | null
          success_count?: number | null
          tenant_id: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
          webhook_name: string
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          created_at?: string | null
          event_types?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_triggered_at?: string | null
          retry_count?: number | null
          success_count?: number | null
          tenant_id?: string
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
          webhook_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_webhooks_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_dependencies: {
        Row: {
          created_at: string
          created_by: string | null
          dependency_type: string
          dependent_job_id: string
          id: string
          is_active: boolean
          max_wait_minutes: number | null
          metadata: Json | null
          parent_job_id: string
          retry_on_parent_failure: boolean
          tenant_id: string
          updated_at: string
          updated_by: string | null
          wait_for_success: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          dependent_job_id: string
          id?: string
          is_active?: boolean
          max_wait_minutes?: number | null
          metadata?: Json | null
          parent_job_id: string
          retry_on_parent_failure?: boolean
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          wait_for_success?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dependency_type?: string
          dependent_job_id?: string
          id?: string
          is_active?: boolean
          max_wait_minutes?: number | null
          metadata?: Json | null
          parent_job_id?: string
          retry_on_parent_failure?: boolean
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          wait_for_success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_dependent_job"
            columns: ["dependent_job_id"]
            isOneToOne: false
            referencedRelation: "system_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_parent_job"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "system_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          metadata?: Json | null
          started_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          author_id: string | null
          category: string
          content_ar: string
          content_en: string | null
          created_at: string | null
          document_type: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          is_verified: boolean | null
          keywords: string[] | null
          language: string | null
          last_backed_up_at: string | null
          not_helpful_count: number | null
          published_at: string | null
          related_articles: string[] | null
          search_count: number | null
          source_url: string | null
          summary_ar: string | null
          summary_en: string | null
          superseded_by: string | null
          tags: string[] | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content_ar: string
          content_en?: string | null
          created_at?: string | null
          document_type: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          keywords?: string[] | null
          language?: string | null
          last_backed_up_at?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          related_articles?: string[] | null
          search_count?: number | null
          source_url?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content_ar?: string
          content_en?: string | null
          created_at?: string | null
          document_type?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          keywords?: string[] | null
          language?: string | null
          last_backed_up_at?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          related_articles?: string[] | null
          search_count?: number | null
          source_url?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_document_versions: {
        Row: {
          change_summary: string | null
          changed_by: string
          content_ar: string
          created_at: string
          document_id: string
          id: string
          tenant_id: string
          title_ar: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by: string
          content_ar: string
          created_at?: string
          document_id: string
          id?: string
          tenant_id: string
          title_ar: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string
          content_ar?: string
          created_at?: string
          document_id?: string
          id?: string
          tenant_id?: string
          title_ar?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_document_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          backup_metadata: Json | null
          category: string
          content_ar: string
          content_en: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          document_type: string
          embedding_vector: string | null
          helpful_count: number | null
          id: string
          is_deleted: boolean | null
          is_verified: boolean | null
          keywords: string[] | null
          metadata: Json | null
          source_document_id: string | null
          source_url: string | null
          summary_ar: string | null
          summary_en: string | null
          tags: string[] | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          unhelpful_count: number | null
          updated_at: string
          updated_by: string | null
          usefulness_score: number | null
          verified_at: string | null
          verified_by: string | null
          views_count: number | null
        }
        Insert: {
          backup_metadata?: Json | null
          category: string
          content_ar: string
          content_en?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          document_type: string
          embedding_vector?: string | null
          helpful_count?: number | null
          id?: string
          is_deleted?: boolean | null
          is_verified?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          source_document_id?: string | null
          source_url?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          tags?: string[] | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          updated_by?: string | null
          usefulness_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
          views_count?: number | null
        }
        Update: {
          backup_metadata?: Json | null
          category?: string
          content_ar?: string
          content_en?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          document_type?: string
          embedding_vector?: string | null
          helpful_count?: number | null
          id?: string
          is_deleted?: boolean | null
          is_verified?: boolean | null
          keywords?: string[] | null
          metadata?: Json | null
          source_document_id?: string | null
          source_url?: string | null
          summary_ar?: string | null
          summary_en?: string | null
          tags?: string[] | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          unhelpful_count?: number | null
          updated_at?: string
          updated_by?: string | null
          usefulness_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_embeddings: {
        Row: {
          article_id: string
          chunk_index: number
          chunk_text: string
          chunk_tokens: number | null
          created_at: string | null
          embedding: string | null
          id: string
          language: string | null
          last_backed_up_at: string | null
          section_title: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          article_id: string
          chunk_index: number
          chunk_text: string
          chunk_tokens?: number | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          language?: string | null
          last_backed_up_at?: string | null
          section_title?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          chunk_index?: number
          chunk_text?: string
          chunk_tokens?: number | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          language?: string | null
          last_backed_up_at?: string | null
          section_title?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_embeddings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_qa: {
        Row: {
          answer_ar: string
          answer_en: string | null
          asked_by: string | null
          backup_metadata: Json | null
          confidence_score: number | null
          created_at: string
          feedback_at: string | null
          feedback_comment: string | null
          id: string
          metadata: Json | null
          model_used: string | null
          question_ar: string
          question_embedding: string | null
          question_en: string | null
          source_documents: string[] | null
          tenant_id: string
          views_count: number | null
          was_helpful: boolean | null
        }
        Insert: {
          answer_ar: string
          answer_en?: string | null
          asked_by?: string | null
          backup_metadata?: Json | null
          confidence_score?: number | null
          created_at?: string
          feedback_at?: string | null
          feedback_comment?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          question_ar: string
          question_embedding?: string | null
          question_en?: string | null
          source_documents?: string[] | null
          tenant_id: string
          views_count?: number | null
          was_helpful?: boolean | null
        }
        Update: {
          answer_ar?: string
          answer_en?: string | null
          asked_by?: string | null
          backup_metadata?: Json | null
          confidence_score?: number | null
          created_at?: string
          feedback_at?: string | null
          feedback_comment?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          question_ar?: string
          question_embedding?: string | null
          question_en?: string | null
          source_documents?: string[] | null
          tenant_id?: string
          views_count?: number | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_qa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_queries: {
        Row: {
          answer_text: string | null
          confidence_score: number | null
          created_at: string | null
          feedback_at: string | null
          feedback_comment: string | null
          id: string
          last_backed_up_at: string | null
          model_used: string | null
          query_language: string | null
          query_text: string
          response_time_ms: number | null
          source_articles: string[] | null
          tenant_id: string
          user_id: string | null
          was_helpful: boolean | null
        }
        Insert: {
          answer_text?: string | null
          confidence_score?: number | null
          created_at?: string | null
          feedback_at?: string | null
          feedback_comment?: string | null
          id?: string
          last_backed_up_at?: string | null
          model_used?: string | null
          query_language?: string | null
          query_text: string
          response_time_ms?: number | null
          source_articles?: string[] | null
          tenant_id: string
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          answer_text?: string | null
          confidence_score?: number | null
          created_at?: string | null
          feedback_at?: string | null
          feedback_comment?: string | null
          id?: string
          last_backed_up_at?: string | null
          model_used?: string | null
          query_language?: string | null
          query_text?: string
          response_time_ms?: number | null
          source_articles?: string[] | null
          tenant_id?: string
          user_id?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_queries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_relations: {
        Row: {
          backup_metadata: Json | null
          created_at: string
          created_by: string
          id: string
          is_auto_detected: boolean | null
          metadata: Json | null
          relation_type: string
          source_doc_id: string
          strength: number | null
          target_doc_id: string
          tenant_id: string
        }
        Insert: {
          backup_metadata?: Json | null
          created_at?: string
          created_by: string
          id?: string
          is_auto_detected?: boolean | null
          metadata?: Json | null
          relation_type: string
          source_doc_id: string
          strength?: number | null
          target_doc_id: string
          tenant_id: string
        }
        Update: {
          backup_metadata?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          is_auto_detected?: boolean | null
          metadata?: Json | null
          relation_type?: string
          source_doc_id?: string
          strength?: number | null
          target_doc_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_relations_source_doc_id_fkey"
            columns: ["source_doc_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_relations_target_doc_id_fkey"
            columns: ["target_doc_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_relations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          current_value: number | null
          id: string
          is_acknowledged: boolean | null
          kpi_key: string
          kpi_name: string
          message: string
          module: string
          severity: string
          tenant_id: string
          threshold_value: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_acknowledged?: boolean | null
          kpi_key: string
          kpi_name: string
          message: string
          module: string
          severity: string
          tenant_id: string
          threshold_value?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_acknowledged?: boolean | null
          kpi_key?: string
          kpi_name?: string
          message?: string
          module?: string
          severity?: string
          tenant_id?: string
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_alerts_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_catalog: {
        Row: {
          aggregation: string | null
          created_at: string
          created_by: string | null
          default_trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          description_ar: string | null
          description_en: string | null
          dimensions: string[] | null
          effective_from: string | null
          effective_to: string | null
          formula: string | null
          freshness_target: string | null
          grain: string
          id: string
          is_active: boolean
          kpi_key: string
          name_ar: string
          name_en: string | null
          notes: string | null
          owner_role: string | null
          quality_checks: Json | null
          source_system: string | null
          source_table: string | null
          tenant_id: string | null
          unit: string | null
          updated_at: string
          updated_by: string | null
          version: string | null
        }
        Insert: {
          aggregation?: string | null
          created_at?: string
          created_by?: string | null
          default_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          description_ar?: string | null
          description_en?: string | null
          dimensions?: string[] | null
          effective_from?: string | null
          effective_to?: string | null
          formula?: string | null
          freshness_target?: string | null
          grain: string
          id?: string
          is_active?: boolean
          kpi_key: string
          name_ar: string
          name_en?: string | null
          notes?: string | null
          owner_role?: string | null
          quality_checks?: Json | null
          source_system?: string | null
          source_table?: string | null
          tenant_id?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          aggregation?: string | null
          created_at?: string
          created_by?: string | null
          default_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          description_ar?: string | null
          description_en?: string | null
          dimensions?: string[] | null
          effective_from?: string | null
          effective_to?: string | null
          formula?: string | null
          freshness_target?: string | null
          grain?: string
          id?: string
          is_active?: boolean
          kpi_key?: string
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          owner_role?: string | null
          quality_checks?: Json | null
          source_system?: string | null
          source_table?: string | null
          tenant_id?: string | null
          unit?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string | null
        }
        Relationships: []
      }
      kpi_readings: {
        Row: {
          actual_value: number
          collected_at: string
          created_at: string
          id: string
          kpi_id: string
          period: string
          source: string | null
        }
        Insert: {
          actual_value: number
          collected_at?: string
          created_at?: string
          id?: string
          kpi_id: string
          period: string
          source?: string | null
        }
        Update: {
          actual_value?: number
          collected_at?: string
          created_at?: string
          id?: string
          kpi_id?: string
          period?: string
          source?: string | null
        }
        Relationships: []
      }
      kpi_series: {
        Row: {
          anomaly_flag: boolean | null
          anomaly_severity: string | null
          created_at: string
          data_quality_score: number | null
          dim_audience_segment: string | null
          dim_campaign_type: string | null
          dim_channel: string | null
          dim_content_theme: string | null
          dim_department: string | null
          dim_device_type: string | null
          dim_location: string | null
          dim_user_role: string | null
          id: number
          kpi_key: string
          meta: Json | null
          sample_size: number | null
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          ts: string
          value: number | null
        }
        Insert: {
          anomaly_flag?: boolean | null
          anomaly_severity?: string | null
          created_at?: string
          data_quality_score?: number | null
          dim_audience_segment?: string | null
          dim_campaign_type?: string | null
          dim_channel?: string | null
          dim_content_theme?: string | null
          dim_department?: string | null
          dim_device_type?: string | null
          dim_location?: string | null
          dim_user_role?: string | null
          id?: number
          kpi_key: string
          meta?: Json | null
          sample_size?: number | null
          tenant_id: string
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          ts: string
          value?: number | null
        }
        Update: {
          anomaly_flag?: boolean | null
          anomaly_severity?: string | null
          created_at?: string
          data_quality_score?: number | null
          dim_audience_segment?: string | null
          dim_campaign_type?: string | null
          dim_channel?: string | null
          dim_content_theme?: string | null
          dim_department?: string | null
          dim_device_type?: string | null
          dim_location?: string | null
          dim_user_role?: string | null
          id?: number
          kpi_key?: string
          meta?: Json | null
          sample_size?: number | null
          tenant_id?: string
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          ts?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          kpi_key: string
          kpi_name: string
          metadata: Json | null
          module: string
          snapshot_date: string
          status: string | null
          target_value: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          kpi_key: string
          kpi_name: string
          metadata?: Json | null
          module: string
          snapshot_date: string
          status?: string | null
          target_value?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          kpi_key?: string
          kpi_name?: string
          metadata?: Json | null
          module?: string
          snapshot_date?: string
          status?: string | null
          target_value?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_snapshots_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_targets: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          period: string
          target_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          period: string
          target_value: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          period?: string
          target_value?: number
        }
        Relationships: []
      }
      kpi_thresholds: {
        Row: {
          alert_delta: number | null
          control_lower: number | null
          control_upper: number | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          kpi_key: string
          min_sample: number | null
          notes: string | null
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at: string
          updated_by: string | null
          warn_delta: number | null
          zscore_alert: number | null
        }
        Insert: {
          alert_delta?: number | null
          control_lower?: number | null
          control_upper?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          kpi_key: string
          min_sample?: number | null
          notes?: string | null
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
          updated_by?: string | null
          warn_delta?: number | null
          zscore_alert?: number | null
        }
        Update: {
          alert_delta?: number | null
          control_lower?: number | null
          control_upper?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          kpi_key?: string
          min_sample?: number | null
          notes?: string | null
          tenant_id?: string
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
          updated_by?: string | null
          warn_delta?: number | null
          zscore_alert?: number | null
        }
        Relationships: []
      }
      kpis: {
        Row: {
          code: string
          created_at: string
          direction: string
          id: string
          objective_id: string
          tenant_id: string
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          direction: string
          id?: string
          objective_id: string
          tenant_id: string
          title: string
          unit: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          direction?: string
          id?: string
          objective_id?: string
          tenant_id?: string
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      lms_assessments: {
        Row: {
          assessment_type: string
          available_from: string | null
          available_until: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_required: boolean
          max_attempts: number | null
          metadata: Json | null
          name: string
          passing_score: number
          position: number
          randomize_questions: boolean
          show_correct_answers: boolean
          tenant_id: string
          time_limit_minutes: number | null
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          available_from?: string | null
          available_until?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          max_attempts?: number | null
          metadata?: Json | null
          name: string
          passing_score?: number
          position?: number
          randomize_questions?: boolean
          show_correct_answers?: boolean
          tenant_id: string
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          available_from?: string | null
          available_until?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          max_attempts?: number | null
          metadata?: Json | null
          name?: string
          passing_score?: number
          position?: number
          randomize_questions?: boolean
          show_correct_answers?: boolean
          tenant_id?: string
          time_limit_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lms_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_certificates: {
        Row: {
          certificate_data: Json | null
          certificate_number: string
          course_id: string
          created_at: string
          enrollment_id: string
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string
          metadata: Json | null
          template_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          certificate_data?: Json | null
          certificate_number: string
          course_id: string
          created_at?: string
          enrollment_id: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          template_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          certificate_data?: Json | null
          certificate_number?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string
          metadata?: Json | null
          template_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "lms_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_user_progress"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "lms_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_course_lessons: {
        Row: {
          content: string | null
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string
          estimated_minutes: number | null
          id: string
          is_required: boolean
          metadata: Json | null
          module_id: string
          name: string
          position: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          content_url?: string | null
          course_id: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          metadata?: Json | null
          module_id: string
          name: string
          position?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          metadata?: Json | null
          module_id?: string
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lms_course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_lessons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_required: boolean
          metadata: Json | null
          name: string
          position: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          metadata?: Json | null
          name: string
          position?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_required?: boolean
          metadata?: Json | null
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_course_resources: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          is_downloadable: boolean
          mime_type: string | null
          module_id: string | null
          name: string
          position: number
          resource_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean
          mime_type?: string | null
          module_id?: string | null
          name: string
          position?: number
          resource_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean
          mime_type?: string | null
          module_id?: string | null
          name?: string
          position?: number
          resource_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "lms_course_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_course_resources_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_courses: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_hours: number
          id: string
          instructor_id: string | null
          level: string
          metadata: Json | null
          name: string
          status: string
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          instructor_id?: string | null
          level?: string
          metadata?: Json | null
          name: string
          status?: string
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_hours?: number
          id?: string
          instructor_id?: string | null
          level?: string
          metadata?: Json | null
          name?: string
          status?: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lms_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          due_date: string | null
          enrolled_at: string
          enrolled_by: string | null
          enrollment_type: string
          id: string
          metadata: Json | null
          progress_percentage: number
          score: number | null
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          due_date?: string | null
          enrolled_at?: string
          enrolled_by?: string | null
          enrollment_type?: string
          id?: string
          metadata?: Json | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          due_date?: string | null
          enrolled_at?: string
          enrolled_by?: string | null
          enrollment_type?: string
          id?: string
          metadata?: Json | null
          progress_percentage?: number
          score?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          last_accessed_at: string | null
          lesson_id: string
          metadata: Json | null
          status: string
          tenant_id: string
          time_spent_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          last_accessed_at?: string | null
          lesson_id: string
          metadata?: Json | null
          status?: string
          tenant_id: string
          time_spent_seconds?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          last_accessed_at?: string | null
          lesson_id?: string
          metadata?: Json | null
          status?: string
          tenant_id?: string
          time_spent_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "lms_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_user_progress"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "lms_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lms_course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      md_saved_views: {
        Row: {
          created_at: string
          description_ar: string | null
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          owner_id: string
          sort_config: Json
          tenant_id: string
          updated_at: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          entity_type: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          owner_id: string
          sort_config?: Json
          tenant_id: string
          updated_at?: string
          view_name: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          entity_type?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          owner_id?: string
          sort_config?: Json
          tenant_id?: string
          updated_at?: string
          view_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "md_saved_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          committee_id: string
          created_at: string
          created_by: string
          id: string
          minutes_url: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          committee_id: string
          created_at?: string
          created_by: string
          id?: string
          minutes_url?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          committee_id?: string
          created_at?: string
          created_by?: string
          id?: string
          minutes_url?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      mitre_attack_mapping: {
        Row: {
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          data_sources: string[] | null
          detection_method: string | null
          entity_id: string
          entity_type: string
          evidence_description: string | null
          id: string
          is_confirmed: boolean | null
          last_backed_up_at: string | null
          mapped_at: string
          mapped_by: string | null
          mitre_matrix: string | null
          mitre_subtechnique_id: string | null
          mitre_subtechnique_name: string | null
          mitre_tactic_id: string
          mitre_tactic_name: string
          mitre_technique_id: string
          mitre_technique_name: string
          platforms: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          data_sources?: string[] | null
          detection_method?: string | null
          entity_id: string
          entity_type: string
          evidence_description?: string | null
          id?: string
          is_confirmed?: boolean | null
          last_backed_up_at?: string | null
          mapped_at?: string
          mapped_by?: string | null
          mitre_matrix?: string | null
          mitre_subtechnique_id?: string | null
          mitre_subtechnique_name?: string | null
          mitre_tactic_id: string
          mitre_tactic_name: string
          mitre_technique_id: string
          mitre_technique_name: string
          platforms?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          data_sources?: string[] | null
          detection_method?: string | null
          entity_id?: string
          entity_type?: string
          evidence_description?: string | null
          id?: string
          is_confirmed?: boolean | null
          last_backed_up_at?: string | null
          mapped_at?: string
          mapped_by?: string | null
          mitre_matrix?: string | null
          mitre_subtechnique_id?: string | null
          mitre_subtechnique_name?: string | null
          mitre_tactic_id?: string
          mitre_tactic_name?: string
          mitre_technique_id?: string
          mitre_technique_name?: string
          platforms?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitre_attack_mapping_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      model_performance_metrics: {
        Row: {
          accuracy: number | null
          backup_metadata: Json | null
          correct_predictions: number
          created_at: string
          created_by: string
          errors_by_range: Json | null
          evaluation_date: string
          evaluation_status: string
          f1_score: number | null
          id: string
          mae: number | null
          model_id: string
          notes: string | null
          period_end: string
          period_start: string
          precision: number | null
          predictions_by_category: Json | null
          recall: number | null
          rmse: number | null
          tenant_id: string
          total_predictions: number
          validated_predictions: number
        }
        Insert: {
          accuracy?: number | null
          backup_metadata?: Json | null
          correct_predictions?: number
          created_at?: string
          created_by: string
          errors_by_range?: Json | null
          evaluation_date?: string
          evaluation_status?: string
          f1_score?: number | null
          id?: string
          mae?: number | null
          model_id: string
          notes?: string | null
          period_end: string
          period_start: string
          precision?: number | null
          predictions_by_category?: Json | null
          recall?: number | null
          rmse?: number | null
          tenant_id: string
          total_predictions?: number
          validated_predictions?: number
        }
        Update: {
          accuracy?: number | null
          backup_metadata?: Json | null
          correct_predictions?: number
          created_at?: string
          created_by?: string
          errors_by_range?: Json | null
          evaluation_date?: string
          evaluation_status?: string
          f1_score?: number | null
          id?: string
          mae?: number | null
          model_id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          precision?: number | null
          predictions_by_category?: Json | null
          recall?: number | null
          rmse?: number | null
          tenant_id?: string
          total_predictions?: number
          validated_predictions?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_performance_metrics_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "prediction_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_performance_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      model_training_history: {
        Row: {
          accuracy_metrics: Json
          created_at: string | null
          dataset_size: number
          id: string
          last_backed_up_at: string | null
          model_id: string
          model_parameters: Json
          notes: string | null
          tenant_id: string
          trained_by: string
          training_date: string | null
          training_duration_seconds: number | null
          validation_results: Json | null
        }
        Insert: {
          accuracy_metrics: Json
          created_at?: string | null
          dataset_size: number
          id?: string
          last_backed_up_at?: string | null
          model_id: string
          model_parameters: Json
          notes?: string | null
          tenant_id: string
          trained_by: string
          training_date?: string | null
          training_duration_seconds?: number | null
          validation_results?: Json | null
        }
        Update: {
          accuracy_metrics?: Json
          created_at?: string | null
          dataset_size?: number
          id?: string
          last_backed_up_at?: string | null
          model_id?: string
          model_parameters?: Json
          notes?: string | null
          tenant_id?: string
          trained_by?: string
          training_date?: string | null
          training_duration_seconds?: number | null
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "model_training_history_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "prediction_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_training_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          id: string
          last_visit_at: string | null
          module_id: string
          participant_id: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_visit_at?: string | null
          module_id: string
          participant_id: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_visit_at?: string | null
          module_id?: string
          participant_id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "campaign_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "campaign_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quizzes: {
        Row: {
          created_at: string
          id: string
          module_id: string
          pass_score: number
          tenant_id: string
          time_limit_secs: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          pass_score?: number
          tenant_id: string
          time_limit_secs?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          pass_score?: number
          tenant_id?: string
          time_limit_secs?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "campaign_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          meta: Json | null
          participant_id: string
          sent_at: string
          status: string
          template_key: string
          tenant_id: string
          transport: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          meta?: Json | null
          participant_id: string
          sent_at?: string
          status: string
          template_key: string
          tenant_id: string
          transport: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          meta?: Json | null
          participant_id?: string
          sent_at?: string
          status?: string
          template_key?: string
          tenant_id?: string
          transport?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          last_error: string | null
          participant_id: string
          scheduled_at: string
          status: string
          template_key: string
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          participant_id: string
          scheduled_at?: string
          status?: string
          template_key: string
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          participant_id?: string
          scheduled_at?: string
          status?: string
          template_key?: string
          tenant_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_type: string
          created_at: string | null
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          payload: Json | null
          read_at: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          payload?: Json | null
          read_at?: string | null
          tenant_id: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          payload?: Json | null
          read_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      objectives: {
        Row: {
          code: string
          created_at: string
          horizon: string | null
          id: string
          owner_user_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          horizon?: string | null
          id?: string
          owner_user_id?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          horizon?: string | null
          id?: string
          owner_user_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          last_backed_up_at: string | null
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string | null
          status: string | null
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_steps: {
        Row: {
          action_config: Json
          condition_logic: Json | null
          created_at: string | null
          created_by: string
          id: string
          is_critical: boolean | null
          last_backed_up_at: string | null
          next_step_on_failure: string | null
          next_step_on_success: string | null
          playbook_id: string
          retry_on_failure: boolean | null
          step_description_ar: string | null
          step_name: string
          step_order: number
          step_type: string
          tenant_id: string
          timeout_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          action_config: Json
          condition_logic?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          is_critical?: boolean | null
          last_backed_up_at?: string | null
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          playbook_id: string
          retry_on_failure?: boolean | null
          step_description_ar?: string | null
          step_name: string
          step_order: number
          step_type: string
          tenant_id: string
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          condition_logic?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_critical?: boolean | null
          last_backed_up_at?: string | null
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          playbook_id?: string
          retry_on_failure?: boolean | null
          step_description_ar?: string | null
          step_name?: string
          step_order?: number
          step_type?: string
          tenant_id?: string
          timeout_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_steps_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "soar_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_steps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_triggers: {
        Row: {
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string
          id: string
          is_enabled: boolean | null
          last_backed_up_at: string | null
          last_triggered_at: string | null
          playbook_id: string
          priority: number | null
          tenant_id: string
          trigger_config: Json
          trigger_count: number | null
          trigger_name: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by: string
          id?: string
          is_enabled?: boolean | null
          last_backed_up_at?: string | null
          last_triggered_at?: string | null
          playbook_id: string
          priority?: number | null
          tenant_id: string
          trigger_config: Json
          trigger_count?: number | null
          trigger_name: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_enabled?: boolean | null
          last_backed_up_at?: string | null
          last_triggered_at?: string | null
          playbook_id?: string
          priority?: number | null
          tenant_id?: string
          trigger_config?: Json
          trigger_count?: number | null
          trigger_name?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_triggers_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "soar_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_triggers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          last_backed_up_at: string | null
          last_review_date: string | null
          next_review_date: string | null
          owner: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          last_backed_up_at?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          owner?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          last_backed_up_at?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          owner?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prediction_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          last_backed_up_at: string | null
          notified_users: string[] | null
          prediction_id: string
          recommended_actions: Json | null
          resolved_at: string | null
          severity: string
          status: string | null
          tenant_id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          last_backed_up_at?: string | null
          notified_users?: string[] | null
          prediction_id: string
          recommended_actions?: Json | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          tenant_id: string
          title_ar: string
          title_en: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          last_backed_up_at?: string | null
          notified_users?: string[] | null
          prediction_id?: string
          recommended_actions?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_alerts_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "prediction_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_models: {
        Row: {
          accuracy_score: number | null
          ai_model_name: string
          ai_model_provider: string
          backup_metadata: Json | null
          created_at: string
          created_by: string
          f1_score: number | null
          features_config: Json
          id: string
          is_active: boolean
          last_trained_at: string | null
          mae: number | null
          model_name: string
          model_type: string
          model_version: number
          notes: string | null
          precision_score: number | null
          prompt_template: string
          recall_score: number | null
          rmse: number | null
          status: string
          tenant_id: string
          total_predictions: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          accuracy_score?: number | null
          ai_model_name?: string
          ai_model_provider?: string
          backup_metadata?: Json | null
          created_at?: string
          created_by: string
          f1_score?: number | null
          features_config?: Json
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          mae?: number | null
          model_name: string
          model_type: string
          model_version?: number
          notes?: string | null
          precision_score?: number | null
          prompt_template: string
          recall_score?: number | null
          rmse?: number | null
          status?: string
          tenant_id: string
          total_predictions?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          accuracy_score?: number | null
          ai_model_name?: string
          ai_model_provider?: string
          backup_metadata?: Json | null
          created_at?: string
          created_by?: string
          f1_score?: number | null
          features_config?: Json
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          mae?: number | null
          model_name?: string
          model_type?: string
          model_version?: number
          notes?: string | null
          precision_score?: number | null
          prompt_template?: string
          recall_score?: number | null
          rmse?: number | null
          status?: string
          tenant_id?: string
          total_predictions?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_results: {
        Row: {
          accuracy_delta: number | null
          actual_recorded_at: string | null
          actual_value: Json | null
          confidence_score: number
          context_id: string | null
          context_type: string
          created_at: string | null
          feedback_data: Json | null
          feedback_provided: boolean | null
          id: string
          last_backed_up_at: string | null
          model_id: string
          predicted_value: Json
          prediction_date: string | null
          tenant_id: string
          valid_until: string | null
        }
        Insert: {
          accuracy_delta?: number | null
          actual_recorded_at?: string | null
          actual_value?: Json | null
          confidence_score: number
          context_id?: string | null
          context_type: string
          created_at?: string | null
          feedback_data?: Json | null
          feedback_provided?: boolean | null
          id?: string
          last_backed_up_at?: string | null
          model_id: string
          predicted_value: Json
          prediction_date?: string | null
          tenant_id: string
          valid_until?: string | null
        }
        Update: {
          accuracy_delta?: number | null
          actual_recorded_at?: string | null
          actual_value?: Json | null
          confidence_score?: number
          context_id?: string | null
          context_type?: string
          created_at?: string | null
          feedback_data?: Json | null
          feedback_provided?: boolean | null
          id?: string
          last_backed_up_at?: string | null
          model_id?: string
          predicted_value?: Json
          prediction_date?: string | null
          tenant_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_results_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "prediction_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_training_data: {
        Row: {
          backup_metadata: Json | null
          created_at: string
          created_by: string
          features: Json
          id: string
          is_outlier: boolean | null
          model_id: string
          notes: string | null
          sample_date: string
          sample_type: string
          sample_weight: number | null
          target_category: string | null
          target_value: number | null
          tenant_id: string
        }
        Insert: {
          backup_metadata?: Json | null
          created_at?: string
          created_by: string
          features: Json
          id?: string
          is_outlier?: boolean | null
          model_id: string
          notes?: string | null
          sample_date: string
          sample_type: string
          sample_weight?: number | null
          target_category?: string | null
          target_value?: number | null
          tenant_id: string
        }
        Update: {
          backup_metadata?: Json | null
          created_at?: string
          created_by?: string
          features?: Json
          id?: string
          is_outlier?: boolean | null
          model_id?: string
          notes?: string | null
          sample_date?: string
          sample_type?: string
          sample_weight?: number | null
          target_category?: string | null
          target_value?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_training_data_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "prediction_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_training_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          actual_category: string | null
          actual_value: number | null
          ai_model_used: string
          ai_reasoning: string | null
          ai_response_raw: Json | null
          ai_tokens_used: number | null
          backup_metadata: Json | null
          confidence_score: number | null
          created_at: string
          created_by: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          input_features: Json
          input_timestamp: string
          model_id: string
          notes: string | null
          predicted_category: string | null
          predicted_value: number | null
          prediction_error: number | null
          prediction_range_max: number | null
          prediction_range_min: number | null
          prediction_type: string
          processing_time_ms: number | null
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string
          validation_date: string | null
          validation_status: string | null
        }
        Insert: {
          actual_category?: string | null
          actual_value?: number | null
          ai_model_used: string
          ai_reasoning?: string | null
          ai_response_raw?: Json | null
          ai_tokens_used?: number | null
          backup_metadata?: Json | null
          confidence_score?: number | null
          created_at?: string
          created_by: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_features: Json
          input_timestamp?: string
          model_id: string
          notes?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_error?: number | null
          prediction_range_max?: number | null
          prediction_range_min?: number | null
          prediction_type: string
          processing_time_ms?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by: string
          validation_date?: string | null
          validation_status?: string | null
        }
        Update: {
          actual_category?: string | null
          actual_value?: number | null
          ai_model_used?: string
          ai_reasoning?: string | null
          ai_response_raw?: Json | null
          ai_tokens_used?: number | null
          backup_metadata?: Json | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          input_features?: Json
          input_timestamp?: string
          model_id?: string
          notes?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_error?: number | null
          prediction_range_max?: number | null
          prediction_range_min?: number | null
          prediction_type?: string
          processing_time_ms?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string
          validation_date?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "prediction_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quarterly_insights: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kpis_summary: Json
          quarter: number
          quarter_start: string
          tenant_id: string
          top_initiatives: Json
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kpis_summary?: Json
          quarter: number
          quarter_start: string
          tenant_id: string
          top_initiatives?: Json
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kpis_summary?: Json
          quarter?: number
          quarter_start?: string
          tenant_id?: string
          top_initiatives?: Json
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      quiz_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          tenant_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          tenant_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          order: number
          quiz_id: string
          tenant_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          quiz_id: string
          tenant_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          quiz_id?: string
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "module_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          answers: Json
          id: string
          module_id: string
          participant_id: string
          passed: boolean
          score: number
          submitted_at: string
          tenant_id: string
        }
        Insert: {
          answers: Json
          id?: string
          module_id: string
          participant_id: string
          passed: boolean
          score: number
          submitted_at?: string
          tenant_id: string
        }
        Update: {
          answers?: Json
          id?: string
          module_id?: string
          participant_id?: string
          passed?: boolean
          score?: number
          submitted_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "campaign_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "campaign_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      rca_config: {
        Row: {
          created_at: string
          created_by: string | null
          dim_keys: string[]
          id: number
          is_active: boolean
          kpi_key: string
          min_sample: number
          notes: string | null
          tenant_id: string
          top_n: number
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dim_keys?: string[]
          id?: number
          is_active?: boolean
          kpi_key: string
          min_sample?: number
          notes?: string | null
          tenant_id: string
          top_n?: number
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dim_keys?: string[]
          id?: number
          is_active?: boolean
          kpi_key?: string
          min_sample?: number
          notes?: string | null
          tenant_id?: string
          top_n?: number
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      reco_generated: {
        Row: {
          action_type_code: string
          body_ar: string
          created_at: string
          dim_key: string
          dim_value: string
          effort_estimate: string
          flag: string
          id: number
          impact_level: string
          kpi_key: string
          month: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_ref: Json
          status: string
          tenant_id: string
          title_ar: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at: string
        }
        Insert: {
          action_type_code: string
          body_ar: string
          created_at?: string
          dim_key: string
          dim_value: string
          effort_estimate: string
          flag: string
          id?: number
          impact_level: string
          kpi_key: string
          month: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ref: Json
          status?: string
          tenant_id: string
          title_ar: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
        }
        Update: {
          action_type_code?: string
          body_ar?: string
          created_at?: string
          dim_key?: string
          dim_value?: string
          effort_estimate?: string
          flag?: string
          id?: number
          impact_level?: string
          kpi_key?: string
          month?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ref?: Json
          status?: string
          tenant_id?: string
          title_ar?: string
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at?: string
        }
        Relationships: []
      }
      reco_templates: {
        Row: {
          action_type_code: string
          body_ar: string
          created_at: string
          created_by: string | null
          dim_key: string
          effort_estimate: string
          id: number
          impact_level: string
          is_active: boolean
          kpi_key: string
          notes: string | null
          tenant_id: string
          title_ar: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          trigger_flag: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          action_type_code: string
          body_ar: string
          created_at?: string
          created_by?: string | null
          dim_key: string
          effort_estimate?: string
          id?: number
          impact_level?: string
          is_active?: boolean
          kpi_key: string
          notes?: string | null
          tenant_id: string
          title_ar: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          trigger_flag?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          action_type_code?: string
          body_ar?: string
          created_at?: string
          created_by?: string | null
          dim_key?: string
          effort_estimate?: string
          id?: number
          impact_level?: string
          is_active?: boolean
          kpi_key?: string
          notes?: string | null
          tenant_id?: string
          title_ar?: string
          trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
          trigger_flag?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ref_catalogs: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          label_ar: string
          label_en: string
          meta: Json
          scope: string
          status: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_ar: string
          label_en: string
          meta?: Json
          scope: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_ar?: string
          label_en?: string
          meta?: Json
          scope?: string
          status?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ref_catalogs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_mappings: {
        Row: {
          catalog_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          source_system: string
          src_code: string
          target_code: string
          term_id: string | null
        }
        Insert: {
          catalog_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_system: string
          src_code: string
          target_code: string
          term_id?: string | null
        }
        Update: {
          catalog_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          source_system?: string
          src_code?: string
          target_code?: string
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ref_mappings_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "ref_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ref_mappings_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "ref_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_terms: {
        Row: {
          active: boolean
          attrs: Json
          catalog_id: string
          code: string
          created_at: string
          created_by: string | null
          id: string
          label_ar: string
          label_en: string
          parent_id: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          attrs?: Json
          catalog_id: string
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_ar: string
          label_en: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          attrs?: Json
          catalog_id?: string
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_ar?: string
          label_en?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ref_terms_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "ref_catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ref_terms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ref_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_log: {
        Row: {
          duration_ms: number | null
          error_message: string | null
          id: number
          refreshed_at: string
          status: string | null
          view_name: string
        }
        Insert: {
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          refreshed_at?: string
          status?: string | null
          view_name: string
        }
        Update: {
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          refreshed_at?: string
          status?: string | null
          view_name?: string
        }
        Relationships: []
      }
      report_exports: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_format: string
          id: string
          refresh_at: string | null
          report_type: string
          source_views: Json | null
          status: string
          storage_url: string | null
          tenant_id: string
          total_rows: number | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_format: string
          id?: string
          refresh_at?: string | null
          report_type: string
          source_views?: Json | null
          status?: string
          storage_url?: string | null
          tenant_id: string
          total_rows?: number | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_format?: string
          id?: string
          refresh_at?: string | null
          report_type?: string
          source_views?: Json | null
          status?: string
          storage_url?: string | null
          tenant_id?: string
          total_rows?: number | null
          user_id?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_default: boolean
          name: string
          page_key: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          is_default?: boolean
          name: string
          page_key: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          page_key?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      secops_connector_sync_logs: {
        Row: {
          connector_id: string
          created_at: string
          error_message: string | null
          id: string
          records_failed: number | null
          records_imported: number | null
          records_processed: number | null
          status: string
          sync_completed_at: string | null
          sync_details: Json | null
          sync_started_at: string
          tenant_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_imported?: number | null
          records_processed?: number | null
          status: string
          sync_completed_at?: string | null
          sync_details?: Json | null
          sync_started_at?: string
          tenant_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_imported?: number | null
          records_processed?: number | null
          status?: string
          sync_completed_at?: string | null
          sync_details?: Json | null
          sync_started_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secops_connector_sync_logs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "secops_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secops_connector_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      secops_connectors: {
        Row: {
          auth_config: Json | null
          connection_config: Json
          connector_type: string
          created_at: string
          created_by: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_backed_up_at: string | null
          last_error: string | null
          last_sync_at: string | null
          last_sync_result: Json | null
          name_ar: string
          name_en: string
          next_sync_at: string | null
          sync_enabled: boolean | null
          sync_interval_minutes: number | null
          sync_status: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
          vendor: string
          version: string | null
        }
        Insert: {
          auth_config?: Json | null
          connection_config?: Json
          connector_type: string
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_result?: Json | null
          name_ar: string
          name_en: string
          next_sync_at?: string | null
          sync_enabled?: boolean | null
          sync_interval_minutes?: number | null
          sync_status?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          vendor: string
          version?: string | null
        }
        Update: {
          auth_config?: Json | null
          connection_config?: Json
          connector_type?: string
          created_at?: string
          created_by?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          last_sync_result?: Json | null
          name_ar?: string
          name_en?: string
          next_sync_at?: string | null
          sync_enabled?: boolean | null
          sync_interval_minutes?: number | null
          sync_status?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          vendor?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secops_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_event_threat_matches: {
        Row: {
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          event_id: string
          id: string
          indicator_id: string
          is_confirmed: boolean | null
          last_backed_up_at: string | null
          match_type: string
          match_value: string
          matched_at: string
          notes: string | null
          tenant_id: string
        }
        Insert: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          indicator_id: string
          is_confirmed?: boolean | null
          last_backed_up_at?: string | null
          match_type: string
          match_value: string
          matched_at?: string
          notes?: string | null
          tenant_id: string
        }
        Update: {
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          indicator_id?: string
          is_confirmed?: boolean | null
          last_backed_up_at?: string | null
          match_type?: string
          match_value?: string
          matched_at?: string
          notes?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_event_threat_matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_event_threat_matches_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "threat_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_event_threat_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          destination_ip: unknown
          event_data: Json
          event_timestamp: string
          event_type: string
          id: string
          incident_id: string | null
          is_processed: boolean | null
          last_backed_up_at: string | null
          normalized_fields: Json | null
          raw_log: string | null
          severity: string
          source_ip: unknown
          source_system: string | null
          tenant_id: string
          threat_indicator_matched: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          destination_ip?: unknown
          event_data?: Json
          event_timestamp: string
          event_type: string
          id?: string
          incident_id?: string | null
          is_processed?: boolean | null
          last_backed_up_at?: string | null
          normalized_fields?: Json | null
          raw_log?: string | null
          severity: string
          source_ip?: unknown
          source_system?: string | null
          tenant_id: string
          threat_indicator_matched?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          destination_ip?: unknown
          event_data?: Json
          event_timestamp?: string
          event_type?: string
          id?: string
          incident_id?: string | null
          is_processed?: boolean | null
          last_backed_up_at?: string | null
          normalized_fields?: Json | null
          raw_log?: string | null
          severity?: string
          source_ip?: unknown
          source_system?: string | null
          tenant_id?: string
          threat_indicator_matched?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_cost: number | null
          affected_assets: string[] | null
          affected_systems: string[] | null
          affected_users: string[] | null
          assigned_team: string | null
          assigned_to: string | null
          closed_at: string | null
          closed_by: string | null
          contained_at: string | null
          containment_actions: Json | null
          created_at: string
          created_by: string
          description_ar: string
          description_en: string | null
          detected_at: string
          eradication_actions: Json | null
          estimated_cost: number | null
          id: string
          impact_level: string | null
          incident_number: string
          incident_type: string
          is_false_positive: boolean | null
          last_backed_up_at: string | null
          lessons_learned_ar: string | null
          lessons_learned_en: string | null
          linked_events: string[] | null
          linked_policies: string[] | null
          linked_risks: string[] | null
          metadata: Json | null
          priority: number | null
          recommendations_ar: string | null
          recommendations_en: string | null
          recovery_actions: Json | null
          reported_at: string
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          response_plan_id: string | null
          root_cause_ar: string | null
          root_cause_en: string | null
          severity: string
          sla_resolution_deadline: string | null
          sla_response_deadline: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_cost?: number | null
          affected_assets?: string[] | null
          affected_systems?: string[] | null
          affected_users?: string[] | null
          assigned_team?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          contained_at?: string | null
          containment_actions?: Json | null
          created_at?: string
          created_by: string
          description_ar: string
          description_en?: string | null
          detected_at: string
          eradication_actions?: Json | null
          estimated_cost?: number | null
          id?: string
          impact_level?: string | null
          incident_number: string
          incident_type: string
          is_false_positive?: boolean | null
          last_backed_up_at?: string | null
          lessons_learned_ar?: string | null
          lessons_learned_en?: string | null
          linked_events?: string[] | null
          linked_policies?: string[] | null
          linked_risks?: string[] | null
          metadata?: Json | null
          priority?: number | null
          recommendations_ar?: string | null
          recommendations_en?: string | null
          recovery_actions?: Json | null
          reported_at?: string
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_plan_id?: string | null
          root_cause_ar?: string | null
          root_cause_en?: string | null
          severity: string
          sla_resolution_deadline?: string | null
          sla_response_deadline?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_cost?: number | null
          affected_assets?: string[] | null
          affected_systems?: string[] | null
          affected_users?: string[] | null
          assigned_team?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          contained_at?: string | null
          containment_actions?: Json | null
          created_at?: string
          created_by?: string
          description_ar?: string
          description_en?: string | null
          detected_at?: string
          eradication_actions?: Json | null
          estimated_cost?: number | null
          id?: string
          impact_level?: string | null
          incident_number?: string
          incident_type?: string
          is_false_positive?: boolean | null
          last_backed_up_at?: string | null
          lessons_learned_ar?: string | null
          lessons_learned_en?: string | null
          linked_events?: string[] | null
          linked_policies?: string[] | null
          linked_risks?: string[] | null
          metadata?: Json | null
          priority?: number | null
          recommendations_ar?: string | null
          recommendations_en?: string | null
          recovery_actions?: Json | null
          reported_at?: string
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          response_plan_id?: string | null
          root_cause_ar?: string | null
          root_cause_en?: string | null
          severity?: string
          sla_resolution_deadline?: string | null
          sla_response_deadline?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soar_executions: {
        Row: {
          actions_taken: string[] | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          current_step_id: string | null
          error_details: string | null
          error_message: string | null
          executed_by: string | null
          execution_context: Json | null
          execution_log: Json | null
          id: string
          last_backed_up_at: string | null
          playbook_id: string
          result: Json | null
          rollback_status: string | null
          started_at: string
          status: string
          steps_completed: number | null
          steps_total: number | null
          tenant_id: string
          trigger_event_id: string | null
        }
        Insert: {
          actions_taken?: string[] | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          current_step_id?: string | null
          error_details?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          execution_log?: Json | null
          id?: string
          last_backed_up_at?: string | null
          playbook_id: string
          result?: Json | null
          rollback_status?: string | null
          started_at?: string
          status?: string
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id: string
          trigger_event_id?: string | null
        }
        Update: {
          actions_taken?: string[] | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          current_step_id?: string | null
          error_details?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_context?: Json | null
          execution_log?: Json | null
          id?: string
          last_backed_up_at?: string | null
          playbook_id?: string
          result?: Json | null
          rollback_status?: string | null
          started_at?: string
          status?: string
          steps_completed?: number | null
          steps_total?: number | null
          tenant_id?: string
          trigger_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soar_executions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "soar_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soar_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soar_executions_trigger_event_id_fkey"
            columns: ["trigger_event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
        ]
      }
      soar_playbooks: {
        Row: {
          approval_required: boolean | null
          approver_role: string | null
          automation_steps: Json
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          estimated_duration_minutes: number | null
          execution_count: number | null
          execution_mode: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          last_backed_up_at: string | null
          last_executed_at: string | null
          playbook_name_ar: string
          playbook_name_en: string | null
          playbook_version: string | null
          retry_config: Json | null
          success_count: number | null
          success_rate_pct: number | null
          tags: string[] | null
          template_category: string | null
          tenant_id: string
          trigger_conditions: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_required?: boolean | null
          approver_role?: string | null
          automation_steps?: Json
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          estimated_duration_minutes?: number | null
          execution_count?: number | null
          execution_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_backed_up_at?: string | null
          last_executed_at?: string | null
          playbook_name_ar: string
          playbook_name_en?: string | null
          playbook_version?: string | null
          retry_config?: Json | null
          success_count?: number | null
          success_rate_pct?: number | null
          tags?: string[] | null
          template_category?: string | null
          tenant_id: string
          trigger_conditions?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_required?: boolean | null
          approver_role?: string | null
          automation_steps?: Json
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          estimated_duration_minutes?: number | null
          execution_count?: number | null
          execution_mode?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          last_backed_up_at?: string | null
          last_executed_at?: string | null
          playbook_name_ar?: string
          playbook_name_en?: string | null
          playbook_version?: string | null
          retry_config?: Json | null
          success_count?: number | null
          success_rate_pct?: number | null
          tags?: string[] | null
          template_category?: string | null
          tenant_id?: string
          trigger_conditions?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soar_playbooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      success_actions: {
        Row: {
          action_config: Json | null
          action_type: string
          assigned_at: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          evidence_urls: string[] | null
          id: string
          playbook_id: string
          sequence_order: number
          status: string | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          evidence_urls?: string[] | null
          id?: string
          playbook_id: string
          sequence_order: number
          status?: string | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          assigned_at?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          description_ar?: string | null
          description_en?: string | null
          evidence_urls?: string[] | null
          id?: string
          playbook_id?: string
          sequence_order?: number
          status?: string | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_actions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "success_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      success_health_snapshots: {
        Row: {
          adoption_score: number | null
          compliance_score: number | null
          created_at: string | null
          critical_issues_count: number | null
          data_quality_score: number | null
          health_status: string | null
          id: string
          metrics: Json | null
          org_unit_id: string | null
          overall_score: number | null
          recommendations_count: number | null
          risk_hygiene_score: number | null
          snapshot_date: string
          tenant_id: string
        }
        Insert: {
          adoption_score?: number | null
          compliance_score?: number | null
          created_at?: string | null
          critical_issues_count?: number | null
          data_quality_score?: number | null
          health_status?: string | null
          id?: string
          metrics?: Json | null
          org_unit_id?: string | null
          overall_score?: number | null
          recommendations_count?: number | null
          risk_hygiene_score?: number | null
          snapshot_date?: string
          tenant_id: string
        }
        Update: {
          adoption_score?: number | null
          compliance_score?: number | null
          created_at?: string | null
          critical_issues_count?: number | null
          data_quality_score?: number | null
          health_status?: string | null
          id?: string
          metrics?: Json | null
          org_unit_id?: string | null
          overall_score?: number | null
          recommendations_count?: number | null
          risk_hygiene_score?: number | null
          snapshot_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_health_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      success_nudges: {
        Row: {
          action_label_ar: string | null
          action_label_en: string | null
          action_url: string | null
          context_data: Json | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_channels: string[] | null
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message_ar: string
          message_en: string | null
          nudge_type: string
          priority: string | null
          read_at: string | null
          target_role: string | null
          target_user_id: string | null
          tenant_id: string
          title_ar: string
          title_en: string | null
        }
        Insert: {
          action_label_ar?: string | null
          action_label_en?: string | null
          action_url?: string | null
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_channels?: string[] | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message_ar: string
          message_en?: string | null
          nudge_type: string
          priority?: string | null
          read_at?: string | null
          target_role?: string | null
          target_user_id?: string | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
        }
        Update: {
          action_label_ar?: string | null
          action_label_en?: string | null
          action_url?: string | null
          context_data?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_channels?: string[] | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message_ar?: string
          message_en?: string | null
          nudge_type?: string
          priority?: string | null
          read_at?: string | null
          target_role?: string | null
          target_user_id?: string | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_nudges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      success_playbooks: {
        Row: {
          actual_impact: Json | null
          completed_actions: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          due_date: string | null
          expected_impact: Json | null
          id: string
          playbook_key: string
          priority: string | null
          progress_pct: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          title_ar: string
          title_en: string | null
          total_actions: number | null
          trigger_conditions: Json
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          actual_impact?: Json | null
          completed_actions?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          expected_impact?: Json | null
          id?: string
          playbook_key: string
          priority?: string | null
          progress_pct?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          title_ar: string
          title_en?: string | null
          total_actions?: number | null
          trigger_conditions?: Json
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_impact?: Json | null
          completed_actions?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          due_date?: string | null
          expected_impact?: Json | null
          id?: string
          playbook_key?: string
          priority?: string | null
          progress_pct?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          title_ar?: string
          title_en?: string | null
          total_actions?: number | null
          trigger_conditions?: Json
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_playbooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      success_wizard_states: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          completion_pct: number | null
          created_at: string | null
          current_step: string
          id: string
          is_completed: boolean | null
          tenant_id: string
          total_steps: number
          updated_at: string | null
          wizard_data: Json | null
          wizard_type: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          completion_pct?: number | null
          created_at?: string | null
          current_step: string
          id?: string
          is_completed?: boolean | null
          tenant_id: string
          total_steps: number
          updated_at?: string | null
          wizard_data?: Json | null
          wizard_type?: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          completion_pct?: number | null
          created_at?: string | null
          current_step?: string
          id?: string
          is_completed?: boolean | null
          tenant_id?: string
          total_steps?: number
          updated_at?: string | null
          wizard_data?: Json | null
          wizard_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_wizard_states_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configurations: {
        Row: {
          category: string
          config_key: string
          config_type: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_readonly: boolean | null
          is_sensitive: boolean | null
          last_backed_up_at: string | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          validation_rules: Json | null
        }
        Insert: {
          category: string
          config_key: string
          config_type: string
          config_value: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_readonly?: boolean | null
          is_sensitive?: boolean | null
          last_backed_up_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Update: {
          category?: string
          config_key?: string
          config_type?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_readonly?: boolean | null
          is_sensitive?: boolean | null
          last_backed_up_at?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_category: string
          event_type: string
          id: string
          metadata: Json | null
          payload: Json | null
          priority: string | null
          processed_at: string | null
          source_module: string
          status: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_category: string
          event_type: string
          id?: string
          metadata?: Json | null
          payload?: Json | null
          priority?: string | null
          processed_at?: string | null
          source_module: string
          status?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_category?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          payload?: Json | null
          priority?: string | null
          processed_at?: string | null
          source_module?: string
          status?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_events_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_job_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          job_id: string
          meta: Json
          started_at: string
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          trigger_source: Database["public"]["Enums"]["job_trigger_source"]
          triggered_by_user_id: string | null
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_id: string
          meta?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          trigger_source?: Database["public"]["Enums"]["job_trigger_source"]
          triggered_by_user_id?: string | null
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_id?: string
          meta?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string
          trigger_source?: Database["public"]["Enums"]["job_trigger_source"]
          triggered_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_job_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "system_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_jobs: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          display_name: string
          gate_code: string
          id: string
          is_enabled: boolean
          job_key: string
          job_type: string | null
          last_run_at: string | null
          last_run_status: string | null
          schedule_cron: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name: string
          gate_code: string
          id?: string
          is_enabled?: boolean
          job_key: string
          job_type?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          schedule_cron?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          display_name?: string
          gate_code?: string
          id?: string
          is_enabled?: boolean
          job_key?: string
          job_type?: string | null
          last_run_at?: string | null
          last_run_status?: string | null
          schedule_cron?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          id: string
          last_backed_up_at: string | null
          metadata: Json | null
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          severity: string | null
          source_component: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          severity?: string | null
          source_component?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          severity?: string | null
          source_component?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_automation_actions: {
        Row: {
          action_type: string
          config_json: Json | null
          created_at: string
          event_code: string
          id: string
          is_enabled: boolean
          scope: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          config_json?: Json | null
          created_at?: string
          event_code: string
          id?: string
          is_enabled?: boolean
          scope?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          config_json?: Json | null
          created_at?: string
          event_code?: string
          id?: string
          is_enabled?: boolean
          scope?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_automation_actions_event_code_fkey"
            columns: ["event_code"]
            isOneToOne: false
            referencedRelation: "tenant_automation_events"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_automation_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_automation_events: {
        Row: {
          code: string
          created_at: string
          description: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
        }
        Relationships: []
      }
      tenant_deprovision_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          sort_order: number
          started_at: string | null
          status: string
          step_code: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          sort_order?: number
          started_at?: string | null
          status?: string
          step_code: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          sort_order?: number
          started_at?: string | null
          status?: string
          step_code?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_deprovision_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_health_status: {
        Row: {
          details_json: Json | null
          drift_flag: string | null
          health_status: string
          last_checked_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          details_json?: Json | null
          drift_flag?: string | null
          health_status?: string
          last_checked_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          details_json?: Json | null
          drift_flag?: string | null
          health_status?: string
          last_checked_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_health_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_lifecycle_events: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          event_status: string | null
          event_type: string
          id: string
          last_backed_up_at: string | null
          metadata: Json | null
          new_state: Json | null
          previous_state: Json | null
          rollback_info: Json | null
          tenant_id: string
          triggered_at: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          event_status?: string | null
          event_type: string
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          rollback_info?: Json | null
          tenant_id: string
          triggered_at?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          event_status?: string | null
          event_type?: string
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          new_state?: Json | null
          previous_state?: Json | null
          rollback_info?: Json | null
          tenant_id?: string
          triggered_at?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_lifecycle_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_lifecycle_log: {
        Row: {
          created_at: string
          from_state: string | null
          id: string
          reason: string | null
          tenant_id: string
          to_state: string | null
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          from_state?: string | null
          id?: string
          reason?: string | null
          tenant_id: string
          to_state?: string | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          from_state?: string | null
          id?: string
          reason?: string | null
          tenant_id?: string
          to_state?: string | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_lifecycle_log_from_state_fkey"
            columns: ["from_state"]
            isOneToOne: false
            referencedRelation: "tenant_lifecycle_states"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tenant_lifecycle_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_lifecycle_log_to_state_fkey"
            columns: ["to_state"]
            isOneToOne: false
            referencedRelation: "tenant_lifecycle_states"
            referencedColumns: ["code"]
          },
        ]
      }
      tenant_lifecycle_states: {
        Row: {
          code: string
          created_at: string
          description: string | null
          is_terminal: boolean
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          is_terminal?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          is_terminal?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      tenant_notifications_channels: {
        Row: {
          channel_type: string
          config_json: Json
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          channel_type: string
          config_json: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_type?: string
          config_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notifications_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_scheduled_transitions: {
        Row: {
          condition_check: Json
          created_at: string
          created_by: string | null
          error_message: string | null
          executed_at: string | null
          from_state: string
          id: string
          reason: string | null
          scheduled_at: string
          status: string
          tenant_id: string
          to_state: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          condition_check?: Json
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          executed_at?: string | null
          from_state: string
          id?: string
          reason?: string | null
          scheduled_at: string
          status?: string
          tenant_id: string
          to_state: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          condition_check?: Json
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          executed_at?: string | null
          from_state?: string
          id?: string
          reason?: string | null
          scheduled_at?: string
          status?: string
          tenant_id?: string
          to_state?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          api_calls_limit: number | null
          auto_renew: boolean | null
          billing_cycle: string | null
          created_at: string
          end_date: string | null
          features: Json | null
          id: string
          last_backed_up_at: string | null
          metadata: Json | null
          monthly_price: number | null
          plan_name: string
          plan_tier: string
          pricing_currency: string | null
          start_date: string
          storage_limit_gb: number | null
          subscription_status: string | null
          tenant_id: string
          trial_end_date: string | null
          updated_at: string
          user_limit: number | null
          yearly_price: number | null
        }
        Insert: {
          api_calls_limit?: number | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          end_date?: string | null
          features?: Json | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          monthly_price?: number | null
          plan_name: string
          plan_tier: string
          pricing_currency?: string | null
          start_date: string
          storage_limit_gb?: number | null
          subscription_status?: string | null
          tenant_id: string
          trial_end_date?: string | null
          updated_at?: string
          user_limit?: number | null
          yearly_price?: number | null
        }
        Update: {
          api_calls_limit?: number | null
          auto_renew?: boolean | null
          billing_cycle?: string | null
          created_at?: string
          end_date?: string | null
          features?: Json | null
          id?: string
          last_backed_up_at?: string | null
          metadata?: Json | null
          monthly_price?: number | null
          plan_name?: string
          plan_tier?: string
          pricing_currency?: string | null
          start_date?: string
          storage_limit_gb?: number | null
          subscription_status?: string | null
          tenant_id?: string
          trial_end_date?: string | null
          updated_at?: string
          user_limit?: number | null
          yearly_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage_stats: {
        Row: {
          active_users_count: number | null
          api_calls_count: number | null
          awareness_campaigns_count: number | null
          created_at: string
          database_queries_count: number | null
          id: string
          incidents_count: number | null
          last_backed_up_at: string | null
          metadata: Json | null
          phishing_simulations_count: number | null
          policies_count: number | null
          stat_date: string
          tenant_id: string
          total_storage_gb: number | null
          updated_at: string
        }
        Insert: {
          active_users_count?: number | null
          api_calls_count?: number | null
          awareness_campaigns_count?: number | null
          created_at?: string
          database_queries_count?: number | null
          id?: string
          incidents_count?: number | null
          last_backed_up_at?: string | null
          metadata?: Json | null
          phishing_simulations_count?: number | null
          policies_count?: number | null
          stat_date: string
          tenant_id: string
          total_storage_gb?: number | null
          updated_at?: string
        }
        Update: {
          active_users_count?: number | null
          api_calls_count?: number | null
          awareness_campaigns_count?: number | null
          created_at?: string
          database_queries_count?: number | null
          id?: string
          incidents_count?: number | null
          last_backed_up_at?: string | null
          metadata?: Json | null
          phishing_simulations_count?: number | null
          policies_count?: number | null
          stat_date?: string
          tenant_id?: string
          total_storage_gb?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_stats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      threat_actor_profiles: {
        Row: {
          activity_status: string | null
          actor_aliases: string[] | null
          actor_name: string
          actor_type: string
          associated_indicators_count: number | null
          confidence_level: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          external_references: Json | null
          first_observed: string | null
          id: string
          intelligence_sources: string[] | null
          known_malware: string[] | null
          known_tools: string[] | null
          last_backed_up_at: string | null
          last_observed: string | null
          preferred_attack_vectors: string[] | null
          primary_motivation: string[] | null
          related_campaigns: string[] | null
          sophistication_level: string | null
          suspected_affiliation: string | null
          suspected_country: string | null
          tags: string[] | null
          target_regions: string[] | null
          target_sectors: string[] | null
          tenant_id: string
          ttps: Json | null
          updated_at: string
        }
        Insert: {
          activity_status?: string | null
          actor_aliases?: string[] | null
          actor_name: string
          actor_type: string
          associated_indicators_count?: number | null
          confidence_level?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          external_references?: Json | null
          first_observed?: string | null
          id?: string
          intelligence_sources?: string[] | null
          known_malware?: string[] | null
          known_tools?: string[] | null
          last_backed_up_at?: string | null
          last_observed?: string | null
          preferred_attack_vectors?: string[] | null
          primary_motivation?: string[] | null
          related_campaigns?: string[] | null
          sophistication_level?: string | null
          suspected_affiliation?: string | null
          suspected_country?: string | null
          tags?: string[] | null
          target_regions?: string[] | null
          target_sectors?: string[] | null
          tenant_id: string
          ttps?: Json | null
          updated_at?: string
        }
        Update: {
          activity_status?: string | null
          actor_aliases?: string[] | null
          actor_name?: string
          actor_type?: string
          associated_indicators_count?: number | null
          confidence_level?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          external_references?: Json | null
          first_observed?: string | null
          id?: string
          intelligence_sources?: string[] | null
          known_malware?: string[] | null
          known_tools?: string[] | null
          last_backed_up_at?: string | null
          last_observed?: string | null
          preferred_attack_vectors?: string[] | null
          primary_motivation?: string[] | null
          related_campaigns?: string[] | null
          sophistication_level?: string | null
          suspected_affiliation?: string | null
          suspected_country?: string | null
          tags?: string[] | null
          target_regions?: string[] | null
          target_sectors?: string[] | null
          tenant_id?: string
          ttps?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_actor_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_hunt_queries: {
        Row: {
          created_at: string
          created_by: string
          description_ar: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          is_scheduled: boolean | null
          last_backed_up_at: string | null
          last_executed_at: string | null
          query_config: Json
          query_name: string
          query_type: string
          results_count: number | null
          saved_filters: Json | null
          schedule_cron: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description_ar?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_scheduled?: boolean | null
          last_backed_up_at?: string | null
          last_executed_at?: string | null
          query_config?: Json
          query_name: string
          query_type: string
          results_count?: number | null
          saved_filters?: Json | null
          schedule_cron?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description_ar?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          is_scheduled?: boolean | null
          last_backed_up_at?: string | null
          last_executed_at?: string | null
          query_config?: Json
          query_name?: string
          query_type?: string
          results_count?: number | null
          saved_filters?: Json | null
          schedule_cron?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_hunt_queries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_hunt_results: {
        Row: {
          created_at: string
          error_message: string | null
          executed_at: string
          executed_by: string
          execution_time_ms: number | null
          id: string
          matched_events_count: number | null
          matched_indicators_count: number | null
          query_id: string
          results_data: Json
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by: string
          execution_time_ms?: number | null
          id?: string
          matched_events_count?: number | null
          matched_indicators_count?: number | null
          query_id: string
          results_data?: Json
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_at?: string
          executed_by?: string
          execution_time_ms?: number | null
          id?: string
          matched_events_count?: number | null
          matched_indicators_count?: number | null
          query_id?: string
          results_data?: Json
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_hunt_results_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "threat_hunt_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_hunt_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_indicators: {
        Row: {
          confidence_score: number | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          detection_count: number | null
          feed_id: string | null
          first_seen_at: string
          id: string
          indicator_type: string
          indicator_value: string
          is_whitelisted: boolean | null
          last_backed_up_at: string | null
          last_seen_at: string
          match_count: number | null
          metadata: Json | null
          tags: string[] | null
          tenant_id: string
          threat_category: string | null
          threat_level: string
          updated_at: string
          whitelist_reason: string | null
          whitelisted_at: string | null
          whitelisted_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          detection_count?: number | null
          feed_id?: string | null
          first_seen_at?: string
          id?: string
          indicator_type: string
          indicator_value: string
          is_whitelisted?: boolean | null
          last_backed_up_at?: string | null
          last_seen_at?: string
          match_count?: number | null
          metadata?: Json | null
          tags?: string[] | null
          tenant_id: string
          threat_category?: string | null
          threat_level: string
          updated_at?: string
          whitelist_reason?: string | null
          whitelisted_at?: string | null
          whitelisted_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          detection_count?: number | null
          feed_id?: string | null
          first_seen_at?: string
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_whitelisted?: boolean | null
          last_backed_up_at?: string | null
          last_seen_at?: string
          match_count?: number | null
          metadata?: Json | null
          tags?: string[] | null
          tenant_id?: string
          threat_category?: string | null
          threat_level?: string
          updated_at?: string
          whitelist_reason?: string | null
          whitelisted_at?: string | null
          whitelisted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_indicators_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "threat_intelligence_feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_indicators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_intelligence_feeds: {
        Row: {
          api_key_configured: boolean | null
          config: Json | null
          created_at: string
          created_by: string
          feed_name: string
          feed_name_ar: string
          feed_type: string
          id: string
          is_active: boolean | null
          last_backed_up_at: string | null
          last_error_message: string | null
          last_fetch_status: string | null
          last_fetched_at: string | null
          source_provider: string | null
          source_url: string | null
          sync_interval_hours: number | null
          tenant_id: string
          total_indicators_fetched: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          api_key_configured?: boolean | null
          config?: Json | null
          created_at?: string
          created_by: string
          feed_name: string
          feed_name_ar: string
          feed_type: string
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_error_message?: string | null
          last_fetch_status?: string | null
          last_fetched_at?: string | null
          source_provider?: string | null
          source_url?: string | null
          sync_interval_hours?: number | null
          tenant_id: string
          total_indicators_fetched?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          api_key_configured?: boolean | null
          config?: Json | null
          created_at?: string
          created_by?: string
          feed_name?: string
          feed_name_ar?: string
          feed_type?: string
          id?: string
          is_active?: boolean | null
          last_backed_up_at?: string | null
          last_error_message?: string | null
          last_fetch_status?: string | null
          last_fetched_at?: string | null
          source_provider?: string | null
          source_url?: string | null
          sync_interval_hours?: number | null
          tenant_id?: string
          total_indicators_fetched?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_intelligence_feeds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_matches: {
        Row: {
          action_taken: string | null
          action_taken_at: string | null
          action_taken_by: string | null
          created_at: string
          false_positive_marked_at: string | null
          false_positive_marked_by: string | null
          false_positive_reason: string | null
          id: string
          indicator_id: string
          investigation_notes: string | null
          investigation_status: string | null
          is_false_positive: boolean | null
          last_backed_up_at: string | null
          matched_at: string
          matched_entity_id: string | null
          matched_entity_type: string
          matched_value: string
          metadata: Json | null
          severity: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          created_at?: string
          false_positive_marked_at?: string | null
          false_positive_marked_by?: string | null
          false_positive_reason?: string | null
          id?: string
          indicator_id: string
          investigation_notes?: string | null
          investigation_status?: string | null
          is_false_positive?: boolean | null
          last_backed_up_at?: string | null
          matched_at?: string
          matched_entity_id?: string | null
          matched_entity_type: string
          matched_value: string
          metadata?: Json | null
          severity: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          created_at?: string
          false_positive_marked_at?: string | null
          false_positive_marked_by?: string | null
          false_positive_reason?: string | null
          id?: string
          indicator_id?: string
          investigation_notes?: string | null
          investigation_status?: string | null
          is_false_positive?: boolean | null
          last_backed_up_at?: string | null
          matched_at?: string
          matched_entity_id?: string | null
          matched_entity_type?: string
          matched_value?: string
          metadata?: Json | null
          severity?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_threat_matches_indicator"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "threat_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_matches_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "threat_indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threat_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_interactions: {
        Row: {
          backup_metadata: Json | null
          completion_percentage: number | null
          content_id: string
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          last_backup_at: string | null
          source_page: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          backup_metadata?: Json | null
          completion_percentage?: number | null
          content_id: string
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          last_backup_at?: string | null
          source_page?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          backup_metadata?: Json | null
          completion_percentage?: number | null
          content_id?: string
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          last_backup_at?: string | null
          source_page?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_interactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_interactions_tenant_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tenants: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      awareness_impact_scores_view: {
        Row: {
          completion_score: number | null
          compliance_linkage_score: number | null
          confidence_level: number | null
          created_at: string | null
          data_source: string | null
          engagement_score: number | null
          feedback_quality_score: number | null
          impact_score: number | null
          org_unit_code: string | null
          org_unit_id: string | null
          org_unit_name: string | null
          period_month: number | null
          period_year: number | null
          risk_level: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          completion_score?: number | null
          compliance_linkage_score?: number | null
          confidence_level?: number | null
          created_at?: string | null
          data_source?: string | null
          engagement_score?: number | null
          feedback_quality_score?: number | null
          impact_score?: number | null
          org_unit_code?: never
          org_unit_id?: string | null
          org_unit_name?: never
          period_month?: number | null
          period_year?: number | null
          risk_level?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completion_score?: number | null
          compliance_linkage_score?: number | null
          confidence_level?: number | null
          created_at?: string | null
          data_source?: string | null
          engagement_score?: number | null
          feedback_quality_score?: number | null
          impact_score?: number | null
          org_unit_code?: never
          org_unit_id?: string | null
          org_unit_name?: never
          period_month?: number | null
          period_year?: number | null
          risk_level?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mv_awareness_campaign_kpis: {
        Row: {
          active_participants_rate: number | null
          avg_feedback_score: number | null
          avg_time_to_complete_hours: number | null
          avg_time_to_open_hours: number | null
          campaign_id: string | null
          campaign_name: string | null
          completed_count: number | null
          completion_rate: number | null
          end_at: string | null
          engagement_rate: number | null
          feedback_count: number | null
          feedback_coverage_rate: number | null
          in_progress_count: number | null
          invited_count: number | null
          kpi_activation_rate: number | null
          kpi_completion_rate: number | null
          kpi_open_rate: number | null
          opened_count: number | null
          owner_name: string | null
          refreshed_at: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          tenant_id: string | null
          total_participants: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_awareness_feedback_insights: {
        Row: {
          avg_feedback_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_status: Database["public"]["Enums"]["campaign_status"] | null
          feedback_with_comments_count: number | null
          first_feedback_at: string | null
          last_feedback_at: string | null
          max_feedback_score: number | null
          min_feedback_score: number | null
          negative_feedback_count: number | null
          neutral_feedback_count: number | null
          positive_feedback_count: number | null
          refreshed_at: string | null
          tenant_id: string | null
          total_feedback_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_awareness_timeseries: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          cumulative_completed: number | null
          cumulative_opened: number | null
          daily_avg_feedback_score: number | null
          daily_completed: number | null
          daily_feedback_count: number | null
          daily_opened: number | null
          date_bucket: string | null
          refreshed_at: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_campaign_kpis_daily: {
        Row: {
          activated_count: number | null
          bounced_count: number | null
          campaign_id: string | null
          clicked_count: number | null
          completed_count: number | null
          date_r: string | null
          invited_count: number | null
          kpi_activation_rate: number | null
          kpi_click_rate: number | null
          kpi_completion_rate: number | null
          kpi_open_rate: number | null
          opened_count: number | null
          refreshed_at: string | null
          reminded_count: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_kpi_monthly_anomalies: {
        Row: {
          avg_value: number | null
          baseline_months: number | null
          kpi_key: string | null
          month: string | null
          mu: number | null
          sample_count: number | null
          sigma: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          zscore: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_monthly_delta: {
        Row: {
          avg_value: number | null
          delta_pct: number | null
          kpi_key: string | null
          month: string | null
          prev_avg: number | null
          sample_count: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_monthly_dim_agg: {
        Row: {
          avg_value_dim: number | null
          dim_audience_segment: string | null
          dim_campaign_type: string | null
          dim_channel: string | null
          dim_content_theme: string | null
          dim_department: string | null
          dim_device_type: string | null
          dim_location: string | null
          dim_user_role: string | null
          kpi_key: string | null
          month: string | null
          record_count: number | null
          sample_sum: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_monthly_flags: {
        Row: {
          alert_delta: number | null
          avg_value: number | null
          control_lower: number | null
          control_upper: number | null
          delta_pct: number | null
          flag: string | null
          kpi_key: string | null
          min_sample: number | null
          month: string | null
          mu: number | null
          prev_avg: number | null
          sample_count: number | null
          sigma: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          warn_delta: number | null
          zscore: number | null
          zscore_alert: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_trends_monthly: {
        Row: {
          anomaly_count: number | null
          avg_value: number | null
          delta_pct: number | null
          kpi_key: string | null
          max_value: number | null
          min_value: number | null
          month: string | null
          p50_value: number | null
          p95_value: number | null
          sample_count: number | null
          stddev_value: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_trends_quarterly: {
        Row: {
          anomaly_count: number | null
          avg_value: number | null
          delta_pct: number | null
          kpi_key: string | null
          max_value: number | null
          min_value: number | null
          p50_value: number | null
          p95_value: number | null
          quarter_start: string | null
          sample_count: number | null
          stddev_value: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_kpi_trends_weekly: {
        Row: {
          anomaly_count: number | null
          avg_value: number | null
          delta_pct: number | null
          kpi_key: string | null
          max_value: number | null
          min_value: number | null
          p50_value: number | null
          p95_value: number | null
          sample_count: number | null
          stddev_value: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_rca_monthly_contributors: {
        Row: {
          avg_value_dim: number | null
          contribution_score: number | null
          dim_audience_segment: string | null
          dim_campaign_type: string | null
          dim_channel: string | null
          dim_content_theme: string | null
          dim_department: string | null
          dim_device_type: string | null
          dim_location: string | null
          dim_record_count: number | null
          dim_sample_sum: number | null
          dim_user_role: string | null
          kpi_key: string | null
          month: string | null
          overall_avg_value: number | null
          overall_delta_pct: number | null
          overall_prev_avg: number | null
          overall_sample_count: number | null
          share_ratio: number | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          variance_from_overall_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      mv_rca_monthly_top_contributors: {
        Row: {
          avg_value: number | null
          avg_value_dim: number | null
          contribution_direction: string | null
          contribution_score: number | null
          delta_pct: number | null
          dim_key: string | null
          dim_sample_sum: number | null
          dim_value: string | null
          kpi_key: string | null
          min_sample: number | null
          month: string | null
          prev_avg: number | null
          rnk: number | null
          share_ratio: number | null
          tenant_id: string | null
          top_n: number | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          variance_from_overall_pct: number | null
        }
        Relationships: []
      }
      mv_reco_proposals: {
        Row: {
          action_type_code: string | null
          body_ar: string | null
          contribution_score: number | null
          contributor_rnk: number | null
          delta_pct: number | null
          dim_key: string | null
          dim_value: string | null
          effort_estimate: string | null
          flag: string | null
          impact_level: string | null
          kpi_key: string | null
          month: string | null
          priority_rnk: number | null
          share_ratio: number | null
          tenant_id: string | null
          title_ar: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          trigger_flag: string | null
          variance_from_overall_pct: number | null
        }
        Relationships: []
      }
      mv_report_kpis_daily: {
        Row: {
          activated_count: number | null
          activation_rate: number | null
          bounces: number | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          completed_count: number | null
          completion_rate: number | null
          ctr: number | null
          date: string | null
          deliveries: number | null
          open_rate: number | null
          opens: number | null
          owner_name: string | null
          reminders: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_default_deprovision_steps: {
        Row: {
          sort_order: number | null
          step_code: string | null
        }
        Relationships: []
      }
      vw_awareness_campaign_insights: {
        Row: {
          active_participants_rate: number | null
          avg_feedback_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          completion_rate: number | null
          completion_rate_pct: number | null
          created_at: string | null
          end_at: string | null
          engagement_rate: number | null
          feedback_coverage_rate: number | null
          open_rate_pct: number | null
          owner_name: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          tenant_id: string | null
          total_completed: number | null
          total_feedback_count: number | null
          total_in_progress: number | null
          total_invited_participants: number | null
          total_opened: number | null
          total_targeted_participants: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_awareness_campaign_kpis: {
        Row: {
          active_days: number | null
          avg_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          completed_count: number | null
          completion_rate: number | null
          end_date: string | null
          overdue_count: number | null
          owner_name: string | null
          start_date: string | null
          started_count: number | null
          started_rate: number | null
          tenant_id: string | null
          total_participants: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_awareness_daily_engagement: {
        Row: {
          avg_score_day: number | null
          campaign_id: string | null
          completed_delta: number | null
          day: string | null
          started_delta: number | null
          tenant_id: string | null
        }
        Relationships: []
      }
      vw_awareness_feedback_insights: {
        Row: {
          avg_feedback_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_status: Database["public"]["Enums"]["campaign_status"] | null
          feedback_with_comments_count: number | null
          first_feedback_at: string | null
          last_feedback_at: string | null
          max_feedback_score: number | null
          min_feedback_score: number | null
          negative_feedback_count: number | null
          neutral_feedback_count: number | null
          positive_feedback_count: number | null
          tenant_id: string | null
          total_feedback_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_awareness_timeseries: {
        Row: {
          campaign_id: string | null
          campaign_name: string | null
          cumulative_completed: number | null
          cumulative_opened: number | null
          daily_avg_feedback_score: number | null
          daily_completed: number | null
          daily_feedback_count: number | null
          daily_opened: number | null
          date_bucket: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awareness_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_campaign_kpis_ctd: {
        Row: {
          activated_count: number | null
          bounced_count: number | null
          campaign_id: string | null
          clicked_count: number | null
          completed_count: number | null
          first_activity_date: string | null
          invited_count: number | null
          kpi_activation_rate: number | null
          kpi_click_rate: number | null
          kpi_completion_rate: number | null
          kpi_open_rate: number | null
          last_activity_date: string | null
          opened_count: number | null
          reminded_count: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_kpi_data_freshness: {
        Row: {
          age_duration: unknown
          age_hours: number | null
          freshness_status: string | null
          kpi_key: string | null
          last_ingest: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      vw_kpi_executive_summary: {
        Row: {
          achievement_rate: number | null
          avg_performance: number | null
          avg_target: number | null
          critical_count: number | null
          last_update: string | null
          module: string | null
          tenant_id: string | null
          total_kpis: number | null
        }
        Relationships: []
      }
      vw_kpi_null_ratio: {
        Row: {
          kpi_key: string | null
          null_count: number | null
          null_ratio_pct: number | null
          null_severity: string | null
          total_records: number | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      vw_kpi_outliers: {
        Row: {
          avg_value: number | null
          baseline_avg: number | null
          baseline_stddev: number | null
          is_outlier: boolean | null
          kpi_key: string | null
          month: string | null
          outlier_severity: string | null
          tenant_id: string | null
          trend_window: Database["public"]["Enums"]["kpi_trend_window"] | null
          z_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_kpi_series_catalog"
            columns: ["kpi_key"]
            isOneToOne: false
            referencedRelation: "kpi_catalog"
            referencedColumns: ["kpi_key"]
          },
        ]
      }
      vw_lms_course_stats: {
        Row: {
          code: string | null
          completion_count: number | null
          completion_rate: number | null
          duration_hours: number | null
          enrollment_count: number | null
          id: string | null
          level: string | null
          name: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_lms_user_progress: {
        Row: {
          course_id: string | null
          course_name: string | null
          enrollment_id: string | null
          enrollment_status: string | null
          lessons_completed: number | null
          lessons_started: number | null
          progress_percentage: number | null
          tenant_id: string | null
          total_time_spent_seconds: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "vw_lms_course_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_report_kpis_ctd: {
        Row: {
          avg_ctr: number | null
          avg_open_rate: number | null
          campaign_id: string | null
          last_date: string | null
          tenant_id: string | null
          total_activated: number | null
          total_bounces: number | null
          total_clicks: number | null
          total_completed: number | null
          total_deliveries: number | null
          total_opens: number | null
          total_reminders: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "awareness_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mv_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_campaign_kpis"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_feedback_insights"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "vw_awareness_timeseries"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_secops_statistics: {
        Row: {
          active_connectors: number | null
          active_playbooks: number | null
          completed_executions_24h: number | null
          connectors_with_errors: number | null
          correlated_event_groups: number | null
          critical_events_24h: number | null
          events_last_24h: number | null
          running_executions: number | null
          tenant_id: string | null
          unprocessed_events: number | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_threat_hunt_dashboard: {
        Row: {
          active_queries: number | null
          last_execution: string | null
          tenant_id: string | null
          total_executions: number | null
          total_matches: number | null
          total_queries: number | null
        }
        Relationships: [
          {
            foreignKeyName: "threat_hunt_queries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_unified_kpis: {
        Row: {
          current_value: number | null
          entity_id: string | null
          entity_name: string | null
          kpi_key: string | null
          kpi_name: string | null
          last_updated: string | null
          metadata: Json | null
          module: string | null
          status: string | null
          target_value: number | null
          tenant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_current_tenant_id: { Args: never; Returns: string }
      app_current_user_id: { Args: never; Returns: string }
      app_has_role: { Args: { _role_code: string }; Returns: boolean }
      auto_assign_incident: { Args: { p_incident_id: string }; Returns: Json }
      calculate_backup_health_score: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      calculate_committee_efficiency: {
        Args: { p_committee_id: string; p_date?: string }
        Returns: number
      }
      calculate_health_score: {
        Args: { p_days_back?: number; p_tenant_id: string }
        Returns: number
      }
      calculate_incident_metrics: {
        Args: { p_incident_id: string }
        Returns: undefined
      }
      calculate_incident_sla: {
        Args: {
          p_created_at: string
          p_incident_type: string
          p_severity: string
          p_tenant_id: string
        }
        Returns: {
          resolution_deadline: string
          response_deadline: string
        }[]
      }
      calculate_overall_health_score: {
        Args: {
          p_adoption: number
          p_compliance: number
          p_data_quality: number
          p_risk_hygiene: number
        }
        Returns: number
      }
      calculate_pitr_stats: {
        Args: {
          p_base_backup_timestamp?: string
          p_target_timestamp: string
          p_tenant_id: string
        }
        Returns: {
          affected_tables: string[]
          delete_count: number
          earliest_change: string
          insert_count: number
          latest_change: string
          total_operations: number
          update_count: number
        }[]
      }
      calculate_playbook_success_rate: {
        Args: { p_playbook_id: string }
        Returns: number
      }
      capture_kpi_snapshot: {
        Args: { p_snapshot_date?: string; p_tenant_id: string }
        Returns: number
      }
      check_sla_breach: {
        Args: { p_incident_id: string }
        Returns: {
          resolution_breached: boolean
          resolution_hours_overdue: number
          response_breached: boolean
          response_minutes_overdue: number
        }[]
      }
      clean_expired_widget_cache: { Args: never; Returns: number }
      cleanup_expired_pitr_snapshots: { Args: never; Returns: number }
      cleanup_old_webhook_logs: { Args: never; Returns: undefined }
      cleanup_old_workflow_executions: {
        Args: { p_days_to_keep?: number; p_tenant_id: string }
        Returns: number
      }
      create_default_audit_workflows: {
        Args: { p_audit_id: string }
        Returns: undefined
      }
      create_pitr_snapshot: {
        Args: {
          p_affected_tables: string[]
          p_created_by: string
          p_restore_log_id?: string
          p_snapshot_name: string
          p_tenant_id: string
        }
        Returns: string
      }
      detect_kpi_alerts: { Args: { p_tenant_id: string }; Returns: number }
      determine_health_status: { Args: { p_score: number }; Returns: string }
      disable_table_fk_constraints: {
        Args: {
          p_rollback_id: string
          p_table_name: string
          p_tenant_id: string
        }
        Returns: number
      }
      escalate_incident: { Args: { p_incident_id: string }; Returns: Json }
      evaluate_automation_conditions: {
        Args: { p_event_data: Json; p_rule_id: string }
        Returns: boolean
      }
      evaluate_custom_kpi: {
        Args: { p_formula_id: string; p_tenant_id: string }
        Returns: number
      }
      execute_pitr_rollback:
        | {
            Args: {
              p_dry_run?: boolean
              p_initiated_by: string
              p_reason: string
              p_snapshot_id: string
              p_tenant_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_initiated_by: string
              p_reason?: string
              p_snapshot_id: string
            }
            Returns: string
          }
      expire_old_recommendations: { Args: never; Returns: undefined }
      fn_action_call_webhook: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_create_action_plan: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_create_task: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_enroll_in_course: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_send_notification: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_trigger_campaign: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_action_update_kpi: {
        Args: { p_action: Json; p_event_payload: Json }
        Returns: undefined
      }
      fn_assign_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_tenant_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      fn_calculate_action_health_score: {
        Args: { p_action_id: string }
        Returns: number
      }
      fn_cancel_scheduled_transition: {
        Args: { p_transition_id: string }
        Returns: boolean
      }
      fn_check_job_dependencies: {
        Args: { p_job_id: string }
        Returns: {
          blocking_jobs: Json
          can_run: boolean
          message: string
        }[]
      }
      fn_create_admin_notification: {
        Args: {
          p_action_type: string
          p_created_by?: string
          p_entity_id?: string
          p_entity_type?: string
          p_message: string
          p_payload?: Json
          p_tenant_id: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      fn_detect_circular_dependency: {
        Args: { p_dependent_job_id: string; p_parent_job_id: string }
        Returns: boolean
      }
      fn_edge_tenant_event_inbound: {
        Args: { p_event: string; p_payload?: Json; p_tenant_id: string }
        Returns: Json
      }
      fn_evaluate_conditions: {
        Args: { p_conditions: Json; p_metadata?: Json; p_payload: Json }
        Returns: boolean
      }
      fn_execute_automation_rule: {
        Args: {
          p_event_id: string
          p_event_metadata?: Json
          p_event_payload: Json
          p_rule_id: string
        }
        Returns: boolean
      }
      fn_gate_e_bulk_delete_rules: {
        Args: { p_rule_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_e_bulk_toggle_rules: {
        Args: { p_is_active: boolean; p_note_ar?: string; p_rule_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_e_bulk_update_severity: {
        Args: { p_note_ar?: string; p_rule_ids: string[]; p_severity: string }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_e_delete_alert_view: {
        Args: { p_view_id: string }
        Returns: boolean
      }
      fn_gate_e_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_e_import_rules: {
        Args: { p_filename: string; p_format: string; p_rules: Json }
        Returns: {
          error_count: number
          errors: Json
          import_id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_e_list_alert_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_e_save_alert_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_f_bulk_delete: {
        Args: { p_policy_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_f_bulk_update_status: {
        Args: { p_new_status: string; p_policy_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_f_delete_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_gate_f_get_bulk_operations: {
        Args: { p_limit?: number }
        Returns: {
          affected_count: number
          completed_at: string
          created_at: string
          errors: Json
          id: string
          operation_type: string
          policy_count: number
          status: string
        }[]
      }
      fn_gate_f_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_f_import_policies: {
        Args: { p_filename: string; p_format: string; p_policies: Json }
        Returns: {
          error_count: number
          errors: Json
          import_id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_f_list_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_f_save_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_h_bulk_assign: {
        Args: {
          p_action_ids: string[]
          p_assignee_user_id: string
          p_note_ar?: string
        }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_h_bulk_delete: {
        Args: { p_action_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_h_bulk_update_status: {
        Args: {
          p_action_ids: string[]
          p_new_status: string
          p_note_ar?: string
        }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_h_delete_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_gate_h_get_dependencies: {
        Args: { p_action_id: string }
        Returns: {
          dependency_type: string
          id: string
          is_active: boolean
          lag_days: number
          notes_ar: string
          source_action_id: string
          source_action_title: string
          target_action_id: string
          target_action_title: string
          violation_status: string
        }[]
      }
      fn_gate_h_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_h_get_milestones: {
        Args: { p_action_id: string }
        Returns: {
          action_id: string
          actual_date: string
          completion_pct: number
          created_at: string
          deliverables: Json
          description_ar: string
          evidence_urls: string[]
          id: string
          milestone_type: string
          planned_date: string
          sequence_order: number
          status: string
          title_ar: string
          updated_at: string
        }[]
      }
      fn_gate_h_get_tracking: {
        Args: { p_action_id: string; p_limit?: number }
        Returns: {
          blockers_count: number
          days_elapsed: number
          days_remaining: number
          health_score: number
          id: string
          is_at_risk: boolean
          is_on_track: boolean
          is_overdue: boolean
          milestones_completed: number
          milestones_total: number
          progress_pct: number
          snapshot_at: string
          velocity_score: number
        }[]
      }
      fn_gate_h_import_actions: {
        Args: { p_actions: Json; p_filename: string; p_format: string }
        Returns: {
          error_count: number
          errors: Json
          import_id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_h_list_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_h_save_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_i_bulk_activate: {
        Args: { p_kpi_ids: string[]; p_note_ar?: string }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_i_bulk_deactivate: {
        Args: { p_kpi_ids: string[]; p_note_ar?: string }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_i_bulk_delete: {
        Args: { p_kpi_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_i_delete_kpi_view: {
        Args: { p_view_id: string }
        Returns: boolean
      }
      fn_gate_i_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_i_import_kpis: {
        Args: { p_filename: string; p_format: string; p_kpis: Json }
        Returns: {
          error_count: number
          errors: Json
          import_id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_i_list_kpi_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_i_save_kpi_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_j_bulk_delete: {
        Args: { p_score_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_j_bulk_recompute: {
        Args: { p_note_ar?: string; p_score_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_j_delete_impact_view: {
        Args: { p_view_id: string }
        Returns: boolean
      }
      fn_gate_j_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_j_import_scores: {
        Args: { p_filename: string; p_format: string; p_scores: Json }
        Returns: {
          error_count: number
          errors: Json
          import_id: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_j_list_impact_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_j_save_impact_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_k_bulk_delete_runs: {
        Args: { p_run_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_k_bulk_toggle_jobs: {
        Args: { p_is_enabled: boolean; p_job_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_k_bulk_trigger_jobs: {
        Args: { p_job_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_k_delete_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_gate_k_get_bulk_operations: {
        Args: { p_limit?: number }
        Returns: {
          affected_count: number
          completed_at: string
          created_at: string
          errors: Json
          id: string
          operation_type: string
          status: string
          target_count: number
        }[]
      }
      fn_gate_k_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          import_type: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_k_list_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_k_save_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_l_bulk_delete: {
        Args: { p_report_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_l_bulk_generate: {
        Args: { p_report_ids: string[] }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_l_bulk_schedule: {
        Args: { p_report_ids: string[]; p_schedule_config: Json }
        Returns: {
          affected_count: number
          errors: Json
          operation_id: string
          status: string
        }[]
      }
      fn_gate_l_delete_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_gate_l_get_bulk_operations: {
        Args: { p_limit?: number }
        Returns: {
          affected_count: number
          completed_at: string
          created_at: string
          errors: Json
          id: string
          operation_type: string
          status: string
          target_count: number
        }[]
      }
      fn_gate_l_get_import_history: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          error_count: number
          errors: Json
          filename: string
          format: string
          id: string
          import_type: string
          status: string
          success_count: number
          total_rows: number
        }[]
      }
      fn_gate_l_list_views: {
        Args: never
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_l_save_view: {
        Args: {
          p_description_ar: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          sort_config: Json
          updated_at: string
          view_name: string
        }[]
      }
      fn_gate_n_get_admin_settings: {
        Args: never
        Returns: {
          created_at: string
          created_by: string
          feature_flags: Json
          id: string
          limits: Json
          notification_channels: Json
          sla_config: Json
          tenant_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      fn_gate_n_get_recent_job_runs: {
        Args: { p_limit?: number }
        Returns: {
          duration_ms: number
          error_message: string
          finished_at: string
          job_key: string
          job_type: string
          run_id: string
          started_at: string
          status: string
          trigger_source: string
          triggered_by_user_id: string
        }[]
      }
      fn_gate_n_get_status_snapshot: { Args: never; Returns: Json }
      fn_gate_n_list_system_jobs:
        | {
            Args: { p_tenant_id?: string }
            Returns: {
              config: Json
              created_at: string
              id: string
              is_enabled: boolean
              job_key: string
              job_type: string
              last_run_at: string
              last_run_status: string
              schedule_cron: string
              tenant_id: string
              updated_at: string
            }[]
          }
        | {
            Args: never
            Returns: {
              config: Json
              created_at: string
              id: string
              is_enabled: boolean
              job_key: string
              job_type: string
              last_run_at: string
              last_run_status: string
              schedule_cron: string
              tenant_id: string
              updated_at: string
            }[]
          }
      fn_gate_n_trigger_job: {
        Args: { p_job_key: string }
        Returns: {
          duration_ms: number
          error_message: string
          finished_at: string
          id: string
          job_id: string
          meta: Json
          result: Json
          started_at: string
          status: string
          tenant_id: string
          trigger_source: string
          triggered_by_user_id: string
        }[]
      }
      fn_gate_n_upsert_admin_settings: {
        Args: {
          p_feature_flags: Json
          p_limits: Json
          p_notification_channels: Json
          p_sla_config: Json
        }
        Returns: {
          created_at: string
          created_by: string
          feature_flags: Json
          id: string
          limits: Json
          notification_channels: Json
          sla_config: Json
          tenant_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      fn_get_event_statistics: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: {
          by_category: Json
          by_priority: Json
          failed_events: number
          processing_events: number
          today_events: number
          total_events: number
        }[]
      }
      fn_get_job_dependency_tree: {
        Args: { p_job_id?: string }
        Returns: {
          dependency_type: string
          is_active: boolean
          job_id: string
          job_key: string
          last_run_status: string
          level: number
          parent_job_id: string
        }[]
      }
      fn_get_role_stats: {
        Args: never
        Returns: {
          role: string
          user_count: number
        }[]
      }
      fn_get_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          roles: string[]
          tenant_id: string
          tenant_name: string
          user_id: string
        }[]
      }
      fn_job_check_tenant_health: { Args: never; Returns: undefined }
      fn_job_detect_drift: { Args: never; Returns: undefined }
      fn_job_process_deprovision: { Args: never; Returns: undefined }
      fn_mark_all_notifications_read: { Args: never; Returns: undefined }
      fn_mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      fn_md_bulk_set_active: {
        Args: { p_active: boolean; p_term_ids: string[] }
        Returns: number
      }
      fn_md_bump_catalog_version: {
        Args: { p_catalog_id: string }
        Returns: number
      }
      fn_md_catalog_id_by_code: { Args: { p_code: string }; Returns: string }
      fn_md_delete_saved_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_md_delete_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_md_export_terms: {
        Args: { p_catalog_id: string; p_include_inactive?: boolean }
        Returns: {
          active: boolean
          attrs: Json
          code: string
          label_ar: string
          label_en: string
          parent_code: string
          sort_order: number
        }[]
      }
      fn_md_get_default_view: { Args: { p_entity_type: string }; Returns: Json }
      fn_md_import_terms_csv: {
        Args: { p_catalog_id: string; p_file_url: string; p_rows: Json }
        Returns: Json
      }
      fn_md_list_saved_views: { Args: { p_entity_type: string }; Returns: Json }
      fn_md_list_views: {
        Args: { p_entity_type: string }
        Returns: {
          created_at: string
          description_ar: string
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          is_owner: boolean
          is_shared: boolean
          owner_id: string
          sort_config: Json
          tenant_id: string
          updated_at: string
          view_name: string
        }[]
      }
      fn_md_lookup_terms: {
        Args: {
          p_catalog_id: string
          p_include_inactive?: boolean
          p_limit?: number
          p_query?: string
        }
        Returns: {
          active: boolean
          attrs: Json
          catalog_id: string
          code: string
          created_at: string
          created_by: string
          id: string
          label_ar: string
          label_en: string
          parent_id: string
          sort_order: number
          updated_at: string
          updated_by: string
        }[]
      }
      fn_md_reorder_terms: {
        Args: { p_term_ids: string[] }
        Returns: undefined
      }
      fn_md_save_saved_view: {
        Args: {
          p_description_ar: string
          p_entity_type: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_id: string
          p_view_name: string
        }
        Returns: Json
      }
      fn_md_save_view: {
        Args: {
          p_description_ar: string
          p_entity_type: string
          p_filters: Json
          p_is_default: boolean
          p_is_shared: boolean
          p_sort_config: Json
          p_view_name: string
        }
        Returns: {
          created_at: string
          description_ar: string
          entity_type: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          owner_id: string
          sort_config: Json
          tenant_id: string
          updated_at: string
          view_name: string
        }[]
      }
      fn_md_set_default_view: { Args: { p_view_id: string }; Returns: boolean }
      fn_md_term_id_by_code: {
        Args: { p_catalog_id: string; p_code: string }
        Returns: string
      }
      fn_md_upsert_mapping: {
        Args: {
          p_catalog_id: string
          p_notes?: string
          p_source_system: string
          p_src_code: string
          p_target_code: string
          p_term_id: string
        }
        Returns: string
      }
      fn_process_event: {
        Args: { p_event_id: string }
        Returns: {
          rules_executed: number
          rules_failed: number
          rules_matched: number
        }[]
      }
      fn_publish_event: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_event_category: string
          p_event_type: string
          p_metadata?: Json
          p_payload?: Json
          p_priority?: string
          p_source_module: string
        }
        Returns: {
          event_id: string
          processed_count: number
          status: string
        }[]
      }
      fn_remove_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_tenant_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      fn_schedule_tenant_transition: {
        Args: {
          p_condition_check?: Json
          p_from_state: string
          p_reason?: string
          p_scheduled_at: string
          p_tenant_id: string
          p_to_state: string
        }
        Returns: string
      }
      fn_tenant_fire_event: {
        Args: { p_event_code: string; p_tenant_id: string }
        Returns: undefined
      }
      fn_tenant_integration_hook: {
        Args: { p_context?: Json; p_event: string; p_tenant_id: string }
        Returns: undefined
      }
      fn_tenant_log_event: {
        Args: {
          p_from_state: string
          p_reason: string
          p_tenant_id: string
          p_to_state: string
          p_triggered_by?: string
        }
        Returns: undefined
      }
      fn_tenant_notify_channels: {
        Args: { p_message: string; p_payload?: Json; p_tenant_id: string }
        Returns: undefined
      }
      fn_tenant_start_deprovision: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      fn_tenant_transition_state: {
        Args: {
          p_reason?: string
          p_tenant_id: string
          p_to_state: string
          p_trigger_source?: string
          p_triggered_by?: string
        }
        Returns: Json
      }
      fn_tenant_update_health: {
        Args: {
          p_details_json?: Json
          p_drift_flag?: string
          p_health_status: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      gate_h_add_update: {
        Args: {
          p_action_id: string
          p_body_ar?: string
          p_evidence_url?: string
          p_new_status?: string
          p_progress_pct?: number
          p_update_type: string
        }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "action_updates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      gate_h_create_from_recommendation: {
        Args: {
          p_assignee_user_id?: string
          p_desc_ar?: string
          p_dim_key?: string
          p_dim_value?: string
          p_due_date?: string
          p_effort?: string
          p_kpi_key?: string
          p_priority?: string
          p_sla_days?: number
          p_source: string
          p_source_reco_id?: string
          p_tags?: string[]
          p_title_ar?: string
        }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "action_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      gate_h_export_actions_csv: {
        Args: {
          p_assignee_id?: string
          p_from_date?: string
          p_overdue_only?: boolean
          p_priorities?: string[]
          p_statuses?: string[]
          p_to_date?: string
        }
        Returns: string
      }
      gate_h_export_actions_json: {
        Args: {
          p_assignee_id?: string
          p_from_date?: string
          p_overdue_only?: boolean
          p_priorities?: string[]
          p_statuses?: string[]
          p_to_date?: string
        }
        Returns: Json
      }
      gate_h_has_demo_actions: { Args: never; Returns: boolean }
      gate_h_list_actions: {
        Args: {
          p_assignee_user_id?: string
          p_overdue_only?: boolean
          p_priority_list?: string[]
          p_statuses?: string[]
        }
        Returns: {
          assignee_user_id: string
          closed_at: string
          created_at: string
          created_by: string
          desc_ar: string
          dim_key: string
          dim_value: string
          due_date: string
          effort: string
          id: string
          kpi_key: string
          owner_user_id: string
          priority: string
          sla_days: number
          source: string
          source_reco_id: string
          status: string
          tags: string[]
          tenant_id: string
          title_ar: string
          updated_at: string
          updated_by: string
          verified_at: string
          verified_by: string
        }[]
      }
      gate_h_list_updates: {
        Args: { p_action_id: string }
        Returns: {
          action_id: string
          body_ar: string
          created_at: string
          created_by: string
          evidence_url: string
          id: string
          new_status: string
          progress_pct: number
          tenant_id: string
          update_type: string
        }[]
      }
      gate_h_seed_demo_actions: { Args: never; Returns: undefined }
      gate_h_update_status: {
        Args: { p_action_id: string; p_new_status: string; p_note_ar?: string }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "action_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      gate_h_verify_and_close: {
        Args: { p_action_id: string; p_verify_note?: string }
        Returns: unknown[]
        SetofOptions: {
          from: "*"
          to: "action_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_incident_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_quarterly_insights: {
        Args: { p_limit?: number; p_quarter: number; p_year: number }
        Returns: {
          created: boolean
          initiatives_count: number
          kpis_count: number
          quarter: number
          year: number
        }[]
      }
      generate_recommendations: {
        Args: { p_limit?: number; p_month?: string }
        Returns: number
      }
      get_active_pitr_snapshots: {
        Args: { p_tenant_id: string }
        Returns: {
          affected_tables: string[]
          can_rollback: boolean
          created_at: string
          snapshot_id: string
          snapshot_name: string
          total_rows: number
        }[]
      }
      get_audit_completion_rate: {
        Args: { p_end_date: string; p_start_date: string; p_tenant_id: string }
        Returns: {
          completed_audits: number
          completion_rate: number
          total_audits: number
        }[]
      }
      get_audit_workflow_progress: {
        Args: { p_audit_id: string }
        Returns: {
          assigned_to: string
          current_stage: string
          due_date: string
          is_overdue: boolean
          progress_pct: number
          status: string
          workflow_type: string
        }[]
      }
      get_avg_finding_closure_time: {
        Args: { p_audit_id?: string; p_tenant_id: string }
        Returns: {
          avg_days: number
          max_days: number
          median_days: number
          min_days: number
        }[]
      }
      get_backup_chain: {
        Args: { p_backup_id: string }
        Returns: {
          backup_name: string
          backup_size_bytes: number
          chain_level: number
          created_at: string
          id: string
          is_incremental: boolean
          job_type: string
          parent_backup_id: string
        }[]
      }
      get_backup_statistics:
        | {
            Args: { p_tenant_id: string }
            Returns: {
              avg_duration_seconds: number
              failed_backups: number
              last_backup_at: string
              next_scheduled_backup: string
              successful_backups: number
              total_backups: number
              total_size_bytes: number
            }[]
          }
        | {
            Args: { p_days_back?: number; p_tenant_id: string }
            Returns: {
              avg_duration_seconds: number
              failed_backups: number
              successful_backups: number
              total_backups: number
              total_size_bytes: number
            }[]
          }
      get_content_analytics: {
        Args: {
          p_content_id?: string
          p_end_date?: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          avg_completion_percentage: number
          content_id: string
          content_title: string
          content_type: string
          engagement_score: number
          total_downloads: number
          total_likes: number
          total_shares: number
          total_views: number
          unique_users: number
        }[]
      }
      get_dr_plan_compliance: { Args: { p_dr_plan_id: string }; Returns: Json }
      get_findings_severity_distribution: {
        Args: { p_audit_id?: string; p_tenant_id: string }
        Returns: {
          count: number
          percentage: number
          severity: string
        }[]
      }
      get_findings_summary: {
        Args: { p_audit_id: string }
        Returns: {
          count: number
          open_count: number
          resolved_count: number
          severity: string
        }[]
      }
      get_integration_health_status: {
        Args: { p_tenant_id: string }
        Returns: {
          connector_id: string
          connector_name: string
          connector_type: string
          error_count: number
          health_status: string
          last_sync_at: string
          status: string
        }[]
      }
      get_knowledge_graph: {
        Args: { p_document_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          relation_type: string
          source_id: string
          strength: number
          target_id: string
        }[]
      }
      get_kpi_monthly_anomalies: {
        Args: {
          p_from_month?: string
          p_kpi_key?: string
          p_to_month?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          avg_value: number
          baseline_months: number
          kpi_key: string
          month: string
          mu: number
          sample_count: number
          sigma: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          zscore: number
        }[]
      }
      get_kpi_monthly_delta: {
        Args: {
          p_from_month?: string
          p_kpi_key?: string
          p_to_month?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          avg_value: number
          delta_pct: number
          kpi_key: string
          month: string
          prev_avg: number
          sample_count: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
        }[]
      }
      get_kpi_monthly_flags: {
        Args: {
          p_flag?: string
          p_from_month?: string
          p_kpi_key?: string
          p_to_month?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          alert_delta: number
          avg_value: number
          control_lower: number
          control_upper: number
          delta_pct: number
          flag: string
          kpi_key: string
          min_sample: number
          month: string
          mu: number
          prev_avg: number
          sample_count: number
          sigma: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          warn_delta: number
          zscore: number
          zscore_alert: number
        }[]
      }
      get_kpi_trends_monthly: {
        Args: {
          p_from_month?: string
          p_kpi_key?: string
          p_to_month?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          anomaly_count: number
          avg_value: number
          delta_pct: number
          kpi_key: string
          max_value: number
          min_value: number
          month: string
          p50_value: number
          p95_value: number
          sample_count: number
          stddev_value: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
        }[]
      }
      get_kpi_trends_quarterly: {
        Args: {
          p_from_quarter?: string
          p_kpi_key?: string
          p_to_quarter?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          anomaly_count: number
          avg_value: number
          delta_pct: number
          kpi_key: string
          max_value: number
          min_value: number
          p50_value: number
          p95_value: number
          quarter_start: string
          sample_count: number
          stddev_value: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
        }[]
      }
      get_kpi_trends_weekly: {
        Args: {
          p_from_week?: string
          p_kpi_key?: string
          p_to_week?: string
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          anomaly_count: number
          avg_value: number
          delta_pct: number
          kpi_key: string
          max_value: number
          min_value: number
          p50_value: number
          p95_value: number
          sample_count: number
          stddev_value: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          week_start: string
        }[]
      }
      get_last_refresh_status: {
        Args: never
        Returns: {
          duration_ms: number
          last_refreshed_at: string
          status: string
          view_name: string
        }[]
      }
      get_next_playbook_step: {
        Args: { p_current_step_id: string; p_execution_status: string }
        Returns: string
      }
      get_pitr_rollback_history: {
        Args: { p_limit?: number; p_tenant_id: string }
        Returns: {
          completed_at: string
          duration_seconds: number
          initiated_by: string
          reason: string
          rollback_id: string
          snapshot_name: string
          started_at: string
          status: string
        }[]
      }
      get_quarterly_insights: {
        Args: { p_quarter?: number; p_year?: number }
        Returns: {
          created_at: string
          created_by: string
          id: string
          kpis_summary: Json
          quarter: number
          quarter_start: string
          tenant_id: string
          top_initiatives: Json
          updated_at: string
          year: number
        }[]
      }
      get_rca_top_contributors: {
        Args: {
          p_dim_key?: string
          p_kpi_key: string
          p_month: string
          p_top_n?: number
          p_trend_window?: Database["public"]["Enums"]["kpi_trend_window"]
        }
        Returns: {
          contribution_score: number
          contributor_rnk: number
          delta_pct: number
          dim_key: string
          dim_value: string
          kpi_key: string
          month: string
          rnk: number
          share_ratio: number
          tenant_id: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          variance_from_overall_pct: number
        }[]
      }
      get_recommendations: {
        Args: { p_kpi_key?: string; p_month?: string; p_status?: string }
        Returns: {
          action_type_code: string
          body_ar: string
          created_at: string
          dim_key: string
          dim_value: string
          effort_estimate: string
          flag: string
          id: number
          impact_level: string
          kpi_key: string
          month: string
          notes: string
          reviewed_at: string
          reviewed_by: string
          source_ref: Json
          status: string
          tenant_id: string
          title_ar: string
          trend_window: Database["public"]["Enums"]["kpi_trend_window"]
          updated_at: string
        }[]
      }
      get_report_kpis_ctd: {
        Args: { p_campaign_id?: string }
        Returns: {
          avg_ctr: number
          avg_open_rate: number
          campaign_id: string
          last_date: string
          tenant_id: string
          total_activated: number
          total_bounces: number
          total_clicks: number
          total_completed: number
          total_deliveries: number
          total_opens: number
          total_reminders: number
        }[]
      }
      get_report_kpis_daily: {
        Args: {
          p_campaign_id?: string
          p_from_date?: string
          p_to_date?: string
        }
        Returns: {
          activated_count: number
          activation_rate: number
          bounces: number
          campaign_id: string
          campaign_name: string
          clicks: number
          completed_count: number
          completion_rate: number
          ctr: number
          date: string
          deliveries: number
          open_rate: number
          opens: number
          owner_name: string
          reminders: number
          tenant_id: string
        }[]
      }
      get_risk_level: { Args: { score: number }; Returns: string }
      get_table_restoration_order: {
        Args: { p_tables: string[] }
        Returns: string[]
      }
      get_threat_statistics: {
        Args: { p_tenant_id: string }
        Returns: {
          active_feeds: number
          critical_indicators: number
          false_positives: number
          high_indicators: number
          recent_matches_24h: number
          total_indicators: number
          total_matches: number
        }[]
      }
      get_transaction_logs_for_pitr: {
        Args: {
          p_base_backup_timestamp?: string
          p_target_timestamp: string
          p_tenant_id: string
        }
        Returns: {
          changed_at: string
          id: string
          new_data: Json
          old_data: Json
          operation: string
          record_id: string
          table_name: string
        }[]
      }
      get_user_role: {
        Args: { _tenant_id?: string; _user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: string
        }[]
      }
      get_user_tenant_admin_tenants: {
        Args: { _user_id: string }
        Returns: {
          tenant_id: string
        }[]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      get_workflow_progress_summary: {
        Args: { p_workflow_id: string }
        Returns: {
          completed_stages: number
          in_progress_stages: number
          pending_stages: number
          progress_percentage: number
          total_stages: number
        }[]
      }
      get_workflow_stage_progress: {
        Args: { p_workflow_id: string }
        Returns: {
          completed_stages: number
          current_stage: string
          progress_pct: number
          total_stages: number
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_role_in_tenant: {
        Args: { _role: string; _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      increment_article_search: {
        Args: { p_article_id: string }
        Returns: undefined
      }
      increment_article_view: {
        Args: { p_article_id: string }
        Returns: undefined
      }
      increment_indicator_match_count: {
        Args: { p_indicator_id: string }
        Returns: undefined
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_view_security_approved: {
        Args: { p_view_name: string }
        Returns: boolean
      }
      log_audit_entry: {
        Args: {
          p_action: string
          p_actor: string
          p_entity_id: string
          p_entity_type: string
          p_payload?: Json
        }
        Returns: string
      }
      log_refresh: {
        Args: {
          p_duration_ms?: number
          p_error_message?: string
          p_status?: string
          p_view_name: string
        }
        Returns: undefined
      }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          article_category: string
          article_id: string
          article_title: string
          chunk_index: number
          chunk_text: string
          document_type: string
          id: string
          similarity: number
        }[]
      }
      match_knowledge_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_document_type?: string
          p_tenant_id?: string
          query_embedding: string
        }
        Returns: {
          category: string
          content_ar: string
          content_en: string
          created_at: string
          document_type: string
          helpful_count: number
          id: string
          is_verified: boolean
          keywords: string[]
          similarity: number
          source_url: string
          summary_ar: string
          summary_en: string
          tags: string[]
          title_ar: string
          title_en: string
          unhelpful_count: number
          updated_at: string
          usefulness_score: number
          views_count: number
        }[]
      }
      match_similar_questions:
        | {
            Args: {
              match_threshold?: number
              p_tenant_id?: string
              query_embedding: string
            }
            Returns: {
              answer: string
              id: string
              question: string
              similarity: number
            }[]
          }
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              p_tenant_id?: string
              query_embedding: string
            }
            Returns: {
              answer_ar: string
              id: string
              question_ar: string
              similarity: number
              was_helpful: boolean
            }[]
          }
      re_enable_table_fk_constraints: {
        Args: { p_rollback_id: string; p_table_name: string }
        Returns: number
      }
      refresh_awareness_views: { Args: never; Returns: undefined }
      refresh_gate_k_views: { Args: never; Returns: undefined }
      refresh_report_views: { Args: never; Returns: undefined }
      restore_table_from_snapshot: {
        Args: {
          p_rollback_id: string
          p_snapshot_id: string
          p_table_name: string
        }
        Returns: Json
      }
      retry_failed_sync_jobs: {
        Args: never
        Returns: {
          connector_id: string
          job_id: string
          retry_count: number
        }[]
      }
      set_default_tenant: { Args: { p_tenant_id: string }; Returns: undefined }
      to_riyadh_date: { Args: { ts: string }; Returns: string }
      update_integration_health: {
        Args: {
          p_connector_id: string
          p_error_message?: string
          p_health_status: string
          p_response_time_ms?: number
        }
        Returns: undefined
      }
      update_secops_backup_metadata: {
        Args: { p_table_name: string; p_tenant_id: string }
        Returns: number
      }
      validate_snapshot_integrity: {
        Args: { p_snapshot_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "analyst"
        | "manager"
        | "viewer"
        | "super_admin"
        | "tenant_admin"
        | "awareness_manager"
        | "risk_manager"
        | "compliance_officer"
        | "hr_manager"
        | "it_manager"
        | "executive"
        | "employee"
        | "platform_admin"
        | "platform_support"
        | "tenant_manager"
        | "tenant_employee"
      campaign_status: "draft" | "active" | "completed"
      committee_notification_type:
        | "meeting_scheduled"
        | "meeting_reminder"
        | "meeting_cancelled"
        | "decision_made"
        | "followup_assigned"
        | "followup_due"
        | "workflow_assigned"
        | "workflow_completed"
        | "member_added"
        | "document_shared"
        | "custom"
      committee_workflow_state:
        | "draft"
        | "in_progress"
        | "review"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
      committee_workflow_type:
        | "meeting_approval"
        | "decision_review"
        | "document_approval"
        | "member_onboarding"
        | "budget_approval"
        | "custom"
      document_status: "draft" | "active" | "archived"
      document_type:
        | "policy"
        | "procedure"
        | "guideline"
        | "report"
        | "awareness_material"
        | "other"
      gate_h_action_effort_enum: "S" | "M" | "L"
      gate_h_action_priority_enum: "low" | "medium" | "high" | "critical"
      gate_h_action_status_enum:
        | "new"
        | "in_progress"
        | "blocked"
        | "verify"
        | "closed"
      gate_h_action_update_type_enum:
        | "comment"
        | "progress"
        | "evidence"
        | "status_change"
      job_status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      job_trigger_source: "system" | "manual" | "api"
      kpi_trend_window: "none" | "W12" | "M6" | "Q4" | "MTD" | "YTD"
      notification_channel: "in_app" | "email" | "sms" | "webhook"
      notification_status: "pending" | "sent" | "delivered" | "read" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "analyst",
        "manager",
        "viewer",
        "super_admin",
        "tenant_admin",
        "awareness_manager",
        "risk_manager",
        "compliance_officer",
        "hr_manager",
        "it_manager",
        "executive",
        "employee",
        "platform_admin",
        "platform_support",
        "tenant_manager",
        "tenant_employee",
      ],
      campaign_status: ["draft", "active", "completed"],
      committee_notification_type: [
        "meeting_scheduled",
        "meeting_reminder",
        "meeting_cancelled",
        "decision_made",
        "followup_assigned",
        "followup_due",
        "workflow_assigned",
        "workflow_completed",
        "member_added",
        "document_shared",
        "custom",
      ],
      committee_workflow_state: [
        "draft",
        "in_progress",
        "review",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
      committee_workflow_type: [
        "meeting_approval",
        "decision_review",
        "document_approval",
        "member_onboarding",
        "budget_approval",
        "custom",
      ],
      document_status: ["draft", "active", "archived"],
      document_type: [
        "policy",
        "procedure",
        "guideline",
        "report",
        "awareness_material",
        "other",
      ],
      gate_h_action_effort_enum: ["S", "M", "L"],
      gate_h_action_priority_enum: ["low", "medium", "high", "critical"],
      gate_h_action_status_enum: [
        "new",
        "in_progress",
        "blocked",
        "verify",
        "closed",
      ],
      gate_h_action_update_type_enum: [
        "comment",
        "progress",
        "evidence",
        "status_change",
      ],
      job_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      job_trigger_source: ["system", "manual", "api"],
      kpi_trend_window: ["none", "W12", "M6", "Q4", "MTD", "YTD"],
      notification_channel: ["in_app", "email", "sms", "webhook"],
      notification_status: ["pending", "sent", "delivered", "read", "failed"],
    },
  },
} as const
