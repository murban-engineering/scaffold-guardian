import { Bell, AlertTriangle, Clock, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "inspection-due" | "maintenance" | "safety" | "expiry";
  title: string;
  description: string;
  time: string;
  priority: "high" | "medium" | "low";
}

const alerts: Alert[] = [
  { 
    id: "1", 
    type: "safety", 
    title: "Safety Compliance Issue", 
    description: "Kilimani Tower - Section B requires immediate inspection",
    time: "10 mins ago",
    priority: "high"
  },
  { 
    id: "2", 
    type: "inspection-due", 
    title: "Inspection Due Tomorrow", 
    description: "Westlands Mall - Monthly inspection scheduled",
    time: "1 hour ago",
    priority: "medium"
  },
  { 
    id: "3", 
    type: "maintenance", 
    title: "Maintenance Required", 
    description: "15 frame scaffolds require routine maintenance",
    time: "3 hours ago",
    priority: "medium"
  },
  { 
    id: "4", 
    type: "expiry", 
    title: "Certification Expiring", 
    description: "3 workers' certifications expire in 7 days",
    time: "Today",
    priority: "low"
  },
];

const alertTypeConfig = {
  "inspection-due": { icon: Clock, color: "text-warning bg-warning/10" },
  "maintenance": { icon: Wrench, color: "text-accent bg-accent/10" },
  "safety": { icon: AlertTriangle, color: "text-danger bg-danger/10" },
  "expiry": { icon: Bell, color: "text-muted-foreground bg-muted" },
};

const priorityColors = {
  high: "border-l-danger",
  medium: "border-l-warning",
  low: "border-l-muted-foreground",
};

const AlertsWidget = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Bell className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alerts & Notifications</h2>
            <p className="text-sm text-muted-foreground">{alerts.length} pending actions</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = alertTypeConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={alert.id} 
              className={cn(
                "p-4 rounded-lg bg-muted/30 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer",
                priorityColors[alert.priority]
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-foreground text-sm">{alert.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
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
    </div>
  );
};

export default AlertsWidget;
