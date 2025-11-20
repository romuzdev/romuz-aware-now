/**
 * Campaign Integration
 * Gate-K: D1 Standard - M2 Campaigns Module
 * 
 * Complete Supabase integration layer for campaigns CRUD operations
 */

export type { CampaignsQueryParams } from './campaigns.integration';
export {
  fetchCampaignsList,
  fetchCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  restoreCampaign,
} from './campaigns.integration';

// Participants
export * from './participants.integration';

// Modules & Progress
export * from './modules.integration';

// Quizzes
export * from './quizzes.integration';

// Notifications
export * from './notifications.integration';
