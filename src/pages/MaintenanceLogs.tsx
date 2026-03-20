import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck, AlertTriangle, Wrench, Trash2,
  Search, Filter, ArrowLeft, TrendingUp, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";

const parseReturnLog = (description: string) => {
  const conditionMatch = description.match(/Return condition:\s*([a-zA-Z]+)/i);
  const quantityMatch = description.match(/Quantity:\s*(\d+)/i);
  const quotationMatch = description.match(/Quotation:\s*([A-Z0-9-]+)/i);
  const clientMatch = description.match(/Client:\s*([^.]+)/i);
  return {
    condition: conditionMatch?.[1]?.toLowerCase() ?? null,
    quantity: quantityMatch ? Number(quantityMatch[1]) : null,
    quotation: quotationMatch?.[1] ?? null,
    client: clientMatch?.[1]?.trim() ?? null,
  };
};

const conditionConfig = {
  dirty: {
    label: "Dirty",
    icon: Wrench,
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    iconClass: "text-yellow-600",
    cardBg: "bg-yellow-50 border-yellow-100",
    dotClass: "bg-yellow-400",
    statBg: "bg-yellow-50",
    statBorder: "border-yellow-200",
    statText: "text-yellow-700",
  },
  damaged: {
    label: "Damaged",
    icon: AlertTriangle,
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
    iconClass: "text-orange-600",
    cardBg: "bg-orange-50 border-orange-100",
    dotClass: "bg-orange-400",
    statBg: "bg-orange-50",
    statBorder: "border-orange-200",
    statText: "text-orange-700",
  },
  scrap: {
    label: "Scrap",
    icon: Trash2,
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    iconClass: "text-red-600",
    cardBg: "bg-red-50 border-red-100",
    dotClass: "bg-red-500",
    statBg: "bg-red-50",
    statBorder: "border-red-200",
    statText: "text-red-700",
  },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  urgent: { label: "Urgent", class: "bg-red-100 text-red-700 border-red-200" },
  high: { label: "High", class: "bg-orange-100 text-orange-700 border-orange-200" },
  medium: { label: "Medium", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low: { label: "Low", class: "bg-green-100 text-green-700 border-green-200" },
};

const MaintenanceLogs = () => {
  const navigate = useNavigate();
  const { data: logs, isLoading, error } = useMaintenanceLogs();
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const allLogs = (logs ?? []).filter((log) => {
    const parsed = parseReturnLog(log.issue_description ?? "");
    return parsed.condition === "dirty" || parsed.condition === "damaged" || parsed.condition === "scrap";
  });

  const filtered = allLogs.filter((log) => {
    const parsed = parseReturnLog(log.issue_description ?? "");
    const item = log.scaffolds?.description || log.scaffolds?.part_number || "";
    const matchesSearch =
      !search ||
      item.toLowerCase().includes(search.toLowerCase()) ||
      (parsed.client ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (parsed.quotation ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCondition = conditionFilter === "all" || parsed.condition === conditionFilter;
    const matchesPriority = priorityFilter === "all" || log.priority === priorityFilter;
    return matchesSearch && matchesCondition && matchesPriority;
  });

  const stats = {
    dirty: allLogs.filter((l) => parseReturnLog(l.issue_description ?? "").condition === "dirty").length,
    damaged: allLogs.filter((l) => parseReturnLog(l.issue_description ?? "").condition === "damaged").length,
    scrap: allLogs.filter((l) => parseReturnLog(l.issue_description ?? "").condition === "scrap").length,
  };
  const totalQty = allLogs.reduce((sum, l) => sum + (parseReturnLog(l.issue_description ?? "").quantity ?? 0), 0);

  const hasActiveFilters = search || conditionFilter !== "all" || priorityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setConditionFilter("all");
    setPriorityFilter("all");
  };

  const handleSidebarItemClick = (item: string) => {
    const routes: Record<string, string> = {
      dashboard: "/",
      inventory: "/",
      workforce: "/",
      sites: "/sites",
      revenue: "/revenue",
      accounting: "/accounting",
      "site-master-plan": "/site-master-plan",
      settings: "/settings",
      maintenance: "/maintenance-logs",
    };
    const path = routes[item];
    if (path) {
      if (item === "dashboard" || item === "inventory" || item === "workforce") {
        navigate("/", { state: { activeItem: item }, replace: true });
      } else {
        navigate(path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="maintenance" onItemClick={handleSidebarItemClick} />
      <div className="ml-0 md:ml-64">
        <Header title="Maintenance Logs" subtitle="Equipment return condition tracker" />
        <main className="p-4 md:p-6 space-y-4 md:space-y-6">

          {/* Back */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>

          {/* Stats Row — 2 cols on mobile, 4 on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Total */}
            <Card className="border shadow-sm col-span-2 lg:col-span-1">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted shrink-0">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">Total Items</p>
                    <p className="text-2xl md:text-3xl font-bold leading-tight">{totalQty}</p>
                    <p className="text-xs text-muted-foreground">{allLogs.length} entries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(["dirty", "damaged", "scrap"] as const).map((cond) => {
              const cfg = conditionConfig[cond];
              const Icon = cfg.icon;
              const count = allLogs
                .filter((l) => parseReturnLog(l.issue_description ?? "").condition === cond)
                .reduce((sum, l) => sum + (parseReturnLog(l.issue_description ?? "").quantity ?? 0), 0);
              return (
                <Card key={cond} className={`border shadow-sm ${cfg.statBg} ${cfg.statBorder}`}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/70 shrink-0">
                        <Icon className={`w-4 h-4 ${cfg.iconClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium uppercase tracking-wide truncate ${cfg.statText}`}>{cfg.label}</p>
                        <p className="text-2xl md:text-3xl font-bold leading-tight">{count}</p>
                        <p className="text-xs text-muted-foreground">{stats[cond]} entries</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Card */}
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4 px-4 md:px-6">
              {/* Title row */}
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
                <CardTitle className="text-base md:text-lg">Return Condition Log</CardTitle>
                {filtered.length !== allLogs.length && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {filtered.length}/{allLogs.length}
                  </span>
                )}
              </div>

              {/* Filters — stacked on mobile */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search item, client, quotation…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-sm w-full"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Select value={conditionFilter} onValueChange={setConditionFilter}>
                    <SelectTrigger className="h-9 flex-1 sm:w-36 text-sm">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Conditions</SelectItem>
                      <SelectItem value="dirty">Dirty</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="scrap">Scrap</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-9 flex-1 sm:w-32 text-sm">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearFilters} title="Clear filters">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 md:p-6 space-y-3">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <Skeleton key={row} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16 text-muted-foreground">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Unable to load maintenance logs</p>
                </div>
              ) : filtered.length ? (
                <>
                  {/* Mobile card list */}
                  <div className="md:hidden divide-y divide-border">
                    {filtered.map((log) => {
                      const parsed = parseReturnLog(log.issue_description ?? "");
                      const cond = parsed.condition as keyof typeof conditionConfig | null;
                      const cfg = cond ? conditionConfig[cond] : null;
                      const Icon = cfg?.icon ?? ClipboardCheck;
                      const itemLabel = log.scaffolds?.description || log.scaffolds?.part_number || "Scaffold item";
                      const pCfg = priorityConfig[log.priority] ?? priorityConfig.medium;

                      return (
                        <div key={log.id} className="px-4 py-3.5 hover:bg-muted/20 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg ? cfg.cardBg : "bg-muted"}`}>
                              <Icon className={`w-4 h-4 ${cfg?.iconClass ?? "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-sm truncate">{itemLabel}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`w-1.5 h-1.5 rounded-full ${log.is_resolved ? "bg-green-400" : "bg-amber-400"}`} />
                                  <span className="text-xs text-muted-foreground">{log.is_resolved ? "Resolved" : "Open"}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {cfg && (
                                  <Badge className={`text-xs border font-medium ${cfg.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${cfg.dotClass}`} />
                                    {cfg.label}
                                  </Badge>
                                )}
                                <Badge className={`text-xs border ${pCfg.class}`}>{pCfg.label}</Badge>
                                {parsed.quantity !== null && (
                                  <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full">
                                    Qty: {parsed.quantity}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                {parsed.client && <span className="truncate max-w-[140px]">👤 {parsed.client}</span>}
                                {parsed.quotation && (
                                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                                    {parsed.quotation}
                                  </span>
                                )}
                                <span>
                                  {new Date(log.created_at).toLocaleDateString("en-GB", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="w-8 pl-6"></TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Item</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Condition</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide text-center">Qty</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Client</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Quotation</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Priority</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide">Status</TableHead>
                          <TableHead className="font-semibold text-xs uppercase tracking-wide pr-6">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((log) => {
                          const parsed = parseReturnLog(log.issue_description ?? "");
                          const cond = parsed.condition as keyof typeof conditionConfig | null;
                          const cfg = cond ? conditionConfig[cond] : null;
                          const Icon = cfg?.icon ?? ClipboardCheck;
                          const itemLabel = log.scaffolds?.description || log.scaffolds?.part_number || "Scaffold item";
                          const pCfg = priorityConfig[log.priority] ?? priorityConfig.medium;

                          return (
                            <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="pl-6">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${cfg ? cfg.cardBg : "bg-muted"}`}>
                                  <Icon className={`w-3.5 h-3.5 ${cfg?.iconClass ?? "text-muted-foreground"}`} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-sm">{itemLabel}</span>
                              </TableCell>
                              <TableCell>
                                {cfg ? (
                                  <Badge className={`text-xs border font-medium ${cfg.badgeClass}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${cfg.dotClass}`} />
                                    {cfg.label}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Unknown</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-bold text-base tabular-nums">
                                  {parsed.quantity ?? "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{parsed.client || <span className="text-muted-foreground text-xs">—</span>}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {parsed.quotation || "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs border ${pCfg.class}`}>
                                  {pCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${log.is_resolved ? "bg-green-400" : "bg-amber-400"}`} />
                                  <span className="text-xs text-muted-foreground">
                                    {log.is_resolved ? "Resolved" : "Open"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="pr-6 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 px-4 text-muted-foreground">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="w-7 h-7 opacity-40" />
                  </div>
                  <p className="font-semibold text-foreground text-sm md:text-base">
                    {allLogs.length > 0 ? "No results match your filters" : "No maintenance logs yet"}
                  </p>
                  <p className="text-sm mt-1 max-w-xs mx-auto">
                    {allLogs.length > 0
                      ? "Try adjusting your search or filter criteria."
                      : "Dirty, damaged, and scrap returns from hire workflows will appear here."}
                  </p>
                  {allLogs.length > 0 && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default MaintenanceLogs;
