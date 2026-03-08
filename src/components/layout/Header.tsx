import { Bell, Search, User, LogOut, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadAlertCount } from "@/hooks/useAlerts";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const Header = ({ title, subtitle, searchValue, onSearchChange }: HeaderProps) => {
  const { profile, signOut, roles } = useAuth();
  const { data: unreadCount = 0 } = useUnreadAlertCount();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
    <header className="sticky top-0 z-30 border-b border-white/30 bg-background/55 backdrop-blur-xl">
      <div className="flex w-full items-center gap-2 px-4 py-3 pl-16 md:pl-4 sm:px-6">
        {/* Title — hidden when mobile search is open */}
        <div className={`flex-1 min-w-0 ${showMobileSearch ? "hidden sm:block" : "block"}`}>
          {subtitle && (
            <p className="text-xs font-medium text-primary truncate">{subtitle.split(".")[0]}</p>
          )}
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate leading-tight">
            {title}
          </h1>
        </div>

        {/* Mobile search — expands full width */}
        {showMobileSearch && (
          <div className="flex flex-1 items-center gap-2 sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search..."
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-9 rounded-xl border-white/45 bg-card/80 pl-9 shadow-md backdrop-blur-xl"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => { setShowMobileSearch(false); onSearchChange?.(""); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right controls */}
        <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 ${showMobileSearch ? "hidden sm:flex" : "flex"}`}>
          {/* Desktop search */}
          <div className="relative hidden sm:block w-52 lg:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-9 rounded-2xl border-white/45 bg-card/80 pl-9 shadow-md backdrop-blur-xl transition focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl border border-white/45 bg-card/80 shadow-md backdrop-blur-xl hover:bg-muted/70 sm:hidden"
            onClick={() => setShowMobileSearch(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl border border-white/45 bg-card/80 shadow-md backdrop-blur-xl hover:bg-muted/70"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-danger p-0 text-[10px] text-danger-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>

          {/* User pill */}
          <div className="flex items-center gap-2 rounded-xl border border-white/45 bg-card/80 px-2 py-1.5 shadow-md backdrop-blur-xl">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-foreground leading-tight">{profile?.full_name || "User"}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{displayRole}</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-sm">
              <User className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
