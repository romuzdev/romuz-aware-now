/**
 * M20 - Threat Intelligence Settings
 * Configure threat intelligence system settings
 */

import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/core/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Label } from '@/core/components/ui/label';
import { Switch } from '@/core/components/ui/switch';
import { Button } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';

export default function ThreatIntelligenceSettings() {
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        icon={SettingsIcon}
        title="Threat Intelligence Settings"
        description="Configure system behavior and preferences"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Auto-Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Synchronization</CardTitle>
            <CardDescription>
              Configure automatic feed synchronization behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync">Auto-sync feeds</Label>
              <Switch id="auto-sync" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync Interval</Label>
              <Select defaultValue="1h">
                <SelectTrigger id="sync-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="6h">6 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">Save Sync Settings</Button>
          </CardContent>
        </Card>

        {/* Matching Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Matching</CardTitle>
            <CardDescription>
              Configure threat matching and detection rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-match">Auto-match threats</Label>
              <Switch id="auto-match" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
              <Select defaultValue="0.7">
                <SelectTrigger id="confidence-threshold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50% - Low</SelectItem>
                  <SelectItem value="0.7">70% - Medium</SelectItem>
                  <SelectItem value="0.8">80% - High</SelectItem>
                  <SelectItem value="0.9">90% - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">Save Matching Settings</Button>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
            <CardDescription>
              Configure alerting for threat detections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="alert-critical">Alert on critical threats</Label>
              <Switch id="alert-critical" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alert-high">Alert on high severity</Label>
              <Switch id="alert-high" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="create-incident">Auto-create incidents</Label>
              <Switch id="create-incident" />
            </div>

            <Button className="w-full">Save Alert Settings</Button>
          </CardContent>
        </Card>

        {/* Retention Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>
              Configure data retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indicator-retention">Indicator Retention</Label>
              <Select defaultValue="90d">
                <SelectTrigger id="indicator-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="180d">180 days</SelectItem>
                  <SelectItem value="365d">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="match-retention">Match Retention</Label>
              <Select defaultValue="180d">
                <SelectTrigger id="match-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="180d">180 days</SelectItem>
                  <SelectItem value="365d">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">Save Retention Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
