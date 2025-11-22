/**
 * Compliance Automation Hooks
 * Phase 3: GRC Enhancement
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import {
  detectComplianceGaps,
  fetchComplianceDashboard,
  getControlMappingSuggestions,
  applyControlMapping,
  generateRemediationPlan,
  bulkRemediateGaps,
  type AutomatedComplianceGap,
} from '../integration/compliance-automation.integration';
import { useToast } from '@/hooks/use-toast';

export function useAutomatedComplianceGaps(frameworkId?: string) {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['compliance-gaps', tenantId, frameworkId],
    queryFn: () => detectComplianceGaps(tenantId!, frameworkId),
    enabled: !!tenantId,
  });
}

export function useComplianceDashboard() {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['compliance-dashboard', tenantId],
    queryFn: () => fetchComplianceDashboard(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useControlMappingSuggestions(requirementId: string) {
  const { tenantId } = useAppContext();
  
  return useQuery({
    queryKey: ['control-mapping-suggestions', tenantId, requirementId],
    queryFn: () => getControlMappingSuggestions(tenantId!, requirementId),
    enabled: !!tenantId && !!requirementId,
  });
}

export function useApplyControlMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ requirementId, controlId, mappingType }: {
      requirementId: string;
      controlId: string;
      mappingType?: 'primary' | 'supporting';
    }) => applyControlMapping(requirementId, controlId, mappingType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-gaps'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
      toast({
        title: 'نجح الربط',
        description: 'تم ربط الضابط بالمتطلب بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'فشل الربط',
        description: error.message,
      });
    },
  });
}

export function useGenerateRemediationPlan() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (gap: AutomatedComplianceGap) => generateRemediationPlan(gap),
    onSuccess: () => {
      toast({
        title: 'تم إنشاء الخطة',
        description: 'تم إنشاء خطة المعالجة بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'فشل إنشاء الخطة',
        description: error.message,
      });
    },
  });
}

export function useBulkRemediateGaps() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ gaps, remediationType }: {
      gaps: AutomatedComplianceGap[];
      remediationType: 'auto_map' | 'create_controls' | 'assign_owners';
    }) => bulkRemediateGaps(gaps, remediationType),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-gaps'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
      
      toast({
        title: 'اكتملت المعالجة الجماعية',
        description: `نجح: ${result.success_count}, فشل: ${result.failed_count}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'فشلت المعالجة الجماعية',
        description: error.message,
      });
    },
  });
}
