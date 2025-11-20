# Test Coverage Matrix — Romuz Awareness Platform

**Version:** 1.0  
**Date:** 2025-11-09

---

## Test Matrix Overview

This matrix maps **Features** to **Test Layers** and defines coverage requirements.

### Legend
- ✅ **Required** - Must have test coverage
- ⚠️ **Recommended** - Should have coverage for completeness
- ❌ **Not Applicable** - Testing at this layer doesn't make sense
- 🔴 **Critical** - Blocker if not tested
- 🟡 **High** - Important, should be tested
- 🟢 **Medium** - Nice to have
- ⚪ **Low** - Optional

---

## Feature Coverage Matrix

| Module | Feature | Unit | Integration | E2E | Priority | Notes |
|--------|---------|------|-------------|-----|----------|-------|
| **Authentication** | | | | | | |
| | Login (email + password) | ❌ | ✅ | ✅ | 🔴 Critical | Test auth flow + session |
| | Signup | ❌ | ✅ | ✅ | 🔴 Critical | Test user creation + tenant assignment |
| | Logout | ❌ | ❌ | ✅ | 🟡 High | Test session cleanup |
| | Password reset | ❌ | ✅ | ✅ | 🟡 High | Test email flow |
| | Session persistence | ❌ | ✅ | ✅ | 🟡 High | Test refresh tokens |
| **Campaigns** | | | | | | |
| | Create campaign | ✅ | ✅ | ✅ | 🔴 Critical | Schema + DB + UI |
| | Edit campaign | ✅ | ✅ | ✅ | 🔴 Critical | Validation + audit log |
| | Delete campaign | ❌ | ✅ | ✅ | 🟡 High | Soft delete + cascade |
| | Archive campaign | ❌ | ✅ | ✅ | 🟡 High | Archive logic |
| | List campaigns | ✅ | ✅ | ✅ | 🔴 Critical | Filters + pagination |
| | Search campaigns | ✅ | ✅ | ✅ | 🟡 High | ILIKE search |
| | Filter by status | ✅ | ✅ | ✅ | 🟡 High | Status filter logic |
| | Filter by date range | ✅ | ✅ | ✅ | 🟡 High | Date range utils |
| | Filter by owner | ✅ | ✅ | ✅ | 🟢 Medium | Owner filter |
| | Saved views (CRUD) | ✅ | ✅ | ✅ | 🟡 High | View persistence |
| | Saved views (import) | ✅ | ✅ | ✅ | 🟢 Medium | JSON import |
| | Bulk actions (archive) | ✅ | ✅ | ✅ | 🟡 High | Bulk operations |
| **Participants** | | | | | | |
| | Add participant | ✅ | ✅ | ✅ | 🔴 Critical | Schema + DB |
| | Edit participant | ✅ | ✅ | ✅ | 🟡 High | Update logic |
| | Delete participant | ❌ | ✅ | ✅ | 🟡 High | Soft delete |
| | Import CSV | ✅ | ✅ | ✅ | 🔴 Critical | CSV parser + validation |
| | Export CSV | ✅ | ✅ | ✅ | 🟡 High | CSV generator |
| | List participants | ✅ | ✅ | ✅ | 🔴 Critical | Filters + pagination |
| | Filter by status | ✅ | ✅ | ✅ | 🟡 High | Status filter |
| | Filter by score | ✅ | ✅ | ✅ | 🟢 Medium | Score range filter |
| | Bulk update | ✅ | ✅ | ✅ | 🟡 High | Bulk operations |
| | Bulk delete | ❌ | ✅ | ✅ | 🟡 High | Soft delete batch |
| | Metrics calculation | ✅ | ✅ | ✅ | 🔴 Critical | Total/started/completed/avg |
| **Modules** | | | | | | |
| | Create module | ✅ | ✅ | ✅ | 🔴 Critical | Schema + types |
| | Edit module | ✅ | ✅ | ✅ | 🟡 High | Update + ordering |
| | Delete module | ❌ | ✅ | ✅ | 🟡 High | Cascade to quizzes |
| | Reorder modules | ✅ | ✅ | ✅ | 🟢 Medium | Position logic |
| | Quiz CRUD | ✅ | ✅ | ✅ | 🔴 Critical | Questions + options |
| | Quiz grading | ✅ | ✅ | ✅ | 🔴 Critical | Score calculation |
| | Quiz submission | ❌ | ✅ | ✅ | 🔴 Critical | Submit + store answers |
| | Module progress | ❌ | ✅ | ✅ | 🟡 High | Started/completed tracking |
| **Analytics** | | | | | | |
| | Campaign KPIs view | ❌ | ✅ | ✅ | 🔴 Critical | View query + RLS |
| | Daily engagement view | ❌ | ✅ | ✅ | 🔴 Critical | View query + RLS |
| | KPI aggregation | ✅ | ✅ | ✅ | 🔴 Critical | Weighted averages |
| | Top/Bottom lists | ✅ | ✅ | ✅ | 🟡 High | Sorting logic |
| | Trend chart data | ✅ | ✅ | ✅ | 🟡 High | Time series formatting |
| | Date range presets | ✅ | ❌ | ✅ | 🟡 High | 30d/90d/this_month |
| | Custom date range | ✅ | ❌ | ✅ | 🟡 High | Date picker logic |
| | Filters (owner/status/campaign) | ✅ | ✅ | ✅ | 🟡 High | Filter application |
| | Export KPIs CSV | ✅ | ❌ | ✅ | 🟡 High | CSV generation |
| | Export Top CSV | ✅ | ❌ | ✅ | 🟢 Medium | CSV generation |
| | Export Bottom CSV | ✅ | ❌ | ✅ | 🟢 Medium | CSV generation |
| | Drill-down navigation | ❌ | ❌ | ✅ | 🟡 High | Query params preservation |
| **RBAC & Security** | | | | | | |
| | Permission check (can()) | ✅ | ✅ | ✅ | 🔴 Critical | RBAC helper |
| | RLS: campaigns | ❌ | ✅ | ✅ | 🔴 Critical | Tenant isolation |
| | RLS: participants | ❌ | ✅ | ✅ | 🔴 Critical | Tenant isolation |
| | RLS: modules | ❌ | ✅ | ✅ | 🔴 Critical | Tenant isolation |
| | RLS: analytics views | ❌ | ✅ | ✅ | 🔴 Critical | SECURITY INVOKER |
| | Cross-tenant leak test | ❌ | ✅ | ✅ | 🔴 Critical | Multi-tenant test |
| | Role-based UI hiding | ❌ | ❌ | ✅ | 🟡 High | Button visibility |
| | Protected routes | ❌ | ❌ | ✅ | 🔴 Critical | Auth guard |
| **Policies** | | | | | | |
| | Create policy | ✅ | ✅ | ✅ | 🟡 High | Schema + DB |
| | Edit policy | ✅ | ✅ | ✅ | 🟡 High | Update logic |
| | Delete policy | ❌ | ✅ | ✅ | 🟢 Medium | Soft delete |
| | List policies | ✅ | ✅ | ✅ | 🟡 High | Filters + pagination |
| | Version management | ✅ | ✅ | ✅ | 🟢 Medium | Version tracking |
| | Policy details | ❌ | ✅ | ✅ | 🟡 High | Fetch by ID |
| **Audit Log** | | | | | | |
| | Log event (create) | ✅ | ✅ | ✅ | 🔴 Critical | Event capture |
| | Log event (update) | ✅ | ✅ | ✅ | 🔴 Critical | Diff tracking |
| | Log event (delete) | ✅ | ✅ | ✅ | 🔴 Critical | Deletion record |
| | Query audit log | ✅ | ✅ | ✅ | 🟡 High | Filters + pagination |
| | Filter by actor | ✅ | ✅ | ✅ | 🟢 Medium | Actor filter |
| | Filter by entity | ✅ | ✅ | ✅ | 🟢 Medium | Entity filter |
| | Filter by date | ✅ | ✅ | ✅ | 🟢 Medium | Date range filter |
| **Notifications** | | | | | | |
| | Template CRUD | ✅ | ✅ | ✅ | 🟡 High | Template management |
| | Queue management | ❌ | ✅ | ✅ | 🟡 High | Queue operations |
| | Send notification | ❌ | ✅ | ⚠️ | 🟢 Medium | Email/SMS sending |
| | Notification log | ❌ | ✅ | ✅ | 🟢 Medium | Delivery tracking |
| **Saved Views** | | | | | | |
| | Create view | ✅ | ✅ | ✅ | 🟡 High | View persistence |
| | Update view | ✅ | ✅ | ✅ | 🟡 High | Update logic |
| | Delete view | ❌ | ✅ | ✅ | 🟡 High | Delete logic |
| | List views | ✅ | ✅ | ✅ | 🟡 High | User's views |
| | Apply view | ✅ | ❌ | ✅ | 🟡 High | Load filters |
| | Set default view | ❌ | ✅ | ✅ | 🟢 Medium | Default flag |
| | Import views | ✅ | ✅ | ✅ | 🟢 Medium | JSON import |
| | Enforce 10-view limit | ❌ | ✅ | ✅ | 🟡 High | Trigger validation |

---

## Summary Statistics

### By Layer

| Layer | Total Tests | Critical | High | Medium | Low |
|-------|------------|----------|------|--------|-----|
| **Unit** | ~45 | 12 | 18 | 12 | 3 |
| **Integration** | ~60 | 20 | 25 | 12 | 3 |
| **E2E** | ~50 | 15 | 20 | 10 | 5 |

### By Priority

| Priority | Count | % of Total |
|----------|-------|------------|
| 🔴 Critical | 47 | 30% |
| 🟡 High | 63 | 40% |
| 🟢 Medium | 35 | 22% |
| ⚪ Low | 11 | 7% |

### By Module

| Module | Tests | Critical | High |
|--------|-------|----------|------|
| Campaigns | 16 | 4 | 9 |
| Participants | 11 | 3 | 6 |
| Modules | 8 | 4 | 3 |
| Analytics | 12 | 4 | 6 |
| RBAC & Security | 8 | 5 | 2 |
| Policies | 6 | 0 | 4 |
| Audit Log | 7 | 3 | 1 |
| Others | 12 | 0 | 8 |

---

## Testing Priorities

### Phase 1 (MVP) - Critical Path
Focus on 🔴 Critical tests:
- Authentication (login/signup)
- Campaigns CRUD + List
- Participants CRUD + Import/Export
- Modules + Quizzes
- Analytics views + KPIs
- RLS enforcement
- Audit logging

**Target:** 100% coverage of critical paths

### Phase 2 - Feature Complete
Add 🟡 High priority tests:
- All filters and search
- Bulk operations
- Saved views
- Module progress
- Full analytics dashboard
- Role-based UI

**Target:** 80% coverage of high priority

### Phase 3 - Polish
Add 🟢 Medium and ⚪ Low tests:
- Edge cases
- Advanced filters
- Version management
- Notification flows
- Import/export edge cases

**Target:** 60% coverage of medium priority

---

## Coverage Goals

| Layer | Current | Target (Phase 1) | Target (Phase 2) | Target (Phase 3) |
|-------|---------|------------------|------------------|------------------|
| **Unit** | 0% | 70% | 80% | 85% |
| **Integration** | 0% | 60% | 75% | 80% |
| **E2E** | 0% | 80% (critical) | 90% (happy paths) | 95% |

---

## Next Steps

1. **Implement test helpers** (`tests/helpers/`)
2. **Create fixtures** (`tests/fixtures/`)
3. **Write Phase 1 tests** (🔴 Critical only)
4. **Set up CI pipeline**
5. **Iterate to Phase 2/3**

---

**Last Updated:** 2025-11-09  
**Owner:** QA Team  
**Review Cadence:** Monthly
