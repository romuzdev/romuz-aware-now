import { useState } from "react";
import { format } from "date-fns";
import { Plus, MessageSquare, TrendingUp, FileText, CheckCircle, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import type { GateHActionItem, GateHActionUpdate } from "@/modules/actions";
import { AddUpdateDialog } from "./AddUpdateDialog";

interface ActionTimelineProps {
  action: GateHActionItem;
  updates: GateHActionUpdate[];
}

export function ActionTimeline({ action, updates }: ActionTimelineProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-4 w-4" />;
      case "progress":
        return <TrendingUp className="h-4 w-4" />;
      case "evidence":
        return <FileText className="h-4 w-4" />;
      case "status_change":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case "comment":
        return "Comment";
      case "progress":
        return "Progress Update";
      case "evidence":
        return "Evidence";
      case "status_change":
        return "Status Change";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Timeline & Updates</CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Update
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {updates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No updates yet</p>
            <p className="text-sm mt-2">Start by adding the first update to this action</p>
          </div>
        ) : (
          <div className="space-y-6">
            {updates.map((update, idx) => (
              <div key={update.id} className="relative">
                {/* Timeline Line */}
                {idx < updates.length - 1 && (
                  <div className="absolute top-10 left-[15px] w-0.5 h-[calc(100%+1.5rem)] bg-border" />
                )}

                {/* Update Item */}
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      {getUpdateIcon(update.update_type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {getUpdateTypeLabel(update.update_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(update.created_at), "PPp")}
                      </span>
                    </div>

                    {/* Body */}
                    {update.body_ar && (
                      <p className="text-sm">{update.body_ar}</p>
                    )}

                    {/* Progress */}
                    {update.progress_pct !== null && update.progress_pct !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Progress:</span>
                        <Badge>{update.progress_pct}%</Badge>
                      </div>
                    )}

                    {/* Status Change */}
                    {update.new_status && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">New Status:</span>
                        <Badge>
                          {update.new_status === "new" && "New"}
                          {update.new_status === "in_progress" && "In Progress"}
                          {update.new_status === "blocked" && "Blocked"}
                          {update.new_status === "verify" && "Verified"}
                          {update.new_status === "closed" && "Closed"}
                        </Badge>
                      </div>
                    )}

                    {/* Evidence URL */}
                    {update.evidence_url && (
                      <a
                        href={update.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        View Evidence
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AddUpdateDialog
        actionId={action.id}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </Card>
  );
}
