# Core Configuration

Central configuration and app registry system for the platform.

## Overview

The configuration module provides a centralized registry for all applications and their features. It enables dynamic navigation, permission-based access control, and modular app architecture.

## Structure

```
src/core/config/
├── types.ts           # TypeScript interfaces
├── registry.ts        # App registry and helper functions
├── hooks/             # React hooks for registry access
│   ├── useAppRegistry.ts
│   └── index.ts
├── index.ts           # Barrel export
└── README.md          # This file
```

## Types

### AppModule

Represents a complete application on the platform:

```typescript
interface AppModule {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: LucideIcon;
  route: string;
  requiredPermission: string;
  color: string;
  status: 'active' | 'beta' | 'coming_soon' | 'deprecated';
  features: AppFeature[];
  dependencies?: string[];
  metadata?: { version?: string; lastUpdated?: string; owner?: string };
}
```

### AppFeature

Represents a page or feature within an app:

```typescript
interface AppFeature {
  id: string;
  name: string;
  nameAr: string;
  route: string;
  icon: LucideIcon;
  requiredPermission: string;
  showInSidebar?: boolean;
  order?: number;
}
```

## Registry

The app registry (`APP_REGISTRY`) contains all available apps:

```typescript
import { APP_REGISTRY, getAppById, getActiveApps } from '@/core/config';

// Get all apps
const allApps = APP_REGISTRY;

// Get specific app
const awarenessApp = getAppById('awareness');

// Get only active apps
const activeApps = getActiveApps();
```

## Hooks

### useAvailableApps

Get apps the current user can access (filtered by permissions):

```typescript
import { useAvailableApps } from '@/core/config';

function AppSwitcher() {
  const apps = useAvailableApps();
  
  return (
    <div>
      {apps.map(app => (
        <Link key={app.id} to={app.route}>
          {app.name}
        </Link>
      ))}
    </div>
  );
}
```

### useApp

Get a specific app by ID:

```typescript
import { useApp } from '@/core/config';

function AppHeader() {
  const app = useApp('awareness');
  
  if (!app) return null;
  
  return <h1>{app.name}</h1>;
}
```

### useSidebarFeatures

Get sidebar features for an app (filtered by permissions):

```typescript
import { useSidebarFeatures } from '@/core/config';

function Sidebar() {
  const features = useSidebarFeatures('awareness');
  
  return (
    <nav>
      {features.map(feature => (
        <Link key={feature.id} to={feature.route}>
          <feature.icon />
          {feature.name}
        </Link>
      ))}
    </nav>
  );
}
```

## Adding a New App

1. **Create app config** in `src/apps/your-app/config.ts`:

```typescript
import { AppModule } from '@/core/config/types';
import { YourIcon } from 'lucide-react';

export const yourApp: AppModule = {
  id: 'your-app',
  name: 'Your App',
  nameAr: 'تطبيقك',
  description: 'Your app description',
  icon: YourIcon,
  route: '/app/your-app',
  requiredPermission: 'app.your-app.access',
  color: 'hsl(200, 70%, 50%)',
  status: 'active',
  features: [
    // ... your features
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-14',
    owner: 'Your Team',
  },
};
```

2. **Register in registry** (`src/core/config/registry.ts`):

```typescript
import { yourApp } from '@/apps/your-app/config';

export const APP_REGISTRY: AppModule[] = [
  // ... existing apps
  yourApp,
];
```

3. **Done!** The app is now available in the registry and can be accessed via hooks.

## Best Practices

1. **Use semantic permissions**: `app.{app-name}.access` for app-level access
2. **Version your apps**: Update metadata.version when making changes
3. **Order features**: Use the `order` property for sidebar items
4. **Status management**: 
   - `active`: Fully functional
   - `beta`: Available but may have issues
   - `coming_soon`: Visible but not accessible
   - `deprecated`: Being phased out

## Related

- [App Registry Types](./types.ts)
- [Registry Implementation](./registry.ts)
- [Registry Hooks](./hooks/useAppRegistry.ts)
