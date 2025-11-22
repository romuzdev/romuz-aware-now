/**
 * Audit Log Service (Legacy)
 * 
 * @deprecated Use unified-audit-logger from @/lib/audit instead
 * This file is kept for backward compatibility
 */

// Re-export from unified audit logger
export {
  logAudit as logAuditAction,
  logCommitteeAction,
  logMeetingAction,
  logDecisionAction,
  logFollowupAction,
} from '@/lib/audit/unified-audit-logger';
