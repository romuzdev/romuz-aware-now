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
