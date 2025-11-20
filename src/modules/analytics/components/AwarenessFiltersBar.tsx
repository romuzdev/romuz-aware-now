import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Calendar } from '@/core/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AwarenessFilters } from '@/modules/campaigns';
import type { Campaign } from '@/modules/campaigns';
import { useTranslation } from 'react-i18next';

interface AwarenessFiltersBarProps {
  filters: AwarenessFilters;
  onFiltersChange: (filters: AwarenessFilters) => void;
  campaigns?: Campaign[];
  isLoadingCampaigns?: boolean;
}

export function AwarenessFiltersBar({
  filters,
  onFiltersChange,
  campaigns = [],
  isLoadingCampaigns = false,
}: AwarenessFiltersBarProps) {
  const { t } = useTranslation();

  const handleClear = () => {
    onFiltersChange({
      dateRange: '30d',
      status: 'all',
    });
  };

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Date Range Preset */}
        <div className="flex-1 min-w-[200px]">
          <Label>{t('awareness.analytics.filters.dateRange')}</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, dateRange: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">{t('awareness.analytics.filters.presets.30d')}</SelectItem>
              <SelectItem value="90d">{t('awareness.analytics.filters.presets.90d')}</SelectItem>
              <SelectItem value="this_month">{t('awareness.analytics.filters.presets.this_month')}</SelectItem>
              <SelectItem value="custom">{t('awareness.analytics.filters.presets.custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date From */}
        {filters.dateRange === 'custom' && (
          <>
            <div className="flex-1 min-w-[200px]">
              <Label>{t('awareness.analytics.filters.from')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom
                      ? format(new Date(filters.dateFrom), 'PPP')
                      : t('awareness.analytics.filters.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filters.dateFrom ? new Date(filters.dateFrom) : undefined
                    }
                    onSelect={(date) =>
                      onFiltersChange({
                        ...filters,
                        dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label>{t('awareness.analytics.filters.to')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo
                      ? format(new Date(filters.dateTo), 'PPP')
                      : t('awareness.analytics.filters.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filters.dateTo ? new Date(filters.dateTo) : undefined
                    }
                    onSelect={(date) =>
                      onFiltersChange({
                        ...filters,
                        dateTo: date ? format(date, 'yyyy-MM-dd') : undefined,
                      })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Owner Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label>{t('awareness.analytics.filters.owner')}</Label>
          <Input
            placeholder={t('awareness.analytics.filters.ownerPlaceholder')}
            value={filters.owner || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, owner: e.target.value || undefined })
            }
          />
        </div>

        {/* Status Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label>{t('awareness.analytics.filters.status')}</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('awareness.analytics.filters.statuses.all')}</SelectItem>
              <SelectItem value="not_started">{t('awareness.analytics.filters.statuses.not_started')}</SelectItem>
              <SelectItem value="in_progress">{t('awareness.analytics.filters.statuses.in_progress')}</SelectItem>
              <SelectItem value="completed">{t('awareness.analytics.filters.statuses.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign Filter */}
        <div className="flex-1 min-w-[200px]">
          <Label>{t('awareness.analytics.filters.campaign')}</Label>
          <Select
            value={filters.campaignId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                campaignId: value === 'all' ? undefined : value,
              })
            }
            disabled={isLoadingCampaigns}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('awareness.analytics.filters.allCampaigns')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('awareness.analytics.filters.allCampaigns')}</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Button */}
        <div className="flex items-end">
          <Button variant="outline" onClick={handleClear}>
            <X className="mr-2 h-4 w-4" />
            {t('awareness.analytics.filters.clear')}
          </Button>
        </div>
      </div>
    </div>
  );
}
