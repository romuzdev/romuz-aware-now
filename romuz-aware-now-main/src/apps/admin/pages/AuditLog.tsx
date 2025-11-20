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

// TODO D1-Part4+: Replace static audit entries with live data from audit log tables.
// TODO D1-Part4+: Add filters (date range, actor, action type) and pagination.

// Static sample data for demonstration
const sampleAuditEntries = [
  {
    id: 1,
    timestamp: "2025-01-08 14:23:45",
    actor: "admin@example.com",
    action: "CREATE_POLICY",
    target: "Policy #1234",
    status: "success",
  },
  {
    id: 2,
    timestamp: "2025-01-08 14:15:32",
    actor: "manager@example.com",
    action: "UPDATE_CAMPAIGN",
    target: "Campaign #5678",
    status: "success",
  },
  {
    id: 3,
    timestamp: "2025-01-08 13:58:21",
    actor: "admin@example.com",
    action: "DELETE_USER",
    target: "User #9012",
    status: "failed",
  },
  {
    id: 4,
    timestamp: "2025-01-08 13:42:10",
    actor: "employee@example.com",
    action: "VIEW_REPORT",
    target: "Report #3456",
    status: "success",
  },
  {
    id: 5,
    timestamp: "2025-01-08 13:30:05",
    actor: "manager@example.com",
    action: "APPROVE_POLICY",
    target: "Policy #7890",
    status: "success",
  },
];

export default function AuditLog() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-2 text-muted-foreground">
          This page will show a detailed history of admin actions and system events.
        </p>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing sample audit log entries (static data for now)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleAuditEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {entry.timestamp}
                  </TableCell>
                  <TableCell className="text-sm">{entry.actor}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {entry.action}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.target}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "success" ? "default" : "destructive"
                      }
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Placeholder for future filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
          <CardDescription>
            Filter controls will be added in D1-Part4+ (date range, actor, action type, pagination)
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
