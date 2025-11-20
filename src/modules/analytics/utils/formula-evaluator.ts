/**
 * M14 Enhancement - Formula Evaluator
 * Client-side formula validation and preview
 */

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string): {
  isValid: boolean;
  error?: string;
} {
  if (!formula || formula.trim() === '') {
    return { isValid: false, error: 'الصيغة فارغة' };
  }

  // Check for balanced parentheses
  let openCount = 0;
  for (const char of formula) {
    if (char === '(') openCount++;
    if (char === ')') openCount--;
    if (openCount < 0) {
      return { isValid: false, error: 'أقواس غير متوازنة' };
    }
  }
  if (openCount !== 0) {
    return { isValid: false, error: 'أقواس غير متوازنة' };
  }

  // Check for invalid characters
  const validPattern = /^[0-9+\-*/(). {}a-zA-Z_]+$/;
  if (!validPattern.test(formula)) {
    return { isValid: false, error: 'الصيغة تحتوي على رموز غير صالحة' };
  }

  // Check for consecutive operators
  const consecutiveOps = /[+\-*/]{2,}/;
  if (consecutiveOps.test(formula.replace(/[()]/g, ''))) {
    return { isValid: false, error: 'عمليات حسابية متتالية' };
  }

  // Check for variables format {variable_name}
  const variablePattern = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;
  const variables = formula.match(variablePattern);
  if (variables) {
    for (const variable of variables) {
      const varName = variable.slice(1, -1);
      if (varName.length === 0) {
        return { isValid: false, error: 'اسم متغير فارغ' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Extract variables from formula
 */
export function extractVariables(formula: string): string[] {
  const variablePattern = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;
  const matches = formula.match(variablePattern);
  if (!matches) return [];
  
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

/**
 * Preview formula evaluation with sample values
 */
export function previewFormula(
  formula: string,
  sampleValues: Record<string, number>
): {
  result: number | null;
  error?: string;
} {
  const validation = validateFormula(formula);
  if (!validation.isValid) {
    return { result: null, error: validation.error };
  }

  try {
    // Replace variables with sample values
    let evaluable = formula;
    for (const [key, value] of Object.entries(sampleValues)) {
      evaluable = evaluable.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }

    // Check if all variables are replaced
    if (evaluable.includes('{')) {
      return { result: null, error: 'بعض المتغيرات لم يتم تعويضها' };
    }

    // Evaluate using Function (safe for preview only)
    const result = new Function(`return ${evaluable}`)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: null, error: 'النتيجة غير صالحة' };
    }

    return { result: Math.round(result * 100) / 100 };
  } catch (error) {
    return { result: null, error: 'خطأ في تقييم الصيغة' };
  }
}

/**
 * Format formula for display (highlight variables)
 */
export function formatFormulaDisplay(formula: string): string {
  return formula.replace(/{([^}]+)}/g, '<span class="text-primary font-semibold">{$1}</span>');
}

/**
 * Get formula examples
 */
export const FORMULA_EXAMPLES = [
  {
    name: 'معدل المخاطر العالية',
    formula: '({high_risk_count} / {risk_count}) * 100',
    description: 'نسبة المخاطر العالية من إجمالي المخاطر'
  },
  {
    name: 'متوسط الحملات النشطة',
    formula: '{active_campaign_count} / {campaign_count}',
    description: 'متوسط الحملات النشطة'
  },
  {
    name: 'نسبة الامتثال',
    formula: '({approved_policy_count} / {policy_count}) * 100',
    description: 'نسبة السياسات المعتمدة'
  },
  {
    name: 'مؤشر مركب',
    formula: '({risk_count} * 0.4) + ({campaign_count} * 0.3) + ({audit_count} * 0.3)',
    description: 'مؤشر مركب مرجح'
  }
];
