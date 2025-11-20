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
