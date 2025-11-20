import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText, TrendingUp } from "lucide-react";

interface ReportsKPIsCardProps {
  kpiSummary?: {
    campaigns_active?: number;
    last_kpi_snapshot_at?: string;
    score_avg?: number;
  };
  reportsSummary?: {
    last_report_generated_at?: string;
    reports_last_7d?: number;
  };
}

export function ReportsKPIsCard({ kpiSummary, reportsSummary }: ReportsKPIsCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Reports & KPIs
        </CardTitle>
        <CardDescription>
          Quick access to performance and awareness analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Snippets */}
        {kpiSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b">
            {kpiSummary.campaigns_active !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {kpiSummary.campaigns_active}
                </div>
                <div className="text-sm text-muted-foreground">Active Campaigns</div>
              </div>
            )}
            {kpiSummary.score_avg !== undefined && kpiSummary.score_avg !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {kpiSummary.score_avg.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
            )}
            {kpiSummary.last_kpi_snapshot_at && (
              <div className="text-center">
                <div className="text-sm font-medium">
                  {new Date(kpiSummary.last_kpi_snapshot_at).toLocaleDateString('en-US')}
                </div>
                <div className="text-sm text-muted-foreground">Last KPI Update</div>
              </div>
            )}
          </div>
        )}

        {/* Reports Snippets */}
        {reportsSummary && (
          <div className="flex items-center justify-between text-sm pb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Last Report: {reportsSummary.last_report_generated_at 
                ? new Date(reportsSummary.last_report_generated_at).toLocaleDateString('en-US')
                : 'None'}</span>
            </div>
            {reportsSummary.reports_last_7d !== undefined && (
              <div className="text-muted-foreground">
                {reportsSummary.reports_last_7d} reports in last 7 days
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/platform/reports")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Open Reports (Gate-F)
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate("/platform/kpis")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Open KPIs (Gate-K)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}