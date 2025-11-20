import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t('unauthorized.title')}</CardTitle>
          <CardDescription>{t('unauthorized.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('unauthorized.message')}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('unauthorized.goBack')}
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('unauthorized.goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
