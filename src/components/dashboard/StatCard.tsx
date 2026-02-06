import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconBg?: "primary" | "success" | "warning" | "danger" | "accent";
}

const iconBgClasses = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  accent: "bg-accent/15 text-accent",
};

const cardGradientClasses = {
  primary: "from-primary/[0.08] to-white",
  success: "from-success/[0.08] to-white",
  warning: "from-warning/[0.10] to-white",
  danger: "from-danger/[0.08] to-white",
  accent: "from-accent/[0.08] to-white",
};

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  iconBg = "primary"
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "stat-card animate-fade-in bg-gradient-to-br",
        cardGradientClasses[iconBg]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground/90">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "mt-2 text-sm font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-danger",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-2xl border border-white/70 p-3 shadow-sm", iconBgClasses[iconBg])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
