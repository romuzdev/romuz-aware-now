import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMyCertificates,
  fetchCertificateById,
  fetchCertificateTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  issueCertificate,
  revokeCertificate,
  downloadCertificate
} from '../integration';
import { toast } from '@/hooks/use-toast';

export const certificateKeys = {
  all: ['certificates'] as const,
  my: () => [...certificateKeys.all, 'my'] as const,
  detail: (id: string) => [...certificateKeys.all, 'detail', id] as const,
  templates: () => [...certificateKeys.all, 'templates'] as const,
  templateDetail: (id: string) => [...certificateKeys.all, 'template', id] as const,
};

export function useMyCertificates() {
  return useQuery({
    queryKey: certificateKeys.my(),
    queryFn: fetchMyCertificates,
  });
}

export function useCertificateById(id?: string) {
  return useQuery({
    queryKey: certificateKeys.detail(id || ''),
    queryFn: () => fetchCertificateById(id!),
    enabled: !!id,
  });
}

export function useCertificateTemplates() {
  return useQuery({
    queryKey: certificateKeys.templates(),
    queryFn: fetchCertificateTemplates,
  });
}

export function useTemplateById(id?: string) {
  return useQuery({
    queryKey: certificateKeys.templateDetail(id || ''),
    queryFn: () => fetchTemplateById(id!),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.templates() });
      toast({ title: 'تم الإنشاء', description: 'تم إنشاء قالب الشهادة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateTemplate(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.templates() });
      queryClient.invalidateQueries({ queryKey: certificateKeys.templateDetail(data.id) });
      toast({ title: 'تم التحديث', description: 'تم تحديث قالب الشهادة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.templates() });
      toast({ title: 'تم الحذف', description: 'تم حذف القالب بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.my() });
      toast({ 
        title: 'تهانينا!', 
        description: 'تم إصدار شهادتك بنجاح' 
      });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
      toast({ title: 'تم الإلغاء', description: 'تم إلغاء الشهادة بنجاح' });
    },
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDownloadCertificate() {
  return useMutation({
    mutationFn: downloadCertificate,
    onError: (error: Error) => {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    },
  });
}
