# Assumptions & Environment Requirements

**Module:** Awareness Campaigns  
**Phase:** Testing & Deployment  
**Last Updated:** 2025-11-09

---

## 🔧 Environment Requirements

### Development Environment

**Required:**
- Node.js 18+ (for Playwright browser automation)
- npm or yarn package manager
- Lovable Cloud project (active subscription)
- Supabase instance (auto-provisioned by Lovable Cloud)

**Optional:**
- VS Code with Playwright extension (for debugging)
- Supabase CLI (for local migrations)

### Test Environment

**Required:**
- Separate Supabase project for E2E/integration tests
- Test database seeded with baseline data:
  - 2 tenants (tenant_a, tenant_b)
  - 2 users per tenant (admin, manager, reader)
  - 4-6 sample campaigns
  - 20-30 participants per campaign
  - Audit log entries (automated in tests)

**Optional:**
- CI/CD runner (GitHub Actions, GitLab CI, etc.)
- Secrets management (GitHub Secrets, Vault, etc.)

### Production Environment

**Required:**
- Lovable Cloud production deployment
- Supabase production instance (auto-provisioned)
- Custom domain (optional, via Lovable settings)

**Recommended:**
- Monitoring/alerting (Supabase dashboard built-in)
- Backup strategy (Supabase auto-backup enabled)

---

## 🔐 Environment Variables

### Required for Tests

```bash
# Integration & E2E Tests
E2E_SUPABASE_URL=https://your-test-project.supabase.co
E2E_SUPABASE_SERVICE_KEY=eyJhbGc...  # Service role key (admin access)
E2E_SUPABASE_ANON_KEY=eyJhbGc...     # Anon key (client access)

# E2E Base URL (optional, defaults to localhost:5173)
E2E_BASE_URL=http://localhost:5173
```

### Where to Set

**Local Development:**
```bash
# Create .env.test file
cp .env .env.test
# Add test variables to .env.test
```

**CI/CD (GitHub Actions):**
```yaml
# Set as repository secrets in Settings → Secrets
E2E_SUPABASE_URL
E2E_SUPABASE_SERVICE_KEY
E2E_SUPABASE_ANON_KEY
```

**Lovable Cloud:**
- Production variables auto-configured
- No manual setup required for deployed app

---

## 📋 Assumptions & Constraints

### Database Assumptions

1. **Tenant Isolation:**
   - Every campaign/participant belongs to exactly one tenant
   - RLS policies enforce tenant_id match
   - Cross-tenant queries return zero rows (not errors)

2. **User Authentication:**
   - Users authenticate via Supabase Auth (email/password)
   - JWT tokens contain user_id
   - `get_user_tenant_id()` function maps user → tenant

3. **Soft Deletes:**
   - Campaigns use `archived_at` for soft delete
   - Participants use `deleted_at` for soft delete
   - Unique constraints allow duplicates if deleted

4. **Audit Logging:**
   - Audit writes are async (may lag by ~500ms)
   - Audit failures do NOT block main operations
   - Audit log retention: unlimited (manual cleanup)

### Performance Assumptions

1. **Test Data Scale:**
   - ~50 campaigns, ~500 participants for sanity checks
   - p50 < 300ms targets based on this scale
   - Production may have 10x-100x more data

2. **Query Patterns:**
   - Most queries filter by tenant_id (indexed)
   - List queries paginated (10-50 items per page)
   - Analytics views refresh on-demand (not cached)

3. **Concurrency:**
   - Assumes Supabase handles concurrent writes
   - No explicit locking or race condition handling
   - Optimistic UI updates with rollback on error

### RBAC Assumptions

1. **Current State:**
   - RBAC system is placeholder (`src/lib/rbac.ts`)
   - Permissions checked in UI only (not enforced in DB)
   - Health page uses `ProtectedRoute` (auth only, not role-based)

2. **Future Implementation:**
   - Full RBAC will use `user_roles` table
   - RLS policies will check roles via security definer functions
   - Health page will require `system.admin` role

### Testing Assumptions

1. **Test Isolation:**
   - Each test suite creates/destroys its own data
   - Tests do NOT share tenant_id or user_id
   - Cleanup runs after each test (even on failure)

2. **Deterministic Seeds:**
   - Fixed UUIDs for predictable queries
   - Timestamps use `Date.now()` for uniqueness
   - CSV fixtures have known structure (10 rows)

3. **Browser Automation:**
   - Playwright uses Chromium (desktop size)
   - Screenshots on failure (saved to `test-results/`)
   - No cross-browser testing (Firefox/Safari not tested)

### Deployment Assumptions

1. **Lovable Cloud:**
   - Frontend changes require "Update" button click
   - Backend changes (migrations, edge functions) auto-deploy
   - Zero-downtime deployments (blue/green)

2. **Database Migrations:**
   - Migrations run via Lovable UI (manual approval)
   - Migrations are idempotent (safe to re-run)
   - No downtime for schema changes (Supabase handles)

3. **Secrets Management:**
   - API keys stored in Supabase secrets (encrypted)
   - Frontend accesses via environment variables
   - Edge functions use `Deno.env.get()`

---

## ⚠️ Known Limitations

### Current Implementation

1. **No Load Testing:**
   - Performance validated on ~500 participants only
   - Production may have 10,000+ participants per campaign
   - **Mitigation:** Monitor p95 latency in first month

2. **No Real Scheduler:**
   - Health checks are manual (refresh to update)
   - No automated drift detection yet
   - **Mitigation:** Review Health page weekly

3. **Partial RBAC:**
   - UI checks permissions, DB does not
   - Health page accessible to all authenticated users
   - **Mitigation:** Hide route from non-admins in UI

4. **No Visual Regression:**
   - UI changes not automatically tested
   - Manual visual review required
   - **Mitigation:** E2E tests catch functional regressions

### Test Environment

1. **Screenshot Limitations:**
   - Cannot capture auth-protected pages (login required)
   - May show login page instead of actual content
   - **Workaround:** Use `storageState` for authenticated screenshots

2. **Async Audit Logging:**
   - Audit log writes may lag by ~500ms
   - Tests include `setTimeout(500)` for consistency
   - **Note:** Non-blocking, eventual consistency acceptable

3. **10 Saved Views Limit:**
   - Enforced by trigger, not app code
   - Users see error on 11th view creation
   - **Note:** Documented in UI, not a bug

---

## 🔄 Environment Setup Checklist

### Before Running Tests

- [ ] Install Node.js 18+ and npm
- [ ] Clone/download project from Lovable
- [ ] Run `npm install` to install dependencies
- [ ] Create `.env.test` with E2E variables
- [ ] Create separate Supabase project for tests
- [ ] Run `npx playwright install` for browser binaries

### Before Deploying to Production

- [ ] Run all tests locally (`npm run test:all`)
- [ ] Review Health page (`/admin/health`)
- [ ] Check Supabase dashboard (no warnings)
- [ ] Set custom domain (optional)
- [ ] Enable auto-backup in Supabase
- [ ] Configure monitoring/alerts

### After Deployment

- [ ] Smoke test critical paths (login, create campaign, view list)
- [ ] Check Health page metrics (migrations, RLS, audit rate)
- [ ] Monitor Supabase logs (first 24 hours)
- [ ] Gather user feedback (first week)
- [ ] Review performance metrics (first month)

---

## 📞 Support & Escalation

### If Tests Fail

1. **Unit Tests:** Check business logic, likely code bug
2. **Integration Tests:** Check RLS policies, seed data, or DB schema
3. **E2E Tests:** Check browser compatibility, selectors, or timing issues
4. **Sanity Checks:** Check test environment (network, permissions)

### If Performance Degrades

1. **Check Indexes:** Missing or outdated indexes (Health page advisory)
2. **Check Data Volume:** Queries may be slow with 10x more data
3. **Check Supabase Logs:** Slow query log in dashboard
4. **Upgrade Instance:** Increase Supabase instance size (Settings → Cloud)

### If RBAC Issues

1. **Check User Mapping:** `user_tenants` table has correct tenant_id
2. **Check RLS Policies:** `get_user_tenant_id()` returns correct value
3. **Check Permissions:** UI permission checks match backend (when RBAC complete)

---

**Last Updated:** 2025-11-09  
**Maintained By:** Lovable AI + Dev Team  
**Questions?** See `docs/awareness/05_QA/` for detailed test documentation
