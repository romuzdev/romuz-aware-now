/**
 * M17: Knowledge Hub - Routes Configuration
 */

import { lazy } from 'react';

export const KnowledgeHubIndex = lazy(() => import('./pages/KnowledgeHub'));
export const DocumentsPage = lazy(() => import('./pages/ArticleManagement'));
export const DocumentDetailPage = lazy(() => import('./pages/KnowledgeHub'));
export const CreateDocumentPage = lazy(() => import('./pages/ArticleManagement'));
export const QAPage = lazy(() => import('./pages/qa'));
export const GraphPage = lazy(() => import('./pages/KnowledgeHub'));
