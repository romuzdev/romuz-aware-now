import { useEffect, useState } from "react";
import type { Policy } from "../types";
import { fetchPolicyById, logPolicyReadAction } from "../integration";
import { useAppContext } from "@/lib/app-context/AppContextProvider";

const policyCache = new Map<string, Policy>();

export function usePolicyById(policyId?: string) {
  const [data, setData] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useAppContext();

  useEffect(() => {
    if (!tenantId || !policyId) {
      setError("Missing tenant or policy ID.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // ✅ Cache check
        const cacheKey = `${tenantId}:${policyId}`;
        if (policyCache.has(cacheKey)) {
          setData(policyCache.get(cacheKey)!);
          setLoading(false);
          return;
        }

        // ✅ Fetch from Supabase
        const policy = await fetchPolicyById(tenantId, policyId);
        if (policy) {
          setData(policy);
          policyCache.set(cacheKey, policy);
          await logPolicyReadAction(policyId, tenantId); // audit
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenantId, policyId]);

  return { data, loading, error };
}

/**
 * TODO D2-Part7:
 * - Replace manual cache with React Query for persistence.
 * - Add real-time subscription for policy updates via Supabase Realtime.
 * - Extend Audit Log to record user_id and session info.
 */
