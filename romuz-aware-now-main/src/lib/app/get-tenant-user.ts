import { useAppContext } from '@/lib/app-context/AppContextProvider';

export function useTenantUser() {
  try {
    const ctx = useAppContext();
    return {
      tenantId: ctx?.tenantId ?? null,
      userId: ctx?.user?.id ?? null,
    };
  } catch {
    return { tenantId: null, userId: null };
  }
}
