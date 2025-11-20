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


