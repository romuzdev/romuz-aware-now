# Playwright E2E Tests - Awareness Module

Comprehensive end-to-end test coverage for critical user journeys and RBAC guardrails.

## 📁 Test Structure

```
tests/e2e/
├── auth.setup.ts              # Authentication setup (creates storageState per role)
├── admin.flow.spec.ts         # Admin full lifecycle (8 steps)
├── manager.flow.spec.ts       # Manager operational flow (7 steps)
├── reader.flow.spec.ts        # Reader read-only + RBAC guards (11 steps)
├── api.campaigns.spec.ts      # API-level campaigns tests (CRUD, RLS, constraints)
├── api.participants.spec.ts   # API-level participants tests (operations, metrics, analytics)
├── api.savedviews.spec.ts     # API-level saved views tests (CRUD, constraints, isolation)
├── _helpers/
│   ├── auth.ts               # Login helpers, logout, isLoggedIn
│   └── selectors.ts          # Centralized page selectors
└── _fixtures/
    └── participants.csv      # Sample CSV for import tests
```

## 🎭 Roles & Permissions

| Role    | Permissions               | Description                    |
|---------|---------------------------|--------------------------------|
| admin   | campaigns.manage, view    | Full access (CRUD + manage)    |
| manager | campaigns.manage, view    | Operations (no platform admin) |
| reader  | campaigns.view            | Read-only (no mutations)       |

## 🧪 Test Flows

### Admin Flow (`admin.flow.spec.ts`)
1. **Create Campaign**: Navigate → Fill form → Submit → Verify redirect
2. **Add 2 Modules**: Video + Document → Verify count
3. **Attach Quiz**: Add questions → Mark correct → Set pass score
4. **Import Participants**: Upload CSV → Verify 10 rows imported
5. **Bulk Set Status**: Select 3 → Change to in_progress
6. **Send Notifications**: Template → Send Now → Confirm
7. **Verify Metrics**: Check KPIs > 0
8. **Verify Audit Log**: Recent entries exist (create, update)

### Manager Flow (`manager.flow.spec.ts`)
1. **Open Existing Campaign**: From list → Detail page
2. **Bulk Update Participants**: Status + Score → Verify changes
3. **Export CSV**: Download → Verify filename + content
4. **Navigate to Dashboards**: Sidebar → Awareness dashboard
5. **Verify KPIs & Trend**: Cards visible, values > 0
6. **Drill-down**: Click campaign → Verify URL query preserved
7. **Manager Permissions**: Verify manage buttons enabled

### Reader Flow (`reader.flow.spec.ts`)
1. **View Campaigns List**: List loads, stats visible
2. **New Campaign Disabled**: Button disabled + tooltip
3. **View Details**: Read-only access, Edit disabled
4. **Participants Tab**: Import disabled, bulk actions hidden
5. **Content Tab**: Add Module disabled/hidden
6. **Direct /new Blocked**: Redirect to list or error
7. **Direct /edit Blocked**: Redirect to detail page
8. **Bulk Actions Disabled**: Select campaign → buttons disabled
9. **No RBAC Flash**: Buttons disabled on initial load
10. **Export Allowed**: Read-only operation enabled
11. **Dashboards Accessible**: KPIs + charts visible

## 🚀 Running Tests

### Prerequisites
1. **Test Database**: Use separate E2E Supabase project
   ```bash
   export E2E_SUPABASE_URL="https://your-test-project.supabase.co"
   export E2E_SUPABASE_SERVICE_KEY="your-service-key"
   export E2E_SUPABASE_ANON_KEY="your-anon-key"
   ```

2. **Seed Test Users**: Run seed script to create admin, manager, reader
   ```sql
   -- See tests/fixtures/seed.ts for user creation
   -- Or manually create via Supabase Dashboard
   ```

3. **Install Playwright**:
   ```bash
   npx playwright install
   ```

### Run All Tests
```bash
npx playwright test
```

### Run UI Flow Tests Only
```bash
npx playwright test admin.flow.spec.ts manager.flow.spec.ts reader.flow.spec.ts
```

### Run API Tests Only
```bash
npx playwright test api.*.spec.ts
```

### Run Specific Test File
```bash
npx playwright test admin.flow.spec.ts
npx playwright test api.campaigns.spec.ts
```

### Run with UI
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Run in CI
```bash
CI=1 npx playwright test --reporter=html
```

## 📊 Test Results

Results saved to `test-results/`:
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Full interaction trace for debugging
- **HTML Report**: `test-results/html/index.html`

View report:
```bash
npx playwright show-report test-results/html
```

## 🔍 Debugging

### View Trace
```bash
npx playwright show-trace test-results/trace.zip
```

### Screenshots
Check `test-results/` for timestamped screenshots on failures.

### Console Logs
Playwright captures browser console logs automatically. View in trace viewer.

## 🛡️ RBAC Testing Strategy

### Positive Tests (Happy Path)
- Admin: Full CRUD lifecycle
- Manager: Operational tasks (bulk, export, dashboards)
- Reader: View-only access

### Negative Tests (Guardrails)
- Disabled buttons with tooltips
- Direct route navigation blocked
- No mutations possible
- No RBAC flash (buttons disabled on load)

### Coverage Matrix
| Action            | Admin | Manager | Reader |
|-------------------|-------|---------|--------|
| Create Campaign   | ✅    | ✅      | ❌     |
| Edit Campaign     | ✅    | ✅      | ❌     |
| View Campaign     | ✅    | ✅      | ✅     |
| Delete Campaign   | ✅    | ✅      | ❌     |
| Import CSV        | ✅    | ✅      | ❌     |
| Export CSV        | ✅    | ✅      | ✅     |
| Bulk Actions      | ✅    | ✅      | ❌     |
| View Dashboards   | ✅    | ✅      | ✅     |
| Send Notifications| ✅    | ✅      | ❌     |

## 📝 Notes

### Deterministic Seeds
- Tests use fixed timestamps for stable results
- Use `Date.now()` only for unique identifiers
- CSV fixture has 10 predictable rows

### Tenant Isolation
- Each test role belongs to separate tenant
- No cross-tenant data access
- Cleanup after each run

### Flakiness Prevention
- Wait for network idle before assertions
- Use explicit waits (waitForSelector)
- Retry count: 1 on CI, 0 local
- Single worker for sequential execution

### Known Limitations
- **RBAC**: Tests assume RBAC is implemented (currently placeholder)
- **Audit Logging**: May be async; tests check eventual consistency
- **Tooltips**: Not all disabled buttons have tooltips yet

## 🔧 Configuration

See `playwright.config.ts` for:
- Timeout settings (60s per test)
- Screenshot/video options
- Storage state paths
- Dev server config

## 🎯 Success Criteria

All tests passing = ✅

### UI Flow Tests
- 8 admin steps complete
- 7 manager steps complete
- 11 reader steps complete (RBAC enforced)

### API Tests
- 10+ campaigns API tests (CRUD, RLS, constraints)
- 8+ participants API tests (operations, metrics, analytics)
- 9+ saved views API tests (CRUD, constraints, isolation)

### Quality Gates
- No flakiness (retries ≤ 1)
- Screenshots captured on failures
- All RLS policies verified
- All constraints enforced

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Test Isolation](https://playwright.dev/docs/test-isolation)
- [Authentication](https://playwright.dev/docs/auth)
- [Selectors Best Practices](https://playwright.dev/docs/selectors)
