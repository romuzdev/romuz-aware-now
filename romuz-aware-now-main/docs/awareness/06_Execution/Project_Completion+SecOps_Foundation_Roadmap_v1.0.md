# 🎯 خطة الإكمال الشاملة + أساس العمليات الأمنية
# Comprehensive Completion + SecOps Foundation Roadmap v1.0

**تاريخ الإصدار:** 2025-11-19  
**النسخة:** 1.0 (مُدمجة)  
**الأساس:** دمج خطة الإكمال + خطة التوسع الذكي  
**المصادر:**
- التقييم الدقيق v2.0 (2025-11-19)
- Project Completion Roadmap v1.0
- Intelligent Expansion & Integration Roadmap v1.0

---

## 📊 الملخص التنفيذي المُحدَّث

### الوضع الفعلي الحالي (بعد التقييم الدقيق)
```
✅ مكتمل 100%:        12 موديول   (48%)
⚙️ مكتمل جزئياً:     8 موديولات   (32%)
⏳ لم يبدأ بعد:        5 موديولات   (20%)
────────────────────────────────────────
📊 الإنجاز الكلي:     65-70% ✅
```

**التصحيحات الرئيسية عن التقديرات السابقة:**
- M11 (Action Plans): **85%** (كان 50%) ✅ +35%
- M15 (Integrations): **70%** (كان 30%) ✅ +40%
- M13 (Awareness): **98%** (كان 95%) ✅
- M21 (Committees): **85%** (كان 0% "Planned") ✅ +85%
- M10 (Documents): **95%** (كان 85%) ✅ +10%

### الهدف النهائي الموحد
```
🎯 Phase 1-3: إكمال إلى 95%+ (الأساس + التشغيل)
🎯 Phase 4: بناء Intelligence Layer (AI + Analytics) → 100%
🎯 SecOps: بناء أساس العمليات الأمنية (NEW) → 100%
🎯 Phase 5: إكمال LMS Integration → 80%+
🎯 النظام جاهز للإنتاج (Production-Ready)
```

### النطاق الزمني المُحدَّث
```
⏱️ المدة الإجمالية: 10-12 شهر (محدّث من 12-16)
⏱️ تاريخ البداية: 2025-11-19
⏱️ تاريخ الإنجاز المتوقع: Q3 2026 (محدّث من Q1 2027)
```

**سبب التحسين:** التقدم الفعلي أكبر بـ 15-20% من التقديرات السابقة ✅

---

## 🏗️ التحليل التفصيلي بحسب المراحل

### Phase 1: Foundation - 97% ✅ [شبه مكتمل]

| Module | Status | Gap | Priority | Est. Time |
|--------|--------|-----|----------|-----------|
| M1 - System Setup | ✅ 100% | - | - | - |
| M2 - Multi-Tenant & RBAC | ✅ 100% | - | - | - |
| M3 - User Management | ✅ 100% | - | - | - |
| M4 - Infrastructure & Health | ✅ 100% | - | - | - |
| M5 - Authentication | ⚙️ 95% | MFA (5%), SSO (planned) | MEDIUM | 2-3 weeks |

**Phase 1 Summary:**
- ✅ الأساس قوي ومكتمل تقريباً
- ⏳ المتبقي: MFA implementation فقط
- 🎯 الأولوية: يمكن تأجيله لـ Phase 4

---

### Phase 2: Operational Core - 82% ⚙️ [جاهز للإكمال]

| Module | Status | Gap | Priority | Est. Time |
|--------|--------|-----|----------|-----------|
| M6 - Frameworks | ✅ 100% | - | - | - |
| M7 - Risk Management | ✅ 100% | - | - | - |
| M8 - Policies & Compliance | ✅ 100% | - | - | - |
| M9 - Objectives & Projects | ✅ 100% | - | - | - |
| M10 - Smart Documents | ⚙️ 95% | Workflow automation (5%) | LOW | 1 week |
| M11 - Action Plans | ⚙️ 85% | Advanced reporting (10%), AI recommendations (5%) | MEDIUM | 2 weeks |
| M12 - Audit Module | ⚙️ 75% | Advanced workflows (15%), Analytics (10%) | HIGH | 3 weeks |

**Phase 2 Summary:**
- ✅ القلب التشغيلي قوي جداً
- 🔧 M12 يحتاج تكملة أولوية عالية
- 🎯 المتبقي: UI enhancements + advanced features

**الإجراءات المطلوبة لـ Phase 2:**

#### 1. M12 - Audit Workflows Enhancement (الأولوية العليا)
```typescript
// Week 1-3: Advanced Audit Workflows

// Database Enhancement
CREATE TABLE audit_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES audit_workflows(id),
  stage_name TEXT NOT NULL,
  sequence_order INT NOT NULL,
  required_actions JSONB,
  approval_required BOOLEAN DEFAULT false,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_findings_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES grc_audits(id),
  category_code TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  finding_ar TEXT NOT NULL,
  recommendation_ar TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  due_date DATE,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

// Components
- AuditWorkflowBuilder.tsx      // بناء وتخصيص المراحل
- FindingsCategorization.tsx    // تصنيف النتائج
- AuditAnalyticsDashboard.tsx   // تحليلات الحوكمة
```

**Deliverables:**
- ✅ Advanced workflow builder with drag-drop
- ✅ Findings categorization & severity matrix
- ✅ Analytics dashboard with charts
- ✅ Automated assignment & notifications

---

#### 2. M11 - Action Plans UI Enhancement
```typescript
// Week 1-2: Advanced Reporting & AI Recommendations

// Components
- ActionPlanReportBuilder.tsx   // تقارير متقدمة
- AIRecommendationsPanel.tsx    // توصيات ذكية
- ProgressTimeline.tsx          // خط زمني تفاعلي
- KanbanBoard.tsx              // عرض كانبان للإجراءات
```

**Deliverables:**
- ✅ Customizable report templates
- ✅ AI-powered action suggestions (using Lovable AI)
- ✅ Interactive timeline with milestones
- ✅ Kanban/Board view option

---

#### 3. M10 - Document Workflow Automation
```typescript
// Week 1: Automation Enhancement

// Edge Function
supabase/functions/document-workflow-automation/index.ts

// Features:
- Auto-approval based on rules
- Document expiration alerts
- Version comparison automation
- Smart tagging using AI
```

---

### Phase 3: Expansion & Analytics - 82% ⚙️ [بحاجة إكمال]

| Module | Status | Gap | Priority | Est. Time |
|--------|--------|-----|----------|-----------|
| M13 - Awareness Program | ⚙️ 98% | Culture scoring refinement (2%) | LOW | 3 days |
| M13.1 - Content Hub | ⚙️ 40% | UI (30%), AI content gen (20%), categorization (10%) | HIGH | 4 weeks |
| M14 - KPI Dashboard | ⚙️ 75% | Unified dashboard (15%), Real-time widgets (10%) | HIGH | 3 weeks |
| M15 - Integrations | ⚙️ 70% | Additional connectors (20%), UI (10%) | CRITICAL | 4 weeks |

**Phase 3 Priority Order:**

#### 1. M15 - Integrations Completion (CRITICAL) 🚨
```typescript
// Week 1-4: Integration Framework Enhancement

// Current Status:
✅ Core integration layer (70%)
✅ Webhooks + Events system
✅ Google Drive, Odoo, Slack connectors
✅ API Keys management

// Missing (30%):
⏳ Microsoft Teams connector (15%)
⏳ Full Slack integration (5%)
⏳ Connector management UI (10%)

// New Components:
- IntegrationMarketplace.tsx    // Connector catalog
- ConnectorConfigWizard.tsx     // Setup wizard
- IntegrationHealthMonitor.tsx  // Status monitoring
- SyncJobsManager.tsx          // Sync jobs control

// New Edge Functions:
supabase/functions/teams-notify/index.ts
supabase/functions/slack-full-integration/index.ts
```

**Deliverables:**
- ✅ Microsoft Teams full integration
- ✅ Enhanced Slack connector
- ✅ Visual connector management UI
- ✅ Integration health monitoring
- ✅ Advanced retry & error handling

---

#### 2. M14 - KPI Unified Dashboard (HIGH)
```typescript
// Week 1-3: Unified Dashboard

// Components:
- UnifiedKPIDashboard.tsx       // لوحة موحدة
- RealTimeWidget.tsx            // Widgets حية
- CustomizableDashboard.tsx     // تخصيص المستخدم
- KPIAlertCenter.tsx            // مركز التنبيهات

// Features:
- Drag-drop dashboard builder
- Real-time data updates
- Custom KPI formulas
- Alert thresholds
- Export to PDF/Excel
```

---

#### 3. M13.1 - Content Hub Development (HIGH)
```typescript
// Week 1-4: Content Hub Implementation

// Database Schema:
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_type TEXT CHECK (content_type IN (
    'article', 'video', 'infographic', 'document', 
    'quiz', 'policy', 'guideline', 'template'
  )),
  category TEXT NOT NULL,
  tags TEXT[],
  content_body_ar TEXT,
  content_body_en TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  author_id UUID,
  status TEXT DEFAULT 'draft',
  views_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  icon TEXT,
  parent_category_id UUID REFERENCES content_categories(id),
  display_order INT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content_id UUID REFERENCES content_items(id),
  interaction_type TEXT CHECK (interaction_type IN (
    'view', 'like', 'share', 'comment', 'download', 'complete'
  )),
  interaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

// Edge Function - AI Content Generation
supabase/functions/content-ai-generator/index.ts
- Generate articles from topics
- Create infographics descriptions
- Translate content
- Suggest tags & categories

// Components:
- ContentLibrary.tsx            // مكتبة المحتوى
- ContentEditor.tsx             // محرر غني
- AIContentWizard.tsx          // معالج AI
- ContentCategoryManager.tsx    // إدارة التصنيفات
- ContentAnalytics.tsx          // تحليلات المحتوى
```

**Deliverables:**
- ✅ Rich content library
- ✅ Visual content editor
- ✅ AI-powered content generation
- ✅ Category & tag management
- ✅ User interaction tracking
- ✅ Content analytics

---

### Phase 4: Intelligence Layer - 15% ⏳ [جديد - بناء كامل]

**الحالة:** معظم الموديولات جديدة تماماً  
**المدة المقدرة:** 16-20 أسبوع (4-5 أشهر)  
**الأولوية:** بعد إكمال Phase 2 & 3 إلى 95%

| Module | Status | Scope | Priority | Est. Time |
|--------|--------|-------|----------|-----------|
| M16 - AI Advisory Engine | ⏳ 25% | بناء شبه كامل (75%) | CRITICAL | 6 weeks |
| M17 - Knowledge Hub + RAG | ⏳ 10% | بناء شبه كامل (90%) | HIGH | 5 weeks |
| M18 - Incident Response | ⏳ 15% | بناء متوسط (85%) | HIGH | 4 weeks |
| M19 - Predictive Analytics | ⏳ 5% | بناء كامل (95%) | MEDIUM | 4 weeks |
| M20 - Threat Intelligence | ⏳ 5% | بناء كامل (95%) | MEDIUM | 3 weeks |

---

#### M16: AI Advisory Engine (Week 1-6) 🤖

**Architecture Overview:**
```
┌─────────────────────────────────────────────┐
│           AI Advisory Engine                 │
├─────────────────────────────────────────────┤
│  Context-Aware Recommendations               │
│  • Risk Management Advisory                  │
│  • Compliance Suggestions                    │
│  • Audit Planning Assistance                 │
│  • Action Plan Optimization                  │
│  • Campaign Effectiveness Tips               │
├─────────────────────────────────────────────┤
│  Multi-Language Support (AR/EN)              │
│  Confidence Scoring                          │
│  Feedback Loop & Learning                    │
└─────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- AI Recommendations
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL,
  context_type TEXT CHECK (context_type IN (
    'risk', 'compliance', 'audit', 'campaign', 
    'incident', 'security_event', 'policy', 'action_plan'
  )),
  context_id UUID NOT NULL,
  recommendation_ar TEXT NOT NULL,
  recommendation_en TEXT NOT NULL,
  rationale_ar TEXT,
  rationale_en TEXT,
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'rejected', 'implemented', 'expired'
  )),
  acted_on_at TIMESTAMPTZ,
  feedback_score INT CHECK (feedback_score BETWEEN 1 AND 5),
  feedback_comment TEXT,
  model_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Decision Logs (للتتبع والتعلم)
CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  recommendation_id UUID REFERENCES ai_recommendations(id),
  decision_type TEXT NOT NULL,
  input_context JSONB NOT NULL,
  output_result JSONB NOT NULL,
  model_version TEXT NOT NULL,
  processing_time_ms INT,
  token_usage INT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_recommendations_tenant_user 
  ON ai_recommendations(tenant_id, user_id);
CREATE INDEX idx_ai_recommendations_context 
  ON ai_recommendations(context_type, context_id);
CREATE INDEX idx_ai_recommendations_status_priority 
  ON ai_recommendations(status, priority);
CREATE INDEX idx_ai_decision_logs_recommendation 
  ON ai_decision_logs(recommendation_id);

-- RLS Policies
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tenant recommendations"
  ON ai_recommendations FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "System creates recommendations"
  ON ai_recommendations FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users update own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text AND user_id = auth.uid());
```

**Edge Function - AI Advisory:**
```typescript
// supabase/functions/ai-advisory/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvisoryRequest {
  contextType: 'risk' | 'compliance' | 'audit' | 'campaign' | 'incident' | 'policy' | 'action_plan';
  contextId: string;
  userRole: string;
  language: 'ar' | 'en';
  customPrompt?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contextType, contextId, userRole, language = 'ar', customPrompt }: AdvisoryRequest = 
      await req.json();
    
    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Fetch context data from relevant table
    const contextData = await fetchContextData(supabaseClient, contextType, contextId);
    
    if (!contextData) {
      throw new Error(`Context not found: ${contextType}/${contextId}`);
    }

    // 3. Build intelligent prompt based on context
    const systemPrompt = buildAdvisoryPrompt(contextType, userRole, language);
    
    // 4. Call Lovable AI
    const startTime = Date.now();
    const response = await fetch("https://ai.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: customPrompt || 
              `قم بتحليل هذا الـ ${contextType} وقدم توصيات قابلة للتنفيذ:\n${JSON.stringify(contextData, null, 2)}` 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;
    const recommendation = result.choices[0].message.content;
    
    // 5. Parse and structure recommendation
    const structured = parseRecommendation(recommendation, language);
    
    // 6. Store recommendation in database
    const { data: savedRec, error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        context_type: contextType,
        context_id: contextId,
        recommendation_ar: language === 'ar' ? structured.text : 
          await translateToArabic(structured.text),
        recommendation_en: language === 'en' ? structured.text : 
          await translateToEnglish(structured.text),
        rationale_ar: structured.rationale ? 
          (language === 'ar' ? structured.rationale : await translateToArabic(structured.rationale)) : null,
        rationale_en: structured.rationale ? 
          (language === 'en' ? structured.rationale : await translateToEnglish(structured.rationale)) : null,
        confidence_score: structured.confidence,
        priority: structured.priority,
        model_version: 'gemini-2.5-flash',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    // 7. Log decision for learning
    await supabaseClient.from('ai_decision_logs').insert({
      recommendation_id: savedRec?.id,
      decision_type: 'advisory_generation',
      input_context: { contextType, contextId, userRole },
      output_result: structured,
      model_version: 'gemini-2.5-flash',
      processing_time_ms: processingTime,
      token_usage: result.usage?.total_tokens || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: savedRec,
        structured,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Advisory Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper Functions
async function fetchContextData(supabase: any, type: string, id: string) {
  let table = '';
  switch(type) {
    case 'risk': table = 'grc_risks'; break;
    case 'audit': table = 'grc_audits'; break;
    case 'campaign': table = 'awareness_campaigns'; break;
    case 'policy': table = 'grc_policies'; break;
    case 'action_plan': table = 'action_plans'; break;
    default: throw new Error(`Unknown context type: ${type}`);
  }
  
  const { data } = await supabase.from(table).select('*').eq('id', id).single();
  return data;
}

function buildAdvisoryPrompt(contextType: string, userRole: string, language: string): string {
  const basePrompt = language === 'ar' ? 
    `أنت مستشار ذكاء اصطناعي متخصص في إدارة المخاطر والحوكمة والأمن السيبراني.` :
    `You are an AI advisor specialized in Risk Management, Governance, and Cybersecurity.`;
    
  const contextPrompts = {
    risk: language === 'ar' ? 
      'قم بتحليل المخاطر وقدم توصيات للتخفيف منها بناءً على أفضل الممارسات.' :
      'Analyze risks and provide mitigation recommendations based on best practices.',
    compliance: language === 'ar' ? 
      'قيّم مستوى الامتثال وقدم خطوات محددة للتحسين.' :
      'Assess compliance level and provide specific improvement steps.',
    audit: language === 'ar' ? 
      'راجع نتائج التدقيق وحدد الأولويات للإجراءات التصحيحية.' :
      'Review audit findings and prioritize corrective actions.',
    // ... more context-specific prompts
  };
  
  return `${basePrompt}\n\n${contextPrompts[contextType] || contextPrompts.risk}`;
}

function parseRecommendation(text: string, language: string) {
  // Extract structured data from AI response
  // Priority keywords, confidence indicators, action items
  return {
    text: text,
    priority: extractPriority(text),
    confidence: extractConfidence(text),
    rationale: extractRationale(text),
  };
}

function extractPriority(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowercased = text.toLowerCase();
  if (lowercased.includes('critical') || lowercased.includes('حرج')) return 'critical';
  if (lowercased.includes('high') || lowercased.includes('عالي')) return 'high';
  if (lowercased.includes('medium') || lowercased.includes('متوسط')) return 'medium';
  return 'low';
}

function extractConfidence(text: string): number {
  // Analyze certainty indicators in text
  // Return score between 0 and 1
  return 0.85; // Default high confidence
}

function extractRationale(text: string): string | null {
  // Extract reasoning section if present
  return null;
}

async function translateToArabic(text: string): Promise<string> {
  // Use Lovable AI for translation
  // Implementation similar to main advisory call
  return text; // Placeholder
}

async function translateToEnglish(text: string): Promise<string> {
  // Use Lovable AI for translation
  return text; // Placeholder
}
```

**Frontend Components:**
```typescript
// src/modules/ai-advisory/components/

// 1. AIAdvisoryPanel.tsx - عرض التوصيات
interface AIAdvisoryPanelProps {
  contextType: string;
  contextId: string;
}

// 2. RecommendationCard.tsx - بطاقة توصية واحدة
// 3. FeedbackDialog.tsx - تقييم التوصيات
// 4. AIInsightsWidget.tsx - Widget للوحات التحكم
```

**Integration Layer:**
```typescript
// src/modules/ai-advisory/integration/ai-advisory.integration.ts

export async function requestAdvisory(
  contextType: string,
  contextId: string,
  options?: AdvisoryOptions
): Promise<AIRecommendation>

export async function provideFeedback(
  recommendationId: string,
  score: number,
  comment?: string
): Promise<void>

export async function acceptRecommendation(
  recommendationId: string
): Promise<void>

export async function implementRecommendation(
  recommendationId: string,
  implementationNotes: string
): Promise<void>
```

**Deliverables M16:**
- ✅ Context-aware AI recommendations engine
- ✅ Multi-language support (AR/EN)
- ✅ Confidence scoring & priority classification
- ✅ User feedback loop
- ✅ Learning & improvement tracking
- ✅ Integration with all major modules

---

#### M17: Knowledge Hub + RAG (Week 7-11) 📚

**Architecture:**
```
┌─────────────────────────────────────────────┐
│           Knowledge Hub + RAG                │
├─────────────────────────────────────────────┤
│  Document Repository                         │
│  Vector Database (Embeddings)                │
│  Semantic Search                             │
│  Q&A System                                  │
│  Knowledge Graph                             │
└─────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- Knowledge Documents
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  document_type TEXT CHECK (document_type IN (
    'policy', 'guideline', 'procedure', 'standard', 
    'best_practice', 'case_study', 'regulation', 'faq'
  )),
  category TEXT NOT NULL,
  tags TEXT[],
  content_ar TEXT NOT NULL,
  content_en TEXT,
  source_url TEXT,
  source_document_id UUID REFERENCES documents(id),
  embedding_vector vector(1536), -- للبحث الدلالي
  keywords TEXT[],
  metadata JSONB,
  views_count INT DEFAULT 0,
  usefulness_score NUMERIC(3,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Q&A
CREATE TABLE knowledge_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  question_ar TEXT NOT NULL,
  question_en TEXT,
  answer_ar TEXT NOT NULL,
  answer_en TEXT,
  source_documents UUID[],
  confidence_score NUMERIC(3,2),
  was_helpful BOOLEAN,
  asked_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Graph Relations
CREATE TABLE knowledge_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source_doc_id UUID REFERENCES knowledge_documents(id),
  target_doc_id UUID REFERENCES knowledge_documents(id),
  relation_type TEXT CHECK (relation_type IN (
    'references', 'supersedes', 'relates_to', 'conflicts_with', 'extends'
  )),
  strength NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_knowledge_docs_tenant_category 
  ON knowledge_documents(tenant_id, category);
CREATE INDEX idx_knowledge_docs_vector 
  ON knowledge_documents USING ivfflat (embedding_vector vector_cosine_ops);
CREATE INDEX idx_knowledge_qa_tenant 
  ON knowledge_qa(tenant_id);

-- RLS
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;
```

**Edge Function - RAG Query:**
```typescript
// supabase/functions/knowledge-rag-query/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RAGQueryRequest {
  question: string;
  language: 'ar' | 'en';
  filters?: {
    categories?: string[];
    documentTypes?: string[];
    maxResults?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, language = 'ar', filters }: RAGQueryRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Generate embedding for question using Lovable AI
    const questionEmbedding = await generateEmbedding(question);

    // 2. Semantic search in knowledge base
    const { data: relevantDocs } = await supabase.rpc('match_knowledge_documents', {
      query_embedding: questionEmbedding,
      match_threshold: 0.7,
      match_count: filters?.maxResults || 5,
    });

    // 3. Build context from relevant documents
    const context = relevantDocs.map((doc: any) => ({
      title: language === 'ar' ? doc.title_ar : doc.title_en,
      content: language === 'ar' ? doc.content_ar : doc.content_en,
      type: doc.document_type,
    }));

    // 4. Generate answer using RAG
    const answer = await generateRAGAnswer(question, context, language);

    // 5. Store Q&A for future reference
    await supabase.from('knowledge_qa').insert({
      question_ar: language === 'ar' ? question : await translateToArabic(question),
      question_en: language === 'en' ? question : await translateToEnglish(question),
      answer_ar: language === 'ar' ? answer.text : await translateToArabic(answer.text),
      answer_en: language === 'en' ? answer.text : await translateToEnglish(answer.text),
      source_documents: relevantDocs.map((d: any) => d.id),
      confidence_score: answer.confidence,
    });

    return new Response(
      JSON.stringify({
        success: true,
        answer: answer.text,
        confidence: answer.confidence,
        sources: relevantDocs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RAG Query Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  // Use Lovable AI to generate text embedding
  const response = await fetch("https://ai.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });
  
  const result = await response.json();
  return result.data[0].embedding;
}

async function generateRAGAnswer(
  question: string, 
  context: any[], 
  language: string
): Promise<{ text: string; confidence: number }> {
  const contextText = context.map(c => `[${c.type}] ${c.title}:\n${c.content}`).join('\n\n---\n\n');
  
  const response = await fetch("https://ai.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro", // Pro for better accuracy
      messages: [
        { 
          role: "system", 
          content: language === 'ar' ? 
            `أنت مساعد ذكاء اصطناعي متخصص في الإجابة على أسئلة الحوكمة والأمن السيبراني. 
استخدم فقط المعلومات الموجودة في السياق المُعطى للإجابة. 
إذا لم تجد إجابة في السياق، قل ذلك بوضوح.` :
            `You are an AI assistant specialized in Governance and Cybersecurity questions.
Use only information from the provided context to answer.
If you cannot find an answer in the context, clearly state that.`
        },
        { 
          role: "user", 
          content: `السياق:\n${contextText}\n\nالسؤال: ${question}` 
        }
      ],
      temperature: 0.2, // Lower for factual accuracy
      max_tokens: 1500,
    }),
  });
  
  const result = await response.json();
  const answerText = result.choices[0].message.content;
  
  // Calculate confidence based on context relevance
  const confidence = calculateConfidence(answerText, context);
  
  return { text: answerText, confidence };
}

function calculateConfidence(answer: string, context: any[]): number {
  // Simple heuristic: check if answer references context
  let matches = 0;
  context.forEach(c => {
    const keywords = c.content.split(/\s+/).slice(0, 20);
    keywords.forEach((kw: string) => {
      if (answer.includes(kw)) matches++;
    });
  });
  
  return Math.min(matches / 50, 0.95); // Cap at 0.95
}
```

**Database Function - Vector Search:**
```sql
-- Create vector search function
CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title_ar text,
  title_en text,
  content_ar text,
  content_en text,
  document_type text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title_ar,
    kd.title_en,
    kd.content_ar,
    kd.content_en,
    kd.document_type,
    kd.category,
    1 - (kd.embedding_vector <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE 1 - (kd.embedding_vector <=> query_embedding) > match_threshold
  ORDER BY kd.embedding_vector <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Frontend Components:**
```typescript
// src/modules/knowledge-hub/components/

// 1. KnowledgeSearch.tsx - بحث ذكي
// 2. QAInterface.tsx - واجهة أسئلة وأجوبة
// 3. KnowledgeGraph.tsx - رسم بياني للعلاقات
// 4. DocumentViewer.tsx - عرض الوثائق
// 5. RecommendedDocs.tsx - توصيات ذكية
```

**Deliverables M17:**
- ✅ Vector database with embeddings
- ✅ Semantic search functionality
- ✅ RAG-based Q&A system
- ✅ Knowledge graph visualization
- ✅ Document recommendation engine
- ✅ Multi-language support

---

#### M18: Incident Response System (Week 12-15) 🚨

**Current Status:** 15% (Alert system exists)

**Database Schema:**
```sql
-- Security Incidents
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  incident_number TEXT UNIQUE NOT NULL, -- AUTO: INC-YYYY-NNNN
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  incident_type TEXT CHECK (incident_type IN (
    'data_breach', 'malware', 'phishing', 'unauthorized_access',
    'dos_attack', 'policy_violation', 'system_failure', 'other'
  )),
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'contained', 'resolved', 'closed'
  )),
  detected_at TIMESTAMPTZ NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT now(),
  reported_by UUID NOT NULL,
  assigned_to UUID,
  assigned_team TEXT,
  response_plan_id UUID,
  affected_assets TEXT[],
  affected_users TEXT[],
  root_cause_ar TEXT,
  root_cause_en TEXT,
  impact_assessment JSONB,
  containment_actions JSONB,
  resolution_actions JSONB,
  lessons_learned_ar TEXT,
  lessons_learned_en TEXT,
  estimated_cost NUMERIC(12,2),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Incident Timeline
CREATE TABLE incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES security_incidents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT CHECK (event_type IN (
    'detected', 'reported', 'assigned', 'investigated', 
    'contained', 'escalated', 'resolved', 'closed', 'note_added'
  )),
  actor_id UUID,
  action_ar TEXT NOT NULL,
  action_en TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Incident Response Plans
CREATE TABLE incident_response_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan_name_ar TEXT NOT NULL,
  plan_name_en TEXT,
  incident_type TEXT NOT NULL,
  severity_level TEXT,
  response_steps JSONB NOT NULL, -- [{ step, description, responsible_role, max_duration }]
  escalation_rules JSONB,
  notification_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_incidents_tenant_status ON security_incidents(tenant_id, status);
CREATE INDEX idx_incidents_severity ON security_incidents(severity, status);
CREATE INDEX idx_incidents_detected_at ON security_incidents(detected_at DESC);
CREATE INDEX idx_incident_timeline_incident ON incident_timeline(incident_id, timestamp);

-- RLS
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_response_plans ENABLE ROW LEVEL SECURITY;
```

**Edge Function - Incident Auto-Detection:**
```typescript
// supabase/functions/incident-auto-detect/index.ts

// Monitors alert_events and creates incidents automatically
serve(async (req) => {
  try {
    const supabase = createClient(/* ... */);
    
    // 1. Fetch recent critical alerts
    const { data: criticalAlerts } = await supabase
      .from('alert_events')
      .select('*')
      .eq('severity', 'critical')
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour
    
    for (const alert of criticalAlerts) {
      // 2. Check if incident already exists for this alert
      const { data: existing } = await supabase
        .from('security_incidents')
        .select('id')
        .eq('metadata->>alert_id', alert.id)
        .single();
      
      if (existing) continue; // Skip if already created
      
      // 3. Classify incident type and severity
      const classification = await classifyIncident(alert);
      
      // 4. Find appropriate response plan
      const { data: responsePlan } = await supabase
        .from('incident_response_plans')
        .select('*')
        .eq('incident_type', classification.type)
        .eq('is_active', true)
        .single();
      
      // 5. Create incident
      const { data: incident } = await supabase
        .from('security_incidents')
        .insert({
          tenant_id: alert.tenant_id,
          incident_number: await generateIncidentNumber(supabase, alert.tenant_id),
          title_ar: `حدث أمني تلقائي: ${classification.title_ar}`,
          title_en: `Auto-detected Incident: ${classification.title_en}`,
          description_ar: classification.description_ar,
          description_en: classification.description_en,
          severity: classification.severity,
          incident_type: classification.type,
          detected_at: alert.created_at,
          reported_by: 'system',
          response_plan_id: responsePlan?.id,
          metadata: { alert_id: alert.id, auto_detected: true },
        })
        .select()
        .single();
      
      // 6. Create initial timeline entry
      await supabase.from('incident_timeline').insert({
        incident_id: incident.id,
        event_type: 'detected',
        action_ar: 'تم اكتشاف الحدث تلقائياً من خلال نظام التنبيهات',
        action_en: 'Incident auto-detected through alert system',
        details: { alert_id: alert.id, classification },
      });
      
      // 7. Auto-assign if rules exist
      if (responsePlan?.notification_rules?.auto_assign) {
        // Assignment logic...
      }
      
      // 8. Send notifications
      await notifyIncidentTeam(incident, responsePlan);
      
      console.log(`✅ Created incident: ${incident.incident_number}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, processed: criticalAlerts.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Incident Auto-Detection Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function classifyIncident(alert: any) {
  // Use AI to classify incident based on alert data
  // Call Lovable AI for classification
  return {
    type: 'unauthorized_access',
    severity: 'high',
    title_ar: 'محاولة وصول غير مصرح بها',
    title_en: 'Unauthorized Access Attempt',
    description_ar: '...',
    description_en: '...',
  };
}

async function generateIncidentNumber(supabase: any, tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('security_incidents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', `${year}-01-01`);
  
  return `INC-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
}
```

**Frontend Components:**
```typescript
// src/modules/incident-response/components/

// 1. IncidentDashboard.tsx - لوحة الحوادث
// 2. IncidentDetails.tsx - تفاصيل حدث
// 3. IncidentTimeline.tsx - الخط الزمني
// 4. ResponsePlanExecutor.tsx - تنفيذ خطة الاستجابة
// 5. IncidentReportGenerator.tsx - تقرير الحدث
```

**Deliverables M18:**
- ✅ Comprehensive incident management
- ✅ Auto-detection from alerts
- ✅ Response plan templates
- ✅ Timeline tracking
- ✅ Escalation workflows
- ✅ Incident reporting

---

#### M19: Predictive Analytics (Week 16-19) 📈

**Database Schema:**
```sql
-- Prediction Models
CREATE TABLE prediction_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT CHECK (model_type IN (
    'risk_prediction', 'incident_forecast', 'compliance_score', 
    'campaign_success', 'audit_outcome', 'breach_likelihood'
  )),
  algorithm TEXT,
  training_data_period INTERVAL,
  accuracy_score NUMERIC(3,2),
  last_trained_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  model_id UUID REFERENCES prediction_models(id),
  prediction_type TEXT NOT NULL,
  target_entity_type TEXT, -- 'risk', 'campaign', 'audit', etc.
  target_entity_id UUID,
  predicted_value NUMERIC,
  predicted_category TEXT,
  confidence_score NUMERIC(3,2),
  contributing_factors JSONB,
  expires_at TIMESTAMPTZ,
  actual_value NUMERIC,
  actual_category TEXT,
  was_accurate BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_predictions_tenant_type ON predictions(tenant_id, prediction_type);
CREATE INDEX idx_predictions_model ON predictions(model_id);
CREATE INDEX idx_predictions_expires ON predictions(expires_at);
```

**Edge Function - Predictive Engine:**
```typescript
// supabase/functions/predictive-analytics/index.ts

serve(async (req) => {
  try {
    const { modelType, targetId, dataRange } = await req.json();
    
    const supabase = createClient(/* ... */);
    
    // 1. Fetch historical data
    const historicalData = await fetchHistoricalData(supabase, modelType, dataRange);
    
    // 2. Prepare features
    const features = prepareFeatures(historicalData);
    
    // 3. Get prediction from AI model
    const prediction = await runPredictionModel(modelType, features);
    
    // 4. Store prediction
    await supabase.from('predictions').insert({
      model_id: prediction.modelId,
      prediction_type: modelType,
      target_entity_id: targetId,
      predicted_value: prediction.value,
      predicted_category: prediction.category,
      confidence_score: prediction.confidence,
      contributing_factors: prediction.factors,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    return new Response(
      JSON.stringify({ success: true, prediction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deliverables M19:**
- ✅ Risk prediction models
- ✅ Incident forecasting
- ✅ Compliance score prediction
- ✅ Campaign success prediction
- ✅ Model accuracy tracking

---

#### M20: Threat Intelligence (Week 20-22) 🛡️

**Database Schema:**
```sql
-- Threat Intelligence Feeds
CREATE TABLE threat_intelligence_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_name TEXT NOT NULL,
  feed_type TEXT CHECK (feed_type IN (
    'ioc', 'vulnerability', 'threat_actor', 'malware', 'advisory'
  )),
  source_url TEXT,
  last_fetched_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Threat Indicators (IOCs)
CREATE TABLE threat_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  feed_id UUID REFERENCES threat_intelligence_feeds(id),
  indicator_type TEXT CHECK (indicator_type IN (
    'ip', 'domain', 'url', 'file_hash', 'email', 'vulnerability_id'
  )),
  indicator_value TEXT NOT NULL,
  threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  tags TEXT[],
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  detection_count INT DEFAULT 0,
  is_whitelisted BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Threat Matches (detected in system)
CREATE TABLE threat_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  indicator_id UUID REFERENCES threat_indicators(id),
  matched_entity_type TEXT, -- 'log', 'alert', 'incident'
  matched_entity_id UUID,
  matched_at TIMESTAMPTZ DEFAULT now(),
  action_taken TEXT,
  was_false_positive BOOLEAN
);
```

**Edge Function - Threat Intel Sync:**
```typescript
// supabase/functions/threat-intel-sync/index.ts

// Fetches latest threat intelligence from external sources
serve(async (req) => {
  try {
    const supabase = createClient(/* ... */);
    
    // 1. Fetch active feeds
    const { data: feeds } = await supabase
      .from('threat_intelligence_feeds')
      .select('*')
      .eq('is_active', true);
    
    for (const feed of feeds) {
      // 2. Fetch new indicators from source
      const indicators = await fetchFromThreatFeed(feed);
      
      // 3. Store/update indicators
      for (const indicator of indicators) {
        await supabase.from('threat_indicators').upsert({
          feed_id: feed.id,
          indicator_type: indicator.type,
          indicator_value: indicator.value,
          threat_level: indicator.level,
          description: indicator.description,
          tags: indicator.tags,
          last_seen_at: new Date(),
        }, {
          onConflict: 'indicator_value',
        });
      }
      
      // 4. Update feed timestamp
      await supabase
        .from('threat_intelligence_feeds')
        .update({ last_fetched_at: new Date() })
        .eq('id', feed.id);
    }
    
    return new Response(
      JSON.stringify({ success: true, processed: feeds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Deliverables M20:**
- ✅ Threat intelligence feeds integration
- ✅ IOC (Indicators of Compromise) database
- ✅ Automated threat matching
- ✅ Threat level assessment
- ✅ Integration with incident response

---

### 🚨 SecOps Integration (NEW Module) - M18.5

**الحالة:** 0% → 100% (جديد كلياً)  
**المدة:** 6 أسابيع (بالتوازي مع M18-M20)  
**الأولوية:** CRITICAL

**Architecture:**
```
┌──────────────────────────────────────────────┐
│          SecOps Integration Layer            │
├──────────────────────────────────────────────┤
│  • SIEM Integration                          │
│  • SOC Dashboard                             │
│  • Security Event Management                 │
│  • Automated Response & Orchestration (SOAR) │
│  • Threat Hunting                            │
└──────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- Security Events (SIEM)
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  source_system TEXT, -- 'firewall', 'ids', 'endpoint', 'application', etc.
  source_ip INET,
  destination_ip INET,
  user_id TEXT,
  event_data JSONB NOT NULL,
  raw_log TEXT,
  normalized_fields JSONB,
  correlation_id UUID,
  is_processed BOOLEAN DEFAULT false,
  threat_indicator_matched UUID REFERENCES threat_indicators(id),
  incident_id UUID REFERENCES security_incidents(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SOAR Playbooks
CREATE TABLE soar_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  playbook_name_ar TEXT NOT NULL,
  playbook_name_en TEXT,
  trigger_conditions JSONB NOT NULL, -- { event_type, severity, patterns }
  automation_steps JSONB NOT NULL, -- [{ action, parameters, on_success, on_failure }]
  approval_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  execution_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SOAR Executions
CREATE TABLE soar_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES soar_playbooks(id),
  trigger_event_id UUID REFERENCES security_events(id),
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  execution_log JSONB,
  actions_taken TEXT[],
  result JSONB,
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_security_events_timestamp ON security_events(event_timestamp DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, is_processed);
CREATE INDEX idx_security_events_correlation ON security_events(correlation_id);
CREATE INDEX idx_soar_executions_playbook ON soar_executions(playbook_id, status);

-- Partitioning (للأداء)
-- تقسيم security_events حسب الشهر
CREATE TABLE security_events_y2025m11 PARTITION OF security_events
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Edge Function - SIEM Event Processor:**
```typescript
// supabase/functions/siem-event-processor/index.ts

serve(async (req) => {
  try {
    const events = await req.json(); // Batch of events
    
    const supabase = createClient(/* ... */);
    
    for (const event of events) {
      // 1. Normalize event data
      const normalized = normalizeSecurityEvent(event);
      
      // 2. Enrich with threat intelligence
      const threatMatch = await checkThreatIndicators(supabase, normalized);
      
      // 3. Correlate with other events
      const correlationId = await correlateEvents(supabase, normalized);
      
      // 4. Store event
      const { data: storedEvent } = await supabase
        .from('security_events')
        .insert({
          event_timestamp: normalized.timestamp,
          event_type: normalized.type,
          severity: normalized.severity,
          source_system: normalized.source,
          source_ip: normalized.sourceIp,
          destination_ip: normalized.destIp,
          user_id: normalized.userId,
          event_data: normalized.data,
          raw_log: event.rawLog,
          normalized_fields: normalized.fields,
          correlation_id: correlationId,
          threat_indicator_matched: threatMatch?.id,
        })
        .select()
        .single();
      
      // 5. Check if incident should be created
      if (normalized.severity === 'critical' || threatMatch) {
        await createSecurityIncident(supabase, storedEvent, threatMatch);
      }
      
      // 6. Trigger SOAR playbooks
      await triggerSOARPlaybooks(supabase, storedEvent);
    }
    
    return new Response(
      JSON.stringify({ success: true, processed: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Edge Function - SOAR Orchestrator:**
```typescript
// supabase/functions/soar-orchestrator/index.ts

serve(async (req) => {
  try {
    const { playbookId, eventId, manualTrigger } = await req.json();
    
    const supabase = createClient(/* ... */);
    
    // 1. Fetch playbook
    const { data: playbook } = await supabase
      .from('soar_playbooks')
      .select('*')
      .eq('id', playbookId)
      .single();
    
    // 2. Create execution record
    const { data: execution } = await supabase
      .from('soar_executions')
      .insert({
        playbook_id: playbookId,
        trigger_event_id: eventId,
        status: 'running',
      })
      .select()
      .single();
    
    // 3. Execute automation steps
    const results = [];
    for (const step of playbook.automation_steps) {
      try {
        const result = await executeSOARAction(step, execution, supabase);
        results.push({ step: step.action, success: true, result });
        
        // Update execution log
        await supabase
          .from('soar_executions')
          .update({
            execution_log: [...(execution.execution_log || []), {
              timestamp: new Date(),
              action: step.action,
              result,
            }],
          })
          .eq('id', execution.id);
        
      } catch (error) {
        results.push({ step: step.action, success: false, error: error.message });
        
        // Handle failure based on playbook config
        if (step.on_failure === 'stop') {
          await supabase
            .from('soar_executions')
            .update({
              status: 'failed',
              completed_at: new Date(),
              error_message: error.message,
            })
            .eq('id', execution.id);
          
          throw error;
        }
      }
    }
    
    // 4. Mark as completed
    await supabase
      .from('soar_executions')
      .update({
        status: 'completed',
        completed_at: new Date(),
        result: results,
      })
      .eq('id', execution.id);
    
    return new Response(
      JSON.stringify({ success: true, execution, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function executeSOARAction(step: any, execution: any, supabase: any) {
  switch (step.action) {
    case 'block_ip':
      // Call firewall API to block IP
      return await blockIPAddress(step.parameters.ip);
    
    case 'isolate_endpoint':
      // Call EDR API to isolate endpoint
      return await isolateEndpoint(step.parameters.hostname);
    
    case 'disable_user':
      // Disable user account
      return await disableUserAccount(supabase, step.parameters.userId);
    
    case 'send_notification':
      // Send alert to security team
      return await sendSecurityAlert(step.parameters);
    
    case 'create_ticket':
      // Create incident ticket
      return await createIncidentTicket(supabase, step.parameters);
    
    default:
      throw new Error(`Unknown SOAR action: ${step.action}`);
  }
}
```

**Frontend Components:**
```typescript
// src/modules/secops/components/

// 1. SOCDashboard.tsx - مركز عمليات الأمن
// 2. SIEMEventViewer.tsx - عارض الأحداث
// 3. ThreatHuntingInterface.tsx - واجهة الصيد
// 4. SOARPlaybookBuilder.tsx - بناء Playbooks
// 5. IncidentCorrelationGraph.tsx - رسم الارتباطات
```

**Deliverables M18.5 - SecOps:**
- ✅ SIEM event ingestion & processing
- ✅ Security event correlation
- ✅ SOC dashboard with real-time monitoring
- ✅ SOAR playbook engine
- ✅ Automated response actions
- ✅ Threat hunting interface
- ✅ Integration with M18 (Incidents) & M20 (Threat Intel)

---

### Phase 5: LMS & Awareness Training - 24% ⏳

| Module | Status | Gap | Priority | Est. Time |
|--------|--------|-----|----------|-----------|
| M21 - Committees | ⚙️ 85% | Advanced features (15%) | MEDIUM | 2 weeks |
| M22 - LMS Courses | ⏳ 0% | Full build (100%) | HIGH | 6 weeks |
| M23 - Certifications | ⏳ 15% | Full build (85%) | MEDIUM | 3 weeks |
| M24 - Training Paths | ⏳ 20% | Full build (80%) | MEDIUM | 4 weeks |
| M25 - Phishing Simulation | ⏳ 0% | Full build (100%) | HIGH | 5 weeks |

**Phase 5 Summary:**
- ⚙️ M21 متقدم جداً، يحتاج فقط AI features
- ⏳ M22 & M25 أولوية عالية
- 🎯 يمكن البدء بعد Phase 4 أو بالتوازي

---

## 📅 الجدول الزمني الموحد المُحدَّث

### Q4 2025 (Nov-Jan): "Operational Excellence + Intelligence Foundation"

**الأسابيع 1-4 (نوفمبر):** 
- ✅ M12 - Audit Workflows Completion
- ✅ M11 - Action Plans Enhancement
- ✅ M10 - Document Automation

**الأسابيع 5-8 (ديسمبر):**
- ✅ M15 - Integrations Completion (CRITICAL)
- ✅ M14 - KPI Unified Dashboard
- ✅ M13.1 - Content Hub Development

**الأسابيع 9-12 (يناير):**
- ✅ M16 - AI Advisory Engine (بداية Phase 4)
- ✅ M17 - Knowledge Hub + RAG

**النتيجة المتوقعة بنهاية Q4:**
- Phase 2 & 3: 95%+ ✅
- Phase 4: 40% ✅
- الإنجاز الكلي: ~78-80%

---

### Q1 2026 (Feb-Apr): "Intelligence Layer + SecOps"

**الأسابيع 13-16 (فبراير):**
- ✅ M18 - Incident Response System
- ✅ M18.5 - SecOps Integration (بالتوازي)

**الأسابيع 17-20 (مارس):**
- ✅ M19 - Predictive Analytics
- ✅ M20 - Threat Intelligence

**الأسابيع 21-24 (أبريل):**
- ✅ M5 - MFA Implementation (التحسين الأخير لـ Phase 1)
- ✅ M21 - Committees AI Features
- ✅ Phase 4 Testing & Refinement

**النتيجة المتوقعة بنهاية Q1:**
- Phase 1: 100% ✅
- Phase 2 & 3: 97% ✅
- Phase 4: 100% ✅
- SecOps: 100% ✅
- الإنجاز الكلي: ~88-90%

---

### Q2 2026 (May-Jul): "LMS Completion"

**الأسابيع 25-30 (مايو-يونيو):**
- ✅ M22 - LMS Courses (Full Build)
- ✅ M25 - Phishing Simulation

**الأسابيع 31-34 (يوليو):**
- ✅ M23 - Certifications Enhancement
- ✅ M24 - Training Paths

**النتيجة المتوقعة بنهاية Q2:**
- Phase 5: 80%+ ✅
- الإنجاز الكلي: ~94-96%

---

### Q3 2026 (Aug-Sep): "Testing, QA & Production"

**الأسابيع 35-40 (أغسطس-سبتمبر):**
- ✅ Comprehensive Testing (Unit + Integration + E2E)
- ✅ Performance Optimization
- ✅ Security Hardening
- ✅ Documentation Completion
- ✅ User Acceptance Testing (UAT)
- ✅ Production Deployment Preparation

**النتيجة المتوقعة بنهاية Q3:**
- جميع المراحل: 98-100% ✅
- النظام جاهز للإنتاج ✅
- **الإطلاق الرسمي: سبتمبر 2026** 🎉

---

## 🎯 استراتيجية التنفيذ الموحدة

### المبادئ الأساسية

1. **Complete Then Expand**
   ```
   Phase 2 & 3 → 95%+ قبل Phase 4
   Phase 4 (Intelligence) → بالتوازي مع Phase 5
   Testing & QA → مستمر طوال الوقت
   ```

2. **Parallel Development**
   ```
   Backend + Frontend معاً
   Multiple modules في نفس الوقت (عندما يكون منطقياً)
   Testing مع Development (TDD)
   ```

3. **Iterative Enhancement**
   ```
   MVP → Testing → Feedback → Enhancement
   لا ننتظر الكمال، نُحسّن بالتدريج
   ```

4. **Risk-First Approach**
   ```
   الأولوية للموديولات الحرجة (M15, M16, M18)
   Security & Compliance أولاً
   ```

---

## 📊 مؤشرات الأداء (KPIs)

### مؤشرات التقدم
```
| Metric | Current | Q4 2025 Target | Q1 2026 Target | Q3 2026 Target |
|--------|---------|----------------|----------------|----------------|
| Overall Completion | 65-70% | 78-80% | 88-90% | 98-100% |
| Phase 1 | 97% | 97% | 100% | 100% |
| Phase 2 | 82% | 95% | 97% | 100% |
| Phase 3 | 82% | 95% | 97% | 100% |
| Phase 4 | 15% | 40% | 100% | 100% |
| Phase 5 | 24% | 30% | 40% | 80%+ |
| Test Coverage | ~30% | 50% | 70% | 90%+ |
```

### مؤشرات الجودة
```
✅ Code Quality Score: 85%+ (Target: 90%+)
✅ Security Score: 90%+ (Target: 95%+)
✅ Performance Score: 80%+ (Target: 90%+)
✅ Documentation Coverage: 70% (Target: 95%+)
```

---

## ⚠️ المخاطر والتحديات

### المخاطر الرئيسية

1. **Phase 4 Complexity** (عالي)
   - **الخطر:** Phase 4 معقد جداً (AI + ML + RAG)
   - **التخفيف:** بداية مبكرة + توظيف خبراء AI إذا لزم الأمر

2. **Integration Bottleneck** (متوسط)
   - **الخطر:** M15 critical لكل شيء
   - **التخفيف:** أولوية قصوى + موارد إضافية

3. **Resource Constraints** (متوسط)
   - **الخطر:** قد نحتاج موارد إضافية
   - **التخفيف:** تحديد أولويات واضحة + outsourcing عند الحاجة

4. **Scope Creep** (منخفض)
   - **الخطر:** إضافة features جديدة
   - **التخفيف:** strict scope management + change control

### خطة الطوارئ

```
إذا تأخرنا:
1. تأجيل M5 (MFA) إلى ما بعد Phase 4
2. تقليل Phase 5 scope إلى 70% بدلاً من 80%
3. دمج بعض موديولات LMS

إذا تقدمنا أسرع:
1. بداية مبكرة في Phase 4
2. زيادة Test Coverage إلى 95%+
3. إضافة Advanced Analytics features
```

---

## 💰 تقدير التكلفة والموارد

### الموارد المطلوبة

**الفريق المقترح:**
```
👨‍💻 2x Full-Stack Developers (React + TypeScript + Supabase)
🤖 1x AI/ML Engineer (لـ Phase 4)
🎨 1x UI/UX Designer (part-time)
🧪 1x QA Engineer
📝 1x Technical Writer (part-time)
```

**البنية التحتية:**
```
☁️ Lovable Cloud (included)
🗄️ Supabase Pro Plan
🤖 Lovable AI Credits (for M16, M17)
🔒 Security Tools & Monitoring
```

**التكلفة المقدرة (10 أشهر):**
```
💵 Development Team: $120K - $180K
☁️ Infrastructure: $5K - $8K
🤖 AI/Tools: $3K - $5K
📚 Training & Misc: $2K - $3K
─────────────────────────────────
💰 Total: $130K - $196K (تقريبي)
```

---

## 🎓 متطلبات التدريب

### للفريق الداخلي
```
1. Lovable Platform Deep Dive (1 أسبوع)
2. Supabase Advanced Features (1 أسبوع)
3. AI Integration Best Practices (2 أسبوع)
4. Security & Compliance Training (1 أسبوع)
```

### للمستخدمين النهائيين
```
1. System Overview & Navigation (2 ساعات)
2. Role-Specific Training (4 ساعات)
3. Advanced Features Workshop (2 ساعات)
4. Admin Console Training (4 ساعات)
```

---

## 📋 Checklist للإنجاز الكامل

### Phase 1 (Foundation) ✅ 97%
- [x] M1 - System Setup
- [x] M2 - Multi-Tenant & RBAC
- [x] M3 - User Management
- [x] M4 - Infrastructure & Health
- [ ] M5 - MFA Implementation (5%)

### Phase 2 (Operational Core) ⚙️ 82%
- [x] M6 - Frameworks
- [x] M7 - Risk Management
- [x] M8 - Policies & Compliance
- [x] M9 - Objectives & Projects
- [ ] M10 - Document Automation (5%)
- [ ] M11 - Advanced Reporting (15%)
- [ ] M12 - Audit Workflows (25%)

### Phase 3 (Expansion) ⚙️ 82%
- [ ] M13 - Culture Scoring (2%)
- [ ] M13.1 - Content Hub (60%)
- [ ] M14 - Unified Dashboard (25%)
- [ ] M15 - Integrations (30%)

### Phase 4 (Intelligence) ⏳ 15%
- [ ] M16 - AI Advisory (75%)
- [ ] M17 - Knowledge Hub (90%)
- [ ] M18 - Incident Response (85%)
- [ ] M18.5 - SecOps (100%) **NEW**
- [ ] M19 - Predictive Analytics (95%)
- [ ] M20 - Threat Intelligence (95%)

### Phase 5 (LMS) ⏳ 24%
- [ ] M21 - Committees Enhancement (15%)
- [ ] M22 - LMS Courses (100%)
- [ ] M23 - Certifications (85%)
- [ ] M24 - Training Paths (80%)
- [ ] M25 - Phishing Simulation (100%)

### Testing & QA ⏳ 30%
- [ ] Unit Tests (60%)
- [ ] Integration Tests (70%)
- [ ] E2E Tests (80%)
- [ ] Performance Testing (90%)
- [ ] Security Testing (100%)
- [ ] UAT (100%)

### Documentation ⏳ 70%
- [x] Architecture Documentation
- [x] API Documentation
- [ ] User Guides (60%)
- [ ] Admin Guides (50%)
- [ ] Developer Onboarding (40%)
- [ ] Deployment Guide (80%)

---

## ✅ الخلاصة والتوصيات

### النتائج الرئيسية

1. **التقدم الفعلي أفضل من المتوقع:**
   - 65-70% مكتمل (كان التقدير 50%)
   - معظم الـ Backend Infrastructure جاهز
   - الموديولات الأساسية قوية جداً

2. **الأولويات الواضحة:**
   - إكمال Phase 2 & 3 إلى 95%+ (3 أشهر)
   - بناء Phase 4 Intelligence Layer (4 أشهر)
   - بناء SecOps Foundation (موديول جديد مهم)
   - إكمال Phase 5 LMS (3 أشهر)

3. **الزمن المحدث:**
   - من 12-16 شهر → 10-12 شهر
   - الإطلاق: Q3 2026 بدلاً من Q1 2027

### التوصيات الاستراتيجية

1. **ابدأ فوراً بـ:**
   - M15 (Integrations) - CRITICAL
   - M12 (Audit Workflows) - HIGH
   - M14 (KPI Dashboard) - HIGH

2. **خصص موارد إضافية لـ:**
   - Phase 4 (AI/ML expertise)
   - SecOps Module (Security specialists)
   - Testing & QA

3. **حافظ على الزخم:**
   - Parallel development حيث ممكن
   - Continuous testing
   - Regular demos & feedback

4. **لا تُضحّي بالجودة:**
   - Security first
   - Performance optimization
   - Comprehensive testing

---

## 📞 التواصل والمتابعة

### التقارير الدورية
```
🗓️ Weekly: Progress Updates (كل أحد)
🗓️ Bi-Weekly: Demo Sessions (كل أسبوعين)
🗓️ Monthly: Comprehensive Review (آخر يوم من الشهر)
🗓️ Quarterly: Strategic Review (نهاية كل ربع)
```

### نقاط الاتصال
```
📧 Project Lead: [TBD]
💻 Tech Lead: Lovable AI Assistant
🎨 Design Lead: [TBD]
🧪 QA Lead: [TBD]
```

---

## 📚 المراجع والوثائق المرتبطة

1. **التقييم الدقيق:**
   - `docs/awareness/06_Execution/ACCURATE_STATUS_ASSESSMENT_v2.0.md`

2. **خطط التنفيذ السابقة:**
   - `docs/awareness/06_Execution/Project_Completion_Roadmap_v1.0.md`
   - `docs/awareness/06_Execution/Project_التوسع الذكي و التكامل _Roadmap_v1.0.md`

3. **الوثائق التقنية:**
   - `docs/awareness/04_Execution/14-Phase4-Lovable-Execution-Plan_v1.1.md`
   - Module-specific execution packs (D3-D6)

4. **المعمارية:**
   - Architecture diagrams (TBD)
   - Database ERD (TBD)

---

**آخر تحديث:** 2025-11-19  
**المُعد:** Lovable AI Assistant  
**الحالة:** مُعتمد للتنفيذ ✅  

---

# 🚀 دعنا نبدأ العمل! Let's Build This! 💪

**الأساس قوي. الطريق واضح. الهدف قريب.** ✨
