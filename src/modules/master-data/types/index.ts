/**
 * Gate-M: Master Data & Taxonomy Hub - Types
 * 
 * TypeScript types for Reference Catalogs, Terms, and Mappings
 */

// ============================================
// Base Types
// ============================================

export type UUID = string;

// ============================================
// Enums & Literals
// ============================================

export type Scope = 'GLOBAL' | 'TENANT';
export type CatalogStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SavedEntityType = 'ref_catalogs' | 'ref_terms' | 'ref_mappings';

// Keep legacy aliases for backward compatibility
export type CatalogScope = Scope;
export type EntityType = SavedEntityType;

// ============================================
// Pagination
// ============================================

export interface Pagination {
  page?: number;
  pageSize?: number;
}

// ============================================
// Reference Catalog Types
// ============================================

// Type Aliases for backward compatibility & consistency
export type CatalogInsert = CreateCatalogInput;
export type CatalogUpdate = UpdateCatalogInput;

export interface RefCatalog {
  id: UUID;
  code: string;
  labelAr: string;
  labelEn: string;
  scope: Scope;
  tenantId: UUID | null;
  status: CatalogStatus;
  version: number;
  meta: Record<string, any>;
  createdBy: UUID | null;
  updatedBy: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// New standard alias
export type Catalog = RefCatalog;

export interface CreateCatalogInput {
  code: string;
  labelAr: string;
  labelEn: string;
  scope: Scope;
  tenantId?: UUID | null;
  status?: CatalogStatus;
  meta?: Record<string, any>;
}

export interface UpdateCatalogInput {
  labelAr?: string;
  labelEn?: string;
  status?: CatalogStatus;
  version?: number;
  meta?: Record<string, any>;
}

export interface CatalogFilters {
  scope?: Scope;
  status?: CatalogStatus;
  tenantId?: UUID;
  search?: string;
  orderBy?: 'created_at' | 'updated_at' | 'code' | 'status' | 'version';
  orderDir?: 'asc' | 'desc';
}

// ============================================
// Reference Term Types
// ============================================

// Type Aliases for backward compatibility & consistency
export type TermInsert = CreateTermInput;
export type TermUpdate = UpdateTermInput;

export interface RefTerm {
  id: UUID;
  catalogId: UUID;
  parentId: UUID | null;
  code: string;
  labelAr: string;
  labelEn: string;
  sortOrder: number;
  active: boolean;
  attrs: Record<string, any>;
  createdBy: UUID | null;
  updatedBy: UUID | null;
  createdAt: string;
  updatedAt: string;
}

// New standard alias
export type Term = RefTerm;

export interface CreateTermInput {
  catalogId: UUID;
  parentId?: UUID | null;
  code: string;
  labelAr: string;
  labelEn: string;
  sortOrder?: number;
  active?: boolean;
  attrs?: Record<string, any>;
}

export interface UpdateTermInput {
  parentId?: UUID | null;
  labelAr?: string;
  labelEn?: string;
  sortOrder?: number;
  active?: boolean;
  attrs?: Record<string, any>;
}

export interface TermFilters {
  catalogId?: UUID;
  parentId?: UUID | null;
  active?: boolean;
  search?: string;
  orderBy?: 'sort_order' | 'created_at' | 'code' | 'label_ar' | 'label_en';
  orderDir?: 'asc' | 'desc';
}

// ============================================
// Reference Mapping Types
// ============================================

// Type Aliases for backward compatibility & consistency
export type MappingInsert = CreateMappingInput;
export type MappingUpdate = UpdateMappingInput;

export interface RefMapping {
  id: UUID;
  catalogId: UUID;
  termId: UUID | null;
  sourceSystem: string;
  srcCode: string;
  targetCode: string;
  notes: string | null;
  createdBy: UUID | null;
  createdAt: string;
}

// New standard alias
export type Mapping = RefMapping;

export interface CreateMappingInput {
  catalogId: UUID;
  termId?: UUID | null;
  sourceSystem: string;
  srcCode: string;
  targetCode: string;
  notes?: string | null;
}

export interface UpdateMappingInput {
  targetCode?: string;
  notes?: string | null;
}

export interface MappingFilters {
  catalogId?: UUID;
  termId?: UUID | null;
  sourceSystem?: string;
  srcCode?: string;
  search?: string;
}

// ============================================
// Saved Views Types
// ============================================

export interface SavedView {
  id: UUID;
  tenantId: UUID;
  entityType: SavedEntityType;
  viewName: string;
  descriptionAr: string | null;
  filters: Record<string, any>;
  sortConfig: {
    field: string;
    direction: 'asc' | 'desc';
  };
  isDefault: boolean;
  isShared: boolean;
  ownerId: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewInput {
  entityType: SavedEntityType;
  viewName: string;
  descriptionAr?: string | null;
  filters?: Record<string, any>;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  isDefault?: boolean;
  isShared?: boolean;
}

export interface UpdateSavedViewInput {
  viewName?: string;
  descriptionAr?: string | null;
  filters?: Record<string, any>;
  sortConfig?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  isDefault?: boolean;
  isShared?: boolean;
}

// ============================================
// Filter & Query Types
// ============================================

export interface CatalogFilters {
  scope?: CatalogScope;
  status?: CatalogStatus;
  search?: string;
  tenantId?: string;
}

export interface TermFilters {
  catalogId?: string;
  parentId?: string | null;
  active?: boolean;
  search?: string;
}

export interface MappingFilters {
  catalogId?: string;
  termId?: string;
  sourceSystem?: string;
  search?: string;
}
