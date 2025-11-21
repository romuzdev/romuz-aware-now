/**
 * M20 - Threat Matches Management
 * View and manage threat matches (detections)
 */

import { useState } from 'react';
import { Shield, Filter } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { FilterBar } from '@/core/components/ui/filter-bar';
import { DataTableLoading } from '@/core/components/ui/data-table-loading';
import { useThreatMatches } from '@/modules/threat-intelligence';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { format } from 'date-fns';

export default function ThreatMatches() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: matches, isLoading } = useThreatMatches({
    severity: severityFilter === 'all' ? undefined : (severityFilter as any),
    investigation_status: statusFilter === 'all' ? undefined : (statusFilter as any),
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
      case 'new': return 'default';
      case 'investigating': return 'secondary';
      case 'resolved': return 'outline';
      case 'false_positive': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={Shield}
        title="Threat Matches"
        description="View and investigate threat detections"
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search matches..."
        filters={
          <>
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
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
                <TableHead>Matched Value</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Matched At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches && matches.length > 0 ? (
                matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-mono text-sm">
                      {match.matched_value}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(match.severity)}>
                        {match.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(match.investigation_status)}>
                        {match.investigation_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {match.matched_entity_type}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {match.indicator?.confidence_score
                          ? `${(match.indicator.confidence_score * 100).toFixed(0)}%`
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(match.matched_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Investigate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No threat matches found
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
