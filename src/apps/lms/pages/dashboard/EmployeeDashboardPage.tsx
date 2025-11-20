import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { Skeleton } from '@/core/components/ui/skeleton';
import { 
  BookOpen, 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle,
  Play,
  Search
} from 'lucide-react';
import { useMyEnrollments } from '@/modules/training/hooks/useEnrollments';
import { useMyCertificates } from '@/modules/training/hooks/useCertificates';

export default function EmployeeDashboardPage() {
  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments();
  const { data: certificates, isLoading: loadingCertificates } = useMyCertificates();

  if (loadingEnrollments) {
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

  const activeEnrollments = enrollments?.filter(e => e.status === 'in_progress') || [];
  const completedEnrollments = enrollments?.filter(e => e.status === 'completed') || [];
  const averageProgress = enrollments && enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة تحكم الموظف</h1>
        <p className="text-muted-foreground mt-2">
          مرحباً بك في رحلتك التعليمية
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات النشطة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              دورات قيد التقدم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الدورات المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEnrollments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              دورات منتهية بنجاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشهادات</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingCertificates ? '...' : certificates?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              شهادات حاصل عليها
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>دوراتي النشطة</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/employee/courses">
                  <Search className="ml-2 h-4 w-4" />
                  تصفح المزيد
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeEnrollments.length > 0 ? (
              <div className="space-y-4">
                {activeEnrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-4 border rounded-lg space-y-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {enrollment.course?.name || 'دورة تدريبية'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.course?.code}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        قيد التقدم
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

                    <Button asChild className="w-full" size="sm">
                      <Link to={`/employee/courses/${enrollment.course_id}/play`}>
                        <Play className="ml-2 h-4 w-4" />
                        متابعة التعلم
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  لم تسجل في أي دورة بعد
                </p>
                <Button asChild>
                  <Link to="/employee/courses">
                    <Search className="ml-2 h-4 w-4" />
                    تصفح الدورات
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="ml-2 h-5 w-5" />
              إحصائيات التقدم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">معدل الإنجاز الإجمالي</span>
                <span className="font-medium">{Math.round(averageProgress)}%</span>
              </div>
              <Progress value={averageProgress} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {enrollments?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">إجمالي التسجيلات</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {completedEnrollments.length}
                </p>
                <p className="text-xs text-muted-foreground">دورات مكتملة</p>
              </div>
            </div>

            {certificates && certificates.length > 0 && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/employee/certificates">
                  <Award className="ml-2 h-4 w-4" />
                  عرض شهاداتي ({certificates.length})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
