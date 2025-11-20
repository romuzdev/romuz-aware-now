
# Appendices — Romuz Cybersecurity Culture Platform
**Version:** v1.1 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Sub-conversation continuation — Multi-tenant SaaS with per-DB isolation.  
**Coverage:** **M1 → M25** + Appendix-I (تفصيلي)

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
I. [التقويم الامتثالي والجاهزية — ملخّص](#i-التقويم-الامتثالي-والجاهزية--ملخّص)  
J. [استراتيجية الاختبار (Digest + Pack‑T Mapping)](#j-استراتيجية-الاختبار-digest--packt-mapping)  
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
**إضافات v1.1:**  
- **Pre-Audit Snapshot (M21)**: لقطة جاهزية آلية مع evidence_index.  
- **Calendar Item (M21)**: عنصر تقويم قياسي (type/framework/owner/due/evidence).  
- **Role/Risk Journey (M22)**: رحلة تدريبية قصيرة حسب الدور/المخاطر.  
- **A/B Run & Variant (M23)**: تجربة متغيرات لقياس فتح/نقر/تبليغ/تحويل.  
- **Exploration (M24)**: استكشاف تحليلي على Semantic Layer.  
- **DQ Gate / DQ Alert (M24)**: بوابات/تنبيهات جودة بيانات.  
- **Health Score & Playbook (M25)**: درجة صحة المستأجر ووصفات تحسين قابلة للتنفيذ.

---

## B. طبقة الدلالات (Semantic Layer)
**Views مرجعية (v1.1) تغطي M1→M25:**  
- **الأساس (M1–M11):** sem.culture_index_monthly, sem.phishing_results_v1, sem.campaigns_v1, sem.evidence_v1 …  
- **M12:** sem.hrms_jit_events_v1  
- **M13:** sem.incidents_v1, sem.risks_bridge_v1  
- **M14:** sem.kpi_snapshots (مصدر الحقيقة للمقاييس)  
- **M15:** sem.api_usage_v1  
- **M16:** sem.privacy_retention_checks_v1  
- **M17:** sem.access_reviews_v1, sem.access_drift_v1  
- **M18:** sem.controls_tests_v1  
- **M19:** sem.exec_reports_v1  
- **M20:** sem.vendors_risk_v1  
- **M21:** **sem.calendar_items_v1**, **sem.audit_readiness_v1**  
- **M22:** **sem.training_journeys_v1**, **sem.training_progress_v1**  
- **M23:** **sem.studio_ab_results_v1**  
- **M24:** **sem.kpi_freshness_v1**, **sem.kpi_nulls_v1**  
- **M25:** **sem.success_health_v1**, **sem.success_playbooks_v1**

> كل View محدد بالأعمدة الأساسية، مفاتيح التقسيم الزمنية، وسياسة الانضمام القياسية. مصدر المقاييس الوحيد: **M14**.

---

## C. سجل عقود البيانات (Data Contracts Registry)
**Inbound (أمثلة جديدة):**
```csv
# training_progress.csv (M22)
assignment_id,module_id,started_at,completed_at,score
A-1001,M-10,2025-02-01T10:00:00Z,2025-02-01T10:05:00Z,85
```
```csv
# studio_ab_metrics.csv (M23)
run_id,variant_id,delivered,opened,clicked,reported,converted
RUN-9,V-B,1000,340,48,4,9
```

**Outbound (أمثلة جديدة):**
```json
{
  "type": "pre_audit_snapshot",                // M21
  "tenant_id": "t_123",
  "period": "2025-Q1",
  "evidence_index": [{"item_id":"AR-REV-Q1-01","hash":"a9f..","timestamp":"2025-03-31T12:00:00Z"}]
}
```
```json
{
  "type": "tenant_health_snapshot",            // M25
  "tenant_id": "t_123",
  "score_overall": 0.78,
  "adoption": 0.71, "dq": 0.92, "readiness": 0.66, "risk_hygiene": 0.84,
  "snapshot_at": "2025-04-01T00:00:00Z"
}
```

**Versioning:** `v1.1` متوافقة خلفيًا؛ الحقول الجديدة Optional.

---

## D. موجز API & Webhooks
- **M21:** `GET /v1/compliance/calendar`, `POST /v1/audit/snapshot` • Webhook: `audit.snapshot.ready`
- **M22:** `POST /v1/training/journeys|assignments|progress` • Webhooks: `training.assignment.created`, `training.completed`
- **M23:** `POST /v1/studio/templates|.../variants|.../publish` • Webhook: `studio.ab.results.ready`
- **M24:** `POST /v1/analytics/explorations|run|share` • Webhook: `analytics.dq.alert`
- **M25:** `POST /v1/success/health/recompute|playbooks/run|wizard/state` • Webhook: `success.health.updated`

**التوقيع (HMAC):**
```text
X-Romuz-Signature: t={timestamp},v1={hex(hmac_sha256(secret, timestamp+"."+body))}
```

---

## E. مصفوفة RBAC/RLS المختصرة
| Role | قدرات أساسية | نطاق RLS |
|---|---|---|
| Compliance Lead (M21) | calendar:write, snapshot:run | tenant + org_unit |
| Learning Owner (M22) | journeys:write, assign:write | tenant + org_unit |
| Studio Publisher (M23) | templates:publish, ab:run | tenant |
| Analytics Curator (M24) | explorations:write|share | tenant + role scope |
| Success Owner (M25) | health:compute, playbooks:run | tenant |
| Exec Viewer | dashboards:read | tenant |

**قاعدة عامة:** RLS = Tenant Partition + Org/Asset Sensitivity. تصدير بدون PII افتراضيًا (M16).

---

## F. مانفستو حزم الأدلة (Evidence Pack Manifest)
هيكل موحّد يشمل مصادر الأدلة الجديدة:  
- **M21:** فهرس `evidence_index` بسمات `{path, hash, timestamp, verifier}`.  
- **M22:** **Quiz Trails** (مسارات صعوبة/أسئلة) موقّعة لنزاهة التقييم.  
- **M23:** نتائج **A/B** مع hash chain لملفات artifacts.  
- **M24:** **Exploration Exports** موقّتة بلا PII افتراضيًا.  
- **M25:** مخرجات Health Compute (المدخلات/المعادلات/النتائج).

---

## G. مصفوفة الاحتفاظ والخصوصية
| كيان | فئة | احتفاظ افتراضي | ملاحظات |
|---|---|---|---|
| training_progress (M22) | PII | 36 شهرًا | تنميط أسماء افتراضيًا في التقارير |
| studio_ab_metrics (M23) | Confidential | 24 شهرًا | أرشفة نتائج العيّنات |
| exploration_exports (M24) | Confidential | 12 شهرًا | روابط مؤقتة (TTL) |
| success_health_snapshots (M25) | Restricted | 36 شهرًا | أرشفة باردة لاحقًا |

---

## H. سير عمل DSRs
- نفس الإجراءات القياسية (Access/Rectify/Erase) مع إضافة خرائط للجداول الجديدة.  
- رسائل جاهزة (AR/EN) محدثة للإشارة إلى مخرجات M21/M22/M24/M25 عند الطلب.

---

## I. التقويم الامتثالي والجاهزية — ملخّص
> التفاصيل الكاملة في **Appendix‑I** (ملف منفصل معتمد v1.0).  
**Matrix الحالات:** Ready / At‑Risk / Overdue + سياسة التصعيد (0d/2d/3d للأطراف المعنية).  
**Pre‑Audit Snapshot:** زمن إنجاز مستهدف ≤ 10m، أدلة موقّعة، روابط تنزيل مؤقتة.

---

## J. استراتيجية الاختبار (Digest + Pack‑T Mapping)
**E2E حرجة:**  
- M21: Calendar/Snapshot • M22: Assign/Complete • M23: AB Publish/Results • M24: Run/Share • M25: Health/Playbooks  
**Security/RLS:** حقول حساسة محجوبة افتراضيًا • صلاحيات دقيقة للتصدير.  
**Load:** استكشافات القراءة، توليد Snapshot، recompute للـ Health.  

---

## K. البيئات والتكوين
متغيرات (اختصار):
```bash
ROMUZ_ENV=prod
ROMUZ_WEBHOOK_SECRET=***
ROMUZ_API_RATE_LIMIT=600
ROMUZ_EXPORT_TTL_HOURS=72
```
Runbooks نشر GCP (KSA) + مراقبة + DR (انظر القسم M).

---

## L. التسمية والنسخ والترحيلات
- وثائق/واجهات `v1.1` (إضافات متوافقة).  
- مبدأ **forwards + safe backfills + planned rollback** لكل Migration.

---

## M. النسخ الاحتياطي والتعافي (DR)
- RPO ≤ 15m • RTO ≤ 2h • اختبار استعادة ربع سنوي.  
- الجداول الحرجة المضافة: training_*, studio_*, analytics_*, success_*.

---

## N. فهرس لوحات BI وتقارير المجلس
| لوحة/تقرير | مصدر | مؤشرات رئيسية |
|---|---|---|
| Audit Readiness (M21) | sem.audit_readiness_v1 | Snapshot Time, Coverage, Overdue |
| Learning Outcomes (M22) | sem.training_progress_v1 | Completion, TTP90, Score |
| Simulation Insights (M23) | sem.studio_ab_results_v1 | Variant Wins, CTR, Reports |
| Self‑Service Analytics (M24) | sem.kpi_freshness_v1 | Adoption, P95 Run, DQ MTTR |
| Tenant Success & Health (M25) | sem.success_health_v1 | Health, Adoption, Overdue↓ |

---

## O. النماذج الجاهزة (Templates)
**CSV/JSON عينات جديدة:**  
- users_import.csv, vendors_import.csv (سابقًا) + training_progress.csv, studio_ab_metrics.csv.  
- `pre_audit_snapshot.json`, `tenant_health_snapshot.json`.  
**رسائل (AR/EN):** Digest أسبوعي للتقويم، DQ Alerts، Health Updates.

---

## P. إمكانية الوصول والتعريب
- RTL كامل، تباين لوني مناسب، نصوص بديلة، مفاتيح اختصار.  
- قواعد i18n للمحتوى التدريبي (M22) والقوالب (M23) واللوحات (M24/M25).

---

## Q. أمن المنصّة (Hardening)
- Rate Limits طبقية • Replay Protection مع timestamp ≤ 5m • قيود الرفع + فحص المحتوى.  
- Schema Validation لكل Payload وارد/صادر • مراقبة سجلات وتنبيهات شذوذ.  
- تصدير بدون PII افتراضيًا + Watermark/Correlation‑ID للـ Snapshots.

---

## R. سيناريوهات مخاطر محورية
1) Phishing Escalations (M23/M2/M9)  
2) Mis‑provisioning & Access Drift (M17)  
3) Data Leak via Exports (M24)  
4) Dormant Privileged Accounts (M17)  
**ربط:** كل سيناريو ↔ Controls/Tests/Awareness/Treatments.

---

## S. كتالوج المؤشرات (KPI Catalog)
| KPI | التعريف | المصدر | التحديث | العتبات (R/A/G) | المالك |
|---|---|---|---|---|---|
| Audit Snapshot Time | زمن إنشاء لقطة التدقيق | M21/sem.audit_readiness_v1 | ساعات | >10m / 5–10m / ≤5m | Compliance |
| Completion (role/risk) | إكمال الرحلات | M22/sem.training_progress_v1 | يومي | <70% / 70–85% / ≥85% | Learning |
| TTP90 | 90th percentile زمن التدريب | M22 | أسبوعي | >12m / 8–12m / ≤8m | Learning |
| A/B Winner Adoption | اعتماد المتغير الفائز | M23/sem.studio_ab_results_v1 | أسبوعي | <40% / 40–80% / ≥80% | Product |
| Explorations Adoption (30d) | استخدام الاستكشافات | M24 | شهري | <40% / 40–60% / ≥60% | Analytics |
| DQ MTTR | زمن إغلاق إنذارات DQ | M24 | يومي | >48h / 24–48h / ≤24h | Data |
| Health Score | درجة صحة المستأجر | M25/sem.success_health_v1 | يومي | <0.6 / 0.6–0.75 / ≥0.75 | Success |
| Readiness Overdue↓ | انخفاض المتأخر | M21/M25 | أسبوعي | لا تحسن / تحسن طفيف / تحسن ≥20% | Success |

---

## T. فهرس كامل للموديولات والوثائق
- **M1–M25:** جميع ملفات .md المعتمدة ضمن هذه السلسلة.  
- **Appendix‑I (تقويم/جاهزية):** v1.0 (مرفق منفصل).  
- **هذه الوثيقة:** Appendices v1.1 (2025-11-08) — تحدّث v1.0 بإضافات M21–M25 وتوافق تام مع بقية الموديولات.

---

**ملاحظة تنفيذية:** هذه الملاحق v1.1 متوافقة بالكامل مع الموديولات **M1→M25** وتوحّد التعاريف والعقود والمقاييس وواجهات الاستخدام، مع الحفاظ على RLS/Privacy/Per‑DB Isolation كمبادئ حاكمة.
