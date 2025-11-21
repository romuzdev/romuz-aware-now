/**
 * M17: Knowledge Hub - RAG Query Interface Component
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import { useAskQuestion, useQueryFeedback } from '@/modules/knowledge/hooks/useKnowledgeRAG';
import { Brain, Send, ThumbsUp, ThumbsDown, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { ScrollArea } from '@/core/components/ui/scroll-area';

export function RAGQueryInterface() {
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  
  const askMutation = useAskQuestion();
  const feedbackMutation = useQueryFeedback();

  const handleAsk = async () => {
    if (!question.trim()) return;

    const result = await askMutation.mutateAsync({
      question: question.trim(),
      language: 'ar',
    });

    setCurrentAnswer(result);
    setQuestion('');
  };

  const handleFeedback = (helpful: boolean, comment?: string) => {
    if (!currentAnswer?.queryId) return;

    feedbackMutation.mutate({
      queryId: currentAnswer.queryId,
      helpful,
      comment,
    });
  };

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            اسأل أي سؤال
          </CardTitle>
          <CardDescription>
            سيجيب الذكاء الاصطناعي بناءً على قاعدة المعرفة المتاحة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب سؤالك هنا... مثال: ما هي أفضل الممارسات لحماية كلمات المرور؟"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={handleAsk}
            disabled={!question.trim() || askMutation.isPending}
            className="w-full"
          >
            {askMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري البحث...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                إرسال السؤال
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Answer Display */}
      {currentAnswer && (
        <Card>
          <CardHeader>
            <CardTitle>الإجابة</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                الثقة: {(currentAnswer.confidence * 100).toFixed(0)}%
              </Badge>
              <Badge variant="outline">
                {currentAnswer.sources.length} مصدر
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer Text */}
            <Alert>
              <AlertDescription className="text-base leading-relaxed whitespace-pre-wrap">
                {currentAnswer.answer}
              </AlertDescription>
            </Alert>

            {/* Sources */}
            {currentAnswer.sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">المصادر:</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-4">
                    {currentAnswer.sources.map((source: any, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-sm">{source.article_title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {source.chunk_text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {source.article_category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                تطابق: {(source.similarity * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Feedback Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <p className="text-sm text-muted-foreground">هل كانت هذه الإجابة مفيدة؟</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(true)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                نعم
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(false)}
                disabled={feedbackMutation.isPending}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                لا
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Answer State */}
      {currentAnswer && currentAnswer.sources.length === 0 && (
        <Alert>
          <AlertDescription>
            لم نتمكن من العثور على معلومات ذات صلة في قاعدة المعرفة. جرب إعادة صياغة سؤالك أو استخدام كلمات مختلفة.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
