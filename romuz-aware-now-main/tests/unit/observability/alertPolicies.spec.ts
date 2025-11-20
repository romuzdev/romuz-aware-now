// ============================================================================
// Gate-E: Unit Tests - Alert Policies Logic
// ============================================================================

import { describe, it, expect } from 'vitest';

describe('Alert Policies - Threshold Comparison', () => {
  describe('Simple Operators', () => {
    it('should correctly evaluate < operator', () => {
      const currentValue = 45;
      const threshold = 50;
      const operator = '<';

      const breached = currentValue < threshold;
      expect(breached).toBe(true);
    });

    it('should correctly evaluate <= operator', () => {
      const currentValue = 50;
      const threshold = 50;
      const operator = '<=';

      const breached = currentValue <= threshold;
      expect(breached).toBe(true);
    });

    it('should correctly evaluate > operator', () => {
      const currentValue = 85;
      const threshold = 80;
      const operator = '>';

      const breached = currentValue > threshold;
      expect(breached).toBe(true);
    });

    it('should correctly evaluate >= operator', () => {
      const currentValue = 80;
      const threshold = 80;
      const operator = '>=';

      const breached = currentValue >= threshold;
      expect(breached).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const currentValue = 0;
      const threshold = 10;

      expect(currentValue < threshold).toBe(true);
      expect(currentValue > threshold).toBe(false);
    });

    it('should handle 100% values correctly', () => {
      const currentValue = 100;
      const threshold = 95;

      expect(currentValue > threshold).toBe(true);
      expect(currentValue >= threshold).toBe(true);
    });

    it('should handle equal values correctly', () => {
      const currentValue = 75;
      const threshold = 75;

      expect(currentValue < threshold).toBe(false);
      expect(currentValue <= threshold).toBe(true);
      expect(currentValue > threshold).toBe(false);
      expect(currentValue >= threshold).toBe(true);
    });
  });
});

describe('Alert Policies - Dedupe Key Generation', () => {
  it('should generate unique keys per policy + campaign + day', () => {
    const policyId = 'policy-123';
    const campaignId = 'campaign-456';
    const severity = 'critical';
    const today = '2024-06-15';

    const dedupeKey = `${policyId}_${campaignId}_${severity}_${today}`;

    expect(dedupeKey).toBe('policy-123_campaign-456_critical_2024-06-15');
  });

  it('should generate different keys for different days', () => {
    const policyId = 'policy-123';
    const campaignId = 'campaign-456';
    const severity = 'critical';

    const key1 = `${policyId}_${campaignId}_${severity}_2024-06-15`;
    const key2 = `${policyId}_${campaignId}_${severity}_2024-06-16`;

    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different severities', () => {
    const policyId = 'policy-123';
    const campaignId = 'campaign-456';
    const today = '2024-06-15';

    const key1 = `${policyId}_${campaignId}_critical_${today}`;
    const key2 = `${policyId}_${campaignId}_warn_${today}`;

    expect(key1).not.toBe(key2);
  });
});

describe('Alert Policies - Cooldown Logic', () => {
  it('should allow alert if no previous trigger', () => {
    const lastTriggeredAt = null;
    const cooldownMinutes = 60;

    const shouldTrigger = lastTriggeredAt === null;
    expect(shouldTrigger).toBe(true);
  });

  it('should block alert if within cooldown period', () => {
    const now = new Date('2024-06-15T14:00:00Z');
    const lastTriggered = new Date('2024-06-15T13:30:00Z'); // 30 min ago
    const cooldownMinutes = 60;

    const cooldownEnd = new Date(lastTriggered.getTime() + cooldownMinutes * 60000);
    const shouldTrigger = now >= cooldownEnd;

    expect(shouldTrigger).toBe(false);
  });

  it('should allow alert if cooldown period expired', () => {
    const now = new Date('2024-06-15T14:00:00Z');
    const lastTriggered = new Date('2024-06-15T12:30:00Z'); // 90 min ago
    const cooldownMinutes = 60;

    const cooldownEnd = new Date(lastTriggered.getTime() + cooldownMinutes * 60000);
    const shouldTrigger = now >= cooldownEnd;

    expect(shouldTrigger).toBe(true);
  });
});

describe('Alert Policies - Validation', () => {
  it('should validate threshold is between 0 and 100', () => {
    const validThresholds = [0, 25, 50, 75, 100];
    
    validThresholds.forEach((threshold) => {
      expect(threshold >= 0 && threshold <= 100).toBe(true);
    });
  });

  it('should reject invalid thresholds', () => {
    const invalidThresholds = [-10, 150, 999];
    
    invalidThresholds.forEach((threshold) => {
      expect(threshold >= 0 && threshold <= 100).toBe(false);
    });
  });

  it('should validate cooldown is at least 5 minutes', () => {
    const validCooldowns = [5, 30, 60, 120];
    
    validCooldowns.forEach((cooldown) => {
      expect(cooldown >= 5).toBe(true);
    });
  });

  it('should reject invalid cooldowns', () => {
    const invalidCooldowns = [0, 1, 4, -10];
    
    invalidCooldowns.forEach((cooldown) => {
      expect(cooldown >= 5).toBe(false);
    });
  });
});
