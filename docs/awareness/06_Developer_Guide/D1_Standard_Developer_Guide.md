# D1 Standard Developer Guide
**Project:** Romuz Cybersecurity Culture Platform  
**Version:** 1.0  
**Date:** 2025-11-14  
**Status:** Complete

---

## 📘 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Module Structure](#module-structure)
4. [Core Services](#core-services)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Toast Notifications](#toast-notifications)
8. [Performance Optimization](#performance-optimization)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## 1. Overview

### What is D1 Standard?

D1 Standard is our unified architecture pattern for building scalable, maintainable, and consistent modules in the Romuz platform. It provides:

- ✅ **Saved Views** - Server-side filter persistence
- ✅ **Bulk Operations** - Multi-row actions with audit logging
- ✅ **Import/Export** - CSV/JSON data transfer with job tracking
- ✅ **Realtime Updates** - Live data synchronization via Supabase
- ✅ **URL State Management** - Shareable filtered views
- ✅ **Multi-Tenant RLS** - Row-level security isolation
- ✅ **Unified Error Handling** - Consistent error messages
- ✅ **Loading Patterns** - Standardized skeletons

### Modules Using D1 Standard

| Module | Code | Tables | Features |
|--------|------|--------|----------|
| Core Infrastructure | D1 | `saved_views`, `bulk_operation_logs`, `import_export_jobs` | Foundation |
| Policies | D2 | `awareness_policies` | Complete |
| Documents | D3 | `awareness_documents` | Complete |
| Committees | D4 | `awareness_committees` | Complete |
| Campaigns | M2 | `awareness_campaigns` | Complete |

---

## 2. Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│          UI Layer (React)               │
│   - Pages                               │
│   - Components                          │
│   - Forms                               │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│        Hooks Layer (Custom Hooks)       │
│   - useModuleList (queries)             │
│   - useModuleFilters (state)            │
│   - useModuleBulk (actions)             │
│   - useModuleImportExport (I/O)         │
│   - useModuleRealtime (live sync)       │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│     Integration Layer (Supabase)        │
│   - CRUD operations                     │
│   - Query builders                      │
│   - Type mappings                       │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Services Layer (Business Logic)    │
│   - bulkOperationsService               │
│   - importExportService                 │
│   - auditLogService                     │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│        Database (Supabase/PostgreSQL)   │
│   - Tables + RLS Policies               │
│   - Realtime subscriptions              │
│   - Functions & Triggers                │
└─────────────────────────────────────────┘
```

---

## 3. Module Structure

### Standard Module Layout

```
src/modules/{module-name}/
├── types/
│   ├── index.ts                 # Public exports
│   └── {module}.types.ts        # Type definitions
├── integration/
│   ├── index.ts                 # Public exports
│   └── {module}.integration.ts  # Supabase CRUD
├── hooks/
│   ├── index.ts                 # Public exports
│   ├── use{Module}List.ts       # Fetch list with pagination
│   ├── use{Module}ById.ts       # Fetch single record
│   ├── use{Module}Filters.ts    # Filters + URL sync
│   ├── use{Module}Bulk.ts       # Bulk operations
│   ├── use{Module}ImportExport.ts # I/O operations
│   └── use{Module}Realtime.ts   # Live updates (optional)
├── components/
│   ├── index.ts                 # Public exports
│   ├── {Module}Form.tsx         # Create/Edit form
│   ├── {Module}List.tsx         # List view
│   └── {Module}Detail.tsx       # Detail view (optional)
└── index.ts                     # Module exports
```

### Example: Policies Module

```
src/modules/policies/
├── types/
│   ├── index.ts
│   └── policy.types.ts
├── integration/
│   ├── index.ts
│   └── policies.integration.ts
├── hooks/
│   ├── index.ts
│   ├── usePoliciesList.ts
│   ├── usePolicyById.ts
│   ├── usePoliciesFilters.ts
│   ├── usePoliciesBulk.ts
│   ├── usePoliciesImportExport.ts
│   └── usePoliciesRealtime.ts
├── components/
│   ├── index.ts
│   ├── PolicyForm.tsx
│   └── StatusBadge.tsx
└── index.ts
```

---

## 4. Core Services

### Bulk Operations Service

**Location:** `src/core/services/bulkOperationsService.ts`

**Usage:**
```typescript
import { executeBulkOperation } from '@/core/services/bulkOperationsService';

await executeBulkOperation({
  operation_type: 'archive',
  entity_type: 'policy',
  entity_ids: ['id1', 'id2'],
  metadata: { reason: 'outdated' },
});
```

**Features:**
- ✅ Automatic audit logging
- ✅ Job status tracking (`bulk_operation_logs` table)
- ✅ Error handling per entity
- ✅ Progress tracking

---

### Import/Export Service

**Location:** `src/core/services/importExportService.ts`

**Usage:**
```typescript
import { exportData, importData } from '@/core/services/importExportService';

// Export
await exportData(
  {
    module_name: 'policies',
    entity_type: 'policy',
    file_format: 'csv',
    filters: {},
  },
  async () => {
    // Fetch data function
    return await fetchPolicies();
  }
);

// Import
await importData(
  {
    module_name: 'policies',
    entity_type: 'policy',
    file_format: 'csv',
    file: fileObject,
  },
  async (rows) => {
    // Process rows function
    await insertPolicies(rows);
  }
);
```

**Features:**
- ✅ CSV & JSON support
- ✅ Job tracking (`import_export_jobs` table)
- ✅ Progress updates
- ✅ Error handling
- ✅ Metadata storage

---

### Saved Views Service

**Location:** `src/hooks/saved-views/useSavedViews.ts`

**Usage:**
```typescript
import { useSavedViews } from '@/hooks/saved-views/useSavedViews';

const {
  views,
  loading,
  createView,
  applyView,
  deleteView,
  setDefault,
  getDefaultView,
} = useSavedViews({ pageKey: 'policies:list' });

// Create
await createView({
  name: 'Active Policies',
  filters: { status: 'active' },
  isDefault: true,
});

// Apply
const filters = getViewFilters(viewId);
setFilters(filters);
```

**Features:**
- ✅ Server-side persistence
- ✅ Per-user isolation
- ✅ Default view support
- ✅ Auto-import from localStorage

---

## 5. Error Handling

### Unified Error Handler

**Location:** `src/lib/errors/errorHandler.ts`

**Usage:**
```typescript
import { showErrorToast, withErrorHandling, AppError, ErrorType } from '@/lib/errors/errorHandler';

// Simple error toast
try {
  await operation();
} catch (error) {
  showErrorToast(error, 'حفظ السياسة');
}

// Async with error handling
const { data, error } = await withErrorHandling(
  async () => await fetchPolicy(id),
  'تحميل السياسة'
);

if (error) {
  // Handle error
}

// Custom error
throw new AppError('رسالة مخصصة', ErrorType.VALIDATION, { field: 'name' });
```

### Error Types

```typescript
enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  DUPLICATE = 'duplicate',
  UNKNOWN = 'unknown',
}
```

### Supabase Error Parsing

```typescript
import { parseSupabaseError } from '@/lib/errors/errorHandler';

try {
  const { error } = await supabase.from('policies').insert(data);
  if (error) throw parseSupabaseError(error);
} catch (err) {
  showErrorToast(err);
}
```

---

## 6. Loading States

### Unified Loading Components

**Location:** `src/components/shared/LoadingStates.tsx`

**Components:**
```typescript
import {
  PageLoader,        // Full page loader
  InlineLoader,      // Inline spinner
  TableSkeleton,     // Table rows skeleton
  CardSkeleton,      // Card skeleton
  ListSkeleton,      // List items skeleton
  FormSkeleton,      // Form fields skeleton
  StatsCardsSkeleton, // Stats cards skeleton
  ButtonLoader,      // Button spinner
} from '@/components/shared/LoadingStates';
```

**Usage:**
```tsx
// Full page
if (isLoading) return <PageLoader message="جاري تحميل السياسات..." />;

// Table
{isLoading ? (
  <TableSkeleton rows={10} cols={5} />
) : (
  <Table>...</Table>
)}

// Cards
{isLoading ? (
  <CardSkeleton count={4} />
) : (
  cards.map(...)
)}

// Button
<Button disabled={isSubmitting}>
  {isSubmitting && <ButtonLoader />}
  حفظ
</Button>
```

---

## 7. Toast Notifications

### Unified Toast Messages

**Location:** `src/lib/notifications/toastMessages.ts`

**Usage:**
```typescript
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showCustom,
} from '@/lib/notifications/toastMessages';

// Success
showSuccess('created', 'السياسة');
showSuccess('exported', 'السياسات', 25);

// Error
showError('createFailed', 'السياسة');
showError('noPermission');

// Warning
showWarning('confirmDelete', 'السياسة');

// Info
showInfo('loading', 'السياسات');

// Custom
showCustom('عنوان مخصص', 'وصف مخصص', 'destructive');
```

### Available Messages

**Success:**
- `created`, `updated`, `deleted`
- `archived`, `unarchived`, `duplicated`
- `exported`, `imported`, `saved`

**Error:**
- `loadFailed`, `createFailed`, `updateFailed`, `deleteFailed`
- `exportFailed`, `importFailed`
- `noPermission`, `networkError`, `validation`

**Warning:**
- `unsavedChanges`, `confirmDelete`, `confirmArchive`

**Info:**
- `loading`, `processing`, `noData`

---

## 8. Performance Optimization

### Debounce & Throttle

**Location:** `src/lib/performance/debounce.ts`

**Hooks:**
```typescript
import {
  useDebounce,
  useThrottle,
  useDebouncedCallback,
  useThrottledCallback,
  usePrevious,
  useIsMounted,
} from '@/lib/performance/debounce';

// Debounced value
const debouncedSearch = useDebounce(searchTerm, 500);

// Debounced callback
const debouncedSearch = useDebouncedCallback(
  (term: string) => {
    performSearch(term);
  },
  500
);

// Throttled callback
const throttledScroll = useThrottledCallback(
  () => {
    handleScroll();
  },
  200
);

// Previous value
const prevValue = usePrevious(value);

// Mounted check
const isMounted = useIsMounted();
```

**Functions:**
```typescript
import { debounce, throttle, memoize } from '@/lib/performance/debounce';

// Debounce
const debouncedFn = debounce((term: string) => {
  console.log(term);
}, 500);

// Throttle
const throttledFn = throttle(() => {
  console.log('throttled');
}, 1000);

// Memoize
const expensiveFn = memoize((input: string) => {
  // Expensive computation
  return result;
});
```

### React Query Optimizations

```typescript
import { useQuery } from '@tanstack/react-query';

// With stale time
const { data } = useQuery({
  queryKey: ['policies'],
  queryFn: fetchPolicies,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// With caching
const { data } = useQuery({
  queryKey: ['policy', id],
  queryFn: () => fetchPolicy(id),
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## 9. Best Practices

### 1. Naming Conventions

- **Files:** PascalCase for components, camelCase for utilities
- **Functions:** camelCase
- **Types/Interfaces:** PascalCase
- **Constants:** SCREAMING_SNAKE_CASE
- **Database:** snake_case

### 2. Type Safety

```typescript
// ✅ Good - Explicit types
interface Policy {
  id: string;
  name: string;
  status: PolicyStatus;
}

function updatePolicy(policy: Policy): Promise<void> {
  // ...
}

// ❌ Bad - Implicit any
function updatePolicy(policy) {
  // ...
}
```

### 3. Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error) => console.error(error)}
>
  <MyComponent />
</ErrorBoundary>
```

### 4. Accessibility

```tsx
// ✅ Good - Proper labels
<label htmlFor="policy-name">اسم السياسة</label>
<input id="policy-name" type="text" aria-required="true" />

// ✅ Good - Keyboard navigation
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  حذف
</button>
```

### 5. Code Organization

```typescript
// ✅ Group related imports
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { usePolicies } from '@/modules/policies';

// ✅ Destructure props
function PolicyCard({ id, name, status }: Policy) {
  // ...
}

// ✅ Extract complex logic to hooks
function usePolicyLogic(id: string) {
  const { data, isLoading } = usePolicyById(id);
  const { update } = useUpdatePolicy();
  
  const handleSave = async (values: PolicyUpdate) => {
    await update({ id, ...values });
  };
  
  return { policy: data, isLoading, handleSave };
}
```

---

## 10. Common Patterns

### Pattern 1: List Page with Filters

```tsx
function PoliciesPage() {
  const { filters, setFilters, DEFAULTS } = usePoliciesFilters();
  const [page, setPage] = useState(1);
  const { data, total, isLoading, stats } = usePoliciesList({ page, filters });

  return (
    <div>
      {/* Filters */}
      <Input
        value={filters.q}
        onChange={(e) => setFilters({ q: e.target.value })}
      />

      {/* Stats */}
      {isLoading ? (
        <StatsCardsSkeleton count={4} />
      ) : (
        <StatsCards data={stats} />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : (
        <Table data={data} />
      )}

      {/* Pagination */}
      <Pagination page={page} total={total} onPageChange={setPage} />
    </div>
  );
}
```

### Pattern 2: Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { policySchema } from '@/schemas/policies';

function PolicyForm({ onSubmit, defaultValues }) {
  const form = useForm({
    resolver: zodResolver(policySchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="text-destructive">{form.formState.errors.name.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <ButtonLoader />}
        حفظ
      </Button>
    </form>
  );
}
```

### Pattern 3: Realtime Sync

```tsx
function usePoliciesRealtime(tenantId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('policies-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'awareness_policies',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['policies'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);
}
```

### Pattern 4: Bulk Actions

```tsx
function BulkActionsToolbar({ selected, onAction }) {
  const { archive, unarchive, duplicate } = usePoliciesBulk();

  const handleArchive = async () => {
    await archive(selected);
    onAction();
  };

  return (
    <div>
      <Button onClick={handleArchive} disabled={selected.length === 0}>
        أرشفة ({selected.length})
      </Button>
    </div>
  );
}
```

---

## 11. Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PolicyCard from './PolicyCard';

describe('PolicyCard', () => {
  it('renders policy name', () => {
    render(<PolicyCard name="Test Policy" status="active" />);
    expect(screen.getByText('Test Policy')).toBeInTheDocument();
  });

  it('shows active badge', () => {
    render(<PolicyCard name="Test" status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { test, expect } from '@playwright/test';

test('create new policy', async ({ page }) => {
  await page.goto('/admin/policies/new');
  
  await page.fill('input[name="name"]', 'Test Policy');
  await page.selectOption('select[name="status"]', 'draft');
  await page.click('button[type="submit"]');
  
  await expect(page.getByText('تم الإنشاء بنجاح')).toBeVisible();
});
```

---

## 12. Troubleshooting

### Common Issues

**Issue:** Filters not syncing to URL
```typescript
// ❌ Bad
const [filters, setFilters] = useState({});

// ✅ Good
const { filters, setFilters } = usePoliciesFilters();
```

**Issue:** Realtime not working
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'awareness_policies';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.awareness_policies;
```

**Issue:** Import/Export job stuck
```typescript
// Check job status
const { data } = await supabase
  .from('import_export_jobs')
  .select('*')
  .eq('id', jobId)
  .single();

console.log('Job status:', data.status);
```

**Issue:** Performance slow
```typescript
// ✅ Add debouncing
const debouncedSearch = useDebounce(searchTerm, 500);

// ✅ Add pagination
const pageSize = 25; // Instead of fetching all

// ✅ Add indexes (SQL)
CREATE INDEX idx_policies_name ON awareness_policies(name);
```

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Maintained By:** Romuz Development Team  
**Last Updated:** 2025-11-14  
**Version:** 1.0
