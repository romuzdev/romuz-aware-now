/**
 * Documents Integration - Barrel Export
 */

export * from './documents.integration';

// M10: Smart Documents Enhancement
// Note: getDocumentVersions is exported from both modules
// Use getVersions from versions.integration for new code
export {
  getVersions,
  getVersionById,
  getLatestVersion,
  createVersion,
  compareVersions,
  restoreVersion,
  deleteVersion,
  getVersionStatistics,
  type CreateVersionInput,
} from './versions.integration';

export * from './ocr.integration';
export * from './workflow-automation.integration';
