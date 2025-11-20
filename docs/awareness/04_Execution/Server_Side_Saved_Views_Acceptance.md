# Server-Side Saved Views — Acceptance Report

## ✅ Execution Summary

**Feature**: Server-Side Saved Views for Campaigns (replacing localStorage MVP)  
**Status**: ✅ **COMPLETED**  
**Date**: 2025-01-09

---

## 📦 Part A — Database (Schema + RLS)

### ✅ Table Created: `saved_views`

**Columns**:
- `id` UUID PK (gen_random_uuid)
- `tenant_id` UUID NOT NULL → `tenants(id)` ON DELETE CASCADE
- `user_id` UUID NOT NULL (auth.users.id, no FK per best practices)
- `page_key` TEXT NOT NULL (e.g., 'campaigns:list')
- `name` TEXT NOT NULL (human-friendly)
- `filters` JSONB NOT NULL (filters object)
- `is_default` BOOLEAN NOT NULL DEFAULT FALSE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

**Indexes**:
- ✅ `idx_saved_views_tenant_user_page` on `(tenant_id, user_id, page_key, created_at DESC)`
- ✅ `idx_saved_views_default` (partial) on `(tenant_id, user_id, page_key) WHERE is_default = TRUE`

**Constraints**:
- ✅ `UNIQUE (tenant_id, user_id, page_key, name)` — prevents duplicate names per page

**Triggers**:
- ✅ `update_saved_views_updated_at()` — auto-touch `updated_at` on UPDATE

**RLS Policies** (strict tenant + user scoping):
- ✅ SELECT: `tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid()`
- ✅ INSERT: `tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid()`
- ✅ UPDATE: same ownership rule (USING + WITH CHECK)
- ✅ DELETE: same ownership rule

**Security**:
- ✅ Uses existing `get_user_tenant_id()` function (security definer)
- ✅ Multi-tenant isolation enforced at DB level
- ✅ No privilege escalation possible

---

## 📦 Part B — Server Hooks (Saved Views API)

### ✅ Created: `src/hooks/saved-views/useSavedViews.ts`

**Exposed API**:
- `views`: SavedView[] (sorted: is_default first, then created_at DESC)
- `loading`, `error`, `refetch`
- `createView(name: string, filters: any)`: creates view + auto-refreshes list
- `applyView(id: string)`: returns filters object for caller to apply
- `deleteView(id: string)`: deletes view + auto-refreshes list
- `setDefault(id: string)`: sets as default (unsets all others) + auto-refreshes list
- `getDefaultView()`: returns the default view (if any)
- `isCreating`, `isDeleting`, `isSettingDefault`: loading states

**Features**:
- ✅ Tenant + user context from AppContext (respects multi-tenant isolation)
- ✅ Auto-refresh after mutations (invalidate queries)
- ✅ Toast notifications for all actions (success/error)
- ✅ Type-safe with TypeScript

---

### ✅ Created: `src/hooks/saved-views/useSavedViewsImport.ts`

**Purpose**: One-time migration from localStorage to server table

**Exposed API**:
- `imported`: boolean (migration status)
- `importing`: boolean (in-progress)
- `runImport()`: manual trigger (also auto-runs on mount)

**Behavior**:
- ✅ Checks if server views already exist → skip import if yes
- ✅ Reads old localStorage key: `cz:views:campaigns:{tenantId}:{userId}`
- ✅ Imports all valid views into `saved_views` table
- ✅ Clears localStorage key after successful import
- ✅ Auto-runs on mount (when context is ready)
- ✅ Idempotent (won't re-import if server views exist)

---

## 📦 Part C — UI Wiring on `/admin/campaigns`

### ✅ Updated: `src/pages/admin/campaigns/index.tsx`

**Changes**:
1. ✅ **Replaced localStorage hooks with server hooks**:
   - `useSavedViews({ pageKey: 'campaigns:list' })` → list/create/apply/delete/setDefault
   - `useSavedViewsImport({ pageKey: 'campaigns:list' })` → one-time import
   - `useCampaignsFilters()` → **kept for in-memory filters + URL sync only**

2. ✅ **One-time import flow**:
   - Auto-runs on mount via `useSavedViewsImport`
   - Silent if no localStorage views exist
   - Toast notification on successful import

3. ✅ **Controls**:
   - "Save View" button → `createView(name, filters)`
   - "Saved Views" dropdown → lists all views (default marked with ⭐)
   - "Apply" action → `getViewFilters(id)` + `setFilters()`
   - "Set Default" action (⭐ icon) → `setDefault(id)`
   - "Delete" action (🗑️ icon) → `deleteView(id)`

4. ✅ **Default view behavior**:
   - On page load, if `is_default = true` exists + URL has no filters → auto-apply
   - Non-intrusive (respects URL params)
   - Marked with yellow star icon in dropdown

5. ✅ **No breaking changes**:
   - List/stats/table/pagination unchanged
   - Filters UI unchanged
   - Bulk actions unchanged

---

## 📦 Part D — Acceptance Checklist

### ✅ Database
- [x] `saved_views` table created with all columns
- [x] Indexes: `idx_saved_views_tenant_user_page` + `idx_saved_views_default`
- [x] Constraint: `UNIQUE (tenant_id, user_id, page_key, name)`
- [x] Trigger: `update_saved_views_updated_at()`
- [x] RLS policies: SELECT/INSERT/UPDATE/DELETE (tenant + user scoped)
- [x] Uses existing `get_user_tenant_id()` function

### ✅ Hooks
- [x] `useSavedViews`: list/create/apply/delete/setDefault implemented
- [x] Auto-refresh after mutations (invalidate queries)
- [x] Toast notifications for all actions
- [x] Type-safe with TypeScript
- [x] `useSavedViewsImport`: one-time import + clear localStorage
- [x] Idempotent import (skip if server views exist)

### ✅ UI
- [x] `/admin/campaigns` uses server-side views
- [x] localStorage code removed from saved views flow
- [x] "Set Default" action added with star icon
- [x] Default view auto-applies (non-intrusive)
- [x] Import flow works silently on first load
- [x] No breaking changes to existing list/stats/table

### ✅ Code Quality
- [x] ESLint/TypeScript clean (no errors)
- [x] No unused code from localStorage MVP
- [x] `useCampaignsFilters` cleaned (removed saved views logic)
- [x] Proper separation of concerns (filters vs views)

---

## 📁 Files Changed

### Created
1. `src/hooks/saved-views/useSavedViews.ts` (new)
2. `src/hooks/saved-views/useSavedViewsImport.ts` (new)
3. `docs/awareness/04_Execution/Server_Side_Saved_Views_Acceptance.md` (new)

### Modified
1. `src/hooks/campaigns/useCampaignsFilters.ts`
   - **Removed**: `saveCurrentView`, `applyView`, `deleteView`, `listViews` (localStorage logic)
   - **Kept**: `filters`, `setFilters`, `DEFAULTS` (in-memory + URL sync only)
   - **Cleaned**: Removed `SavedView` type, `getStorageKey` function, localStorage code

2. `src/pages/admin/campaigns/index.tsx`
   - **Added**: `useSavedViews` + `useSavedViewsImport` imports
   - **Added**: Star icon import from lucide-react
   - **Replaced**: localStorage saved views with server hooks
   - **Added**: Default view auto-apply on mount
   - **Updated**: Saved Views dropdown with "Set Default" + "Delete" actions
   - **Updated**: Default views marked with yellow star icon

### Database
1. **Migration**: `saved_views` table + indexes + RLS policies + trigger

---

## 🎯 Design Decisions & Assumptions

### Decision 1: Tenant Context Source
- **Assumption**: `AppContextProvider` already provides `tenantId` and `user.id`
- **Source**: `src/lib/app-context/AppContextProvider.tsx` (reads from `user_tenants` table)
- **Validated**: ✅ Context exists and is used throughout the app

### Decision 2: Migration Strategy
- **Choice**: One-time import on first load (auto-run)
- **Reason**: Seamless UX, no manual action required
- **Fallback**: If import fails, user can still create new views (no data loss)

### Decision 3: Default View Behavior
- **Choice**: Only auto-apply if URL has no filters
- **Reason**: Respects user intent (URL params take precedence)
- **UX**: Non-intrusive, predictable behavior

### Decision 4: Set Default Logic
- **Implementation**: Two-step UPDATE (unset all, then set one)
- **Reason**: Ensures only one default per (tenant, user, page_key)
- **Alternative considered**: SQL constraint (rejected due to complexity with partial indexes)

### Decision 5: localStorage Key Format
- **Format**: `cz:views:campaigns:{tenantId}:{userId}` (matches old MVP)
- **Reason**: Ensures clean migration without data loss
- **Generic format**: `cz:views:{pageKey}:{tenantId}:{userId}` for future pages

---

## 🧪 Testing Notes

### Manual Testing Checklist
- ✅ Create new view → saves to DB + appears in dropdown
- ✅ Apply view → filters update correctly
- ✅ Set as default → yellow star appears + auto-applies on next load
- ✅ Delete view → removes from DB + dropdown
- ✅ Import from localStorage → works on first load + clears localStorage
- ✅ Multi-tenant isolation → views scoped by tenant + user
- ✅ URL params → take precedence over default view
- ✅ Duplicate names → blocked by UNIQUE constraint (toast error)

### Edge Cases Handled
- ✅ Missing tenant/user context → hooks disabled gracefully
- ✅ No localStorage views → import skips silently
- ✅ Server views already exist → import skips
- ✅ Malformed localStorage data → import skips + logs error
- ✅ Multiple default views edge case → SQL unsets all before setting one

---

## 🚀 Next Steps (Optional Enhancements)

1. **Extend to other pages**:
   - Policies list: `useSavedViews({ pageKey: 'policies:list' })`
   - Documents list: `useSavedViews({ pageKey: 'documents:list' })`

2. **Share views within team**:
   - Add `is_shared` boolean column
   - Relax RLS to allow team members to view shared views

3. **View analytics**:
   - Track usage count per view
   - Show "Most used" badge

4. **Export/Import views**:
   - JSON export for backup
   - Import from JSON file

---

## 📝 Summary

✅ **All requirements completed successfully.**

- Server-side `saved_views` table with strict RLS (tenant + user scoped)
- React hooks for full CRUD operations + default view management
- One-time migration from localStorage (seamless UX)
- UI updated on `/admin/campaigns` with no breaking changes
- ESLint/TypeScript clean, no unused code

**Migration path**: Existing localStorage views will be automatically imported on first load, then cleared. Users experience zero downtime.

**Security**: Multi-tenant isolation enforced at DB level via RLS policies using `get_user_tenant_id()`.

**Ready for production use.**
