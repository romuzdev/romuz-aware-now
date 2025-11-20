/**
 * Event Listener Hooks - Barrel Export
 * 
 * جميع الـ 14 listener hooks للاستماع للأحداث في الوقت الفعلي
 */

// Gates Listeners (5 hooks)
export * from './useGateFListener';  // Gate-F: Policies
export * from './useGateHListener';  // Gate-H: Actions
export * from './useGateIListener';  // Gate-I: KPIs
export * from './useGateKListener';  // Gate-K: Campaigns
export * from './useGateLListener';  // Gate-L: Analytics

// Application Module Listeners (9 hooks)
export * from './useTrainingListener';    // Training/LMS
export * from './useAwarenessListener';   // Awareness Impact
export * from './usePhishingListener';    // Phishing Simulations
export * from './useDocumentListener';    // Document Management
export * from './useCommitteeListener';   // Committees & Governance
export * from './useContentListener';     // Content Hub
export * from './useCultureListener';     // Culture Index
export * from './useObjectiveListener';   // Objectives Management
export * from './useAlertListener';       // Alerts & Notifications
export * from './useAuthListener';        // Authentication
