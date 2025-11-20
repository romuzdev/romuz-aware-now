# 📚 M23 - Backup & Recovery API Documentation

**Project:** Romuz Awareness - M23 Backup & Recovery  
**Version:** 1.0.0  
**Last Updated:** 2025-01-19

---

## 🎯 Overview

This document provides complete API documentation for the M23 Backup & Recovery system, including:
- Edge Functions (REST APIs)
- Database Functions (RPC)
- Integration Layer (TypeScript)
- Data Models & Types

---

## 🔐 Authentication

All APIs require authentication via Supabase Auth:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Pass token in Authorization header
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Tenant Isolation:** All APIs automatically filter data by user's tenant via RLS policies.

---

## 📡 Edge Functions

### 1. Backup Creation

**Endpoint:** `POST /functions/v1/backup-create`

**Purpose:** Create a new backup (full, incremental, or snapshot)

**Request:**
```typescript
{
  jobType: 'full' | 'incremental' | 'snapshot';
  backupName?: string;              // Optional custom name
  description?: string;             // Optional description
  tables?: string[];                // Optional: specific tables only
  baseBackupId?: string;            // Required for incremental
}
```

**Response (Success):**
```typescript
{
  success: true;
  jobId: string;                    // UUID of created backup job
  backupName: string;
  estimatedDuration: number;        // seconds
  status: 'pending' | 'in_progress';
}
```

**Response (Error):**
```typescript
{
  success: false;
  error: string;
  details?: string[];
}
```

**Rate Limit:** 10 requests per hour per tenant

**Example:**
```typescript
const { data, error } = await supabase.functions.invoke('backup-create', {
  body: {
    jobType: 'full',
    backupName: 'daily_backup_2025_01_19',
    description: 'Daily full backup'
  }
});
```

---

### 2. Backup Restore

**Endpoint:** `POST /functions/v1/backup-restore`

**Purpose:** Restore data from a backup

**Request:**
```typescript
{
  backupJobId: string;              // UUID of backup to restore from
  tables?: string[];                // Optional: restore specific tables only
  confirmRestore: boolean;          // Must be true
  targetSchema?: string;            // Optional: restore to different schema
}
```

**Response:**
```typescript
{
  success: boolean;
  restoreLogId?: string;            // UUID of restore operation log
  restoredTables?: string[];
  rowsRestored?: number;
  duration?: number;                // seconds
  error?: string;
}
```

**Rate Limit:** 5 requests per hour per tenant

**Example:**
```typescript
const { data } = await supabase.functions.invoke('backup-restore', {
  body: {
    backupJobId: '123e4567-e89b-12d3-a456-426614174000',
    confirmRestore: true
  }
});
```

---

### 3. PITR Restore

**Endpoint:** `POST /functions/v1/pitr-restore`

**Purpose:** Point-in-Time Recovery - restore to specific timestamp

**Request:**
```typescript
{
  targetTimestamp: string;          // ISO 8601 format
  baseBackupId?: string;            // Optional: specific backup to start from
  tables?: string[];                // Optional: specific tables
  dryRun?: boolean;                 // Preview without executing
  confirmRestore: boolean;          // Must be true (unless dryRun)
}
```

**Response:**
```typescript
{
  success: boolean;
  restoreLogId?: string;
  previewChanges?: Record<string, any[]>;  // If dryRun=true
  stats?: {
    totalOperations: number;
    insertCount: number;
    updateCount: number;
    deleteCount: number;
    affectedTables: string[];
  };
  error?: string;
}
```

**Rate Limit:** 3 requests per hour per tenant

**Dry Run Example:**
```typescript
// Preview changes without executing
const { data } = await supabase.functions.invoke('pitr-restore', {
  body: {
    targetTimestamp: '2025-01-19T10:30:00Z',
    dryRun: true,
    confirmRestore: false
  }
});

console.log('Operations to apply:', data.stats);
```

**Execute Example:**
```typescript
// Actually execute restore
const { data } = await supabase.functions.invoke('pitr-restore', {
  body: {
    targetTimestamp: '2025-01-19T10:30:00Z',
    confirmRestore: true
  }
});
```

---

### 4. PITR Rollback

**Endpoint:** `POST /functions/v1/pitr-rollback`

**Purpose:** Rollback a PITR restore operation

**Request:**
```typescript
{
  snapshotId: string;               // UUID of pre-restore snapshot
  reason?: string;                  // Optional: reason for rollback
  dryRun?: boolean;                 // Preview without executing
  confirmRollback: boolean;         // Must be true (unless dryRun)
}
```

**Response:**
```typescript
{
  success: boolean;
  rollbackId?: string;              // UUID of rollback operation
  affectedTables?: string[];
  rowsRestored?: number;
  error?: string;
  warnings?: string[];
}
```

**Rate Limit:** 5 requests per hour per tenant

**Example:**
```typescript
const { data } = await supabase.functions.invoke('pitr-rollback', {
  body: {
    snapshotId: '987fcdeb-51a2-4c3d-b456-426614174000',
    reason: 'Restore caused data inconsistency',
    confirmRollback: true
  }
});
```

---

### 5. Recovery Test Execution

**Endpoint:** `POST /functions/v1/recovery-test`

**Purpose:** Execute disaster recovery test

**Request:**
```typescript
{
  dr_plan_id?: string;              // Optional: test specific DR plan
  backup_job_id?: string;           // Optional: test specific backup
  test_name: string;
  test_type: 'manual' | 'automated' | 'scheduled';
  validation_level: 'basic' | 'full' | 'deep';
}
```

**Response:**
```typescript
{
  success: boolean;
  testId?: string;                  // UUID of test execution
  results?: {
    duration: number;
    issuesFound: number;
    validationsPassed: number;
    recommendations: string[];
  };
  error?: string;
}
```

**Rate Limit:** 20 requests per hour per tenant

---

## 🗄️ Database RPC Functions

### 1. Get Backup Statistics

```typescript
const { data, error } = await supabase.rpc('get_backup_statistics', {
  p_tenant_id: tenantId,
  p_days_back: 30              // Optional, default: 30
});

// Returns:
{
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  total_size_bytes: number;
  avg_duration_seconds: number;
}
```

---

### 2. Calculate Health Score

```typescript
const { data, error } = await supabase.rpc('calculate_health_score', {
  p_tenant_id: tenantId,
  p_days_back: 30              // Optional, default: 30
});

// Returns: number (0-100)
```

---

### 3. Get Backup Chain

```typescript
const { data, error } = await supabase.rpc('get_backup_chain', {
  p_backup_id: backupId
});

// Returns array of backups in chain (full + incrementals)
```

---

### 4. Calculate PITR Stats

```typescript
const { data, error } = await supabase.rpc('calculate_pitr_stats', {
  p_tenant_id: tenantId,
  p_target_timestamp: '2025-01-19T10:00:00Z',
  p_base_backup_timestamp: null    // Optional
});

// Returns:
{
  total_operations: number;
  insert_count: number;
  update_count: number;
  delete_count: number;
  affected_tables: string[];
}
```

---

### 5. Get Active PITR Snapshots

```typescript
const { data, error } = await supabase.rpc('get_active_pitr_snapshots', {
  p_tenant_id: tenantId
});

// Returns array of active snapshots available for rollback
```

---

### 6. Create PITR Snapshot

```typescript
const { data, error } = await supabase.rpc('create_pitr_snapshot', {
  p_tenant_id: tenantId,
  p_snapshot_name: 'pre_restore_snapshot_2025_01_19',
  p_affected_tables: ['table1', 'table2'],
  p_created_by: userId,
  p_restore_log_id: restoreLogId   // Optional
});

// Returns: snapshot_id (UUID)
```

---

### 7. Execute PITR Rollback

```typescript
const { data, error } = await supabase.rpc('execute_pitr_rollback', {
  p_snapshot_id: snapshotId,
  p_initiated_by: userId,
  p_reason: 'Data inconsistency detected'  // Optional
});

// Returns: rollback_id (UUID)
```

---

### 8. Get PITR Rollback History

```typescript
const { data, error } = await supabase.rpc('get_pitr_rollback_history', {
  p_tenant_id: tenantId,
  p_limit: 50                      // Optional, default: 50
});

// Returns array of rollback operations with details
```

---

## 📦 Integration Layer (TypeScript)

### Import

```typescript
import {
  // Backup Functions
  getBackupJobs,
  createBackupJob,
  executeBackup,
  getBackupById,
  
  // Restore Functions
  executeRestore,
  getRestoreLogs,
  
  // PITR Functions
  executePITR,
  getPITRPreview,
  getTransactionLogs,
  getPITRStats,
  executePITRRollback,
  getActivePITRSnapshots,
  
  // DR Functions
  fetchDRPlans,
  createDRPlan,
  executeRecoveryTest,
  fetchHealthSnapshots,
  calculateHealthScore
} from '@/integrations/supabase/backup';
```

### Usage Examples

#### Create Backup
```typescript
const job = await createBackupJob({
  jobType: 'full',
  backupName: 'manual_backup',
  tenantId: currentTenant.id,
  createdBy: currentUser.id
});

await executeBackup(job.id);
```

#### PITR Preview
```typescript
const preview = await getPITRPreview(
  '2025-01-19T10:30:00Z',  // target timestamp
  undefined,                // baseBackupId (optional)
  ['users', 'posts']        // specific tables (optional)
);

console.log('Operations:', preview.stats);
```

#### Execute PITR with Auto-Snapshot
```typescript
// System creates snapshot automatically
const result = await executePITR({
  targetTimestamp: '2025-01-19T10:30:00Z',
  confirmRestore: true
});

if (result.success) {
  console.log('Restore log:', result.restoreLogId);
  console.log('Pre-restore snapshot created automatically');
}
```

#### Rollback PITR
```typescript
// Get active snapshots
const snapshots = await getActivePITRSnapshots();

// Rollback
const rollback = await executePITRRollback(
  snapshots[0].snapshot_id,
  'Restore caused issues',
  false  // dryRun
);
```

---

## 📋 Data Models

### Backup Job
```typescript
interface BackupJob {
  id: string;
  tenant_id: string;
  backup_name: string;
  job_type: 'full' | 'incremental' | 'snapshot';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  created_by: string;
  started_at?: string;
  completed_at?: string;
  backup_size_bytes?: number;
  duration_seconds?: number;
  error_message?: string;
  is_incremental?: boolean;
  base_backup_id?: string;
  parent_backup_id?: string;
  metadata?: Record<string, any>;
}
```

### PITR Snapshot
```typescript
interface PITRSnapshot {
  id: string;
  tenant_id: string;
  restore_log_id?: string;
  snapshot_name: string;
  snapshot_type: 'pre_restore' | 'manual' | 'automated';
  created_at: string;
  created_by: string;
  expires_at?: string;
  snapshot_data: Record<string, any>;
  affected_tables: string[];
  total_rows_count?: number;
  is_rolled_back: boolean;
  rolled_back_at?: string;
  status: 'active' | 'expired' | 'rolled_back' | 'archived';
}
```

### DR Plan
```typescript
interface DisasterRecoveryPlan {
  id: string;
  tenant_id: string;
  plan_name: string;
  description?: string;
  rto_minutes: number;        // Recovery Time Objective
  rpo_minutes: number;        // Recovery Point Objective
  backup_frequency: string;
  backup_types: string[];
  retention_days: number;
  test_frequency: string;
  next_test_date?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}
```

---

## ⚠️ Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_REQUIRED` | Authentication required | Missing or invalid auth token |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Too many requests |
| `VALIDATION_FAILED` | Validation failed | Invalid input parameters |
| `TENANT_NOT_FOUND` | Tenant not found | User not associated with tenant |
| `BACKUP_NOT_FOUND` | Backup not found | Backup job doesn't exist |
| `SNAPSHOT_NOT_FOUND` | Snapshot not found | PITR snapshot doesn't exist |
| `RESTORE_IN_PROGRESS` | Restore in progress | Another restore is running |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | User lacks required role |

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `backup-create` | 10 requests | 1 hour |
| `backup-restore` | 5 requests | 1 hour |
| `pitr-restore` | 3 requests | 1 hour |
| `pitr-rollback` | 5 requests | 1 hour |
| `recovery-test` | 20 requests | 1 hour |

**Headers:**
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp of reset
- `Retry-After`: Seconds until reset (on 429 error)

---

## 🔧 Best Practices

### 1. Always Use Dry Run First
```typescript
// Preview PITR before executing
const preview = await getPITRPreview(targetTimestamp);
if (preview.stats.totalOperations > 1000) {
  console.warn('Large restore operation!');
  // Ask for user confirmation
}

// Then execute
const result = await executePITR({
  targetTimestamp,
  confirmRestore: true
});
```

### 2. Monitor Backup Health
```typescript
// Check health regularly
const score = await calculateHealthScore(tenantId);
if (score < 70) {
  // Alert administrators
  console.error('Backup health degraded!', score);
}
```

### 3. Test DR Plans Regularly
```typescript
// Schedule automated tests
await executeRecoveryTest({
  dr_plan_id: planId,
  test_type: 'automated',
  test_name: 'monthly_dr_test',
  validation_level: 'full'
});
```

---

**Last Updated:** 2025-01-19  
**Version:** 1.0.0  
**Maintainer:** Romuz Awareness Team
