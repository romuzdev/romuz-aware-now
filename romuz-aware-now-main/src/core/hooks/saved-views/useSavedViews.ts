import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/hooks/use-toast';

export type SavedView = {
  id: string;
  tenant_id: string;
  user_id: string;
  page_key: string;
  name: string;
  filters: any;  // JSONB
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type UseSavedViewsParams = {
  pageKey: string;  // e.g., 'campaigns:list'
};

/**
 * useSavedViews - Server-side Saved Views API
 * 
 * Provides full CRUD operations for saved views with strict RLS (tenant + user scoped).
 * 
 * Usage:
 *   const { views, loading, createView, applyView, deleteView, setDefault } = useSavedViews({ pageKey: 'campaigns:list' });
 *   
 *   // Create a new view
 *   await createView('My Active Campaigns', { status: 'active', ... });
 *   
 *   // Apply a saved view (returns filters object)
 *   const filters = await applyView(viewId);
 *   setFilters(filters);
 *   
 *   // Set as default
 *   await setDefault(viewId);
 *   
 *   // Delete view
 *   await deleteView(viewId);
 */
export function useSavedViews({ pageKey }: UseSavedViewsParams) {
  const { tenantId, user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ['saved-views', pageKey, tenantId, user?.id];

  // Fetch saved views (sorted: is_default first, then created_at DESC)
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!tenantId || !user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('page_key', pageKey)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedView[];
    },
    enabled: !!tenantId && !!user?.id,
  });

  // Create new view
  const createMutation = useMutation({
    mutationFn: async ({ name, filters }: { name: string; filters: any }) => {
      if (!tenantId || !user?.id) {
        throw new Error('Missing tenant or user context');
      }

      const { data, error } = await supabase
        .from('saved_views')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          page_key: pageKey,
          name,
          filters,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'View saved', description: 'Your saved view has been created.' });
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to save view', 
        description: error.message 
      });
    },
  });

  // Delete view
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'View deleted', description: 'Saved view has been removed.' });
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to delete view', 
        description: error.message 
      });
    },
  });

  // Set default view (unsets all other defaults for same page_key)
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId || !user?.id) {
        throw new Error('Missing tenant or user context');
      }

      // Step 1: Unset all defaults for this page
      const { error: unsetError } = await supabase
        .from('saved_views')
        .update({ is_default: false })
        .eq('page_key', pageKey)
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id);

      if (unsetError) throw unsetError;

      // Step 2: Set this view as default
      const { error: setError } = await supabase
        .from('saved_views')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Default view set', description: 'This view will be applied by default.' });
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to set default', 
        description: error.message 
      });
    },
  });

  // Apply view (returns filters object)
  const applyView = (id: string): any | null => {
    const view = query.data?.find(v => v.id === id);
    if (!view) {
      toast({ 
        variant: 'destructive', 
        title: 'View not found', 
        description: 'Could not find the requested saved view.' 
      });
      return null;
    }
    return view.filters;
  };

  // Get default view (if any)
  const getDefaultView = (): SavedView | null => {
    return query.data?.find(v => v.is_default) ?? null;
  };

  return {
    views: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createView: (name: string, filters: any) => createMutation.mutateAsync({ name, filters }),
    applyView,
    deleteView: (id: string) => deleteMutation.mutateAsync(id),
    setDefault: (id: string) => setDefaultMutation.mutateAsync(id),
    getDefaultView,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
  };
}
