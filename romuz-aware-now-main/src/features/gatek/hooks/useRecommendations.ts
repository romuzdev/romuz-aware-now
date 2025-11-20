import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecommendations,
  generateRecommendations,
} from "@/modules/analytics/integration";
import { toast } from "sonner";

export function useRecommendations(params: {
  month?: string;
  kpi_key?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["gatek", "recommendations", params],
    queryFn: () => getRecommendations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { month?: string; limit?: number }) =>
      generateRecommendations(params),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["gatek", "recommendations"] });
      toast.success(`تم توليد ${count} توصية بنجاح`);
    },
    onError: (error) => {
      toast.error(`فشل توليد التوصيات: ${error.message}`);
    },
  });
}
