import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  Users, 
  Bell, 
  BarChart3,
  Settings,
  HardHat,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  processedClient?: {
    clientCompanyName: string;
    clientName: string;
    siteName: string;
    siteLocation: string;
    siteAddress: string;
    equipmentSummary: string;
  } | null;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "sites", label: "Sites", icon: MapPin },
  { id: "workforce", label: "Workforce", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const Sidebar = ({ activeItem, onItemClick, processedClient }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <HardHat className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">OTNO Access</h1>
            <p className="text-xs text-sidebar-foreground/60">Africa</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "sidebar-item w-full",
                  activeItem === item.id && "sidebar-item-active"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
              {item.id === "sites" && processedClient ? (
                <div className="mt-2 rounded-lg border border-sidebar-border bg-sidebar-accent/10 px-3 py-2 text-xs text-sidebar-foreground/80">
                  <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                    Latest client processed
                  </p>
                  <p className="mt-1 font-semibold text-sidebar-foreground">
                    {processedClient.clientCompanyName || processedClient.clientName}
                  </p>
                  <p className="text-sidebar-foreground/70">
                    {processedClient.siteName}
                  </p>
                  <p className="text-sidebar-foreground/70">
                    {processedClient.siteLocation || processedClient.siteAddress || "Location pending"}
                  </p>
                  <p className="mt-1 text-sidebar-foreground/70">
                    {processedClient.equipmentSummary}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="sidebar-item w-full mb-2">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button className="sidebar-item w-full text-destructive/80 hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
