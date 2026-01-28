import { Plus, ClipboardCheck, Wrench, Truck, FileText, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Plus, label: "Add Scaffold", description: "Register new equipment", color: "bg-primary text-primary-foreground hover:bg-primary/90" },
  { icon: ClipboardCheck, label: "New Inspection", description: "Start safety check", color: "bg-success text-success-foreground hover:bg-success/90" },
  { icon: Wrench, label: "Log Maintenance", description: "Record repair work", color: "bg-warning text-warning-foreground hover:bg-warning/90" },
  { icon: Truck, label: "Transfer Stock", description: "Move between sites", color: "bg-accent text-accent-foreground hover:bg-accent/90" },
  { icon: FileText, label: "Generate Report", description: "Create documentation", color: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  { icon: QrCode, label: "Scan QR Code", description: "Quick asset lookup", color: "bg-muted text-foreground hover:bg-muted/80" },
];

const QuickActions = () => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className={`h-auto flex-col py-4 px-3 ${action.color} transition-all`}
          >
            <action.icon className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">{action.label}</span>
            <span className="text-xs opacity-80 mt-1 hidden lg:block">{action.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
