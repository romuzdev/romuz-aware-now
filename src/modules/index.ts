/**
 * Application Modules - Barrel Export
 * 
 * Reusable business modules that can be shared across apps
 * 
 * Note: To avoid naming conflicts, import directly from specific modules:
 * Example: import { Action } from '@/modules/actions'
 */

// Re-export commonly used modules (without naming conflicts)
export * from './campaigns';
export * from './content-hub';
export * from './culture-index';
export * from './documents';
export * from './committees';
export * from './policies';

// For modules with potential naming conflicts, import directly:
// - '@/modules/actions'
// - '@/modules/alerts'
// - '@/modules/analytics'
// - '@/modules/awareness'
// - '@/modules/kpis'
// - '@/modules/objectives'
// - '@/modules/observability'
