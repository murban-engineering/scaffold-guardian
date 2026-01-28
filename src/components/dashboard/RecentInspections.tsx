import { ClipboardCheck, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentInspections } from "@/hooks/useInspections";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  passed: { icon: CheckCircle, label: "Passed", className: "status-available" },
  pending: { icon: AlertTriangle, label: "Pending", className: "status-pending" },
  failed: { icon: XCircle, label: "Failed", className: "status-damaged" },
};

const RecentInspections = () => {
  const { data: inspections, isLoading, error } = useRecentInspections(5);

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <ClipboardCheck className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-lg font-semibold">Recent Inspections</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load inspections</p>
        </div>
      ) : inspections && inspections.length > 0 ? (
        <div className="space-y-4">
          {inspections.map((inspection) => {
            const config = statusConfig[inspection.status];
            const StatusIcon = config.icon;
            
            return (
              <div 
                key={inspection.id} 
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg border", config.className)}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {inspection.sites?.name || "Unknown Site"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.profiles?.full_name || "Unknown"} • {inspection.scaffold_count} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className={cn("border", config.className)}>
                    {config.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(inspection.inspection_date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No inspections recorded yet.</p>
          <p className="text-xs mt-1">Start a new inspection to see history here.</p>
        </div>
      )}
    </div>
  );
};

export default RecentInspections;
