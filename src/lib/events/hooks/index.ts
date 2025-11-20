/**
 * Event Integration Hooks - Barrel Export
 * 
 * All 14 module integration hooks for the Event System
 */

// Gates (5 hooks)
export * from './useGateFEvents';  // Gate-F: Policies
export * from './useGateHEvents';  // Gate-H: Actions
export * from './useGateIEvents';  // Gate-I: KPIs
export * from './useGateKEvents';  // Gate-K: Campaigns
export * from './useGateLEvents';  // Gate-L: Analytics

// Application Modules (9 hooks)
export * from './useTrainingEvents';    // Training/LMS
export * from './useAwarenessEvents';   // Awareness Impact
export * from './usePhishingEvents';    // Phishing Simulations
export * from './useDocumentEvents';    // Document Management
export * from './useCommitteeEvents';   // Committees & Governance
export * from './useContentEvents';     // Content Hub
export * from './useCultureEvents';     // Culture Index
export * from './useObjectiveEvents';   // Objectives Management
export * from './useAlertEvents';       // Alerts & Notifications
export * from './useAuthEvents';        // Authentication
