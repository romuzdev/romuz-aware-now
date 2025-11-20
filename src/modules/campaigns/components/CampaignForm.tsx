import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignCreateSchema, campaignUpdateSchema, campaignStatusValues, type CampaignCreateInput, type CampaignUpdateInput } from '@/schemas/campaigns';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';

type BaseProps = {
  defaultValues?: Partial<CampaignCreateInput>;
  onSubmit: (values: CampaignCreateInput | CampaignUpdateInput) => Promise<void> | void;
  mode: 'create' | 'edit';
  submitting?: boolean;
};

export function CampaignForm({ defaultValues, onSubmit, mode, submitting }: BaseProps) {
  const schema = mode === 'create' ? campaignCreateSchema : campaignUpdateSchema;
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CampaignCreateInput | CampaignUpdateInput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  useEffect(() => { if (defaultValues) reset(defaultValues as any); }, [defaultValues, reset]);

  const status = watch('status' as any);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input {...register('name' as const)} placeholder="Campaign name" />
          {errors?.name && <p className="text-xs text-destructive">{String(errors.name.message)}</p>}
        </div>
        <div>
          <Label>Owner</Label>
          <Input {...register('ownerName' as const)} placeholder="Owner / Team" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea {...register('description' as const)} placeholder="Short description..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Status</Label>
          <Select value={status as any} onValueChange={(v) => setValue('status' as any, v as any, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {campaignStatusValues.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors?.status && <p className="text-xs text-destructive">{String((errors as any).status?.message)}</p>}
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" {...register('startDate' as const)} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" {...register('endDate' as const)} />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="submit" disabled={!!submitting}>
          {mode === 'create' ? 'Create Campaign' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
