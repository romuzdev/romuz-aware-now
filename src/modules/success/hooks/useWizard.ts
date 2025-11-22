/**
 * M25 - Setup Wizard Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getWizardState,
  initializeWizard,
  updateWizardProgress,
  completeWizardStep,
  resetWizard,
} from '../integration';

const QUERY_KEY = ['success', 'wizard'];

export function useWizard(wizardType: 'initial_setup' | 'module_setup' = 'initial_setup') {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get wizard state
  const { data: wizard, isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, wizardType],
    queryFn: () => getWizardState(wizardType),
  });

  // Initialize wizard
  const initializeMutation = useMutation({
    mutationFn: initializeWizard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم بدء معالج الإعداد',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update progress
  const updateProgressMutation = useMutation({
    mutationFn: updateWizardProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete step
  const completeStepMutation = useMutation({
    mutationFn: completeWizardStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إكمال الخطوة بنجاح',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset wizard
  const resetMutation = useMutation({
    mutationFn: () => resetWizard(wizardType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast({
        title: 'تم',
        description: 'تم إعادة تعيين المعالج',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    wizard,
    isLoading,
    error,
    initialize: initializeMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    completeStep: completeStepMutation.mutate,
    reset: resetMutation.mutate,
    isInitializing: initializeMutation.isPending,
    isUpdating: updateProgressMutation.isPending,
  };
}
