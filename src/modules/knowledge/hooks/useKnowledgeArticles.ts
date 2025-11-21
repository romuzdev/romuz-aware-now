/**
 * M17: Knowledge Hub - Articles Hook
 * React hook for knowledge articles management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/core/components/ui/use-toast';
import {
  fetchKnowledgeArticles,
  fetchArticleById,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
  publishArticle,
  unpublishArticle,
  verifyArticle,
  incrementArticleView,
  recordArticleFeedback,
  getArticleStats,
  getTrendingArticles,
  getRelatedArticles,
  type ArticleFilters,
} from '@/integrations/supabase/knowledge-articles';
import { useAppContext } from '@/lib/app-context/AppContextProvider';

/**
 * Fetch knowledge articles with filters
 */
export function useKnowledgeArticles(filters?: ArticleFilters) {
  return useQuery({
    queryKey: ['knowledge-articles', filters],
    queryFn: () => fetchKnowledgeArticles(filters),
  });
}

/**
 * Fetch single article by ID
 */
export function useArticleById(articleId: string | null) {
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['knowledge-article', articleId],
    queryFn: () => fetchArticleById(articleId!),
    enabled: !!articleId,
  });

  // Increment view count when article is loaded
  if (query.data && articleId) {
    incrementArticleView(articleId).catch((error) => {
      console.error('Failed to increment view count:', error);
    });
  }

  return query;
}

/**
 * Create new article
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useAppContext();

  return useMutation({
    mutationFn: (article: any) =>
      createKnowledgeArticle({
        ...article,
        tenant_id: tenantId!,
      }),
    onSuccess: () => {
      toast({
        title: 'تم الإنشاء بنجاح',
        description: 'تم إنشاء المقالة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update article
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateKnowledgeArticle(id, updates),
    onSuccess: (_, variables) => {
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث المقالة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحديث',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete article
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteKnowledgeArticle,
    onSuccess: () => {
      toast({
        title: 'تم الحذف بنجاح',
        description: 'تم حذف المقالة بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الحذف',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Publish article
 */
export function usePublishArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: publishArticle,
    onSuccess: (_, articleId) => {
      toast({
        title: 'تم النشر بنجاح',
        description: 'تم نشر المقالة وهي الآن متاحة للجميع',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', articleId] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في النشر',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Unpublish article
 */
export function useUnpublishArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: unpublishArticle,
    onSuccess: (_, articleId) => {
      toast({
        title: 'تم إلغاء النشر',
        description: 'المقالة لم تعد متاحة للعامة',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', articleId] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Verify article
 */
export function useVerifyArticle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ articleId, verifiedBy }: { articleId: string; verifiedBy: string }) =>
      verifyArticle(articleId, verifiedBy),
    onSuccess: (_, variables) => {
      toast({
        title: 'تم التحقق بنجاح',
        description: 'تم التحقق من صحة المقالة',
      });
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.articleId] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التحقق',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Record article feedback
 */
export function useArticleFeedback() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ articleId, helpful }: { articleId: string; helpful: boolean }) =>
      recordArticleFeedback(articleId, helpful),
    onSuccess: () => {
      toast({
        title: 'شكراً لك',
        description: 'تم تسجيل تقييمك بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Get article statistics
 */
export function useArticleStats() {
  const { tenantId } = useAppContext();

  return useQuery({
    queryKey: ['knowledge-article-stats', tenantId],
    queryFn: () => getArticleStats(tenantId!),
    enabled: !!tenantId,
  });
}

/**
 * Get trending articles
 */
export function useTrendingArticles(limit = 10) {
  return useQuery({
    queryKey: ['trending-articles', limit],
    queryFn: () => getTrendingArticles(limit),
  });
}

/**
 * Get related articles
 */
export function useRelatedArticles(articleId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['related-articles', articleId, limit],
    queryFn: () => getRelatedArticles(articleId!, limit),
    enabled: !!articleId,
  });
}
