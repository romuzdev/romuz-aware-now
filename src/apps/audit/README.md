# Audit Management App

## Overview
Complete Internal & External Audit Management System (M12)

## Status
✅ **Active** - 100% Complete

## Features

### 🎯 Core Features
- ✅ **Audit Dashboard** - Overview of all audit activities
- ✅ **Audit Plans** - Create and manage audit plans
- ✅ **Audit Workflows** - Multi-stage workflow management (planning → execution → reporting → followup)
- ✅ **Findings Management** - Track and resolve audit findings
- ✅ **Report Generation** - Generate reports in multiple formats (PDF, Excel, Word, JSON)
- ✅ **Compliance Gap Analysis** - Analyze gaps between current state and requirements
- 🚧 **Auditors Management** - Coming soon

### 📊 Workflow Types
1. **Planning** - Scope definition, risk assessment, resource allocation, planning approval
2. **Execution** - Fieldwork, evidence collection, testing controls
3. **Reporting** - Draft preparation, management review, final report
4. **Follow-up** - Action tracking, verification, closure

### 🔐 Permissions
- `audit.view` - View audit data
- `audit.workflows.view` - View workflows
- `audit.findings.view` - View findings
- `audit.reports.view` - Generate reports
- `audit.compliance.view` - View compliance gaps
- `audit.auditors.view` - View auditors

## Structure

```
src/apps/audit/
├── pages/
│   ├── AuditDashboard.tsx      # Main dashboard
│   ├── AuditsPage.tsx           # List all audits
│   ├── AuditDetails.tsx         # Audit details view
│   ├── AuditWorkflows.tsx       # Workflow management
│   ├── AuditFindings.tsx        # Findings tracking
│   ├── AuditReports.tsx         # Report generation
│   ├── ComplianceGaps.tsx       # Gap analysis
│   └── Auditors.tsx             # Auditors management (coming soon)
├── config-audit.ts              # App configuration
├── routes.tsx                   # Route definitions
├── index.tsx                    # App entry point
├── index.ts                     # Barrel export
└── README.md                    # This file
```

## Components Used

### From GRC Module
- `AuditWorkflowManager` - Workflow stages management
- `FindingTracker` - Findings tracking and resolution
- `AuditReportGenerator` - Report generation
- `ComplianceGapAnalysis` - Gap analysis

### From Core
- `AdminLayout` - Standard admin layout
- UI Components from shadcn/ui

## Routes

| Path | Description |
|------|-------------|
| `/audit` | Redirects to dashboard |
| `/audit/dashboard` | Main dashboard |
| `/audit/audits` | List all audits |
| `/audit/audits/:id` | Audit details |
| `/audit/workflows` | Workflow management |
| `/audit/findings` | Findings management |
| `/audit/reports` | Report generation |
| `/audit/compliance-gaps` | Gap analysis |
| `/audit/auditors` | Auditors management |

## Database Tables

### Primary Tables
- `grc_audits` - Audit plans and execution
- `grc_audit_findings` - Audit findings
- `audit_workflows` - Workflow stages and progress

### Supporting Tables
- `grc_framework_requirements` - Compliance requirements
- `grc_controls` - Control implementations

## Integration

### Used by
- GRC App (compliance audits)
- Risk Management (audit findings linked to risks)

### Depends on
- `@/modules/grc` - Hooks, types, integration
- `@/core/components` - Reusable UI components
- `@/core/config` - App registry

## Migration Notes

This app was created by extracting audit functionality from GRC App:

### What was moved
- ✅ Audit pages (`AuditsPage`, `AuditDetails`)
- ✅ New pages created for workflows, findings, reports, gaps
- ✅ App configuration and routing
- ✅ Integration with existing GRC modules

### What stayed in GRC
- Risk management
- Control library
- Compliance dashboard
- Framework library

### Redirects
Old audit routes in GRC (`/grc/audits`) now redirect to `/audit/audits`

## Development

### Adding New Pages
1. Create page component in `pages/`
2. Add route in `index.tsx`
3. Update `config-audit.ts` if adding to sidebar

### Testing
- E2E tests: `tests/e2e/grc/audits.flow.spec.ts`
- Integration tests: `tests/integration/audit.spec.ts`

## Version History

- **v1.0** (2025-11-18) - Initial release as standalone app
  - Extracted from GRC App
  - Added workflow management
  - Added report generation
  - Added gap analysis
