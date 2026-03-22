import { ClipboardCheck } from "lucide-react";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatReportDate } from "@/lib/accountingDates";

const parseReturnLog = (description: string) => {
  const conditionMatch = description.match(/Return condition:\s*([a-zA-Z]+)/i);
  const quantityMatch = description.match(/Quantity:\s*(\d+)/i);
  return {
    condition: conditionMatch?.[1]?.toLowerCase() ?? null,
    quantity: quantityMatch ? Number(quantityMatch[1]) : null,
  };
};

const MaintenanceLogOverview = () => {
  const { data: logs, isLoading, error } = useMaintenanceLogs();
  const maintenanceLogs = (logs ?? []).filter((log) => {
    const parsed = parseReturnLog(log.issue_description ?? "");
    return parsed.condition === "dirty" || parsed.condition === "damaged" || parsed.condition === "scrap";
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-accent/10">
          <ClipboardCheck className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Maintenance Log</h2>
          <p className="text-sm text-muted-foreground">
            Track dirty, damaged, and scrap returns logged from hire workflows.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((row) => (
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
              <TableHead>Item</TableHead>
              <TableHead className="text-center">Condition</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenanceLogs.slice(0, 8).map((log) => {
              const parsed = parseReturnLog(log.issue_description ?? "");
              const itemLabel = log.scaffolds?.description || log.scaffolds?.part_number || "Scaffold item";
              return (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{itemLabel}</TableCell>
                  <TableCell className="text-center capitalize">
                    {parsed.condition ?? "maintenance"}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {parsed.quantity ?? "—"}
                  </TableCell>
                  <TableCell>{log.reported_by}</TableCell>
                  <TableCell>
                    {formatReportDate(log.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No maintenance returns logged yet.</p>
          <p className="text-xs mt-1">Dirty, damaged, and scrap returns will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceLogOverview;
