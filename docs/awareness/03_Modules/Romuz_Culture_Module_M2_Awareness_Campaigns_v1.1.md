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
