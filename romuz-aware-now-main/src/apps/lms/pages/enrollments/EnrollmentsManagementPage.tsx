import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { Progress } from '@/core/components/ui/progress';
import { Search, Users, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function EnrollmentsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lms_enrollments')
        .select(`
          *,
          lms_courses!inner(id, name, code)
        `)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEnrollments = enrollments?.filter(enrollment =>
    enrollment.lms_courses?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.lms_courses?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: enrollments?.length || 0,
    active: enrollments?.filter(e => e.status === 'in_progress').length || 0,
    completed: enrollments?.filter(e => e.status === 'completed').length || 0,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة التسجيلات</h1>
        <p className="text-muted-foreground mt-2">
          متابعة جميع تسجيلات الطلاب في الدورات التدريبية
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسجيلات النشطة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسجيلات المكتملة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في التسجيلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEnrollments && filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {enrollment.lms_courses?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.lms_courses?.code}
                      </p>
                    </div>
                    <Badge
                      variant={
                        enrollment.status === 'completed'
                          ? 'default'
                          : enrollment.status === 'in_progress'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {enrollment.status === 'completed'
                        ? 'مكتمل'
                        : enrollment.status === 'in_progress'
                        ? 'قيد التقدم'
                        : 'لم يبدأ'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>التقدم</span>
                      <span className="font-medium">
                        {Math.round(enrollment.progress_percentage || 0)}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress_percentage || 0} />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      تاريخ التسجيل: {new Date(enrollment.enrolled_at).toLocaleDateString('ar')}
                    </span>
                    {enrollment.completed_at && (
                      <span>
                        تاريخ الإكمال: {new Date(enrollment.completed_at).toLocaleDateString('ar')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد تسجيلات
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
