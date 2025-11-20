// Gate-J Part 4.4: Weight Suggestion Review
// Compare current vs suggested weights and approve/reject

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { Badge } from '@/core/components/ui/badge';
import { WeightComparisonTable } from '@/modules/awareness/components/calibration-impact/calibration/WeightComparisonTable';
import { useWeightSuggestions } from '@/modules/awareness/hooks/useWeightSuggestions';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { calibrationService } from '@/core/services';
import { toast } from 'sonner';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';

export default function WeightSuggestionReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAppContext();
  const [isApproving, setIsApproving] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const { data: suggestions, isLoading, refetch } = useWeightSuggestions(tenantId, {
    calibrationRunId: id,
  });

  const activeSuggestion = suggestions?.find(s => s.status === 'draft' || s.status === 'proposed');

  const handleApprove = async () => {
    if (!activeSuggestion) return;

    setIsApproving(true);
    try {
      await calibrationService.approveAndApplyWeightSuggestion(activeSuggestion.id, 'current-user-id'); // TODO: Get actual user ID
      toast.success('New weights approved successfully');
      refetch();
      setShowApprovalDialog(false);
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
      toast.error('Failed to approve weights');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!activeSuggestion) return;

    try {
      const { error } = await supabase
        .from('awareness_impact_weight_suggestions')
        .update({ status: 'rejected' })
        .eq('id', activeSuggestion.id)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success('Suggestion rejected successfully');
      refetch();
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
      toast.error('Failed to reject suggestion');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeSuggestion) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No weight suggestions available for this calibration</p>
            <Button onClick={() => navigate(`/admin/awareness/impact/calibration/${id}`)} className="mt-4">
              Back to Calibration Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-secondary',
    proposed: 'bg-blue-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    applied: 'bg-primary',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    proposed: 'Proposed',
    approved: 'Approved',
    rejected: 'Rejected',
    applied: 'Applied',
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/awareness/impact/calibration/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Weight Suggestion Review
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare current weights with suggested weights based on calibration results
            </p>
          </div>
        </div>
        <Badge className={statusColors[activeSuggestion.status || 'draft']}>
          {statusLabels[activeSuggestion.status || 'draft']}
        </Badge>
      </div>

      {/* Rationale Alert */}
      {activeSuggestion.rationale && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="ml-7">
            <strong>Rationale:</strong> {activeSuggestion.rationale}
          </AlertDescription>
        </Alert>
      )}

      {/* Weight Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Comparison</CardTitle>
          <CardDescription>
            Current weights (Version {activeSuggestion.sourceWeightVersion}) vs. Suggested weights (Version {activeSuggestion.suggestedWeightVersion})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightComparisonTable suggestion={activeSuggestion} />
        </CardContent>
      </Card>

      {/* Actions */}
      {activeSuggestion.status !== 'applied' && activeSuggestion.status !== 'rejected' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              Approve the suggestion to activate new weights or reject it
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={() => setShowApprovalDialog(true)}
              disabled={isApproving}
              size="lg"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve & Apply
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isApproving}
              size="lg"
            >
              <X className="mr-2 h-4 w-4" />
              Reject Suggestion
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Integrate with Gate-F export functionality
                toast.info('Export: Will integrate with Gate-F Export API');
              }}
              disabled
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm New Weight Approval</AlertDialogTitle>
            <AlertDialogDescription>
              A new weight version (Version {activeSuggestion.suggestedWeightVersion}) will be created
              and the current version will be disabled. This action will affect future impact calculations.
              <br /><br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Applying...' : 'Confirm Approval'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}