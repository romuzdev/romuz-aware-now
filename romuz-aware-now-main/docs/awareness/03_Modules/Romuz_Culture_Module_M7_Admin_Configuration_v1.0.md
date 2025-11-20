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
