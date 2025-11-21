/**
 * M13.1 Content Hub - Bookmarks Integration
 */

import { supabase } from '../client';

export interface ContentBookmark {
  id: string;
  tenant_id: string;
  user_id: string;
  content_id: string;
  folder_name?: string;
  notes?: string;
  created_at: string;
}

export interface BookmarkWithContent extends ContentBookmark {
  content: any;
}

/**
 * Get user's bookmarks
 */
export async function getUserBookmarks(folderId?: string): Promise<BookmarkWithContent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('content_bookmarks')
    .select(`
      *,
      content:content_items(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (folderId) {
    query = query.eq('folder_name', folderId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Toggle bookmark
 */
export async function toggleBookmark(contentId: string, folderName?: string, notes?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: tenantData } = await supabase
    .from('user_tenants')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single();

  if (!tenantData) throw new Error('Tenant not found');

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from('content_bookmarks')
    .select('id')
    .eq('tenant_id', tenantData.tenant_id)
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .maybeSingle();

  if (existing) {
    // Remove bookmark
    const { error } = await supabase
      .from('content_bookmarks')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return { bookmarked: false };
  } else {
    // Add bookmark
    const { error } = await supabase
      .from('content_bookmarks')
      .insert({
        tenant_id: tenantData.tenant_id,
        user_id: user.id,
        content_id: contentId,
        folder_name: folderName,
        notes: notes,
      });

    if (error) throw error;
    return { bookmarked: true };
  }
}

/**
 * Update bookmark
 */
export async function updateBookmark(
  bookmarkId: string,
  updates: { folder_name?: string; notes?: string }
) {
  const { data, error } = await supabase
    .from('content_bookmarks')
    .update(updates)
    .eq('id', bookmarkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get bookmark folders
 */
export async function getBookmarkFolders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('content_bookmarks')
    .select('folder_name')
    .eq('user_id', user.id)
    .not('folder_name', 'is', null);

  if (error) throw error;

  // Get unique folder names with counts
  const folders = (data || []).reduce((acc: any[], bookmark) => {
    const existing = acc.find(f => f.name === bookmark.folder_name);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: bookmark.folder_name, count: 1 });
    }
    return acc;
  }, []);

  return folders;
}
