# M4 — Content Hub (v1.1)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Centralized repository for all awareness assets (videos, articles, quizzes, micro-journeys, phishing templates, evidence packs), enabling governed publishing to Programs/Campaigns with Arabic RTL support.

## 2) MVP Scope
- Content types: **video**, **article**, **quiz_template (MCQ/TF)**, **micro_journey**, **phishing_template**, **policy/guide**, **evidence_pack**.
- Localization: **Arabic/English**, RTL UI, per-tenant branding (logo/colors).
- **Lifecycle statuses:** **Draft → Preview → Scheduled → Published → Archived** with full **Audit** trail.
- Tagging & classification: **Level (A/B/C)**, **Role (Employee/Manager/IT)**, **Topic** (phishing, privacy, password hygiene…), **Tags**.
- Safe publishing to **M2 Campaigns** with dependency checks (e.g., quiz template validity).
- Lightweight **Content Repository API (read-only)** for synchronization (internal; public API later).
- Storage: Supabase (dev), migrate to **Google Cloud (KSA region)** on production.
- DB-per-tenant isolation with controlled access to global templates (read-only unless cloned).

## 3) Quality-of-Life (QoL)
- Quick-create templates for common topics (anti-phishing, password hygiene, MFA, data privacy).
- Inline quiz builder (3–5 Qs) with shuffle options and pass score defaults (70%).
- Preview in tenant theme (white-label) before publish; **Scheduled** publishing with timezone support.
- Evidence Pack assembler: bundle referenced items into a single pack snapshot for auditors.
- Content Health card: coverage by topic/level + alerts for gaps (e.g., low Level C coverage).
- Synchronized translation reminder when AR/EN counterpart is missing.

## 4) Contracts (Inputs/Outputs)
- **Inputs**: 
  - Admin: create/update content, set metadata (level/role/topic/tags).
  - From M1: tenant/theme/permissions.
  - From M5: micro-journey blocks library (text/steps).
- **Outputs**:
  - To M2: content references (`content_ref`, `quiz_template_ref`) with integrity guarantees.
  - To M3: metadata for KPI snapshots (counts per topic/level and publish dates).
  - To auditors: evidence_pack exports (JSON manifest + file links).

## 5) High-level Data Model
- `contents`  
  `{id, tenant_id, type(video|article|quiz_template|micro_journey|phishing_template|policy|evidence_pack), title, lang(ar|en), level(A|B|C|null), role_scope(employee|manager|it|null), topic, tags[], status(draft|preview|scheduled|published|archived), scheduled_at, version, created_by, published_by, created_at, updated_at}`
- `content_assets`  
  `{id, content_id, asset_type(file|link|html|json), uri_or_blob_ref, checksum, size, metadata_json}`
- `quiz_templates`  
  `{id, content_id, pass_score_default(%, default 70), shuffle_questions(bool), shuffle_choices(bool)}`
- `quiz_template_questions`  
  `{id, quiz_template_id, order, type(mcq|tf), text, choices_json, correct_key}`
- `micro_journeys`  
  `{id, content_id, steps_json, est_minutes}`
- `evidence_packs`  
  `{id, content_id, manifest_json, built_at}`
- `content_audit_log`  
  `{id, content_id, actor_user_id, action(create|update|preview|schedule|publish|archive), diff_json, ts}`

## 6) Flows
- **Create → Draft → Preview (tenant theme) → Schedule (optional) → Publish → Use in M2 Campaigns → Evidence Snapshot on campaign close.**
- **Quiz Template Flow:** create template in M4 → referenced by M2 campaign_quizzes; updates create a new version, old campaigns keep pinned version.
- **Phishing Template Flow:** create landing/email artifacts → referenced by M9 phishing_campaigns.
- **Evidence Pack Flow:** select items (content + configs) → build pack → export manifest/files for auditors.

## 7) Security & Governance
- RBAC via M1 capabilities: `content.publish`, `content.manage`, `content.view`.
- Per-tenant data isolation (DB-per-tenant). Access to global templates is **read-only** unless cloned.
- Content integrity checks before publish (missing assets, invalid quiz structure).
- Audit log for all **create/update/preview/schedule/publish/archive** actions.
- Virus scanning on uploaded files (where supported) and MIME validation.

## 8) Localization & Accessibility
- Full Arabic RTL support, bilingual fields (title/description) with fallback logic.
- Caption/subtitles fields for videos; alt-text for images; accessible quiz forms.

## 9) Evidence & Compliance
- Evidence packs aligned with **NCA / ISO 27001** topics (anti-phishing, password policy, awareness cadence).
- Automatic manifest includes content versions and checksums, campaign IDs referencing the content, and publish timestamps.

## 10) Acceptance Criteria (AC)
- Admin can create bilingual content, preview in tenant theme, and publish/schedule without integrity errors.
- M2 can reference content/quiz_template successfully; pinned versions remain stable after updates.
- Evidence Pack can be built and exported (manifest + files/links) with valid checksums.
- All lifecycle actions appear in `content_audit_log` with correct actor and diffs.

## 11) KPIs
- Time-to-publish for standard template ≤ 10 minutes.
- ≥ 95% campaign content references valid (no broken links).
- 0 integrity failures in published items (validated via CI checks).
- Evidence pack creation success rate ≥ 99%.

## 12) Constraints
- Dev storage: Supabase; Production: **Google Cloud (KSA)**.
- Multi-tenant with **per-DB isolation**; global templates allowed via controlled clone.
- MVP read-only sync API; write APIs in later phases.
