import { Badge } from '@/core/components/ui/badge';
import type { CampaignStatus } from '../types/campaign.types';

const map: Record<CampaignStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  // style variants can later map to different badge variants
  return <Badge variant="secondary" className="capitalize">{map[status]}</Badge>;
}
