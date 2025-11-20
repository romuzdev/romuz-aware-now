# Gate-K: UI Wireflow — Quarterly Insights Dashboard (v1.0)

**المشروع:** Romuz Awareness — Gate-K  
**الغرض:** توثيق تدفق الواجهة الأمامية لعرض وإدارة المبادرات الربع سنوية

---

## Overview

**المسار:** `/admin/insights/quarterly`  
**الأدوار المسموح لها:** viewer (read), analyst (generate/export), tenant_admin (all)

**الشاشات الرئيسية:**
1. Quarter Selector (اختيار الربع/السنة)
2. KPI Summary Grid (ملخص المؤشرات)
3. RCA Highlights (أبرز المساهمين)
4. Top-3 Initiatives Cards (أهم 3 مبادرات)
5. Export Controls (تصدير التقرير)

---

## 1) Quarter Selector

### الغرض
السماح للمستخدم باختيار الربع والسنة لعرض أو توليد insights.

### المكونات

```
┌─────────────────────────────────────────────┐
│  📅 اختر الفترة                             │
│                                             │
│  [السنة ▼] 2025                             │
│  [Q1] [Q2] [Q3] [Q4]  ← chips selectable   │
│                                             │
│  [ توليد Insights ]  [ تحديث ]             │
└─────────────────────────────────────────────┘
```

### التفاعلات

- **Select Year**: Dropdown (2020..current year + 1)
- **Select Quarter**: Button chips (Q1-Q4), single selection
- **توليد Button**: 
  - يستدعي `POST /insights/quarterly/generate`
  - يظهر loading spinner
  - عند النجاح: toast success + تحديث البيانات تلقائياً
  - عند الفشل: toast error مع الرسالة
- **تحديث Button**: يعيد تحميل البيانات من `GET /insights/quarterly`

### RBAC

| Role | View Selector | Generate | Notes |
|------|---------------|----------|-------|
| viewer | ✅ | ❌ | قراءة فقط |
| analyst | ✅ | ✅ | يمكنه التوليد |
| tenant_admin | ✅ | ✅ | صلاحيات كاملة |

---

## 2) KPI Summary Grid

### الغرض
عرض ملخص سريع لجميع الـ KPIs مع حالتها (ok/warn/alert).

### البنية

```
┌─────────────────────────────────────────────────────────────┐
│  📊 ملخص المؤشرات (Q1 2025)                                │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐             │
│  │ معدل إتمام الحملات │  │ معدل النقر (تصيد) │             │
│  │                   │  │                   │             │
│  │     78.5%         │  │     12.3%         │             │
│  │   ⚠️ warn          │  │   🔴 alert        │             │
│  │   Δ -5.2%         │  │   Δ +8.7%         │             │
│  └───────────────────┘  └───────────────────┘             │
│                                                             │
│  [ عرض التفاصيل الكاملة ]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Status Chips

- ✅ **ok**: `bg-success`, `text-success-foreground`
- ⚠️ **warn**: `bg-warning`, `text-warning-foreground`
- 🔴 **alert**: `bg-destructive`, `text-destructive-foreground`

### التفاعلات

- **Click on KPI Card**: Deep link إلى صفحة KPI details (Gate-E/F)
- **Hover**: يظهر tooltip مع المصدر والوصف

---

## 3) RCA Highlights (أعلى المساهمين)

### الغرض
عرض أبرز الأبعاد (departments, channels, etc.) المؤثرة في الأداء.

### البنية

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 التحليل الجذري — أعلى المساهمين                         │
│                                                             │
│  📌 department                                              │
│  ┌───────────────────────────────────────────┐             │
│  │ IT            ████████████░░░░ 85.4       │             │
│  │ HR            ███████░░░░░░░░░ 62.1       │             │
│  │ Finance       █████░░░░░░░░░░░ 48.7       │             │
│  └───────────────────────────────────────────┘             │
│                                                             │
│  📌 channel                                                 │
│  ┌───────────────────────────────────────────┐             │
│  │ Email         ██████████░░░░░░ 72.3       │             │
│  │ SMS           ████░░░░░░░░░░░░ 34.5       │             │
│  └───────────────────────────────────────────┘             │
│                                                             │
│  [ عرض RCA التفصيلي ]                                      │
└─────────────────────────────────────────────────────────────┘
```

### التفاعلات

- **Click on Dim Value**: Deep link إلى RCA Drill-Down page
- **Hover on Bar**: يظهر tooltip مع `contribution_score` الدقيق

---

## 4) Top-3 Initiatives Cards

### الغرض
عرض أهم 3 مبادرات مُقترحة للربع القادم مع CTAs.

### البنية

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 أهم 3 مبادرات للربع القادم                             │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1️⃣ تدريب مكثف لقسم تقنية المعلومات                   │ │
│  │                                                       │ │
│  │ KPI: phishing_click_rate                             │ │
│  │ البُعد: department = IT                              │ │
│  │ الأولوية: 85.4 🔥                                    │ │
│  │                                                       │ │
│  │ [ إنشاء خطة عمل في Gate-H ]  [ التفاصيل ]          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 2️⃣ حملة تذكير عبر البريد                            │ │
│  │                                                       │ │
│  │ KPI: campaign_completion_rate                        │ │
│  │ البُعد: channel = email                              │ │
│  │ الأولوية: 72.1 ⚠️                                    │ │
│  │                                                       │ │
│  │ [ إنشاء خطة عمل في Gate-H ]  [ التفاصيل ]          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 3️⃣ [مبادرة ثالثة...]                                │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Card Components

- **Rank Badge**: `1️⃣`, `2️⃣`, `3️⃣`
- **Title**: `title_ar` من الـ API
- **KPI/Dim Info**: عرض المؤشر والبُعد بشكل واضح
- **Priority Score**: رقم + emoji (>80 🔥, 60-80 ⚠️, <60 ✅)
- **CTAs**:
  - **إنشاء خطة عمل**: ينقل إلى Gate-H (Action Plans) مع pre-filled data
  - **التفاصيل**: يفتح modal/drawer مع `body_ar` كامل

### التفاعلات

- **Click "إنشاء خطة عمل"**:
  - ينقل إلى `/admin/action-plans/new`
  - يملأ الحقول تلقائياً (KPI, dim, description)
  - يربط بـ `quarterly_insights.id` كمصدر
- **Click "التفاصيل"**:
  - يفتح dialog/drawer
  - يعرض الوصف الكامل + خطوات مقترحة

---

## 5) Export Controls

### الغرض
تصدير التقرير الربع سنوي بصيغ متعددة.

### البنية

```
┌─────────────────────────────────────────────┐
│  📥 تصدير التقرير                           │
│                                             │
│  [ 📄 تحميل Markdown ]                     │
│  [ 📊 تحميل JSON ]                         │
│  [ 📧 إرسال عبر البريد ]                   │
│                                             │
│  الحالة: ✅ جاهز للتصدير                   │
└─────────────────────────────────────────────┘
```

### التفاعلات

- **تحميل Markdown**:
  - يستدعي Edge Function: `populate_quarterly_report(year, quarter)`
  - يرجع `.md` file مملوء بالبيانات
  - يُنزّل الملف: `quarterly_report_Q1_2025.md`
- **تحميل JSON**:
  - يصدر الـ raw JSON من `get_quarterly_insights()`
  - يُنزّل الملف: `quarterly_insights_Q1_2025.json`
- **إرسال عبر البريد**:
  - يفتح dialog لإدخال البريد الإلكتروني
  - يرسل التقرير كـ attachment (future feature)

### RBAC

| Role | Download MD | Download JSON | Email | Notes |
|------|-------------|---------------|-------|-------|
| viewer | ❌ | ❌ | ❌ | قراءة فقط |
| analyst | ✅ | ✅ | ✅ | تصدير كامل |
| tenant_admin | ✅ | ✅ | ✅ | تصدير كامل |

---

## Interaction Flow

```
[Landing Page]
      ↓
[Select Year/Quarter]
      ↓
[Load Data via GET /insights/quarterly]
      ↓
   ┌─── Data Exists? ───┐
   │                    │
  YES                  NO
   │                    │
   ↓                    ↓
[Show Dashboard]   [Show "Generate" CTA]
   │                    │
   ├─ KPI Summary       ↓
   ├─ RCA Highlights   [Click "Generate"]
   ├─ Top-3 Cards           ↓
   └─ Export           [POST /generate]
                            ↓
                       [Show Success Toast]
                            ↓
                       [Reload Dashboard]
```

---

## Notifications & Toasts

### On Generate Success
```
✅ تم توليد المبادرات بنجاح
47 مبادرة مُقترحة بناءً على 12 مؤشر

[ عرض التقرير ]
```

### On Generate Error
```
❌ فشل توليد المبادرات
لا توجد بيانات كافية للربع المحدد

[ إعادة المحاولة ]
```

### On Export Success
```
✅ تم تحميل التقرير
quarterly_report_Q1_2025.md

[ فتح المجلد ]
```

---

## Deep Links

| Action | Target Route | Query Params |
|--------|-------------|--------------|
| View KPI Details | `/admin/kpis/:kpi_key` | `?quarter=1&year=2025` |
| RCA Drill-Down | `/admin/rca/:kpi_key/:dim_key` | `?quarter=1&year=2025` |
| Create Action Plan | `/admin/action-plans/new` | `?source=quarterly_insights&id=:insight_id&initiative_rank=:rank` |

---

## Responsive Design

### Desktop (≥1024px)
- Grid layout: 3 columns (KPI cards)
- Side-by-side RCA + Top-3

### Tablet (768px-1023px)
- Grid layout: 2 columns
- Stacked RCA + Top-3

### Mobile (<768px)
- Single column layout
- Collapsible sections
- Swipeable cards for initiatives

---

## Loading States

### Initial Load
```
┌─────────────────────────────────────┐
│  ⏳ جاري تحميل البيانات...          │
│                                     │
│  [Skeleton Grid]                    │
│  [Skeleton Cards]                   │
└─────────────────────────────────────┘
```

### Generate in Progress
```
┌─────────────────────────────────────┐
│  🔄 جاري توليد المبادرات...         │
│                                     │
│  قد يستغرق الأمر بضع ثوانٍ          │
│                                     │
│  [Progress Spinner]                 │
└─────────────────────────────────────┘
```

---

## Error States

### No Data Available
```
┌─────────────────────────────────────┐
│  📭 لا توجد بيانات                  │
│                                     │
│  لم يتم توليد insights لهذا الربع  │
│                                     │
│  [ توليد الآن ]                     │
└─────────────────────────────────────┘
```

### Permission Denied
```
┌─────────────────────────────────────┐
│  🔒 غير مصرّح لك                    │
│                                     │
│  ليس لديك صلاحية لعرض هذا المحتوى  │
│                                     │
│  [ العودة ]                         │
└─────────────────────────────────────┘
```

---

## Component Hierarchy

```
QuarterlyInsightsDashboard
├── QuarterSelector
│   ├── YearDropdown
│   └── QuarterChips
├── GenerateButton (analyst+)
├── KpiSummaryGrid
│   └── KpiCard[]
├── RcaHighlights
│   └── DimensionBarChart[]
├── Top3InitiativesSection
│   └── InitiativeCard[]
│       ├── RankBadge
│       ├── KpiDimInfo
│       ├── PriorityScore
│       └── ActionButtons
└── ExportControls (analyst+)
    ├── DownloadMarkdownButton
    ├── DownloadJsonButton
    └── EmailButton
```

---

## Future Enhancements

- [ ] Quarterly comparison view (Q1 vs Q2 vs Q3...)
- [ ] Initiative status tracking (approved/in-progress/completed)
- [ ] AI-powered recommendations refinement
- [ ] Multi-tenant benchmarking (anonymized)
- [ ] Auto-email reports on quarter-end

---

**نهاية المستند**
