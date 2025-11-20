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
