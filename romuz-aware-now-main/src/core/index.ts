/**
 * Core Platform - Barrel Export
 * 
 * Central export point for all core platform services.
 * This is the foundation layer that all apps and modules depend on.
 */

// Re-export all core modules
export * from './auth';
export * from './rbac';
export * from './tenancy';
export * from './services';
export * from './config';
export * from './hooks';
export * from './components';
