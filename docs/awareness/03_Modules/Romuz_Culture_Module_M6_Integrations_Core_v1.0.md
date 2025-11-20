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

