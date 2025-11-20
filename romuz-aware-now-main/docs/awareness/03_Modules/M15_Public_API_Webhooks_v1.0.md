
# M15 — Public API & Webhooks
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level)](#4-نموذج-البيانات-high-level)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-api--webhooks)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
توفير **واجهات برمجة تطبيقات عامة** آمنة ونسقية، و**Webhooks** موثوقة لتمكين التكامل مع أنظمة العملاء والشركاء (HRMS/ITSM/BI/IDP)، ولتدفق الأحداث الحرجة خارج المنصّة (حملات، نتائج تصيّد، مؤشرات ثقافة، حوادث/مخاطر، أدلة امتثال)، بما يدعم الأتمتة، التوسّع، والتقارير في الزمن القريب من الحقيقي.

## 2) نطاق الـMVP (Scope)
- **REST API v1** (مع قابلية GraphQL لاحقًا): نقاط CRUD مقروءة/محدودة الكتابة لموارد مختارة.
- **OAuth2 Client Credentials** + **API Keys** النطاقية (Scoped) لكل Tenant.
- **Webhooks v1** موقّعة (HMAC) لأحداث مختارة مع إعادة محاولة تلقائية.
- **سياسات أساسية:** Versioning، Rate Limits، Idempotency، Pagination، Filtering/Sorting، Error Codes موحّدة.
- **توثيق تفاعلي** (OpenAPI 3.1) + أمثلة طلب/استجابة.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Resources (v1)
- **/v1/tenants/me**: تعريف المستأجر، الحدود والسياسات.
- **/v1/users**: قراءة المستخدمين/الملف التعريفي (قراءة فقط في MVP).
- **/v1/campaigns**: إنشاء/جدولة/استرجاع حملات التوعية (create/read/update محدود).
- **/v1/phishing/campaigns & /results**: إدارة حملات التصيد وجلب النتائج.
- **/v1/policies/ack**: إدراج/قراءة إقرارات السياسات (Evidence-safe).
- **/v1/kpis/snapshots**: جلب لقطات المؤشرات (Culture Index, Completion, Phish-prone%).
- **/v1/incidents & /risks/links**: إنشاء رابط حادث←→مخاطر (وفق M13) قراءة/إنشاء مقيّد.
- **/v1/onboarding/events**: تسجيل Joiner/Mover/Leaver (وفق M12).
- **/v1/reports/exports**: طلب تصدير (Async Jobs) مع رابط تنزيل آمن.

### 3.2 Webhooks (v1)
- عناوين (Endpoints) يقدّمها العميل، نقوم بالنداء بـ `POST` JSON:
  - `campaign.completed`, `phishing.result.recorded`, `policy.acknowledged`,
  - `kpi.snapshot.created`, `incident.closed`, `risk.updated`,
  - `onboarding.completed`, `evidence.bundle.ready`.
- **التوقيع:** Header `X-Romuz-Signature` (HMAC-SHA256 + timestamp + replay-protection).
- **إعادة المحاولة:** Backoff أُسّي حتى 24 ساعة، أقصى 10 محاولات، مع لوحة حالة.

### 3.3 Authentication & Scoping
- **OAuth2 (CC Flow)**: `aud` = tenant، **Scopes** دقيقة (`kpi.read`, `campaign.write`, …).
- **API Keys**: مفاتيح مقيدة الصلاحيات والـIP/البيئة مع دوران مفاتيح (Key Rotation).
- **mTLS** (اختياري) لعملاء حسّاسين.

### 3.4 API Semantics
- **Idempotency-Key** في رؤوس الطلبات للعمليات المنشِئة.
- **Pagination:** `limit`/`cursor` مع مؤشرات `next_cursor`.
- **Filtering:** `?filter[field][op]=value` (مثال: `?filter[started_at][gte]=2025-01-01`).
- **Errors:** هيكل موحّد `{code, message, details[], correlation_id}`.

## 4) نموذج البيانات (High-Level)
> **المبدأ:** أنظمة تشغيلية لكل عميل (**per-DB isolation**) + طبقة **API Gateway** تُنفّذ التقسيم (Tenant Partitioning) وRLS عبر طبقة الخدمات.

**Artifacts:**
- **api_clients**: تعريف العميل، النطاقات، القيود، الدوران.
- **api_tokens**: رموز وصول عمرها قصير (TTL).
- **webhook_endpoints**: عناوين العميل، السر المشترك، حالة التفعيل.
- **webhook_deliveries**: سجلات الإرسال/التوقيع/النتيجة/المحاولات.
- **async_jobs**: طلبات تصدير/تقارير/مهام ثقيلة (حالة، نسبة تقدم، روابط).
- **audit_logs**: جميع نداءات API/Webhook (Tamper-evident).

## 5) التدفقات (Key Flows)
- **F1 | API Call (Read):** عميل مع Token صالح → Gateway → خدمة الموارد → تطبيق RLS/Scopes → استجابة مع Pagination وCorrelation-ID.
- **F2 | API Call (Write):** عميل يرسل طلب إنشاء مع `Idempotency-Key` → معاملة آمنة → رد 201 أو 202 (Async) + Location.
- **F3 | Webhook Delivery:** حدث داخلي → جدولة إرسال → توقيع HMAC + Headers → استلام 2xx = نجاح، خلاف ذلك إعادة محاولات مع Backoff.
- **F4 | Async Export:** POST `/v1/reports/exports` → إنشاء `async_job` → Webhook `evidence.bundle.ready` أو Poll `/jobs/{id}`.
- **F5 | Key Rotation:** إنشاء مفتاح جديد، تفعيل مزدوج لفترة سماح، إبطال القديم بتدرّج.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS & Least Privilege** على كل موارد القراءة، و**Capability Mapping** للكتابة.
- **Rate Limits** لكل مفتاح/نطاق (مثال: 600 req/min)، ورسائل خطأ `429` مع `Retry-After`.
- **WAF/Threat Detection** + **Schema Validation** لكل Payload.
- **Secrets Management:** مفاتيح ويبهوك وAPI في مخزن آمن، تدوير دوري.
- **Replay Protection:** توقيع يتضمن `timestamp` نافذ ≤ 5 دقائق.
- **Consent & PII:** لا يخرج أي PII خارج سياق التعاقد/النطاق؛ دعم **Field Redaction** للـPII.
- **Auditability:** أثر تدقيقي غير قابل للعبث مع Hash Chain.
- **SLA & Monitoring:** زمن استجابة P95 ≤ 300ms للقراءة، توافر ≥ 99.9% لواجهة القراءة.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | OAuth2 & Scopes:**  
  طلب بــ Scope غير كافٍ يعيد `403` مع `code=insufficient_scope` وتفاصيل النطاق المطلوب.
- **AC-02 | Idempotency:**  
  تكرار POST بنفس `Idempotency-Key` خلال 24h يعيد **نفس** `correlation_id` والحالة دون إنشاء مكرر.
- **AC-03 | Webhook Signature:**  
  تغيير الجسم أو انقضاء `timestamp` > 5 دقائق يؤدي إلى `401` ورفض التسليم.
- **AC-04 | Backoff & DLQ:**  
  فشل 10 محاولات يُرسل إلى **Dead-Letter Queue** مع سبب وتصنيف ويمكن إعادة التشغيل يدويًا.
- **AC-05 | RLS Isolation:**  
  مستخدم Tenant A لا يمكنه الوصول لأي سجل Tenant B (اختبار وحدة + تكاملي يمرّان).
- **AC-06 | Exports Security:**  
  روابط التنزيل موقّتة (Signed URL TTL ≤ 15m) ولا تُعاد بعد انقضاء الوقت.

## 8) تحسينات خفيفة (Quick Wins)
- **API Console** مضمن في لوحة الإدارة لطلب Tokens وتجريب الاستدعاءات بأمان.
- **SDKs خفيفة** (TypeScript/Python) لأكثر المسارات استخدامًا.
- **Change Notifications** على البريد/Slack عند تغيير العقود (Breaking Changes).
- **Sample Webhook Receiver** (Node/Express) مع تحقق توقيع جاهز.

## 9) KPIs (API & Webhooks)
- **Uptime (READ):** ≥ **99.9%** شهريًا.
- **P95 Latency (READ):** ≤ **300ms**.
- **Delivery Success (Webhooks):** ≥ **98%** خلال 24 ساعة.
- **Error Rate 5xx:** ≤ **0.2%**.
- **Idempotency Hit Rate:** ≥ **90%** لعمليات الإنشاء من الأنظمة المتكاملة.
- **Key Rotation Compliance:** 100% العملاء الحساسين يدوّرون المفاتيح كل ≤ 90 يومًا.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **Architecture:** API Gateway أمام Services، نشر على **Google Cloud (KSA)**، دعم **per-DB isolation**.
- **Docs:** نشر OpenAPI محدث مع نسخ مؤرّخة (v1 ثابتة، v1.1 إضافات متوافقة).
- **No GraphQL في MVP**؛ ندرس لاحقًا بعد ثبات الـSchemas.
- **Async-first** للتقارير الثقيلة والتصدير.
- **Compliance:** الالتزام بسياسات العميل/القطاع (سجلات، احتفاظ، محاسبية الوصول).

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M14) ويركّز على العقود، الأمان، والجاهزية للتكاملات الخارجية.
