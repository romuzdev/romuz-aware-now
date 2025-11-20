# Gate-K — Recommendations & Gate-H Linkage (v1.0)

**المشروع:** Romuz Awareness Platform  
**الوحدة:** Gate-K (KPI Trends, Anomalies & RCA)  
**الإصدار:** v1.0  
**التاريخ:** 2025-11-11  
**الحالة:** ✅ مُنفَّذ (Part 4.C + 4.D)

---

## 1) الغرض

تحويل نتائج تحليل الاتجاهات والانحرافات والـ RCA (Root Cause Analysis) إلى **توصيات قابلة للتنفيذ وعالية الأثر** تساعد فرق الـ Governance على:

- **التعرف الفوري** على الأبعاد المساهمة في الانحرافات الحرجة (alert/warn)
- **الحصول على إجراءات موصى بها** مرتبطة بنظام Action Plans (Gate-H)
- **تحديد الأولويات** بناءً على Impact Level + Effort Estimate + Contribution Score
- **الربط المباشر** بين الأداء الشهري للـ KPIs والإجراءات التصحيحية

---

## 2) مصادر البيانات

### 2.1 الجداول والـ Materialized Views

| المصدر | الدور |
|--------|-------|
| `mv_kpi_monthly_flags` | تحديد الـ KPIs ذات الحالة `warn` أو `alert` في شهر معين |
| `mv_rca_monthly_top_contributors` | تحديد الأبعاد (dimensions) الأكثر مساهمة في الانحراف لكل KPI |
| `reco_templates` | قوالب التوصيات المُعدّة مسبقاً (mapping بين KPI + dimension → action type) |
| `reco_generated` | التوصيات المُولّدة تلقائياً بناءً على بيانات الشهر |
| `mv_reco_proposals` | MV يجمع بين RCA + Flags + Templates لاقتراح توصيات قبل الحفظ |

### 2.2 Data Flow

```
mv_kpi_monthly_flags (flag='alert'/'warn')
         +
mv_rca_monthly_top_contributors (top dimensions)
         +
reco_templates (KPI+dim → action mapping)
         ↓
mv_reco_proposals (ranked proposals)
         ↓
generate_recommendations() function
         ↓
reco_generated (persisted recommendations)
```

---

## 3) نماذج القواعد (Rule Templates)

### 3.1 جدول `reco_templates`

يحتوي على قوالب التوصيات المُعدّة مسبقاً:

| الحقل | الوصف | مثال |
|-------|-------|------|
| `kpi_key` | مفتاح الـ KPI المستهدف | `'campaign_completion_rate'` |
| `trend_window` | النافذة الزمنية | `'m1'` (شهر واحد) |
| `dim_key` | البُعد المُحلل | `'department'` |
| `trigger_flag` | متى تُفعّل التوصية | `'alert'` أو `'warn'` |
| `action_type_code` | كود نوع الإجراء في Gate-H | `'training_campaign'` |
| `title_ar` | عنوان التوصية بالعربية | `"تحسين معدل الإتمام للقسم"` |
| `body_ar` | نص التوصية بالعربية | `"القسم {dim_value} يُظهر انخفاضاً بنسبة {delta_pct}%. يُوصى بإجراء حملة توعية مكثفة."` |
| `impact_level` | مستوى الأثر | `'high'`, `'medium'`, `'low'` |
| `effort_estimate` | تقدير الجهد المطلوب | `'S'`, `'M'`, `'L'`, `'XL'` |

### 3.2 أمثلة نماذج

#### مثال 1: انخفاض معدل الإتمام - قسم معين
```sql
INSERT INTO reco_templates (
  tenant_id, kpi_key, trend_window, dim_key, trigger_flag,
  action_type_code, title_ar, body_ar, impact_level, effort_estimate
) VALUES (
  '{{tenant_id}}',
  'campaign_completion_rate',
  'm1',
  'department',
  'alert',
  'training_campaign',
  'حملة توعية مكثفة للقسم',
  'القسم {dim_value} يُظهر انخفاضاً حاداً بنسبة {delta_pct}% في معدل إتمام الحملات. يُوصى بإطلاق حملة توعية مكثفة مستهدفة.',
  'high',
  'M'
);
```

#### مثال 2: ارتفاع معدل النقر على التصيّد - قناة معينة
```sql
INSERT INTO reco_templates (
  tenant_id, kpi_key, trend_window, dim_key, trigger_flag,
  action_type_code, title_ar, body_ar, impact_level, effort_estimate
) VALUES (
  '{{tenant_id}}',
  'phishing_click_rate',
  'm1',
  'channel',
  'warn',
  'targeted_training',
  'تدريب مستهدف على التصيّد',
  'القناة {dim_value} تُظهر زيادة في معدل النقر على التصيّد بنسبة {delta_pct}%. يُوصى بتدريب مستهدف لمستخدمي هذه القناة.',
  'medium',
  'S'
);
```

---

## 4) آلية التوليد

### 4.1 Materialized View: `mv_reco_proposals`

تجمع بين:
- نتائج RCA (`mv_rca_monthly_top_contributors`)
- حالات الانحراف (`mv_kpi_monthly_flags`)
- قوالب التوصيات (`reco_templates`)

**Logic:**
1. يربط كل dimension contributor مع الـ flag المناسب (alert/warn)
2. يطابق الـ template بناءً على: `kpi_key + trend_window + dim_key + trigger_flag`
3. يُرتب النتائج بـ `priority_rnk`:
   - أولاً: حسب شدة الـ flag (`alert` > `warn`)
   - ثانياً: حسب قوة المساهمة (`ABS(contribution_score) DESC`)
   - ثالثاً: حسب ترتيب المُساهم (`contributor_rnk`)

### 4.2 الدالة: `generate_recommendations()`

**التوقيع:**
```sql
generate_recommendations(
  p_month DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000
) RETURNS INTEGER
```

**السلوك:**
1. تسترجع المقترحات من `mv_reco_proposals` للشهر المحدد
2. تحدد Top 50 recommendation حسب `priority_rnk`
3. تُدخل التوصيات في `reco_generated` مع:
   - De-duplication عبر `UNIQUE (tenant_id, kpi_key, month, trend_window, dim_key, dim_value, action_type_code)`
   - حفظ `source_ref` يحتوي على: `contributor_rnk, priority_rnk, delta_pct, contribution_score, share_ratio, variance_from_overall_pct`
4. تُرجع عدد التوصيات المُدخلة

**مثال استدعاء:**
```sql
-- Generate recommendations for current month
SELECT generate_recommendations(DATE_TRUNC('month', CURRENT_DATE)::DATE);

-- Generate recommendations for specific month with limit
SELECT generate_recommendations('2025-01-01'::DATE, 500);
```

### 4.3 سياسة الـ De-duplication

التوصيات **لا تُكرر** إذا كانت:
- نفس الـ `tenant_id + kpi_key + month + trend_window + dim_key + dim_value + action_type_code`
- هذا يضمن عدم تكرار نفس التوصية إذا تم تشغيل الدالة مرتين

---

## 5) الربط مع Gate-H (Action Plans)

### 5.1 الربط الحالي (v1.0)

**Manual Linkage:**
- حقل `action_type_code` في `reco_generated` يُشير إلى نوع الإجراء المُوصى به
- **يدوياً:** يمكن للمستخدم في الـ UI:
  1. عرض التوصيات من `get_recommendations()`
  2. النقر على "إنشاء إجراء" (Create Action)
  3. يتم نقله إلى Gate-H مع pre-fill لحقول الإجراء بناءً على التوصية

### 5.2 الربط المقترح (v1.1)

**Automatic Action Creation:**
```typescript
// Pseudo-code for frontend/backend integration
async function approveAndCreateAction(recommendationId: bigint) {
  // 1. Fetch recommendation
  const reco = await supabase
    .from('reco_generated')
    .select('*')
    .eq('id', recommendationId)
    .single();

  // 2. Create action in Gate-H via API
  const action = await fetch('/api/gate-h/actions', {
    method: 'POST',
    body: JSON.stringify({
      title: reco.title_ar,
      description: reco.body_ar,
      action_type_code: reco.action_type_code,
      priority: reco.impact_level,
      estimated_effort: reco.effort_estimate,
      linked_kpi: reco.kpi_key,
      source_ref: {
        type: 'gate_k_recommendation',
        recommendation_id: reco.id,
        month: reco.month,
      },
    }),
  });

  // 3. Update recommendation status
  await supabase
    .from('reco_generated')
    .update({
      status: 'implemented',
      reviewed_by: currentUserId,
      reviewed_at: new Date(),
    })
    .eq('id', recommendationId);
}
```

### 5.3 حقول الربط

| حقل في `reco_generated` | الاستخدام في Gate-H |
|-------------------------|---------------------|
| `action_type_code` | نوع الإجراء |
| `title_ar` | عنوان الإجراء |
| `body_ar` | وصف الإجراء |
| `impact_level` | الأولوية (high → urgent) |
| `effort_estimate` | تقدير الوقت/الجهد |
| `source_ref` | metadata للربط العكسي |

---

## 6) الأمن والحوكمة

### 6.1 Row-Level Security (RLS)

جميع جداول التوصيات محمية بـ RLS:

```sql
-- reco_templates
WHERE tenant_id = app_current_tenant_id()

-- reco_generated
WHERE tenant_id = app_current_tenant_id()

-- mv_reco_proposals (via base tables)
WHERE tenant_id = app_current_tenant_id()
```

### 6.2 RBAC Roles

| الدور | الصلاحيات |
|-------|-----------|
| `tenant_admin` | إنشاء/تعديل/حذف templates + توليد recommendations |
| `compliance_manager` | توليد recommendations + review + approve |
| `analyst` | عرض recommendations فقط (read-only) |
| `viewer` | لا يوجد وصول |

### 6.3 Audit Trail

جميع التوصيات المُولّدة تحتوي على:
- `created_at`: وقت التوليد
- `source_ref`: مرجع تفصيلي للبيانات المصدرية (RCA metrics)
- `status`: حالة التوصية (pending/reviewed/implemented/dismissed)
- `reviewed_by` + `reviewed_at`: من راجع التوصية ومتى

### 6.4 Security Definer Functions

جميع الدوال تستخدم `SECURITY DEFINER` لضمان:
- تنفيذ الـ query بصلاحيات الدالة (bypass RLS)
- لكن مع فرض `app_current_tenant_id()` لضمان tenant isolation
- `SET search_path = public` لمنع schema hijacking

---

## 7) خارطة الطريق

### v1.0 (Current) ✅
- [x] `reco_templates` table
- [x] `reco_generated` table
- [x] `mv_reco_proposals` MV
- [x] `generate_recommendations()` function
- [x] `get_recommendations()` RPC
- [x] `get_rca_top_contributors()` RPC
- [x] Basic status workflow (pending/reviewed/implemented/dismissed)

### v1.1 (Q1 2026)
- [ ] تخصيص قوالب لكل قسم (department-specific templates)
- [ ] API endpoint لإنشاء Action في Gate-H تلقائياً
- [ ] Batch approval UI (approve multiple recommendations at once)
- [ ] Recommendation impact tracking (did it work?)

### v2.0 (Q2 2026)
- [ ] توصيات سياقية مع baseline موسمي (seasonal baselines)
- [ ] Historical effectiveness scoring (track success rate of recommendations)
- [ ] Smart template suggestions based on past outcomes
- [ ] Multi-dimensional recommendations (combine multiple contributors)

### v3.0 (Q3 2026)
- [ ] توصيات مدعومة بنماذج ML
- [ ] Predictive recommendations (before anomalies occur)
- [ ] Natural language generation for recommendation text
- [ ] A/B testing framework for recommendation effectiveness

---

## 8) أمثلة الاستخدام

### 8.1 توليد التوصيات الشهرية

```sql
-- Generate recommendations for January 2025
SELECT generate_recommendations('2025-01-01'::DATE);
-- Returns: number of recommendations generated

-- View generated recommendations
SELECT * FROM get_recommendations('2025-01-01'::DATE);
```

### 8.2 فلترة التوصيات حسب الـ KPI

```sql
-- Get recommendations for specific KPI
SELECT * FROM get_recommendations(
  p_month := '2025-01-01'::DATE,
  p_kpi_key := 'campaign_completion_rate'
);
```

### 8.3 فلترة التوصيات حسب الحالة

```sql
-- Get pending recommendations only
SELECT * FROM get_recommendations(
  p_month := '2025-01-01'::DATE,
  p_status := 'pending'
);
```

### 8.4 عرض Top Contributors للتوصية

```sql
-- Get RCA details for a specific recommendation
SELECT * FROM get_rca_top_contributors(
  p_kpi_key := 'campaign_completion_rate',
  p_month := '2025-01-01'::DATE,
  p_trend_window := 'm1',
  p_dim_key := 'department',
  p_top_n := 5
);
```

---

## 9) Sign-off

| المراجع | الدور | التاريخ | التوقيع |
|---------|------|---------|---------|
| [اسم المراجع] | Solution Architect | 2025-11-11 | ✅ |
| [اسم المراجع] | Security Lead | 2025-11-11 | ⏳ |
| [اسم المراجع] | Product Owner | 2025-11-11 | ⏳ |

---

**End of Document**
