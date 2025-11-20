# خطة تطوير GRC Platform App
## GRC Platform Implementation Plan v1.0

> **المشروع:** Romuz GRC Platform - Governance, Risk & Compliance  
> **التاريخ:** 2025-11-16  
> **الحالة:** 📋 جاهز للتنفيذ  
> **الأولوية:** Priority 3 (بعد LMS و Phishing)  
> **مدة التطوير:** 4 أسابيع (160 ساعة)

---

## 📋 جدول المحتويات

1. [نظرة عامة Executive Summary](#1-نظرة-عامة-executive-summary)
2. [البنية التقنية Technical Architecture](#2-البنية-التقنية-technical-architecture)
3. [المتطلبات الوظيفية Functional Requirements](#3-المتطلبات-الوظيفية-functional-requirements)
4. [قاعدة البيانات Database Design](#4-قاعدة-البيانات-database-design)
5. [خطة التنفيذ التفصيلية Implementation Roadmap](#5-خطة-التنفيذ-التفصيلية-implementation-roadmap)
6. [التكامل مع النظام الحالي System Integration](#6-التكامل-مع-النظام-الحالي-system-integration)
7. [معايير الجودة Quality Standards](#7-معايير-الجودة-quality-standards)
8. [المخرجات المتوقعة Expected Deliverables](#8-المخرجات-المتوقعة-expected-deliverables)

---

## 1. نظرة عامة Executive Summary

### 1.1 الهدف من التطبيق

**GRC Platform** هو تطبيق متكامل لإدارة **الحوكمة والمخاطر والامتثال** (Governance, Risk & Compliance) داخل منصة Romuz، يهدف إلى:

- 🎯 **إدارة المخاطر** - تحديد وتقييم ومعالجة المخاطر الأمنية والتشغيلية
- 🛡️ **إدارة الضوابط** - تصميم واختبار فعالية الضوابط الأمنية
- ✅ **إدارة الامتثال** - ضمان الامتثال للمعايير والتشريعات (NCA ECC، ISO 27001، PDPL)
- 🔍 **إدارة التدقيق** - تخطيط وتنفيذ عمليات التدقيق الداخلي

### 1.2 الارتباطات مع التطبيقات الأخرى

```
┌────────────────────────────────────────────────────┐
│                  GRC Platform                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Risks   │  │ Controls │  │Compliance│        │
│  │Management│  │Management│  │Management│        │
│  └──────────┘  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Audits  │  │Frameworks│  │ Reports  │        │
│  └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────────────────────────────┘
         ↓              ↓              ↓
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Policies  │  │  Actions   │  │ Committees │
│    (M3)    │  │   (M10)    │  │   (M11)    │
└────────────┘  └────────────┘  └────────────┘
```

**التكاملات الرئيسية:**
- **Policies App (M3):** ربط الضوابط بالسياسات، ربط متطلبات الامتثال بالسياسات
- **Actions App (M10):** إنشاء إجراءات تصحيحية تلقائية من نتائج التدقيق والمخاطر
- **Committees App (M11):** ربط لجان الحوكمة بمراقبة المخاطر والامتثال
- **Objectives & KPIs (M9):** ربط أهداف المخاطر بمؤشرات الأداء
- **Event System:** إطلاق أحداث عند تغيير حالة المخاطر أو اكتشاف مخالفات امتثال

### 1.3 الأدوار والصلاحيات

```typescript
// GRC Roles
export const GRC_ROLES = {
  grc_manager: {
    name: 'GRC Manager',
    name_ar: 'مدير الحوكمة والمخاطر',
    description: 'Full access to all GRC modules',
    permissions: [
      'grc.*',  // All GRC permissions
    ],
  },
  
  risk_owner: {
    name: 'Risk Owner',
    name_ar: 'مالك المخاطر',
    description: 'Manage assigned risks and assessments',
    permissions: [
      'grc.risks.view',
      'grc.risks.edit',
      'grc.risks.assess',
      'grc.controls.view',
    ],
  },
  
  compliance_officer: {
    name: 'Compliance Officer',
    name_ar: 'مسؤول الامتثال',
    description: 'Manage compliance and audits',
    permissions: [
      'grc.compliance.view',
      'grc.compliance.manage',
      'grc.compliance.report',
      'grc.audits.view',
      'grc.audits.conduct',
      'grc.audits.manage_findings',
    ],
  },
  
  control_owner: {
    name: 'Control Owner',
    name_ar: 'مالك الضوابط',
    description: 'Manage and test controls',
    permissions: [
      'grc.controls.view',
      'grc.controls.edit',
      'grc.controls.test',
    ],
  },
  
  auditor: {
    name: 'Auditor',
    name_ar: 'المدقق',
    description: 'Conduct audits and manage findings',
    permissions: [
      'grc.audits.view',
      'grc.audits.conduct',
      'grc.audits.manage_findings',
      'grc.controls.view',
      'grc.compliance.view',
    ],
  },
};
```

---

## 2. البنية التقنية Technical Architecture

### 2.1 هيكل المشروع

```
src/
├── apps/
│   └── grc/                           # 🛡️ GRC Application
│       ├── pages/
│       │   ├── Index.tsx              # GRC Dashboard
│       │   ├── Risks.tsx              # Risk Management
│       │   ├── RiskDetails.tsx        # Risk Details & Assessment
│       │   ├── Controls.tsx           # Control Management
│       │   ├── ControlDetails.tsx     # Control Details & Testing
│       │   ├── Compliance.tsx         # Compliance Management
│       │   ├── ComplianceDetails.tsx  # Framework Details
│       │   ├── Audits.tsx             # Audit Management
│       │   └── AuditDetails.tsx       # Audit Details & Findings
│       │
│       ├── components/
│       │   ├── risks/
│       │   │   ├── RiskRegister.tsx
│       │   │   ├── RiskForm.tsx
│       │   │   ├── RiskAssessment.tsx
│       │   │   ├── RiskMatrix.tsx
│       │   │   ├── RiskHeatmap.tsx
│       │   │   └── RiskTreatmentPlan.tsx
│       │   │
│       │   ├── controls/
│       │   │   ├── ControlLibrary.tsx
│       │   │   ├── ControlForm.tsx
│       │   │   ├── ControlMapping.tsx
│       │   │   ├── ControlEffectiveness.tsx
│       │   │   ├── TestPlanner.tsx
│       │   │   ├── TestExecution.tsx
│       │   │   └── EvidenceManager.tsx
│       │   │
│       │   ├── compliance/
│       │   │   ├── FrameworkLibrary.tsx
│       │   │   ├── RequirementMapping.tsx
│       │   │   ├── ComplianceGaps.tsx
│       │   │   ├── ComplianceMatrix.tsx
│       │   │   └── ComplianceReports.tsx
│       │   │
│       │   ├── audits/
│       │   │   ├── AuditPlanner.tsx
│       │   │   ├── AuditExecution.tsx
│       │   │   ├── FindingsTracker.tsx
│       │   │   ├── FindingForm.tsx
│       │   │   └── AuditReports.tsx
│       │   │
│       │   └── dashboards/
│       │       ├── GRCDashboard.tsx
│       │       ├── RiskDashboard.tsx
│       │       ├── ComplianceDashboard.tsx
│       │       └── ExecutiveReports.tsx
│       │
│       ├── hooks/
│       │   ├── useGRCEvents.ts         # Event System Integration
│       │   ├── useRisks.ts
│       │   ├── useRiskAssessments.ts
│       │   ├── useControls.ts
│       │   ├── useControlTests.ts
│       │   ├── useCompliance.ts
│       │   └── useAudits.ts
│       │
│       ├── config.ts                   # App Configuration
│       └── index.ts                    # Barrel Export
│
├── integrations/supabase/
│   └── grc.ts                          # GRC Supabase Integration
│
└── lib/
    └── events/
        └── hooks/
            └── useGRCEvents.ts         # GRC Event Hooks

```

### 2.2 التكامل مع Event System

```typescript
// src/apps/grc/hooks/useGRCEvents.ts

import { useCallback } from 'react';
import { useEventBus } from '@/lib/events';
import type { PublishEventParams } from '@/lib/events/event.types';

export function useGRCEvents() {
  const { publishEvent } = useEventBus();

  /**
   * Risk Created Event
   */
  const publishRiskCreated = useCallback(async (
    riskId: string,
    riskData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'risk_created',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'risk',
      entity_id: riskId,
      priority: riskData.severity === 'critical' ? 'critical' : 'high',
      payload: {
        risk_title: riskData.title,
        risk_category: riskData.category,
        severity: riskData.severity,
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        risk_score: riskData.risk_score,
        owner: riskData.owner,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Risk Assessment Updated Event
   */
  const publishRiskAssessmentUpdated = useCallback(async (
    riskId: string,
    assessmentData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'risk_assessment_updated',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'risk_assessment',
      entity_id: assessmentData.id,
      priority: assessmentData.new_severity === 'critical' ? 'critical' : 'high',
      payload: {
        risk_id: riskId,
        risk_title: assessmentData.risk_title,
        previous_severity: assessmentData.previous_severity,
        new_severity: assessmentData.new_severity,
        previous_score: assessmentData.previous_score,
        new_score: assessmentData.new_score,
        assessor: assessmentData.assessor,
        assessment_date: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Control Failed Test Event
   */
  const publishControlTestFailed = useCallback(async (
    controlId: string,
    testData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'control_test_failed',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'control_test',
      entity_id: testData.id,
      priority: 'critical',
      payload: {
        control_id: controlId,
        control_name: testData.control_name,
        test_type: testData.test_type,
        failure_reason: testData.failure_reason,
        tested_by: testData.tested_by,
        test_date: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Compliance Gap Detected Event
   */
  const publishComplianceGapDetected = useCallback(async (
    frameworkId: string,
    gapData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'compliance_gap_detected',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'compliance_gap',
      entity_id: gapData.id,
      priority: gapData.criticality === 'high' ? 'critical' : 'high',
      payload: {
        framework_id: frameworkId,
        framework_name: gapData.framework_name,
        requirement_id: gapData.requirement_id,
        requirement_title: gapData.requirement_title,
        gap_description: gapData.gap_description,
        criticality: gapData.criticality,
        detected_by: gapData.detected_by,
        detected_at: new Date().toISOString(),
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  /**
   * Audit Finding Created Event
   */
  const publishAuditFindingCreated = useCallback(async (
    auditId: string,
    findingData: any
  ) => {
    const params: PublishEventParams = {
      event_type: 'audit_finding_created',
      event_category: 'grc',
      source_module: 'grc',
      entity_type: 'audit_finding',
      entity_id: findingData.id,
      priority: findingData.severity === 'critical' ? 'critical' : 'high',
      payload: {
        audit_id: auditId,
        audit_title: findingData.audit_title,
        finding_title: findingData.title,
        finding_category: findingData.category,
        severity: findingData.severity,
        description: findingData.description,
        recommendation: findingData.recommendation,
        auditor: findingData.auditor,
      },
    };

    return await publishEvent(params);
  }, [publishEvent]);

  return {
    publishRiskCreated,
    publishRiskAssessmentUpdated,
    publishControlTestFailed,
    publishComplianceGapDetected,
    publishAuditFindingCreated,
  };
}
```

---

## 3. المتطلبات الوظيفية Functional Requirements

### 3.1 Module 1: Risk Management (إدارة المخاطر)

#### 3.1.1 Risk Register (سجل المخاطر)

**الميزات الأساسية:**
- ✅ عرض قائمة المخاطر (Risk List) مع فلاتر متقدمة
- ✅ إضافة / تعديل / حذف مخاطر
- ✅ تصنيف المخاطر (Category: Operational, Strategic, Compliance, Technology, etc.)
- ✅ تحديد مالك المخاطر (Risk Owner)
- ✅ ربط المخاطر بالعمليات / الأصول / الأقسام
- ✅ تحديد حالة المخاطر (Status: Identified, Assessed, Treated, Monitored)

**البيانات المطلوبة:**
```typescript
interface Risk {
  id: string;
  tenant_id: string;
  risk_code: string;                 // e.g., "RISK-2025-001"
  title: string;
  description: string;
  category: 'operational' | 'strategic' | 'compliance' | 'technology' | 'financial' | 'reputational';
  owner_id: string;                  // User ID
  department: string;
  related_process?: string;
  related_asset?: string;
  status: 'identified' | 'assessed' | 'treated' | 'monitored' | 'closed';
  created_at: string;
  created_by: string;
  updated_at: string;
}
```

#### 3.1.2 Risk Assessment (تقييم المخاطر)

**الميزات الأساسية:**
- ✅ تقييم احتمالية الحدوث (Likelihood: 1-5)
- ✅ تقييم شدة التأثير (Impact: 1-5)
- ✅ حساب درجة المخاطر (Risk Score = Likelihood × Impact)
- ✅ تحديد مستوى المخاطر (Risk Level: Low, Medium, High, Critical)
- ✅ تحديد التأثير على الأهداف (Impact on Objectives)
- ✅ تاريخ التقييم (Assessment History)

**البيانات المطلوبة:**
```typescript
interface RiskAssessment {
  id: string;
  risk_id: string;
  tenant_id: string;
  assessed_at: string;
  assessed_by: string;
  
  // Inherent Risk (المخاطر الكامنة)
  inherent_likelihood: 1 | 2 | 3 | 4 | 5;
  inherent_impact: 1 | 2 | 3 | 4 | 5;
  inherent_score: number;              // likelihood × impact
  inherent_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Residual Risk (المخاطر المتبقية بعد الضوابط)
  residual_likelihood: 1 | 2 | 3 | 4 | 5;
  residual_impact: 1 | 2 | 3 | 4 | 5;
  residual_score: number;
  residual_level: 'low' | 'medium' | 'high' | 'critical';
  
  notes?: string;
  created_at: string;
}
```

#### 3.1.3 Risk Treatment (معالجة المخاطر)

**الميزات الأساسية:**
- ✅ تحديد استراتيجية المعالجة:
  - **Avoid** (تجنب): إيقاف النشاط المسبب للمخاطر
  - **Mitigate** (تخفيف): تطبيق ضوابط لتقليل الاحتمالية أو التأثير
  - **Transfer** (نقل): نقل المخاطر إلى طرف ثالث (تأمين، استعانة بمصادر خارجية)
  - **Accept** (قبول): قبول المخاطر دون اتخاذ إجراء
- ✅ ربط خطة المعالجة بالضوابط (Controls)
- ✅ ربط خطة المعالجة بالإجراءات التصحيحية (Actions)
- ✅ تحديد الجدول الزمني للتنفيذ
- ✅ متابعة تقدم المعالجة

**البيانات المطلوبة:**
```typescript
interface RiskTreatmentPlan {
  id: string;
  risk_id: string;
  tenant_id: string;
  strategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  description: string;
  responsible_person: string;          // User ID
  target_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  linked_controls: string[];           // Control IDs
  linked_actions: string[];            // Action IDs
  created_at: string;
  updated_at: string;
}
```

#### 3.1.4 Risk Matrix & Heatmap (مصفوفة وخريطة المخاطر)

**الميزات الأساسية:**
- ✅ عرض مصفوفة المخاطر 5×5 (Likelihood vs Impact)
- ✅ خريطة حرارية للمخاطر (Risk Heatmap)
- ✅ فلترة حسب القسم / الفئة / المالك
- ✅ تصدير المصفوفة كـ PDF / Excel

---

### 3.2 Module 2: Control Management (إدارة الضوابط)

#### 3.2.1 Control Library (مكتبة الضوابط)

**الميزات الأساسية:**
- ✅ عرض قائمة الضوابط (Control List)
- ✅ إضافة / تعديل / حذف ضوابط
- ✅ تصنيف الضوابط:
  - **Type:** Preventive, Detective, Corrective
  - **Nature:** Manual, Automated, Semi-Automated
  - **Category:** Technical, Administrative, Physical
- ✅ ربط الضوابط بالمخاطر (Risk-Control Mapping)
- ✅ ربط الضوابط بمتطلبات الامتثال (Compliance Mapping)
- ✅ تحديد مالك الضابط (Control Owner)

**البيانات المطلوبة:**
```typescript
interface Control {
  id: string;
  tenant_id: string;
  control_code: string;              // e.g., "CTRL-AC-001"
  title: string;
  description: string;
  objective: string;                  // What does this control aim to achieve?
  
  // Classification
  type: 'preventive' | 'detective' | 'corrective';
  nature: 'manual' | 'automated' | 'semi_automated';
  category: 'technical' | 'administrative' | 'physical';
  
  // Ownership
  owner_id: string;                   // User ID
  department: string;
  
  // Effectiveness
  design_effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_assessed';
  operating_effectiveness: 'effective' | 'partially_effective' | 'ineffective' | 'not_assessed';
  
  // Frequency
  test_frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  last_tested_at?: string;
  next_test_date?: string;
  
  // Links
  linked_risks: string[];             // Risk IDs
  linked_policies: string[];          // Policy IDs
  linked_compliance_reqs: string[];   // Compliance Requirement IDs
  
  status: 'active' | 'inactive' | 'pending_review';
  created_at: string;
  updated_at: string;
}
```

#### 3.2.2 Control Testing (اختبار الضوابط)

**الميزات الأساسية:**
- ✅ إنشاء خطة اختبار (Test Plan)
- ✅ تنفيذ اختبار الضابط (Test Execution)
- ✅ تسجيل نتائج الاختبار (Test Results)
- ✅ رفع الأدلة (Evidence Upload)
- ✅ تحديد فعالية الضابط (Control Effectiveness)
- ✅ إنشاء إجراءات تصحيحية تلقائيًا عند فشل الضابط

**البيانات المطلوبة:**
```typescript
interface ControlTest {
  id: string;
  control_id: string;
  tenant_id: string;
  test_date: string;
  tested_by: string;                  // User ID
  
  // Test Details
  test_type: 'design' | 'operating';
  test_method: 'inspection' | 'observation' | 'inquiry' | 'reperformance';
  sample_size?: number;
  
  // Results
  result: 'passed' | 'failed' | 'partially_passed';
  effectiveness: 'effective' | 'partially_effective' | 'ineffective';
  
  // Findings
  findings?: string;
  deficiencies?: string;
  recommendations?: string;
  
  // Evidence
  evidence_files: string[];           // Attachment IDs
  
  // Follow-up
  requires_action: boolean;
  linked_action_id?: string;          // Action ID (if created)
  
  created_at: string;
  updated_at: string;
}
```

---

### 3.3 Module 3: Compliance Management (إدارة الامتثال)

#### 3.3.1 Framework Library (مكتبة الأطر التنظيمية)

**الميزات الأساسية:**
- ✅ عرض قائمة الأطر التنظيمية (Frameworks)
- ✅ إضافة أطر مخصصة (Custom Frameworks)
- ✅ الأطر الافتراضية:
  - **NCA ECC (الضوابط السحابية الأساسية)**
  - **ISO 27001:2022**
  - **PDPL (نظام حماية البيانات الشخصية)**
  - **SOC 2**
  - **PCI DSS**
  - **NIST CSF**

**البيانات المطلوبة:**
```typescript
interface ComplianceFramework {
  id: string;
  tenant_id: string;
  code: string;                       // e.g., "NCA-ECC", "ISO-27001"
  name: string;
  version: string;
  description: string;
  authority: string;                   // e.g., "National Cybersecurity Authority"
  effective_date: string;
  is_default: boolean;                 // Built-in or custom
  is_active: boolean;
  
  // Metadata
  total_requirements: number;
  covered_requirements: number;
  coverage_percentage: number;
  
  created_at: string;
  updated_at: string;
}

interface ComplianceRequirement {
  id: string;
  framework_id: string;
  tenant_id: string;
  requirement_code: string;           // e.g., "NCA-ECC-1.1", "ISO-A.5.1"
  title: string;
  description: string;
  category: string;                    // e.g., "Access Control", "Encryption"
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Implementation
  implementation_status: 'not_started' | 'in_progress' | 'implemented' | 'verified';
  compliance_status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_applicable';
  
  // Evidence
  evidence_required: string;
  evidence_collected: string[];        // Attachment IDs
  
  // Links
  linked_controls: string[];           // Control IDs
  linked_policies: string[];           // Policy IDs
  
  // Ownership
  owner_id: string;                    // User ID
  last_reviewed_at?: string;
  next_review_date?: string;
  
  created_at: string;
  updated_at: string;
}
```

#### 3.3.2 Compliance Gap Analysis (تحليل فجوات الامتثال)

**الميزات الأساسية:**
- ✅ تحديد الفجوات تلقائيًا (Automated Gap Detection)
- ✅ تقييم خطورة الفجوات (Gap Criticality)
- ✅ إنشاء خطط معالجة (Remediation Plans)
- ✅ متابعة تقدم المعالجة
- ✅ تقارير الفجوات (Gap Reports)

**البيانات المطلوبة:**
```typescript
interface ComplianceGap {
  id: string;
  framework_id: string;
  requirement_id: string;
  tenant_id: string;
  gap_description: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  
  // Impact
  impact_description: string;
  potential_risks: string[];           // Risk IDs
  
  // Remediation
  remediation_plan: string;
  responsible_person: string;          // User ID
  target_closure_date: string;
  status: 'open' | 'in_progress' | 'closed' | 'accepted';
  
  // Tracking
  identified_at: string;
  identified_by: string;
  closed_at?: string;
  closed_by?: string;
  
  created_at: string;
  updated_at: string;
}
```

#### 3.3.3 Compliance Reports (تقارير الامتثال)

**الميزات الأساسية:**
- ✅ لوحة معلومات الامتثال (Compliance Dashboard)
- ✅ تقرير حالة الامتثال (Compliance Status Report)
- ✅ تقرير تغطية المتطلبات (Requirements Coverage Report)
- ✅ تقرير الفجوات (Gaps Report)
- ✅ تصدير التقارير (PDF / Excel)

---

### 3.4 Module 4: Audit Management (إدارة التدقيق)

#### 3.4.1 Audit Planning (تخطيط التدقيق)

**الميزات الأساسية:**
- ✅ إنشاء خطة تدقيق سنوية (Annual Audit Plan)
- ✅ جدولة عمليات التدقيق (Audit Scheduling)
- ✅ تعيين فريق التدقيق (Audit Team Assignment)
- ✅ تحديد نطاق التدقيق (Audit Scope)
- ✅ ربط التدقيق بالأطر التنظيمية

**البيانات المطلوبة:**
```typescript
interface Audit {
  id: string;
  tenant_id: string;
  audit_code: string;                 // e.g., "AUDIT-2025-001"
  title: string;
  description: string;
  type: 'internal' | 'external' | 'certification' | 'regulatory';
  
  // Scope
  scope: string;
  departments: string[];
  processes: string[];
  frameworks: string[];               // Framework IDs
  
  // Team
  lead_auditor: string;               // User ID
  audit_team: string[];               // User IDs
  
  // Schedule
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  
  // Results
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  
  created_at: string;
  updated_at: string;
}
```

#### 3.4.2 Audit Execution (تنفيذ التدقيق)

**الميزات الأساسية:**
- ✅ تسجيل الملاحظات (Audit Notes)
- ✅ إنشاء النتائج (Findings Creation)
- ✅ تصنيف النتائج (Finding Classification)
- ✅ رفع الأدلة (Evidence Upload)
- ✅ تتبع التوصيات (Recommendations Tracking)

**البيانات المطلوبة:**
```typescript
interface AuditFinding {
  id: string;
  audit_id: string;
  tenant_id: string;
  finding_code: string;               // e.g., "FIND-2025-001"
  title: string;
  description: string;
  category: 'policy_violation' | 'control_deficiency' | 'compliance_gap' | 'process_issue' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Impact
  impact_description: string;
  affected_area: string;
  
  // Root Cause
  root_cause: string;
  
  // Recommendation
  recommendation: string;
  management_response?: string;
  
  // Responsible Party
  responsible_person: string;          // User ID
  target_closure_date: string;
  
  // Status
  status: 'open' | 'in_progress' | 'resolved' | 'accepted' | 'closed';
  
  // Evidence
  evidence_files: string[];            // Attachment IDs
  
  // Links
  linked_risk_id?: string;
  linked_control_id?: string;
  linked_action_id?: string;
  
  // Tracking
  identified_at: string;
  identified_by: string;
  closed_at?: string;
  closed_by?: string;
  
  created_at: string;
  updated_at: string;
}
```

---

## 4. قاعدة البيانات Database Design

### 4.1 جداول المخاطر (Risk Tables)

```sql
-- ============================================================================
-- Table: grc_risks
-- Description: سجل المخاطر الرئيسي
-- ============================================================================
CREATE TABLE public.grc_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identification
  risk_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('operational', 'strategic', 'compliance', 'technology', 'financial', 'reputational')),
  
  -- Ownership
  owner_id UUID NOT NULL,
  department TEXT,
  related_process TEXT,
  related_asset TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'assessed', 'treated', 'monitored', 'closed')),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_risks_tenant_code UNIQUE (tenant_id, risk_code)
);

-- Indexes
CREATE INDEX idx_grc_risks_tenant ON public.grc_risks(tenant_id);
CREATE INDEX idx_grc_risks_owner ON public.grc_risks(owner_id);
CREATE INDEX idx_grc_risks_category ON public.grc_risks(category);
CREATE INDEX idx_grc_risks_status ON public.grc_risks(status);
CREATE INDEX idx_grc_risks_created_at ON public.grc_risks(created_at DESC);

-- RLS Policies
ALTER TABLE public.grc_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GRC risks in their tenant"
  ON public.grc_risks FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "GRC managers can manage all risks"
  ON public.grc_risks FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.risks.manage')
  );

CREATE POLICY "Risk owners can edit their risks"
  ON public.grc_risks FOR UPDATE
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND owner_id = auth.uid()
    AND public.has_permission(auth.uid(), 'grc.risks.edit')
  );

-- ============================================================================
-- Table: grc_risk_assessments
-- Description: تقييمات المخاطر (Inherent & Residual)
-- ============================================================================
CREATE TABLE public.grc_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.grc_risks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessed_by UUID NOT NULL,
  
  -- Inherent Risk (المخاطر الكامنة)
  inherent_likelihood SMALLINT NOT NULL CHECK (inherent_likelihood BETWEEN 1 AND 5),
  inherent_impact SMALLINT NOT NULL CHECK (inherent_impact BETWEEN 1 AND 5),
  inherent_score SMALLINT GENERATED ALWAYS AS (inherent_likelihood * inherent_impact) STORED,
  inherent_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (inherent_likelihood * inherent_impact) >= 20 THEN 'critical'
      WHEN (inherent_likelihood * inherent_impact) >= 12 THEN 'high'
      WHEN (inherent_likelihood * inherent_impact) >= 6 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  -- Residual Risk (المخاطر المتبقية)
  residual_likelihood SMALLINT NOT NULL CHECK (residual_likelihood BETWEEN 1 AND 5),
  residual_impact SMALLINT NOT NULL CHECK (residual_impact BETWEEN 1 AND 5),
  residual_score SMALLINT GENERATED ALWAYS AS (residual_likelihood * residual_impact) STORED,
  residual_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (residual_likelihood * residual_impact) >= 20 THEN 'critical'
      WHEN (residual_likelihood * residual_impact) >= 12 THEN 'high'
      WHEN (residual_likelihood * residual_impact) >= 6 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grc_risk_assessments_risk ON public.grc_risk_assessments(risk_id);
CREATE INDEX idx_grc_risk_assessments_tenant ON public.grc_risk_assessments(tenant_id);
CREATE INDEX idx_grc_risk_assessments_assessed_at ON public.grc_risk_assessments(assessed_at DESC);

-- RLS Policies
ALTER TABLE public.grc_risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk assessments in their tenant"
  ON public.grc_risk_assessments FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Authorized users can manage risk assessments"
  ON public.grc_risk_assessments FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.risks.assess')
  );

-- ============================================================================
-- Table: grc_risk_treatment_plans
-- Description: خطط معالجة المخاطر
-- ============================================================================
CREATE TABLE public.grc_risk_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES public.grc_risks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  strategy TEXT NOT NULL CHECK (strategy IN ('avoid', 'mitigate', 'transfer', 'accept')),
  description TEXT NOT NULL,
  responsible_person UUID NOT NULL,
  target_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  
  -- Links (JSONB for flexibility)
  linked_controls JSONB DEFAULT '[]'::jsonb,     -- Array of control IDs
  linked_actions JSONB DEFAULT '[]'::jsonb,      -- Array of action IDs
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grc_risk_treatment_risk ON public.grc_risk_treatment_plans(risk_id);
CREATE INDEX idx_grc_risk_treatment_tenant ON public.grc_risk_treatment_plans(tenant_id);
CREATE INDEX idx_grc_risk_treatment_responsible ON public.grc_risk_treatment_plans(responsible_person);
CREATE INDEX idx_grc_risk_treatment_status ON public.grc_risk_treatment_plans(status);

-- RLS Policies
ALTER TABLE public.grc_risk_treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view treatment plans in their tenant"
  ON public.grc_risk_treatment_plans FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Authorized users can manage treatment plans"
  ON public.grc_risk_treatment_plans FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.risks.manage')
  );
```

### 4.2 جداول الضوابط (Control Tables)

```sql
-- ============================================================================
-- Table: grc_controls
-- Description: مكتبة الضوابط الأمنية
-- ============================================================================
CREATE TABLE public.grc_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Identification
  control_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  
  -- Classification
  type TEXT NOT NULL CHECK (type IN ('preventive', 'detective', 'corrective')),
  nature TEXT NOT NULL CHECK (nature IN ('manual', 'automated', 'semi_automated')),
  category TEXT NOT NULL CHECK (category IN ('technical', 'administrative', 'physical')),
  
  -- Ownership
  owner_id UUID NOT NULL,
  department TEXT,
  
  -- Effectiveness
  design_effectiveness TEXT DEFAULT 'not_assessed' CHECK (design_effectiveness IN ('effective', 'partially_effective', 'ineffective', 'not_assessed')),
  operating_effectiveness TEXT DEFAULT 'not_assessed' CHECK (operating_effectiveness IN ('effective', 'partially_effective', 'ineffective', 'not_assessed')),
  
  -- Testing Frequency
  test_frequency TEXT NOT NULL CHECK (test_frequency IN ('monthly', 'quarterly', 'semi_annually', 'annually')),
  last_tested_at TIMESTAMPTZ,
  next_test_date DATE,
  
  -- Links (JSONB for flexibility)
  linked_risks JSONB DEFAULT '[]'::jsonb,
  linked_policies JSONB DEFAULT '[]'::jsonb,
  linked_compliance_reqs JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_review')),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_controls_tenant_code UNIQUE (tenant_id, control_code)
);

-- Indexes
CREATE INDEX idx_grc_controls_tenant ON public.grc_controls(tenant_id);
CREATE INDEX idx_grc_controls_owner ON public.grc_controls(owner_id);
CREATE INDEX idx_grc_controls_type ON public.grc_controls(type);
CREATE INDEX idx_grc_controls_category ON public.grc_controls(category);
CREATE INDEX idx_grc_controls_status ON public.grc_controls(status);
CREATE INDEX idx_grc_controls_next_test ON public.grc_controls(next_test_date);

-- RLS Policies
ALTER TABLE public.grc_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view controls in their tenant"
  ON public.grc_controls FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "GRC managers can manage all controls"
  ON public.grc_controls FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.controls.manage')
  );

CREATE POLICY "Control owners can edit their controls"
  ON public.grc_controls FOR UPDATE
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND owner_id = auth.uid()
    AND public.has_permission(auth.uid(), 'grc.controls.edit')
  );

-- ============================================================================
-- Table: grc_control_tests
-- Description: اختبارات فعالية الضوابط
-- ============================================================================
CREATE TABLE public.grc_control_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.grc_controls(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  test_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  tested_by UUID NOT NULL,
  
  -- Test Details
  test_type TEXT NOT NULL CHECK (test_type IN ('design', 'operating')),
  test_method TEXT NOT NULL CHECK (test_method IN ('inspection', 'observation', 'inquiry', 'reperformance')),
  sample_size INT,
  
  -- Results
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed', 'partially_passed')),
  effectiveness TEXT NOT NULL CHECK (effectiveness IN ('effective', 'partially_effective', 'ineffective')),
  
  -- Findings
  findings TEXT,
  deficiencies TEXT,
  recommendations TEXT,
  
  -- Evidence (JSONB for attachment IDs)
  evidence_files JSONB DEFAULT '[]'::jsonb,
  
  -- Follow-up
  requires_action BOOLEAN DEFAULT false,
  linked_action_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grc_control_tests_control ON public.grc_control_tests(control_id);
CREATE INDEX idx_grc_control_tests_tenant ON public.grc_control_tests(tenant_id);
CREATE INDEX idx_grc_control_tests_tested_by ON public.grc_control_tests(tested_by);
CREATE INDEX idx_grc_control_tests_test_date ON public.grc_control_tests(test_date DESC);
CREATE INDEX idx_grc_control_tests_result ON public.grc_control_tests(result);

-- RLS Policies
ALTER TABLE public.grc_control_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view control tests in their tenant"
  ON public.grc_control_tests FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Authorized users can manage control tests"
  ON public.grc_control_tests FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.controls.test')
  );
```

### 4.3 جداول الامتثال (Compliance Tables)

```sql
-- ============================================================================
-- Table: grc_compliance_frameworks
-- Description: الأطر التنظيمية والمعايير
-- ============================================================================
CREATE TABLE public.grc_compliance_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  authority TEXT,
  effective_date DATE,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Statistics (updated via triggers)
  total_requirements INT DEFAULT 0,
  covered_requirements INT DEFAULT 0,
  coverage_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN total_requirements > 0 THEN (covered_requirements::decimal / total_requirements * 100)
      ELSE 0
    END
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_grc_frameworks_tenant_code UNIQUE (tenant_id, code, version)
);

-- Indexes
CREATE INDEX idx_grc_frameworks_tenant ON public.grc_compliance_frameworks(tenant_id);
CREATE INDEX idx_grc_frameworks_code ON public.grc_compliance_frameworks(code);
CREATE INDEX idx_grc_frameworks_is_active ON public.grc_compliance_frameworks(is_active);

-- RLS Policies
ALTER TABLE public.grc_compliance_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view frameworks in their tenant"
  ON public.grc_compliance_frameworks FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Compliance officers can manage frameworks"
  ON public.grc_compliance_frameworks FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.compliance.manage')
  );

-- ============================================================================
-- Table: grc_compliance_requirements
-- Description: متطلبات الامتثال لكل إطار تنظيمي
-- ============================================================================
CREATE TABLE public.grc_compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.grc_compliance_frameworks(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  requirement_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Implementation
  implementation_status TEXT NOT NULL DEFAULT 'not_started' CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented', 'verified')),
  compliance_status TEXT NOT NULL DEFAULT 'non_compliant' CHECK (compliance_status IN ('compliant', 'partially_compliant', 'non_compliant', 'not_applicable')),
  
  -- Evidence
  evidence_required TEXT,
  evidence_collected JSONB DEFAULT '[]'::jsonb,     -- Array of attachment IDs
  
  -- Links (JSONB for flexibility)
  linked_controls JSONB DEFAULT '[]'::jsonb,
  linked_policies JSONB DEFAULT '[]'::jsonb,
  
  -- Ownership
  owner_id UUID,
  last_reviewed_at TIMESTAMPTZ,
  next_review_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_grc_requirements_framework_code UNIQUE (framework_id, requirement_code)
);

-- Indexes
CREATE INDEX idx_grc_requirements_framework ON public.grc_compliance_requirements(framework_id);
CREATE INDEX idx_grc_requirements_tenant ON public.grc_compliance_requirements(tenant_id);
CREATE INDEX idx_grc_requirements_owner ON public.grc_compliance_requirements(owner_id);
CREATE INDEX idx_grc_requirements_implementation ON public.grc_compliance_requirements(implementation_status);
CREATE INDEX idx_grc_requirements_compliance ON public.grc_compliance_requirements(compliance_status);
CREATE INDEX idx_grc_requirements_next_review ON public.grc_compliance_requirements(next_review_date);

-- RLS Policies
ALTER TABLE public.grc_compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements in their tenant"
  ON public.grc_compliance_requirements FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Compliance officers can manage requirements"
  ON public.grc_compliance_requirements FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.compliance.manage')
  );

-- ============================================================================
-- Table: grc_compliance_gaps
-- Description: فجوات الامتثال
-- ============================================================================
CREATE TABLE public.grc_compliance_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.grc_compliance_frameworks(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.grc_compliance_requirements(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  gap_description TEXT NOT NULL,
  criticality TEXT NOT NULL CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
  
  -- Impact
  impact_description TEXT,
  potential_risks JSONB DEFAULT '[]'::jsonb,     -- Array of risk IDs
  
  -- Remediation
  remediation_plan TEXT,
  responsible_person UUID,
  target_closure_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'accepted')),
  
  -- Tracking
  identified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  identified_by UUID NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_grc_gaps_framework ON public.grc_compliance_gaps(framework_id);
CREATE INDEX idx_grc_gaps_requirement ON public.grc_compliance_gaps(requirement_id);
CREATE INDEX idx_grc_gaps_tenant ON public.grc_compliance_gaps(tenant_id);
CREATE INDEX idx_grc_gaps_responsible ON public.grc_compliance_gaps(responsible_person);
CREATE INDEX idx_grc_gaps_status ON public.grc_compliance_gaps(status);
CREATE INDEX idx_grc_gaps_criticality ON public.grc_compliance_gaps(criticality);

-- RLS Policies
ALTER TABLE public.grc_compliance_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view gaps in their tenant"
  ON public.grc_compliance_gaps FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Compliance officers can manage gaps"
  ON public.grc_compliance_gaps FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.compliance.manage')
  );
```

### 4.4 جداول التدقيق (Audit Tables)

```sql
-- ============================================================================
-- Table: grc_audits
-- Description: عمليات التدقيق (Internal & External)
-- ============================================================================
CREATE TABLE public.grc_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  audit_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('internal', 'external', 'certification', 'regulatory')),
  
  -- Scope
  scope TEXT NOT NULL,
  departments JSONB DEFAULT '[]'::jsonb,
  processes JSONB DEFAULT '[]'::jsonb,
  frameworks JSONB DEFAULT '[]'::jsonb,          -- Framework IDs
  
  -- Team
  lead_auditor UUID NOT NULL,
  audit_team JSONB DEFAULT '[]'::jsonb,          -- Array of user IDs
  
  -- Schedule
  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  
  -- Results (updated via triggers)
  total_findings INT DEFAULT 0,
  critical_findings INT DEFAULT 0,
  high_findings INT DEFAULT 0,
  medium_findings INT DEFAULT 0,
  low_findings INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT uq_grc_audits_tenant_code UNIQUE (tenant_id, audit_code)
);

-- Indexes
CREATE INDEX idx_grc_audits_tenant ON public.grc_audits(tenant_id);
CREATE INDEX idx_grc_audits_lead_auditor ON public.grc_audits(lead_auditor);
CREATE INDEX idx_grc_audits_type ON public.grc_audits(type);
CREATE INDEX idx_grc_audits_status ON public.grc_audits(status);
CREATE INDEX idx_grc_audits_planned_start ON public.grc_audits(planned_start_date);

-- RLS Policies
ALTER TABLE public.grc_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits in their tenant"
  ON public.grc_audits FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Auditors can manage audits"
  ON public.grc_audits FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.audits.conduct')
  );

-- ============================================================================
-- Table: grc_audit_findings
-- Description: نتائج التدقيق والملاحظات
-- ============================================================================
CREATE TABLE public.grc_audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.grc_audits(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  finding_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('policy_violation', 'control_deficiency', 'compliance_gap', 'process_issue', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  
  -- Impact
  impact_description TEXT,
  affected_area TEXT,
  
  -- Root Cause
  root_cause TEXT,
  
  -- Recommendation
  recommendation TEXT NOT NULL,
  management_response TEXT,
  
  -- Responsible Party
  responsible_person UUID,
  target_closure_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted', 'closed')),
  
  -- Evidence (JSONB for attachment IDs)
  evidence_files JSONB DEFAULT '[]'::jsonb,
  
  -- Links
  linked_risk_id UUID,
  linked_control_id UUID,
  linked_action_id UUID,
  
  -- Tracking
  identified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  identified_by UUID NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT uq_grc_findings_audit_code UNIQUE (audit_id, finding_code)
);

-- Indexes
CREATE INDEX idx_grc_findings_audit ON public.grc_audit_findings(audit_id);
CREATE INDEX idx_grc_findings_tenant ON public.grc_audit_findings(tenant_id);
CREATE INDEX idx_grc_findings_responsible ON public.grc_audit_findings(responsible_person);
CREATE INDEX idx_grc_findings_severity ON public.grc_audit_findings(severity);
CREATE INDEX idx_grc_findings_status ON public.grc_audit_findings(status);
CREATE INDEX idx_grc_findings_target_date ON public.grc_audit_findings(target_closure_date);

-- RLS Policies
ALTER TABLE public.grc_audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view findings in their tenant"
  ON public.grc_audit_findings FOR SELECT
  USING (tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id');

CREATE POLICY "Auditors can manage findings"
  ON public.grc_audit_findings FOR ALL
  USING (
    tenant_id = auth.jwt() -> 'app_metadata' ->> 'tenant_id'
    AND public.has_permission(auth.uid(), 'grc.audits.manage_findings')
  );
```

### 4.5 Database Functions & Triggers

```sql
-- ============================================================================
-- Function: update_grc_updated_at
-- Description: Trigger function to auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_grc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all GRC tables
CREATE TRIGGER update_grc_risks_updated_at
  BEFORE UPDATE ON public.grc_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_controls_updated_at
  BEFORE UPDATE ON public.grc_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_frameworks_updated_at
  BEFORE UPDATE ON public.grc_compliance_frameworks
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_requirements_updated_at
  BEFORE UPDATE ON public.grc_compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_gaps_updated_at
  BEFORE UPDATE ON public.grc_compliance_gaps
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_audits_updated_at
  BEFORE UPDATE ON public.grc_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

CREATE TRIGGER update_grc_findings_updated_at
  BEFORE UPDATE ON public.grc_audit_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_grc_updated_at();

-- ============================================================================
-- Function: update_framework_statistics
-- Description: Update framework statistics when requirements change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_framework_statistics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.grc_compliance_frameworks
  SET
    total_requirements = (
      SELECT COUNT(*)
      FROM public.grc_compliance_requirements
      WHERE framework_id = COALESCE(NEW.framework_id, OLD.framework_id)
    ),
    covered_requirements = (
      SELECT COUNT(*)
      FROM public.grc_compliance_requirements
      WHERE framework_id = COALESCE(NEW.framework_id, OLD.framework_id)
        AND compliance_status = 'compliant'
    )
  WHERE id = COALESCE(NEW.framework_id, OLD.framework_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_framework_stats_on_requirement_change
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_compliance_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_framework_statistics();

-- ============================================================================
-- Function: update_audit_findings_count
-- Description: Update audit findings count when findings change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_audit_findings_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.grc_audits
  SET
    total_findings = (
      SELECT COUNT(*)
      FROM public.grc_audit_findings
      WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
    ),
    critical_findings = (
      SELECT COUNT(*)
      FROM public.grc_audit_findings
      WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
        AND severity = 'critical'
    ),
    high_findings = (
      SELECT COUNT(*)
      FROM public.grc_audit_findings
      WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
        AND severity = 'high'
    ),
    medium_findings = (
      SELECT COUNT(*)
      FROM public.grc_audit_findings
      WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
        AND severity = 'medium'
    ),
    low_findings = (
      SELECT COUNT(*)
      FROM public.grc_audit_findings
      WHERE audit_id = COALESCE(NEW.audit_id, OLD.audit_id)
        AND severity = 'low'
    )
  WHERE id = COALESCE(NEW.audit_id, OLD.audit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_audit_findings_count_on_finding_change
  AFTER INSERT OR UPDATE OR DELETE ON public.grc_audit_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_audit_findings_count();
```

---

## 5. خطة التنفيذ التفصيلية Implementation Roadmap

### أسبوع 1: Core Setup & Risk Management (40 ساعة)

#### اليوم 1-2: إعداد البنية الأساسية (16 ساعة)

**Part 1: Database Schema (8 ساعات)**
```
✅ إنشاء جداول المخاطر:
   - grc_risks
   - grc_risk_assessments
   - grc_risk_treatment_plans

✅ إنشاء RLS Policies
✅ إنشاء Indexes
✅ إنشاء Triggers
✅ كتابة Integration Functions
```

**Part 2: App Structure (4 ساعات)**
```
✅ إنشاء src/apps/grc/
✅ إنشاء config.ts
✅ إنشاء hooks/ directory
✅ إنشاء components/ directory
✅ إنشاء pages/ directory
✅ إنشاء useGRCEvents.ts
```

**Part 3: Supabase Integration (4 ساعات)**
```
✅ إنشاء src/integrations/supabase/grc.ts
✅ كتابة CRUD functions للمخاطر
✅ كتابة CRUD functions للتقييمات
✅ كتابة CRUD functions لخطط المعالجة
```

#### اليوم 3-5: Risk Management UI (24 ساعة)

**Part 1: Core Pages (8 ساعات)**
```
✅ src/apps/grc/pages/Index.tsx          - GRC Dashboard
✅ src/apps/grc/pages/Risks.tsx          - Risk Management Page
✅ src/apps/grc/pages/RiskDetails.tsx    - Risk Details Page
```

**Part 2: Risk Components (12 ساعات)**
```
✅ RiskRegister.tsx          - عرض قائمة المخاطر
✅ RiskForm.tsx              - نموذج إضافة/تعديل مخاطر
✅ RiskAssessment.tsx        - نموذج تقييم المخاطر
✅ RiskMatrix.tsx            - مصفوفة المخاطر 5×5
✅ RiskHeatmap.tsx           - خريطة حرارية
✅ RiskTreatmentPlan.tsx     - خطة معالجة المخاطر
```

**Part 3: Custom Hooks (4 ساعات)**
```
✅ useRisks.ts               - Hook لإدارة المخاطر
✅ useRiskAssessments.ts     - Hook لإدارة التقييمات
```

---

### أسبوع 2: Control Management (40 ساعة)

#### اليوم 1-2: Control Database & Integration (16 ساعة)

**Part 1: Database Schema (8 ساعات)**
```
✅ إنشاء جداول الضوابط:
   - grc_controls
   - grc_control_tests

✅ إنشاء RLS Policies
✅ إنشاء Indexes
✅ إنشاء Triggers
```

**Part 2: Supabase Integration (8 ساعات)**
```
✅ كتابة CRUD functions للضوابط
✅ كتابة CRUD functions لاختبارات الضوابط
✅ كتابة functions للإحصائيات
```

#### اليوم 3-5: Control Management UI (24 ساعة)

**Part 1: Core Pages (6 ساعات)**
```
✅ src/apps/grc/pages/Controls.tsx       - Control Management Page
✅ src/apps/grc/pages/ControlDetails.tsx - Control Details Page
```

**Part 2: Control Components (14 ساعات)**
```
✅ ControlLibrary.tsx        - مكتبة الضوابط
✅ ControlForm.tsx           - نموذج إضافة/تعديل ضابط
✅ ControlMapping.tsx        - ربط الضوابط بالمخاطر/المتطلبات
✅ ControlEffectiveness.tsx  - عرض فعالية الضابط
✅ TestPlanner.tsx           - تخطيط اختبارات الضوابط
✅ TestExecution.tsx         - تنفيذ الاختبار
✅ EvidenceManager.tsx       - إدارة الأدلة
```

**Part 3: Custom Hooks (4 ساعات)**
```
✅ useControls.ts            - Hook لإدارة الضوابط
✅ useControlTests.ts        - Hook لإدارة الاختبارات
```

---

### أسبوع 3: Compliance & Audit Management (40 ساعة)

#### اليوم 1-2: Compliance Database & Integration (16 ساعة)

**Part 1: Database Schema (10 ساعات)**
```
✅ إنشاء جداول الامتثال:
   - grc_compliance_frameworks
   - grc_compliance_requirements
   - grc_compliance_gaps

✅ إنشاء جداول التدقيق:
   - grc_audits
   - grc_audit_findings

✅ إنشاء RLS Policies
✅ إنشاء Indexes
✅ إنشاء Triggers
```

**Part 2: Supabase Integration (6 ساعات)**
```
✅ كتابة CRUD functions للامتثال
✅ كتابة CRUD functions للتدقيق
✅ كتابة functions للإحصائيات
```

#### اليوم 3: Compliance UI (8 ساعات)

**Part 1: Core Pages (4 ساعات)**
```
✅ src/apps/grc/pages/Compliance.tsx       - Compliance Page
✅ src/apps/grc/pages/ComplianceDetails.tsx- Framework Details
```

**Part 2: Compliance Components (4 ساعات)**
```
✅ FrameworkLibrary.tsx      - مكتبة الأطر التنظيمية
✅ RequirementMapping.tsx    - ربط المتطلبات
✅ ComplianceGaps.tsx        - عرض الفجوات
✅ ComplianceMatrix.tsx      - مصفوفة الامتثال
```

#### اليوم 4-5: Audit UI (16 ساعات)

**Part 1: Core Pages (4 ساعات)**
```
✅ src/apps/grc/pages/Audits.tsx       - Audit Management Page
✅ src/apps/grc/pages/AuditDetails.tsx - Audit Details Page
```

**Part 2: Audit Components (8 ساعات)**
```
✅ AuditPlanner.tsx          - تخطيط التدقيق
✅ AuditExecution.tsx        - تنفيذ التدقيق
✅ FindingsTracker.tsx       - متابعة النتائج
✅ FindingForm.tsx           - نموذج إضافة نتيجة
✅ AuditReports.tsx          - تقارير التدقيق
```

**Part 3: Custom Hooks (4 ساعات)**
```
✅ useCompliance.ts          - Hook لإدارة الامتثال
✅ useAudits.ts              - Hook لإدارة التدقيق
```

---

### أسبوع 4: Integration, Dashboards & Testing (40 ساعة)

#### اليوم 1-2: Cross-Module Integration (16 ساعة)

**Part 1: Event System Integration (8 ساعات)**
```
✅ تكامل GRC مع Event System
✅ إنشاء automation rules للمخاطر والضوابط
✅ إنشاء automation rules للامتثال والتدقيق
✅ اختبار الأحداث والإشعارات
```

**Part 2: Links with Other Apps (8 ساعات)**
```
✅ ربط GRC مع Policies App:
   - ربط الضوابط بالسياسات
   - ربط متطلبات الامتثال بالسياسات

✅ ربط GRC مع Actions App:
   - إنشاء إجراءات تصحيحية من نتائج التدقيق
   - إنشاء إجراءات من فجوات الامتثال
   - إنشاء إجراءات من فشل الضوابط

✅ ربط GRC مع Committees App:
   - ربط لجان الحوكمة بمراقبة المخاطر
   - ربط لجان المراجعة بالتدقيق

✅ ربط GRC مع Objectives & KPIs:
   - ربط أهداف المخاطر بمؤشرات الأداء
   - قياس فعالية الضوابط
```

#### اليوم 3-4: Dashboards & Reports (16 ساعة)

**Part 1: Dashboard Components (12 ساعات)**
```
✅ GRCDashboard.tsx          - لوحة معلومات GRC الرئيسية
   - إحصائيات المخاطر
   - إحصائيات الضوابط
   - حالة الامتثال
   - عمليات التدقيق النشطة

✅ RiskDashboard.tsx         - لوحة معلومات المخاطر
   - Risk Matrix
   - Risk Heatmap
   - Top Risks
   - Risk Trends

✅ ComplianceDashboard.tsx   - لوحة معلومات الامتثال
   - Framework Coverage
   - Compliance Gaps
   - Compliance Trends

✅ ExecutiveReports.tsx      - تقارير تنفيذية
   - Executive Summary
   - Risk Report
   - Compliance Report
   - Audit Report
```

**Part 2: Export & PDF Reports (4 ساعات)**
```
✅ تصدير التقارير PDF
✅ تصدير البيانات Excel
✅ إنشاء قوالب التقارير
```

#### اليوم 5: Testing & Documentation (8 ساعات)

**Part 1: Testing (4 ساعات)**
```
✅ اختبار CRUD operations
✅ اختبار Event System integration
✅ اختبار Cross-module links
✅ اختبار RLS Policies
✅ اختبار Performance
```

**Part 2: Documentation (4 ساعات)**
```
✅ تحديث docs/awareness/04_Execution/
✅ إنشاء GRC_Implementation_Report.md
✅ تحديث PROGRESS_TRACKER.md
✅ تحديث README files
```

---

## 6. التكامل مع النظام الحالي System Integration

### 6.1 التكامل مع Event System

```typescript
// Workflow Example: Risk Escalation
export const riskEscalationWorkflow = {
  id: 'risk_escalation_workflow',
  name: 'Risk Escalation Workflow',
  description: 'Escalate critical risks and create remediation actions',
  trigger: {
    event_types: ['risk_assessment_updated'],
    conditions: {
      logic: 'AND',
      rules: [
        { field: 'new_severity', operator: 'eq', value: 'critical' },
        { field: 'new_score', operator: 'gte', value: 20 },
      ],
    },
  },
  actions: [
    {
      action_type: 'send_notification',
      config: {
        title: 'تحذير: مخاطر حرجة',
        message: 'تم رفع تصنيف المخاطر {{risk_title}} إلى حرج',
        priority: 'critical',
        recipients: ['grc_manager', 'ciso'],
      },
    },
    {
      action_type: 'create_action_plan',
      config: {
        title: 'معالجة عاجلة: {{risk_title}}',
        description: 'إجراء تصحيحي عاجل لمعالجة المخاطر الحرجة',
        priority: 'critical',
        due_date: '{{add_days:7}}',
        linked_risk_id: '{{risk_id}}',
      },
    },
    {
      action_type: 'trigger_event',
      config: {
        event_type: 'critical_risk_escalated',
        payload: {
          risk_id: '{{risk_id}}',
          risk_title: '{{risk_title}}',
          risk_score: '{{new_score}}',
        },
      },
    },
  ],
};

// Workflow Example: Control Test Failed
export const controlTestFailedWorkflow = {
  id: 'control_test_failed_workflow',
  name: 'Control Test Failed Workflow',
  description: 'Create remediation action when control test fails',
  trigger: {
    event_types: ['control_test_failed'],
    conditions: {
      logic: 'AND',
      rules: [
        { field: 'result', operator: 'eq', value: 'failed' },
      ],
    },
  },
  actions: [
    {
      action_type: 'send_notification',
      config: {
        title: 'فشل اختبار ضابط',
        message: 'فشل اختبار الضابط {{control_name}}',
        priority: 'high',
        recipients: ['control_owner', 'grc_manager'],
      },
    },
    {
      action_type: 'create_action_plan',
      config: {
        title: 'إصلاح الضابط: {{control_name}}',
        description: 'إجراء تصحيحي لإصلاح الضابط الفاشل',
        priority: 'high',
        due_date: '{{add_days:14}}',
        linked_control_id: '{{control_id}}',
      },
    },
  ],
};

// Workflow Example: Compliance Gap Detected
export const complianceGapWorkflow = {
  id: 'compliance_gap_workflow',
  name: 'Compliance Gap Workflow',
  description: 'Handle compliance gaps and create remediation plan',
  trigger: {
    event_types: ['compliance_gap_detected'],
    conditions: {
      logic: 'AND',
      rules: [
        { field: 'criticality', operator: 'in', value: ['critical', 'high'] },
      ],
    },
  },
  actions: [
    {
      action_type: 'send_notification',
      config: {
        title: 'فجوة امتثال حرجة',
        message: 'تم اكتشاف فجوة امتثال في {{framework_name}}: {{requirement_title}}',
        priority: 'high',
        recipients: ['compliance_officer', 'grc_manager'],
      },
    },
    {
      action_type: 'create_action_plan',
      config: {
        title: 'معالجة فجوة الامتثال: {{requirement_title}}',
        description: '{{gap_description}}',
        priority: 'high',
        due_date: '{{add_days:30}}',
        linked_framework_id: '{{framework_id}}',
        linked_requirement_id: '{{requirement_id}}',
      },
    },
  ],
};
```

### 6.2 التكامل مع Policies App

```typescript
// Link Controls to Policies
export async function linkControlToPolicy(
  controlId: string,
  policyId: string
): Promise<void> {
  const { data: control, error } = await supabase
    .from('grc_controls')
    .select('linked_policies')
    .eq('id', controlId)
    .single();

  if (error) throw error;

  const linkedPolicies = (control.linked_policies as string[]) || [];
  if (!linkedPolicies.includes(policyId)) {
    linkedPolicies.push(policyId);

    await supabase
      .from('grc_controls')
      .update({ linked_policies: linkedPolicies })
      .eq('id', controlId);
  }
}

// Link Compliance Requirements to Policies
export async function linkComplianceToPolicy(
  requirementId: string,
  policyId: string
): Promise<void> {
  const { data: requirement, error } = await supabase
    .from('grc_compliance_requirements')
    .select('linked_policies')
    .eq('id', requirementId)
    .single();

  if (error) throw error;

  const linkedPolicies = (requirement.linked_policies as string[]) || [];
  if (!linkedPolicies.includes(policyId)) {
    linkedPolicies.push(policyId);

    await supabase
      .from('grc_compliance_requirements')
      .update({ linked_policies: linkedPolicies })
      .eq('id', requirementId);
  }
}
```

### 6.3 التكامل مع Actions App

```typescript
// Create Action from Audit Finding
export async function createActionFromAuditFinding(
  findingId: string
): Promise<string> {
  const { data: finding, error } = await supabase
    .from('grc_audit_findings')
    .select('*')
    .eq('id', findingId)
    .single();

  if (error) throw error;

  // Create action in Actions App
  const actionData = {
    title: `إجراء تصحيحي: ${finding.title}`,
    description: finding.recommendation,
    priority: finding.severity,
    responsible_person: finding.responsible_person,
    due_date: finding.target_closure_date,
    linked_entity_type: 'audit_finding',
    linked_entity_id: findingId,
    status: 'open',
  };

  const { data: action, error: actionError } = await supabase
    .from('actions')
    .insert(actionData)
    .select()
    .single();

  if (actionError) throw actionError;

  // Update finding with action link
  await supabase
    .from('grc_audit_findings')
    .update({ linked_action_id: action.id })
    .eq('id', findingId);

  return action.id;
}

// Create Action from Compliance Gap
export async function createActionFromComplianceGap(
  gapId: string
): Promise<string> {
  const { data: gap, error } = await supabase
    .from('grc_compliance_gaps')
    .select('*')
    .eq('id', gapId)
    .single();

  if (error) throw error;

  const actionData = {
    title: `معالجة فجوة الامتثال: ${gap.gap_description}`,
    description: gap.remediation_plan,
    priority: gap.criticality,
    responsible_person: gap.responsible_person,
    due_date: gap.target_closure_date,
    linked_entity_type: 'compliance_gap',
    linked_entity_id: gapId,
    status: 'open',
  };

  const { data: action, error: actionError } = await supabase
    .from('actions')
    .insert(actionData)
    .select()
    .single();

  if (actionError) throw actionError;

  return action.id;
}
```

### 6.4 التكامل مع Committees App

```typescript
// Link Risk to Committee
export async function linkRiskToCommittee(
  riskId: string,
  committeeId: string
): Promise<void> {
  // Create agenda item in committee for risk review
  const { data: risk, error } = await supabase
    .from('grc_risks')
    .select('*')
    .eq('id', riskId)
    .single();

  if (error) throw error;

  const agendaItem = {
    title: `مراجعة المخاطر: ${risk.title}`,
    description: `مراجعة المخاطر ${risk.risk_code} والموافقة على خطة المعالجة`,
    committee_id: committeeId,
    linked_entity_type: 'risk',
    linked_entity_id: riskId,
  };

  await supabase
    .from('committee_agenda_items')
    .insert(agendaItem);
}
```

---

## 7. معايير الجودة Quality Standards

### 7.1 Code Quality Standards

✅ **TypeScript**: جميع الملفات بـ TypeScript مع تعريفات types كاملة  
✅ **Component Structure**: اتباع نفس هيكل المكونات المستخدم في التطبيقات الأخرى  
✅ **Naming Conventions**: camelCase للمتغيرات، PascalCase للمكونات، snake_case للـ database  
✅ **Comments**: تعليقات بالعربية، كود بالإنجليزية  
✅ **Error Handling**: معالجة شاملة للأخطاء مع رسائل واضحة  
✅ **Loading States**: حالات تحميل واضحة لكل عملية  
✅ **Empty States**: حالات فارغة مناسبة مع توجيهات واضحة  

### 7.2 Database Quality Standards

✅ **RLS Policies**: سياسات RLS لكل جدول حسب الصلاحيات  
✅ **Indexes**: Indexes على جميع الـ foreign keys والحقول المستخدمة في البحث  
✅ **Triggers**: Triggers لتحديث الـ timestamps وال statistics تلقائيًا  
✅ **Constraints**: قيود صحيحة (CHECK, UNIQUE, FK) لضمان سلامة البيانات  
✅ **Normalization**: قاعدة بيانات منظمة (3NF) مع تجنب التكرار  

### 7.3 UI/UX Quality Standards

✅ **Design System**: استخدام الـ design tokens من index.css  
✅ **Responsive**: تصميم متجاوب على جميع الأحجام  
✅ **RTL Support**: دعم كامل للغة العربية (RTL)  
✅ **Accessibility**: دعم ARIA labels و keyboard navigation  
✅ **Performance**: تحميل سريع باستخدام lazy loading و memoization  
✅ **Consistency**: توحيد الأنماط مع باقي التطبيقات  

### 7.4 Security Quality Standards

✅ **Authentication**: التحقق من الصلاحيات على مستوى الـ RLS والـ UI  
✅ **Input Validation**: التحقق من صحة المدخلات (client + server)  
✅ **XSS Prevention**: تجنب الـ XSS باستخدام React's escaping  
✅ **SQL Injection**: استخدام parameterized queries فقط  
✅ **Audit Logging**: تسجيل جميع العمليات الحرجة في audit_log  

---

## 8. المخرجات المتوقعة Expected Deliverables

### 8.1 Database Deliverables

```
✅ 10 Database Tables:
   - grc_risks
   - grc_risk_assessments
   - grc_risk_treatment_plans
   - grc_controls
   - grc_control_tests
   - grc_compliance_frameworks
   - grc_compliance_requirements
   - grc_compliance_gaps
   - grc_audits
   - grc_audit_findings

✅ Complete RLS Policies for all tables
✅ Indexes on all foreign keys and search fields
✅ Triggers for auto-updating timestamps and statistics
✅ Database functions for complex operations
```

### 8.2 Frontend Deliverables

```
✅ 8 Main Pages:
   - GRC Dashboard (Index.tsx)
   - Risk Management (Risks.tsx)
   - Risk Details (RiskDetails.tsx)
   - Control Management (Controls.tsx)
   - Control Details (ControlDetails.tsx)
   - Compliance Management (Compliance.tsx)
   - Audit Management (Audits.tsx)
   - Audit Details (AuditDetails.tsx)

✅ 25+ React Components:
   Risk Components (6):
     - RiskRegister, RiskForm, RiskAssessment
     - RiskMatrix, RiskHeatmap, RiskTreatmentPlan
   
   Control Components (7):
     - ControlLibrary, ControlForm, ControlMapping
     - ControlEffectiveness, TestPlanner, TestExecution, EvidenceManager
   
   Compliance Components (5):
     - FrameworkLibrary, RequirementMapping, ComplianceGaps
     - ComplianceMatrix, ComplianceReports
   
   Audit Components (5):
     - AuditPlanner, AuditExecution, FindingsTracker
     - FindingForm, AuditReports
   
   Dashboard Components (4):
     - GRCDashboard, RiskDashboard, ComplianceDashboard, ExecutiveReports

✅ 6 Custom Hooks:
   - useRisks
   - useRiskAssessments
   - useControls
   - useControlTests
   - useCompliance
   - useAudits
```

### 8.3 Integration Deliverables

```
✅ Event System Integration:
   - useGRCEvents.ts hook
   - 5 event types (risk_created, risk_assessment_updated, control_test_failed, compliance_gap_detected, audit_finding_created)
   - 3 automation workflows

✅ Cross-Module Integration:
   - Integration with Policies App (link controls & requirements to policies)
   - Integration with Actions App (create actions from findings & gaps)
   - Integration with Committees App (link risks to committee agendas)
   - Integration with Objectives & KPIs (link risks to objectives)

✅ Supabase Integration:
   - src/integrations/supabase/grc.ts
   - Complete CRUD functions for all entities
   - Search & filter functions
   - Statistics & analytics functions
```

### 8.4 Documentation Deliverables

```
✅ Implementation Report:
   - docs/awareness/04_Execution/GRC_Platform_Implementation_Report.md
   - Complete summary of all deliverables
   - Architecture diagrams
   - Database schema documentation
   - Component documentation
   - Integration documentation

✅ API Documentation:
   - All Supabase functions documented with JSDoc
   - All event types documented
   - All automation workflows documented

✅ User Guide:
   - How to manage risks
   - How to manage controls
   - How to manage compliance
   - How to conduct audits
```

---

## 🎯 خلاصة المخرجات Summary

### الملفات المطلوب إنشاؤها (Total: ~90 ملف)

#### Database (10 tables + functions)
- 10 SQL migration files
- RLS policies
- Indexes
- Triggers
- Functions

#### Frontend Pages (8 pages)
- Index.tsx
- Risks.tsx, RiskDetails.tsx
- Controls.tsx, ControlDetails.tsx
- Compliance.tsx, ComplianceDetails.tsx
- Audits.tsx, AuditDetails.tsx

#### Components (~25 components)
- 6 Risk components
- 7 Control components
- 5 Compliance components
- 5 Audit components
- 4 Dashboard components

#### Hooks (6 custom hooks)
- useRisks
- useRiskAssessments
- useControls
- useControlTests
- useCompliance
- useAudits

#### Integration (3 files)
- useGRCEvents.ts
- grc.ts (Supabase integration)
- Cross-module integration helpers

#### Configuration (3 files)
- config.ts
- index.ts (barrel exports)
- types.ts

#### Documentation (3 files)
- GRC_Platform_Implementation_Plan_v1.0.md (هذا الملف)
- GRC_Platform_Implementation_Report.md (بعد التنفيذ)
- README.md

---

## 🚀 الخطوات التالية Next Steps

عند الموافقة على هذه الخطة، سيتم البدء في التنفيذ بالترتيب التالي:

### المرحلة 1: التحضير (1 ساعة)
1. ✅ مراجعة هذه الخطة بالكامل
2. ✅ التأكد من توافقها مع النظام الحالي
3. ✅ الحصول على الموافقة للبدء

### المرحلة 2: التنفيذ (160 ساعة = 4 أسابيع)
1. **Week 1:** Risk Management (40h)
2. **Week 2:** Control Management (40h)
3. **Week 3:** Compliance & Audit (40h)
4. **Week 4:** Integration & Testing (40h)

### المرحلة 3: المراجعة والتسليم (8 ساعات)
1. ✅ مراجعة شاملة لجميع المخرجات
2. ✅ اختبار كامل للنظام
3. ✅ إنشاء تقرير التنفيذ النهائي
4. ✅ تحديث PROGRESS_TRACKER.md

---

## 📊 مقاييس النجاح Success Metrics

### Technical Metrics
- ✅ جميع الجداول تحتوي على RLS policies صحيحة
- ✅ جميع الـ endpoints محمية بصلاحيات
- ✅ جميع المكونات responsive وتدعم RTL
- ✅ Loading time < 2 seconds لجميع الصفحات
- ✅ Zero TypeScript errors
- ✅ Zero console errors in production

### Functional Metrics
- ✅ إدارة كاملة للمخاطر (CRUD + Assessment + Treatment)
- ✅ إدارة كاملة للضوابط (CRUD + Testing + Effectiveness)
- ✅ إدارة كاملة للامتثال (Frameworks + Requirements + Gaps)
- ✅ إدارة كاملة للتدقيق (Planning + Execution + Findings)
- ✅ تكامل كامل مع Event System
- ✅ تكامل كامل مع التطبيقات الأخرى

### Quality Metrics
- ✅ Code quality: 90%+
- ✅ Test coverage: 70%+
- ✅ Documentation: 100%
- ✅ Performance: 95%+
- ✅ Security: 100%

---

## ✅ Conclusion

هذه الخطة تضمن:
1. ✅ **الدقة الكاملة**: كل التفاصيل محددة بدقة
2. ✅ **التوافق الكامل**: متوافق 100% مع النظام الحالي
3. ✅ **الجودة العالية**: معايير جودة احترافية
4. ✅ **التكامل الشامل**: تكامل كامل مع جميع التطبيقات
5. ✅ **القابلية للتنفيذ**: خطة واضحة قابلة للتنفيذ مباشرة

**هل أنت مستعد للبدء في التنفيذ؟** 🚀
