import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Skeleton } from '@/core/components/ui/skeleton';
import { BarChart3, Users, ClipboardCheck, Award } from 'lucide-react';
import { 
  useStudentProgressReports, 
  useCourseAnalytics, 
  useAssessmentReports,
  useOverallStats
} from '@/modules/training/hooks/useReports';
import { 
  StudentProgressReport, 
  CourseAnalytics, 
  AssessmentReport 
} from '@/modules/training/components/reports';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: studentReports, isLoading: loadingStudents } = useStudentProgressReports();
  const { data: courseAnalytics, isLoading: loadingCourses } = useCourseAnalytics();
  const { data: assessmentReports, isLoading: loadingAssessments } = useAssessmentReports();
  const { data: overallStats, isLoading: loadingStats } = useOverallStats();

  if (loadingStats) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التقارير والتحليلات</h1>
        <p className="text-muted-foreground mt-2">
          تحليلات شاملة لأداء نظام إدارة التدريب
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدورات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_courses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              دورات منشورة ونشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التسجيلات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_enrollments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              طالب مسجل في الدورات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاختبارات</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_assessments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              اختبارات تقييمية نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشهادات الصادرة</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.total_certificates || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              شهادات تم إصدارها للطلاب
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="students">الطلاب</TabsTrigger>
          <TabsTrigger value="courses">الدورات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {loadingAssessments ? (
            <Skeleton className="h-96" />
          ) : (
            <AssessmentReport reports={assessmentReports || []} />
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {loadingStudents ? (
            <Skeleton className="h-96" />
          ) : (
            <StudentProgressReport reports={studentReports || []} />
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          {loadingCourses ? (
            <Skeleton className="h-96" />
          ) : (
            <CourseAnalytics analytics={courseAnalytics || []} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
