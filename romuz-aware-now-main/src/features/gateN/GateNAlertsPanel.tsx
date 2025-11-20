/**
 * Gate-N Alerts Panel (N6)
 * Alerts & Failures Monitor - Placeholder for Gate-E integration
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Alert, AlertDescription } from '@/core/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';

export default function GateNAlertsPanel() {
  // Placeholder example data
  const exampleAlerts = [
    { 
      time: '2025-01-10 14:30', 
      source: 'refresh_kpis', 
      severity: 'high', 
      status: 'active', 
      message: 'Job execution failed: timeout after 300s' 
    },
    { 
      time: '2025-01-10 12:15', 
      source: 'dispatch_alerts', 
      severity: 'medium', 
      status: 'acknowledged', 
      message: 'Email delivery delayed: retry in progress' 
    },
    { 
      time: '2025-01-10 10:00', 
      source: 'detect_drift', 
      severity: 'low', 
      status: 'resolved', 
      message: 'Data drift detected in campaign metrics' 
    },
  ];

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'acknowledged': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Alerts & Failures Monitor
        </CardTitle>
        <CardDescription>
          Alerts and failed jobs - Will integrate with Gate-E
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This section will display active alerts and failed jobs from Gate-E, with the ability
            to take direct actions such as retry, acknowledge, or close alerts.
          </AlertDescription>
        </Alert>

        {/* Example Alerts */}
        <div>
          <h3 className="text-lg font-medium mb-4">Sample Alerts</h3>
          <div className="space-y-3">
            {exampleAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityVariant(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Badge variant={getStatusVariant(alert.status)}>
                        {alert.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {alert.source}
                      </span>
                    </div>
                    <p className="text-sm">
                      {alert.message}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {alert.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planned Columns */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Planned Columns:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Timestamp</li>
            <li>Source (job_key, alert_policy_id)</li>
            <li>Severity (low, medium, high, critical)</li>
            <li>Status (active, acknowledged, in_progress, resolved)</li>
            <li>Message (error_message, alert_body)</li>
            <li>Actions (retry, acknowledge, resolve, escalate, dismiss)</li>
          </ul>
        </div>

        {/* Planned Features */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Planned Features:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Display alerts in real-time from Gate-E</li>
            <li>Filter by severity, status, source, date</li>
            <li>Retry failed jobs directly</li>
            <li>Acknowledge alerts and track owner</li>
            <li>Close resolved alerts</li>
            <li>Automatically escalate critical alerts</li>
            <li>Statistics and analytics for failure rates</li>
            <li>Link alerts to Action Items in Gate-H</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
