/**
 * M13.1 - Content Hub: Content Interaction Bar
 * شريط التفاعل مع المحتوى (إعجاب، مشاركة، علامة مرجعية)
 */

import { useState } from 'react';
import { Heart, Share2, Bookmark, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { useToast } from '@/core/components/ui/use-toast';
import { useContentInteractions } from '../hooks/useContentInteractions';
import { ContentShareDialog } from './ContentShareDialog';
import { ContentBookmarkDialog } from './ContentBookmarkDialog';
import type { ContentStats } from '../types';

interface ContentInteractionBarProps {
  contentId: string;
  contentTitle: string;
  contentUrl?: string;
  stats?: ContentStats;
  onCommentClick?: () => void;
}

export function ContentInteractionBar({
  contentId,
  contentTitle,
  contentUrl,
  stats,
  onCommentClick,
}: ContentInteractionBarProps) {
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);

  const {
    hasLiked,
    hasBookmarked,
    stats: interactionStats,
    handleLike,
    handleShare,
    isLoading,
  } = useContentInteractions(contentId);

  const toggleLike = async () => {
    await handleLike();
  };

  const openShareDialog = () => {
    setShareDialogOpen(true);
  };

  const handleShareComplete = async (channel: string) => {
    await handleShare(channel as any);
    setShareDialogOpen(false);
    toast({
      title: 'تمت المشاركة',
      description: `تم مشاركة المحتوى عبر ${channel}`,
    });
  };

  const openBookmarkDialog = () => {
    setBookmarkDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-4 border-t border-b bg-muted/30">
        {/* View Count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Eye className="h-5 w-5" />
          <span className="text-sm font-medium">
            {stats?.views.toLocaleString() || 0}
          </span>
        </div>

        <div className="flex-1" />

        {/* Like Button */}
        <Button
          variant={hasLiked ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleLike}
          disabled={isLoading}
          className={hasLiked ? 'text-primary' : ''}
        >
          <Heart
            className={`h-5 w-5 ml-2 ${
              hasLiked ? 'fill-current' : ''
            }`}
          />
          <span>{(stats?.likes || interactionStats?.likes || 0).toLocaleString()}</span>
        </Button>

        {/* Comment Button */}
        {onCommentClick && (
          <Button variant="ghost" size="sm" onClick={onCommentClick}>
            <MessageCircle className="h-5 w-5 ml-2" />
            <span>{stats?.comments.toLocaleString() || 0}</span>
          </Button>
        )}

        {/* Share Button */}
        <Button variant="ghost" size="sm" onClick={openShareDialog}>
          <Share2 className="h-5 w-5 ml-2" />
          <span>{stats?.shares.toLocaleString() || 0}</span>
        </Button>

        {/* Bookmark Button */}
        <Button
          variant={hasBookmarked ? 'default' : 'ghost'}
          size="sm"
          onClick={openBookmarkDialog}
          disabled={isLoading}
        >
          <Bookmark
            className={`h-5 w-5 ${
              hasBookmarked ? 'fill-current' : ''
            }`}
          />
        </Button>
      </div>

      {/* Share Dialog */}
      <ContentShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        contentTitle={contentTitle}
        contentUrl={contentUrl || window.location.href}
        onShare={handleShareComplete}
      />

      {/* Bookmark Dialog */}
      <ContentBookmarkDialog
        open={bookmarkDialogOpen}
        onOpenChange={setBookmarkDialogOpen}
        contentId={contentId}
        contentTitle={contentTitle}
      />
    </>
  );
}
