/**
 * M17: Knowledge Hub - Types
 * Shared types for the Knowledge Hub application
 */

export type DocumentType = 
  | 'policy'
  | 'procedure'
  | 'guideline'
  | 'standard'
  | 'best_practice'
  | 'case_study'
  | 'regulation'
  | 'faq'
  | 'training'
  | 'template';

export type RelationType = 
  | 'references'
  | 'supersedes'
  | 'relates_to'
  | 'conflicts_with'
  | 'extends';

export interface KnowledgeFilters {
  documentType?: DocumentType;
  category?: string;
  isVerified?: boolean;
  tags?: string[];
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  verified: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: RelationType;
  strength: number;
}
