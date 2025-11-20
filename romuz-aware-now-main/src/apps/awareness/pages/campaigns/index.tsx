import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCan } from '@/core/rbac';
import {
  useCampaignsList,
  useCampaignsFilters,
  useBulkCampaignActions,
  StatusBadge,
  type Campaign,
  type CampaignStatus,
} from '@/modules/campaigns';
import { useSavedViews } from '@/core/hooks/saved-views/useSavedViews';
import { useSavedViewsImport } from '@/core/hooks/saved-views/useSavedViewsImport';
import { useToast } from '@/hooks/use-toast';
import { toCSV } from '@/lib/export/csv';
import { MoreVertical, Star } from 'lucide-react';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/core/components/ui/dropdown-menu';
import { Checkbox } from '@/core/components/ui/checkbox';

export default function CampaignsListPage() {
  const { t } = useTranslation();
  const can = useCan();
  const { toast } = useToast();

  useEffect(() => {
    document.title = `${t('awareness.campaigns.title')} | Romuz`;
  }, [t]);
  
  // Advanced filters hook (in-memory + URL sync only)
  const { filters, setFilters, DEFAULTS } = useCampaignsFilters();
  
  // Server-side Saved Views (replaces localStorage)
  const { 
    views, 
    loading: viewsLoading, 
    createView, 
    applyView: getViewFilters, 
    deleteView, 
    setDefault,
    getDefaultView,
  } = useSavedViews({ pageKey: 'campaigns:list' });

  // One-time import from localStorage
  const { imported, importing } = useSavedViewsImport({ pageKey: 'campaigns:list' });
  
  const { archive, unarchive, changeStatus, setOwner, duplicateOne, duplicateMany } = useBulkCampaignActions();

  const [page, setPage] = useState(1);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [defaultApplied, setDefaultApplied] = useState(false);
  
  // Set Owner dialog state
  const [setOwnerOpen, setSetOwnerOpen] = useState(false);
  const [ownerInput, setOwnerInput] = useState('');

  // Bulk actions state
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive'|'unarchive'|'duplicate'|'status'|'owner'|null>(null);
  const [pendingStatus, setPendingStatus] = useState<CampaignStatus | null>(null);

  // Apply default view on first load (if URL has no explicit filters)
  useEffect(() => {
    if (!defaultApplied && !viewsLoading && views.length > 0) {
      const defaultView = getDefaultView();
      const hasUrlFilters = window.location.search.includes('?');
      
      if (defaultView && !hasUrlFilters) {
        console.log('Applying default view:', defaultView.name);
        setFilters(defaultView.filters);
        setDefaultApplied(true);
      } else {
        setDefaultApplied(true);
      }
    }
  }, [viewsLoading, views, defaultApplied, getDefaultView, setFilters]);

  // Optional: realtime refresh for list
  useEffect(() => {
    const ch = supabase
      .channel('awareness_campaigns-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'awareness_campaigns' }, () => {
        setPage(1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Fetch campaigns with filters (Part 8.2)
  const { data, total, isLoading, stats } = useCampaignsList({
    page,
    filters,
  });

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / filters.pageSize));
  const allSelected = data.length > 0 && selected.length === data.length;

  function handleApplyView(viewId: string) {
    const viewFilters = getViewFilters(viewId);
    if (viewFilters) {
      setFilters(viewFilters);
      setPage(1);
      setSelected([]);
    }
  }

  async function handleSetDefault(viewId: string) {
    try {
      await setDefault(viewId);
    } catch (e: any) {
      // Toast handled by hook
    }
  }

  function toggleAll() {
    setSelected(allSelected ? [] : data.map(c => c.id));
  }

  function toggleOne(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function ensure(action: 'archive'|'unarchive'|'duplicate'|'status'|'owner', payload?: any) {
    // Destructive actions always need confirmation
    const isDestructive = action === 'archive' || action === 'unarchive';
    // Large batches (>1000) need confirmation for safety
    const isLargeBatch = selected.length > 1000;
    
    if (isDestructive || isLargeBatch) {
      setConfirmAction(action);
      setPendingStatus(payload ?? null);
      setConfirmOpen(true);
    } else {
      runAction(action, payload);
    }
  }

  async function runAction(action: 'archive'|'unarchive'|'duplicate'|'status'|'owner', payload?: any) {
    try {
      if (action === 'archive') await archive(selected);
      if (action === 'unarchive') await unarchive(selected);
      if (action === 'duplicate') await duplicateMany(selected);
      if (action === 'status') await changeStatus(selected, payload);
      if (action === 'owner') await setOwner(selected, payload);
      setSelected([]);
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    } finally {
      setConfirmOpen(false);
      setConfirmAction(null);
      setPendingStatus(null);
    }
  }

  async function handleSetOwner() {
    if (!ownerInput.trim()) {
      toast({ variant: 'destructive', title: 'Owner name required' });
      return;
    }
    try {
      await setOwner(selected, ownerInput.trim());
      setOwnerInput('');
      setSetOwnerOpen(false);
      setSelected([]);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to set owner', description: e.message });
    }
  }

  async function onSaveView() {
    try {
      await createView(saveName.trim(), filters);
      setSaveName('');
      setSaveOpen(false);
    } catch (e: any) {
      // Toast handled by hook
    }
  }

  async function onDeleteView(id: string) {
    try {
      await deleteView(id);
    } catch (e: any) {
      // Toast handled by hook
    }
  }

  async function exportAllFiltered() {
    try {
      setExporting(true);
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Apply same filters as current view
      let q = supabase
        .from('awareness_campaigns')
        .select('id, name, status, start_date, end_date, owner_name, created_at, updated_at');

      if (!filters.includeArchived) {
        q = q.is('archived_at', null);
      }

      if (filters.q?.trim()) q = q.ilike('name', `%${filters.q.trim()}%`);
      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters.owner?.trim()) q = q.ilike('owner_name', `%${filters.owner.trim()}%`);
      if (filters.from) q = q.gte('start_date', filters.from);
      if (filters.to) q = q.lte('end_date', filters.to);

      // Apply same sorting as current view
      const ascending = filters.sortDir === 'asc';
      const { data: rows, error } = await q.order(filters.sortBy, { ascending });
      if (error) throw new Error(error.message);

      // CSV headers
      const headers = { 
        id: 'ID', 
        name: 'Name', 
        status: 'Status', 
        start_date: 'Start Date', 
        end_date: 'End Date', 
        owner_name: 'Owner',
        created_at: 'Created At',
        updated_at: 'Updated At',
      };
      
      const csv = toCSV(rows ?? [], headers);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Filename format: campaigns_export_YYYYMMDD_HHMM.csv
      const now = new Date();
      const YYYYMMDD = now.toISOString().slice(0, 10).replace(/-/g, '');
      const HHMM = now.toISOString().slice(11, 16).replace(/:/g, '');
      a.download = `campaigns_export_${YYYYMMDD}_${HHMM}.csv`;
      
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: `Exported ${(rows ?? []).length} campaign(s).` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Export failed', description: e.message });
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setFilters(DEFAULTS);
    setPage(1);
    setSelected([]);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('awareness.campaigns.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('awareness.campaigns.description')}</p>
        </div>
        <Button asChild disabled={!can('campaigns.manage')}>
          <Link to="/admin/campaigns/new">{t('awareness.campaigns.newCampaign')}</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card><CardHeader><CardTitle>{t('awareness.campaigns.stats.total')}</CardTitle></CardHeader><CardContent>{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('awareness.campaigns.stats.active')}</CardTitle></CardHeader><CardContent>{stats.active}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('awareness.campaigns.stats.scheduled')}</CardTitle></CardHeader><CardContent>{stats.scheduled}</CardContent></Card>
        <Card><CardHeader><CardTitle>{t('awareness.campaigns.stats.completed')}</CardTitle></CardHeader><CardContent>{stats.completed}</CardContent></Card>
      </div>

      {/* Filters toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Search + Status + Owner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Search by name…"
              value={filters.q}
              onChange={(e) => { setPage(1); setFilters({ q: e.target.value }); setSelected([]); }}
            />

            <Select value={filters.status} onValueChange={(v) => { setPage(1); setFilters({ status: v }); setSelected([]); }}>
              <SelectTrigger><SelectValue placeholder="Status"/></SelectTrigger>
              <SelectContent>
                {['all','draft','scheduled','active','completed','cancelled'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Owner name…"
              value={filters.owner}
              onChange={(e) => { setPage(1); setFilters({ owner: e.target.value }); setSelected([]); }}
            />
          </div>

          {/* Row 2: Date Range + Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <Input 
              type="date" 
              placeholder="From" 
              value={filters.from ?? ''} 
              onChange={(e) => { setPage(1); setFilters({ from: e.target.value || null }); setSelected([]); }}
            />
            <Input 
              type="date" 
              placeholder="To" 
              value={filters.to ?? ''} 
              onChange={(e) => { setPage(1); setFilters({ to: e.target.value || null }); setSelected([]); }}
            />

            <Select value={filters.sortBy} onValueChange={(v) => { setPage(1); setFilters({ sortBy: v }); setSelected([]); }}>
              <SelectTrigger><SelectValue placeholder="Sort by"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="start_date">Start Date</SelectItem>
                <SelectItem value="end_date">End Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="created_at">Created</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortDir} onValueChange={(v: 'asc'|'desc') => { setPage(1); setFilters({ sortDir: v }); setSelected([]); }}>
              <SelectTrigger><SelectValue placeholder="Direction"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(filters.pageSize)} onValueChange={(v) => { setPage(1); setFilters({ pageSize: Number(v) }); setSelected([]); }}>
              <SelectTrigger><SelectValue placeholder="Rows"/></SelectTrigger>
              <SelectContent>
                {[10,25,50,100].map(n => <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Row 3: Include Archived only */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-archived"
              checked={filters.includeArchived}
              onCheckedChange={(v) => { setPage(1); setFilters({ includeArchived: !!v }); setSelected([]); }}
            />
            <label htmlFor="include-archived" className="text-sm cursor-pointer">Include archived</label>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar: All management buttons together */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {importing && 'Importing saved views...'}
          {imported && !importing && views.length > 0 && `${views.length} saved view(s)`}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
            Save View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={viewsLoading}>
                Saved Views ({views.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Apply View</DropdownMenuLabel>
              {views.length > 0 ? (
                views.map(v => (
                  <DropdownMenuItem 
                    key={v.id} 
                    onClick={() => handleApplyView(v.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{v.name}</span>
                    {v.is_default && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {views.length > 0 ? (
                views.map(v => (
                  <div key={`${v.id}-actions`} className="px-2 py-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[150px]">{v.name}</span>
                      <div className="flex gap-1">
                        {!v.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => handleSetDefault(v.id)}
                            title="Set as default"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-destructive"
                          onClick={() => onDeleteView(v.id)}
                          title="Delete"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <DropdownMenuItem disabled>No views to manage</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportAllFiltered} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>


      {/* Bulk Toolbar */}
      {selected.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{selected.length} selected</span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => ensure('duplicate')} 
                  disabled={!can('campaigns.manage')}
                  title={!can('campaigns.manage') ? 'Insufficient permissions' : ''}
                >
                  Duplicate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSetOwnerOpen(true);
                  }} 
                  disabled={!can('campaigns.manage')}
                  title={!can('campaigns.manage') ? 'Insufficient permissions' : 'Set owner for selected campaigns'}
                >
                  Set Owner
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => ensure('archive')} 
                  disabled={!can('campaigns.manage')}
                  title={!can('campaigns.manage') ? 'Insufficient permissions' : ''}
                >
                  Archive
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => ensure('unarchive')} 
                  disabled={!can('campaigns.manage')}
                  title={!can('campaigns.manage') ? 'Insufficient permissions' : ''}
                >
                  Unarchive
                </Button>
                <Select 
                  onValueChange={(v) => ensure('status', v)} 
                  disabled={!can('campaigns.manage')}
                >
                  <SelectTrigger 
                    className="w-40 h-9"
                    title={!can('campaigns.manage') ? 'Insufficient permissions' : ''}
                  >
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['draft','scheduled','active','completed','cancelled'] as CampaignStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!isLoading && data && data.length > 0) && data.map((c: Campaign) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to={`/admin/campaigns/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                    {c.archivedAt && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Archived
                      </span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>{c.startDate ?? '—'}</TableCell>
                  <TableCell>{c.endDate ?? '—'}</TableCell>
                  <TableCell>{c.ownerName ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/campaigns/${c.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!can('campaigns.manage')}
                          onClick={async () => {
                            try {
                              await duplicateOne(c.id);
                            } catch(e: any) {
                              toast({ variant: 'destructive', title: 'Failed', description: e.message });
                            }
                          }}
                        >
                          Duplicate
                        </DropdownMenuItem>
                        {!c.archivedAt ? (
                          <DropdownMenuItem
                            disabled={!can('campaigns.manage')}
                            onClick={async () => {
                              try {
                                await archive([c.id]);
                              } catch(e: any) {
                                toast({ variant: 'destructive', title: 'Failed', description: e.message });
                              }
                            }}
                          >
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled={!can('campaigns.manage')}
                            onClick={async () => {
                              try {
                                await unarchive([c.id]);
                              } catch(e: any) {
                                toast({ variant: 'destructive', title: 'Failed', description: e.message });
                              }
                            }}
                          >
                            Unarchive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {(!isLoading && (!data || data.length === 0)) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">No campaigns found.</TableCell>
                </TableRow>
              )}

              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages} — {total} results
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>

      {/* Save View Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save current view</DialogTitle>
          </DialogHeader>
          <Input 
            placeholder="View name" 
            value={saveName} 
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName.trim() && onSaveView()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={onSaveView} disabled={!saveName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Owner Dialog */}
      <Dialog open={setOwnerOpen} onOpenChange={setSetOwnerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Owner for {selected.length} Campaign(s)</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">
            Enter the owner name to assign to all selected campaigns.
          </p>
          <Input 
            placeholder="Owner name" 
            value={ownerInput} 
            onChange={(e) => setOwnerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ownerInput.trim() && handleSetOwner()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetOwnerOpen(false)}>Cancel</Button>
            <Button onClick={handleSetOwner} disabled={!ownerInput.trim()}>Set Owner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Bulk Action Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm bulk action</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are about to apply <strong>{confirmAction}</strong> to {selected.length} campaign(s). Are you sure?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(confirmAction!, pendingStatus ?? undefined)} disabled={!confirmAction}>
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
