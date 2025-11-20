import { supabase } from '@/integrations/supabase/client';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's profile including theme preference
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user's theme preference
 */
export async function updateThemePreference(
  userId: string,
  theme: ThemePreference
): Promise<boolean> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      theme_preference: theme,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });

  if (error) {
    console.error('Error updating theme preference:', error);
    return false;
  }

  return true;
}

/**
 * Subscribe to theme preference changes (realtime)
 */
export function subscribeToThemeChanges(
  userId: string,
  callback: (theme: ThemePreference) => void
) {
  const channel = supabase
    .channel(`user_profile:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const newTheme = (payload.new as UserProfile).theme_preference;
        callback(newTheme);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
