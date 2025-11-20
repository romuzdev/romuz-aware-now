/**
 * Gate-N Admin Console & Control Center
 * Main page with tabs for all Gate-N panels
 * 
 * Panels:
 * - N1: System Dashboard (Status)
 * - N3: Roles & Permissions Viewer (RBAC)
 * - N4: Operations & Scheduler Control (Jobs)
 * - N5: Activity & Audit Monitor
 * - N6: Alerts & Failures Monitor
 * 
 * Note: Tenant Configuration (Settings) moved to Gate-P Console
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { Button } from '@/core/components/ui/button';
import { Activity, Shield, Clock, FileText, AlertTriangle, Briefcase, Calendar, GitBranch, Heart, Users } from 'lucide-react';
import GateNStatusPanel from '@/features/gateN/GateNStatusPanel';
import GateNJobsPanel from '@/features/gateN/GateNJobsPanel';
import GateNJobManagementPanel from '@/features/gateN/GateNJobManagementPanel';
import { CronSchedulerPanel } from '@/features/gateN/CronSchedulerPanel';
import { JobDependenciesPanel } from '@/features/gateN/JobDependenciesPanel';
import GateNRBACPanel from '@/features/gateN/GateNRBACPanel';
import GateNActivityPanel from '@/features/gateN/GateNActivityPanel';
import GateNAlertsPanel from '@/features/gateN/GateNAlertsPanel';
import GateNHealthCheckPanel from '@/features/gateN/GateNHealthCheckPanel';

export default function GateNConsole() {
  const [activeTab, setActiveTab] = useState('status');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Gate-N - Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            System Management & Configuration Console
          </p>
        </div>
        
        <Link to="/admin/users">
          <Button variant="outline" className="gap-2">
            <Users className="h-4 w-4" />
            User Management
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
          
          <TabsTrigger value="rbac" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">RBAC</span>
          </TabsTrigger>
          
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Run</span>
          </TabsTrigger>
          
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Manage</span>
          </TabsTrigger>

          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>

          <TabsTrigger value="dependencies" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Order</span>
          </TabsTrigger>
          
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
        </TabsList>

        {/* N1: System Dashboard */}
        <TabsContent value="status" className="mt-6">
          <GateNStatusPanel />
        </TabsContent>

        {/* N3: RBAC Viewer (Placeholder) */}
        <TabsContent value="rbac" className="mt-6">
          <GateNRBACPanel />
        </TabsContent>

        {/* N4: Operations & Scheduler */}
        <TabsContent value="jobs" className="mt-6">
          <GateNJobsPanel />
        </TabsContent>

        {/* N4-B: Job Management */}
        <TabsContent value="management" className="mt-6">
          <GateNJobManagementPanel />
        </TabsContent>

        {/* N4-C: Cron Scheduler */}
        <TabsContent value="scheduler" className="mt-6">
          <CronSchedulerPanel />
        </TabsContent>

        {/* N4-D: Job Dependencies */}
        <TabsContent value="dependencies" className="mt-6">
          <JobDependenciesPanel />
        </TabsContent>

        {/* N5: Activity Monitor (Placeholder) */}
        <TabsContent value="activity" className="mt-6">
          <GateNActivityPanel />
        </TabsContent>

        {/* N6: Alerts Monitor (Placeholder) */}
        <TabsContent value="alerts" className="mt-6">
          <GateNAlertsPanel />
        </TabsContent>

        {/* N7: Health Check */}
        <TabsContent value="health" className="mt-6">
          <GateNHealthCheckPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
