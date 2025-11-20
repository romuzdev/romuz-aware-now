export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string; // ISO
  endDate?: string;   // ISO
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
}

export type CampaignListFilters = {
  search?: string;
  status?: CampaignStatus | 'all';
  startFrom?: string;
  endTo?: string;
  pageSize?: number;
  includeArchived?: boolean;
};

export type CampaignSavedView = {
  id: string;
  name: string;
  filters: CampaignListFilters;
  createdAt?: string;
};
