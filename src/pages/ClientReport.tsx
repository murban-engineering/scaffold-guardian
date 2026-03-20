import { useState, useMemo } from "react";
import { FileText, ChevronDown, ChevronRight, Printer, FileBarChart2, Truck, RotateCcw, ClipboardList, Search, ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { useClientSites } from "@/hooks/useClientSites";
import type { DeliveryRecord } from "@/components/dashboard/DeliveryHistorySection";
import type { ReturnRecord } from "@/components/dashboard/ReturnHistorySection";
import {
  generateDeliveryNotePDF,
  generateHireLoadingNotePDF,
  generateHireReturnNotePDF,
  generateHireQuotationReportPDF,
  DeliveryNoteData,
  HireLoadingNoteData,
  HireReturnNoteData,
  HireQuotationReportData,
} from "@/lib/pdfGenerator";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":    return "bg-success/10 text-success border-success/20";
    case "dispatched": return "bg-primary/10 text-primary border-primary/20";
    case "completed": return "bg-muted text-muted-foreground";
    default:          return "bg-warning/10 text-warning border-warning/20";
  }
};

const parseHistory = <T,>(raw: unknown): T[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.deliveryHistory)) return obj.deliveryHistory as T[];
    if (Array.isArray(obj.returnHistory))   return obj.returnHistory   as T[];
  }
  return [];
};

// ── Client-sites badge row ─────────────────────────────────────────────────────

const ClientSitesBadges = ({ quotationId }: { quotationId: string }) => {
  const { data: sites } = useClientSites(quotationId);
  if (!sites?.length) return <span className="text-xs text-muted-foreground">No sites</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {sites.map((site) => (
        <Badge key={site.id} variant="outline" className="font-mono text-xs">
          {site.site_number} — {site.site_name}
        </Badge>
      ))}
    </div>
  );
};

// ── Print helpers ──────────────────────────────────────────────────────────────

const getPdfFields = (q: HireQuotation) => ({
  companyAddress:    q.company_address  ?? undefined,
  companyCityTown:   q.city_town        ?? undefined,
  companyTel:        q.company_tel      ?? undefined,
  companyFax:        q.company_fax      ?? undefined,
  companyEmail:      q.site_manager_email ?? undefined,
  companyPinNumber:  q.pin_number        ?? undefined,
  companyRegNumber:  q.company_reg_number ?? undefined,
});

const printHireQuotation = (q: HireQuotation) => {
  if (!q.line_items?.length) { toast.error("No line items found for this quotation."); return; }
  const data: HireQuotationReportData = {
    quotationNumber: q.quotation_number, dateCreated: formatDate(q.created_at),
    companyName: q.company_name ?? "", ...getPdfFields(q),
    siteName: q.site_name ?? "", siteLocation: "", siteAddress: q.site_address ?? "",
    contactName: q.site_manager_name ?? "", contactPhone: q.site_manager_phone ?? "",
    contactEmail: q.site_manager_email ?? "", officeTel: "", officeEmail: "",
    createdBy: q.created_by, discountRate: q.tonnage_discount ?? 0,
    clientId: q.client_id ?? undefined,
    items: q.line_items.map((li) => ({
      partNumber: li.part_number, description: li.description, quantity: li.quantity,
      warehouseAvailableQty: 0, massPerItem: li.mass_per_item, weeklyRate: li.weekly_rate,
      weeklyTotal: li.weekly_total ?? 0, discountRate: li.hire_discount ?? 0,
    })),
  };
  generateHireQuotationReportPDF(data);
  toast.success("Hire Quotation report opened for printing");
};

const printDeliveryNote = (q: HireQuotation, delivery: DeliveryRecord) => {
  const data: DeliveryNoteData = {
    quotationNumber: q.quotation_number, deliveryNoteNumber: delivery.deliveryNoteNumber,
    dateCreated: formatDate(q.created_at), deliveryDate: delivery.deliveryDate,
    dispatchDate: delivery.deliveryDate || q.dispatch_date || "",
    hireStartDate: delivery.hireStartDate ?? "", companyName: q.company_name ?? "",
    ...getPdfFields(q), siteName: q.site_name ?? "", siteAddress: q.site_address ?? "",
    contactName: q.site_manager_name ?? "", contactPhone: q.site_manager_phone ?? "",
    deliveredBy: delivery.deliveredBy, receivedBy: delivery.receivedBy,
    vehicleNo: delivery.vehicleNo, remarks: "", createdBy: q.created_by,
    clientId: q.client_id ?? undefined,
    items: delivery.items.map((item) => ({
      partNumber: item.itemCode, description: item.description,
      balanceQuantity: item.balanceAfter, quantity: item.quantityDelivered,
      massPerItem: item.massPerItem ?? 0, totalMass: item.totalMass ?? 0,
    })),
  };
  generateDeliveryNotePDF(data);
  toast.success("Delivery note opened for printing");
};

const printLoadingNote = (q: HireQuotation, delivery: DeliveryRecord) => {
  const data: HireLoadingNoteData = {
    quotationNumber: q.quotation_number, dateCreated: formatDate(q.created_at),
    dispatchDate: delivery.deliveryDate || q.dispatch_date || "",
    companyName: q.company_name ?? "", ...getPdfFields(q),
    siteName: q.site_name ?? "", siteLocation: "", siteAddress: q.site_address ?? "",
    contactName: q.site_manager_name ?? "", contactPhone: q.site_manager_phone ?? "",
    createdBy: q.created_by, clientId: q.client_id ?? undefined,
    noteTitle: "Hire Loading Report",
    items: delivery.items.map((item) => ({
      partNumber: item.itemCode, description: item.description,
      quantity: item.quantityDelivered, massPerItem: item.massPerItem ?? 0,
      totalMass: item.totalMass ?? 0,
    })),
  };
  generateHireLoadingNotePDF(data);
  toast.success("Loading note opened for printing");
};

const printReturnNote = (q: HireQuotation, record: ReturnRecord) => {
  const data: HireReturnNoteData = {
    quotationNumber: q.quotation_number, returnNoteNumber: record.returnNoteNumber,
    dateCreated: formatDate(q.created_at), returnDate: record.returnDate,
    hireEndDate: record.hireEndDate || record.returnDate,
    companyName: q.company_name ?? "", ...getPdfFields(q),
    siteName: q.site_name ?? "", siteLocation: "", siteAddress: q.site_address ?? "",
    contactName: q.site_manager_name ?? "", contactPhone: q.site_manager_phone ?? "",
    contactEmail: q.site_manager_email ?? "", officeTel: "", officeEmail: "",
    returnedBy: record.returnedBy, receivedBy: record.receivedBy,
    vehicleNo: record.vehicleNo, remarks: "", createdBy: q.created_by,
    clientId: q.client_id ?? undefined,
    items: record.items.map((item) => ({
      partNumber: item.itemCode, description: item.description, totalDelivered: 0,
      good: item.good, dirty: item.dirty, damaged: item.damaged, scrap: item.scrap,
      totalReturned: item.totalReturned, balanceAfter: item.balanceAfter,
      massPerItem: item.massPerItem, totalMass: item.totalMass,
    })),
  };
  generateHireReturnNotePDF(data);
  toast.success("Return note opened for printing");
};

// ── Delivery batch row ─────────────────────────────────────────────────────────

const DeliveryBatchRow = ({ q, delivery, index }: { q: HireQuotation; delivery: DeliveryRecord; index: number }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold font-mono text-foreground">{delivery.deliveryNoteNumber}</span>
        <Badge variant="outline" className="text-xs capitalize py-0">{delivery.status}</Badge>
        {index === 0 && <Badge variant="secondary" className="text-xs py-0">Latest</Badge>}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatDate(delivery.deliveryDate)}
        {delivery.deliveredBy ? ` · ${delivery.deliveredBy}` : ""}
        {delivery.vehicleNo ? ` · ${delivery.vehicleNo}` : ""}
      </p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={() => printLoadingNote(q, delivery)}>
        <Printer className="h-3 w-3" /> LN
      </Button>
      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={() => printDeliveryNote(q, delivery)}>
        <Printer className="h-3 w-3" /> DN
      </Button>
    </div>
  </div>
);

// ── Return batch row ───────────────────────────────────────────────────────────

const ReturnBatchRow = ({ q, record, index }: { q: HireQuotation; record: ReturnRecord; index: number }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold font-mono text-foreground">{record.returnNoteNumber}</span>
        <Badge variant="outline" className="text-xs capitalize py-0">{record.status}</Badge>
        {index === 0 && <Badge variant="secondary" className="text-xs py-0">Latest</Badge>}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatDate(record.returnDate)}
        {record.returnedBy ? ` · ${record.returnedBy}` : ""}
      </p>
    </div>
    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 shrink-0" onClick={() => printReturnNote(q, record)}>
      <Printer className="h-3 w-3" /> Return Note
    </Button>
  </div>
);

// ── Collapsible report section ─────────────────────────────────────────────────

type ReportSection = "hire-quotation" | "hire-loading" | "hire-delivery" | "hire-return";

const SECTION_META: Record<ReportSection, { label: string; icon: React.ElementType; description: string }> = {
  "hire-quotation": { label: "Hire Quotation", icon: ClipboardList, description: "Print the original hire quotation document" },
  "hire-loading":   { label: "Hire Loading",   icon: Truck,         description: "Loading notes for each delivery batch" },
  "hire-delivery":  { label: "Hire Delivery",  icon: FileText,      description: "Delivery notes for each delivery batch" },
  "hire-return":    { label: "Hire Return",    icon: RotateCcw,     description: "Return notes for each return batch" },
};

const ReportSectionBlock = ({ section, q, deliveries, returns }: {
  section: ReportSection; q: HireQuotation; deliveries: DeliveryRecord[]; returns: ReturnRecord[];
}) => {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[section];
  const Icon = meta.icon;
  const hasItems = section === "hire-quotation" ? !!(q.line_items?.length)
    : section === "hire-loading" || section === "hire-delivery" ? deliveries.length > 0
    : returns.length > 0;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-background hover:bg-muted/40 transition-colors text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-1.5 rounded-md ${hasItems ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`h-3.5 w-3.5 ${hasItems ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{meta.label}</p>
            {!open && <p className="text-xs text-muted-foreground truncate">{meta.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {!hasItems && <span className="text-xs text-muted-foreground">No records</span>}
          {hasItems && (
            <span className="text-xs text-muted-foreground">
              {section === "hire-quotation" ? "1 doc" :
               section === "hire-loading" || section === "hire-delivery" ? `${deliveries.length} batch${deliveries.length > 1 ? "es" : ""}` :
               `${returns.length} batch${returns.length > 1 ? "es" : ""}`}
            </span>
          )}
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-3.5 py-3 bg-muted/10 space-y-2">
          {section === "hire-quotation" && (hasItems ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">{q.quotation_number}</p>
                <p className="text-xs text-muted-foreground">Created {formatDate(q.created_at)}</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 shrink-0" onClick={() => printHireQuotation(q)}>
                <Printer className="h-3 w-3" /> Print
              </Button>
            </div>
          ) : <p className="text-xs text-muted-foreground py-1">No line items found for this quotation.</p>)}
          {section === "hire-loading" && (deliveries.length > 0
            ? deliveries.map((d, i) => <DeliveryBatchRow key={d.id} q={q} delivery={d} index={i} />)
            : <p className="text-xs text-muted-foreground py-1">No delivery batches yet.</p>)}
          {section === "hire-delivery" && (deliveries.length > 0
            ? deliveries.map((d, i) => <DeliveryBatchRow key={d.id} q={q} delivery={d} index={i} />)
            : <p className="text-xs text-muted-foreground py-1">No delivery batches yet.</p>)}
          {section === "hire-return" && (returns.length > 0
            ? returns.map((r, i) => <ReturnBatchRow key={r.id} q={q} record={r} index={i} />)
            : <p className="text-xs text-muted-foreground py-1">No return batches yet.</p>)}
        </div>
      )}
    </div>
  );
};

// ── HSQ accordion card ─────────────────────────────────────────────────────────

const QuotationCard = ({ q }: { q: HireQuotation }) => {
  const [expanded, setExpanded] = useState(false);
  const deliveries = parseHistory<DeliveryRecord>(q.delivery_history);
  const returns = parseHistory<ReturnRecord>(q.return_history);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-all hover:shadow-sm">
      <button type="button" onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left">
        <div className="mt-0.5 shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-foreground">{q.company_name || q.site_manager_name || "Unnamed client"}</span>
            <span className="text-xs font-mono text-muted-foreground">{q.quotation_number}</span>
            <Badge className={`text-xs border capitalize py-0 ${statusColor(q.status || "draft")}`}>{q.status || "draft"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{q.site_name || "No site name"}</span>
            <span>Created {formatDate(q.created_at)}</span>
            {q.dispatch_date && <span>Dispatched {formatDate(q.dispatch_date)}</span>}
            {q.client_id && <span className="font-mono">{q.client_id}</span>}
          </div>
          <div className="mt-1.5"><ClientSitesBadges quotationId={q.id} /></div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1 text-xs text-muted-foreground">
          {deliveries.length > 0 && <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{deliveries.length} del.</span>}
          {returns.length > 0 && <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" />{returns.length} ret.</span>}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border bg-muted/5 px-4 py-3 space-y-2">
          {(["hire-quotation", "hire-loading", "hire-delivery", "hire-return"] as ReportSection[]).map((sec) => (
            <ReportSectionBlock key={sec} section={sec} q={q} deliveries={deliveries} returns={returns} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────

const ClientReport = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredQuotations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? hireQuotations.filter((hq) =>
          (hq.quotation_number || "").toLowerCase().includes(q) ||
          (hq.client_id || "").toLowerCase().includes(q) ||
          (hq.company_name || "").toLowerCase().includes(q) ||
          (hq.account_number || "").toLowerCase().includes(q)
        )
      : hireQuotations;
    return [...filtered].sort((a, b) => {
      const cmp = (b.created_at ?? "").localeCompare(a.created_at ?? "");
      return sortAsc ? -cmp : cmp;
    });
  }, [hireQuotations, searchQuery, sortAsc]);

  const handleSidebarItemClick = (item: string) => {
    const navMap: Record<string, string> = {
      sites: "/sites", maintenance: "/maintenance-logs", revenue: "/revenue",
      accounting: "/accounting", "site-master-plan": "/site-master-plan", settings: "/settings",
    };
    const path = navMap[item];
    if (item === "dashboard" || item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
    } else if (path) { navigate(path); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="previous-clients" onItemClick={handleSidebarItemClick} />
      <main className="ml-0 md:ml-64">
        <Header title="Client Report" subtitle="Browse all saved hire quotations and print any report without opening the full workflow." />
        <div className="p-4 md:p-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileBarChart2 className="h-5 w-5" /> All Hire Quotations
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Click any row to expand and print reports directly.</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0" onClick={() => setSortAsc((v) => !v)}>
                  {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                  {sortAsc ? "Oldest First" : "Latest First"}
                </Button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search by HSQ ID, Client ID, or company name…" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="px-4 pb-4 text-sm text-muted-foreground">Loading clients...</p>
              ) : filteredQuotations.length ? (
                <div className="px-4 pb-4 space-y-2.5 pt-1">
                  {filteredQuotations.map((q) => <QuotationCard key={q.id} q={q} />)}
                </div>
              ) : (
                <div className="mx-4 mb-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  {searchQuery.trim() ? "No quotations match your search." : "No saved quotations found yet. Create a new hire quotation to get started."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClientReport;
