/**
 * M17: Knowledge Hub - Routes Configuration
 */

import { lazy } from 'react';

export const KnowledgeHubIndex = lazy(() => import('./pages/index'));
export const DocumentsPage = lazy(() => import('./pages/documents/index'));
export const DocumentDetailPage = lazy(() => import('./pages/documents/[id]'));
export const CreateDocumentPage = lazy(() => import('./pages/documents/create'));
export const QAPage = lazy(() => import('./pages/qa'));
export const GraphPage = lazy(() => import('./pages/graph'));
