import {
  LayoutGrid,
  PackageSearch,
  FolderClock,
  MapPinned,
  UsersRound,
  SlidersHorizontal,
  LogOut,
  ClipboardCheck,
  Receipt,
  ClipboardPenLine,
  ClipboardList,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  BotMessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import otnLogoBlack from "@/assets/otno-logo-black.png";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  processedClient?: ProcessedClient | null;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "inventory", label: "Inventory", icon: PackageSearch },
  { id: "accounting", label: "Accounting", icon: Receipt },
  { id: "previous-clients", label: "Client Report", icon: FolderClock },
  { id: "site-master-plan", label: "Site Master Plan", icon: ClipboardPenLine },
  { id: "item-tracking", label: "Item Tracking", icon: ClipboardList },
  { id: "otnoai", label: "OTNOAI", icon: BotMessageSquare },
  { id: "sites", label: "Sites", icon: MapPinned },
  { id: "maintenance", label: "Maintenance Logs", icon: ClipboardCheck },
  { id: "workforce", label: "Workforce", icon: UsersRound },
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
    if (item === "item-tracking") {
      navigate("/item-tracking");
    } else {
      onItemClick(item);
    }

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
              src={otnLogoBlack}
              alt="OTNO Logo"
              className={cn("h-auto object-contain transition-all", collapsed && !closeOnSelect ? "w-12" : "w-32")}
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
           <SlidersHorizontal className="h-5 w-5 shrink-0" />
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
         <a
           href="https://nyotaai.vercel.app/"
           target="_blank"
           rel="noreferrer"
           className={cn(
             "sidebar-item w-full text-muted-foreground hover:text-primary hover:bg-muted/50 mt-2 text-xs",
             collapsed && !closeOnSelect && "justify-center px-2"
           )}
           title={collapsed && !closeOnSelect ? "Powered by NYOTAI" : undefined}
         >
           <span className={cn("font-medium", collapsed && !closeOnSelect && "hidden")}>Powered by NYOTAI</span>
         </a>
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
          className="border border-white/40 bg-card/85 shadow-lg backdrop-blur-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 rounded-r-3xl border-r border-white/40 bg-sidebar/90 p-0 text-foreground shadow-2xl backdrop-blur-xl">
          <aside className="flex h-full flex-col">{sidebarContent(true)}</aside>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/40 bg-sidebar/90 shadow-lg backdrop-blur-xl transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
};

export default Sidebar;
