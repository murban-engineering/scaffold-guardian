import { ArrowLeft, ClipboardCheck, AlertTriangle, Wrench, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const getConditionBadge = (condition: string | null) => {
  switch (condition) {
    case "dirty":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Dirty</Badge>;
    case "damaged":
      return <Badge variant="destructive" className="bg-orange-100 text-orange-800">Damaged</Badge>;
    case "scrap":
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Scrap</Badge>;
    default:
      return <Badge variant="outline">Maintenance</Badge>;
  }
};

const getConditionIcon = (condition: string | null) => {
  switch (condition) {
    case "dirty":
      return <Wrench className="w-4 h-4 text-yellow-600" />;
    case "damaged":
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case "scrap":
      return <Trash2 className="w-4 h-4 text-red-600" />;
    default:
      return <ClipboardCheck className="w-4 h-4 text-muted-foreground" />;
  }
};

const MaintenanceLogs = () => {
  const navigate = useNavigate();
  const { data: logs, isLoading, error } = useMaintenanceLogs();

  const maintenanceLogs = (logs ?? []).filter((log) => {
    const parsed = parseReturnLog(log.issue_description ?? "");
    return parsed.condition === "dirty" || parsed.condition === "damaged" || parsed.condition === "scrap";
  });

  const stats = {
    dirty: maintenanceLogs.filter(log => parseReturnLog(log.issue_description ?? "").condition === "dirty").length,
    damaged: maintenanceLogs.filter(log => parseReturnLog(log.issue_description ?? "").condition === "damaged").length,
    scrap: maintenanceLogs.filter(log => parseReturnLog(log.issue_description ?? "").condition === "scrap").length,
  };

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
      return;
    }
    if (item === "sites") {
      navigate("/sites");
      return;
    }
    if (item === "revenue") {
      navigate("/revenue");
      return;
    }
    if (item === "accounting") {
      navigate("/accounting");
      return;
    }
    if (item === "site-master-plan") {
      navigate("/site-master-plan");
      return;
    }
    if (item === "settings") {
      navigate("/settings");
      return;
    }
    if (item === "maintenance") {
      navigate("/maintenance-logs");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="maintenance" onItemClick={handleSidebarItemClick} />
      <div className="ml-0 md:ml-64">
        <Header title="Maintenance Logs" subtitle="Track damaged, dirty, and scrap returns" />
        <main className="p-6">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Wrench className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.dirty}</p>
                    <p className="text-sm text-muted-foreground">Dirty Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.damaged}</p>
                    <p className="text-sm text-muted-foreground">Damaged Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.scrap}</p>
                    <p className="text-sm text-muted-foreground">Scrap Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                All Maintenance Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <Skeleton key={row} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Unable to load maintenance logs</p>
                </div>
              ) : maintenanceLogs.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quotation</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs.map((log) => {
                      const parsed = parseReturnLog(log.issue_description ?? "");
                      const itemLabel = log.scaffolds?.description || log.scaffolds?.part_number || "Scaffold item";
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell>{getConditionIcon(parsed.condition)}</TableCell>
                          <TableCell className="font-medium">{itemLabel}</TableCell>
                          <TableCell>{getConditionBadge(parsed.condition)}</TableCell>
                          <TableCell className="text-center font-semibold">
                            {parsed.quantity ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {parsed.client || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {parsed.quotation || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={log.priority === "urgent" ? "destructive" : log.priority === "high" ? "default" : "secondary"}
                            >
                              {log.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.is_resolved ? "outline" : "default"}>
                              {log.is_resolved ? "Resolved" : "Open"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No maintenance returns logged yet</p>
                  <p className="text-sm mt-2">Dirty, damaged, and scrap returns from hire workflows will appear here.</p>
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
