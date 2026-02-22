import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useHireQuotations } from "@/hooks/useHireQuotations";

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "On Track", className: "bg-success/15 text-success" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning" },
  rejected: { label: "Delayed", className: "bg-destructive/15 text-destructive" },
  completed: { label: "Completed", className: "bg-primary/15 text-primary" },
};

const getProgress = (status: string): number => {
  switch (status) {
    case "completed": return 100;
    case "approved": return 65;
    case "pending": return 35;
    case "draft": return 15;
    case "rejected": return 45;
    default: return 10;
  }
};

const ActiveClients = () => {
  const { data: quotations = [], isLoading } = useHireQuotations();

  const clients = quotations
    .filter((q) => q.company_name || q.site_manager_name)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Active Clients</h2>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent text-xs">
          View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No clients yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const cfg = statusConfig[client.status] ?? statusConfig.draft;
            const progress = getProgress(client.status);
            const name = client.company_name || client.site_manager_name || "Unnamed";
            const site = client.site_name || client.site_address || "—";
            const qNum = client.quotation_number;

            return (
              <div
                key={client.id}
                className="rounded-lg border border-border p-4 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">{name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>
                <Progress value={progress} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progress}% complete</span>
                  <span>{qNum} · {site}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveClients;
