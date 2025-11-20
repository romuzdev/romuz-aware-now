import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { toast } from 'sonner';
import ProgressSteps from '../../components/auth/ProgressSteps';
import { LanguageToggle } from '@/core/components/ui/language-toggle';
import '@/i18n/config';

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  status: string;
}

export default function SelectTenantPage() {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    checkExistingTenant();
  }, []);

  async function checkExistingTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        nav('/auth/login');
        return;
      }

      // Check if user already has a tenant
      const { data: existingTenant } = await supabase
        .from('user_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingTenant) {
        // User already has a tenant, redirect to complete profile
        nav('/auth/complete-profile');
        return;
      }

      // No tenant, load available tenants
      loadTenants();
    } catch (error) {
      console.error('Error checking tenant:', error);
      loadTenants();
    }
  }

  async function loadTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, domain, status')
      .eq('status', 'ACTIVE')
      .order('name');

    setLoading(false);
    
    if (error) {
      console.error('Error loading tenants:', error);
      toast.error(t('selectTenant.errors.loadFailed'));
      return;
    }

    setTenants(data || []);
  }

    async function handleJoinTenant() {
    if (!selectedTenant) return;

    setJoining(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error(t('selectTenant.errors.authRequired'));
      nav('/auth/login');
      return;
    }

    const { error } = await supabase
      .from('user_tenants')
      .insert({
        user_id: user.id,
        tenant_id: selectedTenant
      });

    setJoining(false);

    if (error) {
      console.error('Error joining tenant:', error);
      toast.error(t('selectTenant.errors.joinFailed'));
      return;
    }

    toast.success(t('selectTenant.success.joined'));
    // Redirect to complete-profile instead of campaigns
    nav('/auth/complete-profile');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">{t('selectTenant.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>
        <ProgressSteps currentStep={1} />
        <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('selectTenant.title')}</CardTitle>
          <CardDescription>
            {t('selectTenant.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('selectTenant.noTenants')}
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <Card
                  key={tenant.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTenant === tenant.id ? 'border-primary bg-muted' : ''
                  }`}
                  onClick={() => setSelectedTenant(tenant.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{tenant.name}</h3>
                        {tenant.domain && (
                          <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                        )}
                      </div>
                      {selectedTenant === tenant.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                onClick={handleJoinTenant}
                disabled={!selectedTenant || joining}
                className="w-full mt-6"
              >
                {joining ? t('selectTenant.joining') : t('selectTenant.joinTenant')}
              </Button>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
