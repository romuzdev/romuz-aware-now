# Application Modules Layer

وحدات عمل قابلة لإعادة الاستخدام - منطق الأعمال المشترك

## البنية

```
src/modules/
├── campaigns/      # M2 - Campaign Management
├── content-hub/    # M4 - Content Hub
├── culture-index/  # M3 - Culture KPIs
├── documents/      # M10 - Documents & Reports
├── alerts/         # M8 - Alert Policies
└── index.ts        # Barrel Export
```

## البنية الداخلية لكل Module

```
modules/campaigns/
├── types/              # TypeScript Types
│   └── campaign.types.ts
├── integration/        # Supabase Integration
│   └── campaigns.integration.ts
├── hooks/              # React Hooks
│   ├── useCampaignsList.ts
│   ├── useCampaignById.ts
│   └── index.ts
├── components/         # Shared Components
│   ├── CampaignCard.tsx
│   ├── StatusBadge.tsx
│   └── index.ts
└── index.ts            # Barrel Export
```

## الاستخدام

```typescript
// Import from modules
import { Campaign, useCampaignsList } from '@/modules/campaigns';
import { ContentItem, useContentList } from '@/modules/content-hub';
```

## المبادئ

1. ✅ **قابل لإعادة الاستخدام** - يمكن لعدة تطبيقات استخدامه
2. ✅ **يعتمد على Core** - يستخدم Core Services
3. ✅ **مستقل عن Apps** - لا يعرف أي شيء عن التطبيقات
4. ✅ **منطق الأعمال** - يحتوي على Business Logic

## ما يجب أن يكون في Modules؟

- ✅ Business Logic
- ✅ Data Models & Types
- ✅ API Integration
- ✅ Shared Hooks
- ✅ Reusable Components
- ❌ App-specific Pages (يذهب في Apps)
- ❌ Core Services (يذهب في Core)
