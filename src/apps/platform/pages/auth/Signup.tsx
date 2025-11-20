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

export default function SignupPage() {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/select-tenant`,
      },
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => nav('/auth/select-tenant'), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>
        <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('signup.title')}</CardTitle>
          <CardDescription>{t('signup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {err && (
            <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm">
              {err}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded bg-green-500/10 text-green-600 text-sm">
              {t('signup.successMessage')}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={isRTL ? 'text-right' : 'text-left'}>{t('signup.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('signup.emailPlaceholder')}
                required
                className={isRTL ? 'text-right' : 'text-left'}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={isRTL ? 'text-right' : 'text-left'}>{t('signup.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('signup.passwordPlaceholder')}
                minLength={6}
                required
              />
              <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('signup.passwordHint')}
              </p>
            </div>
            <Button type="submit" disabled={loading || success} className="w-full">
              {loading ? t('signup.creatingAccount') : t('signup.signUp')}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {t('signup.haveAccount')}{' '}
            <Link className="underline text-foreground hover:text-primary" to="/auth/login">
              {t('signup.signIn')}
            </Link>
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
