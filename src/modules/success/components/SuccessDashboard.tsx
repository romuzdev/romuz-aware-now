/**
 * M25 - Success Dashboard Component
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { useHealthScore } from '../hooks';
import { HealthScoreCard } from './HealthScoreCard';
import { ActivePlaybooksPanel } from './ActivePlaybooksPanel';
import { RecommendationsPanel } from './RecommendationsPanel';
import { ProgressTimeline } from './ProgressTimeline';

export function SuccessDashboard() {
  const { currentHealth, healthTrend, isLoading, recompute, isRecomputing } = useHealthScore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مؤشر نجاح المنشأة</h1>
          <p className="text-muted-foreground mt-1">
            متابعة صحة النظام والتقدم نحو الأهداف
          </p>
        </div>
      </div>

      {/* Health Score Overview */}
      <HealthScoreCard
        snapshot={currentHealth}
        trend={healthTrend}
        onRecompute={recompute}
        isRecomputing={isRecomputing}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Playbooks */}
        <ActivePlaybooksPanel />

        {/* Recommendations */}
        <RecommendationsPanel />
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline />
    </div>
  );
}
