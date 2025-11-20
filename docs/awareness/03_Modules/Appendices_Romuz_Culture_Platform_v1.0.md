
# Appendices — Romuz Cybersecurity Culture Platform
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Sub-conversation continuation — Multi-tenant SaaS with per-DB isolation.  
**Covers:** M1–M20 + this Appendices pack

---

## جدول المحتويات (Table of Contents)
A. [المصطلحات والقاموس (Glossary)](#a-المصطلحات-والقاموس-glossary)  
B. [طبقة الدلالات (Semantic Layer)](#b-طبقة-الدلالات-semantic-layer)  
C. [سجل عقود البيانات (Data Contracts Registry)](#c-سجل-عقود-البيانات-data-contracts-registry)  
D. [موجز API & Webhooks](#d-موجز-api--webhooks)  
E. [مصفوفة RBAC/RLS المختصرة](#e-مصفوفة-rbacrls-المختصرة)  
F. [مانفستو حزم الأدلة (Evidence Pack Manifest)](#f-مانفستو-حزم-الأدلة-evidence-pack-manifest)  
G. [مصفوفة الاحتفاظ والخصوصية](#g-مصفوفة-الاحتفاظ-والخصوصية)  
H. [سير عمل DSRs](#h-سير-عمل-dsrs)  
I. [التقويم الامتثالي والجاهزية](#i-التقويم-الامتثالي-والجاهزية)  
J. [استراتيجية الاختبار (Digest)](#j-استراتيجية-الاختبار-digest)  
K. [البيئات والتكوين](#k-البيئات-والتكوين)  
L. [التسمية والنسخ والترحيلات](#l-التسمية-والنسخ-والترحيلات)  
M. [النسخ الاحتياطي والتعافي (DR)](#m-النسخ-الاحتياطي-والتعافي-dr)  
N. [فهرس لوحات BI وتقارير المجلس](#n-فهرس-لوحات-bi-وتقارير-المجلس)  
O. [النماذج الجاهزة (Templates)](#o-النماذج-الجاهزة-templates)  
P. [إمكانية الوصول والتعريب](#p-إمكانية-الوصول-والتعريب)  
Q. [أمن المنصّة (Hardening)](#q-أمن-المنصّة-hardening)  
R. [سيناريوهات مخاطر محورية](#r-سيناريوهات-مخاطر-محورية)  
S. [كتالوج المؤشرات (KPI Catalog)](#s-كتالوج-المؤشرات-kpi-catalog)  
T. [فهرس كامل للموديولات والوثائق](#t-فهرس-كامل-للموديولات-والوثائق)

---

## A. المصطلحات والقاموس (Glossary)
**AR ↔ EN** ترجمات مختصرة للكيانات الأساسية المستخدمة عبر الوثائق:
- **Tenant (المستأجر):** كيان العميل داخل النظام.  
- **Capability (قدرة):** صلاحية دقيقة مرتبطة بالدور.  
- **Culture Index (مؤشر الثقافة):** مقياس مركّب (E/L/B/P/C).  
- **Phish-prone% (قابلية التصيّد):** نسبة المستخدمين الذين نقروا على رابط تصيّد.  
- **Evidence Pack (حزمة أدلة):** مجموعة منظّمة من الملفات/الروابط والأختام الزمنية والتجزئة.  
- **RCA (تحليل السبب الجذري):** منهج 5Whys/Ishikawa لتحديد السبب الجذري.  
- **Risk Appetite (شهية المخاطر):** حدود مقبولة لكل بعد مخاطر.  
- **Residual Risk (الخطر المتبقي):** الخطر بعد تطبيق الضوابط والمعالجات.  
- **Access Drift (انجراف الوصول):** صلاحيات غير مبرّرة نسبةً للإسناد المعتمد.

---

## B. طبقة الدلالات (Semantic Layer)
**تعريفات صيغ قياس رسمية (اختصار):**
- **Completion Rate** = `completed_users / targeted_users`  
- **Phish-prone %** = `clicked / delivered`  
- **TTP90 (Training Time Percentile 90th)**: الزمن اللازم لـ90% إكمالًا.  
- **MTTD/MTTR**: متوسط زمن الاكتشاف/الاستعادة وفق تواريخ incident.  
- **Culture Index (E/L/B/P/C):** متوسط موزون لمكونات المشاركة (Engagement)، التعلم (Learning)، السلوك (Behavior)، الإدراك (Perception)، الامتثال (Compliance).

**مثال View (اسمّي):**
```sql
CREATE VIEW sem.culture_index_monthly AS
SELECT tenant_id, date_trunc('month', snapshot_at) AS month,
       weighted_avg(e_score, l_score, b_score, p_score, c_score) AS culture_index
FROM kpi_snapshots
WHERE metric_group = 'culture_index';
```

---

## C. سجل عقود البيانات (Data Contracts Registry)
**Inbound Example — Campaign Results (CSV):**
```csv
campaign_id,user_id,delivered,opened,clicked,reported,completed_at
c_001,u_101,1,1,0,1,2025-03-04T10:22:00Z
```

**Outbound Example — KPI Snapshot (JSON):**
```json
{
  "tenant_id": "t_123",
  "metric": "phish_prone_pct",
  "value": 0.072,
  "snapshot_at": "2025-04-01T00:00:00Z",
  "source": "sem.layer.v1"
}
```

**Policy:** Versioning لكل Schema مع سياسة backward-compatible متى أمكن.

---

## D. موجز API & Webhooks
- **OpenAPI:** v1 ثابتة؛ إضافات متوافقة v1.1 لاحقًا.  
- **Idempotency-Key** للعمليات المنشئة؛ **HMAC-SHA256** لتوقيع Webhooks.  

**Webhook Signature (Pseudo):**
```text
X-Romuz-Signature: t={timestamp},v1={hex(hmac_sha256(secret, timestamp+"."+body))}
```

---

## E. مصفوفة RBAC/RLS المختصرة
| Role | Core Capabilities (نماذج) | نطاق RLS |
|---|---|---|
| Platform Admin | tenants:read, policies:write | كلّ المنصّة (مع حذر) |
| Program Owner | campaigns:write, kpi:read | مستأجره فقط |
| Security Analyst | incidents:write, risks:read | قسم/نطاق أمني |
| Manager | reviews:approve | وحدة تنظيمية |
| Viewer | dashboards:read | قراءة فقط |

**قاعدة عامة:** RLS = Tenant Partitioning + Org/Asset Sensitivity.

---

## F. مانفستو حزم الأدلة (Evidence Pack Manifest)
**هيكل مجلدات قياسي:**
```
/evidence/{tenant}/{yyyy-mm}/
  incident_{id}/timeline.json
  incident_{id}/attachments/{hash}.pdf
  training/campaign_{id}/results.csv
  approvals/{doc_id}.signed.pdf
  manifest.yml
```
**manifest.yml (مثال):**
```yaml
pack_id: EP-2025Q1-INC-42
tenant: t_123
includes:
  - incident: INC-42
  - rca: RCA-42
  - approvals: [APP-77, APP-78]
hash_chain: [ "a9f...", "b2c..." ]
```

---

## G. مصفوفة الاحتفاظ والخصوصية
| كيان | فئة بيانات | احتفاظ افتراضي | استثناء Legal Hold |
|---|---|---|---|
| incidents | Confidential | 5 سنوات | يعلّق الحذف |
| evidence | Restricted | 7 سنوات | يعلّق الحذف |
| phishing results | Confidential | 24 شهرًا | حسب التحقيق |
| training records | PII | 36 شهرًا | حسب القانون |
| audit_logs | Audit | أرشفة باردة بعد 7 سنوات | لا حذف |

---

## H. سير عمل DSRs
**Access / Erasure — مختصر إجراءات:**
1) استلام الطلب والتحقق من الهوية.  
2) تجميع البيانات من الجداول ذات الصلة (M14 lineage).  
3) **Access Package** بصيغة PDF/ZIP أو **Selective Erasure** مع استثناءات مشروحة.  
4) قفل الأثر التدقيقي وربط التواريخ بـ SLA.

**قوالب رد مختصرة (AR/EN)** مضمّنة في قسم O.

---

## I. التقويم الامتثالي والجاهزية
**دورية افتراضية (قابلة للتخصيص):**
- اختبارات ضوابط (M18): شهري/ربع سنوي.  
- مراجعات وصول (M17): ربع سنوي.  
- حملات توعية/تصيّد (M2/M9): شهري.  
- Board Pack (M19): شهري/ربع سنوي.  

**قائمة تحقّق Pre-Audit (مختصر):**
- تغطية KPIs ≥ 95% في M14،  
- Evidence Packs كاملة للحوادث الحرجة،  
- لا تجاوزات Appetite مفتوحة بلا Action،  
- تنفيذ احتفاظ/DSR وفق M16.

---

## J. استراتيجية الاختبار (Digest)
- **Layers:** DB/RLS, Services, UI, Security, E2E.  
- **حد أدنى للتغطية:** Services 70%، UI 50%، Security سرية/سلامة/توفر.  
- **Defect Matrix:** `Severity(P1–P4) × Priority(High/Med/Low) × SLA`.

---

## K. البيئات والتكوين
**متغيرات رئيسية (أمثلة):**
```bash
ROMUZ_ENV=prod
ROMUZ_TENANT_DB_URL=postgres://...
ROMUZ_API_RATE_LIMIT=600
ROMUZ_WEBHOOK_SECRET=***
```

---

## L. التسمية والنسخ والترحيلات
- **Tables:** snake_case • **PKs:** uuid • **FKs:** suffix _id.  
- **اصدارات الوثائق/الواجهات:** v1 ثابتة؛ v1.1 إضافات متوافقة.  
- **Migrations:** forwards أولًا + backfills آمنة + rollback مخطّط.

---

## M. النسخ الاحتياطي والتعافي (DR)
- **RPO/RTO** مقترح: RPO ≤ 15m, RTO ≤ 2h.  
- **اختبار استعادة** ربع سنوي بتمرين موثّق.  
- **قائمة الجداول الحرجة:** incidents, evidence, kpi_snapshots, audit_logs.

---

## N. فهرس لوحات BI وتقارير المجلس
| لوحة/تقرير | مصدر | مؤشرات رئيسية |
|---|---|---|
| Executive Snapshot | M14/M19 | Culture Index, Appetite, Incidents |
| Ops Dashboard | M14 | Campaigns, Phishing, MTTR |
| Risk & Controls | M13/M18 | Residual Risk, Control Pass Rate |

---

## O. النماذج الجاهزة (Templates)
**CSV Templates (عينات):**
```csv
# users_import.csv
external_id,first_name,last_name,email,org_unit,role
emp-1001,Sara,AlRashed,sara@example.com,Legal,Manager
```
```csv
# vendors_import.csv
vendor_name,tier,criticality,services,contact_email
Acme MSP,2,high,"email, soc",contact@acme.com
```

**JSON Samples (API):**
```json
{
  "name": "Q1 Board Pack",
  "period": "2025-Q1",
  "format": "pdf",
  "notify": true
}
```

**رسائل DSR (AR/EN) — مقتطفات قصيرة**
- **AR:** "تم استلام طلب الوصول الخاص بكم بتاريخ {date}، سنوافيكم بالرد خلال 15 يومًا كحد أقصى."  
- **EN:** "We received your access request on {date}. You will receive a response within 15 days."

---

## P. إمكانية الوصول والتعريب
- دعم RTL كامل، تباين لوني مناسب، نصوص بديلة للصور، مفاتيح اختصار.  
- قواعد i18n: رسائل بنصوص متغيرة، عدم ترصين التواريخ/الأرقام داخل النصوص.

---

## Q. أمن المنصّة (Hardening)
- **Rate Limits:** طبقية لكل مفتاح/نطاق.  
- **Replay Protection:** توقيع مع timestamp ≤ 5 دقائق.  
- **Upload Policy:** قيود الحجم/النوع + فحص محتوى.  
- **Schema Validation:** لكل Payload وارد وصادر.  
- **Monitoring:** سجلات موحّدة + تنبيهات شذوذ.

---

## R. سيناريوهات مخاطر محورية
1) **Phishing Escalations** على قسم حساس.  
2) **Mis-provisioning** يمنح صلاحية إدارية بالخطأ.  
3) **Data Leak** من طرف مورّد.  
4) **Dormant Privileged Accounts** دون مراجعة.  
**روابط:** كل سيناريو ↔ (Controls, Tests, Awareness, Treatments).

---

## S. كتالوج المؤشرات (KPI Catalog)
| KPI | التعريف | الصيغة/المصدر | التحديث | العتبات (R/A/G) | المالك |
|---|---|---|---|---|---|
| Completion Rate | نسبة الإكمال للحملات | sem.layer v1 | يومي | <70% / 70–85% / ≥85% | Program Owner |
| Phish-prone % | قابلية التصيد | sem.layer v1 | أسبوعي | >10% / 5–10% / ≤5% | Security Lead |
| MTTR | زمن الاستعادة | incidents | أسبوعي | >72h / 24–72h / ≤24h | SecOps |
| Control Pass | نسبة نجاح الاختبارات الحرجة | M18 | شهري | <70% / 70–85% / ≥85% | Control Owner |
| Access Drift | صلاحيات غير مبررة | M17 | شهري | >15% / 8–15% / ≤8% | IAM |

---

## T. فهرس كامل للموديولات والوثائق
- **M1–M20:** جميع ملفات .md المعتمدة ضمن هذه السلسلة.  
- **Appendices (هذا الملف):** v1.0 (2025-11-08).  
- **نطاق العزل:** جميع الملفات واللوحات مبنية على per-DB isolation وRLS.

---

**ملاحظة تنفيذية:** هذا الملحق يوحّد العناصر المرجعية للمنصة (مصطلحات، مقاييس، عقود بيانات، RBAC، أدلة، خصوصية، اختبار، أمن، تقويم امتثال) بما يتوافق مع قرارات M1–M20 ويخدم فرق التنفيذ/التدقيق/الإدارة التنفيذية.
