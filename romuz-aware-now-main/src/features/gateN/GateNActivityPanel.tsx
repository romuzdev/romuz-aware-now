/**
 * Gate-N Activity Panel (N5)
 * Activity & Audit Monitor - Placeholder for audit_log integration
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { FileText, Info } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';

export default function GateNActivityPanel() {
  // Placeholder example data
  const exampleActivities = [
    { time: '2025-01-10 14:30', user: 'admin@example.com', action: 'campaign.created', entity: 'Awareness Campaign Q1' },
    { time: '2025-01-10 13:15', user: 'manager@example.com', action: 'settings.updated', entity: 'SLA Configuration' },
    { time: '2025-01-10 12:00', user: 'admin@example.com', action: 'job.triggered', entity: 'refresh_kpis' },
    { time: '2025-01-10 11:45', user: 'analyst@example.com', action: 'report.exported', entity: 'Monthly Report' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Activity & Audit Monitor
        </CardTitle>
        <CardDescription>
          Administrative activity log - Will integrate with audit_log and reports (Gate-F/G)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This section will display the administrative activity log from the audit_log table, with the ability to filter
            by user, action type, time period, and affected entity.
          </AlertDescription>
        </Alert>

        {/* Example Activities */}
        <div>
          <h3 className="text-lg font-medium mb-4">Sample Activity Log</h3>
          <div className="space-y-3">
            {exampleActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.user}</span>
                    <Badge variant="secondary">{activity.action}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.entity}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planned Data Columns */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Expected Columns:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Timestamp</li>
            <li>User (actor / user_id)</li>
            <li>Action Type (action_type: CREATE, UPDATE, DELETE, VIEW, TRIGGER)</li>
            <li>Entity Type (entity_type: campaign, policy, settings, job)</li>
            <li>Entity ID (entity_id)</li>
            <li>Details (payload / diff)</li>
          </ul>
        </div>

        {/* Planned Features */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Planned Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Display activity log in real-time</li>
            <li>Advanced filtering (user, action, date, entity)</li>
            <li>Search in text and fields</li>
            <li>View full details for each activity</li>
            <li>Export activity log (CSV, JSON)</li>
            <li>Integration with Gate-F to create custom audit reports</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
