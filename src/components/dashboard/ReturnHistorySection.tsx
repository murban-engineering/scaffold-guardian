import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Package, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ReturnRecord {
  id: string;
  siteNumber?: string;
  returnNoteNumber: string;
  returnDate: string;
  hireEndDate?: string;
  returnedBy: string;
  receivedBy: string;
  vehicleNo: string;
  status: "pending" | "processed" | "completed";
  items: {
    itemCode: string;
    description: string;
    good: number;
    dirty: number;
    damaged: number;
    scrap: number;
    totalReturned: number;
    balanceAfter: number;
    massPerItem: number;
    totalMass: number;
  }[];
  totalReturned: number;
  totalMass: number;
  createdAt: string;
}

interface ReturnHistorySectionProps {
  returns: ReturnRecord[];
  onPrintReturnNote: (returnRecord: ReturnRecord) => void;
  onReturnBalance: () => void;
  hasRemainingBalance: boolean;
  totalReturned: number;
  totalDelivered: number;
}

export const ReturnHistorySection = ({
  returns,
  onPrintReturnNote,
  onReturnBalance,
  hasRemainingBalance,
  totalReturned,
  totalDelivered,
}: ReturnHistorySectionProps) => {
  const getStatusBadge = (status: ReturnRecord["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-600">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "processed":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500/50 bg-blue-500/10 text-blue-600">
            <RotateCcw className="h-3 w-3" />
            Processed
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="gap-1 border-green-500/50 bg-green-500/10 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
    }
  };

  const remainingBalance = totalDelivered - totalReturned;
  const progressPercentage = totalDelivered > 0 ? (totalReturned / totalDelivered) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Return Progress Overview */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Return Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Delivered</span>
            <span className="font-semibold">{totalDelivered} items</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Returned</span>
            <span className="font-semibold text-green-600">{totalReturned} items</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Balance Remaining</span>
            <span className={`font-semibold ${remainingBalance > 0 ? "text-amber-600" : "text-green-600"}`}>
              {remainingBalance} items
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {hasRemainingBalance && (
            <Button
              onClick={onReturnBalance}
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Return Remaining Balance ({remainingBalance} items)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Return History */}
      {returns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="h-5 w-5" />
              Return History ({returns.length} returns)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {returns.map((returnRecord, index) => (
              <div
                key={returnRecord.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{returnRecord.returnNoteNumber}</h4>
                      {getStatusBadge(returnRecord.status)}
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {returnRecord.returnDate} • {formatDistanceToNow(new Date(returnRecord.createdAt), { addSuffix: true })}
                    </p>
                    {returnRecord.returnedBy && (
                      <p className="text-sm text-muted-foreground">
                        Returned by: {returnRecord.returnedBy} • Vehicle: {returnRecord.vehicleNo || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintReturnNote(returnRecord)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Return Note
                    </Button>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">Item</th>
                        <th className="px-2 py-1.5 text-right font-medium">Good</th>
                        <th className="px-2 py-1.5 text-right font-medium">Dirty</th>
                        <th className="px-2 py-1.5 text-right font-medium">Damaged</th>
                        <th className="px-2 py-1.5 text-right font-medium">Scrap</th>
                        <th className="px-2 py-1.5 text-right font-medium">Total</th>
                        <th className="px-2 py-1.5 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnRecord.items.slice(0, 3).map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-t border-border/50">
                          <td className="px-2 py-1.5">
                            <span className="font-medium">{item.itemCode}</span>
                            <span className="text-muted-foreground ml-1">- {item.description}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right text-green-600">{item.good}</td>
                          <td className="px-2 py-1.5 text-right text-amber-600">{item.dirty}</td>
                          <td className="px-2 py-1.5 text-right text-red-600">{item.damaged}</td>
                          <td className="px-2 py-1.5 text-right text-red-800">{item.scrap}</td>
                          <td className="px-2 py-1.5 text-right font-medium">{item.totalReturned}</td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">{item.balanceAfter}</td>
                        </tr>
                      ))}
                      {returnRecord.items.length > 3 && (
                        <tr className="border-t border-border/50">
                          <td colSpan={7} className="px-2 py-1.5 text-center text-muted-foreground">
                            +{returnRecord.items.length - 3} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total returned: {returnRecord.totalReturned} items</span>
                  <span>Total mass: {returnRecord.totalMass.toFixed(2)} kg</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
