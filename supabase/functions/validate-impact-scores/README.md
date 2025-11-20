# Validate Impact Scores Edge Function

Gate-J Part 4.1: Validation Framework

## Overview

This Edge Function implements the validation framework for the Awareness Impact Engine. It provides two main jobs:

1. **Collect Validation Data**: Fetches computed impact scores and compares them with real organizational metrics (HR behavioral data and Compliance findings).
2. **Evaluate Validation Results**: Analyzes validation gaps and updates validation status based on predefined thresholds.

## Actions

### 1. Collect (`action: 'collect'`)

Pulls recent impact scores and compares them with HR/Compliance data.

**Request Body:**
```json
{
  "action": "collect",
  "tenantId": "uuid",
  "periodYear": 2025,
  "periodMonth": 3,
  "lookbackMonths": 3
}
```

**Process:**
1. Generates period range (current + lookback months)
2. For each period:
   - Fetches computed impact scores
   - Fetches mock HR behavioral scores
   - Fetches mock Compliance alignment scores
   - Calculates validation gap
   - Upserts validation record

**Response:**
```json
{
  "success": true,
  "processedCount": 45,
  "insertedCount": 30,
  "updatedCount": 15,
  "skippedCount": 0,
  "errors": []
}
```

### 2. Evaluate (`action: 'evaluate'`)

Evaluates pending validations and updates their status based on gap thresholds.

**Request Body:**
```json
{
  "action": "evaluate",
  "tenantId": "uuid",
  "periodYear": 2025,
  "periodMonth": 3
}
```

**Validation Status Logic:**
- `validation_gap <= 10` → `validated` (score is accurate)
- `10 < validation_gap < 25` → `anomaly` (needs investigation)
- `validation_gap >= 25` → `calibrated` (requires weight tuning)

**Response:**
```json
{
  "success": true,
  "processedCount": 45,
  "insertedCount": 0,
  "updatedCount": 45,
  "skippedCount": 0,
  "errors": []
}
```

## Authentication

Requires JWT authentication. Set `Authorization: Bearer <token>` header.

## Data Sources

### Current Implementation (v1)
- **HR Behavioral Score**: Mock data generator (60-100 range)
- **Compliance Alignment Score**: Mock data generator (70-100 range)

### Future Implementation (v2+)
Replace mock functions with real integrations:
- HR system API for behavioral metrics
- Compliance management system for findings
- Risk management system for incident counts

## Usage Examples

### Client-Side (TypeScript)
```typescript
import { supabase } from '@/integrations/supabase/client';

// Collect validation data
const { data, error } = await supabase.functions.invoke('validate-impact-scores', {
  body: {
    action: 'collect',
    tenantId: 'tenant-uuid',
    periodYear: 2025,
    periodMonth: 3,
    lookbackMonths: 3,
  },
});

// Evaluate validation results
const { data, error } = await supabase.functions.invoke('validate-impact-scores', {
  body: {
    action: 'evaluate',
    tenantId: 'tenant-uuid',
    periodYear: 2025,
    periodMonth: 3,
  },
});
```

### Service Layer
```typescript
import { collectValidationData, evaluateValidationResults } from '@/services/validationService';

// Collect validation data
const result = await collectValidationData({
  tenantId: 'tenant-uuid',
  periodYear: 2025,
  periodMonth: 3,
  lookbackMonths: 3,
});

// Evaluate validation results
const evalResult = await evaluateValidationResults({
  tenantId: 'tenant-uuid',
  periodYear: 2025,
  periodMonth: 3,
});
```

## Error Handling

- Graceful error handling per org unit (one failure doesn't stop batch)
- Detailed error messages in response
- Comprehensive logging for debugging

## Monitoring

Check logs for:
- `[Collect]` prefix for collection job logs
- `[Evaluate]` prefix for evaluation job logs
- Summary statistics after each job run

## TODO

- [ ] Replace mock HR data with real HR system integration
- [ ] Replace mock Compliance data with real Compliance system integration
- [ ] Add retry logic for failed validations
- [ ] Implement batch size limits for large tenants
- [ ] Add scheduled cron job for monthly validation runs
- [ ] Implement notification system for anomalies
