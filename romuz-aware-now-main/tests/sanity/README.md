# Sanity Checks

Lightweight automated checks for security and performance.

## Overview

Sanity checks provide quick validation of:
- **Security**: RBAC/RLS enforcement
- **Performance**: Query p50 times under 300ms

## Running Checks

### All Checks
```bash
npm run test:sanity
```

### Security Only
```bash
npx tsx tests/sanity/security.sanity.ts
```

### Performance Only
```bash
npx tsx tests/sanity/performance.sanity.ts
```

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Sanity Checks
  run: npm run test:sanity
  env:
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_SERVICE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_KEY }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

## Checks

### Security Checks (Blocking)

1. **RBAC: View Permission**
   - Users can view campaigns in their tenant
   - Blocks view without `campaigns.view`

2. **RBAC: Manage Permission**
   - Users can create/update campaigns with `campaigns.manage`
   - Blocks mutations without permission

3. **RLS: Tenant Isolation**
   - Cross-tenant read attempts return 0 rows
   - Cross-tenant write attempts fail

### Performance Checks (Advisory)

1. **Campaigns List Query**
   - Target: p50 < 300ms
   - Filters: archived_at=null, order by created_at

2. **Participants List Query**
   - Target: p50 < 300ms
   - Filters: deleted_at=null, order by created_at

3. **Analytics KPIs View**
   - Target: p50 < 300ms
   - Materialized view aggregations

4. **Query Plan Efficiency**
   - Advisory: Run EXPLAIN ANALYZE in DB console
   - Check for seq scans on large tables

## Exit Codes

- `0`: All security checks passed (performance warnings ok)
- `1`: Security checks failed (blocking)

## Output Format

```
🔒 Security Sanity Checks
══════════════════════════════════════════════════
✅ RBAC: View Permission: Users can view campaigns in their tenant
✅ RBAC: Manage Permission: Users can manage campaigns in their tenant
✅ RLS: Tenant Isolation: Cross-tenant access blocked by RLS
══════════════════════════════════════════════════
📊 Results: 3/3 checks passed
✅ All security checks passed!

⚡ Performance Sanity Checks
══════════════════════════════════════════════════
✅ Campaigns List: p50 = 45ms (PASS)
✅ Participants List: p50 = 62ms (PASS)
⚠️  Analytics KPIs: p50 = 320ms (SLOW)
ℹ️  Query Plan Analysis: Advisory only (requires direct DB access)
══════════════════════════════════════════════════
📊 Results: 2/3 queries under 300ms
⚠️  Some queries are slow. Consider optimization.
   - Analytics KPIs View: p50 (320ms) exceeds 300ms threshold
```

## Notes

- Runs against test Supabase instance (E2E environment)
- Cleans up test data automatically
- Performance checks are advisory (warnings, not failures)
- Security checks are blocking (failures = CI fail)
