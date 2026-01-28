import { ClipboardCheck, ArrowRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Inspection {
  id: string;
  site: string;
  inspector: string;
  date: string;
  status: "passed" | "pending" | "failed";
  items: number;
}

const inspections: Inspection[] = [
  { id: "INS-001", site: "Kilimani Tower", inspector: "David Ochieng", date: "2 hours ago", status: "passed", items: 24 },
  { id: "INS-002", site: "Westlands Mall", inspector: "Sarah Wanjiku", date: "5 hours ago", status: "pending", items: 18 },
  { id: "INS-003", site: "Karen Office Park", inspector: "Peter Kamau", date: "Yesterday", status: "passed", items: 32 },
  { id: "INS-004", site: "Industrial Area Depot", inspector: "Grace Muthoni", date: "Yesterday", status: "failed", items: 15 },
  { id: "INS-005", site: "Nairobi CBD Complex", inspector: "James Kipchoge", date: "2 days ago", status: "passed", items: 28 },
];

const statusConfig = {
  passed: { icon: CheckCircle, label: "Passed", className: "status-available" },
  pending: { icon: AlertTriangle, label: "Pending", className: "status-pending" },
  failed: { icon: XCircle, label: "Failed", className: "status-damaged" },
};

const RecentInspections = () => {
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
                  <p className="font-medium text-foreground">{inspection.site}</p>
                  <p className="text-sm text-muted-foreground">
                    {inspection.inspector} • {inspection.items} items
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className={cn("border", config.className)}>
                  {config.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{inspection.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentInspections;
