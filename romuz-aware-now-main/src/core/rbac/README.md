# RBAC System Documentation

## Overview

Enhanced Role-Based Access Control (RBAC) system with database-driven permissions.

## Architecture

```
src/core/rbac/
├── types.ts           # TypeScript types
├── roles.ts           # Role definitions
├── permissions.ts     # Permission utilities
├── hooks/
│   ├── useRole.ts    # User role hook
│   └── useCan.ts     # Permission checking hook
└── index.ts          # Barrel export
```

## Roles

### Platform Roles
- **platform_admin**: Full platform access (all permissions)
- **platform_support**: Platform support and monitoring

### Tenant Roles
- **tenant_admin**: Full tenant access
- **tenant_manager**: Manage campaigns and content
- **tenant_employee**: View-only access

## Usage

### Check User Role

```tsx
import { useRole } from '@/core/rbac';

function MyComponent() {
  const { role, isPlatformAdmin, isTenantAdmin } = useRole();
  
  if (isPlatformAdmin) {
    return <AdminPanel />;
  }
  
  return <UserPanel />;
}
```

### Check Permissions

```tsx
import { useCan, usePermissions } from '@/core/rbac';

function CampaignList() {
  const can = useCan();
  const { canAll, canAny } = usePermissions();
  
  // Single permission
  if (can('campaigns.create')) {
    return <CreateButton />;
  }
  
  // Multiple permissions (all required)
  if (canAll(['campaigns.edit', 'campaigns.delete'])) {
    return <AdminActions />;
  }
  
  // Multiple permissions (any required)
  if (canAny(['campaigns.view', 'campaigns.manage'])) {
    return <CampaignList />;
  }
}
```

### Permission Format

Permissions follow the pattern: `resource.action`

Examples:
- `campaigns.view` - View campaigns
- `campaigns.create` - Create campaigns
- `campaigns.*` - All campaign permissions
- `*` - All permissions (platform_admin only)

## Database Schema

### user_roles Table

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  tenant_id UUID NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Security Functions

- `has_role(user_id, role)` - Check if user has role
- `has_role_in_tenant(user_id, role, tenant_id)` - Check tenant-specific role
- `get_user_role(user_id, tenant_id)` - Get user's highest role

## RLS Policies

- Users can view their own roles
- Platform admins can manage all roles
- Tenant admins can manage tenant roles (excluding platform roles)

## Best Practices

1. **Always use hooks** - Never check permissions directly
2. **Prefer `useCan()`** - For simple permission checks
3. **Use `usePermissions()`** - For multiple checks in same component
4. **Wildcard permissions** - Use sparingly, prefer explicit permissions
5. **Role hierarchy** - Respect role levels in custom logic

## Permission Categories

- **platform**: Platform management
- **tenants**: Tenant management
- **campaigns**: Campaign management
- **documents**: Document management
- **users**: User management
- **roles**: Role management
- **settings**: Settings management
- **reports**: Report access
- **audit**: Audit log access

## Examples

### Conditional Rendering

```tsx
function CampaignActions({ campaign }) {
  const can = useCan();
  
  return (
    <div>
      {can('campaigns.edit') && <EditButton />}
      {can('campaigns.delete') && <DeleteButton />}
      {can('campaigns.manage') && <AdvancedSettings />}
    </div>
  );
}
```

### Route Protection

```tsx
import { useRole } from '@/core/rbac';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const { role, isLoading } = useRole();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!role || role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

## Integration with App Registry

The RBAC system integrates with the App Registry:

```tsx
import { useAvailableApps } from '@/core/config';

function AppSwitcher() {
  // Automatically filters apps by permissions
  const apps = useAvailableApps();
  
  return (
    <div>
      {apps.map(app => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
```
