import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAppContext } from '@/lib/app-context/AppContextProvider';
import { getUserProfile } from '@/core/tenancy/integration';

/**
 * Hook to sync theme preference from database when user logs in
 */
export function useThemeSync() {
  const { user } = useAppContext();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!user?.id) return;

    // Load theme preference from database
    getUserProfile(user.id).then((profile) => {
      if (profile?.theme_preference) {
        setTheme(profile.theme_preference);
      }
    });
  }, [user?.id, setTheme]);
}
