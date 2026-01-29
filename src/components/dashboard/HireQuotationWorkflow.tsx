import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Truck, Calculator, Users } from "lucide-react";
import { toast } from "sonner";

type StepKey = "client" | "equipment" | "delivery" | "calculation";

type QuotationHeader = {
  quotationNo: string;
  dateCreated: string;
  clientCompanyName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  customerOrderNo: string;
  requisitionNo: string;
  createdBy: string;
};

type EquipmentItem = {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  qtyDelivered: string;
  weeklyRate: string;
  notes: string;
};

type DeliveryNote = {
  deliveryNoteNo: string;
  deliveryDate: string;
  deliveredBy: string;
  receivedBy: string;
  vehicleNo: string;
  remarks: string;
};

type QuotationCalculation = {
  numberOfWeeks: string;
  vatEnabled: boolean;
  vatRate: string;
  paymentTerms: string;
};

const steps: { key: StepKey; title: string; description: string; icon: typeof Users }[] = [
  { key: "client", title: "Client Details", description: "Quotation header", icon: Users },
  { key: "equipment", title: "Equipment", description: "Line items", icon: FileText },
  { key: "delivery", title: "Delivery Note", description: "Generate report", icon: Truck },
  { key: "calculation", title: "Calculation", description: "Weeks + totals", icon: Calculator },
];

const generateSequence = (prefix: string) => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${random}`;
};

const getToday = () => new Date().toISOString().split("T")[0];

const formatCurrency = (value: number) =>
  value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export type ProcessedClient = {
  id: string;
  clientCompanyName: string;
  clientName: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  equipmentItems: EquipmentItem[];
  processedAt: string;
};

type HireQuotationWorkflowProps = {
  onClientProcessed?: (client: ProcessedClient) => void;
};

const HireQuotationWorkflow = ({ onClientProcessed }: HireQuotationWorkflowProps) => {
  const [activeStep, setActiveStep] = useState<StepKey>("client");
  const [header, setHeader] = useState<QuotationHeader>(() => ({
    quotationNo: generateSequence("HQ"),
    dateCreated: getToday(),
    clientCompanyName: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    siteName: "",
    siteLocation: "",
    siteAddress: "",
    customerOrderNo: "",
    requisitionNo: "",
    createdBy: "",
  }));
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [equipmentDraft, setEquipmentDraft] = useState<EquipmentItem>({
    id: "",
    itemCode: "",
    description: "",
    unit: "",
    qtyDelivered: "",
    weeklyRate: "",
    notes: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote>(() => ({
    deliveryNoteNo: generateSequence("DN"),
    deliveryDate: getToday(),
    deliveredBy: "",
    receivedBy: "",
    vehicleNo: "",
    remarks: "",
  }));
  const [calculation, setCalculation] = useState<QuotationCalculation>({
    numberOfWeeks: "",
    vatEnabled: true,
    vatRate: "16",
    paymentTerms: "Payment due within 30 days from invoice date.",
  });

  const stepIndex = steps.findIndex((step) => step.key === activeStep);

  const weeklyHireTotal = useMemo(() => {
    return equipmentItems.reduce((total, item) => {
      const qty = parseNumber(item.qtyDelivered);
      const rate = parseNumber(item.weeklyRate);
      return total + qty * rate;
    }, 0);
  }, [equipmentItems]);

  const numberOfWeeks = parseNumber(calculation.numberOfWeeks || "0");
  const hireTotalForWeeks = weeklyHireTotal * numberOfWeeks;
  const vatRate = parseNumber(calculation.vatRate) / 100;
  const vatAmount = calculation.vatEnabled ? hireTotalForWeeks * vatRate : 0;
  const grandTotal = hireTotalForWeeks + vatAmount;

  const goToStep = (next: StepKey) => setActiveStep(next);

  const handleNext = () => {
    const currentIndex = steps.findIndex((step) => step.key === activeStep);
    const nextStep = steps[currentIndex + 1];
    if (nextStep) {
      setActiveStep(nextStep.key);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex((step) => step.key === activeStep);
    const prevStep = steps[currentIndex - 1];
    if (prevStep) {
      setActiveStep(prevStep.key);
    }
  };

  const validateHeader = () => {
    if (!header.clientCompanyName || !header.clientName || !header.clientPhone || !header.siteName) {
      toast.error("Please complete required client and site fields before continuing.");
      return false;
    }
    return true;
  };

  const handleHeaderSave = () => {
    if (validateHeader()) {
      toast.success("Quotation header saved.");
      handleNext();
    }
  };

  const handleEquipmentSave = () => {
    if (!equipmentItems.length) {
      toast.error("Add at least one equipment item before continuing.");
      return;
    }
    toast.success("Equipment details saved.");
    handleNext();
  };

  const handleDeliverySave = () => {
    if (!equipmentItems.length) {
      toast.error("Delivery note requires at least one equipment item.");
      return;
    }
    toast.success("Delivery note generated.");
    handleNext();
  };

  const handleCalculationSave = () => {
    if (numberOfWeeks < 1) {
      toast.error("Enter a valid number of weeks.");
      return;
    }
    toast.success("Hire quotation calculation saved.");
    onClientProcessed?.({
      id: header.quotationNo,
      clientCompanyName: header.clientCompanyName,
      clientName: header.clientName,
      siteName: header.siteName,
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      equipmentItems,
      processedAt: new Date().toISOString(),
    });
  };

  const resetEquipmentDraft = () =>
    setEquipmentDraft({
      id: "",
      itemCode: "",
      description: "",
      unit: "",
      qtyDelivered: "",
      weeklyRate: "",
      notes: "",
    });

  const handleEquipmentAdd = () => {
    if (!equipmentDraft.description || !equipmentDraft.qtyDelivered || !equipmentDraft.weeklyRate) {
      toast.error("Description, quantity, and weekly rate are required.");
      return;
    }

    if (editingIndex !== null) {
      setEquipmentItems((prev) =>
        prev.map((item, index) => (index === editingIndex ? { ...equipmentDraft } : item)),
      );
      toast.success("Equipment item updated.");
      setEditingIndex(null);
    } else {
      const newItem = { ...equipmentDraft, id: crypto.randomUUID() };
      setEquipmentItems((prev) => [...prev, newItem]);
      toast.success("Equipment item added.");
    }
    resetEquipmentDraft();
  };

  const startEditItem = (index: number) => {
    setEditingIndex(index);
    setEquipmentDraft(equipmentItems[index]);
  };

  const removeItem = (index: number) => {
    setEquipmentItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Hire Quotation Workflow</CardTitle>
        <p className="text-sm text-muted-foreground">
          Step-by-step quotation flow (client details → equipment → delivery note → weekly calculation).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.key === activeStep;
            const isComplete = index < stepIndex;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(step.key)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isComplete ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {activeStep === "client" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Quotation No</Label>
                <Input value={header.quotationNo} readOnly />
              </div>
              <div>
                <Label>Date Created</Label>
                <Input value={header.dateCreated} readOnly />
              </div>
              <div>
                <Label htmlFor="clientCompanyName">Client Company Name *</Label>
                <Input
                  id="clientCompanyName"
                  value={header.clientCompanyName}
                  onChange={(event) => setHeader((prev) => ({ ...prev, clientCompanyName: event.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label htmlFor="clientName">Contact Person *</Label>
                <Input
                  id="clientName"
                  value={header.clientName}
                  onChange={(event) => setHeader((prev) => ({ ...prev, clientName: event.target.value }))}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Client Phone *</Label>
                <Input
                  id="clientPhone"
                  value={header.clientPhone}
                  onChange={(event) => setHeader((prev) => ({ ...prev, clientPhone: event.target.value }))}
                  placeholder="Phone"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={header.clientEmail}
                  onChange={(event) => setHeader((prev) => ({ ...prev, clientEmail: event.target.value }))}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={header.siteName}
                  onChange={(event) => setHeader((prev) => ({ ...prev, siteName: event.target.value }))}
                  placeholder="Site name"
                />
              </div>
              <div>
                <Label htmlFor="siteLocation">Site Location</Label>
                <Input
                  id="siteLocation"
                  value={header.siteLocation}
                  onChange={(event) => setHeader((prev) => ({ ...prev, siteLocation: event.target.value }))}
                  placeholder="City or area"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="siteAddress">Site Address</Label>
                <Textarea
                  id="siteAddress"
                  rows={2}
                  value={header.siteAddress}
                  onChange={(event) => setHeader((prev) => ({ ...prev, siteAddress: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="customerOrderNo">Customer Order No</Label>
                <Input
                  id="customerOrderNo"
                  value={header.customerOrderNo}
                  onChange={(event) => setHeader((prev) => ({ ...prev, customerOrderNo: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="requisitionNo">Requisition No</Label>
                <Input
                  id="requisitionNo"
                  value={header.requisitionNo}
                  onChange={(event) => setHeader((prev) => ({ ...prev, requisitionNo: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={header.createdBy}
                  onChange={(event) => setHeader((prev) => ({ ...prev, createdBy: event.target.value }))}
                  placeholder="User name"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">* Required fields</p>
              <Button type="button" onClick={handleHeaderSave}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {activeStep === "equipment" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={equipmentDraft.itemCode}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, itemCode: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={equipmentDraft.unit}
                  onChange={(event) => setEquipmentDraft((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder="pcs / sets"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={equipmentDraft.description}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Item description"
                />
              </div>
              <div>
                <Label htmlFor="qtyDelivered">Qty Delivered *</Label>
                <Input
                  id="qtyDelivered"
                  type="number"
                  min="0"
                  value={equipmentDraft.qtyDelivered}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, qtyDelivered: event.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="weeklyRate">Weekly Rate *</Label>
                <Input
                  id="weeklyRate"
                  type="number"
                  min="0"
                  value={equipmentDraft.weeklyRate}
                  onChange={(event) =>
                    setEquipmentDraft((prev) => ({ ...prev, weeklyRate: event.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={equipmentDraft.notes}
                  onChange={(event) => setEquipmentDraft((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="outline" onClick={resetEquipmentDraft}>
                Clear Item
              </Button>
              <Button type="button" onClick={handleEquipmentAdd}>
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Weekly Rate</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No equipment items added yet.
                      </td>
                    </tr>
                  ) : (
                    equipmentItems.map((item, index) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2">{item.qtyDelivered}</td>
                        <td className="px-3 py-2">R{item.weeklyRate}</td>
                        <td className="px-3 py-2">{item.notes || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => startEditItem(index)}>
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)}>
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleEquipmentSave}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {activeStep === "delivery" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Delivery Note No</Label>
                <Input value={deliveryNote.deliveryNoteNo} readOnly />
              </div>
              <div>
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryNote.deliveryDate}
                  onChange={(event) =>
                    setDeliveryNote((prev) => ({ ...prev, deliveryDate: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="deliveredBy">Delivered By</Label>
                <Input
                  id="deliveredBy"
                  value={deliveryNote.deliveredBy}
                  onChange={(event) =>
                    setDeliveryNote((prev) => ({ ...prev, deliveredBy: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="receivedBy">Received By</Label>
                <Input
                  id="receivedBy"
                  value={deliveryNote.receivedBy}
                  onChange={(event) => setDeliveryNote((prev) => ({ ...prev, receivedBy: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="vehicleNo">Vehicle No</Label>
                <Input
                  id="vehicleNo"
                  value={deliveryNote.vehicleNo}
                  onChange={(event) => setDeliveryNote((prev) => ({ ...prev, vehicleNo: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  rows={2}
                  value={deliveryNote.remarks}
                  onChange={(event) => setDeliveryNote((prev) => ({ ...prev, remarks: event.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Delivery Note Preview</p>
                  <p className="text-xs text-muted-foreground">
                    {header.clientCompanyName || "Client"} · {header.siteName || "Site"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toast.message("Delivery Note ready for printing.")}
                  >
                    Print
                  </Button>
                  <Button
                    type="button"
                    onClick={() => toast.message("Delivery Note PDF generated (preview).")}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Equipment items: {equipmentItems.length} · Delivery Date: {deliveryNote.deliveryDate}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleDeliverySave}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {activeStep === "calculation" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="numberOfWeeks">Number of Weeks *</Label>
                <Input
                  id="numberOfWeeks"
                  type="number"
                  min="1"
                  value={calculation.numberOfWeeks}
                  onChange={(event) =>
                    setCalculation((prev) => ({ ...prev, numberOfWeeks: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  min="0"
                  value={calculation.vatRate}
                  onChange={(event) => setCalculation((prev) => ({ ...prev, vatRate: event.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox
                  id="vatEnabled"
                  checked={calculation.vatEnabled}
                  onCheckedChange={(checked) =>
                    setCalculation((prev) => ({ ...prev, vatEnabled: Boolean(checked) }))
                  }
                />
                <Label htmlFor="vatEnabled">Apply VAT</Label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Weekly Rate</th>
                    <th className="px-3 py-2 text-left font-medium">Weekly Total</th>
                    <th className="px-3 py-2 text-left font-medium">Weeks</th>
                    <th className="px-3 py-2 text-left font-medium">Hire Total</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentItems.map((item) => {
                    const qty = parseNumber(item.qtyDelivered);
                    const rate = parseNumber(item.weeklyRate);
                    const weeklyTotal = qty * rate;
                    const hireTotal = weeklyTotal * numberOfWeeks;
                    return (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2">{item.qtyDelivered}</td>
                        <td className="px-3 py-2">R{item.weeklyRate}</td>
                        <td className="px-3 py-2">R{formatCurrency(weeklyTotal)}</td>
                        <td className="px-3 py-2">{numberOfWeeks || 0}</td>
                        <td className="px-3 py-2">R{formatCurrency(hireTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Weekly Hire Total</p>
                <p className="text-lg font-semibold">R{formatCurrency(weeklyHireTotal)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Weeks</p>
                <p className="text-lg font-semibold">{numberOfWeeks || 0}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">VAT</p>
                <p className="text-lg font-semibold">R{formatCurrency(vatAmount)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="text-lg font-semibold">R{formatCurrency(grandTotal)}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Textarea
                id="paymentTerms"
                rows={3}
                value={calculation.paymentTerms}
                onChange={(event) =>
                  setCalculation((prev) => ({ ...prev, paymentTerms: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => toast.message("Quotation ready to print.")}
                >
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={() => toast.message("Quotation PDF generated.")}
                >
                  Download PDF
                </Button>
                <Button type="button" onClick={handleCalculationSave}>
                  Save Quotation
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HireQuotationWorkflow;
