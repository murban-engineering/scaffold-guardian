import { Plus, Wrench, Truck, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Plus, label: "Add Scaffold", description: "Register new equipment", color: "bg-primary text-primary-foreground hover:bg-primary/90", href: "/add-scaffold" },
  {
    icon: Wrench,
    label: "Log Maintenance",
    description: "Record repair work",
    color: "bg-warning text-warning-foreground hover:bg-warning/90",
    href: "/maintenance-logs",
  },
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
    <div className="animate-fade-in rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className={`h-auto flex-col rounded-xl px-3 py-4 shadow-sm transition-all hover:-translate-y-0.5 ${action.color}`}
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
