# Applications Layer

تطبيقات مستقلة مبنية على Core Platform و Modules

## التطبيقات المتاحة

```
src/apps/
├── awareness/      # ✅ Active - Security Awareness Platform
├── lms/            # 🚧 Coming Soon - Learning Management System
├── phishing/       # 🚧 Coming Soon - Phishing Simulator
└── grc/            # 🧪 Beta - Governance, Risk & Compliance
```

## البنية الداخلية لكل App

```
apps/awareness/
├── pages/              # App Pages
│   ├── campaigns/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── create.tsx
│   ├── participants/
│   ├── reports/
│   └── index.tsx
├── components/         # App-specific Components
│   └── ...
├── routes.tsx          # App Routes
├── config.ts           # App Configuration
└── index.ts            # Barrel Export
```

## الاستخدام

```typescript
// Import app routes
import { awarenessRoutes } from '@/apps/awareness/routes';

// Use in main App.tsx
function App() {
  return (
    <Routes>
      {awarenessRoutes.map(route => (
        <Route key={route.path} {...route} />
      ))}
    </Routes>
  );
}
```

## المبادئ

1. ✅ **مستقل** - كل app له pages و components خاصة
2. ✅ **يستخدم Core** - يعتمد على Core Services
3. ✅ **يستخدم Modules** - يستخدم Business Logic من Modules
4. ✅ **يمكن إضافته/إزالته** - بدون تأثير على الباقي

## كيف تضيف تطبيق جديد؟

1. إنشاء مجلد جديد في `src/apps/your-app/`
2. إنشاء `pages/`, `components/`, `routes.tsx`, `config.ts`
3. تسجيل التطبيق في App Registry (`src/core/config/appRegistry.ts`)
4. إضافة الصلاحيات المطلوبة في Database
5. استخدام الـ Routes في `App.tsx`

**الوقت المقدر:** 2-4 ساعات لتطبيق بسيط ✅
