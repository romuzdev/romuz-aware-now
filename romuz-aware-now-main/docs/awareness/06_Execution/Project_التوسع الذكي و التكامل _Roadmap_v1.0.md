# 🚀 خطة التوسع الذكي والتكامل
# Intelligent Expansion & Integration Roadmap v1.0

**تاريخ الإصدار:** 2025-11-19  
**النسخة:** 1.0  
**المدة:** 6 أشهر (Q4 2025 - Q1 2026)  
**الهدف:** بناء طبقة الذكاء الاصطناعي + نظام إدارة عمليات الأمن السيبراني المتكامل

---

## 📊 الملخص التنفيذي

### النطاق
```
🎯 Phase 4: Intelligence Layer (AI & Analytics)
🎯 SecOps: Security Operations Management (NEW)
🎯 التكامل الكامل مع الأنظمة الخارجية
🎯 نظام موحد للأحداث والحوادث الأمنية
```

### الموديولات المشمولة
```
M16 - AI Advisory Engine           (5% → 100%)
M17 - Knowledge Hub + RAG          (0% → 100%)
M18 - Incident Response            (10% → 100%)
M18.5 - SecOps Integration         (0% → 100%) ⭐ NEW
M19 - Predictive Analytics         (0% → 100%)
M20 - Threat Intelligence          (0% → 100%) ⭐ NEW
```

### الزمن المقدر
```
⏱️ Q4 2025 (Jul - Sep): Intelligence Layer + SecOps Foundation
⏱️ Q1 2026 (Oct - Dec): Intelligence Expansion + SecOps Integration
⏱️ المدة الإجمالية: 6 أشهر
```

---

## 🤖 Quarter 4 (Q4 2025) - "Intelligence Layer + SecOps Foundation"
**المدة:** 3 أشهر (Jul - Sep 2025)  
**الهدف:** بناء طبقة الذكاء + أساس SecOps  
**الأولوية:** 🚨 CRITICAL

---

### 📅 Week 1-6: M16 - AI Advisory Engine (5% → 100%)
**الحالة الحالية:** ⏳ 5%  
**الأولوية:** 🚨 CRITICAL

#### Architecture
```
┌─────────────────────────────────────────┐
│         AI Advisory Engine              │
├─────────────────────────────────────────┤
│  • Lovable AI Integration               │
│  • Multi-Context Recommendations        │
│  • Decision Intelligence                │
│  • Feedback Loop & Learning             │
│  • Arabic/English Support               │
└─────────────────────────────────────────┘
```

#### Database Schema
```sql
-- AI Recommendations
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL,
  context_type TEXT CHECK (context_type IN (
    'risk', 'compliance', 'audit', 'campaign', 
    'incident', 'security_event', 'policy'
  )),
  context_id UUID,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Decision Logs
CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  recommendation_id UUID REFERENCES ai_recommendations(id),
  decision_type TEXT NOT NULL,
  decision_data JSONB NOT NULL,
  input_context JSONB,
  output_result JSONB,
  model_version TEXT NOT NULL,
  processing_time_ms INT,
  token_usage INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Indexes
CREATE INDEX idx_ai_recommendations_tenant_user ON ai_recommendations(tenant_id, user_id);
CREATE INDEX idx_ai_recommendations_context ON ai_recommendations(context_type, context_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status, priority);
CREATE INDEX idx_ai_decision_logs_recommendation ON ai_decision_logs(recommendation_id);

-- Enable RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own recommendations"
  ON ai_recommendations FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "System creates recommendations"
  ON ai_recommendations FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users update own recommendations"
  ON ai_recommendations FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text AND user_id = auth.uid());
```

#### Edge Function - AI Advisory
```typescript
// supabase/functions/ai-advisory/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvisoryRequest {
  contextType: string;
  contextId: string;
  userRole: string;
  language: 'ar' | 'en';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contextType, contextId, userRole, language = 'ar' }: AdvisoryRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // 1. Fetch context data
    const contextData = await fetchContextData(supabaseClient, contextType, contextId);
    
    // 2. Build AI prompt based on context and role
    const systemPrompt = buildAdvisoryPrompt(contextType, userRole, language);
    
    // 3. Call Lovable AI
    const startTime = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this ${contextType} and provide actionable recommendations:\n${JSON.stringify(contextData, null, 2)}` 
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    
    const result = await response.json();
    const processingTime = Date.now() - startTime;
    const recommendation = result.choices[0].message.content;
    
    // 4. Parse and structure recommendation
    const structured = parseRecommendation(recommendation, language);
    
    // 5. Store recommendation
    const { data: savedRec, error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        context_type: contextType,
        context_id: contextId,
        recommendation_ar: language === 'ar' ? structured.text : await translateToArabic(structured.text),
        recommendation_en: language === 'en' ? structured.text : await translateToEnglish(structured.text),
        rationale_ar: language === 'ar' ? structured.rationale : await translateToArabic(structured.rationale),
        rationale_en: language === 'en' ? structured.rationale : await translateToEnglish(structured.rationale),
        confidence_score: structured.confidence,
        priority: structured.priority,
        model_version: 'gemini-2.5-flash',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();
    
    // 6. Log decision
    await supabaseClient.from('ai_decision_logs').insert({
      recommendation_id: savedRec.id,
      decision_type: 'advisory_generation',
      decision_data: { contextType, contextId, userRole },
      input_context: contextData,
      output_result: structured,
      model_version: 'gemini-2.5-flash',
      processing_time_ms: processingTime,
      token_usage: result.usage?.total_tokens || 0,
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        recommendation: savedRec,
        processingTime 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('AI Advisory Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
async function fetchContextData(client: any, contextType: string, contextId: string) {
  const tableMap = {
    'risk': 'grc_risks',
    'compliance': 'compliance_obligations',
    'audit': 'grc_audits',
    'campaign': 'awareness_campaigns',
    'incident': 'security_incidents',
    'policy': 'policies',
  };
  
  const { data } = await client
    .from(tableMap[contextType])
    .select('*')
    .eq('id', contextId)
    .single();
  
  return data;
}

function buildAdvisoryPrompt(contextType: string, userRole: string, language: string): string {
  const prompts = {
    ar: {
      risk: `أنت مستشار أمن معلومات خبير. قم بتحليل هذا الخطر وقدم توصيات عملية قابلة للتنفيذ.`,
      compliance: `أنت مستشار امتثال خبير. قم بتحليل هذا الالتزام وقدم خطوات واضحة للامتثال.`,
      incident: `أنت محلل أمني خبير. قم بتحليل هذا الحادث الأمني وقدم توصيات للاستجابة والوقاية.`,
    },
    en: {
      risk: `You are an expert information security advisor. Analyze this risk and provide actionable recommendations.`,
      compliance: `You are an expert compliance advisor. Analyze this obligation and provide clear compliance steps.`,
      incident: `You are an expert security analyst. Analyze this incident and provide response and prevention recommendations.`,
    }
  };
  
  return prompts[language][contextType] || prompts[language].risk;
}

function parseRecommendation(text: string, language: string) {
  // Extract priority, confidence from AI response
  // This is a simplified version - implement proper parsing
  return {
    text,
    rationale: 'Based on best practices and risk assessment',
    confidence: 0.85,
    priority: 'high',
  };
}

async function translateToArabic(text: string): Promise<string> {
  // Implement using Lovable AI translation if needed
  return text;
}

async function translateToEnglish(text: string): Promise<string> {
  // Implement using Lovable AI translation if needed
  return text;
}
```

#### Frontend Components
```typescript
// src/apps/ai-advisory/pages/AdvisoryDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/core/components/ui/card';
import { RecommendationCard } from '../components/RecommendationCard';
import { AdvisoryFilters } from '../components/AdvisoryFilters';

export function AdvisoryDashboard() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🤖 الاستشارات الذكية</h1>
        <AdvisoryFilters />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations?.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
```

#### Integration Layer
```typescript
// src/integrations/ai-advisory/advisory.integration.ts
import { supabase } from '@/integrations/supabase/client';

export interface Recommendation {
  id: string;
  contextType: string;
  contextId: string;
  recommendationAr: string;
  recommendationEn: string;
  confidenceScore: number;
  priority: string;
  status: string;
}

export async function getRecommendations(
  contextType?: string,
  contextId?: string
): Promise<Recommendation[]> {
  let query = supabase
    .from('ai_recommendations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (contextType) query = query.eq('context_type', contextType);
  if (contextId) query = query.eq('context_id', contextId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Recommendation[];
}

export async function generateRecommendation(
  contextType: string,
  contextId: string,
  userRole: string,
  language: 'ar' | 'en' = 'ar'
): Promise<Recommendation> {
  const { data, error } = await supabase.functions.invoke('ai-advisory', {
    body: { contextType, contextId, userRole, language }
  });
  
  if (error) throw error;
  return data.recommendation;
}

export async function acceptRecommendation(recommendationId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_recommendations')
    .update({ 
      status: 'accepted',
      acted_on_at: new Date().toISOString()
    })
    .eq('id', recommendationId);
  
  if (error) throw error;
}

export async function provideFeedback(
  recommendationId: string,
  score: number,
  comment?: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_recommendations')
    .update({ 
      feedback_score: score,
      feedback_comment: comment
    })
    .eq('id', recommendationId);
  
  if (error) throw error;
}
```

**تقدير الجهد:** 6 أسابيع  
**الموارد:** 2 مطورين + 1 AI Specialist  
**Dependencies:** Lovable AI API

---

### 📅 Week 1-4 (Parallel): M18.5 - SecOps Foundation (0% → 60%)
**الحالة الحالية:** ⏳ 0%  
**الأولوية:** 🚨 CRITICAL

#### Architecture
```
┌───────────────────────────────────────────────────────────┐
│            SecOps Management Platform                      │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │  Connectors │  │    Events    │  │  Incidents  │     │
│  │   Manager   │→ │   Processor  │→ │   Manager   │     │
│  └─────────────┘  └──────────────┘  └─────────────┘     │
│         ↓                ↓                  ↓             │
│  ┌─────────────────────────────────────────────────┐     │
│  │         Security Solutions Layer                 │     │
│  │  Firewall | DLP | MDM | Endpoint | SIEM | ...  │     │
│  └─────────────────────────────────────────────────┘     │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │  Playbooks  │  │    Threat    │  │  Analytics  │     │
│  │   Engine    │  │ Intelligence │  │   Engine    │     │
│  └─────────────┘  └──────────────┘  └─────────────┘     │
│                                                            │
└───────────────────────────────────────────────────────────┘
         ↕                    ↕                   ↕
┌────────────────┐  ┌───────────────┐  ┌───────────────┐
│      GRC       │  │   Awareness   │  │    Training   │
│   Integration  │  │  Integration  │  │  Integration  │
└────────────────┘  └───────────────┘  └───────────────┘
```

#### Database Schema
```sql
-- Security Solution Connectors
CREATE TABLE secops_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN (
    'firewall', 'dlp', 'mdm', 'endpoint_protection', 
    'siem', 'ids_ips', 'email_security', 'web_proxy',
    'cloud_security', 'network_monitoring', 'vulnerability_scanner'
  )),
  vendor TEXT NOT NULL,
  version TEXT,
  config JSONB NOT NULL, -- { apiUrl, authType, credentials, syncInterval, filters }
  status TEXT DEFAULT 'inactive' CHECK (status IN (
    'active', 'inactive', 'error', 'maintenance', 'testing'
  )),
  is_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error TEXT,
  sync_interval_minutes INT DEFAULT 15,
  health_check_interval_minutes INT DEFAULT 5,
  total_events_synced BIGINT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security Events
CREATE TABLE secops_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connector_id UUID NOT NULL REFERENCES secops_connectors(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'intrusion_attempt', 'malware_detected', 'data_leak_attempt',
    'policy_violation', 'unauthorized_access', 'suspicious_activity',
    'vulnerability_found', 'configuration_change', 'system_alert'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  source_system TEXT NOT NULL,
  source_ip TEXT,
  destination_ip TEXT,
  affected_user_id UUID,
  affected_asset TEXT,
  raw_data JSONB NOT NULL,
  normalized_data JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'investigating', 'escalated', 'resolved', 'false_positive', 'ignored'
  )),
  assigned_to UUID,
  incident_id UUID REFERENCES secops_incidents(id),
  tags TEXT[],
  threat_indicators JSONB, -- IOCs: IPs, domains, hashes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security Incidents (Enhanced M18)
CREATE TABLE secops_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  incident_number TEXT UNIQUE NOT NULL, -- AUTO: INC-2025-0001
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'phishing', 'malware', 'data_breach', 'ddos', 'ransomware',
    'insider_threat', 'policy_violation', 'system_compromise',
    'social_engineering', 'physical_security', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'containment', 'eradication',
    'recovery', 'resolved', 'closed', 'false_alarm'
  )),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  impact_assessment TEXT,
  root_cause TEXT,
  reported_by UUID NOT NULL,
  assigned_to UUID,
  security_team_lead UUID,
  occurred_at TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  reported_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  sla_response_deadline TIMESTAMPTZ,
  sla_resolution_deadline TIMESTAMPTZ,
  affected_systems TEXT[],
  affected_users UUID[],
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  linked_events UUID[], -- References to secops_security_events
  linked_risks UUID[], -- References to grc_risks
  linked_policies UUID[], -- References to policies
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Incident Response Playbooks
CREATE TABLE secops_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  playbook_type TEXT NOT NULL CHECK (playbook_type IN (
    'incident_response', 'threat_hunting', 'automated_remediation', 'investigation'
  )),
  trigger_conditions JSONB NOT NULL, -- { eventType, severity, sourceSystem }
  is_automated BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 50,
  steps JSONB NOT NULL, -- [{ order, action, params, timeoutMinutes }]
  success_criteria JSONB,
  rollback_steps JSONB,
  estimated_duration_minutes INT,
  required_permissions TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Playbook Executions
CREATE TABLE secops_playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  playbook_id UUID NOT NULL REFERENCES secops_playbooks(id),
  incident_id UUID REFERENCES secops_incidents(id),
  event_id UUID REFERENCES secops_security_events(id),
  execution_type TEXT DEFAULT 'manual' CHECK (execution_type IN ('manual', 'automated', 'scheduled')),
  status TEXT DEFAULT 'running' CHECK (status IN (
    'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'
  )),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  current_step INT DEFAULT 1,
  total_steps INT NOT NULL,
  steps_log JSONB, -- [{ step, status, startTime, endTime, output, error }]
  executed_by UUID NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Threat Intelligence
CREATE TABLE secops_threat_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  indicator_type TEXT NOT NULL CHECK (indicator_type IN (
    'ip_address', 'domain', 'url', 'file_hash', 'email', 'cve'
  )),
  indicator_value TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'malware', 'phishing', 'c2_server', 'botnet', 'vulnerability', 'exploit'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description_ar TEXT,
  description_en TEXT,
  source TEXT NOT NULL, -- 'internal', 'threat_feed', 'manual'
  confidence_score NUMERIC(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  related_events UUID[], -- References to secops_security_events
  related_incidents UUID[], -- References to secops_incidents
  ttps TEXT[], -- MITRE ATT&CK TTPs
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Indexes
CREATE INDEX idx_secops_connectors_tenant ON secops_connectors(tenant_id);
CREATE INDEX idx_secops_connectors_type_status ON secops_connectors(connector_type, status);

CREATE INDEX idx_secops_events_tenant_occurred ON secops_security_events(tenant_id, occurred_at DESC);
CREATE INDEX idx_secops_events_severity_status ON secops_security_events(severity, status);
CREATE INDEX idx_secops_events_connector ON secops_security_events(connector_id);
CREATE INDEX idx_secops_events_incident ON secops_security_events(incident_id);
CREATE INDEX idx_secops_events_affected_user ON secops_security_events(affected_user_id);

CREATE INDEX idx_secops_incidents_tenant_occurred ON secops_incidents(tenant_id, occurred_at DESC);
CREATE INDEX idx_secops_incidents_status_severity ON secops_incidents(status, severity);
CREATE INDEX idx_secops_incidents_number ON secops_incidents(incident_number);
CREATE INDEX idx_secops_incidents_assigned ON secops_incidents(assigned_to);

CREATE INDEX idx_secops_playbooks_tenant_type ON secops_playbooks(tenant_id, playbook_type);
CREATE INDEX idx_secops_playbook_executions_incident ON secops_playbook_executions(incident_id);

CREATE INDEX idx_secops_threat_intel_indicator ON secops_threat_intelligence(indicator_type, indicator_value);
CREATE INDEX idx_secops_threat_intel_active ON secops_threat_intelligence(is_active, threat_type);

-- Enable RLS
ALTER TABLE secops_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE secops_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE secops_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE secops_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE secops_playbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE secops_threat_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Multi-tenant isolation)
CREATE POLICY "Tenant isolation - connectors"
  ON secops_connectors FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - events"
  ON secops_security_events FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - incidents"
  ON secops_incidents FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - playbooks"
  ON secops_playbooks FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - executions"
  ON secops_playbook_executions FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - threat intel"
  ON secops_threat_intelligence FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Auto-generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  seq INT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 10) AS INT)), 0) + 1
  INTO seq
  FROM secops_incidents
  WHERE tenant_id = NEW.tenant_id
    AND incident_number LIKE 'INC-' || year || '%';
  
  NEW.incident_number := 'INC-' || year || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_incident_number
  BEFORE INSERT ON secops_incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();
```

#### App Structure
```
src/apps/secops/
├── config.ts                      # App configuration & routes
├── pages/
│   ├── SecOpsDashboard.tsx       # Main dashboard
│   ├── ConnectorsPage.tsx        # Manage connectors
│   ├── SecurityEventsPage.tsx    # Events list & filters
│   ├── IncidentsPage.tsx         # Incidents board
│   ├── PlaybooksPage.tsx         # Playbooks management
│   ├── ThreatIntelPage.tsx       # Threat intelligence
│   └── AnalyticsPage.tsx         # SecOps analytics
├── components/
│   ├── connectors/
│   │   ├── ConnectorCard.tsx
│   │   ├── ConnectorForm.tsx
│   │   ├── ConnectorHealth.tsx
│   │   └── ConnectorTestDialog.tsx
│   ├── events/
│   │   ├── SecurityEventCard.tsx
│   │   ├── EventTimeline.tsx
│   │   ├── EventFilters.tsx
│   │   └── EventEscalateDialog.tsx
│   ├── incidents/
│   │   ├── IncidentBoard.tsx
│   │   ├── IncidentCard.tsx
│   │   ├── IncidentForm.tsx
│   │   ├── IncidentTimeline.tsx
│   │   └── IncidentSLABadge.tsx
│   ├── playbooks/
│   │   ├── PlaybookList.tsx
│   │   ├── PlaybookEditor.tsx
│   │   ├── PlaybookExecutionLog.tsx
│   │   └── PlaybookTriggerConfig.tsx
│   └── threat-intel/
│       ├── ThreatIndicatorCard.tsx
│       ├── ThreatFeedList.tsx
│       └── IOCSearch.tsx
└── hooks/
    ├── useConnectors.ts
    ├── useSecurityEvents.ts
    ├── useIncidents.ts
    ├── usePlaybooks.ts
    └── useThreatIntel.ts

src/integrations/secops/
├── connectors/
│   ├── base-connector.ts         # Abstract base class
│   ├── firewall-connector.ts
│   ├── dlp-connector.ts
│   ├── mdm-connector.ts
│   ├── endpoint-connector.ts
│   └── connector-factory.ts      # Factory pattern
├── events.integration.ts
├── incidents.integration.ts
├── playbooks.integration.ts
└── threat-intel.integration.ts
```

#### Integration Layer - Base Connector
```typescript
// src/integrations/secops/connectors/base-connector.ts
export interface ConnectorConfig {
  id: string;
  connectorType: string;
  vendor: string;
  apiUrl: string;
  authType: 'api_key' | 'oauth2' | 'basic_auth';
  credentials: Record<string, string>;
  syncInterval: number;
  filters?: Record<string, any>;
}

export interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  sourceSystem: string;
  sourceIp?: string;
  destinationIp?: string;
  affectedAsset?: string;
  occurredAt: string;
  rawData: Record<string, any>;
}

export abstract class BaseSecurityConnector {
  protected config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  /**
   * Test connection to security solution
   */
  abstract connect(): Promise<boolean>;

  /**
   * Pull security events from solution
   */
  abstract pullEvents(since: Date): Promise<SecurityEvent[]>;

  /**
   * Health check
   */
  abstract healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
    lastSync?: Date;
  }>;

  /**
   * Push event to security solution (optional)
   */
  async pushEvent?(event: SecurityEvent): Promise<void>;

  /**
   * Setup webhook endpoint (optional)
   */
  async setupWebhook?(webhookUrl: string): Promise<void>;

  /**
   * Normalize raw event data to standard format
   */
  protected abstract normalizeEvent(rawEvent: any): SecurityEvent;
}
```

#### Example: Firewall Connector
```typescript
// src/integrations/secops/connectors/firewall-connector.ts
import { BaseSecurityConnector, SecurityEvent } from './base-connector';

export class FirewallConnector extends BaseSecurityConnector {
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/status`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Firewall connection failed:', error);
      return false;
    }
  }

  async pullEvents(since: Date): Promise<SecurityEvent[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/logs?since=${since.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
        },
      }
    );

    const rawEvents = await response.json();
    return rawEvents.map(event => this.normalizeEvent(event));
  }

  async healthCheck() {
    const isConnected = await this.connect();
    return {
      status: isConnected ? 'healthy' as const : 'unhealthy' as const,
      message: isConnected ? 'Connected successfully' : 'Connection failed',
    };
  }

  protected normalizeEvent(rawEvent: any): SecurityEvent {
    return {
      eventType: this.mapEventType(rawEvent.type),
      severity: this.mapSeverity(rawEvent.severity),
      titleAr: `محاولة اختراق من ${rawEvent.source_ip}`,
      titleEn: `Intrusion attempt from ${rawEvent.source_ip}`,
      descriptionAr: rawEvent.message,
      descriptionEn: rawEvent.message,
      sourceSystem: this.config.vendor,
      sourceIp: rawEvent.source_ip,
      destinationIp: rawEvent.dest_ip,
      affectedAsset: rawEvent.dest_ip,
      occurredAt: rawEvent.timestamp,
      rawData: rawEvent,
    };
  }

  private mapEventType(type: string): string {
    const mapping: Record<string, string> = {
      'intrusion': 'intrusion_attempt',
      'blocked': 'unauthorized_access',
      'malicious': 'suspicious_activity',
    };
    return mapping[type] || 'system_alert';
  }

  private mapSeverity(severity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (severity >= 8) return 'critical';
    if (severity >= 6) return 'high';
    if (severity >= 4) return 'medium';
    return 'low';
  }
}
```

#### Example: DLP Connector
```typescript
// src/integrations/secops/connectors/dlp-connector.ts
import { BaseSecurityConnector, SecurityEvent } from './base-connector';

export class DLPConnector extends BaseSecurityConnector {
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        headers: {
          'X-API-Key': this.config.credentials.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<SecurityEvent[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/incidents?from=${since.toISOString()}`,
      {
        headers: {
          'X-API-Key': this.config.credentials.apiKey,
        },
      }
    );

    const rawEvents = await response.json();
    return rawEvents.incidents.map(event => this.normalizeEvent(event));
  }

  async healthCheck() {
    const isConnected = await this.connect();
    return {
      status: isConnected ? 'healthy' as const : 'unhealthy' as const,
    };
  }

  async setupWebhook(webhookUrl: string): Promise<void> {
    await fetch(`${this.config.apiUrl}/api/webhooks`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.credentials.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['data_leak', 'policy_violation'],
      }),
    });
  }

  protected normalizeEvent(rawEvent: any): SecurityEvent {
    return {
      eventType: 'data_leak_attempt',
      severity: this.mapSeverity(rawEvent.risk_level),
      titleAr: `محاولة تسريب بيانات من ${rawEvent.user_email}`,
      titleEn: `Data leak attempt by ${rawEvent.user_email}`,
      descriptionAr: `تم رصد محاولة لنقل ${rawEvent.file_size} من البيانات الحساسة`,
      descriptionEn: `Detected attempt to transfer ${rawEvent.file_size} of sensitive data`,
      sourceSystem: 'DLP',
      affectedAsset: rawEvent.file_name,
      occurredAt: rawEvent.detected_at,
      rawData: rawEvent,
    };
  }

  private mapSeverity(riskLevel: string): 'low' | 'medium' | 'high' | 'critical' {
    const mapping: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical',
    };
    return mapping[riskLevel.toLowerCase()] || 'medium';
  }
}
```

#### Connector Factory
```typescript
// src/integrations/secops/connectors/connector-factory.ts
import { BaseSecurityConnector } from './base-connector';
import { FirewallConnector } from './firewall-connector';
import { DLPConnector } from './dlp-connector';
import { MDMConnector } from './mdm-connector';
import { EndpointConnector } from './endpoint-connector';

export class ConnectorFactory {
  static create(config: ConnectorConfig): BaseSecurityConnector {
    switch (config.connectorType) {
      case 'firewall':
        return new FirewallConnector(config);
      case 'dlp':
        return new DLPConnector(config);
      case 'mdm':
        return new MDMConnector(config);
      case 'endpoint_protection':
        return new EndpointConnector(config);
      default:
        throw new Error(`Unknown connector type: ${config.connectorType}`);
    }
  }
}
```

**تقدير الجهد:** 4 أسابيع (بالتوازي مع M16)  
**الموارد:** 2 مطورين  
**Dependencies:** None

---

### 📅 Week 7-12: M17 - Knowledge Hub + RAG (0% → 100%)
**الحالة الحالية:** ⏳ 0%  
**الأولوية:** HIGH

#### Architecture
```
┌─────────────────────────────────────────┐
│       Knowledge Hub + RAG Engine        │
├─────────────────────────────────────────┤
│  • Document Indexing                    │
│  • Vector Embeddings (Lovable AI)      │
│  • Semantic Search                      │
│  • RAG Query Engine                     │
│  • Context-Aware Answers (AR/EN)       │
│  • Auto-Tagging & Classification        │
└─────────────────────────────────────────┘
```

#### Database Schema
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Articles
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  article_type TEXT CHECK (article_type IN (
    'policy', 'procedure', 'guideline', 'faq', 
    'best_practice', 'case_study', 'regulation'
  )),
  category TEXT,
  tags TEXT[],
  keywords TEXT[],
  version INT DEFAULT 1,
  status TEXT DEFAULT 'published' CHECK (status IN (
    'draft', 'review', 'published', 'archived'
  )),
  author_id UUID NOT NULL,
  reviewer_id UUID,
  published_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  related_articles UUID[],
  source_document_id UUID, -- Link to documents table
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vector Embeddings (for RAG)
CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  article_id UUID REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_lang TEXT CHECK (chunk_lang IN ('ar', 'en')),
  chunk_index INT NOT NULL,
  embedding vector(1536), -- OpenAI/Gemini embedding size
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Query History (for improving RAG)
CREATE TABLE knowledge_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL,
  query_text TEXT NOT NULL,
  query_lang TEXT CHECK (query_lang IN ('ar', 'en')),
  matched_articles UUID[],
  response_text TEXT,
  response_quality_score INT CHECK (response_quality_score BETWEEN 1 AND 5),
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Indexes
CREATE INDEX idx_knowledge_articles_tenant ON knowledge_articles(tenant_id);
CREATE INDEX idx_knowledge_articles_type_status ON knowledge_articles(article_type, status);
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX idx_knowledge_embeddings_article ON knowledge_embeddings(article_id);
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenant isolation - articles"
  ON knowledge_articles FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - embeddings"
  ON knowledge_embeddings FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Tenant isolation - queries"
  ON knowledge_queries FOR ALL
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);
```

#### Edge Function - RAG Query
```typescript
// supabase/functions/knowledge-rag/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, language = 'ar', tenantId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const startTime = Date.now();

    // 1. Generate embedding for query using Lovable AI
    const queryEmbedding = await generateEmbedding(query, LOVABLE_API_KEY);
    
    // 2. Vector similarity search (find top 5 most relevant chunks)
    const { data: relevantChunks, error: searchError } = await supabaseClient.rpc(
      'match_knowledge_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_tenant_id: tenantId,
        filter_lang: language
      }
    );

    if (searchError) throw searchError;

    // 3. Build context from chunks
    const context = relevantChunks
      .map((chunk: any) => chunk.chunk_text)
      .join('\n\n');

    // 4. Get article metadata for matched chunks
    const articleIds = [...new Set(relevantChunks.map((c: any) => c.article_id))];
    const { data: articles } = await supabaseClient
      .from('knowledge_articles')
      .select('id, title_ar, title_en, article_type')
      .in('id', articleIds);

    // 5. Generate answer using RAG with Lovable AI
    const systemPrompt = language === 'ar' 
      ? 'أنت مساعد ذكي متخصص في الأمن السيبراني. أجب على السؤال بناءً على المحتوى المقدم فقط. إذا لم تجد الإجابة في المحتوى، قل ذلك بوضوح.'
      : 'You are an intelligent assistant specializing in cybersecurity. Answer the question based only on the provided content. If you cannot find the answer in the content, state that clearly.';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Context:\n${context}\n\nQuestion: ${query}\n\nProvide a comprehensive answer with references to specific policies or procedures when applicable.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });
    
    const result = await response.json();
    const answer = result.choices[0].message.content;
    const processingTime = Date.now() - startTime;
    
    // 6. Log query for analytics
    await supabaseClient.from('knowledge_queries').insert({
      tenant_id: tenantId,
      user_id: req.headers.get('x-user-id'),
      query_text: query,
      query_lang: language,
      matched_articles: articleIds,
      response_text: answer,
      processing_time_ms: processingTime,
    });
    
    return new Response(
      JSON.stringify({ 
        answer,
        sources: articles,
        relevanceScores: relevantChunks.map((c: any) => c.similarity),
        processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('RAG Query Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: text,
    }),
  });
  
  const result = await response.json();
  return result.data[0].embedding;
}
```

#### Database Function - Vector Search
```sql
-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_tenant_id uuid DEFAULT NULL,
  filter_lang text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  article_id uuid,
  chunk_text text,
  chunk_lang text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.article_id,
    ke.chunk_text,
    ke.chunk_lang,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  WHERE 
    (filter_tenant_id IS NULL OR ke.tenant_id = filter_tenant_id)
    AND (filter_lang IS NULL OR ke.chunk_lang = filter_lang)
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**تقدير الجهد:** 6 أسابيع  
**الموارد:** 2 مطورين + 1 AI Specialist  
**Dependencies:** pgvector extension, Lovable AI

---

## 🎯 Quarter 5 (Q1 2026) - "Intelligence Expansion + SecOps Integration"
**المدة:** 3 أشهر (Oct - Dec 2025)  
**الهدف:** إكمال Phase 4 + تفعيل تكامل SecOps الكامل  
**الأولوية:** HIGH

---

### 📅 Week 1-6: M18 - Incident Response + SecOps Integration (10% → 100%)
**الحالة الحالية:** ⏳ 10%  
**الأولوية:** 🚨 CRITICAL

#### المطلوب
1. **إكمال UI للحوادث الأمنية:**
   - `IncidentBoard.tsx` - لوحة كانبان للحوادث
   - `IncidentForm.tsx` - نموذج إنشاء وتعديل الحوادث
   - `IncidentTimeline.tsx` - جدول زمني لتطور الحادث
   - `IncidentSLATracker.tsx` - متابعة SLA

2. **Edge Function - Event Auto-Sync:**
```typescript
// supabase/functions/secops-sync/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ConnectorFactory } from './connectors/connector-factory.ts';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Get all active connectors
    const { data: connectors } = await supabaseClient
      .from('secops_connectors')
      .select('*')
      .eq('status', 'active')
      .eq('is_enabled', true);

    const results = [];

    // 2. Sync events from each connector
    for (const connectorConfig of connectors) {
      try {
        const connector = ConnectorFactory.create(connectorConfig);
        
        // Calculate since time based on last sync
        const since = connectorConfig.last_sync_at 
          ? new Date(connectorConfig.last_sync_at)
          : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

        // Pull events
        const events = await connector.pullEvents(since);

        // 3. Store events in database
        if (events.length > 0) {
          const { data: savedEvents, error } = await supabaseClient
            .from('secops_security_events')
            .insert(
              events.map(event => ({
                connector_id: connectorConfig.id,
                tenant_id: connectorConfig.tenant_id,
                ...event,
              }))
            )
            .select();

          if (!error) {
            // 4. Update connector sync status
            await supabaseClient
              .from('secops_connectors')
              .update({
                last_sync_at: new Date().toISOString(),
                last_sync_status: 'success',
                total_events_synced: connectorConfig.total_events_synced + events.length,
              })
              .eq('id', connectorConfig.id);

            // 5. Check for critical events → Auto-create incidents
            const criticalEvents = savedEvents.filter(e => e.severity === 'critical');
            for (const criticalEvent of criticalEvents) {
              await createIncidentFromEvent(supabaseClient, criticalEvent);
            }

            // 6. Trigger playbooks if conditions match
            await triggerPlaybooks(supabaseClient, savedEvents);

            results.push({
              connectorId: connectorConfig.id,
              eventsCount: events.length,
              status: 'success'
            });
          }
        }
      } catch (error) {
        console.error(`Sync failed for connector ${connectorConfig.id}:`, error);
        
        await supabaseClient
          .from('secops_connectors')
          .update({
            last_sync_status: 'error',
            last_error: error.message,
          })
          .eq('id', connectorConfig.id);

        results.push({
          connectorId: connectorConfig.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SecOps Sync Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function createIncidentFromEvent(client: any, event: any) {
  const { data: incident } = await client
    .from('secops_incidents')
    .insert({
      tenant_id: event.tenant_id,
      incident_type: event.event_type,
      severity: event.severity,
      title_ar: event.title_ar,
      title_en: event.title_en,
      description_ar: event.description_ar,
      description_en: event.description_en,
      occurred_at: event.occurred_at,
      reported_by: event.affected_user_id || 'system',
      status: 'open',
      linked_events: [event.id],
    })
    .select()
    .single();

  // Update event with incident reference
  await client
    .from('secops_security_events')
    .update({ incident_id: incident.id, status: 'escalated' })
    .eq('id', event.id);

  return incident;
}

async function triggerPlaybooks(client: any, events: any[]) {
  // Get all active playbooks
  const { data: playbooks } = await client
    .from('secops_playbooks')
    .select('*')
    .eq('is_enabled', true)
    .eq('is_automated', true);

  for (const event of events) {
    for (const playbook of playbooks) {
      if (matchesTriggerConditions(event, playbook.trigger_conditions)) {
        // Execute playbook automatically
        await client.from('secops_playbook_executions').insert({
          tenant_id: event.tenant_id,
          playbook_id: playbook.id,
          event_id: event.id,
          execution_type: 'automated',
          status: 'pending',
          total_steps: playbook.steps.length,
          executed_by: 'system',
        });
        
        // Trigger edge function to execute playbook steps
        await client.functions.invoke('secops-playbook-executor', {
          body: { playbookId: playbook.id, eventId: event.id }
        });
      }
    }
  }
}

function matchesTriggerConditions(event: any, conditions: any): boolean {
  if (conditions.eventType && event.event_type !== conditions.eventType) return false;
  if (conditions.severity && event.severity !== conditions.severity) return false;
  if (conditions.sourceSystem && event.source_system !== conditions.sourceSystem) return false;
  return true;
}
```

3. **Edge Function - Webhook Receiver:**
```typescript
// supabase/functions/secops-webhook-receiver/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { connectorId, events, signature } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Verify webhook signature
    const { data: connector } = await supabaseClient
      .from('secops_connectors')
      .select('*')
      .eq('id', connectorId)
      .single();

    if (!verifySignature(signature, connector.config.webhookSecret)) {
      return new Response('Invalid signature', { status: 401 });
    }

    // 2. Store events
    const { data: savedEvents } = await supabaseClient
      .from('secops_security_events')
      .insert(
        events.map((event: any) => ({
          connector_id: connectorId,
          tenant_id: connector.tenant_id,
          ...normalizeWebhookEvent(event, connector.connector_type),
        }))
      )
      .select();

    // 3. Trigger automated workflows
    for (const event of savedEvents) {
      if (event.severity === 'critical' || event.severity === 'high') {
        await triggerPlaybooks(supabaseClient, [event]);
      }
    }

    return new Response(JSON.stringify({ received: events.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function verifySignature(signature: string, secret: string): boolean {
  // Implement HMAC verification
  return true; // Simplified
}

function normalizeWebhookEvent(rawEvent: any, connectorType: string): any {
  // Normalize based on connector type
  return rawEvent;
}
```

4. **Integration with GRC Module:**
```typescript
// src/integrations/secops/grc-integration.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Link security incident to GRC risk
 */
export async function linkIncidentToRisk(
  incidentId: string,
  riskId: string
): Promise<void> {
  // 1. Get incident details
  const { data: incident } = await supabase
    .from('secops_incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  // 2. Update risk impact assessment
  const { data: risk } = await supabase
    .from('grc_risks')
    .select('*')
    .eq('id', riskId)
    .single();

  // 3. Increase risk likelihood if incident occurred
  await supabase
    .from('grc_risks')
    .update({
      likelihood_score: Math.min(risk.likelihood_score + 1, 5),
      metadata: {
        ...risk.metadata,
        recent_incidents: [...(risk.metadata?.recent_incidents || []), incidentId]
      }
    })
    .eq('id', riskId);

  // 4. Link in incident
  await supabase
    .from('secops_incidents')
    .update({
      linked_risks: [...(incident.linked_risks || []), riskId]
    })
    .eq('id', incidentId);
}

/**
 * Auto-create risk from repeated incidents
 */
export async function createRiskFromIncidentPattern(
  incidentIds: string[]
): Promise<string> {
  const { data: incidents } = await supabase
    .from('secops_incidents')
    .select('*')
    .in('id', incidentIds);

  // Analyze pattern
  const incidentType = incidents[0].incident_type;
  const avgSeverity = calculateAverageSeverity(incidents);

  // Create new risk
  const { data: risk } = await supabase
    .from('grc_risks')
    .insert({
      risk_name_ar: `خطر متكرر: ${incidentType}`,
      risk_name_en: `Recurring Risk: ${incidentType}`,
      risk_type: 'operational',
      likelihood_score: 4,
      impact_score: avgSeverity === 'critical' ? 5 : 3,
      risk_level: 'high',
      source: 'incident_analysis',
      status: 'open',
    })
    .select()
    .single();

  return risk.id;
}
```

5. **Integration with Awareness Module:**
```typescript
// src/integrations/secops/awareness-integration.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Create targeted awareness campaign from security incident
 */
export async function createCampaignFromIncident(
  incidentId: string,
  affectedUserIds: string[]
): Promise<string> {
  const { data: incident } = await supabase
    .from('secops_incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  // Determine campaign content based on incident type
  const campaignContent = mapIncidentToCampaignContent(incident.incident_type);

  // Create immediate awareness campaign
  const { data: campaign } = await supabase
    .from('awareness_campaigns')
    .insert({
      name: `حملة توعية طارئة: ${incident.title_ar}`,
      description: `بناءً على الحادث الأمني ${incident.incident_number}`,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'active',
      target_audience: affectedUserIds,
      content_type: campaignContent.type,
      priority: incident.severity === 'critical' ? 'urgent' : 'high',
    })
    .select()
    .single();

  return campaign.id;
}

function mapIncidentToCampaignContent(incidentType: string) {
  const mapping: Record<string, any> = {
    'phishing': {
      type: 'phishing_awareness',
      duration: 7,
      modules: ['identify_phishing', 'report_suspicious'],
    },
    'malware': {
      type: 'safe_browsing',
      duration: 5,
      modules: ['download_safety', 'malware_detection'],
    },
    'data_breach': {
      type: 'data_protection',
      duration: 10,
      modules: ['data_classification', 'secure_sharing'],
    },
  };
  return mapping[incidentType] || mapping['phishing'];
}
```

**تقدير الجهد:** 6 أسابيع  
**الموارد:** 2 مطورين + 1 Security Expert  
**Dependencies:** M18.5 SecOps Foundation

---

### 📅 Week 5-8 (Parallel): M20 - Threat Intelligence (0% → 100%)
**الحالة الحالية:** ⏳ 0%  
**الأولوية:** MEDIUM

#### المطلوب
1. **Threat Feed Integration:**
   - Connect to external threat intelligence feeds (OSINT)
   - Auto-import IOCs (IP addresses, domains, file hashes)
   - Correlation with internal events

2. **IOC Management:**
```typescript
// src/integrations/secops/threat-intel.integration.ts
import { supabase } from '@/integrations/supabase/client';

export interface IOC {
  indicatorType: 'ip_address' | 'domain' | 'url' | 'file_hash' | 'email';
  indicatorValue: string;
  threatType: string;
  severity: string;
  source: string;
  confidenceScore: number;
}

export async function addThreatIndicator(ioc: IOC): Promise<void> {
  const { data: existing } = await supabase
    .from('secops_threat_intelligence')
    .select('*')
    .eq('indicator_value', ioc.indicatorValue)
    .single();

  if (existing) {
    // Update confidence if new source
    await supabase
      .from('secops_threat_intelligence')
      .update({
        confidence_score: Math.min(existing.confidence_score + 0.1, 1),
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('secops_threat_intelligence').insert({
      ...ioc,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });
  }
}

export async function checkIOCMatch(
  value: string,
  type: string
): Promise<{ isMatch: boolean; threat?: any }> {
  const { data: threat } = await supabase
    .from('secops_threat_intelligence')
    .select('*')
    .eq('indicator_value', value)
    .eq('indicator_type', type)
    .eq('is_active', true)
    .single();

  return {
    isMatch: !!threat,
    threat,
  };
}
```

3. **Edge Function - IOC Enrichment:**
```typescript
// supabase/functions/threat-intel-enrichment/index.ts
serve(async (req) => {
  const { iocValue, iocType } = await req.json();
  
  // Query multiple threat intelligence sources
  const sources = [
    'https://otx.alienvault.com/api/v1',
    'https://www.virustotal.com/api/v3',
    // Add more sources
  ];

  const enrichedData = await Promise.all(
    sources.map(source => queryThreatFeed(source, iocValue, iocType))
  );

  return new Response(JSON.stringify({ enrichedData }));
});
```

**تقدير الجهد:** 4 أسابيع (بالتوازي)  
**الموارد:** 1 مطور + 1 Threat Analyst

---

### 📅 Week 7-12: M19 - Predictive Analytics (0% → 100%)
**الحالة الحالية:** ⏳ 0%  
**الأولوية:** MEDIUM

#### المطلوب
1. **Risk Prediction Models:**
   - Historical risk analysis
   - Likelihood forecasting
   - Impact prediction

2. **Compliance Trends:**
   - Predict compliance gaps
   - Forecast audit findings
   - SLA violation predictions

3. **Campaign Effectiveness:**
   - Predict user engagement
   - Forecast completion rates
   - Optimize timing and content

4. **Edge Function - Predictions:**
```typescript
// supabase/functions/predictive-analytics/index.ts
serve(async (req) => {
  const { analysisType, timeframe, tenantId } = await req.json();
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const supabaseClient = createClient(/*...*/);

  // 1. Fetch historical data
  const historicalData = await fetchHistoricalData(
    supabaseClient,
    analysisType,
    tenantId
  );

  // 2. Prepare data for analysis
  const features = extractFeatures(historicalData);
  
  // 3. Call Lovable AI for predictions
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: "You are a predictive analytics expert. Analyze the provided data and generate forecasts."
        },
        { 
          role: "user", 
          content: `Historical Data:\n${JSON.stringify(features, null, 2)}\n\nGenerate predictions for the next ${timeframe}.`
        }
      ],
      temperature: 0.1,
    }),
  });
  
  const result = await response.json();
  const predictions = parsePredictions(result.choices[0].message.content);
  
  // 4. Store predictions
  await supabaseClient.from('predictive_forecasts').insert({
    tenant_id: tenantId,
    analysis_type: analysisType,
    timeframe,
    predictions,
    confidence_score: predictions.confidence,
    model_version: 'gemini-2.5-flash',
  });
  
  return new Response(JSON.stringify({ predictions }));
});
```

**تقدير الجهد:** 6 أسابيع  
**الموارد:** 1 مطور + 1 Data Scientist

---

## 📋 Implementation Checklist

### Q4 2025 - Intelligence Layer + SecOps Foundation
- [ ] **Week 1-2:** Setup M16 database + Edge Function skeleton
- [ ] **Week 3-4:** Implement AI Advisory core logic + Frontend
- [ ] **Week 5-6:** Testing & Refinement M16
- [ ] **Week 1-2 (Parallel):** Setup M18.5 database + Connector interfaces
- [ ] **Week 3-4 (Parallel):** Implement Firewall + DLP connectors
- [ ] **Week 7-8:** Setup M17 database + pgvector
- [ ] **Week 9-10:** Implement RAG Engine + Vector search
- [ ] **Week 11-12:** Build Knowledge Hub UI + Testing

### Q1 2026 - Intelligence Expansion + SecOps Integration
- [ ] **Week 1-2:** Complete Incident Management UI
- [ ] **Week 3-4:** Implement Auto-Sync Edge Function
- [ ] **Week 5-6:** Build Playbooks Engine + Execution
- [ ] **Week 5-6 (Parallel):** IOC Management + Threat Feed Integration
- [ ] **Week 7-8 (Parallel):** IOC Enrichment + Correlation
- [ ] **Week 7-8:** Historical Data Pipeline for M19
- [ ] **Week 9-10:** Implement Prediction Models
- [ ] **Week 11-12:** Integrate with GRC + Awareness + Testing

---

## 🔗 Integration Matrix

| Module | GRC | Awareness | Training | LMS | SecOps |
|--------|-----|-----------|----------|-----|--------|
| **M16 - AI Advisory** | ✅ Risk recommendations | ✅ Campaign suggestions | ✅ Course recommendations | ✅ Learning paths | ✅ Incident analysis |
| **M17 - Knowledge Hub** | ✅ Policy search | ✅ Content library | ✅ Training materials | ✅ Course content | ✅ Playbook templates |
| **M18 - Incident Response** | ✅ Risk creation | ✅ Targeted campaigns | ✅ Mandatory training | - | ✅ Core module |
| **M18.5 - SecOps** | ✅ Risk linking | ✅ Awareness triggers | - | - | ✅ Core module |
| **M19 - Predictive Analytics** | ✅ Risk forecasting | ✅ Engagement prediction | ✅ Completion rates | ✅ Learning analytics | ✅ Threat trends |
| **M20 - Threat Intelligence** | ✅ Risk indicators | ✅ Threat awareness | - | - | ✅ IOC correlation |

---

## 🎯 Success Metrics (KPIs)

### M16 - AI Advisory
- **Recommendation Acceptance Rate:** ≥ 70%
- **Average Confidence Score:** ≥ 0.80
- **Decision Implementation Rate:** ≥ 60%
- **User Satisfaction:** ≥ 4/5

### M17 - Knowledge Hub
- **Query Response Time:** ≤ 2s
- **Answer Relevance Score:** ≥ 85%
- **User Helpfulness Rating:** ≥ 80%
- **Articles Created:** ≥ 100 in first 3 months

### M18 - Incident Response
- **Mean Time to Detect (MTTD):** ≤ 15 minutes
- **Mean Time to Respond (MTTR):** ≤ 4 hours
- **Incident Resolution Rate:** ≥ 95%
- **SLA Compliance:** ≥ 90%

### M18.5 - SecOps Integration
- **Connector Uptime:** ≥ 99%
- **Event Sync Latency:** ≤ 5 minutes
- **Auto-Escalation Accuracy:** ≥ 85%
- **Playbook Execution Success Rate:** ≥ 90%

### M19 - Predictive Analytics
- **Prediction Accuracy:** ≥ 75%
- **Forecast Horizon:** 30-90 days
- **Risk Prediction Precision:** ≥ 80%
- **False Positive Rate:** ≤ 20%

### M20 - Threat Intelligence
- **IOC Match Rate:** ≥ 90%
- **Threat Detection Improvement:** +30%
- **Feed Integration Count:** ≥ 3 sources
- **IOC Database Size:** ≥ 10,000 indicators

---

## 🚧 Technical Dependencies

### Infrastructure
- ✅ Lovable Cloud (Supabase)
- ✅ Lovable AI API
- ⚠️ pgvector extension (for M17)
- ⚠️ Cron jobs for sync (M18.5)
- ⚠️ Webhook endpoints (M18.5)

### External APIs
- ⚠️ Firewall vendor APIs
- ⚠️ DLP vendor APIs
- ⚠️ MDM vendor APIs
- ⚠️ Endpoint Protection APIs
- ⚠️ Threat Intelligence Feeds (OSINT)

### Skills Required
- **AI/ML Specialist:** RAG, embeddings, predictions
- **Security Expert:** Incident response, threat intel
- **Backend Developer:** Edge functions, connectors
- **Frontend Developer:** React, dashboards, forms

---

## 💰 تقدير الموارد

### Team Size
- **Senior Full-Stack Developer:** 2 FTE
- **AI/ML Specialist:** 0.5 FTE
- **Security Expert:** 0.5 FTE
- **Data Scientist:** 0.25 FTE (for M19)
- **QA Engineer:** 0.5 FTE

### Timeline
- **Q4 2025:** 3 months
- **Q1 2026:** 3 months
- **Total:** 6 months

### Estimated Cost
- **Development:** ~$180,000 (6 months × $30K/month avg)
- **External APIs:** ~$2,000/month
- **Lovable AI Usage:** ~$500/month
- **Testing & QA:** ~$10,000

**Total Estimated Budget:** ~$195,000

---

## 🔄 الخطوات التالية

### Immediate Actions (Next 7 Days)
1. ✅ مراجعة الوثيقة والموافقة عليها
2. ⏳ تحديد الفريق المسؤول
3. ⏳ إعداد بيئة التطوير (Lovable Cloud)
4. ⏳ إنشاء المهام في نظام إدارة المشاريع
5. ⏳ بدء Phase 1: M16 Foundation

### Week 1-2
- Setup databases (M16 + M18.5)
- Create Edge Function skeletons
- Design UI mockups
- Define API contracts

### Week 3-4
- Implement core logic
- Build initial UI components
- Write integration tests
- Deploy to staging

---

## 📝 Notes & Assumptions

1. **Lovable AI Availability:** نفترض توفر Lovable AI بدون قيود على الاستخدام
2. **External APIs:** قد تحتاج بعض Connectors إلى توفر API keys من العميل
3. **pgvector:** يجب التأكد من دعمه في Lovable Cloud / Supabase
4. **Performance:** قد نحتاج لتحسينات إضافية بناءً على حجم البيانات
5. **Security:** جميع البيانات الحساسة محمية عبر RLS + Encryption
6. **Scalability:** التصميم يدعم آلاف المستخدمين والملايين من الأحداث الأمنية

---

## 🎓 Training & Documentation

### للمطورين
- [ ] Architecture Overview (مخططات معمارية)
- [ ] API Documentation (توثيق Edge Functions)
- [ ] Database Schema (ERD diagrams)
- [ ] Connector Development Guide

### للمستخدمين
- [ ] User Manual (دليل المستخدم بالعربية)
- [ ] Video Tutorials (فيديوهات تعليمية)
- [ ] FAQs (الأسئلة الشائعة)
- [ ] Best Practices Guide

---

**تم إعداده بواسطة:** فريق تطوير Romuz  
**التاريخ:** 2025-11-19  
**الإصدار:** 1.0  
**الحالة:** 🟡 في انتظار الموافقة

---

**🚀 هل أنت مستعد لبدء رحلة التوسع الذكي؟**
