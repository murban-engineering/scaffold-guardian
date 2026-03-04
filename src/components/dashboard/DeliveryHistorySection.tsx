import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Package, CheckCircle2, Clock, Truck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface DeliveryRecord {
  id: string;
  siteNumber?: string;
  deliveryNoteNumber: string;
  deliveryDate: string;
  hireStartDate?: string;
  deliveredBy: string;
  receivedBy: string;
  vehicleNo: string;
  status: "pending" | "dispatched" | "completed";
  items: {
    itemCode: string;
    description: string;
    quantityDelivered: number;
    balanceAfter: number;
    massPerItem: number;
    totalMass: number;
  }[];
  totalMass: number;
  createdAt: string;
}

interface DeliveryHistorySectionProps {
  deliveries: DeliveryRecord[];
  onPrintDeliveryNote: (delivery: DeliveryRecord) => void;
  onPrintLoadingNote: (delivery: DeliveryRecord) => void;
  onMarkDispatched: (deliveryId: string) => void;
  onDeliverBalance: () => void;
  hasRemainingBalance: boolean;
  totalDelivered: number;
  totalOrdered: number;
}

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DeliveryHistorySection = ({
  deliveries,
  onPrintDeliveryNote,
  onPrintLoadingNote,
  onMarkDispatched,
  onDeliverBalance,
  hasRemainingBalance,
  totalDelivered,
  totalOrdered,
}: DeliveryHistorySectionProps) => {
  const getStatusBadge = (status: DeliveryRecord["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-600">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "dispatched":
        return (
          <Badge variant="outline" className="gap-1 border-blue-500/50 bg-blue-500/10 text-blue-600">
            <Truck className="h-3 w-3" />
            Dispatched
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

  const remainingBalance = totalOrdered - totalDelivered;
  const progressPercentage = totalOrdered > 0 ? (totalDelivered / totalOrdered) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Delivery Progress Overview */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Delivery Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Ordered</span>
            <span className="font-semibold">{totalOrdered} items</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Delivered</span>
            <span className="font-semibold text-green-600">{totalDelivered} items</span>
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
              onClick={onDeliverBalance}
              className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Truck className="h-4 w-4 mr-2" />
              Deliver Remaining Balance ({remainingBalance} items)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Delivery History */}
      {deliveries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Delivery History ({deliveries.length} deliveries)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveries.map((delivery, index) => (
              <div
                key={delivery.id}
                className="rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{delivery.deliveryNoteNumber}</h4>
                      {getStatusBadge(delivery.status)}
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {delivery.deliveryDate} • {formatDistanceToNow(new Date(delivery.createdAt), { addSuffix: true })}
                    </p>
                    {delivery.deliveredBy && (
                      <p className="text-sm text-muted-foreground">
                        Delivered by: {delivery.deliveredBy} • Vehicle: {delivery.vehicleNo || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintLoadingNote(delivery)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      LN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintDeliveryNote(delivery)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      DN
                    </Button>
                    {delivery.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => onMarkDispatched(delivery.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Dispatch
                      </Button>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium">Item</th>
                        <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                        <th className="px-2 py-1.5 text-right font-medium">Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.items.slice(0, 3).map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-t border-border/50">
                          <td className="px-2 py-1.5">
                            <span className="font-medium">{item.itemCode}</span>
                            <span className="text-muted-foreground ml-1">- {item.description}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right font-medium text-green-600">
                            {item.quantityDelivered}
                          </td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">
                            {item.balanceAfter}
                          </td>
                        </tr>
                      ))}
                      {delivery.items.length > 3 && (
                        <tr className="border-t border-border/50">
                          <td colSpan={3} className="px-2 py-1.5 text-center text-muted-foreground">
                            +{delivery.items.length - 3} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total items: {delivery.items.reduce((sum, item) => sum + item.quantityDelivered, 0)}</span>
                  <span>Total mass: {delivery.totalMass.toFixed(2)} kg</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
