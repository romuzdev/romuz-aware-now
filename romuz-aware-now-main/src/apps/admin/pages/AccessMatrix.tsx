import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table";
import { Badge } from "@/core/components/ui/badge";
import { Check, X } from "lucide-react";

// TODO D1-Part4+: Load roles and permissions from RBAC metadata tables.
// TODO D1-Part4+: Implement interactive matrix with filters and export options.

// Static sample data for demonstration
const roles = ["Admin", "Manager", "Viewer"];
const resources = [
  "Policies",
  "Awareness Campaigns",
  "Audit",
  "Access Matrix",
];

// Static permission matrix: role -> resource -> actions
const permissionMatrix = {
  Admin: {
    Policies: ["Read", "Write", "Delete", "Approve"],
    "Awareness Campaigns": ["Read", "Write", "Delete", "Approve"],
    Audit: ["Read"],
    "Access Matrix": ["Read", "Write"],
  },
  Manager: {
    Policies: ["Read", "Write", "Approve"],
    "Awareness Campaigns": ["Read", "Write"],
    Audit: ["Read"],
    "Access Matrix": ["Read"],
  },
  Viewer: {
    Policies: ["Read"],
    "Awareness Campaigns": ["Read"],
    Audit: [],
    "Access Matrix": [],
  },
};

export default function AccessMatrix() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Access Matrix</h1>
        <p className="mt-2 text-muted-foreground">
          This page will visualize roles and their permissions across key resources.
        </p>
      </div>

      {/* Access Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Permission Matrix</CardTitle>
          <CardDescription>
            Showing sample access matrix (static data for now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roles.map((role) => (
              <div key={role} className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Badge variant="outline">{role}</Badge>
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Read</TableHead>
                      <TableHead>Write</TableHead>
                      <TableHead>Delete</TableHead>
                      <TableHead>Approve</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource) => {
                      const permissions =
                        permissionMatrix[role as keyof typeof permissionMatrix][
                          resource as keyof (typeof permissionMatrix)[keyof typeof permissionMatrix]
                        ] || [];

                      return (
                        <TableRow key={resource}>
                          <TableCell className="font-medium">
                            {resource}
                          </TableCell>
                          <TableCell>
                            {permissions.includes("Read") ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {permissions.includes("Write") ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {permissions.includes("Delete") ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            {permissions.includes("Approve") ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
          <CardDescription>
            Interactive filters and export options will be added in D1-Part4+
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
