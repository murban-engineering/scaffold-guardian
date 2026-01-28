import { Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScaffoldItem {
  id: string;
  type: string;
  quantity: number;
  available: number;
  inUse: number;
  damaged: number;
}

const scaffoldData: ScaffoldItem[] = [
  { id: "1", type: "Frame Scaffolds", quantity: 450, available: 280, inUse: 150, damaged: 20 },
  { id: "2", type: "Tube & Coupler", quantity: 320, available: 180, inUse: 120, damaged: 20 },
  { id: "3", type: "Mobile Scaffolds", quantity: 85, available: 45, inUse: 35, damaged: 5 },
  { id: "4", type: "Suspended Scaffolds", quantity: 40, available: 22, inUse: 15, damaged: 3 },
  { id: "5", type: "Cantilever Scaffolds", quantity: 28, available: 18, inUse: 8, damaged: 2 },
];

const InventoryOverview = () => {
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
            {scaffoldData.map((item) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
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
      </div>
    </div>
  );
};

export default InventoryOverview;
