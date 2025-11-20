# M1 — Tenant & Identity Core (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose & Responsibilities
- Manage tenants (clients), users, roles, and permissions (RBAC).
- Internal identity & authorization for MVP; optional Entra SSO (per-tenant) in Phase 1.
- Secure onboarding, sessions, and lightweight identity audit.

## 2) MVP Scope
- Tenant CRUD + bootstrap secure first Admin.
- User lifecycle (invite, activate/deactivate, reset password).
- RBAC with one **primary role/user** (Admin / Manager / Employee) + fine-grained **Capabilities**.
- MFA policy **by role** (mandatory for Admin/Manager, optional for Employee) with tenant-level enforce-all toggle.
- Identity audit for sensitive events (create/disable user, role/cap changes, failed logins, MFA changes).

## 3) Improvements Embedded
- Role Bundles aligned with A/B/C program level per tenant.
- Scoped capabilities (e.g., `awareness.manage`, `content.publish`, `culture.view`, `integrations.configure`).
- Policy Preview: impact-before-save for role/capability changes.
- Just-Enough Identity Logs to keep MVP lean.

## 4) High-level Data Model
- `tenants(id, name, slug, status, branding, locale, timezone, level, created_at)`
- `users(id, email, full_name, dept, role_id, status, last_login_at, mfa_enabled, created_at)`
- `roles(id, key, name, description, is_system, created_at)`
- `role_capabilities(role_id, capability_key)`
- `identity_audit_log(id, actor_user_id, action, entity_type, entity_id, ip, user_agent, created_at)`
- `sso_settings(tenant_id, provider='entra', tenant_identifier, client_id, meta_json, enabled)` (optional Phase 1)

## 5) Core Flows
- Invite → set password → assign role bundle (per A/B/C).
- Login → policies (lockout/MFA) → session → audit event.
- Update Role/Capabilities → Policy Preview → Save → audit.
- (Optional) Entra SSO → per-tenant toggle; local login remains unless Enforce-SSO later.

## 6) Security & Constraints
- **DB-per-tenant isolation** (multi-tenant SaaS with per-DB isolation).
- Password hashing (Argon2/Bcrypt), short-lived JWT + refresh.
- One primary role per user in MVP; capabilities to cover edge cases.
- MFA policy by role; tenant option to enforce for all.
- Arabic RTL supported from day 1.

## 7) Contracts (I/O)
- Outputs: `get_current_user()`, `can(user, capability_key)`; events `user.created`, `user.role_updated`, `user.disabled`.
- Inputs: Admin UI (CRUD), Integrations Core (read SSO settings).

## 8) Acceptance Criteria (AC)
- Admin provisions a tenant with level (A/B/C); role bundles apply automatically.
- User invites/activations audited; `can()` consistent system-wide.
- MFA enforced for Admin/Manager; optional for Employee; tenant can enforce all.

## 9) KPIs
- Tenant provisioning ≤ 10m.
- >95% first-invite success.
- 0 privilege-escalation defects in tests.
- 100% `can()` correctness in unit/integration tests.

# M2 — Awareness Programs & Campaigns (v1.1)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Run awareness programs with A/B/C levels per tenant; schedule campaigns, send through channels, and track participation.

## 2) MVP Scope (Updated)
- Programs A/B/C per tenant; Campaign creation (title/goal/content/channel/schedule).
- Channels: **Email**, **M365 Phishing Simulation**, **Slack (Pilot notifications + deep links)**.
- **Mandatory Micro-Quiz** per campaign (3–5 Qs, MCQ/TF), pass ≥ 70% (configurable), one auto re-attempt.
- Participation tracking: open/start/complete/score/pass-fail; export CSV/Excel.
- Evidence Snapshot on close (campaign config + quiz metadata).

## 3) Quality-of-Life Additions
- Ready Audience Segments (All, New Joiners ≤90d, IT & Security, Managers).
- Goal Templates (anti-phishing, privacy, password hygiene...).
- Preflight Checks before launch (audience/channel/time/content).
- Auto Follow-up for non-completers after X days.

## 4) Contracts
- **Inputs:** from M1 (users/departments/roles), M4 (content & quiz_template), M6 (SMTP/M365/Slack settings).
- **Outputs:** events `campaign.launched`, `campaign.reminder_sent`, `user.quiz_attempted`, `user.quiz_passed`, `user.quiz_failed`, `campaign.closed`; participation records; evidence snapshot JSON.

## 5) High-level Data Model
- `programs(id, tenant_id, level, name, status)`
- `campaigns(id, program_id, title, goal, channel(email|m365|slack), schedule_at, ends_at, status)`
- `campaign_audience(campaign_id, segment_type(all|dept|role|custom), segment_ref)`
- `campaign_content(campaign_id, content_type(video|article|quiz|simulation), content_ref)`
- `campaign_quizzes(id, campaign_id, pass_score, max_attempts=2, time_limit_sec)`
- `quiz_questions(id, campaign_quiz_id, order, type(mcq|tf), text, choices_json, correct_key)`
- `quiz_attempts(id, campaign_quiz_id, user_id, score, passed, started_at, submitted_at, answers_json)`
- `campaign_events(id, campaign_id, user_id, event, ts)`
- `evidence_snapshots(id, campaign_id, snapshot_json, created_at)`

## 6) Flows
Launch → Email/Slack notify → content → **Micro-Quiz** → record attempt → auto re-attempt if fail → M3/M5 updates → reminders → Close & Snapshot.

## 7) AC
- Campaign cannot close without a valid quiz configured.
- Email (+ Slack if enabled) delivered; at least one attempt recorded per assigned user.
- Auto re-attempt granted on fail; events logged; snapshot created.

## 8) Security/Operations
- Respect capabilities (`awareness.manage`, `content.publish`).
- Preflight with confirmations; audit for launch/modify/close.
- Slack Pilot with minimal scopes; easy per-tenant disable.


# M3 — Culture Index & KPIs (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Compute a composite Culture Index at user/department/org levels from engagement, learning, behavior, phishing, and compliance signals.

## 2) Dimensions
- Engagement, Learning, Behavior, Phishing, Compliance.

## 3) Inputs
- From M2: participation + quiz (score/pass/fail)
- From M5: points/badges/micro-journeys
- From M8: escalation events (L1/L2), reminder response latency
- From M9: phishing (delivered/open/click/reported, time-to-click, time-to-report)
- From M1: role, dept, tenant_level (A/B/C)

## 4) Scoring (MVP)
Per user (window=90d):
- E = min(1, completed_campaigns/assigned_campaigns)
- L = avg(quiz_score%)
- B = (reported_phishing ? 0.1 : 0) + (micro_journeys_completed * 0.05)  cap 0.2
- P = 1 - 0.5*click_rate + 0.2*report_rate - 0.3*norm_ttr   clamp 0..1
- C = on_time_rate - 0.2*esc_L1 - 0.4*esc_L2                clamp 0..1

**CI_user = 0.25E + 0.25L + 0.2P + 0.2C + 0.1B**

Dept/Org = weighted aggregate (by assigned count) with std-dev adjustment for outliers. Guardrails: clamp 0..1, min sample n≥5.

## 5) Dashboards
Executive, Department, Individual Coach; Phishing Panel; Compliance Panel.

## 6) Data Model
- `culture_scores_user(user_id, window_start, window_end, E,L,B,P,C, CI, computed_at)`
- `culture_scores_dept(dept_id, window, E,L,B,P,C, CI, n, sd, computed_at)`
- `culture_scores_org(tenant_id, window, E,L,B,P,C, CI, n, computed_at)`
- `culture_alerts(id, scope, reason, delta, created_at, status)`
- `kpi_snapshots(id, window, metrics_json, exported_by)`

## 7) Contracts
- Inputs APIs: /events/campaign, /events/quiz, /events/phishing, /events/escalation
- Queries: /culture/index/(user|department|org); /culture/alerts

## 8) Flows
Nightly compute (user→dept→org); real-time bumps on quiz_pass/phishing_reported; Alert -> M8 Escalation with campaign recommendation.

## 9) Privacy & Localization
Dept aggregation hides individuals (only direct manager/security see individual view). Arabic/English, RTL. Configurable windows (30/60/90/180d).

## 10) Acceptance Criteria
- Correct CI on test fixtures; consistent cross-level numbers; M8 alert on 15% dept drop; M9 real-time update on click/report.

## 11) MVP vs Later
MVP fixed weights; nightly compute + limited real-time updates. Later ML-driven weights, root-cause analyzer, anonymized benchmarks.


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


# M5 — Gamified Awareness & Micro-learning (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Turn awareness into a continuous, enjoyable experience via **points, badges, leaderboards**, and **micro-learning journeys**, directly tied to M3 (Culture Index), M8 (Escalation), and M9 (Phishing).

## 2) MVP Scope
- **Points & Badges:** automatic points on content completion / quiz pass / phishing report.
- **Leaderboards:** user/department boards (weekly, monthly, quarterly).
- **Micro-Journeys:** short journeys (3–7 minutes) automatically assigned for performance gaps or escalations (L1/L2).
- **Rewards (lightweight):** digital badges + in-app/email/Slack (Pilot) congrats.
- **Anti-Gaming:** idempotent scoring; rate limiting for repeated events.

## 3) Points Rules (default, tenant-configurable)
- Awareness content completion: **+10**
- Micro-Quiz pass on first attempt: **+15** (second attempt: **+8**)
- Phishing reported: **+25**
- Phishing click: **−30**
- Assigned Micro-Journey completion: **+12**

> Tenants can override weights via policy; all events are signed to prevent duplicates.

## 4) Micro-learning Journeys
- **Trigger-based:** auto-assigned from **M8** on: two consecutive quiz fails, CI_user decline, phishing click.
- **Catalog-based:** ready-made journeys (Password Hygiene, MFA, Privacy, Secure Browsing).
- **Structure:** 2–3 lightweight assets + 1–2 quick questions + motivational message.

## 5) Contracts
**Inputs**
- From **M2:** participation & quiz events.
- From **M3:** CI_user/CI_dept decline alerts.
- From **M8:** escalation assignments (L1/L2).
- From **M9:** phishing results (click/reported).

**Outputs**
- Events: `gamify.points_awarded`, `badge.granted`, `leaderboard.updated`, `micro_journey.assigned`, `micro_journey.completed`.
- To **M3:** points/badges/journey results as Behavior signals.
- To **M8:** journey completion to settle or raise escalation level.

## 6) High-level Data Model
- `gamify_points`  
  `{id, user_id, source(campaign|quiz|phishing|micro_journey), delta, reason, ts}`
- `badges`  
  `{id, key, name, description, tier(bronze|silver|gold), icon_ref}`
- `user_badges`  
  `{user_id, badge_id, granted_at}`
- `leaderboards`  
  `{id, scope(user|dept), period(week|month|quarter), snapshot_json, computed_at}`
- `micro_journeys_templates`  
  `{id, title, steps_json, est_minutes, tags[], level(A|B|C)}`
- `micro_journeys_assignments`  
  `{id, user_id, template_id, assigned_by(system|admin|escalation_rule), due_at, status, completed_at}`

## 7) Core Flows
- **Award Flow:** consume event → compute points/badge → write `gamify_points` / `user_badges` → update leaderboard.
- **Journey Flow:** M8 assigns journey → notify user → complete → adjust CI/points → notify M8 → close/advance escalation.
- **Leaderboard Compute:** scheduled job builds weekly/monthly/quarterly snapshots.

## 8) Acceptance Criteria (AC)
- Idempotent scoring (no double-counting per unique event).  
- Correct leaderboard placement for users/departments per period.  
- Assigned journeys appear for users, completion is recorded, and signals flow back to **M3**/**M8**.  
- Auto badge granting at thresholds (e.g., 200 pts → Silver Security Advocate).

## 9) Governance & Security
- RBAC from **M1**:  
  - `gamify.configure` (configure points/badges policies)  
  - `gamify.view` (view leaderboards)  
  - `gamify.manage` (manually assign journeys)
- **Anti-Gaming:** event signatures & rate limits; deduplication by `(user_id, source, event_id)`.
- **Privacy:** leaderboards visible inside tenant; optional masking on org-wide views.

## 10) Improvements (included in MVP)
- **G1:** Instant motivation card (toast) after achievements (with points summary).
- **G2:** Weekly digest via email/Slack with points & badges highlights.
- **G3:** Department goal per month (group points target with progress bar).
- **G4:** Badge Matrix (Bronze/Silver/Gold) with default thresholds; tenant overrides supported.

## 11) KPIs
- ≥ 60% of users show monthly points growth.
- ≥ 40% completion for assigned journeys within 7 days.
- ≥ 10% CI_user improvement for escalated users within 30 days.
- Leaderboard update latency < 2 minutes after batch events.


# M6 — Integrations Core (Phase 1) (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Central integration layer per tenant handling **Entra SSO**, **M365 Phishing Simulation**, **Email Gateway (SMTP/API)**, and **Slack (Pilot notifications + deep links)** with health checks, preflight validation, secure secrets, and full audit.

## 2) MVP Scope (Phase 1)
- **Entra SSO (optional per-tenant):** OIDC/OAuth2 settings, connection test, enable/disable.
- **M365 Simulation:** provider keys/IDs, dry-run test campaign, delivery IDs capture.
- **Email Gateway:** SMTP or API provider (SendGrid/Postmark…), basic templates, open/click tracking when available.
- **Slack (Pilot):** campaign notification + deep link to content/quiz (no interactive commands yet).
- **Preflight Checks:** validate channel readiness before M2 launches any campaign.
- **Health Monitor:** scheduled checks + “Test Now” buttons per channel.
- **Secrets Management:** encrypted storage, manual key rotation, masked UI fields.

## 3) Contracts
**Inputs**
- From **M1**: tenant identity, roles & who has `integrations.configure`.
- From **M2**: campaign send/test requests (Email/M365/Slack).
- From **M4**: content links/files used for delivery.

**Outputs**
- Events: `integration.config_updated`, `integration.health_changed`, `delivery.enqueued`, `delivery.sent`, `delivery.failed`.
- To **M2**: send/preflight results (success/failure/provider IDs), clear error reasons on failure.
- To **M8**: health warnings impacting reminders/escalations.

## 4) High-level Data Model
- `integration_settings`  
  `{id, tenant_id, channel(entra|m365|email|slack), config_json(masked on UI), enabled, last_test_status(ok|warn|fail), last_test_at, updated_by, updated_at}`
- `integration_health_log`  
  `{id, tenant_id, channel, status(ok|warn|fail), detail, ts}`
- `deliveries`  
  `{id, tenant_id, channel(email|m365|slack), campaign_id, user_id, payload_meta, status(queued|sent|failed), provider_msg_id, error_code, ts}`
- `secrets_vault` *(logical within settings)*  
  `{id, tenant_id, channel, secret_ref, rotated_at}`

> All tables live **inside each tenant database** (per-DB isolation).

## 5) Flows
- **Config Flow:** admin config → encrypted save → **Test Connection** → health status updated.
- **Preflight Flow (from M2):** ensure settings exist + status=ok + user capability + recipient sample → allow launch.
- **Send Flow:** M2 requests send → create `deliveries(queued)` → provider adapter executes → update `sent/failed` + `provider_msg_id`.
- **Health Polling:** scheduled job probes enabled channels → write `integration_health_log` → update `integration_settings.last_test_status`.

## 6) Security & Governance
- **Encrypted secrets** at rest (KMS) and masked in UI; manual rotation with logs.
- **Rate limits** per channel + **exponential backoff** for transient failures.
- **Fault isolation:** channel failure never blocks others.
- **Sandbox/Test mode:** route to test recipients list before production cutover.
- **Full audit:** configuration changes, health checks, and deliveries.

## 7) Acceptance Criteria (AC)
- Any enabled channel must pass **Test Connection = ok** before a campaign can be launched.
- Failed preflight blocks launch and returns **specific, actionable reasons**.
- Every send writes a delivery record with accurate status & provider message ID when available.
- Admin dashboard shows **health badges** (Green/Yellow/Red) and warnings for `warn|fail`.

## 8) Improvements (included in MVP)
- **I1:** “Re-test All” button across channels per tenant.
- **I2:** Health badge next to each channel in settings (G/Y/R).
- **I3:** Ready-to-use email templates (AR/EN) with variables (name, link…).
- **I4:** Downloadable short error log (CSV) per campaign.

## 9) KPIs
- ≥ 99% preflight success for properly configured channels.
- Connection test median time ≤ 3s.
- Delivery failure rate < 1% for Email and < 0.5% for Slack (after correct setup).
- Result round‑trip to M2 after send ≤ 2s (median).

## 10) MVP vs Later
**MVP:** Entra + M365 + Email + Slack (notify only), encrypted secrets, health/test, preflight, delivery log.  
**Later (Phase 2/3):** interactive webhooks, JIT on Slack/Teams, extra channels (Teams DMs), automated rotation, cross-tenant monitoring.

# M7 — Admin & Configuration Center (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Tenant-level control center + Super Admin (Romuz) overview to manage branding/theme, localization, security policies (MFA/passwords/retention), program settings (A/B/C, goals, audience segments), evidence templates, and surface integration statuses from M6.

## 2) MVP Scope
- **Branding/Theme:** logo, primary/secondary colors, dark/light, live preview.
- **Localization:** default language (AR/EN), RTL auto, timezone per tenant.
- **Program Settings:** enable/disable A/B/C, default campaign goals, ready audience segments (All/New Joiners/Managers/IT).
- **Security Policies:**
  - MFA by role (Admin/Manager mandatory, Employee optional) + tenant-level enforce-all toggle.
  - Password policies (min length, complexity, lockout attempts, expiry days).
- **Data Retention:** retention windows for campaigns/quizzes/logs (e.g., 12–36 months) + pre-deletion notice.
- **Evidence Templates:** create/edit evidence pack templates (consumed by M4).
- **Audit & Change Log:** who/when/what (before/after diffs) for all settings.
- **Super Admin View:** tenant list, activation state, global health indicators, audited impersonation into tenant settings.

> Detailed channel keys/config are administered in **M6**. M7 only displays status and links to M6 pages.

## 3) Contracts
**Inputs**
- From **M1**: tenant info & RBAC capabilities (`admin.configure`, `policy.manage`).
- From **M6**: channel health (ok/warn/fail) + links to configuration pages.

**Outputs**
- Events: `settings.updated`, `policy.changed`, `retention.schedule_updated`.
- To **M2/M5/M8**: broadcast updates impacting flows (MFA policy, program defaults, audience presets).
- To **M4**: default evidence template selection/updates.

## 4) High-level Data Model
- `tenant_settings`
  `{tenant_id, branding_json(theme, colors, logo_ref), locale(ar|en), timezone, levels_active{A:bool,B:bool,C:bool}, program_defaults_json, updated_by, updated_at}`
- `security_policies`
  `{tenant_id, require_mfa_admin:bool, require_mfa_manager:bool, require_mfa_employee:bool, enforce_mfa_for_all:bool, pwd_min_len, pwd_complexity_json, lockout_attempts, pwd_expiry_days, updated_at}`
- `data_retention_policies`
  `{tenant_id, campaigns_months, quiz_months, logs_months, notify_before_days, updated_at}`
- `evidence_templates`
  `{id, tenant_id, title, sections_json, mappings_json, version, status(draft|published), updated_at}`
- `admin_audit_log`
  `{id, tenant_id, actor_user_id, action(settings|policy|retention|evidence_template), diff_json, ts}`

## 5) Flows
- **Branding Flow:** edit theme/logo → live preview → save → apply across UI.
- **Policy Flow:** update MFA/passwords → **Policy Preview (impact)** → save → broadcast to M1; login flow reflects changes.
- **Retention Flow:** adjust windows → schedule safe cleanup (soft delete → hard delete after grace period) + pre-deletion notice.
- **Evidence Template Flow:** select ready template / create new → publish → M4 uses it as default in evidence packs.

## 6) Acceptance Criteria (AC)
- Admin can set theme and see it applied consistently.
- MFA/password policies persist, broadcast, and enforce as expected in M1 login/session flows.
- Retention edits create/update cleanup schedules with notifications.
- Published evidence template appears as default option in M4 builder.
- All changes logged in `admin_audit_log` with clear diffs and actor identity.

## 7) Governance & Security
- RBAC:
  - `admin.configure` (Theme/Localization/Program)
  - `policy.manage` (MFA/Passwords/Retention)
  - `evidence.configure` (Templates)
- **Policy Preview** protects against risky changes (shows affected users count).
- Immutable audit records; sensitive fields masked (no secrets shown here).

## 8) Improvements (included in MVP)
- **A1:** Reset to Defaults button per section.
- **A2:** Export Settings as JSON.
- **A3:** Post-save Change Summary (before/after).
- **A4:** Sanity checks (e.g., all A/B/C disabled → warning).

## 9) KPIs
- Settings apply time ≤ 1s (median).
- 0 policy enforcement errors (MFA/password) after save in test suite.
- ≥ 99% success creating/using evidence templates in campaigns.

## 10) Constraints & Assumptions
- **DB-per-tenant isolation.**
- Arabic + RTL by default.
- Detailed channel configuration remains in **M6** (M7 surfaces status only).


# M8 — Auto Follow-up & Escalation Engine (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Rule-driven engine that continuously monitors awareness culture at **user/department/org** levels and triggers **automated actions** with **multi-level escalation (L1/L2/L3)**, integrated with **M2, M3, M5, M6, M9**.

## 2) MVP Scope
- **No‑Code Preset Rules:**
  - Not completed campaign after X days → **L1** reminder (Email/Slack) + new grace window.
  - Two consecutive Micro‑Quiz fails → **L2** assign **Micro‑Journey** (M5).
  - CI_dept drop ≥ 15% in 30 days → **L2** manager alert + **M2** campaign recommendation.
  - Two phishing clicks in 30 days → **L2** mandatory journey + manager alert.
- **Escalation Console:** cases list, current level, last action, due date, owner, close/escalate actions.
- **Automations (Actions):** reminder, reschedule, assign micro‑journey, manager alert, (optional) manual ticket now; Helpdesk integration later.
- **Timers:** default SLAs per level (e.g., L1=3d, L2=7d).
- **De‑duplication:** suppress duplicate triggers for same subject/reason within cooldown window.

## 3) Contracts
**Inputs**
- From **M2:** `campaign.launched`, `campaign.reminder_sent`, participation/quiz outcomes.
- From **M3:** `culture_index.updated`, `culture_alert.created` (dept/org).
- From **M5:** `micro_journey.completed`.
- From **M9:** `phishing.click`, `phishing.reported` (with time metrics).
- From **M6:** channel health to ensure reminders can be delivered.

**Outputs**
- `escalation.triggered`, `escalation.level_changed(L1|L2|L3)`,
  `escalation.action_sent(reminder|journey|manager_alert)`,
  `escalation.snoozed`, `escalation.closed`.

## 4) High‑level Data Model
- `escalation_rules`
  `{id, tenant_id, name, scope(user|dept|org), condition_json, actions_json, cooldown_days, enabled, created_by, updated_at}`
- `escalation_cases`
  `{id, tenant_id, scope(user|dept|org), subject_ref, rule_id, level(L1|L2|L3), status(open|snoozed|closed), opened_at, due_at, last_action_at, owner_user_id}`
- `escalation_events`
  `{id, case_id, action(trigger|reminder|assign_journey|manager_alert|close|level_up|snooze), meta_json, ts}`
- `escalation_configs`
  `{tenant_id, defaults_json(L1/L2 timers & thresholds), notifications_json}`

> All tables live **inside each tenant database** (per‑DB isolation).

## 5) Flows
- **Trigger Flow:** matching signal → open/update case → run level action → set `due_at` → record event.
- **Reminder Flow:** scheduled job scans overdue cases → send reminder / level‑up → log event.
- **Close Flow:** journey completed / CI_user above threshold / successful campaign completion → auto close case.
- **Health Guard:** if M6 channel status is fail → switch channel or snooze with warning.

## 6) Acceptance Criteria (AC)
- No duplicate cases for same user/reason within **cooldown_days**.
- Two consecutive quiz fails auto‑assign a micro‑journey visible to the user.
- CI_dept large drop triggers manager alert + campaign recommendation (M2).
- Case auto‑closes when improvement condition is met (e.g., CI_user passes threshold).
- Every action logged in `escalation_events` and visible in Console.

## 7) Governance & Security
- RBAC from **M1**:
  - `escalation.configure` (rules & timers)
  - `escalation.view` (cases list & details)
  - `escalation.manage` (assign owner / close / snooze / level up)
- Full audit for rule/config changes and executed actions.
- Rate limits to avoid notification spam; respect tenant channel preferences.

## 8) Built‑in Improvements (included in MVP)
- **E1:** One‑click rule presets.
- **E2:** “Why this escalation?” card explaining the trigger signals.
- **E3:** Smart Snooze (until date or next qualifying event).
- **E4:** Auto recommendations (campaign/journey) based on topic/role/level gap.

## 9) KPIs
- ≥ 80% of L1 cases closed within 7 days.
- ≥ 60% of L2 cases show CI_user improvement ≥ 10 points within 30 days.
- ≤ 5% rejected duplicates due to cooldown.
- Action execution median latency < 2s after qualifying signal.


# M9 — Phishing Module (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
End-to-end **phishing simulation** management (design → launch → track → report) tied to **M3 (Culture Index)** and **M8 (Escalation)**, using **Phase 1 channels** (M365 Simulation + Email Gateway) with ready templates and precise metrics (click / reported / time-to-click / time-to-report).

## 2) MVP Scope
- **Templates:** email + landing templates (invoice, password reset, HR notice…) with simple variables (name/department/link).
- **Campaigns:** create campaign, pick template & audience (All/Dept/Role/Custom), schedule, optional dry-run.
- **Channels:** **M365 Simulation** + **Email Gateway** (per M6).
- **Tracking:** Delivered, Open, Click, Reported, **Time-to-Click**, **Time-to-Report**.
- **Compliance Mode:** automatic educational follow-up after simulation summarizing mistakes & best practices (AR/EN).
- **Privacy by Design:** never collect credentials or sensitive data.

## 3) Contracts
**Inputs**
- From **M1**: users/departments/roles & RBAC (`phishing.manage`).
- From **M4**: `phishing_template` assets (email HTML, landing page).
- From **M6**: channel config & preflight health.

**Outputs**
- Events: `phishing.campaign_launched`, `phishing.delivered`, `phishing.opened`, `phishing.clicked`, `phishing.reported`.
- To **M3**: click/report rates and TTClick/TTReport as P-dimension inputs.
- To **M8**: auto rules (e.g., **2 clicks/30d → L2** micro‑journey + manager alert).
- To **M5**: award points on **reported**, deduct on **click**.

## 4) High‑level Data Model
- `phishing_templates`
  `{id, tenant_id, title, lang(ar|en), risk_tier(low|med|high), topic, email_html_ref, landing_page_ref, variables_json, version, status(draft|published)}`
- `phishing_campaigns`
  `{id, tenant_id, template_id, audience(segment_type, segment_ref), schedule_at, ends_at, status(draft|scheduled|running|closed), dry_run(bool)}`
- `phishing_results`
  `{id, campaign_id, user_id, delivered_at, opened_at, clicked_at, reported_at, tt_click_sec, tt_report_sec}`
- `phishing_events`
  `{id, campaign_id, user_id, event(delivered|open|click|report), meta_json, ts}`
- `phishing_audit_log`
  `{id, actor_user_id, action(create_template|launch|close|delete), diff_json, ts}`

> Templates & assets are stored and versioned via **M4**; delivery via **M6**.

## 5) Flows
- **Create Template:** build in M4 → publish.
- **Launch Campaign:** set audience + template + channel → **M6 preflight** → optional dry‑run → launch.
- **User Flow:** receives email → open/click → educational landing (no data capture) → option to “Report phishing”.
- **Post‑Campaign:** summarized reports (Org/Dept/User) + recommendations (M2 or micro‑journeys) + **Evidence Snapshot**.

## 6) Acceptance Criteria (AC)
- Campaign cannot launch without **preflight ok** and valid audience.
- Delivered/Open/Click/Report recorded per assigned user.
- Accurate **Time‑to‑Click** & **Time‑to‑Report** measurement (seconds).
- **Evidence Snapshot** includes template/config + key stats.
- M8 auto rules fire upon thresholds (e.g., 2 clicks/30d).

## 7) Governance, Security & Privacy
- RBAC:
  - `phishing.manage` (create/launch)
  - `phishing.view` (reports)
  - `phishing.template_publish` (publish templates)
- **No Credential Harvesting:** educational landing only; no credential storage.
- **Rate Limits** to avoid spam; audience throttling for large sends.
- **Opt‑out Controls** for special cases (temporary exclusions).
- **Localization:** AR/EN emails & landing pages with RTL support.

## 8) Built‑in Improvements (MVP)
- **P1:** Template difficulty levels (Low/Med/High) for progressive training.
- **P2:** Department heatmap (Susceptibility vs Reporting).
- **P3:** Auto recommendations for micro‑journeys by topic/role/level.
- **P4:** One‑click **Re‑target** for non‑reporters after X days.

## 9) KPIs
- Quarterly reduction in **Phishing Click Rate** ≥ 20% for active tenants.
- **Report Rate** ≥ 30% after 90 days of active awareness.
- Median **Time‑to‑Report** improvement ≥ 25% within 6 months.
- ≥ 99% preflight success for enabled channels.

## 10) Constraints & Assumptions
- Phase 1 channels only (M365/Email); Slack used for notifications, not simulation.
- Organization‑level reports aggregate users; individual details visible to direct manager/security only.
- All data stored within tenant database (per‑DB isolation).


# M10 — Reports & Evidence Packs (v1.0)
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Aggregate executive/operational metrics across **M2, M3, M5, M8, M9** and generate **Evidence Packs** (NCA/ISO) as **Dashboards + PDF/CSV/Excel**, with scheduling and notifications.

## 2) MVP Scope
- **Built-in Reports:**
  - **Executive Report (Org):** Culture Index, best/worst departments, Phishing KPIs, open escalations.
  - **Department Report:** Dept CI, campaign progress, quiz outcomes, points/badges, escalations.
  - **User Coaching Card:** CI_user, points, common mistakes, recommended micro-journey.
  - **Phishing Summary:** Click/Report/TTClick/TTReport + department heatmap.
  - **Compliance Timeline:** condensed milestones (launch/close/escalations/evidence).
- **Exports:** **PDF** (stamped/paginated), **CSV/Excel** for detailed rows.
- **Evidence Packs (NCA/ISO):**
  - Build pack for campaign/period (30/90 days) linking: M4 content + M6 delivery settings + M2/M9 results + snapshots.
  - **Manifest** includes versions, checksums, publish/close timestamps.
- **Scheduling:** weekly/monthly email delivery to managers (secure links or lightweight attachments).

## 3) Contracts
**Inputs**
- From **M3:** CI metrics (E/L/B/P/C) by user/department/org.
- From **M2:** campaigns, participation, quizzes.
- From **M5:** points/badges/micro-journeys.
- From **M8:** escalation cases & events.
- From **M9:** phishing results & timing metrics.
- From **M4/M6:** content/integration metadata for manifests.

**Outputs**
- Events: `report.generated`, `report.scheduled_sent`, `evidence_pack.built`.
- Files: PDF/CSV/XLSX + JSON manifest.
- APIs: `GET /reports/:id`, `GET /evidence/:id`.

## 4) High-level Data Model
- `report_definitions`
  `{id, key, scope(org|dept|user|mixed), layout_json, filters_schema_json, export_formats[], schedule_cron|null, enabled}`
- `report_runs`
  `{id, report_def_id, window, filters_json, started_at, finished_at, status(ok|fail), output_refs{pdf?,csv?,xlsx?}, triggered_by(system|user_id)}`
- `evidence_manifests`
  `{id, tenant_id, title, window, standard(nca|iso27001|custom), manifest_json, checksum, built_at, built_by}`
- `report_audit_log`
  `{id, actor_user_id, action(create|update|run|schedule|delete), diff_json, ts}`

## 5) Flows
- **Generate (On-Demand):** pick report + window/filters → run → produce files → notify.
- **Schedule:** set cadence + recipients → auto run & email with delivery logs.
- **Build Evidence Pack:** choose standard & window → gather content/settings/results → create manifest + bundle → download/secure share.

## 6) Acceptance Criteria (AC)
- Executive/Department/User/Phishing reports render with numbers consistent with CI dashboards.
- Downloadable **PDF/CSV/Excel** for in-scope reports.
- Evidence Pack includes content/settings/results/snapshots + **manifest** with versioning & checksums.
- Monthly scheduled report delivered to recipients with success/failure log.

## 7) Governance & Security
- RBAC:
  - `reports.view` (dashboards)
  - `reports.export` (file generation)
  - `evidence.manage` (pack building/publishing)
- Privacy: org-level aggregation hides individuals; individual detail only for direct manager/security.
- File security: time-limited download links, PDF fingerprint/watermark (tenant name/date).

## 8) Improvements (in MVP)
- **R1:** AR/EN PDF templates with RTL; standard footer (logo, date, page number).
- **R2:** Drill-down: Executive → Department → User Coaching Card.
- **R3:** **One-click Evidence** from M2 campaign page.
- **R4:** **CSV Dictionary** documenting exported columns.

## 9) KPIs
- Executive PDF generation time ≤ 10s (mid-size tenants).
- Numeric consistency with CI dashboards = 100% in tests.
- Evidence pack build success ≥ 99%.
- Scheduled report success rate ≥ 98%.

## 10) Constraints & Assumptions
- Generation runs within tenant environment (per-DB isolation).
- Large files provided as secure links instead of email attachments.
- PDF layouts customizable later (tenant-themed templates).


# M11 — AI Insights & Coaching Center (v1.0)
**Route:** /admin/ai/insights  
**Project:** Romuz Cybersecurity Culture Platform

## 1) Purpose
Executive & coaching intelligence hub that unifies signals from **M2, M3, M5, M8, M9** to produce:
- Actionable recommendations (campaigns, micro-journeys, escalations).
- Explanatory narratives (AR/EN) that answer *why the index dropped* and *what to do now*.
- Ready-to-send **Coaching Cards** for managers (email/Slack via M6).
- Weekly/Monthly digests for executives.

## 2) MVP Scope
- **Insight Tiles:** Top drops, high-risk departments, quick wins, stalled escalations.
- **Recommendations Engine:** Suggest **M2** campaign or **M5** journey with prefilled params (audience/topic/level).
- **Narratives Generator:** Short bilingual summaries with causes & next actions.
- **Coaching Cards:** Prebuilt messages for managers to nudge their teams (AR/EN).
- **Digests:** Weekly/Monthly auto summaries with links to dashboards/reports.
- **Explainability:** “Why this?” shows source signals & links (M3/M10).

## 3) Contracts
**Inputs**
- From **M3**: CI trends & E/L/B/P/C breakdowns (user/dept/org).  
- From **M2**: campaign progress & quiz outcomes.  
- From **M5**: points/badges/journeys completion.  
- From **M8**: escalation cases & states.  
- From **M9**: phishing metrics (click/report/TTClick/TTReport).  
- From **M4/M6**: content availability & channel readiness.

**Outputs**
- Events: `insight.created`, `recommendation.issued(action=campaign|journey|escalation)`, `digest.sent`, `coaching_card.sent`.

## 4) High‑level Data Model
- `ai_insights`  
  `{id, scope(user|dept|org), subject_ref, type(drop|risk|opportunity), summary, signals_json, created_at, status(open|applied|dismissed)}`
- `ai_recommendations`  
  `{id, insight_id, action(campaign|journey|escalation), params_json, confidence(0..1), rationale, created_at, applied_by, applied_at}`
- `ai_digests`  
  `{id, period(week|month), audience(management|dept_heads), content_ref, sent_at}`
- `coaching_cards`  
  `{id, dept_id|null, template_key, lang(ar|en), body_text, channel(email|slack), sent_by, sent_at}`

> All tables reside **inside the tenant database** (per‑DB isolation).

## 5) Flows
- **Nightly Build:** aggregate signals → create `ai_insights` + `ai_recommendations`.  
- **Real‑time Nudge:** strong event (e.g., phishing click spike) → instant recommendation (journey + manager alert).  
- **Apply Action:** from M11 **Apply** opens M2/M5 with prefilled params; saving occurs there (audited).  
- **Digest:** scheduled via M6 (email/Slack links) with delivery logs.

## 6) Acceptance Criteria (AC)
- 3–5 Insight Tiles sorted by impact & confidence.  
- **Apply** passes correct audience/topic/level to M2/M5.  
- `ai_digests` records sent entries for weekly/monthly schedules.  
- “Why this?” shows numeric, verifiable signals with links to M3/M10.

## 7) Governance & Security
- RBAC:  
  - `ai_insights.view` (view insights)  
  - `ai_recommendations.apply` (apply actions)  
  - `ai_digests.manage` (schedule/send digests)  
- Bilingual (AR/EN), RTL UI.
- No direct side‑effects without going through M2/M5 (clear audit path).

## 8) Built‑in Improvements (in MVP)
- **AI‑Confidence Badge** on recommendations.  
- **One‑click Coaching** to send manager nudges with editable text.  
- **Insight Filters** by dept/role/topic.  
- **Action History** per insight (applied/dismissed + who/when).

## 9) KPIs
- ≥ 70% of applied recommendations show measurable CI_user/CI_dept improvement within 14–30 days.  
- M11 render time ≤ 2s using precomputed data.  
- Digest open rate ≥ 50% in target audience.

## 10) Constraints & Assumptions
- Heuristic/statistical rules first; ML models later (Phase 2).  
- Execution routes through M2/M5; M11 is an orchestrator with full audit.


# M12 — HRMS & JIT Onboarding (Phase 2)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-المvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-phase-2)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تمكين ربط المنصّة مع أنظمة الموارد البشرية (HRMS) وتفعيل **Just-in-Time (JIT) Onboarding** بحيث يتم إنشاء حسابات المستخدمين وتعيين الصلاحيات آليًا عند أول دخول (أو عند وصول حدث HR)، مع تشغيل باقة مهام الاستقبال (Pre-boarding/Onboarding) وربطها ببرامج التوعية والثقافة السيبرانية.

## 2) نطاق الـMVP (Scope)
- **تكامل HRMS – مرحلة أولى:**
  - مصادر بيانات مدعومة: CSV Secure Upload، تكامل أولي مع **Microsoft Entra/M365** لسمات الهوية، و**Slack Pilot** للمراسلة.
  - خريطة سمات (Attribute Mapping) أساسية: الاسم، البريد، الوظيفة، القسم، المقر، المدير المباشر، الحالة الوظيفية.
- **JIT Provisioning:** إنشاء مستخدم وProfile داخل المنصّة عند أول SSO/Email Login أو عند ورود **Joiner Event**.
- **JML Lifecycle (Joiner/Mover/Leaver):** مشغّلات قواعد (Rules) لتحديث الدور والقسم عند النقل، وتعطيل الوصول عند إنهاء الخدمة.
- **Onboarding Packs:** تشغيل حزمة مهام تلقائية حسب **الوظيفة/القسم/الموقع** (سياسات للقراءة والتوقيع، Micro-Quiz إلزامي، دورة Phishing 101).
- **Approvals Light:** موافقة مدير/HR على الحالات الشاذة (Missing attributes / High-privilege).
- **Evidence:** لقطات امتثال للتوظيف: Policy Acknowledgment، إكمال تدريب البداية، ختم تاريخ الإنشاء والتفعيل.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Ingestion Contract (CSV/API)
- تنسيق CSV آمن (UTF-8), أعمدة إلزامية:  
  `employee_id, email, first_name, last_name, department, job_title, location, manager_email, employment_status (active|terminated), start_date, end_date?`
- التحقق: uniqueness للبريد/employee_id، تواريخ صحيحة، التوافق مع مخطط الأقسام/المناصب.

### 3.2 Attribute Mapping Policy
- HRMS → Identity Store (Platform) → Tenant RBAC/Capabilities.
- قواعد تحويل (Normalizers): casing للبريد، تعريب/ترميز الأقسام، fallback للموقع.

### 3.3 Events/Webhooks (Phase 2/3)
- أحداث داخلية: `hr.joiner.created`, `hr.mover.updated`, `hr.leaver.deactivated`, `onboarding.completed`.
- Webhooks خارجية (Phase 3): دفع إشعارات للمصادر المتكاملة/نظم ITSM.

### 3.4 SCIM/SSO (Phase 3)
- مواصفة SCIM لاحقًا، مع استمرار **Entra SSO** كقناة هوية أساسية.

## 4) نموذج البيانات (High-Level Data Model)
> **مبدأ العزل:** قاعدة بيانات مستقلة لكل عميل (**per-DB isolation**).

- **employees**: الملف الوظيفي (PII مشفّرة)، مفاتيح: `employee_id`, `email` (Unique).
- **org_units**: الأقسام مع هيكل هرمي (parent_id).
- **positions**: المسمّيات الوظيفية وربطها بقدرات (Capabilities).
- **employment_records**: الحالة (active/terminated/leave), تواريخ، نوع التوظيف.
- **identity_accounts**: ربط المستخدم بحسابات المصادقة (local/email/Entra).
- **access_grants**: ربط المستخدم بأدوار/Capabilities مع مصدر المنح (HR/JIT/Admin).
- **onboarding_packages**: قوالب مهام حسب (department/position/location).
- **onboarding_tasks**: مهام فعلية لكل مستخدم (policy_read, micro_quiz, phishing_basics).
- **acknowledgments**: توقيعات/اقرارات سياسات مع البصمة الزمنية.
- **jml_events**: سجلات Joiner/Mover/Leaver مع السبب والمصدر.
- **audit_logs**: كل تغيير على الهوية/الوصول/المهام.
- **kpi_snapshots**: مؤشرات السرعة والامتثال (time_to_provision, completion_rate).

## 5) التدفقات (Key Flows)
### 5.1 Joiner (JIT)
1) وصول سجل HR جديد أو أول تسجيل دخول عبر SSO → إنشاء `employee` + `identity_account`.
2) تعيين `org_unit` و`position` من السمات.
3) تطبيق قواعد الدور/القدرات (Baseline + Position/Dept).
4) تفعيل حزمة Onboarding المناسبة وإشعار المستخدم (Email/Slack).

### 5.2 Mover
- تحديث القسم/الوظيفة → إعادة احتساب الصلاحيات (Reconciliation) + إغلاق/فتح مهام إضافية.

### 5.3 Leaver
- تعطيل الوصول، إلغاء الجلسات، إيقاف الـnotifications، أرشفة الأدلة، الاحتفاظ حسب سياسة العميل.

### 5.4 Exception Handling
- نقص سمات حرجة → توجيه للموافقة/الإكمال اليدوي.

### 5.5 Evidence Trail
- كل خطوة تُسجّل مع بصمة زمنية وربط بالسياسات والتدريب.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS** على جميع جداول PII، ونطاق الوصول حسب Tenant + Least Privilege.
- **PII Encryption at Rest** (عمودياً للحساسات) + **TLS in Transit**.
- **Audit & Tamper-proofing:** سجلات غير قابلة للتعديل مع توقيع/سلسلة هاش.
- **Data Retention:** سياسات احتفاظ حسب البلد/العميل، حق النسيان (عند الطلب القانوني).
- **Access Reviews:** مراجعات دورية لأذونات الحسّاسة (Quarterly).
- **Rate-limits & Input Validation** لملفات CSV وواجهات الإدخال.
- **Security Posture Hooks:** ربط النتائج المبكرة بـ M3 (Culture KPIs) وM11 (AI Insights) للتوصيات.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | JIT Creation:**  
  *Given* سجل HR صالح، *When* يصل أو يحدث أول Login، *Then* يُنشأ المستخدم، تُعيَّن صلاحياته، وتُنشّط حزمة Onboarding المناسبة خلال ≤ **60s**.
- **AC-02 | Mover Reconciliation:**  
  *Given* تغيير قسم/وظيفة، *When* تحديث السمات، *Then* تُسحب الأذونات غير الملائمة ويُمنح الجديد خلال ≤ **5m** مع سجل تدقيق.
- **AC-03 | Leaver Deactivation:**  
  *Given* حالة Leaver، *When* end_date ≤ اليوم، *Then* يُعطّل الحساب فورًا وتُزال الجلسات ويُوقف الإشعار.
- **AC-04 | Evidence Pack:**  
  عند إتمام Onboarding، يتوافر **Evidence Pack** يحتوي: Policy Acknowledgments + Micro-Quiz Result + Timestamps.
- **AC-05 | Exceptions:**  
  حالات attributes الناقصة تدخل مسار موافقات، ولا تُمنح صلاحيات مرتفعة إلا بعد موافقة HR/Manager.

## 8) تحسينات خفيفة (Quick Wins)
- **Pre-boarding Portal:** صفحة ترحيب للمُعينين الجدد لأكتمال البيانات والاطلاع على السياسات قبل يومهم الأول.
- **Smart Forms:** التحقّق الفوري من المدير/القسم (Lookup)، ورفع وثائق الهوية داخليًا بشكل آمن.
- **Coaching Nudges:** تلميحات قصيرة داخل المهام لتعزيز الامتثال.
- **Bilingual Templates (AR/EN):** للإشعارات، سياسات البداية، وتعليمات الوصول.
- **Slack/Email Alerts:** تنبيهات للمدير عند تأخر مهام الموظف الجديد.

## 9) KPIs (Phase 2)
- **Time-to-Provision (TTP90):** 90th percentile ≤ **2 دقائق** من أول Login/حدث HR.
- **Onboarding Completion (D+7):** ≥ **85%** إكمال خلال 7 أيام.
- **Exception Rate:** ≤ **5%** من السجلات تحتاج تدخّل يدوي.
- **Orphan Access after Leaver (D+1):** = **0**.
- **Mover Drift:** % المستخدمين الذين احتفظوا بصلاحيات قديمة بعد 24 ساعة ≤ **1%**.
- **Data Quality Score:** ≥ **98%** حقول إلزامية متوفرة وصحيحة.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **مرحلة أولى بدون SCIM كامل**؛ الاعتماد على CSV + Entra/M365 Attributes + Slack Pilot.
- **اعتماد per-DB isolation** في الإنتاج على GCP داخل السعودية.
- **الهوية المحلية + Entra** (كما في الخريطة العامة)؛ SSO إلزامي لاحقًا لبعض العملاء.
- **HR Ownership:** صحة البيانات مسؤولية HR؛ المنصّة توفّر تحققًا وواجهات تنبيه.
- **Latency Windows:** JIT ≤ 60s، مزامنة دورية (Poll/Webhook) كل 5 دقائق حدًا أقصى في الـMVP.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات M1–M11، ويستند إلى معمارية SaaS متعددة العملاء مع عزل per-DB، وبيئة تطوير Supabase وإنتاج على Google Cloud داخل السعودية.



# M13 — Incident & Risk Bridge (Phase 3)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-phase-3)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
بناء جسر تشغيلي وتحليلي بين **إدارة الحوادث (Incidents)** و**إدارة المخاطر (Risk Register/Treatments)** لربط كل حادث بمخاطر/ضوابط/خسائر، وتوليد **تعلّم مؤسسي** يغذّي برامج التوعية والثقافة، ويُحدِّث شهية المخاطر (Risk Appetite) ومقاييس الفعالية.

## 2) نطاق الـMVP (Scope)
- **ربط ثنائي الاتجاه Incident ⇄ Risk:**
  - إنشاء/ربط **Risk Item** تلقائيًا أو يدويًا عند تسجيل Incident.
  - إسناد **Controls** ذات العلاقة (Policies, Procedures, Technical).
- **RCA & Loss Events:** نموذج **Root Cause Analysis** موحّد، وتوثيق **خسائر مباشرة/غير مباشرة**.
- **Risk Impact Feedback:** تحديث تلقائي لدرجة المخاطر (Likelihood/Impact) وفق شدة الحادث وأدلته.
- **Playbooks:** قوالب بروتوكولات (Containment, Eradication, Recovery) مع نقاط تحقق امتثالية.
- **Awareness Loop:** توليد **Learning Items** تُغذّي M2/M5 (حملات/مسارات قصيرة) وM11 (AI Insights).
- **Evidence Packs:** ربط أدلة الحادث بخطة المعالجة (Treatment) وتقارير M10.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inbound (Phase 3)
- **ITSM Connectors:** Jira Service Management / ServiceNow (اختياري MVP عبر CSV/API خفيف).
- **Security Tools (خيار):** SIEM/EDR ملخّص تنبيهات (severity, source, asset).

### 3.2 Data Contracts
- **Incident →** `{id, title, severity, status, detected_at, contained_at?, resolved_at?, category, asset, reporter, evidence[]}`
- **Risk Link →** `{risk_id?, create_if_missing: bool, initial_score?, related_controls[], loss_events[]}`
- **RCA →** `{method (5Whys/Ishikawa), root_cause, contributing_factors[], lessons[], owner}`

### 3.3 Events/Webhooks
- **داخلي:** `incident.created`, `incident.severity.changed`, `incident.closed`, `risk.score.updated`, `lesson.created`.
- **خارجي (Phase 3):** `risk.updated`, `treatment.approved`, `evidence.bundle.ready`.

## 4) نموذج البيانات (High-Level Data Model)
> **مبدأ العزل:** قاعدة مستقلة لكل عميل (**per-DB isolation**).

- **incidents**: بيانات الحوادث وسيرها (severity, status, SLA).
- **incident_evidence**: مرفقات/روابط، تجزئة Hash، أختام زمنية.
- **risks**: سجل المخاطر (category, owner, inherent/residual score, appetite).
- **risk_incident_links**: جدول وسيط يحدد نوع العلاقة (root, contributing, near-miss).
- **controls**: ضوابط مرتبطة بالأطر (NCA/ISO…) وحالات الفعالية.
- **risk_controls**: ربط المخاطر بالضوابط.
- **treatments**: خطط المعالجة (accept/avoid/transfer/mitigate) مع مهام ومواعيد.
- **rca_cases**: تفاصيل التحليل الجذري والنتائج والدروس.
- **loss_events**: نوع/قيمة الخسارة (مباشرة/سمعة/قانونية).
- **lessons_learned**: عناصر تعلّم قابلة للتحويل إلى محتوى توعوي.
- **kpi_snapshots**: مؤشرات MTTD/MTTR/closure quality.
- **audit_logs**: أثر تدقيقي لكافة التغييرات.

## 5) التدفقات (Key Flows)
### F1 | Incident → Risk Link (Auto/Manual)
عند تسجيل Incident (sev ≥ مذكور في السياسات) → اقتراح ربط بمخاطر قائمة (via matching: asset/category/tags) أو إنشاء Risk جديد **(create_if_missing)** مع score أولي.

### F2 | RCA & Lessons
بعد الاحتواء/الإغلاق، يفتح **RCA Case** إجباري لدرجات شدة محددة → استخراج **Lessons Learned** → تُحوَّل إلى عناصر **Awareness Content** (M2/M5) عبر queue.

### F3 | Risk Scoring Feedback
تحديث Likelihood/Impact/Residual تلقائيًا وفق شدة وتكرار الحوادث، وتأثير الضوابط (control effectiveness delta).

### F4 | Treatment Orchestration
عند تجاوز المخاطر سقف الشهية (Appetite Threshold) → إنشاء/تحديث **Treatment** + مهام متابعة + إشعارات M8.

### F5 | Evidence Pack & Reports
توليد حزمة أدلة (timeline, approvals, artifacts) متاحة في M10 ومربوطة بالمعالجة.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS** صارمة على incidents/risks/evidence حسب الدور والقسم وحساسية الأصل (asset sensitivity).
- **PII/Secrets Handling:** تشفير مستندات الحساسية العالية، وضوابط تنزيل/عرض بحدود.
- **Tamper-evident Evidence:** تجزئة وchain-of-custody.
- **SLA & Duty of Care:** سياسات زمنية لكل حالة شدة مع تنبيهات وتَصعيد (M8).
- **Segregation of Duties:** فصل أدوار Incident Owner عن Risk Approver عند الحاجة.
- **Retention & Legal Hold:** قواعد احتفاظ ودعم التحقيقات القانونية.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Auto Link Suggestion:**  
  *Given* Incident sev ≥ Medium، *When* يُسجّل، *Then* تظهر اقتراحات ربط بمخاطر قائمة بنسبة مطابقة ≥ **0.7** أو خيار **Create & Link** خلال ≤ **30s**.
- **AC-02 | RCA Mandatory:**  
  *Given* Incident sev ≥ High، *Then* لا يُمكن الإغلاق دون **RCA Case** مكتمل ودروس موثّقة ≥ **2** بنود.
- **AC-03 | Risk Score Update:**  
  *When* Incident مرتبط يُغلق مع Loss > 0، *Then* يُحدّث **Residual Score** ويُسجّل السبب والأثر في **risk_incident_links**.
- **AC-04 | Appetite Breach:**  
  *Given* تجاوز Residual > Appetite، *Then* تُنشأ **Treatment** مع مالك وموعد نهائي وتنبيهات تصعيد.
- **AC-05 | Evidence Pack:**  
  عند الإغلاق، تتوفر **حزمة أدلة** تشمل: التسلسل الزمني، الموافقات، المرفقات، خلاصة RCA، وقرارات المعالجة.
- **AC-06 | Awareness Sync:**  
  *When* تُنشأ **Lessons Learned**، *Then* تُضاف تلقائيًا إلى قائمة **Awareness Backlog** للمراجعة في M2/M5 خلال ≤ **1h**.

## 8) تحسينات خفيفة (Quick Wins)
- **Risk-from-Template:** إنشاء مخاطر قياسية جاهزة حسب فئة الحادث (Phishing, Malware, Data Leak).
- **Control Effectiveness Survey:** نموذج خفيف لتقييم فعالية الضوابط بعد كل حادث.
- **Near-Miss Capture:** نموذج مبسّط لتسجيل شبه-حادث لتغذية احتمالية المخاطر.
- **One-Click Executive Brief:** ملخص إداري تلقائي (1 صفحة) مع توصيات واضحة.

## 9) KPIs (Phase 3)
- **MTTD/MTTR:** اتجاهات زمن الاكتشاف والمعالجة حسب الفئة والشدة.
- **% Incidents with RCA:** ≥ **95%** للحوادث High خلال 7 أيام.
- **Risk Mapping Coverage:** ≥ **90%** من الحوادث الموثّقة مرتبطة بمخاطر.
- **Control Effectiveness Δ:** تحسّن ربع سنوي ≥ **15%** في الضوابط المتكررة ذات الصلة.
- **Repeat Incident Rate (90d):** ≤ **5%** لنفس الفئة على نفس الأصل.
- **Time-to-Risk-Update:** ≤ **24h** من إغلاق الحادث.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **Connectors خفيفة** في الـMVP (CSV/API مبسّط لـ Jira/ServiceNow) قبل موصلات رسمية.
- **لا يعتمد على SIEM كامل**؛ يتم قبول ملخّصات فقط في المرحلة الأولى.
- **التصنيف المبدئي** يدوي مع اقتراحات ذكية لاحقًا (M11).
- **بيئة:** Supabase للتطوير، إنتاج على **Google Cloud (KSA)** مع **per-DB isolation**.
- **RBAC/Capabilities** كما في M1 وموديولات الهوية.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M12) ويركّز على الربط التشغيلي والتحليلي بين الحوادث والمخاطر مع مخرجات قابلة للتفعيل في الوعي والثقافة.



# M14 — Data Warehouse & Benchmarking
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Data Flows & Pipelines)](#5-التدفقات-data-flows--pipelines)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-warehouse--benchmark)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تأسيس **طبقة بيانات مؤسسية** تدعم التحليلات المتقدمة، مؤشرات الثقافة السيبرانية، والتقارير التنفيذية عبر **Data Warehouse** متعدد العملاء مع **Benchmarking** (اختياري/Opt-in) مجهول الهوية عبر القطاعات، لتمكين المقارنة الموضوعية (Peer Comparison) والتعلّم المؤسسي وتحسين القرارات.

## 2) نطاق الـMVP (Scope)
- **Warehouse Layers:** Staging → Curated (ODS) → Marts (Reporting Marts) لكل Tenant + Mart موحّد مجهول للقياس المقارن.
- **Sources (من M1–M13):** الهوية والمستخدمون، الحملات والتعلّم المصغّر، Culture KPIs، المحتوى والأدلة، Gamification، التكاملات (Entra/M365/Email/Slack)، التصعيد والمتابعة، التصيّد، التقارير، AI Insights، HRMS/JIT، Incident–Risk Bridge.
- **ETL/ELT Pipelines:** دفعات مجدولة (Batch) + Hooks للأحداث الحرجة (Near-Real-Time) لمقاييس فورية.
- **Semantic Layer:** تعريف موحّد للمقاييس (مثل: Completion Rate, Phish-prone %, TTP90, MTTR, Culture Index).
- **Benchmarking (Opt-in):** طبقة Aggregation مع إخفاء الهوية ودعم التصفية حسب **الحجم/القطاع/المنطقة**.
- **BI Outputs:** لوحات تنفيذية (Executive), لوحات تشغيليّة (Ops), وملفات Evidence جاهزة للتنزيل (M10).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Data Contracts (Inbound)
- جداول معيارية لكل مصدر مع Schema Versioning و`_ingested_at`, `_source_tenant_id`, `_hash`.
- سياسة **Idempotent Upserts** باستخدام مفاتيح أعمال (business keys) + `surrogate keys`.

### 3.2 Event Bus (اختياري)
- أحداث مختارة `kpi.snapshot.created`, `campaign.completed`, `phishing.result.recorded`, `incident.closed` لالتقاط لقطات فورية.

### 3.3 Outbound/BI
- **SQL Views** معيارية للمؤشرات، و**Materialized Views** لزمن استجابة منخفض.
- **Exports:** CSV/Parquet آمن، و**Secure BI Connectors** (مثلاً Looker/Power BI/Tableau).

### 3.4 Benchmark Opt-in API
- نقطة تمكين/تعطيل، ونطاق المشاركة (كامل/جزئي/مؤشرات محددة).

## 4) نموذج البيانات (High-Level Data Model)
> **العزل:** لكل عميل قاعدة تشغيلية مستقلة (**per-DB isolation**)، ويُستخلص إلى Warehouse مع **Tenant Partitioning**.  
> **التحصين:** طبقة Benchmark منفصلة بهويات مجهّلة (Pseudonymization/Anonymization).

- **dim_tenant, dim_org_unit, dim_user (PII-safe)**
- **dim_time, dim_geo, dim_job, dim_channel (Email/Slack/M365)**
- **fact_campaign_delivery, fact_quiz_results, fact_policy_ack**
- **fact_gamification_points, fact_escalations**
- **fact_phishing_events (sent, opened, clicked, reported)**
- **fact_incidents, fact_risk_scores, fact_loss_events**
- **fact_onboarding (HR/JIT), fact_access_review**
- **kpi_snapshots** (Culture Index, E/L/B/P/C، MTTD/MTTR، TTP90، …)

## 5) التدفقات (Data Flows & Pipelines)
- **ELT Batch (Every 15–60 min):** استخلاص من قواعد التشغيل (per-DB) → Staging (raw) → Curated (cleansing/typing) → Marts.
- **Change Data Capture (CDC) خفيف:** على جداول حرجة (phishing, incidents, kpi_snapshots) لتقارير قريبة من الزمن الحقيقي.
- **Data Quality Gates:** فحوص completeness, uniqueness, referential integrity قبل نشر الـMarts.
- **Reconciliation Jobs:** مقارنة أعداد السجلات والمجاميع مع الأنظمة التشغيلية، وتسجيل الفروقات.
- **Benchmark Build:** تجميع مجهول + تصنيف Sector/Size/Region + نشر مؤشرات المقارنة.

## 6) الحوكمة والأمن (Governance & Security)
- **Data Classification:** تصنيف PII/Confidential/Restricted وحصرها في طبقات مأمونة.
- **Access Control:** مبدأ Least Privilege، فصل صلاحيات **Ops vs. Analysts**، و**RLS** على العروض (Views) الخاصة بكل Tenant.
- **Encryption:** تشفير في السكون والحركة، ومفاتيح إدارة مفصولة.
- **Anonymization & k-Anonymity:** تطبيق **Generalization/Noise** حيث يلزم قبل إدراج البيانات في طبقة Benchmark.
- **Lineage & Auditability:** تتبع مصادر الحقول عبر **Data Catalog/Lineage** وسِجل تغييرات Schema.
- **Retention:** سياسات احتفاظ مختلفة (تشغيلي vs. Warehouse) وتوافق قانوني (Right to be Forgotten عبر مفاتيح Surrogate مع De-reference).

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Curated Freshness:**  
  *Given* تشغيل ELT كل 30 دقيقة، *Then* تكون Marts الحرجة محدثة خلال ≤ **35 دقيقة** مع مؤشّر Freshness ظاهر في الـBI.
- **AC-02 | DQ Gates:**  
  لا يُنشر أي Mart إذا فشل **≥ 1** فحص **Critical DQ** (uniqueness, referential integrity) وتُسجّل تذكرة تلقائيًا.
- **AC-03 | Benchmark Privacy:**  
  عند تمكين Benchmark، لا تحتوي طبقة المقارنة أي **PII**، وتُحترم **k-Anonymity ≥ 10** لكل بُعد تحليلي.
- **AC-04 | Semantic Consistency:**  
  المقاييس الموحّدة (Completion, Phish-prone %, TTP90) تُنتَج من **Semantic Layer** نفسها لجميع التقارير.
- **AC-05 | Tenant Isolation in BI:**  
  لا يمكن لمستخدم Tenant A رؤية بيانات Tenant B على أي View/Report (اختبارات RLS ناجحة).
- **AC-06 | Reconciliation:**  
  الفروقات بين التشغيلية وWarehouse ≤ **0.5%** لكل fact حرِج أو موثّقة مع سبب.

## 8) تحسينات خفيفة (Quick Wins)
- **One-Click Executive Board Pack:** توليد ملف PDF رُبع سنوي موحّد (KPI + Trends + Benchmarks).
- **Anomaly Radar:** تنبيهات إحصائية على تغيّرات غير اعتيادية (z-score/prophet) لمعدلات النقر على التصيد وإكمال الدورات.
- **Sector Templates:** حِزم مؤشرات جاهزة حسب قطاع (Finance, Gov, Legal).
- **Self-Service Data Dictionary:** كتالوج تفاعلي للمقاييس والجداول.

## 9) KPIs (Warehouse & Benchmark)
- **Pipeline Success Rate:** ≥ **99%** شهريًا.
- **Data Freshness (P95):** ≤ **40 دقيقة** للـMarts الحرجة.
- **DQ Pass Rate:** ≥ **98%** من اختبارات الجودة.
- **Benchmark Coverage:** ≥ **60%** من العملاء المفعّلين يشاركون Opt-in خلال 6 أشهر.
- **BI Adoption:** ≥ **70%** من الأدوار الإدارية تستخدم لوحة تنفيذية مرة أسبوعيًا على الأقل.

## 10) قيود وافتراضات (Constraints & Assumptions)
- **Compute/Storage على Google Cloud داخل السعودية** بما يتوافق مع سياسة العزل، مع إمكانية توسيع التخزين البارد (Cold Storage) للأدلة.
- **لا مشاركة في Benchmark إلا Opt-in** وبنطاق متّفق عليه تعاقديًا.
- **بداية بدون Streaming كامل**؛ NRT محدود على جداول حرجة فقط.
- **استقلالية Schema لكل إصدار:** ترحيلات (Migrations) محسوبة مع Backward-compatible Views عند الإمكان.
- **عدم الاعتماد على أداة BI محددة**؛ يجب دعم وصلات قياسية (JDBC/ODBC/Service Account).

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M13)، ويركّز على التراصّ البياني، الحوكمة، ومؤشرات القياس المقارن.



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



# M16 — Privacy, Retention & Legal Holds (Phase 3)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تأسيس طبقة حوكمة خصوصية موحّدة تضبط **تصنيف البيانات، سياسات الاحتفاظ (Retention), حقوق أصحاب البيانات (DSRs), الإخفاء/التنقيح (Redaction/Anonymization), والتجميد القانوني (Legal Hold)** عبر كل الموديولات (M1–M15) مع أثر تدقيقي قوي وامتثال لأنظمة KSA (PDPL) ومعايير عالمية.

## 2) نطاق الـMVP (Scope)
- **Data Classification** على مستوى الحقول والجداول (PII/Confidential/Restricted/Public) مع ملصقات (Tags).
- **Retention Policies** على الكيانات الحرجة: incidents, evidence, phishing, training records, HR/JIT, audit_logs.
- **DSRs (Data Subject Requests)**: طلبات **Access / Rectification / Erasure** قابلة للتتبع والموافقة.
- **Redaction & Anonymization**: تنقيح حقول حساسة في الاستعلامات/التقارير و**Anonymized Views** للـBenchmark (تكامل مع M14).
- **Legal Hold**: تعليق سياسات الحذف لِسجلات محددة مع سبب ومالك وفترة.
- **Consent Registry (خفيف)**: تتبّع أساس المعالجة (lawful basis) وإثبات الموافقة حيث يلزم.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Policy Registry API
- `POST /v1/privacy/policies` تعريف/تحديث سياسة احتفاظ/تصنيف.
- `POST /v1/privacy/legal-holds` إنشاء/رفع التجميد القانوني.
- `POST /v1/privacy/dsrs` تسجيل طلبات الأفراد وتتبع حالتها.

### 3.2 Execution Engine
- Jobs مجدولة للحذف/الطمس/الأرشفة مع **Dry-Run** وتقرير تأثير.

### 3.3 Events/Webhooks
- `privacy.retention.executed`, `privacy.legal_hold.enforced`, `privacy.dsr.updated`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + طبقة سياسات مركزية داخل نفس قاعدة العميل.

- **privacy_policies**: نوع السياسة (retention/classification/redaction), النطاق (entity/field), المدد، الاستثناءات.
- **privacy_legal_holds**: الهدف (entity/id range/query), السبب، الفترة، المالك، حالة التفعيل.
- **privacy_dsrs**: نوع الطلب، صاحب البيانات (user/employee), المدى، المهل الزمنية، القرارات، الأدلة.
- **privacy_executions**: سجلات تنفيذ الحذف/الطمس/الأرشفة (قبل/بعد/نتائج/أخطاء).
- **privacy_consents** (اختياري): نوع الموافقة، القناة، الطابع الزمني، المصدر.
- **privacy_catalog**: خريطة الحقول الحساسة وروابط lineage (تكامل مع M14).

## 5) التدفقات (Key Flows)
### F1 | Retention Enforcement
1) جدولة يومية تفحص السياسات الفعّالة →  
2) تحديد السجلات المؤهلة للحذف/الطمس (باستثناء Legal Hold) →  
3) **Dry-Run Report** (عدد السجلات/الكيانات) → موافقة مالك البيانات → تنفيذ آمن مع أثر تدقيقي.

### F2 | Legal Hold
إنشاء تجميد قانوني على incident/evidence/risks وفق تحقيق جاري → يمنع أي حذف/طمس حتى الرفع.

### F3 | DSR — Access/Erasure
استقبال الطلب → التحقق من الهوية/الصلاحية → تجميع البيانات من الجداول ذات الصلة → توليد حزمة **Access Package** أو تنفيذ محو انتقائي مع استثناءات قانونية موثّقة.

### F4 | Redaction in Reports
تطبيق قواعد تنقيح على العروض/التصدير (M10/M14/M15) حسب الدور والنطاق.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS + Field-Level Security** للحقول الحساسة.
- **Key Management** منفصل لأعمدة مشفّرة (PII) مع تدوير مفاتيح دوري.
- **Tamper-evident Auditing** لكل تغييرات السياسات والتنفيذ (hash chain).
- **Dual Control** لعمليات المحو الجماعي (يتطلب موافَقتين).
- **Policy Exceptions** موثّقة بزمن محدد وموافقة مسؤول الامتثال.
- **Localization/Regulatory Profiles**: قوالب سياسات حسب القطاع/الدولة، مع تنبيهات عدم التوافق.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Retention Execution Safety**
  تشغيل **Dry-Run** يُظهر عدد السجلات المتأثرة، ولا يسمح بالحذف دون موافقة مالك البيانات + عدم وجود Legal Hold نشط.
- **AC-02 | Legal Hold Precedence**
  عند وجود Legal Hold على سجل، تُمنع عمليات الحذف/الطمس وتُسجّل محاولة التنفيذ المرفوضة.
- **AC-03 | DSR Timelines**
  تلبية طلب وصول (Access) خلال ≤ **15 يومًا** وطلب محو خلال ≤ **30 يومًا** أو مبرّر تمديد.
- **AC-04 | Redaction Enforcement**
  التصدير عبر API/Reports يحترم قواعد التنقيح حسب الدور، وتُرفَض الطلبات المخالفة.
- **AC-05 | Audit Completeness**
  جميع عمليات المحو/التنقيح/الاحتفاظ تولّد سجلًا قابلًا للتدقيق مع `who/when/what/why`.

## 8) تحسينات خفيفة (Quick Wins)
- **Retention Starter Kits** لقوالب جاهزة (Incidents/Evidence/Phishing/Training).
- **DSR Wizard** موجّه بخطوات بديهية ومدد SLA مرئية.
- **One-Click Redact** في واجهات البحث/التقارير لحقل حساس محدد.
- **Policy Drift Alerts** عند اختلاف التطبيق الفعلي عن السياسة المعلنة.

## 9) KPIs
- **DSR SLA Compliance:** ≥ **95%** ضمن المهل.
- **Retention Execution Success:** ≥ **99%** jobs بلا أخطاء حرجة.
- **Redaction Coverage:** ≥ **98%** من التقارير/التصدير الحسّاس خاضعة لقواعد التنقيح.
- **Legal Hold Integrity:** 0 حالات حذف مخالفة أثناء التجميد.
- **Policy Drift Rate:** ≤ **1%** شهريًا.

## 10) قيود وافتراضات (Constraints & Assumptions)
- التنفيذ على **Google Cloud (KSA)** مع **per-DB isolation**.
- التكامل مع **M14** للـCatalog/Lineage وطبقة الـBenchmark المجهّلة.
- اعتماد **M15** لتفعيل واجهات DSR/Retention API وWebhooks.
- لا حذف لسجلات **audit_logs**، فقط أرشفة باردة بعد المدة القانونية.
- يبدأ التطبيق تدريجيًا على الجداول الأكثر حساسية ثم التوسعة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M15) ويركّز على الخصوصية والامتثال عبر المنصّة.



# M17 — Access Reviews & Certifications (IGA-Light)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تمكين مراجعات دورية ومنضبطة للوصول (**Access Reviews/Certifications**) عبر الأدوار والقدرات والمجموعات الحسّاسة، للتأكد من تطبيق مبدأ **Least Privilege**، خفض **Access Drift**، والامتثال لمتطلبات التدقيق.

## 2) نطاق الـMVP (Scope)
- **حملات مراجعة وصول** على مستوى: المستخدم، الدور، القدرة، القسم، الأصول الحسّاسة.
- **أنواع القرارات:** Approve / Revoke / Mitigate (مؤقت مع تاريخ انتهاء) / Reassign Owner.
- **نماذج المراجعين:** Line Manager, App Owner, Control Owner, Risk Owner.
- **Sampling & Scoping:** كامل أو عيّنة ذكية حسب المخاطر (High-Privilege، Dormant > 90d، توارث صلاحيات).
- **Evidence Capture:** لقطات قبل/بعد + سبب القرار + الأثر على RBAC.
- **التكاملات:** الاستفادة من RBAC (M1), Incident/Risk (M13), Warehouse (M14), Privacy (M16).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- Users/Roles/Capabilities من موديولات الهوية (M1).
- Signals: حوادث مرتبطة بالمستخدم/الدور (M13)، مؤشرات امتثال وثقافة (M3)، نشاط خامل.

### 3.2 Outputs
- **Access Changes** إلى `access_grants` (منح/سحب/انتهاء).
- **Review Evidence** إلى M10 (Reports/Evidence Packs).

### 3.3 APIs (M15)
- `POST /v1/access-reviews/campaigns` إنشاء حملة.
- `POST /v1/access-reviews/decisions` قرارات المراجعين.
- Webhooks: `access.review.created`, `access.review.completed`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **access_review_campaigns**: النطاق، نوع المراجع، نافذة الزمن، قواعد الاختيار.
- **access_review_items**: كيان المراجعة (user/role/capability/asset)، الحالة الحالية، جهة المراجعة.
- **access_review_decisions**: القرار، المبررات، المرفقات/الأدلة، الطابع الزمني.
- **access_grant_changes**: عمليات السحب/المنح الناتجة، حالة التنفيذ، مرجع القرار.
- **access_signals**: مؤشرات خطر (dormant, privileged, incident_linked).
- **audit_logs**: أثر تدقيقي كامل لكل خطوة.

## 5) التدفقات (Key Flows)
### F1 | Campaign Setup
مسؤول الامتثال يحدد النطاق والقواعد (مثلاً: جميع الأدوار الإدارية + المستخدمون الخاملون > 90 يومًا) → إنشاء عناصر المراجعة.

### F2 | Reviewer Assignment
توزيع العناصر على Line Managers أو App Owners حسب القاعدة.

### F3 | Decision & Enforcement
المراجع يقرّر → تُنشأ **access_grant_changes** → تنفَّذ بأمان (Idempotent) مع Rollback عند الفشل.

### F4 | Evidence & Reporting
توثيق القرارات وتوليد **Evidence Pack** تلقائي (M10).

### F5 | Drift Watch
إنشاء إشعارات تلقائية عند ارتفاع **Access Drift** أو تأخّر الإغلاق.

## 6) الحوكمة والأمن (Governance & Security)
- **Segregation of Duties:** لا يراجع المستخدم صلاحياته، وحظر المراجعة الذاتية.
- **RLS/Field-Level Security:** إظهار العناصر ضمن نطاق المراجع فقط.
- **Dual Control (اختياري):** لقرارات الحسّاسة يتطلب موافقتين.
- **SLA:** مهل افتراضية (7/14 يومًا) مع تصعيد (M8).
- **Tamper-evident Audit:** تجزئة قرارات المراجعة وربطها بسلسلة تدقيق.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Scope Correctness:** إنشاء عناصر المراجعة يتبع القواعد المحددة بدقة (عينات + قيود المخاطر).
- **AC-02 | Decision Integrity:** لا يمكن إتمام الحملة ما لم تُحسم ≥ **95%** من العناصر ضمن SLA.
- **AC-03 | Enforcement Safety:** تطبيق قرارات السحب/المنح يولّد **before/after snapshot** ويمكن التراجع خلال **24h**.
- **AC-04 | RLS Isolation:** المراجعون لا يرون سوى عناصر نطاقهم.
- **AC-05 | Evidence Pack:** عند إغلاق الحملة، يتوفر تقرير موقّع يتضمن القرارات والمبررات والتغييرات.
- **AC-06 | Drift Reduction:** انخفاض **Access Drift** بنسبة **≥ 20%** بعد حملتين فصليتين.

## 8) تحسينات خفيفة (Quick Wins)
- **One-click “Revoke Dormant > 180d”** مع مسار استثناءات.
- **Risk-Prioritized Queue**: ترتيب العناصر حسب شدة الإخطار.
- **Reviewer Hints** من M11 (AI) لاقتراح القرار بالمبررات.
- **Manager Digest** أسبوعي بالعناصر المتأخرة.

## 9) KPIs
- **Campaign Completion (on-time):** ≥ **90%**.
- **Drift Rate:** نسبة الصلاحيات غير المبرّرة إلى إجمالي المنح.
- **Dormant Privileged Accounts:** انخفاض شهري مستمر.
- **Mean Time to Enforce (MTTE):** ≤ **1 يوم** بعد القرار.
- **Re-grant Rate (30d):** ≤ **5%** (قياس جودة القرارات).

## 10) قيود وافتراضات (Constraints & Assumptions)
- الاعتماد على RBAC/Capabilities من M1، والتقارير من M10، والبيانات من M14.
- التنفيذ على **Google Cloud (KSA)** مع **per-DB isolation**.
- البدء بـ **Review by Manager/App Owner** قبل التوسّع إلى Certifier متعدد الطبقات.
- لا مراجعة للأذونات عبر أنظمة خارجية في الـMVP إلا عبر Imports/Views عند الحاجة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M16) ويركّز على ضبط الصلاحيات وتقليل الانحراف مع أدلة تدقيقية كاملة.



# M18 — Control Assurance & Continuous Testing (CEA)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
بناء طبقة **Assurance** لقياس فعالية الضوابط (Controls) بشكل مستمر عبر **اختبارات دورية/آلية** وربط النتائج بالمخاطر والحوادث ومؤشرات الثقافة؛ بهدف خفض المخاطر التشغيلية ورفع نضج الامتثال وتحسين الأولويات التنفيذية.

## 2) نطاق الـMVP (Scope)
- **Control Library Mapping:** استيراد/تعريف ضوابط NCA/ISO وربطها بالمخاطر والأصول والمالكين.
- **Test Catalog:** أنواع اختبارات خفيفة (Design, Operating, Evidence-only, Automated Signal).
- **Sampling & Scheduling:** جداول شهرية/ربع سنوية + عينات مبنية على المخاطر.
- **Finding Lifecycle:** فتح ملاحظة (Finding) بدرجات شدة، توصية، وخطة معالجة (Treatment).
- **Evidence Attachments:** ربط أدلة الاختبارات بـ M10 وإضافة توقيع زمني وتجزئة.
- **Feedback Loops:** تغذية النتائج إلى M13 (Risk) وM14 (Warehouse) وM11 (AI Insights).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- مكتبة الضوابط، ربط المخاطر (M13)، مؤشرات الثقافة (M3)، بيانات الحملات/التصيد (M2/M9).

### 3.2 Automated Signals (اختياري)
- Hooks من SIEM/IdP/Email/Slack لقياس مؤشرات التبني والامتثال.

### 3.3 APIs (M15)
- `POST /v1/controls/tests/run` تشغيل اختبار.
- `POST /v1/controls/findings` تسجيل ملاحظة.
- Webhooks: `control.test.completed`, `control.finding.opened`, `control.finding.closed`.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **control_library**: التعريف، الإطار، المالك، نطاق التطبيق.
- **control_tests**: قالب الاختبار، النوع، التكرار، معايير النجاح (AC).
- **control_test_runs**: تنفيذات فعلية بنتيجة (pass/fail/partial), وقت التشغيل، المنفّذ.
- **control_evidence**: الروابط/الملفات، التجزئة، التوقيع الزمني.
- **control_findings**: الشدة، السبب الجذري، الحالة، التوصيات.
- **control_treatments**: المهام والمواعيد والمسؤولين.
- **kpi_snapshots**: تغذية مؤشرات فعالية الضوابط.
- **audit_logs**: أثر تدقيقي كامل.

## 5) التدفقات (Key Flows)
### F1 | Test Scheduling
جدولة/تشغيل تلقائي → جمع أدلة → تقييم المعيار → نتيجة.

### F2 | Finding Management
فشل اختبار → فتح Finding → تعيين مالك → خطة معالجة + مواعيد + تصعيد (M8).

### F3 | Auto-Closure
نجاح متكرر لعدد N من الدورات يغلق Finding منخفض الشدة تلقائيًا مع موافقة.

### F4 | Reporting
لوحات فعالية لكل إطار/قسم + تصدير Evidence Pack (M10).

### F5 | Risk Feedback
نتائج الاختبار تعدّل **Control Effectiveness** وتؤثر على **Residual Risk** (M13).

## 6) الحوكمة والأمن (Governance & Security)
- **Segregation of Duties:** منفّذ الاختبار ≠ مالك الضابط عند الإمكان.
- **RLS:** عزل حسب القسم/نطاق الضابط.
- **Tamper-evident Evidence:** تجزئة/ختم زمني + سلسلة تجزئة.
- **Quality Gates:** لا يُغلق Finding دون دليل كافٍ وReview ثانٍ للـHigh.
- **Retention:** أدلة الاختبارات تتبع سياسات M16.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Test Run Integrity:** كل تشغيل اختبار يسجّل دليلاً وقرارًا واضحًا مع مبرر.
- **AC-02 | SLA on Findings:** ≥ **90%** من ملاحظات High تُغلق خلال **30 يومًا** أو لها تمديد مبرر.
- **AC-03 | Evidence Verifiability:** أي ملف دليل قابل للتحقق عبر قيمة التجزئة وتاريخ الإضافة.
- **AC-04 | Risk Linkage:** فتح Finding يرتبط تلقائيًا بالمخاطر/الضوابط المعنية ويظهر أثره في لوحة المخاطر.
- **AC-05 | Automation Safety:** الاختبارات المؤتمتة تعمل بصلاحيات محدودة ومحدّدات معدل.
- **AC-06 | BI Consistency:** مؤشرات فعالية الضوابط في BI تأتي من **Semantic Layer** (M14).

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Test Kits:** حِزم اختبارات جاهزة لأكثر الضوابط شيوعًا (Email Security, Phishing, Policy Acks).
- **Evidence Hints:** قوالب أدلة (لقطات، تقارير CSV) لكل نوع اختبار.
- **Auto-Suggest RCA:** اقتراح سبب جذري أولي عبر M11 عند تكرار الفشل.
- **Manager Digest:** ملخص أسبوعي بالملاحظات الحرجة المفتوحة.

## 9) KPIs
- **Control Pass Rate (Critical):** ≥ **85%** ربع سنوي.
- **Finding Closure On-time:** ≥ **90%** ضمن SLA.
- **Repeat Findings (90d):** ≤ **5%** لنفس الضابط.
- **Coverage:** ≥ **70%** من الضوابط ذات المخاطر العالية لديها اختبارات فعّالة.
- **MTTA (Finding):** ≤ **3 أيام** لتعيين مالك وخطة معالجة.

## 10) قيود وافتراضات (Constraints & Assumptions)
- التنفيذ على **Google Cloud (KSA)** بعزل **per-DB**.
- لا تكامل SIEM كامل في الـMVP؛ إشارات خفيفة فقط.
- الاعتماد على M10/M14 للتقارير والقياس، وM13 لتأثير المخاطر، وM16 للاحتفاظ/الخصوصية.
- بدءًا باختبارات تشغيلية بسيطة قبل المؤتمتة العميقة.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M17) ويركّز على قياس فعالية الضوابط والأتمتة الآمنة.



# M19 — Executive Governance & Board Reporting (EGRC Alignment)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-executive-layer)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
توفير طبقة حوكمة تنفيذية تربط أداء **الثقافة والتوعية السيبرانية** بنتائج الأعمال والمخاطر، عبر **لوحات وتقارير مجلس الإدارة** موحّدة، وسردٍ إداري (Narratives) قابل للتنفيذ، متوافق مع نماذج EGRC وبروفايلات الشهية للمخاطر (Risk Appetite Profiles).

## 2) نطاق الـMVP (Scope)
- **Executive Dashboards:** نظرة 1–3 صفحات (Quarterly/Monthly) تربط: Culture Index, Completion, Phish-prone%, Incidents, Control Effectiveness, Access Drift, DSR SLA.
- **Board Report Pack:** قالب تقرير مجلس جاهز (PDF/MD) مع ملخّص المخاطر العُليا، اتجاهات، توصيات، وخارطة قرارات.
- **Risk Appetite View:** حالة الالتزام بكل حدّ شهية (Green/Amber/Red) وتأثيره على الأولويات.
- **Narratives & Talking Points:** توليد سرد تنفيذي مختصر (Auto-generated via M11) قابل للتدقيق اليدوي.
- **Action Register:** تتبّع قرارات المجلس/اللجان ومسؤوليات التنفيذ (Owner, Due Date, Status).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- KPIs من M3، حملات M2/M9، أدلة وتقارير M10، مستودع البيانات M14، المخاطر/الحوادث M13، الخصوصية/الاحتفاظ M16، المراجعات M17، اختبارات الضوابط M18.

### 3.2 APIs (M15)
- `GET /v1/exec/kpis` لالتقاط المؤشرات الموحدة.
- `POST /v1/reports/board-pack` توليد حزمة مجلس (Async Job).
- Webhooks: `board.pack.ready`, `exec.action.updated`.

### 3.3 Data Contracts
- اتساق دلالي عبر **Semantic Layer** (M14) مع طوابع زمنية وخانات مصدر.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + Marts تنفيذية للعرض فقط.

- **exec_kpis**: لقطة مجمّعة للمؤشرات الأساسية مع الأهداف/الحدود.
- **exec_rap_status**: حالة Risk Appetite لكل بُعد/مجال.
- **exec_board_actions**: سجل قرارات واجتماعات، مالك، تاريخ مستهدف، حالة.
- **exec_narratives**: نصوص سردية مُنشأة + نسخة مُراجعة بشرية.
- **exec_report_runs**: طلبات توليد التقارير، المخرجات، روابط الأدلة.
- **audit_logs**: أثر تدقيقي كامل لإصدارات التقارير والتعديلات.

## 5) التدفقات (Key Flows)
### F1 | KPI Consolidation
سحب KPIs من M14 → تحقق جودة → تجهيز عرض تنفيذي.

### F2 | Board Pack Generation
اختيار الفترة والنطاق → إنشاء PDF/MD مع جداول/رسوم → إرفاق روابط الأدلة (M10).

### F3 | Narrative Draft
توليد سرد آلي (M11) → مراجعة وتحرير → غلق الإصدار.

### F4 | Decision Tracking
تسجيل قرارات المجلس → إنشاء Actions مع ملاك ومواعيد → متابعة والتصعيد (M8).

### F5 | Appetite Breaches
كشف أي تجاوز → توصية تلقائية (Treatment/Control Test/Training Burst).

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** الوصول للّوحات/التقارير مقصور على الأدوار التنفيذية/اللجان.
- **PII Minimization:** عرض مجمّع (Aggregated) وخالٍ من PII افتراضيًا.
- **Watermark & Integrity:** ختم تقارير المجلس بطابع Integrity وCorrelation-ID.
- **Versioning:** كل إصدار تقرير يُؤرشف بإصدار فريد وقابل للاسترجاع.
- **Approval Workflow:** اعتماد إصدار التقرير قبل النشر الخارجي/المشاركة.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Consistent KPIs:** كل مؤشّر في التقرير يأتي من **Semantic Layer** وبنفس التعريف عبر اللوحات والتقارير.
- **AC-02 | Board Pack Ready:** إنشاء حزمة مجلس مكتملة ≤ **10 دقائق** مع روابط أدلة صالحة (TTL ≥ 15m) وأثر تدقيقي.
- **AC-03 | Appetite Signals:** أي تجاوز لحدّ شهية يُبرز بعلامة واضحة ويولد توصية آلية واحدة على الأقل.
- **AC-04 | Action Traceability:** 100% من قرارات المجلس لديها **Owner** و**Due Date** وتتبع حالة.
- **AC-05 | PII Guardrails:** التقارير التنفيذية خالية من PII ما لم يُصرّح دورياً وبحد أدنى.

## 8) تحسينات خفيفة (Quick Wins)
- **One-Page Executive Snapshot** قابل للطباعة والمشاركة.
- **Quarterly Trends Strip**: شريط اتجاهات مختصر (12 شهرًا) لكل KPI أساسي.
- **What-Changed Indicator** بين إصدارين متتالين.
- **Scenario Cards**: بطاقات “ماذا لو” (رفع/خفض شهية، زيادة تدريب، اختبار ضوابط إضافي).

## 9) KPIs (Executive Layer)
- **Report Timeliness:** نسبة التقارير المسلّمة ضمن الوقت ≥ **95%**.
- **Action Closure (on-time):** ≥ **90%** خلال الربع.
- **Appetite Breach Mean-Time-to-Action:** ≤ **5 أيام**.
- **Narrative Approval Cycle:** ≤ **2 أيام** للإصدار.
- **Stakeholder Adoption:** ≥ **80%** من اللجنة تفتح اللوحة شهريًا.

## 10) قيود وافتراضات (Constraints & Assumptions)
- الاعتماد على **M14** للمجاميع والدلالات، و**M10** للأدلة، و**M11** للسرد الآلي.
- النشر على **Google Cloud (KSA)** مع **per-DB isolation**.
- التصدير الافتراضي PDF/MD؛ دعم PowerPoint لاحقًا إن لزم.
- لا مشاركة خارجية إلا وفق سياسات الخصوصية M16 وواجهات M15.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M18)، ويركّز على الحوكمة التنفيذية وربط المؤشرات بقرارات المجلس.


# M20 — Vendor Risk & Awareness Exchange (Third Parties)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria--أمثلة)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis-vendor--awareness)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
إدارة مخاطر المورّدين (Third Parties) وربطها مباشرةً بثقافة الأمن السيبراني والامتثال عبر: سجل مورّدين موحّد، تقييمات خفيفة للمخاطر/الضوابط، تتبّع التزامات التوعية (Awareness Obligations)، تبادل أدلة (Evidence Exchange)، وتنبيهات تغيّر المخاطر—مع تكامل وثيق مع M13 (Incident↔Risk) وM14 (Warehouse) وM15 (APIs/Webhooks).

## 2) نطاق الـMVP (Scope)
- **Vendor Registry:** ملفات مورّدين + تصنيف حرجية (Criticality) + مجالات الخدمة + بيانات التعاقد الأساسية.
- **Light VRM Assessments:** استبيانات قصيرة حسب الفئة (Email Security, Awareness, Access, Incident Handling).
- **Obligations Tracking:** التزامات تعاقدية: تدريب موظفي المورّد، إقرار سياسات، زمن إشعار الحوادث (X ساعات).
- **Evidence Exchange:** رفع/طلب أدلة (تقارير تدريب، نتائج تصيّد، شهادات، سياسات).
- **Risk Scoring:** درجة مخاطرة المورد (Inherent/Residual) + عوامل: نتائج تقييم/حوادث/أدلة مفقودة.
- **Awareness Link:** ربط مؤشرات المورّد بثقافة المؤسسة (Culture Index Extensions).

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inbound
- Imports CSV/JSON للمورّدين والعقود.
- API (M15): `POST /v1/vendors`, `/v1/vendors/assessments`, `/v1/vendors/evidence`.

### 3.2 Outbound/Webhooks
- `vendor.assessment.requested`, `vendor.evidence.submitted`, `vendor.breach.notified`, `vendor.risk.updated`.

### 3.3 Data Contracts
- **Vendor**: `{id, name, tier, criticality, services[], contact, contract_refs[], dpa?}`
- **Assessment**: `{template_id, status, score, gaps[], due_date}`
- **Obligation**: `{type, metric, target, due, status}`
- **Evidence**: `{type, file_ref/hash, issued_at, expires_at, verifier}`

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **vendors**: تعريف المورّد، التصنيف، نقاط الاتصال، القطاعات.
- **vendor_contracts**: معلومات أساسية، SLAs، بنود أمن/خصوصية.
- **vendor_obligations**: التزامات التوعية/الأمن مع الأهداف والمواعيد.
- **vendor_assessment_templates**: قوالب مختصرة حسب الفئة.
- **vendor_assessments**: نتائج الاستبيانات، الدرجات، الفجوات.
- **vendor_evidence**: أدلة مرفوعة، تجزئة/ختم زمني.
- **vendor_risk_scores**: inherent/residual + عوامل.
- **vendor_incident_links**: ربط حوادث المورد بـ M13.
- **kpi_snapshots**: مؤشرات أداء الموردين/الالتزامات.
- **audit_logs**: أثر تدقيقي كامل.

## 5) التدفقات (Key Flows)
### F1 | Onboard Vendor
إضافة مورّد → تصنيف Criticality/Tier → تعيين التزامات/قالب تقييم.

### F2 | Assessment
إرسال استبيان مختصر → استلام نتائج/أدلة → حساب درجة المخاطر وتوليد فجوات (Gaps).

### F3 | Evidence Exchange
طلب أدلة (تدريب، تقارير تصيّد) → رفع وتحقق توقيع/تجزئة → قبول/رفض.

### F4 | Incident Notification
إشعار من المورّد (Webhook/API/Email) → فتح رابط Incident في M13 + تحديث المخاطر + تنبيه تنفيذي.

### F5 | Obligation Monitoring
تتبّع حالة التزامات الوعي (مثلاً ≥90% تدريب سنوي) مع تصعيد آلي (M8) عند التعثر.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** فصل بيانات المورّدين لكل عميل وأدوار محددة (Procurement/Legal/Security).
- **Third-Party Access:** بوابة خارجية آمنة (optional) أو تبادل عبر API موقّع + روابط رفع قصيرة الأجل.
- **PII/Confidential Handling:** تنقيح تلقائي للحقول الحساسة في المستندات؛ الالتزام بـ M16 (Retention/Legal Holds).
- **Tamper-evident Evidence:** تجزئة/ختم زمني وسلسلة تجزئة لمستندات المورد.
- **Conflict & Independence:** منع المورد من اعتماد أدلته دون مراجعة داخلية.

## 7) معايير القبول (Acceptance Criteria — أمثلة)
- **AC-01 | Assessment Turnaround:** ≥ **90%** من الاستبيانات تُختم خلال ≤ **14 يومًا** من الإرسال.
- **AC-02 | Evidence Verifiability:** كل دليل يحتوي `hash + timestamp` وقابل للتحقق.
- **AC-03 | Risk Update:** تغيير شديد (High Gap/Incident) يحدّث **Residual Score** ويُصدر تنبيهًا خلال ≤ **1h**.
- **AC-04 | Obligation Compliance:** يمكن إثبات تحقيق التزامات الوعي (نسبة تدريب/إقرارات) أو يُرفع تصعيد تلقائي.
- **AC-05 | Incident Linkage:** حوادث المورد تُسجّل وتُربط بـ M13 مع أثر على شهية المخاطر (M19 view).
- **AC-06 | BI Consistency:** مؤشرات المورد تظهر في لوحات M14/M19 من نفس **Semantic Layer**.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Vendor Kits:** قوالب تقييم/التزامات جاهزة حسب الفئة (SaaS Email, MSP, SOC-as-a-Service).
- **One-Click Reminder:** تذكير آلي للمورّدين المتأخرين مع رابط رفع آمن.
- **Score Explainability:** بطاقة توضح أسباب الدرجة وتأثير كل عامل.
- **Shared Evidence Vault:** نافذة مشاركة آمنة تنتهي صلاحيتها تلقائيًا.

## 9) KPIs (Vendor & Awareness)
- **Assessment Completion (on-time):** ≥ **90%**.
- **Evidence Freshness:** ≥ **95%** من الأدلة ضمن فترة الصلاحية.
- **Residual Risk Reduction (Q/Q):** تحسّن ≥ **10%** للمورّدين الحرجين.
- **Obligation Adherence:** ≥ **90%** للالتزامات الحرجة (تدريب/إقرارات).
- **Vendor Incident MTTA:** ≤ **4 ساعات** للاستلام والتسجيل.

## 10) قيود وافتراضات (Constraints & Assumptions)
- لا تكامل عميق GRC خارجي في الـMVP؛ يتم عبر Imports/APIs (M15).
- بوابة المورّدين اختيارية في البداية؛ يمكن الاكتفاء بروابط رفع/ويبهوك.
- تشغيل على **Google Cloud (KSA)** مع **per-DB isolation**.
- احترام سياسات الخصوصية والاحتفاظ M16، وربط المخاطر M13، والتقارير M10/M14/M19.

---

**ملحوظة تنفيذية:** هذا الملف يلتزم بشخصية ودور المساعد (Senior Systems/Product Analyst) ونمط العمل: مراجعة → اعتماد → تصدير Markdown. وهو امتداد مباشر للموديولات السابقة (M1–M19) ويركّز على مورّدين الطرف الثالث والتكامل مع حلقات الوعي والمخاطر.



# M21 — Compliance Calendar & Audit Readiness
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض](#1-الغرض)
2. [نطاق الـMVP](#2-نطاق-الـmvp)
3. [نموذج البيانات](#3-نموذج-البيانات-موجز)
4. [التدفقات](#4-التدفقات)
5. [معايير القبول (AC)](#5-معايير-القبول-ac)
6. [المؤشرات (KPIs)](#6-المؤشرات-kpis)
7. [قيود/افتراضات](#7-قيودافتراضات)

---

## 1) الغرض
تقويم امتثال مركزي + **Pre-Audit Snapshot** يجمّع تلقائياً الجاهزية للتدقيق ويربط العناصر بالأدلة والاختبارات ومراجعات الوصول.

## 2) نطاق الـMVP
- **Calendar UI:** حالات (Ready / At-Risk / Overdue) مع فلاتر (الإطار، القسم، المالك، النوع).
- **Pre-Audit Snapshot:** توليد حزمة جاهزية (PDF/MD) بفهرس أدلة وروابط **Evidence Packs**.
- **Checklist Engine:** عناصر قابلة للتخصيص مرتبطة بـ M10/M17/M18/M14.
- **تنبيهات وتصعيد:** عبر M8 للمتأخرات.

## 3) نموذج البيانات (موجز)
- `compliance_calendar_items(id, type, framework, owner_id, org_unit, due_at, status, evidence_ref, last_verified_at, sla_days)`
- `audit_checklists(id, name, framework, items[])`
- `audit_snapshots(id, period, scope, status, artifact_url, created_at, created_by)`

## 4) التدفقات
- **F1 تقويم:** توليد/تحديث تلقائي من الـSemantic Layer (M14) + إدخالات يدوية.
- **F2 Snapshot:** مهمة توليد تجمع الأدلة وتُصدر مخرجات موقّعة للتحميل.
- **F3 تصعيد:** `Overdue > 48h` يصعد للمالك + المدير + التنفيذيين.

## 5) معايير القبول (AC)
- كل عنصر تقويم يحتوي **Owner/Due/Evidence/Last-Verified**.
- إنشاء Snapshot مكتمل ≤ **10 دقائق** مع فهرس أدلة قابل للتتبّع.
- اتساق المؤشرات مع **M14** باختبار مقارنة.
- احترام **RLS/RBAC** والتصعيد الآلي.

## 6) المؤشرات (KPIs)
- **Audit Snapshot Time:** ≤ **10m**
- **Overdue:** انخفاض أسبوعياً
- **Evidence Freshness:** ≥ **95%**
- **Coverage:** ≥ **90%** لعناصر الإطار المستهدف

## 7) قيود/افتراضات
مصدر المؤشرات الوحيد **M14** • لا مشاركة خارجية دون سياسات **M16** • تشغيل على **GCP (KSA)** مع **per-DB isolation**.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمثّل الأساس لتفعيل الجاهزية للتدقيق وربطها تلقائيًا بالأدلة والاختبارات.



# M22 — Training Experience 2.0 (Role/Risk-based Micro-Learning)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تقديم تجربة تدريب **مُشخّصة حسب الدور والمخاطر** مع **Micro-learning** و**Micro-quiz متكيفة**، بهدف رفع معدلات الإكمال، تعزيز الاحتفاظ بالمعرفة، وتقليل السلوكيات عالية المخاطر (Phish-prone, Misconfig, Shadow-IT).

## 2) نطاق الـMVP (Scope)
- **Role/Risk Journeys:** رحلات تدريب قصيرة (2–5 دقائق/وحدة) مبنية على الدور (HR/Legal/IT/Exec) ومستوى الخطر.
- **Adaptive Micro-quiz:** أسئلة متدرجة الصعوبة مع Feedback فوري وروابط تعلّم مصغّرة.
- **Content Bundles:** حزم محتوى من **M4** (Draft → Published) مع إصدارات ولغات (AR/EN).
- **Nudges & Reminders:** تذكيرات ذكية عبر Email/Slack/M365 (تكامل M6/M8).
- **In-Product Coaching:** بطاقات مساعدة سياقية من **M11** (Hints/Explainers).
- **Accessibility & RTL:** دعم كامل لـ RTL وWCAG أساسيات.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- Signals من M3 (Culture Index)، مخاطر من M13، ملفات تعريف المستخدمين من M1/M12، محتوى من M4.

### 3.2 APIs (مع M15)
- `POST /v1/training/journeys` إنشاء رحلة.
- `POST /v1/training/assignments` إسناد.
- `POST /v1/training/progress` تحديث تقدّم/نتيجة.
- Webhooks: `training.assignment.created`, `training.progress.updated`, `training.completed`.

### 3.3 Outbound Data → M14
- لقطات KPIs (completion, TTP90, score, retention).

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **training_journeys**: `{id, name, role, risk_level, version, locale, status}`
- **training_modules**: `{id, journey_id, type(video/html/quiz), duration, order}`
- **training_assignments**: `{id, user_id, journey_id, due_at, status}`
- **training_progress**: `{assignment_id, module_id, started_at, completed_at, score}`
- **training_quiz_items**: `{id, module_id, difficulty, tags[], correct_answer}`
- **training_nudges**: `{id, assignment_id, channel, sent_at, result}`
- **kpi_snapshots** (تكامل M14): مؤشرات التجميع.

## 5) التدفقات (Key Flows)
### F1 | Journey Build
اختيار دور/مستوى خطر → اقتراح تلقائي للمحتوى من M4 + ضبط اللغة/المدد.

### F2 | Assignment
إسناد تلقائي حسب الدور/الوحدة التنظيمية/مستوى الخطر + Due/SLA.

### F3 | Adaptive Quiz
زيادة/خفض صعوبة الأسئلة حسب الأداء مع Feedback فوري وروابط تعلّم.

### F4 | Nudges
تذكيرات ذكية عبر M8 (تواتر يعتمد على القرب من الموعد النهائي).

### F5 | Reporting
رفع مؤشرات إلى M14 وظهور أثرها في M3/M19.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** عرض التقدّم ضمن نطاق المستأجر + وحدة منظمة/مدير سطر.
- **PII Minimization:** تقارير تنفيذية مجمّعة افتراضيًا (بدون أسماء إلا للصلاحيات المصرّح بها).
- **Localization QA:** مراجعة بشرية للمحتوى الحساس قانونيًا (Legal/HR) قبل النشر.
- **Retention:** سجلات التدريب تتبع مصفوفة M16.
- **Audit:** كل تغيير على Journeys/Assignments مسجّل في audit_logs.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Personalization:** عند اختيار دور ومخاطر، تُبنى Journey تلقائيًا بقائمة Modules مناسبة ≥ 80% تطابق توصيات القالب.
- **AC-02 | Completion Lift:** على عيّنة تجريبية، زيادة الإكمال **≥ 10%** خلال 60 يومًا مقابل خط أساس.
- **AC-03 | TTP90:** تقليل **TTP90** بواقع **≥ 15%** مقارنةً بالرحلات القديمة.
- **AC-04 | Adaptive Quiz Integrity:** يحفظ النظام سجل مستوى الصعوبة ومسار الأسئلة لكل مستخدم.
- **AC-05 | Accessibility:** اجتياز فحوص WCAG الأساسية (تباين/بدائل صور/لوحة مفاتيح).
- **AC-06 | BI Consistency:** تطابق مؤشرات M22 مع Semantic Layer (M14) بنسبة 100%.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Role Packs:** قوالب جاهزة (Exec, Finance, IT, HR, Legal) AR/EN.
- **Micro-Bursts:** وحدات 90–120 ثانية تُحقن كعلاج فوري بعد فشل Quiz.
- **Just-in-Time Cards:** من **M12** عند Onboarding/Transfer/Promotion.
- **Manager Digest:** رسالة أسبوعية بملخص الإكمال والتأخر لكل فريق.

## 9) KPIs
- **Completion Rate (role/risk):** هدف ≥ **85%**.
- **TTP90:** انخفاض ≥ **15%**.
- **Average Quiz Score:** ≥ **80%** للوحدات الأساسية.
- **Nudge Effectiveness:** ≥ **20%** رفع في الإكمال لمن تلقوا Nudges.
- **Content Freshness:** ≥ **90%** من المحتوى محدّث خلال 12 شهرًا.

## 10) قيود وافتراضات
- الاعتماد على محتوى M4، هوية M1/M12، مؤشرات M3، تكاملات M6، تقارير M14/M19.
- تنفيذ أولي على الويب (Mobile-friendly)، تطبيقات أصلية لاحقًا.
- مسارات **A/B** المتقدمة ستُكمّل عبر **M23 Simulation Studio**.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمثّل الأساس لتشغيل تجربة تدريب مُشخصنة قائمة على الدور/المخاطر.



# M23 — Simulation Studio (Phishing/Awareness + A/B)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
إنشاء **استوديو قوالب محاكاة** لحملات التصيّد/التوعية مع **A/B Testing**، يمكّن الفرق من بناء قوالب غنيّة متعددة القنوات (Email/M365/Slack) وقياس التأثير بدقة لتحسين **Phish-prone%** ورفع جودة المحتوى التدريبي (M22).

## 2) نطاق الـMVP (Scope)
- **Template Studio:** محرّر بصري مع Blocks (Subject, Body, CTA, Landing, Attachment, Sender Profile).
- **Variants & A/B:** إنشاء متغيرات A/B بنِسَب توزيع + مقاييس مقارنة.
- **Channel Support:** Email أساسي + Hooks لـ M365/Slack (Pilot وفق M6).
- **Safety & Compliance Mode:** علامات واضحة + بيئة Sandboxed للروابط والمرفقات.
- **Library & Tagging:** مكتبة قوالب مع وسوم (brand, sector, ttp, language AR/EN).
- **Campaign Push:** نشر القوالب إلى M2/M9 مع تتبّع نتائج متكامل.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- من **M4** محتوى/أصول، من **M22** خرائط رحلات/مواضيع، من **M3** مؤشرات الثقافة، من **M13** سيناريوهات مخاطر.

### 3.2 APIs (M15)
- `POST /v1/studio/templates` إنشاء/تحديث قالب.
- `POST /v1/studio/templates/<built-in function id>/variants` إدارة A/B.
- `POST /v1/studio/publish` نشر إلى حملات (M2/M9).
- Webhooks: `studio.template.published`, `studio.ab.results.ready`.

### 3.3 Outbound → M14
- لقطات نتائج A/B (open/click/report/submit/form) + أفضل متغير.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل.

- **studio_templates**: `{id, name, channel, locale, tags[], status, version}`
- **studio_template_blocks**: `{id, template_id, type, content, order}`
- **studio_variants**: `{id, template_id, label, split_pct, hypothesis}`
- **studio_ab_runs**: `{id, template_id, variant_ids[], started_at, ended_at}`
- **studio_ab_metrics**: `{run_id, variant_id, delivered, opened, clicked, reported, converted}`
- **studio_publish_links**: `{template_id, campaign_id, published_by, published_at}`

## 5) التدفقات (Key Flows)
### F1 | Build
إنشاء قالب → إضافة Blocks → إعداد اللغات/العلامات.

### F2 | A/B Setup
إنشاء متغيرات مع نسب توزيع + فرضية لكل متغير.

### F3 | Publish
نشر إلى M2/M9 → تكوين الجمهور/المواعيد.

### F4 | Measure
جمع نتائج A/B تلقائيًا → حساب المقاييس وتحليل الدلالة البسيط.

### F5 | Promote Winner
ترقية المتغير الفائز تلقائيًا أو حسب موافقة إلى القالب الافتراضي.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS:** عزل القوالب لكل مستأجر مع أدوار (Creator/Reviewer/Publisher).
- **Brand Safety:** قواعد لمنع محاكاة حساسة غير مصرح بها.
- **PII Guardrails:** عدم حقن بيانات فعلية في نماذج الهبوط.
- **Audit Logs:** لكل إنشاء/تعديل/نشر/حذف.
- **Retention:** أرشفة نتائج A/B وفق مصفوفة M16.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | A/B Integrity:** توزيع حقيقي يطابق `split_pct` ± 2% لكل متغير.
- **AC-02 | Metrics:** إتاحة مقاييس (delivered/open/click/report/convert) لكل متغير مع فترة وتجميعة.
- **AC-03 | Winner Promotion:** زر ترقية المتغير الفائز يظهر بعد اكتمال عتبة العينة (min N) أو زمن الحد الأدنى.
- **AC-04 | Publishing Safety:** لا نشر بدون مراجعة Reviewer لدور Publisher المصرّح.
- **AC-05 | Multilingual:** دعم AR/EN في القوالب والصفحات المرتبطة.
- **AC-06 | BI Consistency:** نتائج A/B متاحة في M14 ومتطابقة مع لوحات M19.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Packs:** حِزم قوالب حسب القطاع (Finance, Legal, Healthcare, Education).  
- **Subject Line Generator:** اقتراحات من M11 مع تقييم احتمالية الفتح.  
- **CTA Analyzer:** تلميحات لتحسين نسب التحويل.  
- **One-click Clone:** استنساخ قالب/حملة كأساس لتجربة جديدة.

## 9) KPIs
- **Campaign Throughput:** مضاعفة الإنتاجية ≥ **2x** خلال 60 يوم.  
- **Phish-prone% Accuracy:** تحسّن دقة القياس عبر A/B.  
- **Winner Adoption Rate:** ≥ **80%** من الحملات تستخدم متغيرًا فائزًا.  
- **Time-to-Publish:** ≤ **15 دقيقة** من إنشاء القالب إلى جاهزية النشر.

## 10) قيود وافتراضات
- القناة الأساسية Email؛ M365/Slack Pilot وفق جاهزية M6.  
- تحليلات دلالة مبسطة (z-test/chi-square) في المرحلة الأولى.  
- التنفيذ على الويب مع RTL وWCAG؛ دعم الأجهزة المحمولة أساسي.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويكمل M22 بتحسين تصميم التجارب وقياس التأثير بدقة عبر A/B.



# M24 — Analytics Self-Service & Explorations (Semantic Layer)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
تمكين الفرق غير التقنية من التحليل الذاتي على طبقة **Semantic Layer** (M14) عبر **Explorations** جاهزة وحفظ/مشاركة آمنة، مع اتساق كامل للمقاييس مع تقارير المجلس (M19).

## 2) نطاق الـMVP (Scope)
- **Explorations جاهزة (5 عدسات):** Culture, Campaigns, Phishing, Incidents, Controls.
- **Builder مبسّط:** اختيار المقاييس/الأبعاد، فلاتر، تجميعات، حفظ الاستعلام.
- **مشاركة آمنة:** مشاركة الاستكشاف مع أدوار محددة (Viewer/Manager/Exec).
- **Data Quality Gates:** تنبيهات Freshness/Nulls/Duplicates على جداول KPIs.
- **Exports:** CSV/MD (بدون PII افتراضيًا) وروابط مؤقتة.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- مستودع البيانات + Semantic Views من **M14**، مؤشرات من M3/M10/M18/M17.

### 3.2 APIs (M15)
- `POST /v1/analytics/explorations` إنشاء/تعديل.
- `POST /v1/analytics/explorations/run` تشغيل.
- `POST /v1/analytics/explorations/share` مشاركة.
- Webhooks: `analytics.exploration.shared`, `analytics.dq.alert`.

### 3.3 Outbound → M19
- لقطات KPIs/Charts للتقارير التنفيذية.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + Views دلالية للقراءة فقط.

- **analytics_explorations** `{id, title, owner_id, scope, definition(json), created_at, updated_at}`
- **analytics_shares** `{exploration_id, role, org_unit?, expires_at}`
- **analytics_runs** `{id, exploration_id, started_at, finished_at, row_count, status}`
- **dq_alerts** `{id, source_table, type, detected_at, severity, resolved_at}`

## 5) التدفقات (Key Flows)
### F1 | Build & Save
اختيار عدسة → إضافة مقاييس/أبعاد/فلاتر → حفظ.

### F2 | Run & Visualize
تنفيذ سريع مع Paging وحدود حجم آمنة.

### F3 | Share
مشاركة مع دور/فريق، صلاحيات قراءة فقط.

### F4 | Export
تصدير CSV/MD بدون PII افتراضيًا.

### F5 | DQ Alerts
رصد Freshness/Nulls وإشعارات للمالكين.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS/RBAC:** تطبيق كامل على الاستكشافات والنتائج.
- **PII Redaction:** افتراضيًا بلا حقول حساسة؛ يحتاج صلاحية خاصة لرفع الحساسية.
- **Rate Limits & Timeouts:** حماية من الاستعلامات الثقيلة.
- **Auditability:** كل Run/Share/Export مسجّل في audit_logs.
- **Lineage:** مرجع الجدول/القياس إلى Semantic Definition (Appendices-B/S).

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Consistency:** تطابق 100% لتعريفات KPIs مع Semantic Layer عبر اختبار مرجعي.
- **AC-02 | RLS:** نتائج الاستكشاف لا تُظهر بيانات خارج نطاق الدور/الوحدة.
- **AC-03 | Performance:** P95 لتنفيذ الاستكشاف ≤ **2.5s** على عينات قياسية، مع حدود صفوف افتراضية.
- **AC-04 | DQ Alerts:** إنذار يُرسل عند Freshness>SLAs أو Nulls>Threshold.
- **AC-05 | Safe Exports:** التصدير بدون PII افتراضيًا وبروابط مؤقتة.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Views:** Explorations جاهزة بقوالب أسئلة شائعة.
- **Chart Presets:** خطوط/أعمدة/مؤشرات جاهزة لكل عدسة.
- **Bookmark Filters:** حفظ مجموعات فلاتر للأقسام/الأطر.
- **Explain KPI:** لوحة تعريف القياس وسياقه (من Appendices-S).

## 9) KPIs
- **Explorations Adoption (30d):** ≥ **60%** من الأدوار المستهدفة استخدمت على الأقل استكشافًا واحدًا.
- **DQ Incidents MTTR:** ≤ **24h** لإغلاق تنبيه جودة البيانات.
- **Export Safety:** 0 حوادث تسريب PII عبر التصدير.
- **P95 Run Time:** ≤ **2.5s**.

## 10) قيود وافتراضات
- المصدر الوحيد للمقاييس: **Semantic Layer (M14)**.
- لا تحرير مباشر للجداول؛ كل شيء عبر Views.
- التصدير النصي أولًا؛ صور/شرائح لاحقًا عند الحاجة.
- التنفيذ على الويب مع دعم RTL وWCAG.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويمكّن التحليلات الذاتية المتسقة مع طبقة الدلالات والتقارير التنفيذية.



# M25 — Tenant Success Toolkit (Playbooks, Health Scores, Setup Wizard)
**Version:** v1.0 • **Date:** 2025-11-08 • **Owner:** Senior Systems/Product Analyst  
**Context:** Romuz Cybersecurity Culture Platform — Sub-conversation continuation (multi-tenant SaaS, per-DB isolation).

---

## جدول المحتويات (Table of Contents)
1. [الغرض (Purpose)](#1-الغرض-purpose)
2. [نطاق الـMVP (Scope)](#2-نطاق-الـmvp-scope)
3. [العقود/التكاملات (Integration Contracts)](#3-العقودالتكاملات-integration-contracts)
4. [نموذج البيانات (High-Level Data Model)](#4-نموذج-البيانات-high-level-data-model)
5. [التدفقات (Key Flows)](#5-التدفقات-key-flows)
6. [الحوكمة والأمن (Governance & Security)](#6-الحوكمة-والأمن-governance--security)
7. [معايير القبول (Acceptance Criteria)](#7-معايير-القبول-acceptance-criteria)
8. [تحسينات خفيفة (Quick Wins)](#8-تحسينات-خفيفة-quick-wins)
9. [المؤشرات (KPIs)](#9-kpis)
10. [قيود وافتراضات (Constraints & Assumptions)](#10-قيود-وافتراضات-constraints--assumptions)

---

## 1) الغرض (Purpose)
رفع سرعة التفعيل (Time-to-Value) وجودة التبنّي لكل عميل عبر **Setup Wizard موجّه**، **Health Scores** قابلة للتنفيذ، و**Playbooks** آلية توصّي بخطوات تحسين مستمرة.

## 2) نطاق الـMVP (Scope)
- **Setup Wizard:** خطوات موجهة: Identity/RBAC، Branding، Integrations (Entra/M365/Email/Slack)، Program Defaults (M2/M9/M22).
- **Health Score (Tenant & Org-Unit):** سِلال واضحة (Adoption, Data Quality, Compliance Readiness, Risk Hygiene).
- **Playbooks:** وصفات تحسين جاهزة مرتبطة بالنقاط الضعيفة (e.g., “رفع Evidence Freshness” أو “تقليل Access Drift”).
- **Success Dashboard:** نظرة موحّدة للمؤشرات والمهام والتوصيات.
- **Nudges:** تذكيرات دورية للمالكين لتنفيذ الخطوات الحرجة.

## 3) العقود/التكاملات (Integration Contracts)
### 3.1 Inputs
- KPIs من **M14**، أدلة/تقارير **M10/M19**، اختبارات **M18**، مراجعات وصول **M17**، حملات/تدريب **M2/M22/M23**، تكاملات **M6**.

### 3.2 APIs (مع M15)
- `POST /v1/success/health/recompute`
- `POST /v1/success/playbooks/run`
- `POST /v1/success/wizard/state`
- Webhooks: `success.health.updated`, `success.playbook.suggested`.

### 3.3 Outbound → M21/M19
- تلخيص تأثير التحسينات على الجاهزية والتقارير التنفيذية.

## 4) نموذج البيانات (High-Level Data Model)
> **per-DB isolation** لكل عميل + قراءات من Semantic Layer (M14).

- **success_wizard_states**: `{tenant_id, step, status, meta}`
- **success_health_snapshots**: `{tenant_id, org_unit?, score_overall, adoption, dq, readiness, risk_hygiene, snapshot_at}`
- **success_playbooks**: `{id, name, category, trigger, actions[], est_impact}`
- **success_actions**: `{id, playbook_id, owner_id, due_at, status, result}`
- **success_nudges**: `{id, owner_id, channel, sent_at, outcome}`

## 5) التدفقات (Key Flows)
### F1 | Wizard
يلتقط المعطيات الأساسية ويُشغّل توصيات Playbooks المناسبة.

### F2 | Health Recompute
مهمة مجدولة تجمع KPIs وتنتج Score وبطاقات توصية.

### F3 | Playbook Run
تنفيذ آلي/يدوي لمجموعة مهام (e.g., تفعيل تقارير، جدولة اختبارات، إعداد رحلة تدريب).

### F4 | Tracking
تتبّع تنفيذ التوصيات وتأثيرها على Health Score وM21 Readiness.

### F5 | Coaching
رسائل موجّهة للمالكين مع روابط مباشرة لتنفيذ الخطوات.

## 6) الحوكمة والأمن (Governance & Security)
- **RLS/RBAC:** صلاحيات المشرفين ومدراء البرامج فقط للتعديلات؛ المشاركة عرضية للمدراء التنفيذيين.
- **PII Minimization:** عرض صحة التبنّي مجمّعة دون كشف أسماء الأفراد.
- **Auditability:** كل تشغيل Playbook وكل تغيير على Health مسجّل في audit_logs.
- **Rate Limits:** لحماية عمليات recompute ونداءات التوصية.

## 7) معايير القبول (Acceptance Criteria)
- **AC-01 | Wizard Completion:** تقليص زمن الإعداد الأولي ≥ **30%** مقارنة بخط الأساس.
- **AC-02 | Health Score Integrity:** يُحتسب من مصادر Semantic (M14) بضمان اتساق الصيغ (Appendices-B/S).
- **AC-03 | Playbook Efficacy:** على 3 عملاء تجريبيين، ينخفض **Overdue (M21)** ≥ **20%** خلال 30 يوم.
- **AC-04 | Traceability:** كل توصية لها Owner/Due/Impact وتظهر في لوحة النجاح.
- **AC-05 | Safety:** لا توصية تغيّر صلاحيات/سياسات دون موافقة مشرف.

## 8) تحسينات خفيفة (Quick Wins)
- **Starter Playbooks:** “Quick Start (14 يوم)”، “Audit Readiness Boost”، “Phishing Hygiene”.
- **One-click Integrations Check:** فحص تلقائي لتوصيات الربط الناقصة.
- **Score Explainability:** بطاقة توضّح بالضبط لماذا انخفض/ارتفع المؤشر وكيفية معالجته.
- **Manager Digest:** ملخّص أسبوعي بالأثر والتقدم.

## 9) KPIs
- **Onboarding Time ↓:** ≥ **30%**.
- **Readiness Overdue ↓ (30d):** ≥ **20%**.
- **Adoption Lift (60d):** ≥ **15%** في استخدام اللوحات/الرحلات.
- **DQ Alerts MTTR:** ≤ **24h** لإغلاق تنبيه الجودة.
- **Playbook Adoption:** ≥ **70%** من العملاء يشغّلون 2+ Playbooks في 30 يوم.

## 10) قيود وافتراضات
- حسابات Health تعتمد على **Semantic Layer** وتعريفات Appendices-S.
- بعض Playbooks تتطلب أذونات تكامل (M6) أو سياسات احتفاظ (M16).
- التنفيذ Web-first مع دعم RTL/WCAG؛ تطبيقات أصلية لاحقًا.

---

**ملاحظة تنفيذية:** هذا الملف يلتزم بنمط العمل (مراجعة → اعتماد → تصدير Markdown) ويكمل M21–M24 برفع نجاح العملاء وتسريع الوصول للقيمة.


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

