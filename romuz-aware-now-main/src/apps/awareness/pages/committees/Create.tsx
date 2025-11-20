import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/core/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { createCommittee } from '@/modules/committees/integration';
import { useToast } from '@/hooks/use-toast';

const committeeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  charter: z.string().optional(),
  status: z.enum(['active', 'inactive', 'dissolved']),
});

type CommitteeFormData = z.infer<typeof committeeSchema>;

export default function CreateCommittee() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CommitteeFormData>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      code: '',
      name: '',
      charter: '',
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: createCommittee,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
      toast({
        title: t('committees.success.created'),
      });
      navigate(`/awareness/committees/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('committees.error.create'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CommitteeFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/awareness/committees')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t('committees.newCommittee')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('committees.newCommittee')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('committees.code')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="COM-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('committees.status')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t('committees.status.active')}</SelectItem>
                          <SelectItem value="inactive">{t('committees.status.inactive')}</SelectItem>
                          <SelectItem value="dissolved">{t('committees.status.dissolved')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('committees.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="charter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('committees.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/committees')}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t('common.loading') : t('common.create')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
