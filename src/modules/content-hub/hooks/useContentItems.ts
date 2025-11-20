/**
 * M13.1 - Content Hub: useContentItems Hook
 * Hook لإدارة المحتوى مع Real-time Updates
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useToast } from '@/core/components/ui/use-toast';
import {
  getContentItems,
  getContentItem,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  publishContentItem,
  archiveContentItem,
  getPopularContent,
  getRecentContent,
  type ContentFilters,
  type ContentPagination,
} from '@/integrations/supabase/content-hub/content-items';
import type { Database } from '@/integrations/supabase/types';

type ContentItem = Database['public']['Tables']['content_items']['Row'];

export function useContentItems(
  initialFilters?: ContentFilters,
  initialPagination?: ContentPagination
) {
  const { tenantId, user } = useAppContext();
  const userId = user?.id;
  const { toast } = useToast();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ContentFilters | undefined>(initialFilters);
  const [pagination, setPagination] = useState<ContentPagination | undefined>(initialPagination);

  // Fetch content items
  const fetchItems = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const result = await getContentItems(tenantId, filters, pagination);
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching content items:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المحتوى',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, pagination, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Create new content
  const create = useCallback(async (data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'created_by' | 'updated_by'>) => {
    if (!tenantId || !userId) return null;

    try {
      const newItem = await createContentItem({
        ...data,
        tenant_id: tenantId,
        author_id: userId,
        created_by: userId,
        updated_by: userId,
      });

      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء المحتوى بنجاح',
      });

      await fetchItems();
      return newItem;
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء المحتوى',
        variant: 'destructive',
      });
      return null;
    }
  }, [tenantId, userId, toast, fetchItems]);

  // Update content
  const update = useCallback(async (id: string, data: Partial<ContentItem>) => {
    if (!userId) return null;

    try {
      const updated = await updateContentItem(id, {
        ...data,
        updated_by: userId,
      });

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المحتوى بنجاح',
      });

      await fetchItems();
      return updated;
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث المحتوى',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, toast, fetchItems]);

  // Delete content
  const remove = useCallback(async (id: string) => {
    try {
      await deleteContentItem(id);

      toast({
        title: 'تم الحذف',
        description: 'تم حذف المحتوى بنجاح',
      });

      await fetchItems();
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المحتوى',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchItems]);

  // Publish content
  const publish = useCallback(async (id: string) => {
    if (!userId) return null;

    try {
      const published = await publishContentItem(id, userId);

      toast({
        title: 'تم النشر',
        description: 'تم نشر المحتوى بنجاح',
      });

      await fetchItems();
      return published;
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في نشر المحتوى',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, toast, fetchItems]);

  // Archive content
  const archive = useCallback(async (id: string) => {
    if (!userId) return null;

    try {
      const archived = await archiveContentItem(id, userId);

      toast({
        title: 'تم الأرشفة',
        description: 'تم أرشفة المحتوى بنجاح',
      });

      await fetchItems();
      return archived;
    } catch (error) {
      console.error('Error archiving content:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في أرشفة المحتوى',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, toast, fetchItems]);

  // Update filters
  const updateFilters = useCallback((newFilters: ContentFilters) => {
    setFilters(newFilters);
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPagination: ContentPagination) => {
    setPagination(newPagination);
  }, []);

  // Refresh
  const refresh = useCallback(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    total,
    filters,
    pagination,
    create,
    update,
    remove,
    publish,
    archive,
    updateFilters,
    updatePagination,
    refresh,
  };
}

/**
 * Hook for single content item
 */
export function useContentItem(id: string | null) {
  const { toast } = useToast();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await getContentItem(id);
        setItem(data);
      } catch (error) {
        console.error('Error fetching content item:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل المحتوى',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, toast]);

  return { item, loading };
}

/**
 * Hook for popular content
 */
export function usePopularContent(limit: number = 10, metric: 'views' | 'likes' = 'views') {
  const { tenantId } = useAppContext();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchPopular = async () => {
      try {
        setLoading(true);
        const data = await getPopularContent(tenantId, limit, metric);
        setItems(data);
      } catch (error) {
        console.error('Error fetching popular content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, [tenantId, limit, metric]);

  return { items, loading };
}

/**
 * Hook for recent content
 */
export function useRecentContent(limit: number = 10) {
  const { tenantId } = useAppContext();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await getRecentContent(tenantId, limit);
        setItems(data);
      } catch (error) {
        console.error('Error fetching recent content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [tenantId, limit]);

  return { items, loading };
}
