import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { LanguageToggle } from '@/core/components/ui/language-toggle';
import '@/i18n/config';

export default function LoginPage() {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      setErr(error.message);
      return;
    }
    
    nav('/admin/campaigns');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>
        <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {err && (
            <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
              {err}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={isRTL ? 'text-right' : 'text-left'}>{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                className={isRTL ? 'text-right' : 'text-left'}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={isRTL ? 'text-right' : 'text-left'}>{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('login.signingIn') : t('login.signIn')}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {t('login.noAccount')}{' '}
            <Link className="underline text-foreground hover:text-primary" to="/auth/signup">
              {t('login.createOne')}
            </Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
