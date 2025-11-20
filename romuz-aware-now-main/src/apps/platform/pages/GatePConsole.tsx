import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenants } from "@/core/tenancy/integration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { TenantsList } from "@/features/gate-p/TenantsList";
import { TenantDetail } from "@/features/gate-p/TenantDetail";
import { HealthDashboard } from "@/features/gate-p/HealthDashboard";
import { ScheduledTransitions } from "@/features/gate-p/ScheduledTransitions";
import { Activity, Shield, Server, Search, Download, Calendar, Settings } from "lucide-react";
import TenantSettingsPanel from "@/features/gate-p/TenantSettingsPanel";
import { exportCSV, exportJSON } from "@/lib/gate-p/exporters";
import { getUserRole } from "@/lib/gate-p/rbac";

export default function GatePConsole() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const role = getUserRole();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['gate-p-tenants'],
    queryFn: fetchTenants,
  });

  // Filter tenants based on search query
  const filteredTenants = tenants?.filter(t => 
    !searchQuery || 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const selectedTenant = filteredTenants.find(t => t.id === selectedTenantId);

  // Export handlers
  const handleExportCSV = () => {
    if (!filteredTenants.length) return;
    const rows = filteredTenants.map(t => ({
      id: t.id,
      name: t.name,
      domain: t.domain || '',
      status: t.status,
      is_active: t.is_active,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));
    exportCSV('gate-p-tenants.csv', rows);
  };

  const handleExportJSON = () => {
    exportJSON('gate-p-tenants.json', filteredTenants);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gate-P Console</h1>
          <p className="text-muted-foreground">Tenant Lifecycle & Automation Engine</p>
        </div>
      </div>

      {/* Search and Export Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTenants.length}</div>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'Filtered results' : 'Across all statuses'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTenants.filter(t => t.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTenants.filter(t => t.status === 'SUSPENDED').length}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Server className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTenants.filter(t => t.status === 'ARCHIVED').length}
            </div>
            <p className="text-xs text-muted-foreground">Decommissioned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 ml-2" />
            Tenant Configuration
          </TabsTrigger>
          <TabsTrigger value="health">Health Dashboard</TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-4 w-4 ml-2" />
            Scheduled Transitions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-4 w-4 ml-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tenants List</CardTitle>
                <CardDescription>Select a tenant to view details</CardDescription>
              </CardHeader>
              <CardContent>
                <TenantsList
                  tenants={filteredTenants}
                  isLoading={isLoading}
                  selectedTenantId={selectedTenantId}
                  onSelectTenant={setSelectedTenantId}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selectedTenant ? (
                <TenantDetail tenant={selectedTenant} />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                    Select a tenant to view details
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TenantSettingsPanel />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <HealthDashboard tenants={filteredTenants} />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledTransitions />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Shield className="h-16 w-16 text-primary" />
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">سجل تدقيق Gate-P</h3>
              <p className="text-muted-foreground mb-4">
                عرض وتصفية جميع العمليات المحمية بكلمة المرور
              </p>
              <Button onClick={() => window.location.href = '/admin/gate-p/audit'}>
                عرض سجل التدقيق الكامل
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
