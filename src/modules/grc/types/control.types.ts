/**
 * GRC Module - Control Management Types
 * Types for Control Library and Control Testing
 */

import type { Database } from '@/integrations/supabase/types';

// Database table types
export type Control = Database['public']['Tables']['grc_controls']['Row'];
export type ControlTest = Database['public']['Tables']['grc_control_tests']['Row'];

// Input types for creating/updating
export type CreateControlInput = Database['public']['Tables']['grc_controls']['Insert'];
export type UpdateControlInput = Database['public']['Tables']['grc_controls']['Update'];
export type CreateControlTestInput = Database['public']['Tables']['grc_control_tests']['Insert'];
export type UpdateControlTestInput = Database['public']['Tables']['grc_control_tests']['Update'];

// Control with related data
export interface ControlWithDetails extends Control {
  latest_test?: ControlTest;
  test_history?: ControlTest[];
  total_tests?: number;
  failed_tests?: number;
  passed_tests?: number;
}

// Filter types
export interface ControlFilters {
  q?: string;
  control_type?: string;
  control_category?: string;
  control_nature?: string;
  control_status?: string;
  effectiveness_rating?: string;
  maturity_level?: string;
  control_owner_id?: string;
  tags?: string[];
  linked_risk_ids?: string[];
  testing_frequency?: string;
  from?: string;
  to?: string;
  is_active?: boolean;
  sortBy?: 'control_code' | 'control_title' | 'created_at' | 'updated_at' | 'next_test_date' | 'effectiveness_rating';
  sortDir?: 'asc' | 'desc';
}

export interface ControlTestFilters {
  q?: string;
  control_id?: string;
  test_type?: string;
  test_method?: string;
  test_result?: string;
  effectiveness_conclusion?: string;
  remediation_status?: string;
  tested_by?: string;
  from?: string;
  to?: string;
  sortBy?: 'test_date' | 'test_code' | 'test_result' | 'created_at';
  sortDir?: 'asc' | 'desc';
}

// Statistics types
export interface ControlStatistics {
  total_controls: number;
  active_controls: number;
  by_type: {
    preventive: number;
    detective: number;
    corrective: number;
    directive: number;
  };
  by_category: {
    access_control: number;
    data_protection: number;
    physical_security: number;
    operational: number;
    technical: number;
    administrative: number;
    compliance: number;
  };
  by_effectiveness: {
    not_tested: number;
    ineffective: number;
    partially_effective: number;
    effective: number;
    highly_effective: number;
  };
  by_nature: {
    manual: number;
    automated: number;
    hybrid: number;
  };
  controls_needing_test: number;
  overdue_tests: number;
  average_effectiveness_score: number;
}

export interface ControlTestStatistics {
  total_tests: number;
  tests_this_month: number;
  by_result: {
    passed: number;
    passed_with_exceptions: number;
    failed: number;
    not_applicable: number;
  };
  by_type: {
    design: number;
    operating_effectiveness: number;
    compliance: number;
    walkthrough: number;
  };
  requiring_remediation: number;
  remediation_completed: number;
  remediation_overdue: number;
  pass_rate: number;
}
