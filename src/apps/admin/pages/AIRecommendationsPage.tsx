/**
 * M16: AI Recommendations Page
 * Full-page view for AI recommendations
 */

import { RecommendationsList, AITestPanel } from '@/modules/ai-advisory/components';

export default function AIRecommendationsPage() {
  return (
    <div className="space-y-6">
      <AITestPanel />
      <RecommendationsList />
    </div>
  );
}
