/**
 * Gate-P Audit Log Viewer
 * Displays all password-protected operations with filtering and search
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Skeleton } from '@/core/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/core/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Shield, Search, Filter, Calendar, User, FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  tenant_id: string;
  actor: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: any;
  created_at: string;
  actor_email?: string;
}

const ACTION_LABELS: Record<string, string> = {
  tenant_suspend: 'Suspend Tenant',
  tenant_reactivate: 'Reactivate Tenant',
  tenant_deprovision: 'Deprovision Tenant',
  settings_update: 'Update Settings',
  job_create: 'Create Job',
  job_update: 'Update Job',
  job_delete: 'Delete Job',
  job_trigger: 'Trigger Job',
  job_toggle_status: 'Toggle Job Status',
  health_check_trigger: 'Trigger Health Check',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  tenant: 'Tenant',
  admin_settings: 'Admin Settings',
  system_job: 'System Job',
  tenant_health: 'Tenant Health',
};

export default function GatePAuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['gate-p-audit-logs'],
    queryFn: async () => {
      // Fetch audit logs with user emails
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          id,
          tenant_id,
          actor,
          entity_type,
          entity_id,
          action,
          payload,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch user emails
      const userIds = [...new Set(data?.map(log => log.actor) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      return data?.map(log => ({
        ...log,
        actor_email: emailMap.get(log.actor) || 'Unknown',
      })) || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];

    let filtered = auditLogs.filter((log: AuditLogEntry) => 
      log.payload?.protected_operation === true
    );

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Entity type filter
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(log => log.entity_type === entityTypeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.actor_email?.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entity_type.toLowerCase().includes(query) ||
        log.entity_id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [auditLogs, actionFilter, entityTypeFilter, dateFilter, searchQuery]);

  const handleExportCSV = () => {
    if (!filteredLogs.length) return;

    const headers = ['Date', 'User', 'Action', 'Type', 'Entity ID'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.actor_email,
      ACTION_LABELS[log.action] || log.action,
      ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type,
      log.entity_id,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gate-p-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('deprovision') || action.includes('delete')) return 'destructive';
    if (action.includes('suspend')) return 'secondary';
    if (action.includes('create') || action.includes('trigger')) return 'default';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gate-P Audit Log</h1>
            <p className="text-muted-foreground">Track all password-protected operations</p>
          </div>
        </div>
        <Button onClick={handleExportCSV} disabled={!filteredLogs.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-xs text-muted-foreground">Protected operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant Operations</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(l => l.entity_type === 'tenant').length}
            </div>
            <p className="text-xs text-muted-foreground">Suspend, reactivate, deprovision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Management</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(l => l.entity_type === 'system_job').length}
            </div>
            <p className="text-xs text-muted-foreground">Create, update, delete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings Updates</CardTitle>
            <Filter className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLogs.filter(l => l.action === 'settings_update').length}
            </div>
            <p className="text-xs text-muted-foreground">Configuration changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Filter audit logs by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="tenant_suspend">Suspend Tenant</SelectItem>
                <SelectItem value="tenant_reactivate">Reactivate Tenant</SelectItem>
                <SelectItem value="tenant_deprovision">Deprovision Tenant</SelectItem>
                <SelectItem value="settings_update">Update Settings</SelectItem>
                <SelectItem value="job_create">Create Job</SelectItem>
                <SelectItem value="job_update">Update Job</SelectItem>
                <SelectItem value="job_delete">Delete Job</SelectItem>
                <SelectItem value="job_trigger">Trigger Job</SelectItem>
                <SelectItem value="health_check_trigger">Health Check</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="admin_settings">Admin Settings</SelectItem>
                <SelectItem value="system_job">System Job</SelectItem>
                <SelectItem value="tenant_health">Tenant Health</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operations Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {auditLogs?.filter((log: AuditLogEntry) => log.payload?.protected_operation === true).length || 0} operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs match the search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.actor_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {ENTITY_TYPE_LABELS[log.entity_type] || log.entity_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
            <DialogDescription>
              Complete information about the protected operation
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date & Time</label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEntry.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{selectedEntry.actor_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p className="text-sm">
                    <Badge variant={getActionBadgeVariant(selectedEntry.action)}>
                      {ACTION_LABELS[selectedEntry.action] || selectedEntry.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Entity Type</label>
                  <p className="text-sm text-muted-foreground">
                    {ENTITY_TYPE_LABELS[selectedEntry.entity_type] || selectedEntry.entity_type}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Entity ID</label>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {selectedEntry.entity_id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Additional Data</label>
                <ScrollArea className="h-48 w-full rounded-md border p-4 mt-2">
                  <pre className="text-xs">
                    {JSON.stringify(selectedEntry.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
