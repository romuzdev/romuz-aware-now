import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip";

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdateTime?: Date | null;
}

export function RealtimeIndicator({ isConnected, lastUpdateTime }: RealtimeIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (lastUpdateTime) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTime]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isConnected ? "secondary" : "outline"}
            className="gap-1.5 cursor-help"
          >
            {isConnected ? (
              <>
                <Wifi className={`h-3 w-3 ${showPulse ? "animate-pulse text-green-500" : ""}`} />
                <span className="text-xs">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">Disconnected</span>
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isConnected
              ? lastUpdateTime
                ? `Last update: ${lastUpdateTime.toLocaleTimeString("en-US")}`
                : "Real-time updates active"
              : "Real-time updates disconnected"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
