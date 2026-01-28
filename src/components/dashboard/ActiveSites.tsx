import { MapPin, ArrowRight, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Site {
  id: string;
  name: string;
  location: string;
  scaffolds: number;
  workers: number;
  progress: number;
  status: "active" | "on-hold" | "completed";
}

const sites: Site[] = [
  { id: "1", name: "Kilimani Tower Project", location: "Kilimani, Nairobi", scaffolds: 120, workers: 45, progress: 68, status: "active" },
  { id: "2", name: "Westlands Commercial Center", location: "Westlands, Nairobi", scaffolds: 85, workers: 32, progress: 42, status: "active" },
  { id: "3", name: "Karen Office Park", location: "Karen, Nairobi", scaffolds: 65, workers: 28, progress: 85, status: "active" },
  { id: "4", name: "Industrial Area Warehouse", location: "Industrial Area", scaffolds: 40, workers: 18, progress: 25, status: "on-hold" },
];

const ActiveSites = () => {
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
                  : site.status === "on-hold"
                  ? "bg-warning/10 text-warning"
                  : "bg-muted text-muted-foreground"
              }`}>
                {site.status === "active" ? "Active" : site.status === "on-hold" ? "On Hold" : "Completed"}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-3 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Package className="w-4 h-4" />
                {site.scaffolds} scaffolds
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                {site.workers} workers
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{site.progress}%</span>
              </div>
              <Progress value={site.progress} className="h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveSites;
