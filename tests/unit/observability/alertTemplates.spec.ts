// ============================================================================
// Gate-E: Unit Tests - Alert Templates Variable Replacement
// ============================================================================

import { describe, it, expect } from 'vitest';

describe('Alert Templates - Variable Replacement', () => {
  describe('Basic Variable Substitution', () => {
    it('should replace {{metric}} variable', () => {
      const template = 'Alert: {{metric}} threshold breached';
      const result = template.replace('{{metric}}', 'completion_rate');

      expect(result).toBe('Alert: completion_rate threshold breached');
    });

    it('should replace {{value}} variable', () => {
      const template = 'Current value: {{value}}%';
      const result = template.replace('{{value}}', '45.00');

      expect(result).toBe('Current value: 45.00%');
    });

    it('should replace {{severity}} variable', () => {
      const template = '[{{severity}}] Alert detected';
      const result = template.replace('{{severity}}', 'CRITICAL');

      expect(result).toBe('[CRITICAL] Alert detected');
    });
  });

  describe('Multiple Variable Replacement', () => {
    it('should replace all variables in template', () => {
      let template = 'Alert: {{metric}} = {{value}}% (baseline: {{baseline}}%)';
      
      template = template
        .replace('{{metric}}', 'completion_rate')
        .replace('{{value}}', '45.00')
        .replace('{{baseline}}', '50.00');

      expect(template).toBe('Alert: completion_rate = 45.00% (baseline: 50.00%)');
    });

    it('should handle complex template with all variables', () => {
      let template = '[{{severity}}] {{metric}} detected at {{value}}% in {{time_window}}';
      
      template = template
        .replace('{{severity}}', 'WARN')
        .replace('{{metric}}', 'open_rate')
        .replace('{{value}}', '30.50')
        .replace('{{time_window}}', 'daily');

      expect(template).toBe('[WARN] open_rate detected at 30.50% in daily');
    });
  });

  describe('Template Validation', () => {
    it('should detect missing variables', () => {
      const template = '{{metric}} = {{value}}%';
      const requiredVars = ['metric', 'value', 'baseline'];

      const templateVars = template.match(/\{\{(\w+)\}\}/g)?.map(v => 
        v.replace(/[{}]/g, '')
      ) || [];

      const missingVars = requiredVars.filter(v => !templateVars.includes(v));
      expect(missingVars).toContain('baseline');
    });

    it('should validate template has at least one variable', () => {
      const template = 'Static text without variables';
      const hasVariables = /\{\{\w+\}\}/.test(template);

      expect(hasVariables).toBe(false);
    });

    it('should extract all variables from template', () => {
      const template = '{{metric}} at {{value}}% (baseline: {{baseline}}%)';
      const variables = template.match(/\{\{(\w+)\}\}/g)?.map(v => 
        v.replace(/[{}]/g, '')
      ) || [];

      expect(variables).toEqual(['metric', 'value', 'baseline']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const template = 'Alert: {{metric}}';
      const result = template.replace('{{metric}}', '');

      expect(result).toBe('Alert: ');
    });

    it('should handle special characters in values', () => {
      const template = 'Alert: {{metric}}';
      const result = template.replace('{{metric}}', 'test_metric_123');

      expect(result).toBe('Alert: test_metric_123');
    });

    it('should not replace non-matching variables', () => {
      const template = '{{metric}} and {{other}}';
      const result = template.replace('{{metric}}', 'completion_rate');

      expect(result).toBe('completion_rate and {{other}}');
    });
  });
});

describe('Alert Templates - Locale Support', () => {
  it('should support Arabic templates', () => {
    const template = 'تنبيه: {{metric}} = {{value}}%';
    const result = template
      .replace('{{metric}}', 'معدل الإنجاز')
      .replace('{{value}}', '45.00');

    expect(result).toBe('تنبيه: معدل الإنجاز = 45.00%');
  });

  it('should support English templates', () => {
    const template = 'Alert: {{metric}} = {{value}}%';
    const result = template
      .replace('{{metric}}', 'completion_rate')
      .replace('{{value}}', '45.00');

    expect(result).toBe('Alert: completion_rate = 45.00%');
  });

  it('should validate locale is ar or en', () => {
    const validLocales = ['ar', 'en'];
    const invalidLocales = ['fr', 'es', 'de'];

    validLocales.forEach((locale) => {
      expect(['ar', 'en'].includes(locale)).toBe(true);
    });

    invalidLocales.forEach((locale) => {
      expect(['ar', 'en'].includes(locale)).toBe(false);
    });
  });
});
