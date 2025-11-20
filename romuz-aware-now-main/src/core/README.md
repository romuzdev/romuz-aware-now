# Core Platform Layer

الطبقة الأساسية للمنصة - خدمات مشتركة لجميع التطبيقات

## البنية

```
src/core/
├── auth/           # Authentication & Identity
├── rbac/           # Role-Based Access Control
├── tenancy/        # Multi-Tenancy Helpers
├── services/       # Shared Services (documents, audit, alerts)
├── config/         # Core Configuration & App Registry
├── hooks/          # Core React Hooks
├── components/     # Core UI Components
└── index.ts        # Barrel Export
```

## الاستخدام

```typescript
// Import from core
import { useCan, documentService } from '@/core';
import { PermissionGuard } from '@/core/components';
import { useAppModules } from '@/core/hooks';
```

## المبادئ

1. ✅ **مشترك للجميع** - كل تطبيق يستخدم هذه الطبقة
2. ✅ **مستقل** - لا يعتمد على Modules أو Apps
3. ✅ **مستقر** - تغييراته نادرة ومدروسة
4. ✅ **موثق** - كل export له تعليق واضح

## ما يجب أن يكون في Core؟

- ✅ Authentication & Identity
- ✅ RBAC & Permissions
- ✅ Multi-Tenancy Helpers
- ✅ Audit Logging
- ✅ Document Management
- ✅ Alert System
- ✅ App Registry
- ❌ Business Logic (يذهب في Modules)
- ❌ UI Pages (يذهب في Apps)
