import { Bell, AlertTriangle, Clock, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const alertTypeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  "inspection-due": { icon: Clock, color: "text-warning bg-warning/10" },
  "maintenance": { icon: Wrench, color: "text-accent bg-accent/10" },
  "safety": { icon: AlertTriangle, color: "text-danger bg-danger/10" },
  "expiry": { icon: Bell, color: "text-muted-foreground bg-muted" },
};

const priorityColors: Record<string, string> = {
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-muted-foreground",
};

const AlertsWidget = () => {
  const { data: alerts, isLoading, error } = useAlerts();

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Bell className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alerts & Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {alerts?.filter(a => !a.is_read).length || 0} pending actions
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load alerts</p>
        </div>
      ) : alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = alertTypeConfig[alert.type] || alertTypeConfig["expiry"];
            const Icon = config.icon;
            
            return (
              <div 
                key={alert.id} 
                className={cn(
                  "p-4 rounded-lg bg-muted/30 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                  priorityColors[alert.priority] || priorityColors["medium"]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No alerts at this time.</p>
          <p className="text-xs mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default AlertsWidget;
