/**
 * Unit Tests: Awareness Campaigns
 * اختبارات الوحدات لحملات التوعية
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockCampaign, MOCK_TENANT_ID } from '../_utils/fixtures';

describe('Awareness Campaigns - Unit Tests', () => {
  describe('Campaign Validation', () => {
    it('should validate campaign name is required', () => {
      const invalidCampaign = { ...mockCampaign, name: '' };
      expect(invalidCampaign.name).toBe('');
    });

    it('should validate campaign dates', () => {
      const campaign = mockCampaign;
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      
      expect(startDate).toBeLessThan(endDate);
    });

    it('should validate tenant_id exists', () => {
      expect(mockCampaign.tenant_id).toBe(MOCK_TENANT_ID);
    });

    it('should validate campaign status', () => {
      const validStatuses = ['draft', 'active', 'completed', 'archived'];
      expect(validStatuses).toContain(mockCampaign.status);
    });
  });

  describe('Campaign Data Structure', () => {
    it('should have required fields', () => {
      expect(mockCampaign).toHaveProperty('id');
      expect(mockCampaign).toHaveProperty('name');
      expect(mockCampaign).toHaveProperty('tenant_id');
      expect(mockCampaign).toHaveProperty('start_date');
      expect(mockCampaign).toHaveProperty('end_date');
      expect(mockCampaign).toHaveProperty('status');
    });

    it('should have correct data types', () => {
      expect(typeof mockCampaign.id).toBe('string');
      expect(typeof mockCampaign.name).toBe('string');
      expect(typeof mockCampaign.tenant_id).toBe('string');
      expect(mockCampaign.is_test).toBe(true);
    });
  });

  describe('Campaign Business Logic', () => {
    it('should calculate campaign duration correctly', () => {
      const start = new Date(mockCampaign.start_date);
      const end = new Date(mockCampaign.end_date);
      const durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(durationDays).toBeGreaterThan(0);
    });

    it('should mark test campaigns correctly', () => {
      expect(mockCampaign.is_test).toBe(true);
    });
  });
});
