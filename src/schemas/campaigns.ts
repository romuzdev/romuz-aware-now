import { z } from 'zod';

export const campaignStatusValues = ['draft','scheduled','active','completed','cancelled'] as const;
export type CampaignStatus = typeof campaignStatusValues[number];

export const campaignCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(campaignStatusValues).default('draft'),
  startDate: z.string().optional(), // ISO (yyyy-mm-dd)
  endDate: z.string().optional(),
  ownerName: z.string().optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.extend({
  id: z.string().min(1, 'Missing id'),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
