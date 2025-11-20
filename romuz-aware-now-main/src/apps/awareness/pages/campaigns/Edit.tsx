import { useParams, useNavigate } from 'react-router-dom';
import { useCan } from '@/core/rbac';
import { useCampaignById, useUpdateCampaign, CampaignForm } from '@/modules/campaigns';
import type { CampaignUpdateInput } from '@/schemas/campaigns';

export default function CampaignEditPage() {
  const { id = '' } = useParams();
  const can = useCan();
  const navigate = useNavigate();
  const { data, isLoading, error: loadError } = useCampaignById(id);
  const { update, loading, error: saveError } = useUpdateCampaign();

  if (!can('campaigns.manage')) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          You do not have permission to edit campaigns.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (loadError) return <div className="text-sm text-destructive">{loadError}</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Campaign not found.</div>;

  async function onSubmit(values: CampaignUpdateInput) {
    const ok = await update({ ...values, id });
    if (ok) navigate(`/awareness/campaigns/${id}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Campaign</h1>
      {saveError && <p className="text-sm text-destructive">{saveError}</p>}
      <CampaignForm
        mode="edit"
        defaultValues={{
          name: data.name,
          description: data.description,
          status: data.status as any,
          startDate: data.startDate,
          endDate: data.endDate,
          ownerName: data.ownerName,
        }}
        onSubmit={onSubmit}
        submitting={loading}
      />
    </div>
  );
}
