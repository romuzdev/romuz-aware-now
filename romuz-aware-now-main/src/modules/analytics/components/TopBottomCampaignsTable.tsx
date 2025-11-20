import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { ExternalLink } from 'lucide-react';
import type { TopBottomCampaign } from '@/modules/campaigns';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TopBottomCampaignsTableProps {
  title: string;
  data?: TopBottomCampaign[];
  isLoading?: boolean;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  };
}

export function TopBottomCampaignsTable({
  title,
  data,
  isLoading,
  filters,
}: TopBottomCampaignsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleOpenCampaign = (campaignId: string) => {
    const params = new URLSearchParams({
      tab: 'metrics',
    });

    if (filters?.dateFrom) params.set('dr_from', filters.dateFrom);
    if (filters?.dateTo) params.set('dr_to', filters.dateTo);
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status);
    }

    navigate(`/admin/campaigns/${campaignId}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('awareness.analytics.table.empty')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('awareness.analytics.table.headers.campaign')}</TableHead>
              <TableHead>{t('awareness.analytics.table.headers.owner')}</TableHead>
              <TableHead className="text-right">{t('awareness.analytics.table.headers.participants')}</TableHead>
              <TableHead className="text-right">{t('awareness.analytics.table.headers.completionRate')}</TableHead>
              <TableHead className="text-right">{t('awareness.analytics.table.headers.avgScore')}</TableHead>
              <TableHead className="text-right">{t('awareness.analytics.table.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((campaign) => (
              <TableRow key={campaign.campaign_id}>
                <TableCell className="font-medium">
                  {campaign.campaign_name}
                </TableCell>
                <TableCell>{campaign.owner_name || t('common.noData')}</TableCell>
                <TableCell className="text-right">
                  {campaign.total_participants}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.completion_rate !== null
                    ? `${campaign.completion_rate.toFixed(1)}%`
                    : t('common.noData')}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.avg_score !== null
                    ? `${campaign.avg_score.toFixed(1)}%`
                    : t('common.noData')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCampaign(campaign.campaign_id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t('awareness.analytics.table.open')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
