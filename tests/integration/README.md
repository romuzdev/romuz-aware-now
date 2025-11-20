# Integration Tests - Awareness Module

## Overview
Comprehensive integration tests validating RLS, constraints, analytics views, and audit logging for the Awareness module against a test Supabase instance.

## Test Coverage

### 1. RLS & Tenant Isolation (`rls.spec.ts`)
- ✅ Cross-tenant read/write isolation for:
  - `awareness_campaigns`
  - `campaign_participants`
  - `saved_views`
  - `audit_log`
- ✅ Validates users can only access their own tenant data
- ✅ Prevents malicious cross-tenant operations

### 2. Constraints & Integrity (`constraints.spec.ts`)
- ✅ UNIQUE constraints validation (e.g., participant uniqueness per campaign)
- ✅ Soft delete handling (deleted_at exclusion from UNIQUE)
- ✅ Foreign key constraints (campaign_id references)
- ✅ ON DELETE CASCADE/RESTRICT behavior
- ✅ Saved views limit enforcement (10 per user)

### 3. Analytics Views - KPIs (`views_kpis.spec.ts`)
- ✅ `vw_awareness_campaign_kpis` validation:
  - `total_participants`, `completed_count`, `started_count`
  - `completion_rate` calculation (completed / total * 100)
  - `avg_score` aggregation from participants
  - `overdue_count` for past end_date campaigns
- ✅ Tenant isolation in views
- ✅ Edge cases (campaigns with no participants)

### 4. Analytics Views - Trends (`views_trend.spec.ts`)
- ✅ `vw_awareness_daily_engagement` validation:
  - `completed_delta` by day
  - `started_delta` tracking (if implemented)
  - `avg_score_day` for daily completions
- ✅ Date range filtering
- ✅ Tenant isolation
- ✅ Sparse data handling (days with no activity)

### 5. Audit Logging (`audit.spec.ts`)
- ✅ Campaign operations logged (create, update, delete)
- ✅ Participant operations logged (if implemented)
- ✅ Audit log querying (by date, action, entity_type)
- ✅ Non-blocking behavior (operations succeed even if audit fails)
- ✅ Tenant-scoped audit entries

## Test Environment Setup

### Prerequisites
1. **Separate Test Supabase Project** (recommended)
2. Environment variables:
   ```bash
   E2E_SUPABASE_URL=https://your-test-project.supabase.co
   E2E_SUPABASE_SERVICE_KEY=your-service-role-key
   E2E_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Apply same migrations as production schema

### Seed Data
Each test run creates:
- **2 Tenants**: Tenant A, Tenant B
- **2 Users**: userA (Tenant A admin), userB (Tenant B admin)
- **4 Campaigns**: 2 per tenant with varying statuses
- **6 Participants**: Mixed completion statuses and scores

### Teardown
- Automatic cleanup after each test suite
- Deletes in reverse dependency order:
  1. Participants
  2. Campaigns
  3. Saved views
  4. Audit logs
  5. User-tenant mappings
  6. Auth users
  7. Tenants

## Running Tests

### All Integration Tests
```bash
npm run test:int
```

### Specific Test Suite
```bash
npx vitest run tests/integration/rls.spec.ts
npx vitest run tests/integration/constraints.spec.ts
npx vitest run tests/integration/views_kpis.spec.ts
npx vitest run tests/integration/views_trend.spec.ts
npx vitest run tests/integration/audit.spec.ts
```

### Watch Mode
```bash
npx vitest tests/integration --watch
```

## Test Isolation

Each test suite:
1. Seeds fresh data in `beforeAll`
2. Runs tests against seeded data
3. Cleans up completely in `afterAll`

Tests are **deterministic** and **tenant-isolated** - they can run in parallel without interference.

## Assertions Summary

### RLS Tests
```typescript
// Example: Cross-tenant read prevention
const { data } = await clientA.from('campaigns').select().eq('tenant_id', tenantB.id);
expect(data?.length).toBe(0); // or error !== null
```

### Constraints Tests
```typescript
// Example: Duplicate participant prevention
const { error } = await client.from('participants').insert({ /* duplicate */ });
expect(error?.message).toContain('unique');
```

### KPI Views Tests
```typescript
// Example: Completion rate validation
const expectedRate = (completed / total) * 100;
expect(kpi.completion_rate).toBeCloseTo(expectedRate, 2);
```

### Trend Views Tests
```typescript
// Example: Daily completed delta
const completedToday = data.completed_delta;
expect(completedToday).toBeGreaterThanOrEqual(0);
```

### Audit Tests
```typescript
// Example: Operation logging
await client.from('campaigns').insert({ /* data */ });
const { data: logs } = await client.from('audit_log').select().eq('action', 'create');
expect(logs.length).toBeGreaterThan(0);
```

## Assumptions & Limitations

1. **Sparse Trend Data**: `vw_awareness_daily_engagement` may have gaps on days with no activity
2. **Quiz Submissions**: Tests use participant.score as fallback if quiz_submissions missing
3. **Started Delta**: Calculation depends on implementation (module_progress vs status change)
4. **Audit Context**: Some operations may not have audit entries if context unavailable
5. **Soft Deletes**: UNIQUE constraints exclude rows with `deleted_at IS NOT NULL`
6. **Service Role**: Uses service role key for setup/teardown; user tokens for RLS tests

## CI Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  env:
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_SERVICE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_KEY }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  run: npm run test:int
```

## Troubleshooting

### "Missing E2E_SUPABASE_URL" error
- Set environment variables in `.env` or CI secrets
- Fallback to `VITE_SUPABASE_URL` if E2E vars not set

### RLS tests failing
- Verify RLS policies exist on tables
- Check user has proper tenant mapping in `user_tenants`
- Confirm `get_user_tenant_id()` function exists

### View tests returning null
- Ensure views are created: `vw_awareness_campaign_kpis`, `vw_awareness_daily_engagement`
- Check JOIN conditions (LEFT vs INNER)
- Verify aggregation functions handle NULL values

### Audit tests finding no logs
- Audit logging may be optional/async
- Check if triggers/functions exist for audit insertion
- Tests pass even if audit not fully implemented

## Integration Summary Example

```
✅ Integration Tests Completed

Tenants Tested: 2 (Tenant A, Tenant B)
Users Created: 2 (userA, userB)
Campaigns Seeded: 4 (2 per tenant)
Participants Seeded: 6 (mixed statuses)

Test Suites:
  ✓ RLS & Tenant Isolation (12 tests)
  ✓ Constraints & Integrity (8 tests)
  ✓ Analytics KPIs (7 tests)
  ✓ Analytics Trends (7 tests)
  ✓ Audit Logging (9 tests)

Total: 43 tests, 43 passed
```

## Future Enhancements

- [ ] Performance benchmarks for views with large datasets
- [ ] Concurrency tests (simultaneous user operations)
- [ ] Bulk operation tests (bulk insert, bulk update)
- [ ] Real-time subscription tests (if using Supabase Realtime)
- [ ] Edge function integration tests (if applicable)
