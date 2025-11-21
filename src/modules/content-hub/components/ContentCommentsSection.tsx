/**
 * M13.1 - Content Hub: Comments Section
 * قسم التعليقات مع الردود
 */

import { useState } from 'react';
import { MessageCircle, Reply, Flag, Trash2, Edit, Send } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/core/components/ui/avatar';
import { useContentComments } from '../hooks/useContentComments';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ContentCommentsSectionProps {
  contentId: string;
}

interface Comment {
  id: string;
  user_id: string;
  content_id: string;
  parent_id: string | null;
  comment_text: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  replies?: Comment[];
}

export function ContentCommentsSection({ contentId }: ContentCommentsSectionProps) {
  const {
    comments,
    isLoading,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleFlagComment,
    isAdding,
    isUpdating,
    isDeleting,
  } = useContentComments(contentId);

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Organize comments into tree structure
  const organizeComments = (comments: any[]): Comment[] => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    // First pass: create map
    comments.forEach((comment) => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach((comment) => {
      const node = map.get(comment.id)!;
      if (comment.parent_id) {
        const parent = map.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const organizedComments = organizeComments(comments);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    await handleAddComment(newComment, replyTo || undefined);
    setNewComment('');
    setReplyTo(null);
  };

  const handleSubmitEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    await handleUpdateComment(commentId, editText);
    setEditingComment(null);
    setEditText('');
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment_text);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyTo === comment.id;

    return (
      <div
        key={comment.id}
        className={`space-y-3 ${level > 0 ? 'mr-8 border-r-2 border-muted pr-4' : ''}`}
      >
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback>
              {comment.user_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {comment.user_name || 'مستخدم'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-muted-foreground">(معدّل)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  dir="rtl"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitEdit(comment.id)}
                    disabled={isUpdating}
                  >
                    حفظ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap" dir="rtl">
                  {comment.comment_text}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    <Reply className="h-3 w-3 ml-1" />
                    رد
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(comment)}
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFlagComment(comment.id)}
                  >
                    <Flag className="h-3 w-3 ml-1" />
                    إبلاغ
                  </Button>
                </div>
              </>
            )}

            {/* Reply Form */}
            {isReplying && (
              <div className="space-y-2 pt-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`رد على ${comment.user_name || 'المستخدم'}...`}
                  rows={2}
                  dir="rtl"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={isAdding || !newComment.trim()}
                  >
                    <Send className="h-3 w-3 ml-1" />
                    إرسال
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyTo(null);
                      setNewComment('');
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            التعليقات ({comments.length})
          </h3>
        </div>

        {/* New Comment Form */}
        {!replyTo && (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="أضف تعليق..."
              rows={3}
              dir="rtl"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={isAdding || !newComment.trim()}
            >
              <Send className="h-4 w-4 ml-2" />
              نشر التعليق
            </Button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              جاري تحميل التعليقات...
            </p>
          ) : organizedComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          ) : (
            organizedComments.map((comment) => renderComment(comment))
          )}
        </div>
      </div>
    </Card>
  );
}
