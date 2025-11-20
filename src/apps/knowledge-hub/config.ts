/**
 * M17: Knowledge Hub App Configuration
 * 
 * Complete app module definition for the registry
 */

import {
  BookOpen,
  Search,
  MessageCircle,
  Network,
  FileText,
  Plus,
  Settings,
} from 'lucide-react';
import type { AppModule } from '@/core/config/types';

/**
 * Knowledge Hub App Module
 * 
 * Intelligent Knowledge Base with RAG & Semantic Search
 */
export const knowledgeHubApp: AppModule = {
  id: 'knowledge-hub',
  name: 'Knowledge Hub',
  nameAr: 'مركز المعرفة',
  description: 'AI-Powered Knowledge Base & Q&A',
  icon: BookOpen,
  route: '/knowledge-hub',
  requiredPermission: 'documents.view' as any,
  color: 'hsl(220, 90%, 56%)', // Blue
  status: 'active',
  features: [
    {
      id: 'knowledge-hub-home',
      name: 'Home',
      nameAr: 'الرئيسية',
      route: '/knowledge-hub',
      icon: BookOpen,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 1,
    },
    {
      id: 'knowledge-search',
      name: 'Smart Search',
      nameAr: 'البحث الذكي',
      route: '/knowledge-hub',
      icon: Search,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 2,
    },
    {
      id: 'knowledge-qa',
      name: 'Q&A',
      nameAr: 'الأسئلة والأجوبة',
      route: '/knowledge-hub/qa',
      icon: MessageCircle,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 3,
    },
    {
      id: 'knowledge-documents',
      name: 'Documents',
      nameAr: 'المستندات',
      route: '/knowledge-hub/documents',
      icon: FileText,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 4,
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph',
      nameAr: 'الرسم المعرفي',
      route: '/knowledge-hub/graph',
      icon: Network,
      requiredPermission: 'documents.view' as any,
      showInSidebar: true,
      order: 5,
    },
    {
      id: 'knowledge-create',
      name: 'Add Document',
      nameAr: 'إضافة مستند',
      route: '/knowledge-hub/documents/create',
      icon: Plus,
      requiredPermission: 'documents.create' as any,
      showInSidebar: false,
      order: 6,
    },
  ],
  metadata: {
    version: '1.0',
    lastUpdated: '2025-11-20',
    owner: 'Knowledge Team',
  },
};

/**
 * Legacy config for backward compatibility
 */
export const knowledgeHubConfig = {
  id: knowledgeHubApp.id,
  name: knowledgeHubApp.name,
  nameAr: knowledgeHubApp.nameAr,
  description: knowledgeHubApp.description,
  version: knowledgeHubApp.metadata?.version,
  status: knowledgeHubApp.status,
};
