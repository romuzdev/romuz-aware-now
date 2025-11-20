/**
 * M16: AI Advisory Engine - Main Advisory Panel Component
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { useAIAdvisory } from '../hooks/useAIAdvisory';
import { useRecommendationFeedback } from '../hooks/useRecommendationFeedback';
import { RecommendationCard } from './RecommendationCard';
import type { ContextType } from '../types/ai-advisory.types';

interface AIAdvisoryPanelProps {
  contextType: ContextType;
  contextId: string;
  contextData?: any;
  title?: string;
  description?: string;
}

export function AIAdvisoryPanel({
  contextType,
  contextId,
  contextData,
  title = 'التوصيات الذكية',
  description = 'احصل على توصيات مدعومة بالذكاء الاصطناعي لتحسين عملك',
}: AIAdvisoryPanelProps) {
  const [language] = useState<'ar' | 'en' | 'both'>('both');

  const {
    recommendations,
    isLoading,
    requestRecommendation,
    isRequesting,
    acceptRecommendation,
    rejectRecommendation,
    implementRecommendation,
  } = useAIAdvisory({ context_type: contextType, status: 'pending' });

  const { provideFeedback } = useRecommendationFeedback();

  // Filter recommendations for this specific context
  const contextRecommendations = recommendations.filter(
    (rec) => rec.context_id === contextId && rec.context_type === contextType
  );

  const handleRequestRecommendation = () => {
    requestRecommendation({
      context_type: contextType,
      context_id: contextId,
      context_data: contextData,
      language,
    });
  };

  const handleFeedback = (id: string, rating: number, comment?: string) => {
    provideFeedback({
      recommendation_id: id,
      rating,
      comment,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>

          <Button
            onClick={handleRequestRecommendation}
            disabled={isRequesting}
            className="gap-2"
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                احصل على توصية ذكية
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && contextRecommendations.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              لا توجد توصيات حالياً. اضغط على "احصل على توصية ذكية" للبدء.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && contextRecommendations.length > 0 && (
          <div className="space-y-4">
            {contextRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAccept={acceptRecommendation}
                onReject={(id, reason) => rejectRecommendation({ id, reason })}
                onImplement={(id, notes) => implementRecommendation({ id, notes })}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
