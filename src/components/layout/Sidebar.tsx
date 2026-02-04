import {
  LayoutDashboard,
  Package,
  FolderClock,
  MapPin,
  Users,
  Settings,
  LogOut,
  ClipboardCheck,
  Menu,
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
  { id: "sites", label: "Sites", icon: MapPin },
  { id: "maintenance", label: "Maintenance Logs", icon: ClipboardCheck },
  { id: "workforce", label: "Workforce", icon: Users },
];

const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <img 
            src={otnLogo} 
            alt="OTN Logo" 
            className="w-28 h-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleItemClick(item.id, closeOnSelect)}
                className={cn(
                  "sidebar-item w-full",
                  activeItem === item.id && "sidebar-item-active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          className={cn(
            "sidebar-item w-full mb-2",
            activeItem === "settings" && "sidebar-item-active"
          )}
          onClick={() => handleItemClick("settings", closeOnSelect)}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button
          className="sidebar-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          type="button"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
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
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground shadow-2xl">
        <aside className="flex h-full flex-col">{sidebarContent(true)}</aside>
      </SheetContent>
    </Sheet>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-sidebar-border/70 bg-sidebar shadow-xl md:flex">
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default Sidebar;
