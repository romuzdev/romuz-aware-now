import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Search, ClipboardCheck, Plus, Edit } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AssessmentsListPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['all-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_assessments')
        .select(`
          *,
          lms_courses!inner(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredAssessments = assessments?.filter(assessment =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.lms_courses?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الاختبارات</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة جميع الاختبارات التقييمية
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الاختبارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssessments && filteredAssessments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{assessment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assessment.lms_courses?.name}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {assessment.passing_score}% للنجاح
                    </Badge>
                  </div>

                  {assessment.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assessment.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>
                      المدة: {assessment.duration_minutes} دقيقة
                    </span>
                    {assessment.max_attempts && (
                      <>
                        <span>•</span>
                        <span>المحاولات: {assessment.max_attempts}</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/lms/assessments/${assessment.id}/builder`}>
                        <Edit className="ml-2 h-4 w-4" />
                        إدارة الأسئلة
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4" />
              <p>لا توجد اختبارات بعد</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
