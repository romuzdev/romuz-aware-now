/**
 * M20 - Threat Indicators Management
 * View and manage threat indicators (IOCs)
 */

import { useState } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Button } from '@/core/components/ui/button';
import { FilterBar } from '@/core/components/ui/filter-bar';
import { DataTableLoading } from '@/core/components/ui/data-table-loading';
import { useThreatIndicators } from '@/modules/threat-intelligence';
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

export default function ThreatIndicators() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { data: indicators, isLoading } = useThreatIndicators({
    indicator_type: typeFilter === 'all' ? undefined : (typeFilter as any),
    threat_level: severityFilter === 'all' ? undefined : (severityFilter as any),
    search: searchQuery || undefined,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={AlertTriangle}
        title="Threat Indicators"
        description="Manage indicators of compromise (IOCs)"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Indicator
          </Button>
        }
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search indicators..."
        filters={
          <>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="hash">File Hash</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {isLoading ? (
        <DataTableLoading columnCount={7} />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detections</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators && indicators.length > 0 ? (
                indicators.map((indicator) => (
                  <TableRow key={indicator.id}>
                    <TableCell>
                      <Badge variant="outline">{indicator.indicator_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {indicator.indicator_value}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(indicator.threat_level)}>
                        {indicator.threat_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(indicator.is_whitelisted ? 'archived' : 'active')}>
                        {indicator.is_whitelisted ? 'whitelisted' : 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{indicator.detection_count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {indicator.feed?.feed_name || 'Manual'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {indicator.last_seen_at
                        ? format(new Date(indicator.last_seen_at), 'MMM dd, yyyy')
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No indicators found
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
