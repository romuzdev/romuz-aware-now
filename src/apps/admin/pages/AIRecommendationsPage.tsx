/**
 * M16: AI Recommendations Page
 * Full-page view for AI recommendations
 */

import AdminLayout from '@/core/components/layout/AdminLayout';
import { RecommendationsList } from '@/modules/ai-advisory/components';

export default function AIRecommendationsPage() {
  return (
    <AdminLayout>
      <RecommendationsList />
    </AdminLayout>
  );
}
