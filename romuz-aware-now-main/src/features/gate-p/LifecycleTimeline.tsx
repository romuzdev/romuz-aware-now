import { TenantLifecycleLog } from "@/core/tenancy/integration";
import { Badge } from "@/core/components/ui/badge";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { Skeleton } from "@/core/components/ui/skeleton";
import { ArrowRight, Activity, Zap, Webhook } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface LifecycleTimelineProps {
  events: TenantLifecycleLog[];
  isLoading: boolean;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'edge':
      return <Zap className="h-4 w-4 text-blue-500" />;
    case 'webhook':
      return <Webhook className="h-4 w-4 text-purple-500" />;
    case 'job':
      return <Activity className="h-4 w-4 text-green-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
};

const getTriggerBadge = (triggeredBy: string) => {
  const variants: Record<string, any> = {
    system: "secondary",
    external: "default",
    user: "outline",
  };
  return (
    <Badge variant={variants[triggeredBy] || "outline"} className="text-xs">
      {triggeredBy}
    </Badge>
  );
};

export function LifecycleTimeline({ events, isLoading }: LifecycleTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No lifecycle events yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={event.id}
            className="relative pl-8 pb-4 border-l-2 border-muted last:border-l-0"
          >
            <div className="absolute left-0 -translate-x-1/2 top-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-muted">
                {getSourceIcon(event.trigger_source)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.from_state && event.to_state ? (
                    <>
                      <Badge variant="outline">{event.from_state}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="default">{event.to_state}</Badge>
                    </>
                  ) : (
                    <Badge variant="secondary">Event</Badge>
                  )}
                </div>
                {getTriggerBadge(event.triggered_by)}
              </div>

              <p className="text-sm text-muted-foreground">{event.reason}</p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(event.created_at), 'PPp')}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
