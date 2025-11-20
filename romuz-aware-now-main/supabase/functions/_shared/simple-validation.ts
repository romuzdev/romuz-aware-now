/**
 * ============================================================================
 * M23 - Simple Input Validation (No External Dependencies)
 * Purpose: Lightweight validation for Edge Functions
 * Security: Prevent injection attacks
 * ============================================================================
 */

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface SimpleValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Common Validators
// ============================================================================

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validate timestamp format (ISO 8601)
 */
export function isValidTimestamp(value: string): boolean {
  try {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
  } catch {
    return false;
  }
}

/**
 * Validate table name (PostgreSQL compatible)
 */
export function isValidTableName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 63) return false;
  return /^[a-z_][a-z0-9_]*$/.test(name);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 255) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate backup name
 */
export function isValidBackupName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 100) return false;
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// ============================================================================
// Request Validators
// ============================================================================

export interface BackupRequest {
  jobType: 'full' | 'incremental' | 'snapshot';
  backupName?: string;
  description?: string;
  tables?: string[];
}

export function validateBackupRequest(body: any): ValidationResult<BackupRequest> {
  const errors: string[] = [];

  // Validate jobType
  if (!body.jobType) {
    errors.push('jobType is required');
  } else if (!['full', 'incremental', 'snapshot'].includes(body.jobType)) {
    errors.push('jobType must be: full, incremental, or snapshot');
  }

  // Validate backupName (optional)
  if (body.backupName && !isValidBackupName(body.backupName)) {
    errors.push('Invalid backupName: must be 3-100 chars, alphanumeric with - and _');
  }

  // Validate description (optional)
  if (body.description && body.description.length > 500) {
    errors.push('description too long (max 500 chars)');
  }

  // Validate tables array (optional)
  if (body.tables) {
    if (!Array.isArray(body.tables)) {
      errors.push('tables must be an array');
    } else if (body.tables.length > 50) {
      errors.push('too many tables (max 50)');
    } else {
      const invalidTables = body.tables.filter((t: any) => !isValidTableName(t));
      if (invalidTables.length > 0) {
        errors.push(`Invalid table names: ${invalidTables.join(', ')}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }

  return {
    success: true,
    data: {
      jobType: body.jobType,
      backupName: body.backupName,
      description: body.description,
      tables: body.tables
    }
  };
}

// ============================================================================
// Restore Request Validation
// ============================================================================

export interface RestoreRequest {
  backupJobId: string;
  restoreType: 'full' | 'partial';
  tables?: string[];
  confirmRestore: boolean;
}

export function validateRestoreRequest(body: any): ValidationResult<RestoreRequest> {
  const errors: string[] = [];

  // Validate backupJobId
  if (!body.backupJobId) {
    errors.push('backupJobId is required');
  } else if (!isValidUUID(body.backupJobId)) {
    errors.push('Invalid backupJobId (must be UUID)');
  }

  // Validate restoreType
  if (!body.restoreType) {
    errors.push('restoreType is required');
  } else if (!['full', 'partial'].includes(body.restoreType)) {
    errors.push('restoreType must be: full or partial');
  }

  // Validate tables (required for partial restore)
  if (body.restoreType === 'partial') {
    if (!body.tables || !Array.isArray(body.tables) || body.tables.length === 0) {
      errors.push('tables array is required for partial restore');
    } else if (body.tables.length > 50) {
      errors.push('too many tables (max 50)');
    } else {
      const invalidTables = body.tables.filter((t: any) => !isValidTableName(t));
      if (invalidTables.length > 0) {
        errors.push(`Invalid table names: ${invalidTables.join(', ')}`);
      }
    }
  }

  // Validate confirmRestore
  if (typeof body.confirmRestore !== 'boolean') {
    errors.push('confirmRestore must be boolean');
  } else if (body.confirmRestore !== true) {
    errors.push('confirmRestore must be true to proceed');
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }

  return {
    success: true,
    data: {
      backupJobId: body.backupJobId,
      restoreType: body.restoreType,
      tables: body.tables,
      confirmRestore: body.confirmRestore
    }
  };
}

// ============================================================================
// PITR Request Validation
// ============================================================================

export interface PITRRequest {
  targetTimestamp: string;
  baseBackupId?: string;
  dryRun?: boolean;
  tables?: string[];
  confirmRestore: boolean;
}

export function validatePITRRequest(body: any): ValidationResult<PITRRequest> {
  const errors: string[] = [];

  // Validate targetTimestamp
  if (!body.targetTimestamp) {
    errors.push('targetTimestamp is required');
  } else if (!isValidTimestamp(body.targetTimestamp)) {
    errors.push('Invalid targetTimestamp format (must be ISO 8601)');
  } else {
    const targetDate = new Date(body.targetTimestamp);
    const now = new Date();
    
    if (targetDate > now) {
      errors.push('Cannot restore to future date');
    }
    
    const daysDiff = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 90) {
      errors.push('Cannot restore beyond 90 days ago');
    }
  }

  // Validate baseBackupId (optional)
  if (body.baseBackupId && !isValidUUID(body.baseBackupId)) {
    errors.push('Invalid baseBackupId (must be UUID)');
  }

  // Validate tables (optional)
  if (body.tables) {
    if (!Array.isArray(body.tables)) {
      errors.push('tables must be an array');
    } else if (body.tables.length > 50) {
      errors.push('too many tables (max 50)');
    } else {
      const invalidTables = body.tables.filter((t: any) => !isValidTableName(t));
      if (invalidTables.length > 0) {
        errors.push(`Invalid table names: ${invalidTables.join(', ')}`);
      }
    }
  }

  // Validate confirmRestore
  if (typeof body.confirmRestore !== 'boolean') {
    errors.push('confirmRestore must be boolean');
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }

  return {
    success: true,
    data: {
      targetTimestamp: body.targetTimestamp,
      baseBackupId: body.baseBackupId,
      dryRun: body.dryRun || false,
      tables: body.tables,
      confirmRestore: body.confirmRestore
    }
  };
}

// ============================================================================
// Recovery Test Request Validation
// ============================================================================

export interface RecoveryTestRequest {
  dr_plan_id?: string;
  backup_job_id?: string;
  test_name: string;
  test_type: 'manual' | 'automated' | 'scheduled';
  validation_level: 'basic' | 'full' | 'deep';
}

export function validateRecoveryTestRequest(body: any): ValidationResult<RecoveryTestRequest> {
  const errors: string[] = [];

  // Validate dr_plan_id (optional)
  if (body.dr_plan_id && !isValidUUID(body.dr_plan_id)) {
    errors.push('Invalid dr_plan_id (must be UUID)');
  }

  // Validate backup_job_id (optional)
  if (body.backup_job_id && !isValidUUID(body.backup_job_id)) {
    errors.push('Invalid backup_job_id (must be UUID)');
  }

  // Validate test_name
  if (!body.test_name) {
    errors.push('test_name is required');
  } else if (body.test_name.length < 3 || body.test_name.length > 200) {
    errors.push('test_name must be 3-200 characters');
  }

  // Validate test_type
  if (!body.test_type) {
    errors.push('test_type is required');
  } else if (!['manual', 'automated', 'scheduled'].includes(body.test_type)) {
    errors.push('test_type must be: manual, automated, or scheduled');
  }

  // Validate validation_level
  if (!body.validation_level) {
    errors.push('validation_level is required');
  } else if (!['basic', 'full', 'deep'].includes(body.validation_level)) {
    errors.push('validation_level must be: basic, full, or deep');
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Validation failed',
      details: errors
    };
  }

  return {
    success: true,
    data: {
      dr_plan_id: body.dr_plan_id,
      backup_job_id: body.backup_job_id,
      test_name: body.test_name,
      test_type: body.test_type,
      validation_level: body.validation_level
    }
  };
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize string (remove dangerous characters)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove HTML tags
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: string[], maxLength: number = 100): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(s => typeof s === 'string')
    .map(s => sanitizeString(s, maxLength));
}

// ============================================================================
// Rollback Request Validation
// ============================================================================

export interface RollbackRequest {
  snapshotId: string;
  reason?: string;
  confirmRollback: boolean;
  dryRun?: boolean;
}

export function validateRollbackRequest(body: any): SimpleValidationResult {
  const errors: string[] = [];

  // Validate snapshotId
  if (!body.snapshotId) {
    errors.push('snapshotId is required');
  } else if (!isValidUUID(body.snapshotId)) {
    errors.push('Invalid snapshotId (must be UUID)');
  }

  // Validate confirmation (unless dry run)
  if (!body.dryRun && body.confirmRollback !== true) {
    errors.push('confirmRollback must be true or dryRun must be true');
  }

  // Validate reason (optional)
  if (body.reason && body.reason.length > 500) {
    errors.push('reason too long (max 500 chars)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

