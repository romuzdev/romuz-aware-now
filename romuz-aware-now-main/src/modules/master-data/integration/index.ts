/**
 * Gate-M: Master Data & Taxonomy Hub - Integration Layer
 * 
 * Barrel export for all master data integration functions
 */

// Catalogs
export {
  fetchCatalogs,
  fetchCatalogById,
  fetchCatalogByCode,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  publishCatalog,
  archiveCatalog,
  bumpCatalogVersion,
} from './catalogs.integration';

// Terms
export {
  fetchTerms,
  fetchTermById,
  fetchTermByCode,
  fetchTermsByCatalog,
  fetchChildTerms,
  fetchRootTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  activateTerm,
  deactivateTerm,
  reorderTerms,
  bulkSetTermsActive,
  lookupTerms,
  importTermsCSV,
  exportTerms,
} from './terms.integration';

// Mappings
export {
  fetchMappings,
  fetchMappingById,
  fetchMappingBySourceCode,
  lookupTargetCode,
  fetchMappingsByCatalog,
  fetchMappingsBySystem,
  createMapping,
  updateMapping,
  deleteMapping,
  bulkCreateMappings,
  upsertMapping,
} from './mappings.integration';

// Saved Views
export {
  saveSavedView,
  listSavedViews,
  listCatalogViews,
  listTermViews,
  listMappingViews,
  deleteSavedView,
  getDefaultView,
  setDefaultSavedView,
} from './saved-views.integration';

// Re-export types
export * from '../types';
