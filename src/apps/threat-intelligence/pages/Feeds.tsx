/**
 * M20 - Threat Intelligence Feeds Management
 * Manage threat intelligence feed sources
 */

import { useState } from 'react';
import { Database, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Button } from '@/core/components/ui/button';
import { FilterBar } from '@/core/components/ui/filter-bar';
import { DataTableLoading } from '@/core/components/ui/data-table-loading';
import { useThreatFeeds } from '@/modules/threat-intelligence';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ThreatFeeds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const { data: feeds, isLoading } = useThreatFeeds({
    is_active: statusFilter === 'active' ? true : statusFilter === 'disabled' ? false : undefined,
    search: searchQuery || undefined,
  });

  const handleSync = async (feedId: string) => {
    toast({
      title: 'Syncing feed',
      description: 'Feed synchronization started...',
    });
    // Actual sync would call edge function
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'error': return 'destructive';
      case 'disabled': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={Database}
        title="Threat Feeds"
        description="Manage threat intelligence feed sources"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </div>
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search feeds..."
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <DataTableLoading columnCount={7} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feed Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Indicators</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Next Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeds && feeds.length > 0 ? (
                feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell className="font-medium">{feed.feed_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{feed.feed_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(feed.is_active ? 'active' : 'disabled')}>
                        {feed.is_active ? 'active' : 'disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>{feed.total_indicators_fetched || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {feed.last_fetched_at
                        ? format(new Date(feed.last_fetched_at), 'MMM dd, yyyy HH:mm')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {feed.last_fetch_status || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(feed.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No feeds configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
