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

  const displayRole = roles.includes("admin")
    ? "Admin"
    : roles.includes("supervisor")
    ? "Supervisor"
    : roles.includes("inspector")
    ? "Inspector"
    : "Worker";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-0.5">
          {subtitle && <p className="text-sm font-medium text-primary">{subtitle.split('.')[0]}</p>}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-10 rounded-xl border-border/60 bg-card pl-9 shadow-sm transition focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 self-start rounded-xl border border-border/60 bg-card shadow-sm hover:bg-muted sm:self-auto"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-danger p-0 text-xs text-danger-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* User */}
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-1.5 shadow-sm">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{displayRole}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;