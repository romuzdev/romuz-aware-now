/**
 * M13.1 Content Hub - Comments Integration
 */

import { supabase } from '../client';

export interface ContentComment {
  id: string;
  tenant_id: string;
  content_id: string;
  user_id: string;
  comment_text: string;
  parent_comment_id?: string;
  is_approved: boolean;
  is_flagged: boolean;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommentWithReplies extends ContentComment {
  replies?: CommentWithReplies[];
  user_name?: string;
}

/**
 * Get comments for content
 */
export async function getContentComments(contentId: string): Promise<CommentWithReplies[]> {
  const { data, error } = await supabase
    .from('content_comments')
    .select('*')
    .eq('content_id', contentId)
    .eq('is_approved', true)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    (data || []).map(async (comment) => {
      const { data: replies } = await supabase
        .from('content_comments')
        .select('*')
        .eq('parent_comment_id', comment.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: true });

      return {
        ...comment,
        replies: replies || [],
      };
    })
  );

  return commentsWithReplies;
}

/**
 * Add comment to content
 */
export async function addComment(
  contentId: string,
  commentText: string,
  parentCommentId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  const { data, error } = await supabase
    .from('content_comments')
    .insert({
      tenant_id: tenantData.tenant_id,
      content_id: contentId,
      user_id: user.id,
      comment_text: commentText,
      parent_comment_id: parentCommentId,
      is_approved: true, // Auto-approve for now
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update comment
 */
export async function updateComment(commentId: string, commentText: string) {
  const { data, error } = await supabase
    .from('content_comments')
    .update({ comment_text: commentText })
    .eq('id', commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('content_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

/**
 * Flag comment
 */
export async function flagComment(commentId: string) {
  const { error } = await supabase
    .from('content_comments')
    .update({ is_flagged: true })
    .eq('id', commentId);

  if (error) throw error;
}
