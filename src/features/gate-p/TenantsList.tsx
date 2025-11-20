import { Tenant } from "@/core/tenancy/integration";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Skeleton } from "@/core/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TenantsListProps {
  tenants: Tenant[];
  isLoading: boolean;
  selectedTenantId: string | null;
  onSelectTenant: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; label: string }> = {
    ACTIVE: { variant: "default", label: "Active" },
    SUSPENDED: { variant: "destructive", label: "Suspended" },
    PROVISIONING: { variant: "secondary", label: "Provisioning" },
    DEPROVISIONING: { variant: "secondary", label: "Deprovisioning" },
    ARCHIVED: { variant: "outline", label: "Archived" },
    CREATED: { variant: "secondary", label: "Created" },
    READ_ONLY: { variant: "outline", label: "Read Only" },
  };

  const config = variants[status] || { variant: "outline", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function TenantsList({
  tenants,
  isLoading,
  selectedTenantId,
  onSelectTenant,
}: TenantsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tenants found
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {tenants.map((tenant) => (
          <Button
            key={tenant.id}
            variant={selectedTenantId === tenant.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-auto py-3 px-4",
              selectedTenantId === tenant.id && "bg-muted"
            )}
            onClick={() => onSelectTenant(tenant.id)}
          >
            <div className="flex flex-col items-start gap-1 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tenant.name}</span>
                  {tenant.is_default && (
                    <Badge variant="default" className="text-xs">افتراضي</Badge>
                  )}
                </div>
                {getStatusBadge(tenant.status)}
              </div>
              {tenant.domain && (
                <span className="text-xs text-muted-foreground">{tenant.domain}</span>
              )}
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
