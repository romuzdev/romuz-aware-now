// === Gate-F: Reports Dashboard ===
import { useRBAC } from "@/core/rbac";
import { useReports } from "@/features/gate-p/hooks/useReports";
import { Button } from "@/core/components/ui/button";
import { DataTable } from "@/core/components/ui/data-table";
import { useCampaignsList } from "@/modules/campaigns";

export default function ReportsDashboard() {
  const { can } = useRBAC("view_reports");
  const { data, filters, setFilters, exportReport } = useReports();
  
  const { data: campaigns } = useCampaignsList({ 
    page: 1, 
    filters: { 
      q: '',
      status: 'all',
      from: undefined,
      to: undefined,
      owner: undefined,
      includeArchived: false,
      pageSize: 100, 
      sortBy: 'name', 
      sortDir: 'asc' 
    } 
  });

  if (!can) return <div>🚫 You don't have permission to view reports</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports Dashboard</h1>

      <div className="grid grid-cols-4 gap-2">
        <input 
          type="date" 
          value={filters.startDate || ''} 
          onChange={e => setFilters({ startDate: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />
        <input 
          type="date" 
          value={filters.endDate || ''} 
          onChange={e => setFilters({ endDate: e.target.value })}
          className="px-3 py-2 border rounded-md"
        />
        <select 
          value={filters.campaign || ''} 
          onChange={e => setFilters({ campaign: e.target.value })}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Campaigns</option>
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button onClick={() => exportReport("performance", "csv")}>
          📊 Export CSV
        </Button>
      </div>

      <DataTable columns={data.columns} data={data.rows}/>
    </div>
  );
}
