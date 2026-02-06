import { Bell, Search, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadAlertCount } from "@/hooks/useAlerts";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const { profile, signOut, roles } = useAuth();
  const { data: unreadCount = 0 } = useUnreadAlertCount();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Get display role
  const displayRole = roles.includes("admin") 
    ? "Admin" 
    : roles.includes("supervisor") 
    ? "Supervisor" 
    : roles.includes("inspector")
    ? "Inspector"
    : "Worker";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground/90">{subtitle}</p>}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scaffolds, sites..."
              className="h-11 rounded-full border-border/70 bg-card pl-9 shadow-sm transition focus-visible:ring-2"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 self-start rounded-full border border-border/70 bg-card shadow-sm hover:bg-muted sm:self-auto"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-destructive p-0 text-xs text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* User */}
          <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-2 py-1 shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 shadow-sm">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
