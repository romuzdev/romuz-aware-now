/**
 * M16: AI Advisory Engine - Recommendation Card Component
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { AIRecommendation } from '../types/ai-advisory.types';
import { useState } from 'react';
import { FeedbackDialog } from './FeedbackDialog';

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onAccept?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
  onImplement?: (id: string, notes?: string) => void;
  onFeedback?: (id: string, rating: number, comment?: string) => void;
  isCompact?: boolean;
}

export function RecommendationCard({
  recommendation,
  onAccept,
  onReject,
  onImplement,
  onFeedback,
  isCompact = false,
}: RecommendationCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showImplementDialog, setShowImplementDialog] = useState(false);
  const [implementNotes, setImplementNotes] = useState('');

  const priorityConfig = {
    critical: { color: 'bg-destructive text-destructive-foreground', label: 'حرج', icon: AlertTriangle },
    high: { color: 'bg-orange-500 text-white', label: 'عالي', icon: AlertTriangle },
    medium: { color: 'bg-yellow-500 text-white', label: 'متوسط', icon: Clock },
    low: { color: 'bg-blue-500 text-white', label: 'منخفض', icon: Clock },
  };

  const statusConfig = {
    pending: { color: 'bg-muted text-muted-foreground', label: 'قيد المراجعة', icon: Clock },
    accepted: { color: 'bg-green-500 text-white', label: 'مقبولة', icon: CheckCircle },
    rejected: { color: 'bg-red-500 text-white', label: 'مرفوضة', icon: XCircle },
    implemented: { color: 'bg-primary text-primary-foreground', label: 'تم التنفيذ', icon: CheckCheck },
    expired: { color: 'bg-muted text-muted-foreground', label: 'منتهية', icon: XCircle },
  };

  const priority = priorityConfig[recommendation.priority];
  const status = statusConfig[recommendation.status];
  const PriorityIcon = priority.icon;
  const StatusIcon = status.icon;

  const confidencePercent = Math.round((recommendation.confidence_score || 0) * 100);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className={isCompact ? 'pb-3' : ''}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{recommendation.title_ar}</CardTitle>
                {recommendation.title_en && !isCompact && (
                  <CardDescription className="text-sm mt-1">{recommendation.title_en}</CardDescription>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge className={priority.color}>
                <PriorityIcon className="h-3 w-3 ml-1" />
                {priority.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={status.color} variant="outline">
              <StatusIcon className="h-3 w-3 ml-1" />
              {status.label}
            </Badge>
            
            {recommendation.confidence_score && (
              <Badge variant="secondary">
                ثقة {confidencePercent}%
              </Badge>
            )}
            
            {recommendation.category && (
              <Badge variant="outline">
                {recommendation.category}
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground mr-auto">
              {formatDistanceToNow(new Date(recommendation.created_at), {
                addSuffix: true,
                locale: ar,
              })}
            </span>
          </div>
        </CardHeader>

        {!isCompact && (
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {recommendation.description_ar}
            </p>

            {recommendation.rationale_ar && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-1">السبب:</p>
                <p className="text-sm text-muted-foreground">{recommendation.rationale_ar}</p>
              </div>
            )}

            {recommendation.tags && recommendation.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-3">
                {recommendation.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {recommendation.feedback_rating && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>التقييم: {recommendation.feedback_rating} / 5</span>
              </div>
            )}

            {recommendation.status === 'implemented' && recommendation.implementation_notes && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                <p className="text-xs font-medium text-primary mb-1">✅ ملاحظات التنفيذ:</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{recommendation.implementation_notes}</p>
              </div>
            )}
          </CardContent>
        )}

        {recommendation.status === 'pending' && (onAccept || onReject || onFeedback) && (
          <CardFooter className="flex gap-2 flex-wrap">
            {onAccept && (
              <Button
                size="sm"
                onClick={() => onAccept(recommendation.id)}
                className="gap-1"
              >
                <ThumbsUp className="h-3 w-3" />
                قبول
              </Button>
            )}
            
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                className="gap-1"
              >
                <ThumbsDown className="h-3 w-3" />
                رفض
              </Button>
            )}

            {onFeedback && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFeedback(true)}
                className="gap-1 mr-auto"
              >
                <MessageSquare className="h-3 w-3" />
                تقييم
              </Button>
            )}
          </CardFooter>
        )}

        {recommendation.status === 'accepted' && onImplement && (
          <CardFooter>
            <Button
              size="sm"
              onClick={() => setShowImplementDialog(true)}
              className="gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              تم التنفيذ
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Feedback Dialog */}
      {showFeedback && onFeedback && (
        <FeedbackDialog
          open={showFeedback}
          onOpenChange={setShowFeedback}
          onSubmit={(rating, comment) => {
            onFeedback(recommendation.id, rating, comment);
            setShowFeedback(false);
          }}
        />
      )}

      {/* Reject Dialog */}
      {showRejectDialog && onReject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>رفض التوصية</CardTitle>
              <CardDescription>
                يرجى توضيح سبب رفض هذه التوصية (اختياري)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-24 p-2 border rounded-md resize-none"
                placeholder="اكتب السبب هنا..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onReject(recommendation.id, rejectReason || undefined);
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
              >
                تأكيد الرفض
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Implement Dialog */}
      {showImplementDialog && onImplement && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>تأكيد التنفيذ</CardTitle>
              <CardDescription>
                يرجى توثيق ما تم تنفيذه بالضبط (اختياري)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-24 p-2 border rounded-md resize-none"
                placeholder="مثال: تم تحديث السياسة وزيادة الحد الأدنى للأحرف إلى 12، وإضافة متطلبات الأحرف الخاصة"
                value={implementNotes}
                onChange={(e) => setImplementNotes(e.target.value)}
              />
            </CardContent>
            <CardFooter className="gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowImplementDialog(false);
                  setImplementNotes('');
                }}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onImplement(recommendation.id, implementNotes || undefined);
                  setShowImplementDialog(false);
                  setImplementNotes('');
                }}
              >
                تأكيد التنفيذ
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
