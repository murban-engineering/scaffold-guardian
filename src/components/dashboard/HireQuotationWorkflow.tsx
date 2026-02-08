import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Truck, Calculator, Users, Plus, Trash2, Printer, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useScaffolds, useDeductScaffoldInventory, useReturnScaffoldInventory, Scaffold } from "@/hooks/useScaffolds";
import { useCreateQuotation, useUpdateQuotation, useAddLineItems, useClearLineItems, useUpdateLineItemQuantities, HireQuotation } from "@/hooks/useHireQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import {
  generateDeliveryNotePDF,
  generateHireLoadingNotePDF,
  generateHireQuotationReportPDF,
  generateQuotationPDF,
  generateYardVerificationNotePDF,
  DeliveryNoteData,
  HireLoadingNoteData,
  HireQuotationReportData,
  QuotationCalculationData,
} from "@/lib/pdfGenerator";

type StepKey = "client" | "equipment" | "quotation" | "hire-delivery" | "delivery" | "calculation" | "return";

type QuotationHeader = {
  quotationNo: string;
  dateCreated: string;
  clientCompanyName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  officeTel: string;
  officeEmail: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  customerOrderNo: string;
  officialOrdersUsed: string;
  bulkOrdersUsed: string;
  newOrderForEveryQuote: string;
  telephonicOrders: string;
  personsNameAsOrder: string;
  personsName: string;
  requisitionNumberUsed: string;
  requisitionNo: string;
  fixedRateAgreed: string;
  returns: string;
  delivery: string;
  specialTransportArrangement: string;
  projectTypes: string[];
  marketSegments: string[];
  civilsSegments: string[];
  scaffoldingSegments: string[];
  createdBy: string;
};

type DiscountLine = {
  type: string;
  product: string;
  hireDiscount: string;
  salesDiscount: string;
  rate: string;
};

type EquipmentItem = {
  id: string;
  scaffoldId: string | null;
  itemCode: string;
  description: string;
  unit: string;
  qtyDelivered: string;
  weeklyRate: string;
  hireDiscount: string;
  massPerItem: string;
  notes: string;
  originalQuantity: number; // Total quantity originally ordered
  previouslyDelivered: number; // Quantity already delivered in previous deliveries
  dbBalanceQuantity: number; // Balance quantity from database (remaining to deliver)
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
  hireDate: string;
  returnDate: string;
  vatEnabled: boolean;
  vatRate: string;
  discountRate: string;
  paymentTerms: string;
};

type ReturnItem = {
  id: string;
  scaffoldId: string | null;
  itemCode: string;
  description: string;
  totalDelivered: number;
  good: string;
  dirty: string;
  damaged: string;
  scrap: string;
};

const steps: { key: StepKey; title: string; description: string; icon: typeof Users }[] = [
  { key: "client", title: "Client Details", description: "Quotation header", icon: Users },
  { key: "equipment", title: "Equipment", description: "Select from inventory", icon: Package },
  { key: "quotation", title: "Hire Quotation", description: "Generate report", icon: FileText },
  { key: "hire-delivery", title: "Hire Delivery Note", description: "Confirm quantities", icon: Truck },
  { key: "delivery", title: "Hire Loading", description: "Generate report", icon: Truck },
  { key: "calculation", title: "Calculation", description: "Weeks + totals", icon: Calculator },
  { key: "return", title: "Hire Return", description: "Return items to inventory", icon: RotateCcw },
];

const generateDeliveryNoteNumber = () => {
  const timestamp = Date.now();
  const seq = (timestamp % 10000).toString().padStart(4, "0");
  return `DN-${seq}`;
};

const deriveDeliveryNoteNumber = (quotationNo: string, deliverySequence: number = 1) => {
  if (!quotationNo) {
    return generateDeliveryNoteNumber();
  }

  const parts = quotationNo.match(/\d+/g);
  const lastPart = parts?.[parts.length - 1];
  if (!lastPart) {
    return generateDeliveryNoteNumber();
  }

  const numericPart = Number.parseInt(lastPart, 10);
  if (Number.isNaN(numericPart)) {
    return generateDeliveryNoteNumber();
  }

  const baseNumber = `DN-${String(numericPart).padStart(4, "0")}`;
  // Add suffix for subsequent deliveries (A, B, C, etc.)
  if (deliverySequence > 1) {
    const suffix = String.fromCharCode(64 + deliverySequence); // 65 = 'A', so 2->A, 3->B, etc.
    return `${baseNumber}-${suffix}`;
  }
  return baseNumber;
};

const getToday = () => new Date().toISOString().split("T")[0];

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  initialQuotation?: HireQuotation | null;
};

const HireQuotationWorkflow = ({ onClientProcessed, initialQuotation }: HireQuotationWorkflowProps) => {
  const { user, profile } = useAuth();
  const { data: scaffolds, isLoading: scaffoldsLoading } = useScaffolds();
  const deductInventory = useDeductScaffoldInventory();
  const returnInventory = useReturnScaffoldInventory();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const addLineItems = useAddLineItems();
  const clearLineItems = useClearLineItems();
  const updateLineItemQuantities = useUpdateLineItemQuantities();
  const createMaintenanceLogs = useCreateMaintenanceLogs();

  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>("client");
  const [inventoryDeducted, setInventoryDeducted] = useState(false);
  const [returnProcessed, setReturnProcessed] = useState(false);
  const [deliverySequence, setDeliverySequence] = useState(1); // Track delivery sequence for DN numbering
  const [hireQuotationDiscount, setHireQuotationDiscount] = useState("0");
  const [header, setHeader] = useState<QuotationHeader>(() => ({
    quotationNo: "",
    dateCreated: getToday(),
    clientCompanyName: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    officeTel: "",
    officeEmail: "",
    siteName: "",
    siteLocation: "",
    siteAddress: "",
    customerOrderNo: "",
    officialOrdersUsed: "",
    bulkOrdersUsed: "",
    newOrderForEveryQuote: "",
    telephonicOrders: "",
    personsNameAsOrder: "",
    personsName: "",
    requisitionNumberUsed: "",
    requisitionNo: "",
    fixedRateAgreed: "",
    returns: "",
    delivery: "",
    specialTransportArrangement: "",
    projectTypes: [],
    marketSegments: [],
    civilsSegments: [],
    scaffoldingSegments: [],
    createdBy: "",
  }));

  useEffect(() => {
    if (profile?.full_name && !header.createdBy) {
      setHeader(prev => ({ ...prev, createdBy: profile.full_name }));
    }
  }, [profile?.full_name, header.createdBy]);

  useEffect(() => {
    if (!initialQuotation) return;

    const createdDate = initialQuotation.created_at
      ? new Date(initialQuotation.created_at).toISOString().split("T")[0]
      : getToday();

    setSavedQuotationId(initialQuotation.id);
    setHeader(prev => ({
      ...prev,
      quotationNo: initialQuotation.quotation_number || prev.quotationNo,
      dateCreated: createdDate,
      clientCompanyName: initialQuotation.company_name ?? "",
      clientName: initialQuotation.site_manager_name ?? "",
      clientPhone: initialQuotation.site_manager_phone ?? "",
      clientEmail: initialQuotation.site_manager_email ?? "",
      siteName: initialQuotation.site_name ?? "",
      siteAddress: initialQuotation.site_address ?? "",
      officialOrdersUsed: initialQuotation.official_order_required ? "yes" : "no",
      bulkOrdersUsed: initialQuotation.bulk_order_required ? "yes" : "no",
      telephonicOrders: initialQuotation.telephonic_order_acceptable ? "yes" : "no",
      specialTransportArrangement: initialQuotation.transport_arrangement ?? "",
      projectTypes: initialQuotation.project_type ?? [],
      marketSegments: initialQuotation.market_segment ?? [],
      customerOrderNo: initialQuotation.account_number ?? "",
      createdBy: prev.createdBy || profile?.full_name || "",
    }));

    setDiscounts([
      { type: "Tonnage", product: "", hireDiscount: String(initialQuotation.tonnage_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Basket", product: "", hireDiscount: String(initialQuotation.basket_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Straight Hire", product: "", hireDiscount: String(initialQuotation.tube_clamp_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Nett", product: "", hireDiscount: String(initialQuotation.other_discount ?? ""), salesDiscount: "", rate: "" },
    ]);

    setCalculation(prev => ({
      ...prev,
      hireDate: prev.hireDate || createdDate,
      returnDate: prev.returnDate || createdDate,
      paymentTerms: initialQuotation.notes ?? "",
    }));

    // Load equipment items with balance tracking from database
    const lineItems = initialQuotation.line_items ?? [];
    const hasBalanceItems = lineItems.some(item => (item.balance_quantity ?? 0) > 0);
    
    setEquipmentItems(
      lineItems.map(item => {
        const originalQty = item.quantity ?? 0;
        const deliveredQty = item.delivered_quantity ?? 0;
        const balanceQty = item.balance_quantity ?? 0;
        
        // If there's balance remaining, use that as the qty to deliver
        // Otherwise use the original quantity
        const qtyToShow = balanceQty > 0 ? balanceQty : originalQty;
        
        return {
          id: item.id,
          scaffoldId: item.scaffold_id ?? null,
          itemCode: item.part_number ?? "",
          description: item.description ?? "",
          unit: "pcs",
          qtyDelivered: String(qtyToShow),
          weeklyRate: String(item.weekly_rate ?? 0),
          hireDiscount: String(item.hire_discount ?? 0),
          massPerItem: String(item.mass_per_item ?? 0),
          notes: "",
          originalQuantity: originalQty,
          previouslyDelivered: deliveredQty,
          dbBalanceQuantity: balanceQty,
        };
      })
    );
    
    // If this quotation has balance items from previous delivery, skip to hire-delivery step
    if (hasBalanceItems) {
      setActiveStep("hire-delivery");
      setDeliverySequence(2); // This is at least the 2nd delivery
      setInventoryDeducted(false); // Reset so they can deliver again
      toast.info("Loaded quotation with balance items from previous delivery. Ready for next delivery.");
    } else {
      setActiveStep("client");
      setDeliverySequence(1);
    }
    setInventoryDeducted(false);
    setReturnProcessed(false);
  }, [initialQuotation, profile?.full_name]);

  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, string>>({});
  const [remainingQuantities, setRemainingQuantities] = useState<Record<string, number>>({});
  const [lastDeliveredQuantities, setLastDeliveredQuantities] = useState<Record<string, number> | null>(null);
  const [selectedScaffoldId, setSelectedScaffoldId] = useState<string>("");
  const [equipmentQuantity, setEquipmentQuantity] = useState<string>("1");
  const [itemCodeSearch, setItemCodeSearch] = useState<string>("");
  const [discounts, setDiscounts] = useState<DiscountLine[]>(() => [
    { type: "Tonnage", product: "", hireDiscount: "", salesDiscount: "", rate: "" },
    { type: "Basket", product: "", hireDiscount: "", salesDiscount: "", rate: "" },
    { type: "Straight Hire", product: "", hireDiscount: "", salesDiscount: "", rate: "" },
    { type: "Nett", product: "", hireDiscount: "", salesDiscount: "", rate: "" },
  ]);
  
  const [deliveryNote, setDeliveryNote] = useState<DeliveryNote>(() => ({
    deliveryNoteNo: deriveDeliveryNoteNumber(""),
    deliveryDate: getToday(),
    deliveredBy: "",
    receivedBy: "",
    vehicleNo: "",
    remarks: "",
  }));

  useEffect(() => {
    setDeliveryNote((prev) => ({
      ...prev,
      deliveryNoteNo: deriveDeliveryNoteNumber(header.quotationNo, deliverySequence),
    }));
  }, [header.quotationNo, deliverySequence]);

  useEffect(() => {
    setRemainingQuantities((prev) => {
      const next = { ...prev };
      equipmentItems.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = parseNumber(item.qtyDelivered);
        }
      });
      Object.keys(next).forEach((id) => {
        if (!equipmentItems.some((item) => item.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [equipmentItems]);

  useEffect(() => {
    setDeliveryQuantities((prev) => {
      const next = { ...prev };
      equipmentItems.forEach((item) => {
        const remaining = remainingQuantities[item.id];
        if (next[item.id] === undefined) {
          next[item.id] = String(remaining ?? parseNumber(item.qtyDelivered));
        }
      });
      Object.keys(next).forEach((id) => {
        if (!equipmentItems.some((item) => item.id === id)) {
          delete next[id];
        }
      });
      return next;
    });
  }, [equipmentItems, remainingQuantities]);

  useEffect(() => {
    setLastDeliveredQuantities(null);
  }, [equipmentItems]);
  
  const [calculation, setCalculation] = useState<QuotationCalculation>({
    hireDate: getToday(),
    returnDate: getToday(),
    vatEnabled: true,
    vatRate: "16",
    discountRate: "0",
    paymentTerms: "Payment due within 30 days from invoice date.",
  });
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  useEffect(() => {
    setReturnItems((prev) =>
      equipmentItems.map((item) => {
        const existing = prev.find((entry) => entry.id === item.id);
        return {
          id: item.id,
          scaffoldId: item.scaffoldId,
          itemCode: item.itemCode,
          description: item.description,
          totalDelivered: parseNumber(item.qtyDelivered),
          good: existing?.good ?? "0",
          dirty: existing?.dirty ?? "0",
          damaged: existing?.damaged ?? "0",
          scrap: existing?.scrap ?? "0",
        };
      })
    );
  }, [equipmentItems]);

  const stepIndex = steps.findIndex((step) => step.key === activeStep);

  const weeklyHireTotal = useMemo(() => {
    return equipmentItems.reduce((total, item) => {
      const qty = parseNumber(item.qtyDelivered);
      const rate = parseNumber(item.weeklyRate);
      const discountRate = Math.min(Math.max(parseNumber(item.hireDiscount), 0), 100) / 100;
      const hireRate = Math.max(rate * (1 - discountRate), 0);
      return total + qty * hireRate;
    }, 0);
  }, [equipmentItems]);

  const selectedScaffold = useMemo(
    () => scaffolds?.find((scaffold) => scaffold.id === selectedScaffoldId),
    [scaffolds, selectedScaffoldId]
  );
  const remainingSelectedQty = useMemo(() => {
    if (!selectedScaffold) return 0;
    const availableQty = selectedScaffold.quantity ?? 0;
    const alreadyAdded = equipmentItems.reduce((total, item) => {
      if (item.scaffoldId !== selectedScaffold.id) return total;
      return total + parseNumber(item.qtyDelivered);
    }, 0);
    return Math.max(availableQty - alreadyAdded, 0);
  }, [equipmentItems, selectedScaffold]);
  const addDisabled =
    !selectedScaffoldId ||
    remainingSelectedQty <= 0 ||
    parseNumber(equipmentQuantity) <= 0;

  useEffect(() => {
    if (!selectedScaffoldId) return;
    if (remainingSelectedQty <= 0) {
      setEquipmentQuantity("0");
      return;
    }
    const currentQty = parseNumber(equipmentQuantity);
    if (currentQty <= 0) {
      setEquipmentQuantity("1");
      return;
    }
    if (currentQty > remainingSelectedQty) {
      setEquipmentQuantity(String(remainingSelectedQty));
    }
  }, [equipmentQuantity, remainingSelectedQty, selectedScaffoldId]);

  const hireDateValue = calculation.hireDate ? new Date(calculation.hireDate) : null;
  const returnDateValue = calculation.returnDate ? new Date(calculation.returnDate) : null;
  const hasValidDateRange =
    !!hireDateValue &&
    !!returnDateValue &&
    !Number.isNaN(hireDateValue.getTime()) &&
    !Number.isNaN(returnDateValue.getTime()) &&
    returnDateValue >= hireDateValue;
  const numberOfDays = hasValidDateRange && hireDateValue && returnDateValue
    ? Math.floor((returnDateValue.getTime() - hireDateValue.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const numberOfWeeks = numberOfDays > 0 ? Math.ceil(numberOfDays / 7) : 0;
  const hireTotalForWeeks = weeklyHireTotal * numberOfWeeks;
  const vatRate = parseNumber(calculation.vatRate) / 100;
  const vatAmount = calculation.vatEnabled ? hireTotalForWeeks * vatRate : 0;
  const grandTotal = hireTotalForWeeks + vatAmount;
  const discountRate = parseNumber(calculation.discountRate) / 100;
  const discountAmount = grandTotal * discountRate;
  const paymentTotal = Math.max(grandTotal - discountAmount, 0);

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

  const handleYesNoChange = (field: keyof QuotationHeader, value: string) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const toggleSelection = (field: keyof QuotationHeader, value: string) => {
    setHeader(prev => {
      const currentValues = prev[field];
      if (!Array.isArray(currentValues)) return prev;
      const nextValues = currentValues.includes(value)
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
      return { ...prev, [field]: nextValues };
    });
  };

  const validateHeader = () => {
    if (!header.clientCompanyName || !header.clientName || !header.clientPhone || !header.siteName) {
      toast.error("Please complete required client and site fields before continuing.");
      return false;
    }
    return true;
  };

  const handleHeaderSave = async () => {
    if (!validateHeader()) return;
    if (!user) {
      toast.error("Please log in to create a quotation");
      return;
    }

    try {
      if (!savedQuotationId) {
        const quotation = await createQuotation.mutateAsync({
          company_name: header.clientCompanyName,
          site_name: header.siteName,
          site_address: header.siteAddress,
          site_manager_name: header.clientName,
          site_manager_phone: header.clientPhone,
          site_manager_email: header.clientEmail,
          delivery_address: header.siteLocation,
        });
        setSavedQuotationId(quotation.id);
        setHeader(prev => ({ ...prev, quotationNo: quotation.quotation_number }));
        toast.success(`Quotation ${quotation.quotation_number} created and saved!`);
      } else {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          company_name: header.clientCompanyName,
          site_name: header.siteName,
          site_address: header.siteAddress,
          site_manager_name: header.clientName,
          site_manager_phone: header.clientPhone,
          site_manager_email: header.clientEmail,
          delivery_address: header.siteLocation,
        });
      }
      handleNext();
    } catch (error) {
      console.error("Failed to save quotation:", error);
    }
  };

  const handleAddFromInventory = () => {
    if (!selectedScaffoldId) {
      toast.error("Please select an item from inventory");
      return;
    }
    
    const scaffold = scaffolds?.find(s => s.id === selectedScaffoldId);
    if (!scaffold) return;

    const qty = parseNumber(equipmentQuantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Check available inventory
    const availableQty = scaffold.quantity ?? 0;
    const existingItem = equipmentItems.find(item => item.scaffoldId === scaffold.id);
    const alreadyAdded = existingItem ? parseNumber(existingItem.qtyDelivered) : 0;
    const totalRequested = alreadyAdded + qty;

    if (totalRequested > availableQty) {
      toast.error(`Cannot order ${totalRequested} items. Only ${availableQty} available in inventory (${alreadyAdded} already added).`);
      return;
    }

    const existingIndex = equipmentItems.findIndex(item => item.scaffoldId === scaffold.id);
    if (existingIndex >= 0) {
      setEquipmentItems(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, qtyDelivered: String(parseNumber(item.qtyDelivered) + qty) }
          : item
      ));
      toast.success(`Updated quantity for ${scaffold.description || scaffold.part_number}`);
    } else {
      const inheritedDiscount = equipmentItems[0]?.hireDiscount ?? "0";
      const newItem: EquipmentItem = {
        id: crypto.randomUUID(),
        scaffoldId: scaffold.id,
        itemCode: scaffold.part_number || "",
        description: scaffold.description || scaffold.scaffold_type,
        unit: "pcs",
        qtyDelivered: String(qty),
        weeklyRate: String(scaffold.weekly_rate || 0),
        hireDiscount: inheritedDiscount,
        massPerItem: String(scaffold.mass_per_item || 0),
        notes: "",
        originalQuantity: qty,
        previouslyDelivered: 0,
        dbBalanceQuantity: 0,
      };
      setEquipmentItems(prev => [...prev, newItem]);
      toast.success(`Added ${scaffold.description || scaffold.part_number}`);
    }

    setSelectedScaffoldId("");
    setItemCodeSearch("");
    setEquipmentQuantity("1");
  };

  const removeItem = (index: number) => {
    setEquipmentItems(prev => prev.filter((_, i) => i !== index));
  };

  const getOrderedQuantity = (item: EquipmentItem) =>
    remainingQuantities[item.id] ?? parseNumber(item.qtyDelivered);

  const getDeliveredQuantity = (item: EquipmentItem) => {
    const orderedQty = getOrderedQuantity(item);
    const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "");
    return Math.min(Math.max(deliveredQty, 0), orderedQty);
  };

  const getInventoryDeliveryQuantity = (item: EquipmentItem) => {
    if (lastDeliveredQuantities?.[item.id] != null) {
      return lastDeliveredQuantities[item.id];
    }
    return getDeliveredQuantity(item);
  };

  const validateDeliveryQuantities = () => {
    for (const item of equipmentItems) {
      const orderedQty = getOrderedQuantity(item);
      const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "");
      if (deliveredQty > orderedQty) {
        toast.error(`Delivery Qty cannot exceed Order Qty for ${item.description || item.itemCode}.`);
        return false;
      }
    }
    return true;
  };

  const handleEquipmentSave = async () => {
    if (!equipmentItems.length || !savedQuotationId) {
      handleNext();
      return;
    }

    try {
      await clearLineItems.mutateAsync(savedQuotationId);
      await addLineItems.mutateAsync(
        equipmentItems.map(item => ({
          quotation_id: savedQuotationId,
          scaffold_id: item.scaffoldId || undefined,
          part_number: item.itemCode,
          description: item.description,
          quantity: parseNumber(item.qtyDelivered),
          hire_discount: parseNumber(item.hireDiscount),
          mass_per_item: parseNumber(item.massPerItem),
          weekly_rate: parseNumber(item.weeklyRate),
        }))
      );
      toast.success("Equipment details saved to database");
      handleNext();
    } catch (error) {
      console.error("Failed to save equipment:", error);
    }
  };

  const handlePrintDeliveryNote = async () => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in delivery note");
      return;
    }

    const balanceQuantities: Record<string, number> = {};
    const deliveredQuantities: Record<string, number> = {};
    const data: DeliveryNoteData = {
      quotationNumber: header.quotationNo,
      deliveryNoteNumber: deliveryNote.deliveryNoteNo,
      dateCreated: header.dateCreated,
      deliveryDate: deliveryNote.deliveryDate,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      deliveredBy: deliveryNote.deliveredBy,
      receivedBy: deliveryNote.receivedBy,
      vehicleNo: deliveryNote.vehicleNo,
      remarks: deliveryNote.remarks,
      createdBy: header.createdBy,
      items: equipmentItems.map(item => {
        const deliveredQty = getInventoryDeliveryQuantity(item);
        const balanceQuantity = Math.max(getOrderedQuantity(item) - deliveredQty, 0);
        balanceQuantities[item.id] = balanceQuantity;
        deliveredQuantities[item.id] = deliveredQty;
        return {
          partNumber: item.itemCode,
          description: item.description,
          balanceQuantity,
          quantity: deliveredQty,
          massPerItem: parseNumber(item.massPerItem) || null,
          totalMass: deliveredQty * parseNumber(item.massPerItem) || null,
        };
      }),
    };

    // Save balance and delivered quantities to database
    if (savedQuotationId) {
      try {
        const quantityUpdates = equipmentItems
          .filter(item => item.itemCode) // Only update items with part numbers
          .map(item => ({
            part_number: item.itemCode,
            delivered_quantity: deliveredQuantities[item.id] ?? 0,
            balance_quantity: balanceQuantities[item.id] ?? 0,
          }));
        
        if (quantityUpdates.length > 0) {
          await updateLineItemQuantities.mutateAsync({
            quotation_id: savedQuotationId,
            items: quantityUpdates,
          });
          toast.success("Delivery quantities saved to database");
        }
      } catch (error) {
        console.error("Failed to save delivery quantities:", error);
      }
    }

    generateDeliveryNotePDF(data);
    setRemainingQuantities(balanceQuantities);
    setDeliveryQuantities((prev) => {
      const next = { ...prev };
      equipmentItems.forEach((item) => {
        if (balanceQuantities[item.id] != null) {
          next[item.id] = String(balanceQuantities[item.id]);
        }
      });
      return next;
    });

    const balanceItems = equipmentItems
      .map((item) => {
        const balanceQty = balanceQuantities[item.id] ?? 0;
        return {
          partNumber: item.itemCode,
          description: item.description,
          quantity: balanceQty,
          massPerItem: parseNumber(item.massPerItem) || null,
          totalMass: balanceQty * parseNumber(item.massPerItem) || null,
        };
      })
      .filter((item) => item.quantity > 0);

    if (balanceItems.length > 0) {
      generateHireLoadingNotePDF({
        quotationNumber: header.quotationNo,
        dateCreated: header.dateCreated,
        companyName: header.clientCompanyName,
        siteName: header.siteName,
        siteLocation: header.siteLocation,
        siteAddress: header.siteAddress,
        contactName: header.clientName,
        contactPhone: header.clientPhone,
        createdBy: header.createdBy,
        noteTitle: "Hire Loading Note (Balance)",
        items: balanceItems,
      });
      toast.success("Balance hire loading note opened for printing.");
    }

    toast.success("Hire delivery note opened for printing");
  };

  const handlePrintHireLoadingNote = () => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in hire loading note");
      return;
    }

    const deliveredQuantities: Record<string, number> = {};
    const items = equipmentItems
      .map((item) => {
        const deliveredQty = getDeliveredQuantity(item);
        deliveredQuantities[item.id] = deliveredQty;
        return {
          partNumber: item.itemCode,
          description: item.description,
          quantity: deliveredQty,
          massPerItem: parseNumber(item.massPerItem) || null,
          totalMass: deliveredQty * parseNumber(item.massPerItem) || null,
        };
      })
      .filter((item) => item.quantity > 0);

    if (!items.length) {
      toast.error("Enter delivered quantities to generate a hire loading note.");
      return;
    }

    const data: HireLoadingNoteData = {
      quotationNumber: header.quotationNo,
      dateCreated: header.dateCreated,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      createdBy: header.createdBy,
      noteTitle: "Hire Loading Note",
      items,
    };

    generateHireLoadingNotePDF(data);

    const remainingItems = equipmentItems
      .map((item) => {
        const orderedQty = getOrderedQuantity(item);
        const deliveredQty = deliveredQuantities[item.id] ?? 0;
        const remainingQty = Math.max(orderedQty - deliveredQty, 0);
        return {
          partNumber: item.itemCode,
          description: item.description,
          quantity: remainingQty,
          massPerItem: parseNumber(item.massPerItem) || null,
          totalMass: remainingQty * parseNumber(item.massPerItem) || null,
        };
      })
      .filter((item) => item.quantity > 0);

    if (remainingItems.length > 0) {
      generateHireLoadingNotePDF({
        ...data,
        noteTitle: "Hire Loading Note (Balance)",
        items: remainingItems,
      });
      toast.success("Additional hire loading note generated for remaining quantities.");
    }

    setLastDeliveredQuantities(deliveredQuantities);
    setRemainingQuantities((prev) => {
      const next = { ...prev };
      equipmentItems.forEach((item) => {
        const orderedQty = getOrderedQuantity(item);
        const deliveredQty = deliveredQuantities[item.id] ?? 0;
        next[item.id] = Math.max(orderedQty - deliveredQty, 0);
      });
      return next;
    });
    setDeliveryQuantities((prev) => {
      const next = { ...prev };
      equipmentItems.forEach((item) => {
        const orderedQty = getOrderedQuantity(item);
        const deliveredQty = deliveredQuantities[item.id] ?? 0;
        next[item.id] = String(Math.max(orderedQty - deliveredQty, 0));
      });
      return next;
    });
    toast.success("Hire loading note opened for printing");
  };

  const handleHireDeliveryAction = async () => {
    if (!validateDeliveryQuantities()) {
      return;
    }

    const success = await handleEquipmentHired();
    if (!success) {
      return;
    }

    handlePrintHireLoadingNote();
    handleNext();
  };

  const handleEquipmentHired = async (): Promise<boolean> => {
    if (!equipmentItems.length) {
      toast.error("No equipment items selected for delivery");
      return false;
    }

    if (inventoryDeducted) {
      toast.error("Inventory already deducted for this delivery");
      return false;
    }

    if (!scaffolds?.length) {
      toast.error("Inventory data not loaded. Please try again.");
      return false;
    }

    if (!validateDeliveryQuantities()) {
      return false;
    }

    // Validate quantities against current inventory before deducting
    for (const item of equipmentItems) {
      if (!item.scaffoldId) continue;
      const scaffold = scaffolds.find(s => s.id === item.scaffoldId);
      if (!scaffold) continue;
      const requestedQty = getInventoryDeliveryQuantity(item);
      const availableQty = scaffold.quantity ?? 0;
      if (requestedQty > availableQty) {
        toast.error(`Cannot hire ${requestedQty} of "${item.description || item.itemCode}". Only ${availableQty} available in inventory.`);
        return false;
      }
    }

    const inventoryItems = equipmentItems
      .filter((item) => item.scaffoldId)
      .map((item) => ({
        scaffoldId: item.scaffoldId as string,
        quantity: getInventoryDeliveryQuantity(item),
      }))
      .filter((item) => item.quantity > 0);

    if (!inventoryItems.length) {
      toast.error("No inventory-linked equipment items to deduct.");
      return false;
    }

    await deductInventory.mutateAsync({
      items: inventoryItems,
      scaffolds,
    });
    setInventoryDeducted(true);
    toast.success("Inventory quantities deducted successfully!");
    return true;
  };

  const handlePrintYardVerificationNote = () => {
    const data: DeliveryNoteData = {
      quotationNumber: "",
      deliveryNoteNumber: "",
      dateCreated: "",
      deliveryDate: "",
      companyName: "",
      siteName: "",
      siteAddress: "",
      contactName: "",
      contactPhone: "",
      deliveredBy: "",
      receivedBy: "",
      vehicleNo: "",
      remarks: "",
      items: [],
    };

    generateYardVerificationNotePDF(data);
    toast.success("Yard verification note opened for printing");
  };

  const handlePrintHireQuotationReport = () => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in hire quotation");
      return;
    }

    const data: HireQuotationReportData = {
      quotationNumber: header.quotationNo,
      dateCreated: header.dateCreated,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      contactEmail: header.clientEmail,
      officeTel: header.officeTel,
      officeEmail: header.officeEmail,
      createdBy: header.createdBy,
      discountRate: parseNumber(hireQuotationDiscount),
      items: equipmentItems.map(item => ({
        partNumber: item.itemCode,
        description: item.description,
        quantity: parseNumber(item.qtyDelivered),
        massPerItem: parseNumber(item.massPerItem) || null,
        weeklyRate: parseNumber(item.weeklyRate),
        weeklyTotal: (() => {
          const rate = parseNumber(item.weeklyRate);
          const qty = parseNumber(item.qtyDelivered);
          const discountRate = Math.min(Math.max(parseNumber(item.hireDiscount), 0), 100) / 100;
          const hireRate = Math.max(rate * (1 - discountRate), 0);
          return qty * hireRate;
        })(),
        discountRate: parseNumber(item.hireDiscount),
      })),
    };

    generateHireQuotationReportPDF(data);
    toast.success("Hire quotation report opened for printing");
  };

  const handleHireQuotationSave = () => {
    handlePrintHireQuotationReport();
    handleNext();
  };

  const handleDeliverySave = async () => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in delivery note");
      return;
    }

    if (!inventoryDeducted) {
      toast.error("Please click \"Equipment Hired\" before continuing.");
      return;
    }

    // Save all equipment items to database before generating delivery note
    if (savedQuotationId) {
      try {
        await clearLineItems.mutateAsync(savedQuotationId);
        await addLineItems.mutateAsync(
          equipmentItems.map(item => ({
            quotation_id: savedQuotationId,
            scaffold_id: item.scaffoldId || undefined,
            part_number: item.itemCode,
            description: item.description,
            quantity: parseNumber(item.qtyDelivered),
            hire_discount: parseNumber(item.hireDiscount),
            mass_per_item: parseNumber(item.massPerItem),
            weekly_rate: parseNumber(item.weeklyRate),
          }))
        );
        toast.success("Delivery items saved to database");
      } catch (error) {
        console.error("Failed to save delivery items:", error);
        toast.error("Failed to save delivery items to database");
        return;
      }
    }

    await handlePrintDeliveryNote();
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
    handleNext();
  };

  const handlePrintQuotation = () => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in invoice");
      return;
    }

    const data: QuotationCalculationData = {
      quotationNumber: header.quotationNo,
      dateCreated: header.dateCreated,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      contactEmail: header.clientEmail,
      createdBy: header.createdBy,
      items: equipmentItems.map(item => ({
        partNumber: item.itemCode,
        description: item.description,
        quantity: parseNumber(item.qtyDelivered),
        weeklyRate: parseNumber(item.weeklyRate),
        weeklyTotal: (() => {
          const rate = parseNumber(item.weeklyRate);
          const qty = parseNumber(item.qtyDelivered);
          const discountRate = Math.min(Math.max(parseNumber(item.hireDiscount), 0), 100) / 100;
          const hireRate = Math.max(rate * (1 - discountRate), 0);
          return qty * hireRate;
        })(),
      })),
      hireWeeks: numberOfWeeks,
      weeklyTotal: weeklyHireTotal,
      totalForPeriod: hireTotalForWeeks,
      vatRate: parseNumber(calculation.vatRate),
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      discountRate: parseNumber(calculation.discountRate),
      discountAmount: discountAmount,
      paymentTotal: paymentTotal,
      paymentTerms: calculation.paymentTerms,
    };

    generateQuotationPDF(data);
    toast.success("Invoice opened for printing");
  };

  const handleCalculationSave = async () => {
    if (!hasValidDateRange || numberOfWeeks < 1) {
      toast.error("Please enter a valid hire date and return date.");
      return;
    }

    if (savedQuotationId) {
      try {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          hire_weeks: numberOfWeeks,
          notes: calculation.paymentTerms,
          status: "completed",
        });
      } catch (error) {
        console.error("Failed to finalize quotation:", error);
      }
    }

    toast.success("Hire quotation completed and saved!");
    setActiveStep("return");
  };

  const handleReturnQuantityChange = (
    id: string,
    field: keyof Omit<ReturnItem, "id" | "scaffoldId" | "itemCode" | "description" | "totalDelivered">,
    value: string
  ) => {
    if (returnProcessed) {
      toast.error("Return has already been processed for this hire.");
      return;
    }

    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextItem = { ...item, [field]: value };
        const totalReturned =
          parseNumber(nextItem.good) +
          parseNumber(nextItem.dirty) +
          parseNumber(nextItem.damaged) +
          parseNumber(nextItem.scrap);

        if (totalReturned > item.totalDelivered) {
          toast.error(`Returned quantity for ${item.description || item.itemCode} exceeds hired amount.`);
          return item;
        }

        return nextItem;
      })
    );
  };

  const handleProcessReturn = async () => {
    if (returnProcessed) {
      toast.error("Return has already been processed for this hire.");
      return;
    }

    if (!returnItems.length) {
      toast.error("No items available for return.");
      return;
    }

    const hasReturn = returnItems.some((item) =>
      parseNumber(item.good) +
        parseNumber(item.dirty) +
        parseNumber(item.damaged) +
        parseNumber(item.scrap) >
      0
    );

    if (!hasReturn) {
      toast.error("Enter at least one returned quantity.");
      return;
    }

    for (const item of returnItems) {
      const totalReturned =
        parseNumber(item.good) +
        parseNumber(item.dirty) +
        parseNumber(item.damaged) +
        parseNumber(item.scrap);
      if (totalReturned > item.totalDelivered) {
        toast.error(`Returned quantity for ${item.description || item.itemCode} exceeds delivered amount.`);
        return;
      }
    }

    if (!scaffolds?.length) {
      toast.error("Inventory data not loaded. Please try again.");
      return;
    }

    const inventoryReturnItems = returnItems
      .filter((item) => item.scaffoldId)
      .map((item) => ({
        scaffoldId: item.scaffoldId as string,
        quantity: parseNumber(item.good) + parseNumber(item.dirty),
      }))
      .filter((item) => item.quantity > 0);

    if (!user?.id) {
      toast.error("You must be logged in to process returns");
      return;
    }
    const reportedByUserId = user.id;
    const conditionPriority: Record<string, "low" | "medium" | "high" | "urgent"> = {
      dirty: "low",
      damaged: "high",
      scrap: "urgent",
    };

    const maintenanceEntries = returnItems
      .flatMap((item) => {
        const entries: { condition: "dirty" | "damaged" | "scrap"; qty: number }[] = [
          { condition: "dirty", qty: parseNumber(item.dirty) },
          { condition: "damaged", qty: parseNumber(item.damaged) },
          { condition: "scrap", qty: parseNumber(item.scrap) },
        ];

        return entries
          .filter((entry) => entry.qty > 0)
          .map((entry) => ({
            scaffold_id: item.scaffoldId || "",
            issue_description: `Return condition: ${entry.condition}. Quantity: ${entry.qty}. Quotation: ${
              header.quotationNo || "N/A"
            }. Client: ${header.clientCompanyName || "N/A"}.`,
            reported_by: reportedByUserId,
            priority: conditionPriority[entry.condition],
          }));
      })
      .filter((entry) => entry.scaffold_id);

    try {
      if (inventoryReturnItems.length) {
        await returnInventory.mutateAsync({ items: inventoryReturnItems, scaffolds });
      }
      if (maintenanceEntries.length) {
        await createMaintenanceLogs.mutateAsync(maintenanceEntries);
      }
      setReturnProcessed(true);
      toast.success("Hire return processed successfully!");
    } catch (error) {
      console.error("Failed to process return:", error);
    }
  };

  const availableScaffolds = scaffolds?.filter(s => 
    (s.quantity ?? 0) > 0 && s.status === "available"
  ) || [];
  const normalizedItemCodeSearch = itemCodeSearch.trim().toLowerCase();
  const filteredScaffolds = (() => {
    if (!normalizedItemCodeSearch) return availableScaffolds;
    const matches = availableScaffolds.filter((scaffold) => {
      const partNumber = scaffold.part_number?.toLowerCase() ?? "";
      const description = scaffold.description?.toLowerCase() ?? "";
      const scaffoldType = scaffold.scaffold_type?.toLowerCase() ?? "";
      return (
        partNumber.includes(normalizedItemCodeSearch) ||
        description.includes(normalizedItemCodeSearch) ||
        scaffoldType.includes(normalizedItemCodeSearch)
      );
    });
    if (!matches.length) return availableScaffolds;
    const matchIds = new Set(matches.map(match => match.id));
    const remaining = availableScaffolds.filter(scaffold => !matchIds.has(scaffold.id));
    return [...matches, ...remaining];
  })();

  const handleItemCodeSearchChange = (value: string) => {
    setItemCodeSearch(value);
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) return;
    const exactMatch = availableScaffolds.find(
      scaffold => (scaffold.part_number ?? "").toLowerCase() === normalizedValue
    );
    if (exactMatch) {
      setSelectedScaffoldId(exactMatch.id);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Hire Quotation Workflow</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create quotations with equipment from inventory → generate hire quotation report → confirm delivery quantities → generate delivery notes → calculate hire totals → process hire returns
          {header.quotationNo && <span className="ml-2 font-medium text-primary">({header.quotationNo})</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
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
                    isComplete ? "bg-success text-success-foreground" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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

        {/* Step 1: Client Details */}
        {activeStep === "client" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Quotation No</Label>
                <Input value={header.quotationNo || "Will be generated on save"} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Date Created</Label>
                <Input value={header.dateCreated} readOnly className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="clientCompanyName">Client Company Name *</Label>
                <Input
                  id="clientCompanyName"
                  value={header.clientCompanyName}
                  onChange={(e) => setHeader(prev => ({ ...prev, clientCompanyName: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <Input id="quoteNumber" value={header.quotationNo || "Will be generated on save"} readOnly className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="clientName">Contact Person *</Label>
                <Input
                  id="clientName"
                  value={header.clientName}
                  onChange={(e) => setHeader(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Client Phone *</Label>
                <Input
                  id="clientPhone"
                  value={header.clientPhone}
                  onChange={(e) => setHeader(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="Phone"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={header.clientEmail}
                  onChange={(e) => setHeader(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label htmlFor="officeTel">Office Tel</Label>
                <Input
                  id="officeTel"
                  value={header.officeTel}
                  onChange={(e) => setHeader(prev => ({ ...prev, officeTel: e.target.value }))}
                  placeholder="Office telephone"
                />
              </div>
              <div>
                <Label htmlFor="officeEmail">Office Email</Label>
                <Input
                  id="officeEmail"
                  type="email"
                  value={header.officeEmail}
                  onChange={(e) => setHeader(prev => ({ ...prev, officeEmail: e.target.value }))}
                  placeholder="Office email"
                />
              </div>
              <div>
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  value={header.siteName}
                  onChange={(e) => setHeader(prev => ({ ...prev, siteName: e.target.value }))}
                  placeholder="Site name"
                />
              </div>
              <div>
                <Label htmlFor="siteLocation">Site Location</Label>
                <Input
                  id="siteLocation"
                  value={header.siteLocation}
                  onChange={(e) => setHeader(prev => ({ ...prev, siteLocation: e.target.value }))}
                  placeholder="City or area"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="siteAddress">Site Address</Label>
                <Textarea
                  id="siteAddress"
                  rows={2}
                  value={header.siteAddress}
                  onChange={(e) => setHeader(prev => ({ ...prev, siteAddress: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerOrderNo">Customer Order Number</Label>
                <Input
                  id="customerOrderNo"
                  value={header.customerOrderNo}
                  onChange={(e) => setHeader(prev => ({ ...prev, customerOrderNo: e.target.value }))}
                  placeholder="Order number"
                />
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Ordering</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Official orders used?", field: "officialOrdersUsed" },
                    { label: "Bulk orders used?", field: "bulkOrdersUsed" },
                    { label: "New order for every quote", field: "newOrderForEveryQuote" },
                    { label: "Telephonic orders", field: "telephonicOrders" },
                    { label: "Person's name as order", field: "personsNameAsOrder" },
                    { label: "Requisition number used?", field: "requisitionNumberUsed" },
                  ].map(item => (
                    <div key={item.field}>
                      <Label className="text-sm">{item.label}</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={header[item.field as keyof QuotationHeader] === "yes"}
                            onCheckedChange={(checked) =>
                              handleYesNoChange(item.field as keyof QuotationHeader, checked ? "yes" : "")
                            }
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={header[item.field as keyof QuotationHeader] === "no"}
                            onCheckedChange={(checked) =>
                              handleYesNoChange(item.field as keyof QuotationHeader, checked ? "no" : "")
                            }
                          />
                          No
                        </label>
                      </div>
                    </div>
                  ))}
                  <div>
                    <Label htmlFor="personsName">Person's Name</Label>
                    <Input
                      id="personsName"
                      value={header.personsName}
                      onChange={(e) => setHeader(prev => ({ ...prev, personsName: e.target.value }))}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="requisitionNo">Requisition Number</Label>
                    <Input
                      id="requisitionNo"
                      value={header.requisitionNo}
                      onChange={(e) => setHeader(prev => ({ ...prev, requisitionNo: e.target.value }))}
                      placeholder="Requisition number"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Transport</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="fixedRateAgreed">Fixed Rate Agreed</Label>
                    <Input
                      id="fixedRateAgreed"
                      value={header.fixedRateAgreed}
                      onChange={(e) => setHeader(prev => ({ ...prev, fixedRateAgreed: e.target.value }))}
                      placeholder="Fixed rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="returns">Returns</Label>
                    <Input
                      id="returns"
                      value={header.returns}
                      onChange={(e) => setHeader(prev => ({ ...prev, returns: e.target.value }))}
                      placeholder="Return details"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery">Delivery</Label>
                    <Input
                      id="delivery"
                      value={header.delivery}
                      onChange={(e) => setHeader(prev => ({ ...prev, delivery: e.target.value }))}
                      placeholder="Delivery details"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="specialTransportArrangement">Special Transport Arrangement</Label>
                    <Textarea
                      id="specialTransportArrangement"
                      rows={2}
                      value={header.specialTransportArrangement}
                      onChange={(e) => setHeader(prev => ({ ...prev, specialTransportArrangement: e.target.value }))}
                      placeholder="Special arrangements"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Discounts</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Product</th>
                        <th className="px-3 py-2 text-left font-medium">Hire Discount</th>
                        <th className="px-3 py-2 text-left font-medium">Sales Discount</th>
                        <th className="px-3 py-2 text-left font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((line, index) => (
                        <tr key={line.type} className="border-b border-border">
                          <td className="px-3 py-2 font-medium">{line.type}</td>
                          <td className="px-3 py-2">
                            <Input
                              value={line.product}
                              onChange={(e) => {
                                const value = e.target.value;
                                setDiscounts(prev =>
                                  prev.map((item, idx) => (idx === index ? { ...item, product: value } : item))
                                );
                              }}
                              placeholder="Product"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={line.hireDiscount}
                              onChange={(e) => {
                                const value = e.target.value;
                                setDiscounts(prev =>
                                  prev.map((item, idx) => (idx === index ? { ...item, hireDiscount: value } : item))
                                );
                              }}
                              placeholder="%"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={line.salesDiscount}
                              onChange={(e) => {
                                const value = e.target.value;
                                setDiscounts(prev =>
                                  prev.map((item, idx) => (idx === index ? { ...item, salesDiscount: value } : item))
                                );
                              }}
                              placeholder="%"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={line.rate}
                              onChange={(e) => {
                                const value = e.target.value;
                                setDiscounts(prev =>
                                  prev.map((item, idx) => (idx === index ? { ...item, rate: value } : item))
                                );
                              }}
                              placeholder="Rate"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Project Type</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {["Building", "Education", "Healthcare", "Office Blocks"].map(value => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.projectTypes.includes(value)}
                        onCheckedChange={() => toggleSelection("projectTypes", value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Market Segmentation</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {["Residential", "Shopping Centres", "Tourism / Hotels"].map(value => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.marketSegments.includes(value)}
                        onCheckedChange={() => toggleSelection("marketSegments", value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Civils</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {["Infrastructure", "Mines", "Petrochemical"].map(value => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.civilsSegments.includes(value)}
                        onCheckedChange={() => toggleSelection("civilsSegments", value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Scaffolding</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {["Building Industry", "Civils Industry", "Industrial Industry"].map(value => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.scaffoldingSegments.includes(value)}
                        onCheckedChange={() => toggleSelection("scaffoldingSegments", value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="createdBy">Created By</Label>
                <Input
                  id="createdBy"
                  value={header.createdBy}
                  onChange={(e) => setHeader(prev => ({ ...prev, createdBy: e.target.value }))}
                  placeholder="User name"
                />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">* Required fields</p>
              <Button 
                type="button" 
                onClick={handleHeaderSave}
                disabled={createQuotation.isPending || updateQuotation.isPending}
              >
                {createQuotation.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Equipment Selection */}
        {activeStep === "equipment" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Select Equipment from Inventory
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="itemCodeSearch">Item Code</Label>
                  <Input
                    id="itemCodeSearch"
                    value={itemCodeSearch}
                    onChange={(e) => handleItemCodeSearchChange(e.target.value)}
                    placeholder="Enter part number to filter or auto-select"
                    className="mt-2"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Type a part number to auto-select and move matching items to the top of the list.
                  </p>
                  <Label className="mt-4 block">Select Item</Label>
                  <Select
                    value={selectedScaffoldId}
                    onValueChange={(value) => {
                      setSelectedScaffoldId(value);
                      const selected = availableScaffolds.find(scaffold => scaffold.id === value);
                      if (selected?.part_number) {
                        setItemCodeSearch(selected.part_number);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={scaffoldsLoading ? "Loading inventory..." : "Choose from inventory"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {filteredScaffolds.length > 0 ? (
                        filteredScaffolds.map(scaffold => {
                          const alreadyAdded = equipmentItems.reduce((total, item) => {
                            if (item.scaffoldId !== scaffold.id) return total;
                            return total + parseNumber(item.qtyDelivered);
                          }, 0);
                          const remainingQty = Math.max((scaffold.quantity ?? 0) - alreadyAdded, 0);
                          return (
                            <SelectItem key={scaffold.id} value={scaffold.id}>
                              {scaffold.part_number} - {scaffold.description || scaffold.scaffold_type} 
                              (Qty: {scaffold.quantity}, Remaining: {remainingQty}, Rate: {formatCurrency(scaffold.weekly_rate || 0)}/week)
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No inventory items match that code.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={selectedScaffoldId ? 1 : 0}
                      max={selectedScaffoldId ? Math.max(remainingSelectedQty, 0) : undefined}
                      value={equipmentQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!selectedScaffoldId) {
                          setEquipmentQuantity(value);
                          return;
                        }
                        if (value === "") {
                          setEquipmentQuantity(value);
                          return;
                        }
                        const nextValue = parseNumber(value);
                        if (remainingSelectedQty <= 0) {
                          setEquipmentQuantity("0");
                          return;
                        }
                        const capped = Math.min(Math.max(nextValue, 1), remainingSelectedQty);
                        setEquipmentQuantity(String(capped));
                      }}
                      disabled={!selectedScaffoldId || remainingSelectedQty <= 0}
                    />
                    <Button type="button" onClick={handleAddFromInventory} size="icon" disabled={addDisabled}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedScaffoldId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Remaining in inventory: {remainingSelectedQty}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Equipment Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Part No</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Mass/Item</th>
                    <th className="px-3 py-2 text-right font-medium">Weekly Rate</th>
                    <th className="px-3 py-2 text-right font-medium">Discount (%)</th>
                    <th className="px-3 py-2 text-right font-medium">Hire</th>
                    <th className="px-3 py-2 text-right font-medium">Weekly Total</th>
                    <th className="px-3 py-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                        No equipment added. Select items from inventory above.
                      </td>
                    </tr>
                  ) : (
                    equipmentItems.map((item, idx) => {
                      const qty = parseNumber(item.qtyDelivered);
                      const rate = parseNumber(item.weeklyRate);
                      const mass = parseNumber(item.massPerItem);
                      const discountRate = Math.min(Math.max(parseNumber(item.hireDiscount), 0), 100) / 100;
                      const hireRate = Math.max(rate * (1 - discountRate), 0);
                      const weeklyTotal = qty * hireRate;
                      return (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-3 py-2">{item.itemCode || "-"}</td>
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2 text-right">{qty}</td>
                          <td className="px-3 py-2 text-right">{mass ? `${mass} kg` : "-"}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(rate)}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="h-8 w-20 text-right"
                              value={item.hireDiscount}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEquipmentItems((prev) =>
                                  prev.map((entry, entryIndex) =>
                                    idx === 0 || entryIndex === idx
                                      ? { ...entry, hireDiscount: value }
                                      : entry
                                  )
                                );
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(hireRate)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(weeklyTotal)}</td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {equipmentItems.length > 0 && (
                    <tr className="bg-muted/40 font-semibold">
                      <td colSpan={7} className="px-3 py-2 text-right">Weekly Hire Total:</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(weeklyHireTotal)}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button 
                type="button" 
                onClick={handleEquipmentSave}
                disabled={addLineItems.isPending || clearLineItems.isPending}
              >
                {addLineItems.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Hire Quotation */}
        {activeStep === "quotation" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Hire Quotation Summary
              </h4>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{header.clientCompanyName || "-"}</p>
                  <p>{header.clientName || "-"}</p>
                  <p>{header.clientPhone || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Site</p>
                  <p className="font-medium">{header.siteName || "-"}</p>
                  <p>{header.siteLocation || "-"}</p>
                  <p>{header.siteAddress || "-"}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {equipmentItems.length} equipment item(s) ready for the hire quotation report.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hireQuotationDiscount">Discount (%)</Label>
                <Input
                  id="hireQuotationDiscount"
                  type="number"
                  min="0"
                  max="100"
                  value={hireQuotationDiscount}
                  onChange={(e) => setHireQuotationDiscount(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  This discount will be applied to the printed hire quotation total.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handlePrintHireQuotationReport}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Hire Quotation
                </Button>
                <Button type="button" onClick={handleHireQuotationSave}>
                  Continue to Hire Delivery Note
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Hire Delivery Note */}
        {activeStep === "hire-delivery" && (
          <div className="space-y-6">
            {/* Check if this is a balance delivery */}
            {equipmentItems.some(item => item.previouslyDelivered > 0) && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <h4 className="font-semibold text-primary mb-1">Balance Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  This quotation has items from a previous delivery. The quantities shown are the balance remaining to be delivered.
                </p>
              </div>
            )}
            
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold mb-2">Hire Delivery Note</h4>
              <p className="text-sm text-muted-foreground">
                Confirm ordered quantities, record delivered quantities manually, and review balances.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Part No</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    {equipmentItems.some(item => item.previouslyDelivered > 0) && (
                      <>
                        <th className="px-3 py-2 text-right font-medium">Original Qty</th>
                        <th className="px-3 py-2 text-right font-medium">Prev. Delivered</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-right font-medium">
                      {equipmentItems.some(item => item.previouslyDelivered > 0) ? "Balance Qty" : "Order Qty"}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">This Delivery</th>
                    <th className="px-3 py-2 text-right font-medium">Remaining</th>
                  </tr>
                </thead>
        <tbody>
          {equipmentItems.length === 0 ? (
            <tr>
              <td colSpan={equipmentItems.some(item => item.previouslyDelivered > 0) ? 7 : 5} className="px-3 py-6 text-center text-muted-foreground">
                No equipment items available yet.
              </td>
            </tr>
          ) : (
            equipmentItems.map((item) => {
              const orderedQty = getOrderedQuantity(item);
              const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "");
              const remainingQty = Math.max(orderedQty - deliveredQty, 0);
              const hasPreviousDelivery = item.previouslyDelivered > 0;
              return (
                <tr key={`hire-delivery-${item.id}`} className="border-t border-border">
                  <td className="px-3 py-2">{item.itemCode || "-"}</td>
                  <td className="px-3 py-2">{item.description}</td>
                  {equipmentItems.some(i => i.previouslyDelivered > 0) && (
                    <>
                      <td className="px-3 py-2 text-right text-muted-foreground">{item.originalQuantity}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{item.previouslyDelivered}</td>
                    </>
                  )}
                  <td className="px-3 py-2 text-right font-medium">{orderedQty}</td>
                  <td className="px-3 py-2 text-right">
                    <Input
                      type="number"
                      min="0"
                      max={orderedQty}
                      className="h-8 w-24 text-right"
                      value={deliveryQuantities[item.id] ?? ""}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const nextValue = parseNumber(rawValue);
                        if (nextValue > orderedQty) {
                          toast.error("Delivery Qty cannot exceed available quantity.");
                          setDeliveryQuantities((prev) => ({ ...prev, [item.id]: String(orderedQty) }));
                          return;
                        }
                        setDeliveryQuantities((prev) => ({ ...prev, [item.id]: rawValue }));
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{remainingQty}</td>
                </tr>
              );
            })
          )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHireDeliveryAction}
                  disabled={inventoryDeducted || deductInventory.isPending}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Equipment Hired
                </Button>
                <Button type="button" variant="outline" onClick={handlePrintDeliveryNote}>
                  <Printer className="h-4 w-4 mr-2" />
                  Hire Delivery Note
                </Button>
                <Button type="button" onClick={handleNext}>
                  Continue to Delivery Note
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Hire Delivery Note */}
        {activeStep === "delivery" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Hire Delivery Note No</Label>
                <Input value={deliveryNote.deliveryNoteNo} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={deliveryNote.deliveryDate}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, deliveryDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Delivered By</Label>
                <Input
                  value={deliveryNote.deliveredBy}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, deliveredBy: e.target.value }))}
                  placeholder="Driver name"
                />
              </div>
              <div>
                <Label>Received By</Label>
                <Input
                  value={deliveryNote.receivedBy}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, receivedBy: e.target.value }))}
                  placeholder="Receiver name"
                />
              </div>
              <div>
                <Label>Vehicle No</Label>
                <Input
                  value={deliveryNote.vehicleNo}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, vehicleNo: e.target.value }))}
                  placeholder="Vehicle registration"
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Input
                  value={deliveryNote.remarks}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any special notes"
                />
              </div>
            </div>

            {/* Preview Summary */}
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h4 className="font-semibold mb-2">Delivery Summary</h4>
              <p className="text-sm text-muted-foreground">
                {equipmentItems.length} item(s) • Total mass: {equipmentItems.reduce((sum, item) => sum + parseNumber(item.qtyDelivered) * parseNumber(item.massPerItem), 0).toFixed(2)} kg
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Inventory status: {inventoryDeducted ? "Deducted" : "Pending"}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handlePrintDeliveryNote}>
                  <Printer className="h-4 w-4 mr-2" />
                  Hire Delivery Note
                </Button>
                <Button type="button" variant="outline" onClick={handlePrintHireLoadingNote}>
                  <Printer className="h-4 w-4 mr-2" />
                  Hire Loading Note
                </Button>
                <Button type="button" variant="outline" onClick={handlePrintYardVerificationNote}>
                  <Printer className="h-4 w-4 mr-2" />
                  Yard Verification Note
                </Button>
                <Button type="button" onClick={handleDeliverySave}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Calculation */}
        {activeStep === "calculation" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={calculation.hireDate}
                  onChange={(e) => setCalculation(prev => ({ ...prev, hireDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="returnDate">Return Date *</Label>
                <Input
                  id="returnDate"
                  type="date"
                  min={calculation.hireDate || undefined}
                  value={calculation.returnDate}
                  onChange={(e) => setCalculation(prev => ({ ...prev, returnDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="vatEnabled"
                    checked={calculation.vatEnabled}
                    onCheckedChange={(checked) => setCalculation(prev => ({ ...prev, vatEnabled: !!checked }))}
                  />
                  <Label htmlFor="vatEnabled" className="text-sm">Include VAT</Label>
                  {calculation.vatEnabled && (
                    <Input
                      id="vatRate"
                      type="number"
                      min="0"
                      className="w-20"
                      value={calculation.vatRate}
                      onChange={(e) => setCalculation(prev => ({ ...prev, vatRate: e.target.value }))}
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="discountRate">Discount (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  value={calculation.discountRate}
                  onChange={(e) => setCalculation(prev => ({ ...prev, discountRate: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Textarea
                  id="paymentTerms"
                  rows={2}
                  value={calculation.paymentTerms}
                  onChange={(e) => setCalculation(prev => ({ ...prev, paymentTerms: e.target.value }))}
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/40 px-4 py-2 font-semibold">Invoice Summary</div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span>Weekly Hire Total</span>
                  <span>{formatCurrency(weeklyHireTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Days</span>
                  <span>{numberOfDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted Weeks</span>
                  <span>× {numberOfWeeks}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Total for Hire Period</span>
                  <span>{formatCurrency(hireTotalForWeeks)}</span>
                </div>
                {calculation.vatEnabled && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT ({calculation.vatRate}%)</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                {discountRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount ({calculation.discountRate}%)</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Payment Total</span>
                  <span className="text-primary">{formatCurrency(paymentTotal)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handlePrintQuotation}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCalculationSave}
                  disabled={updateQuotation.isPending}
                >
                  {updateQuotation.isPending ? "Finalizing..." : "Continue to Returns"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Hire Return */}
        {activeStep === "return" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <h4 className="font-semibold mb-1">Hire Return</h4>
              <p className="text-sm text-muted-foreground">
                Record the returned quantities by condition. Good and dirty items return to inventory,
                while damaged and scrap items are logged to maintenance.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-center font-medium">Delivered</th>
                    <th className="px-3 py-2 text-center font-medium">Good</th>
                    <th className="px-3 py-2 text-center font-medium">Dirty</th>
                    <th className="px-3 py-2 text-center font-medium">Damaged</th>
                    <th className="px-3 py-2 text-center font-medium">Scrap</th>
                    <th className="px-3 py-2 text-center font-medium">Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item) => {
                    const totalReturned =
                      parseNumber(item.good) +
                      parseNumber(item.dirty) +
                      parseNumber(item.damaged) +
                      parseNumber(item.scrap);
                    return (
                      <tr key={item.id} className="border-b border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.description || item.itemCode}</div>
                          <div className="text-xs text-muted-foreground">{item.itemCode || "—"}</div>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{item.totalDelivered}</td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.good}
                            onChange={(e) => handleReturnQuantityChange(item.id, "good", e.target.value)}
                            disabled={returnProcessed || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.dirty}
                            onChange={(e) => handleReturnQuantityChange(item.id, "dirty", e.target.value)}
                            disabled={returnProcessed || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.damaged}
                            onChange={(e) => handleReturnQuantityChange(item.id, "damaged", e.target.value)}
                            disabled={returnProcessed || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.scrap}
                            onChange={(e) => handleReturnQuantityChange(item.id, "scrap", e.target.value)}
                            disabled={returnProcessed || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{totalReturned}</td>
                      </tr>
                    );
                  })}
                  {!returnItems.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        No hire items available for return yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleProcessReturn}
                disabled={returnProcessed || returnInventory.isPending || createMaintenanceLogs.isPending}
              >
                {returnProcessed ? "Return Processed" : "Process Return"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HireQuotationWorkflow;
