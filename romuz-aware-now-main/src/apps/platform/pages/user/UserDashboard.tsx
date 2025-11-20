import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, Target, TrendingUp, LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/core/components/ui/theme-toggle';
import { LanguageToggle } from '@/core/components/ui/language-toggle';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile } from '@/core/tenancy/integration';

export default function UserDashboard() {
  const { user } = useAppContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: fetchMyProfile,
    enabled: !!user,
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/auth/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {t('app.name', 'رموز - منصة التوعية')}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t('pages.userDashboard.subtitle', 'لوحة المستخدم')}
                </p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || t('common.user', 'المستخدم')}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate('/auth/complete-profile')}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t('common.settings', 'الإعدادات')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('auth.logout', 'تسجيل الخروج')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            {t('pages.userDashboard.welcome', 'مرحباً')}, {profile?.full_name || t('common.user', 'المستخدم')}!
          </h2>
          <p className="text-muted-foreground">
            {t('pages.userDashboard.description', 'تابع تقدمك في حملات التوعية الأمنية')}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('pages.userDashboard.stats.activeCampaigns', 'الحملات النشطة')}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                {t('pages.userDashboard.stats.campaignsDescription', 'حملات متاحة للمشاركة')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('pages.userDashboard.stats.completionRate', 'نسبة الإنجاز')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <p className="text-xs text-muted-foreground">
                {t('pages.userDashboard.stats.completionDescription', 'من المهام المطلوبة')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('pages.userDashboard.stats.achievements', 'الإنجازات')}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                {t('pages.userDashboard.stats.achievementsDescription', 'شارة تم الحصول عليها')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.userDashboard.quickActions', 'إجراءات سريعة')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/campaigns')}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('pages.userDashboard.exploreCampaigns', 'استكشف الحملات')}
            </Button>
            <Button 
              onClick={() => navigate('/progress')}
              variant="outline"
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t('pages.userDashboard.trackProgress', 'تتبع تقدمك')}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
