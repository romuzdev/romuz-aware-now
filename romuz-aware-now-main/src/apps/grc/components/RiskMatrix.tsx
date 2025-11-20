/**
 * GRC Platform - Risk Matrix Component
 * 5x5 Risk Matrix (Likelihood vs Impact)
 */

import { Card } from '@/core/components/ui/card';
import type { Risk } from '@/modules/grc/types';

interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

export function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  // Group risks by likelihood and impact
  const getRisksInCell = (likelihood: number, impact: number): Risk[] => {
    return risks.filter(
      (r) => r.likelihood_score === likelihood && r.impact_score === impact
    );
  };

  // Get cell color based on risk score
  const getCellColor = (likelihood: number, impact: number): string => {
    const score = likelihood * impact;
    if (score > 16) return 'bg-red-500 dark:bg-red-700';
    if (score > 12) return 'bg-orange-500 dark:bg-orange-700';
    if (score > 8) return 'bg-yellow-500 dark:bg-yellow-700';
    if (score > 4) return 'bg-green-500 dark:bg-green-700';
    return 'bg-blue-500 dark:bg-blue-700';
  };

  // Impact levels (5 = highest)
  const impactLevels = [5, 4, 3, 2, 1];
  const impactLabels = ['كارثي', 'عالي', 'متوسط', 'منخفض', 'ضئيل'];

  // Likelihood levels (1 to 5)
  const likelihoodLevels = [1, 2, 3, 4, 5];
  const likelihoodLabels = [
    'نادر جداً',
    'نادر',
    'محتمل',
    'محتمل جداً',
    'شبه مؤكد',
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">مصفوفة المخاطر (5×5)</h3>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Matrix Table */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_repeat(5,minmax(80px,1fr))] bg-muted">
              <div className="p-2 font-semibold text-sm flex items-center justify-center border-b border-r">
                التأثير
              </div>
              {likelihoodLevels.map((level, idx) => (
                <div
                  key={level}
                  className="p-2 text-center border-b border-r last:border-r-0"
                >
                  <div className="font-semibold text-sm">{level}</div>
                  <div className="text-xs text-muted-foreground">
                    {likelihoodLabels[idx]}
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            {impactLevels.map((impactLevel, rowIdx) => (
              <div
                key={impactLevel}
                className="grid grid-cols-[100px_repeat(5,minmax(80px,1fr))]"
              >
                {/* Impact Label */}
                <div className="p-2 bg-muted border-b border-r flex flex-col items-center justify-center">
                  <div className="font-semibold text-sm">{impactLevel}</div>
                  <div className="text-xs text-muted-foreground text-center">
                    {impactLabels[rowIdx]}
                  </div>
                </div>

                {/* Matrix Cells */}
                {likelihoodLevels.map((likelihoodLevel) => {
                  const cellRisks = getRisksInCell(likelihoodLevel, impactLevel);
                  const score = likelihoodLevel * impactLevel;

                  return (
                    <div
                      key={`${likelihoodLevel}-${impactLevel}`}
                      className={`
                        relative p-2 border-b border-r last:border-r-0
                        ${getCellColor(likelihoodLevel, impactLevel)}
                        hover:opacity-80 transition-opacity
                        min-h-[80px]
                      `}
                    >
                      {/* Risk Score */}
                      <div className="absolute top-1 left-1 text-xs font-bold text-white opacity-50">
                        {score}
                      </div>

                      {/* Risks in Cell */}
                      {cellRisks.length > 0 && (
                        <div className="flex flex-col gap-1">
                          {cellRisks.slice(0, 3).map((risk) => (
                            <button
                              key={risk.id}
                              onClick={() => onRiskClick?.(risk)}
                              className="
                                bg-white dark:bg-gray-800
                                px-2 py-1 rounded text-xs
                                hover:ring-2 hover:ring-white
                                transition-all
                                text-left truncate
                              "
                              title={risk.risk_title}
                            >
                              {risk.risk_code}
                            </button>
                          ))}
                          {cellRisks.length > 3 && (
                            <div className="text-xs text-white font-semibold text-center">
                              +{cellRisks.length - 3} أخرى
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty Cell Indicator */}
                      {cellRisks.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white opacity-30 text-2xl">-</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">عالية جداً (17-25)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">عالية (13-16)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">متوسطة (9-12)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">منخفضة (5-8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">منخفضة جداً (1-4)</span>
            </div>
          </div>

          {/* Axis Labels */}
          <div className="mt-4 text-center">
            <div className="text-sm font-semibold">
              المحور الأفقي: احتمالية الحدوث (Likelihood)
            </div>
            <div className="text-sm font-semibold">
              المحور الرأسي: شدة التأثير (Impact)
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
