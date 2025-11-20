/**
 * Cross-App Workflows
 * 
 * Pre-configured workflows that integrate multiple applications
 * through the Event System
 */

import type { EventCategory } from '../event.types';

export interface WorkflowStep {
  id: string;
  name: string;
  module: string;
  event_type: string;
  event_category: EventCategory;
  action_type: string;
  config: Record<string, any>;
  triggers_next?: boolean;
}

export interface CrossAppWorkflow {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  trigger_module: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
}

/**
 * Workflow 1: New User Onboarding
 * Trigger: Admin creates user → LMS enrollment → Awareness campaign → Welcome email
 */
export const newUserOnboardingWorkflow: CrossAppWorkflow = {
  id: 'workflow_new_user_onboarding',
  name: 'New User Onboarding',
  description: 'Automatically enroll new users in mandatory training and awareness campaigns',
  trigger_event: 'user_account_created',
  trigger_module: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
  steps: [
    {
      id: 'step_1_enroll_mandatory_courses',
      name: 'Enroll in Mandatory Courses',
      module: 'lms',
      event_type: 'student_enrolled',
      event_category: 'training',
      action_type: 'enroll_in_course',
      config: {
        course_filter: { is_mandatory: true },
        enrollment_type: 'mandatory',
      },
      triggers_next: true,
    },
    {
      id: 'step_2_add_to_awareness_campaigns',
      name: 'Add to Active Awareness Campaigns',
      module: 'awareness_app',
      event_type: 'participant_enrolled',
      event_category: 'awareness',
      action_type: 'trigger_campaign',
      config: {
        campaign_filter: { status: 'active', is_required: true },
      },
      triggers_next: true,
    },
    {
      id: 'step_3_send_welcome_email',
      name: 'Send Welcome Email',
      module: 'platform',
      event_type: 'notification_sent',
      event_category: 'platform',
      action_type: 'send_email',
      config: {
        template: 'user_welcome',
        variables: {
          user_name: '{{user.name}}',
          login_url: '{{platform.login_url}}',
          support_email: '{{platform.support_email}}',
        },
      },
    },
  ],
};

/**
 * Workflow 2: Phishing Failure Remediation
 * Trigger: User clicks phishing link → Assign remedial training → Create action plan → Notify manager
 */
export const phishingFailureRemediationWorkflow: CrossAppWorkflow = {
  id: 'workflow_phishing_remediation',
  name: 'Phishing Failure Remediation',
  description: 'Automatically assign remedial training to users who fail phishing simulations',
  trigger_event: 'user_clicked_phishing_link',
  trigger_module: 'phishing_app',
  is_active: true,
  created_at: new Date().toISOString(),
  steps: [
    {
      id: 'step_1_enroll_remedial_training',
      name: 'Enroll in Remedial Training',
      module: 'lms',
      event_type: 'student_enrolled',
      event_category: 'training',
      action_type: 'enroll_in_course',
      config: {
        course_filter: { category: 'phishing_awareness', level: 'remedial' },
        enrollment_type: 'assigned',
        due_days: 7,
      },
      triggers_next: true,
    },
    {
      id: 'step_2_create_action_plan',
      name: 'Create Follow-up Action Plan',
      module: 'grc',
      event_type: 'action_created',
      event_category: 'action',
      action_type: 'create_action_plan',
      config: {
        title: 'Phishing Awareness Follow-up',
        priority: 'high',
        owner: '{{user.manager_id}}',
        due_days: 14,
      },
      triggers_next: true,
    },
    {
      id: 'step_3_notify_manager',
      name: 'Notify Manager',
      module: 'platform',
      event_type: 'notification_sent',
      event_category: 'platform',
      action_type: 'send_notification',
      config: {
        recipient: '{{user.manager_id}}',
        channel: 'email',
        template: 'phishing_failure_manager_alert',
        variables: {
          employee_name: '{{user.name}}',
          campaign_name: '{{campaign.name}}',
          remedial_course: '{{course.title}}',
        },
      },
    },
  ],
};

/**
 * Workflow 3: Policy Update Cascade
 * Trigger: Policy approved → Update training materials → Notify affected users → Track acknowledgements
 */
export const policyUpdateCascadeWorkflow: CrossAppWorkflow = {
  id: 'workflow_policy_update_cascade',
  name: 'Policy Update Cascade',
  description: 'Cascade policy updates across training, awareness, and user notifications',
  trigger_event: 'policy_approved',
  trigger_module: 'grc',
  is_active: true,
  created_at: new Date().toISOString(),
  steps: [
    {
      id: 'step_1_update_training_content',
      name: 'Update Related Training Content',
      module: 'lms',
      event_type: 'course_updated',
      event_category: 'training',
      action_type: 'update_record',
      config: {
        target_entity: 'courses',
        filter: { policy_id: '{{policy.id}}' },
        updates: {
          content_version: '{{policy.version}}',
          last_updated: '{{now}}',
        },
      },
      triggers_next: true,
    },
    {
      id: 'step_2_create_awareness_campaign',
      name: 'Create Policy Awareness Campaign',
      module: 'awareness_app',
      event_type: 'campaign_created',
      event_category: 'awareness',
      action_type: 'trigger_campaign',
      config: {
        template: 'policy_update',
        name: 'Policy Update: {{policy.title}}',
        target_filter: { department: '{{policy.affected_departments}}' },
      },
      triggers_next: true,
    },
    {
      id: 'step_3_send_user_notifications',
      name: 'Send User Notifications',
      module: 'platform',
      event_type: 'notification_sent',
      event_category: 'platform',
      action_type: 'send_notification',
      config: {
        recipient_filter: { affected_by_policy: '{{policy.id}}' },
        channel: ['email', 'in_app'],
        template: 'policy_update_notification',
        variables: {
          policy_title: '{{policy.title}}',
          effective_date: '{{policy.effective_date}}',
          acknowledgement_required: true,
        },
      },
    },
  ],
};

/**
 * Workflow 4: Risk-Based Training Assignment
 * Trigger: High-risk identified → Assess user competencies → Assign targeted training → Schedule follow-up
 */
export const riskBasedTrainingWorkflow: CrossAppWorkflow = {
  id: 'workflow_risk_based_training',
  name: 'Risk-Based Training Assignment',
  description: 'Automatically assign training based on identified risks and user roles',
  trigger_event: 'risk_identified',
  trigger_module: 'grc',
  is_active: true,
  created_at: new Date().toISOString(),
  steps: [
    {
      id: 'step_1_identify_affected_users',
      name: 'Identify Affected Users',
      module: 'admin',
      event_type: 'user_list_generated',
      event_category: 'admin',
      action_type: 'call_webhook',
      config: {
        url: '/api/users/filter-by-risk',
        method: 'POST',
        body: {
          risk_id: '{{risk.id}}',
          risk_category: '{{risk.category}}',
        },
      },
      triggers_next: true,
    },
    {
      id: 'step_2_assign_relevant_courses',
      name: 'Assign Relevant Courses',
      module: 'lms',
      event_type: 'bulk_enrollment_created',
      event_category: 'training',
      action_type: 'enroll_in_course',
      config: {
        course_filter: { risk_category: '{{risk.category}}' },
        user_list: '{{step_1.user_ids}}',
        enrollment_type: 'assigned',
        priority: '{{risk.severity}}',
      },
      triggers_next: true,
    },
    {
      id: 'step_3_create_follow_up_action',
      name: 'Create Follow-up Action',
      module: 'grc',
      event_type: 'action_created',
      event_category: 'action',
      action_type: 'create_action_plan',
      config: {
        title: 'Monitor Risk Training Completion',
        priority: '{{risk.severity}}',
        owner: '{{risk.owner}}',
        due_days: 30,
        checklist: [
          'Verify 100% enrollment',
          'Track completion rate weekly',
          'Review assessment scores',
          'Schedule remediation if needed',
        ],
      },
    },
  ],
};

/**
 * Workflow 5: Certificate Expiration Management
 * Trigger: Certificate near expiry → Send reminder → Auto-enroll in renewal course → Update KPIs
 */
export const certificateExpirationWorkflow: CrossAppWorkflow = {
  id: 'workflow_certificate_expiration',
  name: 'Certificate Expiration Management',
  description: 'Proactively manage certificate renewals and track compliance',
  trigger_event: 'certificate_expiring_soon',
  trigger_module: 'lms',
  is_active: true,
  created_at: new Date().toISOString(),
  steps: [
    {
      id: 'step_1_send_expiration_reminder',
      name: 'Send Expiration Reminder',
      module: 'platform',
      event_type: 'notification_sent',
      event_category: 'platform',
      action_type: 'send_notification',
      config: {
        recipient: '{{certificate.user_id}}',
        channel: ['email', 'in_app'],
        template: 'certificate_expiration_reminder',
        variables: {
          certificate_name: '{{certificate.course_name}}',
          expiry_date: '{{certificate.expiry_date}}',
          days_remaining: '{{certificate.days_until_expiry}}',
        },
      },
      triggers_next: true,
    },
    {
      id: 'step_2_enroll_renewal_course',
      name: 'Enroll in Renewal Course',
      module: 'lms',
      event_type: 'student_enrolled',
      event_category: 'training',
      action_type: 'enroll_in_course',
      config: {
        course_filter: { is_renewal: true, parent_course: '{{certificate.course_id}}' },
        user_id: '{{certificate.user_id}}',
        enrollment_type: 'mandatory',
        due_date: '{{certificate.expiry_date}}',
      },
      triggers_next: true,
    },
    {
      id: 'step_3_update_compliance_kpi',
      name: 'Update Compliance KPI',
      module: 'grc',
      event_type: 'kpi_updated',
      event_category: 'kpi',
      action_type: 'update_kpi',
      config: {
        kpi_code: 'certificate_compliance_rate',
        org_unit: '{{certificate.user_department}}',
        recalculate: true,
      },
    },
  ],
};

/**
 * Export all workflows
 */
export const crossAppWorkflows: CrossAppWorkflow[] = [
  newUserOnboardingWorkflow,
  phishingFailureRemediationWorkflow,
  policyUpdateCascadeWorkflow,
  riskBasedTrainingWorkflow,
  certificateExpirationWorkflow,
];

/**
 * Get workflow by ID
 */
export function getWorkflowById(workflowId: string): CrossAppWorkflow | undefined {
  return crossAppWorkflows.find(w => w.id === workflowId);
}

/**
 * Get workflows by trigger event
 */
export function getWorkflowsByTrigger(eventType: string): CrossAppWorkflow[] {
  return crossAppWorkflows.filter(w => w.trigger_event === eventType && w.is_active);
}
