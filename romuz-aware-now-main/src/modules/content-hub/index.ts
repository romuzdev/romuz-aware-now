/**
 * Content Hub Module (M4 → M13.1)
 * 
 * مكتبة المحتوى التوعوي مع توليد ذكي بالـ AI
 * 
 * Usage:
 * ```typescript
 * import { useContentItems, ContentLibrary } from '@/modules/content-hub';
 * ```
 */

// Hooks
export * from './hooks/useContentItems';
export * from './hooks/useContentAnalytics';

// Components
export * from './components';
export { ContentEditor } from './components/ContentEditor';
export { ContentCategoryManager } from './components/ContentCategoryManager';
