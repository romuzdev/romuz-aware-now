import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
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
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addCommitteeMember } from '@/modules/committees/integration';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/core/components/ui/checkbox';

const memberSchema = z.object({
  user_id: z.string().min(1, 'User is required'),
  role: z.string().optional(),
  is_voting: z.boolean().default(true),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface AddMemberDialogProps {
  committeeId: string;
}

export default function AddMemberDialog({ committeeId }: AddMemberDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch users from auth.users via user_profiles or user_roles
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .limit(100);
      
      if (error) throw error;
      
      // Get unique user IDs
      const uniqueUserIds = [...new Set(data.map(r => r.user_id))];
      
      // Fetch user emails from auth metadata if available
      return uniqueUserIds.map(id => ({
        id,
        email: id, // Placeholder - in production you'd fetch actual email
      }));
    },
  });

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      user_id: '',
      role: '',
      is_voting: true,
      start_at: '',
      end_at: '',
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: MemberFormData) => {
      const payload = {
        committee_id: committeeId,
        user_id: data.user_id,
        role: data.role || null,
        is_voting: data.is_voting,
        start_at: data.start_at || null,
        end_at: data.end_at || null,
      };
      return addCommitteeMember(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committee-members', committeeId] });
      toast({
        title: t('committees.success.memberAdded'),
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('committees.error.addMember'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MemberFormData) => {
    addMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t('committees.addMember')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('committees.addMember')}</DialogTitle>
          <DialogDescription>
            {t('committees.addMemberDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('committees.member')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('committees.selectUser')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('committees.memberRole')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('committees.selectRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="chair">{t('committees.roles.chair')}</SelectItem>
                      <SelectItem value="vice_chair">{t('committees.roles.viceChair')}</SelectItem>
                      <SelectItem value="secretary">{t('committees.roles.secretary')}</SelectItem>
                      <SelectItem value="member">{t('committees.roles.member')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_voting"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('committees.votingMember')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('committees.startDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('committees.endDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? t('common.adding') : t('common.add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
