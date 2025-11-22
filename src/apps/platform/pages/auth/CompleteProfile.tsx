import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Label } from '@/core/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar';
import { Progress } from '@/core/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Upload, User } from 'lucide-react';
import { fetchMyProfile, updateMyProfile, uploadAvatar } from '@/core/tenancy/integration';
import { supabase } from '@/integrations/supabase/client';
import ProgressSteps from '../../components/auth/ProgressSteps';
import { LanguageToggle } from '@/core/components/ui/language-toggle';
import '@/i18n/config';

export default function CompleteProfilePage() {
  const nav = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Get intended destination from navigation state (saved by ProtectedRoute)
  const intendedPath = (location.state as any)?.from || '/user/dashboard';

  const profileSchema = z.object({
    full_name: z.string().trim().min(2, t('completeProfile.errors.nameMin')).max(100, t('completeProfile.errors.nameMax')),
    phone: z.string().trim().optional(),
    bio: z.string().trim().max(500, t('completeProfile.errors.bioMax')).optional(),
  });


  type ProfileFormData = z.infer<typeof profileSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Watch form values for completion calculation
  const fullName = watch('full_name');
  const phone = watch('phone');
  const bio = watch('bio');

  // Calculate completion percentage
  useEffect(() => {
    let percentage = 0;
    
    // Full name (required) - 40%
    if (fullName && fullName.trim().length >= 2) {
      percentage += 40;
    }
    
    // Avatar - 30%
    if (avatarUrl) {
      percentage += 30;
    }
    
    // Phone - 15%
    if (phone && phone.trim().length > 0) {
      percentage += 15;
    }
    
    // Bio - 15%
    if (bio && bio.trim().length > 0) {
      percentage += 15;
    }
    
    setCompletionPercentage(percentage);
  }, [fullName, phone, bio, avatarUrl]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    console.log('📂 Loading user profile...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Redirect to login if not authenticated
      if (!user) {
        console.error('❌ User not authenticated');
        toast.error(t('completeProfile.errors.authRequired'));
        nav('/auth/login');
        return;
      }

      console.log('👤 Authenticated user:', user.id, user.email);
      setUserEmail(user.email || '');
      
      console.log('🔄 Fetching profile data...');
      const profile = await fetchMyProfile();
      console.log('📥 Profile data received:', profile);
      
      if (profile) {
        setValue('full_name', profile.full_name || '');
        setValue('phone', profile.phone || '');
        setValue('bio', profile.bio || '');
        setAvatarUrl(profile.avatar_url);
        console.log('✅ Profile loaded successfully');
      } else {
        console.warn('⚠️ No profile found for user');
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        full: error
      });
      toast.error(t('completeProfile.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('completeProfile.errors.uploadSizeLimit'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('completeProfile.errors.uploadTypeInvalid'));
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(file);
      setAvatarUrl(publicUrl);
      
      // Update profile with new avatar URL
      await updateMyProfile({ avatar_url: publicUrl });
      
      toast.success(t('completeProfile.success.upload'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('completeProfile.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    console.log('📝 Starting profile save...', data);
    setSaving(true);
    try {
      console.log('🔄 Calling updateMyProfile...');
      const result = await updateMyProfile({
        full_name: data.full_name,
        phone: data.phone || null,
        bio: data.bio || null,
      });
      console.log('✅ Profile updated successfully:', result);

      toast.success(t('completeProfile.success.save'));
      
      // Redirect to intended destination (saved from ProtectedRoute)
      nav(intendedPath, { replace: true });
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        full: error
      });
      toast.error(t('completeProfile.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>
        <ProgressSteps currentStep={2} />
        <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('completeProfile.title')}</CardTitle>
          <CardDescription>
            {t('completeProfile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Welcome Message */}
          <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h3 className="font-semibold text-foreground mb-1">
                  {t('completeProfile.welcomeTitle')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('completeProfile.welcomeMessage')}
                </p>
              </div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{t('completeProfile.completion')}</span>
              <span className="font-semibold text-primary">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {completionPercentage === 100 ? (
              <p className={`text-xs text-green-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('completeProfile.completionSuccess')}
              </p>
            ) : (
              <p className={`text-xs text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('completeProfile.completionHint')}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-16 h-16 text-primary" />
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center space-y-2">
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('completeProfile.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t('completeProfile.changeAvatar')}
                    </>
                  )}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  {t('completeProfile.avatarLimit')}
                </p>
              </div>

              {userEmail && (
                <p className="text-sm text-muted-foreground">
                  📧 {userEmail}
                </p>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('completeProfile.fullName')} <span className="text-destructive">{t('completeProfile.required')}</span>
                </Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder={t('completeProfile.fullNamePlaceholder')}
                  className={isRTL ? 'text-right' : 'text-left'}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {errors.full_name && (
                  <p className={`text-sm text-destructive mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('completeProfile.phone')}
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder={t('completeProfile.phonePlaceholder')}
                  className={isRTL ? 'text-right' : 'text-left'}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {errors.phone && (
                  <p className={`text-sm text-destructive mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bio" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('completeProfile.bio')}
                </Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder={t('completeProfile.bioPlaceholder')}
                  rows={4}
                  className={`resize-none ${isRTL ? 'text-right' : 'text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {errors.bio && (
                  <p className={`text-sm text-destructive mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  // Save email as temporary full_name to mark profile as "complete"
                  setSaving(true);
                  try {
                    await updateMyProfile({
                      full_name: userEmail || 'User',
                    });
                    toast.success(t('completeProfile.success.skip'));
                    nav(intendedPath, { replace: true });
                  } catch (error) {
                    console.error('Error skipping profile:', error);
                    toast.error(t('completeProfile.errors.skipFailed'));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex-1"
                disabled={saving}
              >
                {t('completeProfile.skipNow')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    {t('completeProfile.saving')}
                  </>
                ) : (
                  t('completeProfile.saveAndContinue')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
