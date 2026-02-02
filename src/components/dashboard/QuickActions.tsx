import { Plus, Wrench, Truck, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Plus, label: "Add Scaffold", description: "Register new equipment", color: "bg-primary text-primary-foreground hover:bg-primary/90", href: "/add-scaffold" },
  { icon: Wrench, label: "Log Maintenance", description: "Record repair work", color: "bg-warning text-warning-foreground hover:bg-warning/90" },
  { icon: Truck, label: "Transfer Stock", description: "Move between sites", color: "bg-accent text-accent-foreground hover:bg-accent/90" },
  {
    icon: FileText,
    label: "Generate Report",
    description: "Create documentation",
    color: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    href: "/sites",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className={`h-auto flex-col py-4 px-3 ${action.color} transition-all`}
            onClick={() => {
              if (action.href) {
                navigate(action.href);
              }
            }}
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
