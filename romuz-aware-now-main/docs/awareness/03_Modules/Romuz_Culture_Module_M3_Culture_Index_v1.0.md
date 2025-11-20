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
