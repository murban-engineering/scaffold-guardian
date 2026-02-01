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
import { useHireQuotations } from "@/hooks/useHireQuotations";
import type { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  processedClient?: ProcessedClient | null;
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
  const { data: hireQuotations, isLoading: hireQuotationsLoading } = useHireQuotations();
  const equipmentItems = processedClient?.equipmentItems ?? [];
  const equipmentPreview = equipmentItems.slice(0, 4);
  const remainingEquipment = Math.max(equipmentItems.length - equipmentPreview.length, 0);
  const processedDate = processedClient?.processedAt
    ? new Date(processedClient.processedAt).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const activeQuotations = (hireQuotations ?? []).filter((quotation) => {
    const status = quotation.status?.toLowerCase?.() ?? "";
    return status === "active" || status === "pending";
  });

  const formatQuotationDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
              {item.id === "sites" ? (
                <div className="mt-2 space-y-3 rounded-lg border border-sidebar-border bg-sidebar-accent/10 px-3 py-2 text-xs text-sidebar-foreground/80">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                      Active & pending quotations
                    </p>
                    {hireQuotationsLoading ? (
                      <p className="mt-1 text-sidebar-foreground/60">Loading quotations...</p>
                    ) : activeQuotations.length ? (
                      <div className="mt-2 space-y-2">
                        {activeQuotations.slice(0, 3).map((quotation) => {
                          const savedDate = formatQuotationDate(quotation.created_at);
                          const displayStatus = quotation.status || "pending";

                          return (
                            <div key={quotation.id} className="space-y-1 rounded-md border border-sidebar-border/60 bg-sidebar/20 px-2 py-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-sidebar-foreground">
                                  {quotation.company_name || quotation.site_manager_name || "Client pending"}
                                </p>
                                <span className="rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sidebar-primary">
                                  {displayStatus}
                                </span>
                              </div>
                              <p className="text-sidebar-foreground/70">
                                {quotation.site_name || "Site name pending"}
                              </p>
                              <p className="text-sidebar-foreground/60">
                                {savedDate ? `Saved ${savedDate}` : "Date pending"}
                              </p>
                            </div>
                          );
                        })}
                        {activeQuotations.length > 3 ? (
                          <p className="text-[11px] text-sidebar-foreground/60">
                            +{activeQuotations.length - 3} more quotations
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-sidebar-foreground/60">No active or pending quotations yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                      Latest client processed
                    </p>
                    {processedClient ? (
                      <>
                        <p className="mt-1 font-semibold text-sidebar-foreground">
                          {processedClient.clientCompanyName || processedClient.clientName}
                        </p>
                        <p className="text-sidebar-foreground/70">
                          {processedClient.clientName || "Contact pending"}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sidebar-foreground/60">No recent client processed yet.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                      Site details
                    </p>
                    {processedClient ? (
                      <>
                        <p className="text-sidebar-foreground/70">
                          {processedClient.siteName || "Site name pending"}
                        </p>
                        <p className="text-sidebar-foreground/70">
                          {processedClient.siteLocation || processedClient.siteAddress || "Location pending"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sidebar-foreground/60">Site details will appear after processing a client.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                      Equipment taken
                    </p>
                    {processedClient && equipmentItems.length ? (
                      <div className="mt-1 space-y-1 text-sidebar-foreground/80">
                        {equipmentPreview.map((item, index) => (
                          <p key={`${processedClient.id}-${item.itemCode}-${index}`}>
                            {item.description || item.itemCode || "Item"} · {item.qtyDelivered || "0"}
                          </p>
                        ))}
                        {remainingEquipment > 0 ? (
                          <p className="text-sidebar-foreground/60">+{remainingEquipment} more items</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-1 text-sidebar-foreground/60">No equipment listed yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
              {item.id === "reports" && processedClient ? (
                <div className="mt-2 space-y-2 rounded-lg border border-sidebar-border bg-sidebar-accent/10 px-3 py-2 text-xs text-sidebar-foreground/80">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                      Client reports
                    </p>
                    <p className="mt-1 font-semibold text-sidebar-foreground">
                      Hire quotation {processedClient.id}
                    </p>
                    {processedDate ? (
                      <p className="text-sidebar-foreground/60">Generated {processedDate}</p>
                    ) : null}
                  </div>
                  <ul className="space-y-1 text-sidebar-foreground/80">
                    <li>Hire quotation report</li>
                    <li>Delivery note</li>
                    <li>Quotation calculation summary</li>
                  </ul>
                </div>
              ) : null}
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
          onClick={() => onItemClick("settings")}
        >
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
