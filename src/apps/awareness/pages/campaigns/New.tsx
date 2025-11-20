import { useNavigate } from 'react-router-dom';
import { useCan } from '@/core/rbac';
import { useCreateCampaign, CampaignForm } from '@/modules/campaigns';
import type { CampaignCreateInput } from '@/schemas/campaigns';

export default function CampaignNewPage() {
  const can = useCan();
  const navigate = useNavigate();
  const { create, loading, error } = useCreateCampaign();

  if (!can('campaigns.manage')) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          You do not have permission to create campaigns.
        </p>
      </div>
    );
  }

  async function onSubmit(values: CampaignCreateInput) {
    const newId = await create(values);
    if (newId) navigate(`/awareness/campaigns/${newId}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Campaign</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <CampaignForm mode="create" onSubmit={onSubmit} submitting={loading} />
    </div>
  );
}
