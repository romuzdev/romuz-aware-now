/**
 * Audit Logger - Barrel Export
 * Phase 2: Unified Integration Layer
 */

// Legacy GRC Audit Logger (Audit Module specific) - for backward compatibility
export {
  logGRCAuditAction,
  logAuditRead,
  logStageStart,
  logStageComplete,
  logFindingVerify,
  logAuditExport,
  type GRCAuditLogEntry,
} from './grc-audit-logger';

// NEW: Unified GRC Logger (All GRC modules) - Primary export
export * from './unified-grc-logger';

// NEW: Unified Audit Logger (Cross-module) - Security Enhancement Phase 1
export * from './unified-audit-logger';
