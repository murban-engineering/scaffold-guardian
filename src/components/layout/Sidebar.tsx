import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  ClipboardCheck, 
  Wrench, 
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
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "sites", label: "Sites", icon: MapPin },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "workforce", label: "Workforce", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <HardHat className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">ScaffoldPro</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
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
