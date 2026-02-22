import { Fragment, useState, useMemo, useEffect } from "react";
import { Package, ArrowRight, Search, Boxes, Warehouse, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScaffolds } from "@/hooks/useScaffolds";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Derive a grouping key from the description so similar items cluster together. */
const getGroupKey = (description: string | null): string => {
  if (!description) return "ZZZ_Other";
  const d = description.toLowerCase();
  if (d.includes("standard")) return "A_Standards";
  if (d.includes("reinf") && d.includes("ledger")) return "C_Reinforced Ledgers";
  if (d.includes("ledger")) return "B_Ledgers";
  if (d.includes("toe board")) return "E_Toe Boards";
  if (d.includes("hook-on board") || d.includes("board")) return "D_Hook-on Boards";
  if (d.includes("trapdoor")) return "F_Trapdoors";
  if (d.includes("staircase")) return "G_Staircases";
  if (d.includes("ladder")) return "H_Ladders";
  if (d.includes("coupler") || d.includes("connector") || d.includes("sleeve")) return "I_Couplers & Connectors";
  if (d.includes("base") || d.includes("jack")) return "J_Base Plates & Jacks";
  if (d.includes("castor")) return "K_Castors";
  if (d.includes("prop")) return "L_Props";
  if (d.includes("fork head")) return "M_Fork Heads";
  if (d.includes("scaffold tube") || d.includes("tube")) return "N_Scaffold Tubes";
  return "ZZZ_Other";
};

const InventoryOverview = ({ externalSearch, chartOnly }: { externalSearch?: string; chartOnly?: boolean }) => {
  const { data: scaffolds, isLoading, error } = useScaffolds();
  const { data: hireQuotations } = useHireQuotations();
  const [search, setSearch] = useState("");

  // Sync with external search from header
  useEffect(() => {
    if (externalSearch !== undefined) setSearch(externalSearch);
  }, [externalSearch]);

  const filteredAndGrouped = useMemo(() => {
    if (!scaffolds) return [];
    const q = search.toLowerCase();
    const filtered = q
      ? scaffolds.filter(
          (s) =>
            (s.part_number ?? "").toLowerCase().includes(q) ||
            (s.description ?? "").toLowerCase().includes(q) ||
            s.scaffold_type.toLowerCase().includes(q)
        )
      : scaffolds;

    return [...filtered].sort((a, b) => {
      const ga = getGroupKey(a.description ?? a.scaffold_type);
      const gb = getGroupKey(b.description ?? b.scaffold_type);
      if (ga !== gb) return ga.localeCompare(gb);
      return (a.description ?? "").localeCompare(b.description ?? "");
    });
  }, [scaffolds, search]);

  const onHireByScaffoldId = useMemo(() => {
    const totals = new Map<string, number>();
    (hireQuotations ?? []).forEach((quotation) => {
      (quotation.line_items ?? []).forEach((lineItem) => {
        if (!lineItem.scaffold_id) return;
        const delivered = Math.max(lineItem.delivered_quantity ?? 0, 0);
        const returned = Math.max(lineItem.returned_quantity ?? 0, 0);
        const activeOnHire = Math.max(delivered - returned, 0);
        if (activeOnHire <= 0) return;
        totals.set(
          lineItem.scaffold_id,
          (totals.get(lineItem.scaffold_id) ?? 0) + activeOnHire
        );
      });
    });
    return totals;
  }, [hireQuotations]);

  const inventoryMetrics = useMemo(() => {
    return (scaffolds ?? []).map((item) => {
      const availableStock = item.quantity ?? 0;
      const onHire = onHireByScaffoldId.get(item.id) ?? 0;
      const openingStock = availableStock + onHire;
      return {
        id: item.id,
        availableStock,
        onHire,
        openingStock,
      };
    });
  }, [onHireByScaffoldId, scaffolds]);

  const totals = useMemo(() => {
    return inventoryMetrics.reduce(
      (acc, item) => {
        acc.openingStock += item.openingStock;
        acc.availableStock += item.availableStock;
        acc.onHire += item.onHire;
        return acc;
      },
      { openingStock: 0, availableStock: 0, onHire: 0 }
    );
  }, [inventoryMetrics]);

  const metricsById = useMemo(() => {
    return new Map(inventoryMetrics.map((metric) => [metric.id, metric]));
  }, [inventoryMetrics]);

  const chartData = useMemo(
    () => [
      { name: "Opening Stock", quantity: totals.openingStock },
      { name: "Available", quantity: totals.availableStock },
      { name: "On Hire", quantity: totals.onHire },
    ],
    [totals.availableStock, totals.onHire, totals.openingStock]
  );

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
  };

  const formatMass = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `${value} kg`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      available: "status-available",
      in_use: "status-in-use",
      damaged: "status-damaged",
      maintenance: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    };
    return statusStyles[status] || "";
  };

  if (chartOnly) {
    const safeOpeningStock = Math.max(totals.openingStock, 1);
    const availablePct = Math.round((totals.availableStock / safeOpeningStock) * 100);
    const onHirePct = Math.round((totals.onHire / safeOpeningStock) * 100);
    const availableArc = (Math.max(Math.min(availablePct, 100), 0) / 100) * 360;

    return (
      <div className="rounded-2xl border border-slate-700/70 bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 p-5 text-slate-100 shadow-xl animate-fade-in">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <Package className="h-4 w-4 text-slate-100" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-white">Inventory Analysis</h3>
          </div>
          <span className="text-xs text-slate-300">Monthly</span>
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-6">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div
              className="h-36 w-36 rounded-full"
              style={{
                background: `conic-gradient(#facc15 0deg ${availableArc}deg, #38bdf8 ${availableArc}deg 360deg)`,
              }}
            />
            <div className="absolute flex h-24 w-24 flex-col items-center justify-center rounded-full bg-slate-900/95 text-center shadow-inner">
              <span className="text-2xl font-bold text-white">{availablePct}%</span>
              <span className="text-[11px] text-slate-300">{totals.availableStock} units</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-200"><span className="h-2 w-2 rounded-full bg-yellow-400" /> Available</span>
              <span className="font-semibold text-white">{totals.availableStock}</span>
              <span className="text-xs text-emerald-300">+{availablePct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-200"><span className="h-2 w-2 rounded-full bg-sky-400" /> On Hire</span>
              <span className="font-semibold text-white">{totals.onHire}</span>
              <span className="text-xs text-amber-300">+{onHirePct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-200"><span className="h-2 w-2 rounded-full bg-violet-400" /> Opening Stock</span>
              <span className="font-semibold text-white">{totals.openingStock}</span>
              <span className="text-xs text-slate-300">100%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Scaffold Inventory</h2>
            <p className="text-sm text-muted-foreground">
              {filteredAndGrouped.length} of {scaffolds?.length || 0} items
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by part no., description or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Boxes className="h-4 w-4" /> Total Qty at Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.openingStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Warehouse className="h-4 w-4" /> Current Available Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.availableStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" /> Total Qty On Hire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totals.onHire}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 h-60 w-full rounded-xl border border-border/60 bg-background/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load inventory data</p>
        </div>
      ) : filteredAndGrouped.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Part No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Qty at Start</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">On Hire</TableHead>
                  <TableHead className="text-center">Mass</TableHead>
                  <TableHead className="text-right">Weekly Rate</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                let lastGroup = "";
                return filteredAndGrouped.map((item) => {
                  const group = getGroupKey(item.description ?? item.scaffold_type);
                  const groupLabel = group.replace(/^[A-Z]_/, "");
                  const showHeader = group !== lastGroup;
                  lastGroup = group;
                  const rowMetrics = metricsById.get(item.id);
                  return (
                    <Fragment key={item.id}>
                      {showHeader && (
                        <TableRow key={`group-${group}`} className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={9} className="py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                            {groupLabel}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">
                          {item.part_number || "-"}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {item.description || item.scaffold_type}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {rowMetrics?.openingStock ?? 0}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-emerald-600">
                          {rowMetrics?.availableStock ?? 0}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-amber-600">
                          {rowMetrics?.onHire ?? 0}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatMass(item.mass_per_item)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.weekly_rate)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`${getStatusBadge(item.status)} border capitalize`}
                          >
                            {item.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No scaffolds registered yet.</p>
          <p className="text-xs mt-1">Add scaffolds to see inventory statistics.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;
