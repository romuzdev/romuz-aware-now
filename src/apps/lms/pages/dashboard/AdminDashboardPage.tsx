import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Award, 
  TrendingUp,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { useOverallStats, useCourseAnalytics } from '@/modules/training/hooks/useReports';
import { useTranslation } from 'react-i18next';

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading: loadingStats } = useOverallStats();
  const { data: courseAnalytics, isLoading: loadingCourses } = useCourseAnalytics();

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

  const topCourses = courseAnalytics
    ?.sort((a, b) => b.total_enrollments - a.total_enrollments)
    .slice(0, 5) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('lms.dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('lms.dashboard.subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link to="/lms/courses/new">
            <Plus className={i18n.language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
            {t('lms.dashboard.newCourse')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lms.dashboard.totalCourses')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_courses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lms.dashboard.coursesDesc')}
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
              <Link to="/lms/courses">
                {t('lms.dashboard.viewAll')}
                <ArrowLeft className={i18n.language === 'ar' ? "mr-2 h-3 w-3" : "ml-2 h-3 w-3"} />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lms.dashboard.totalEnrollments')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_enrollments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lms.dashboard.enrollmentsDesc')}
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
              <Link to="/lms/enrollments">
                {t('lms.dashboard.viewDetails')}
                <ArrowLeft className={i18n.language === 'ar' ? "mr-2 h-3 w-3" : "ml-2 h-3 w-3"} />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lms.dashboard.totalAssessments')}</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_assessments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lms.dashboard.assessmentsDesc')}
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
              <Link to="/admin/lms/assessments">
                {t('lms.dashboard.viewDetails')}
                <ArrowLeft className={i18n.language === 'ar' ? "mr-2 h-3 w-3" : "ml-2 h-3 w-3"} />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('lms.dashboard.totalCertificates')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_certificates || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('lms.dashboard.certificatesDesc')}
            </p>
            <Button asChild variant="link" size="sm" className="mt-2 p-0 h-auto">
              <Link to="/admin/lms/reports">
                {t('lms.dashboard.viewDetails')}
                <ArrowLeft className={i18n.language === 'ar' ? "mr-2 h-3 w-3" : "ml-2 h-3 w-3"} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className={i18n.language === 'ar' ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />
              {t('lms.dashboard.topCourses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : topCourses.length > 0 ? (
              <div className="space-y-3">
                {topCourses.map((course) => (
                  <div
                    key={course.course_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{course.course_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('lms.dashboard.enrollmentsCount', { count: course.total_enrollments })} • {course.completion_rate.toFixed(0)}% {t('lms.dashboard.completionRate')}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/admin/lms/courses/${course.course_id}`}>
                        {t('lms.dashboard.view')}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t('lms.dashboard.noCourses')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('lms.dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/lms/courses/new">
                <Plus className={i18n.language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t('lms.dashboard.createNewCourse')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/lms/certificates/templates">
                <Award className={i18n.language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t('lms.dashboard.manageCertificates')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/lms/reports">
                <TrendingUp className={i18n.language === 'ar' ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"} />
                {t('lms.dashboard.viewReports')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
