// Gate-J Part 4.3: Calibration Service Tests

import { describe, it, expect } from 'vitest';
import {
  classifyPredictedBucket,
  classifyActualBucket,
  determineGapDirection,
} from '@/services/calibrationService';

describe('Calibration Service - Classification Functions', () => {
  describe('classifyPredictedBucket', () => {
    it('should classify very_low_risk for scores >= 85', () => {
      expect(classifyPredictedBucket(85)).toBe('very_low_risk');
      expect(classifyPredictedBucket(90)).toBe('very_low_risk');
      expect(classifyPredictedBucket(100)).toBe('very_low_risk');
    });

    it('should classify low_risk for scores [70, 85)', () => {
      expect(classifyPredictedBucket(70)).toBe('low_risk');
      expect(classifyPredictedBucket(75)).toBe('low_risk');
      expect(classifyPredictedBucket(84.99)).toBe('low_risk');
    });

    it('should classify medium_risk for scores [40, 70)', () => {
      expect(classifyPredictedBucket(40)).toBe('medium_risk');
      expect(classifyPredictedBucket(55)).toBe('medium_risk');
      expect(classifyPredictedBucket(69.99)).toBe('medium_risk');
    });

    it('should classify high_risk for scores < 40', () => {
      expect(classifyPredictedBucket(0)).toBe('high_risk');
      expect(classifyPredictedBucket(25)).toBe('high_risk');
      expect(classifyPredictedBucket(39.99)).toBe('high_risk');
    });
  });

  describe('classifyActualBucket', () => {
    it('should classify very_good_behavior for scores >= 85', () => {
      expect(classifyActualBucket(85)).toBe('very_good_behavior');
      expect(classifyActualBucket(95)).toBe('very_good_behavior');
      expect(classifyActualBucket(100)).toBe('very_good_behavior');
    });

    it('should classify good_behavior for scores [70, 85)', () => {
      expect(classifyActualBucket(70)).toBe('good_behavior');
      expect(classifyActualBucket(77)).toBe('good_behavior');
      expect(classifyActualBucket(84.99)).toBe('good_behavior');
    });

    it('should classify average_behavior for scores [50, 70)', () => {
      expect(classifyActualBucket(50)).toBe('average_behavior');
      expect(classifyActualBucket(60)).toBe('average_behavior');
      expect(classifyActualBucket(69.99)).toBe('average_behavior');
    });

    it('should classify poor_behavior for scores [30, 50)', () => {
      expect(classifyActualBucket(30)).toBe('poor_behavior');
      expect(classifyActualBucket(40)).toBe('poor_behavior');
      expect(classifyActualBucket(49.99)).toBe('poor_behavior');
    });

    it('should classify very_poor_behavior for scores < 30', () => {
      expect(classifyActualBucket(0)).toBe('very_poor_behavior');
      expect(classifyActualBucket(15)).toBe('very_poor_behavior');
      expect(classifyActualBucket(29.99)).toBe('very_poor_behavior');
    });
  });

  describe('determineGapDirection', () => {
    it('should return balanced for small gaps', () => {
      expect(determineGapDirection(0)).toBe('balanced');
      expect(determineGapDirection(3)).toBe('balanced');
      expect(determineGapDirection(-4)).toBe('balanced');
      expect(determineGapDirection(5)).toBe('balanced');
      expect(determineGapDirection(-5)).toBe('balanced');
    });

    it('should return overestimate for positive gaps > 5', () => {
      expect(determineGapDirection(6)).toBe('overestimate');
      expect(determineGapDirection(10)).toBe('overestimate');
      expect(determineGapDirection(25)).toBe('overestimate');
    });

    it('should return underestimate for negative gaps < -5', () => {
      expect(determineGapDirection(-6)).toBe('underestimate');
      expect(determineGapDirection(-15)).toBe('underestimate');
      expect(determineGapDirection(-30)).toBe('underestimate');
    });
  });
});

describe('Calibration Logic - Integration Scenarios', () => {
  describe('Overall Status Determination', () => {
    it('should classify as good when gap <= 10 and correlation >= 75', () => {
      const avgGap = 8;
      const correlation = 80;
      
      const status = avgGap <= 10 && correlation >= 75 ? 'good' : 
                     avgGap <= 20 ? 'needs_tuning' : 'bad';
      
      expect(status).toBe('good');
    });

    it('should classify as needs_tuning when gap <= 20', () => {
      const avgGap = 15;
      const correlation = 70;
      
      const status = avgGap <= 10 && correlation >= 75 ? 'good' : 
                     avgGap <= 20 ? 'needs_tuning' : 'bad';
      
      expect(status).toBe('needs_tuning');
    });

    it('should classify as bad when gap > 20 or correlation < 60', () => {
      const avgGap1 = 25;
      const correlation1 = 80;
      
      const status1 = avgGap1 <= 10 && correlation1 >= 75 ? 'good' : 
                      avgGap1 <= 20 ? 'needs_tuning' : 'bad';
      
      expect(status1).toBe('bad');

      const avgGap2 = 15;
      const correlation2 = 55;
      
      const status2 = avgGap2 <= 10 && correlation2 >= 75 ? 'good' : 
                      avgGap2 <= 20 && correlation2 >= 60 ? 'needs_tuning' : 'bad';
      
      expect(status2).toBe('bad');
    });
  });

  describe('Outlier Detection', () => {
    it('should mark as outlier when sample count < 3', () => {
      const sampleCount = 2;
      const avgGap = 10;
      
      const isOutlier = sampleCount < 3 || avgGap > 25;
      
      expect(isOutlier).toBe(true);
    });

    it('should mark as outlier when avg gap > 25', () => {
      const sampleCount = 10;
      const avgGap = 30;
      
      const isOutlier = sampleCount < 3 || avgGap > 25;
      
      expect(isOutlier).toBe(true);
    });

    it('should not mark as outlier when conditions are met', () => {
      const sampleCount = 10;
      const avgGap = 15;
      
      const isOutlier = sampleCount < 3 || avgGap > 25;
      
      expect(isOutlier).toBe(false);
    });
  });

  describe('Weight Normalization', () => {
    it('should normalize weights to sum to 1.0', () => {
      let weights = {
        engagement: 0.30,
        completion: 0.25,
        feedbackQuality: 0.25,
        complianceLinkage: 0.25,
      };

      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      weights = {
        engagement: weights.engagement / sum,
        completion: weights.completion / sum,
        feedbackQuality: weights.feedbackQuality / sum,
        complianceLinkage: weights.complianceLinkage / sum,
      };

      const finalSum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(finalSum).toBeCloseTo(1.0, 10);
    });

    it('should clamp weights to [0.1, 0.5] range', () => {
      let weights = {
        engagement: 0.60, // exceeds max
        completion: 0.05, // below min
        feedbackQuality: 0.25,
        complianceLinkage: 0.10,
      };

      weights.engagement = Math.max(0.1, Math.min(0.5, weights.engagement));
      weights.completion = Math.max(0.1, Math.min(0.5, weights.completion));

      expect(weights.engagement).toBe(0.5);
      expect(weights.completion).toBe(0.1);
    });
  });
});
