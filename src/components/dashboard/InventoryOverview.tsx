import { Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScaffolds, ScaffoldType } from "@/hooks/useScaffolds";
import { Skeleton } from "@/components/ui/skeleton";

const scaffoldTypeLabels: Record<ScaffoldType, string> = {
  frame: "Frame Scaffolds",
  tube_coupler: "Tube & Coupler",
  mobile: "Mobile Scaffolds",
  suspended: "Suspended Scaffolds",
  cantilever: "Cantilever Scaffolds",
  system: "System Scaffolds",
};

const InventoryOverview = () => {
  const { data: scaffolds, isLoading, error } = useScaffolds();

  // Group scaffolds by type and calculate stats
  const inventoryData = Object.entries(scaffoldTypeLabels).map(([type, label]) => {
    const typeScaffolds = scaffolds?.filter(s => s.scaffold_type === type) || [];
    return {
      type: label,
      quantity: typeScaffolds.length,
      available: typeScaffolds.filter(s => s.status === "available").length,
      inUse: typeScaffolds.filter(s => s.status === "in_use").length,
      damaged: typeScaffolds.filter(s => s.status === "damaged").length,
    };
  }).filter(item => item.quantity > 0);

  // If no data, show empty state with sample structure
  const displayData = inventoryData.length > 0 ? inventoryData : [
    { type: "Frame Scaffolds", quantity: 0, available: 0, inUse: 0, damaged: 0 },
    { type: "Tube & Coupler", quantity: 0, available: 0, inUse: 0, damaged: 0 },
    { type: "Mobile Scaffolds", quantity: 0, available: 0, inUse: 0, damaged: 0 },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Scaffold Inventory</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load inventory data</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Total</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Available</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">In Use</th>
                <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Damaged</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-2">
                    <span className="font-medium text-foreground">{item.type}</span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="text-foreground font-semibold">{item.quantity}</span>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <Badge variant="secondary" className="status-available border">
                      {item.available}
                    </Badge>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <Badge variant="secondary" className="status-in-use border">
                      {item.inUse}
                    </Badge>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <Badge variant="secondary" className="status-damaged border">
                      {item.damaged}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {inventoryData.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No scaffolds registered yet.</p>
              <p className="text-xs mt-1">Add scaffolds to see inventory statistics.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;
