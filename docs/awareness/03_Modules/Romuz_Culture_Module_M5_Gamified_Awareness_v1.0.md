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
