import {
  LayoutDashboard,
  Package,
  FolderClock,
  MapPin,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  ReceiptText,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import otnLogo from "@/assets/otn-logo.png";
import type { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  processedClient?: ProcessedClient | null;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "previous-clients", label: "Previous Clients", icon: FolderClock },
  { id: "accounting", label: "Accounting", icon: ReceiptText },
  { id: "otnoai", label: "OTNOAI", icon: Bot },
  { id: "sites", label: "Sites", icon: MapPin },
  { id: "maintenance", label: "Maintenance Logs", icon: ClipboardCheck },
  { id: "workforce", label: "Workforce", icon: Users },
];

const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole("admin");
  const visibleMenuItems = isAdmin
    ? menuItems
    : menuItems.filter((item) => item.id !== "workforce");

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleItemClick = (item: string, closeMobile = false) => {
    onItemClick(item);
    if (closeMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (closeOnSelect: boolean) => (
    <>
      {/* Logo */}
      <div className="border-b border-sidebar-border p-5">
        <div className={cn("flex items-center", collapsed && !closeOnSelect ? "justify-center" : "justify-between")}>
          <img
            src={otnLogo}
            alt="OTN Logo"
            className={cn("h-auto object-contain transition-all", collapsed && !closeOnSelect ? "w-10" : "w-24")}
          />
          {!closeOnSelect && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleItemClick(item.id, closeOnSelect)}
                className={cn(
                  "sidebar-item w-full",
                  collapsed && !closeOnSelect && "justify-center px-2",
                  activeItem === item.id && "sidebar-item-active"
                )}
                title={collapsed && !closeOnSelect ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn("font-medium", collapsed && !closeOnSelect && "hidden")}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-3">
        <button
          className={cn(
            "sidebar-item w-full mb-1",
            collapsed && !closeOnSelect && "justify-center px-2",
            activeItem === "settings" && "sidebar-item-active"
          )}
          onClick={() => handleItemClick("settings", closeOnSelect)}
          title={collapsed && !closeOnSelect ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className={cn("font-medium", collapsed && !closeOnSelect && "hidden")}>Settings</span>
        </button>
        <button
          className={cn(
            "sidebar-item w-full text-danger/70 hover:bg-danger/10 hover:text-danger",
            collapsed && !closeOnSelect && "justify-center px-2"
          )}
          onClick={handleLogout}
          type="button"
          title={collapsed && !closeOnSelect ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn("font-medium", collapsed && !closeOnSelect && "hidden")}>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="bg-card shadow-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-card p-0 text-foreground shadow-2xl">
          <aside className="flex h-full flex-col">{sidebarContent(true)}</aside>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar shadow-sm transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default Sidebar;