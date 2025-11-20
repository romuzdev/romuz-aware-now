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
