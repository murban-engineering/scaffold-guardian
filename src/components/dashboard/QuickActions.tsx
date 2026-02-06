import { Plus, Wrench, Truck, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const actions = [
  { icon: Plus, label: "Add Scaffold", description: "Register new equipment", color: "text-primary", href: "/add-scaffold" },
  {
    icon: Wrench,
    label: "Log Maintenance",
    description: "Record repair work",
    color: "text-warning",
    href: "/maintenance-logs",
  },
  { icon: Truck, label: "Transfer Stock", description: "Move between sites", color: "text-accent" },
  {
    icon: FileText,
    label: "Generate Report",
    description: "Create documentation",
    color: "text-foreground",
    href: "/sites",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="h-auto flex-col items-start rounded-2xl border border-border/70 bg-background px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => {
              if (action.href) {
                navigate(action.href);
              }
            }}
          >
            <div className={`mb-3 rounded-xl bg-muted p-2 ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">{action.label}</span>
            <span className="mt-1 text-xs text-muted-foreground">{action.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
