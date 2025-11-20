/**
 * Hook to fetch counts for navigation menu badges
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NavCounts {
  policies: number;
  committees: number;
  objectives: number;
  kpis: number;
}

async function fetchNavCounts(): Promise<NavCounts> {
  try {
    // Fetch policies count (active only)
    const { count: policiesCount } = await supabase
      .from('policies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Fetch committees count (active only)
    const { count: committeesCount } = await supabase
      .from('committees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Fetch objectives count (active only)
    const { count: objectivesCount } = await supabase
      .from('objectives')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Fetch KPIs count (all)
    const { count: kpisCount } = await supabase
      .from('kpis')
      .select('*', { count: 'exact', head: true });

    return {
      policies: policiesCount || 0,
      committees: committeesCount || 0,
      objectives: objectivesCount || 0,
      kpis: kpisCount || 0,
    };
  } catch (error) {
    console.error('Error fetching nav counts:', error);
    return {
      policies: 0,
      committees: 0,
      objectives: 0,
      kpis: 0,
    };
  }
}

export function useNavCounts() {
  return useQuery({
    queryKey: ['nav-counts'],
    queryFn: fetchNavCounts,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
}
