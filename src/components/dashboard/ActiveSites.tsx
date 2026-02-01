import { MapPin, ArrowRight, Users, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveSites } from "@/hooks/useSites";
import type { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";

type ActiveSitesProps = {
  processedClient?: ProcessedClient | null;
};

const ActiveSites = ({ processedClient }: ActiveSitesProps) => {
  const { data: sites, isLoading, error } = useActiveSites();
  const equipmentItems = processedClient?.equipmentItems ?? [];
  const equipmentPreview = equipmentItems.slice(0, 3);
  const remainingEquipment = Math.max(equipmentItems.length - equipmentPreview.length, 0);

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold">Active Sites</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {processedClient ? (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest delivery note</p>
              <h3 className="text-base font-semibold text-foreground">
                {processedClient.clientCompanyName || processedClient.clientName || "Client details pending"}
              </h3>
              <p className="text-sm text-muted-foreground">{processedClient.clientName || "Contact pending"}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {processedClient.siteLocation || processedClient.siteAddress || "Site location pending"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-medium text-accent">
              <FileText className="h-3.5 w-3.5" />
              Delivery report active
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Equipment details
            </p>
            {equipmentItems.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {equipmentPreview.map((item) => (
                  <span
                    key={`${processedClient.id}-${item.itemCode}-${item.description}`}
                    className="rounded-full bg-background px-3 py-1 text-xs text-foreground shadow-sm"
                  >
                    {item.description || item.itemCode || "Item"} · {item.qtyDelivered || "0"}
                  </span>
                ))}
                {remainingEquipment > 0 ? (
                  <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                    +{remainingEquipment} more
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No equipment listed yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load sites</p>
        </div>
      ) : sites && sites.length > 0 ? (
        <div className="grid gap-4">
          {sites.map((site) => (
            <div 
              key={site.id} 
              className="p-4 rounded-lg border border-border hover:border-accent/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{site.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {site.location}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  site.status === "active" 
                    ? "bg-success/10 text-success" 
                    : site.status === "on_hold"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {site.status === "active" ? "Active" : site.status === "on_hold" ? "On Hold" : "Completed"}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-3 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  {site.scaffold_count || 0} scaffolds
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {site.worker_count || 0} workers
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {site.start_date ? "In Progress" : "Planning"}
                  </span>
                </div>
                <Progress value={site.start_date ? 50 : 10} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No active sites yet.</p>
          <p className="text-xs mt-1">Create a site to start tracking operations.</p>
        </div>
      )}
    </div>
  );
};

export default ActiveSites;
