/**
 * M17: Knowledge Hub - QAInterface Component
 * RAG-powered Q&A interface
 */

import { useState } from 'react';
import { MessageCircle, Send, Sparkles, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { Card } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Skeleton } from '@/core/components/ui/skeleton';
import { useKnowledgeQA } from '../hooks/useKnowledgeQA';

export function QAInterface() {
  const {
    currentQA,
    history,
    isAsking,
    handleAskQuestion,
    handleFeedback,
    clearCurrent,
  } = useKnowledgeQA();

  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;
    
    handleAskQuestion(question);
    setQuestion('');
  };

  return (
    <div className="space-y-6">
      {/* Question Input */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-5 w-5 text-primary mt-3" />
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اطرح سؤالك هنا... سيقوم الذكاء الاصطناعي بالبحث في قاعدة المعرفة والإجابة عليك"
              className="flex-1 min-h-[100px]"
              disabled={isAsking}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 inline ml-1" />
              البحث الذكي في قاعدة المعرفة (RAG)
            </p>
            <Button type="submit" disabled={!question.trim() || isAsking}>
              {isAsking ? (
                'جاري التفكير...'
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  اسأل
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Current Answer */}
      {isAsking && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="font-medium">جاري البحث والتحليل...</span>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </Card>
      )}

      {currentQA && !isAsking && (
        <Card className="p-6 space-y-4 border-primary">
          {/* Confidence Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-sm">
              <CheckCircle className="h-4 w-4 ml-1" />
              إجابة ذكية
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">مستوى الثقة:</span>
              <Progress value={currentQA.confidence * 100} className="w-24 h-2" />
              <span className="font-medium">{Math.round(currentQA.confidence * 100)}%</span>
            </div>
          </div>

          {/* Answer */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed">{currentQA.answer}</p>
          </div>

          {/* Sources */}
          {currentQA.sources && currentQA.sources.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-medium text-muted-foreground">المصادر:</p>
              <div className="flex flex-wrap gap-2">
                {currentQA.sources.map((source: any) => (
                  <Badge key={source.id} variant="outline" className="text-xs">
                    {source.title}
                    <span className="mr-1 text-muted-foreground">
                      ({Math.round(source.similarity * 100)}%)
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {currentQA.qa_id && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <span className="text-sm text-muted-foreground">هل كانت الإجابة مفيدة؟</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(currentQA.qa_id, true)}
              >
                <ThumbsUp className="h-4 w-4 ml-1" />
                نعم
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(currentQA.qa_id, false)}
              >
                <ThumbsDown className="h-4 w-4 ml-1" />
                لا
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">الأسئلة السابقة</h3>
          <div className="space-y-3">
            {history.slice(0, 5).map((qa: any) => (
              <Card key={qa.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <p className="font-medium mb-2">{qa.question_ar}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {qa.answer_ar}
                </p>
                {qa.was_helpful !== null && (
                  <div className="mt-2">
                    <Badge variant={qa.was_helpful ? 'default' : 'secondary'} className="text-xs">
                      {qa.was_helpful ? (
                        <>
                          <ThumbsUp className="h-3 w-3 ml-1" />
                          مفيدة
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3 w-3 ml-1" />
                          غير مفيدة
                        </>
                      )}
                    </Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentQA && !isAsking && history.length === 0 && (
        <Card className="p-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">اسأل أي سؤال</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            سيقوم الذكاء الاصطناعي بالبحث في قاعدة المعرفة الكاملة والإجابة على سؤالك
            بناءً على المستندات الأكثر صلة.
          </p>
        </Card>
      )}
    </div>
  );
}
