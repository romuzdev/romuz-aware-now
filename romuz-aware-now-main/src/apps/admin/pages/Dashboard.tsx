// TODO: Future modules (M23, campaigns, etc.) will plug into this dashboard page.

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Romuz Awareness – Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome to the central admin dashboard for managing awareness campaigns,
          policies, and system health.
        </p>
      </div>

      {/* Placeholder Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Policies Overview Card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Policies Overview
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coming soon – manage and monitor awareness policies.
          </p>
        </div>

        {/* Awareness Campaigns Card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Awareness Campaigns
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coming soon – create and track awareness campaigns.
          </p>
        </div>

        {/* Health & Audit Status Card */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Health & Audit Status
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coming soon – system health monitoring and audit logs.
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This is a D1-Part1 placeholder dashboard. Full
          functionality including RBAC, multi-tenancy, and module integration will
          be added in subsequent parts.
        </p>
      </div>
    </div>
  );
}
