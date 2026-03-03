import React, { useMemo, useState, useEffect, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Truck, UserRoundPen, Plus, Trash2, Printer, PackageSearch, RotateCcw, CheckCircle2, Clock, History, ClipboardSignature, ScanBarcode, FileCheck2, ClipboardList, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useScaffolds, useDeductScaffoldInventory, useReturnScaffoldInventory, Scaffold } from "@/hooks/useScaffolds";
import { useCreateQuotation, useUpdateQuotation, useAddLineItems, useClearLineItems, useUpdateLineItemQuantities, useUpdateLineItemReturnQuantities, useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import {
  generateDeliveryNotePDF,
  generateHireLoadingNotePDF,
  generateHireQuotationReportPDF,
  generateHireReturnNotePDF,
  generateQuotationPDF,
  generateYardVerificationNotePDF,
  DeliveryNoteData,
  HireLoadingNoteData,
  HireQuotationReportData,
  HireReturnNoteData,
  QuotationCalculationData,
} from "@/lib/pdfGenerator";
import { DeliveryHistorySection, DeliveryRecord } from "./DeliveryHistorySection";
import { ReturnHistorySection, ReturnRecord } from "./ReturnHistorySection";
import { useClientSites, useCreateClientSite, useUpdateClientSite, useDeleteClientSite, deriveSiteNumber, ClientSite } from "@/hooks/useClientSites";

export type StepKey = "client" | "equipment" | "quotation" | "site-master" | "hire-delivery" | "delivery" | "return";

type QuotationHeader = {
  quotationNo: string;
  clientId: string;
  dateCreated: string;
  // Section 1 - Applicant
  tradingName: string;
  postalAddress: string;
  postalCode: string;
  physicalAddress: string;
  physicalCode: string;
  companyEmail: string;
  landline1: string;
  landline2: string;
  faxNumber: string;
  siteContactPerson: string;
  accountsContact: string;
  accountsEmail: string;
  statementDelivery: string;
  legalEntity: string;
  // Legacy fields (mapped)
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
  directors: DirectorDetails[];
  companySection: CompanySectionDetails;
  otherInformation: OtherInformationDetails;
};

type DirectorDetails = {
  fullName: string;
  idNumber: string;
  residentialTel: string;
  cellphone: string;
  residentialAddress: string;
};

type CompanySectionDetails = {
  registeredName: string;
  registrationNumber: string;
  commencementDate: string;
  registeredOffice: string;
  issuedShareCapital: string;
  judicialManagement: "yes" | "no" | "";
  compromiseDetails: string;
  holdingCompanyName: string;
  holdingCompanyRegistration: string;
  subsidiaryCompanyName: string;
  subsidiaryCompanyRegistration: string;
  auditors: string;
};

type OtherInformationDetails = {
  bankers: string;
  branchName: string;
  branchNumber: string;
  accountName: string;
  accountNumber: string;
  ownPremises: "yes" | "no" | "";
  landlordDetails: string;
  vatRegistrationNumber: string;
  authorisedPersons: string[];
  officialOrderNumbers: "yes" | "no" | "";
};

type StructuredQuotationNotes = {
  paymentTerms: string;
  clientDetails: Pick<QuotationHeader, "directors" | "companySection" | "otherInformation"> & {
    profile: Partial<QuotationHeader>;
  };
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
  warehouseAvailableQty: number;
  originalQuantity: number; // Total quantity originally ordered
  previouslyDelivered: number; // Quantity already delivered in previous deliveries
  dbBalanceQuantity: number; // Balance quantity from database (remaining to deliver)
};

type DeliveryNote = {
  deliveryNoteNo: string;
  deliveryDate: string;
  hireStartDate: string;
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
  orderedQuantity: number;
  totalDelivered: number;
  previouslyReturned: number;
  maxReturnable: number;
  returnBalance: number;
  good: string;
  dirty: string;
  damaged: string;
  scrap: string;
  massPerItem: number;
};

type TestWorkflowDraft = {
  activeStep: StepKey;
  header: QuotationHeader;
  discounts: DiscountLine[];
  calculation: QuotationCalculation;
  equipmentItems: EquipmentItem[];
  selectedScaffoldId: string;
  equipmentQuantity: string;
  itemCodeSearch: string;
  savedQuotationId?: string | null;
};

const TEST_WORKFLOW_DRAFT_KEY = "hire-workflow:test-draft";
const TEST_WORKFLOW_DRAFTS_KEY = "hire-workflow:test-drafts";
const TEST_WORKFLOW_ACTIVE_DRAFT_KEY = "hire-workflow:test-draft:active";
const TEST_WORKFLOW_DEFAULT_DRAFT_ID = "default";

const deriveTestDraftId = (header: Partial<QuotationHeader>) => {
  const clientId = header.clientId?.trim().toLowerCase();
  if (clientId) return `client:${clientId}`;

  const companyName = header.clientCompanyName?.trim().toLowerCase();
  if (companyName) return `company:${companyName}`;

  const tradingName = header.tradingName?.trim().toLowerCase();
  if (tradingName) return `trading:${tradingName}`;

  return TEST_WORKFLOW_DEFAULT_DRAFT_ID;
};

const steps: { key: StepKey; title: string; description: string; icon: typeof UserRoundPen }[] = [
  { key: "client", title: "Client Details", description: "Quotation header", icon: UserRoundPen },
  { key: "equipment", title: "Equipment", description: "Select from inventory", icon: PackageSearch },
  { key: "quotation", title: "Hire Quotation", description: "Generate report", icon: FileCheck2 },
  { key: "site-master", title: "Site Details", description: "Register client sites", icon: MapPin },
  { key: "hire-delivery", title: "Hire Loading", description: "Confirm quantities", icon: Truck },
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

const deriveClientIdFromQuotationNumber = (quotationNo?: string | null) =>
  quotationNo ? quotationNo.replace("HSQ-", "CL-") : "";

const deriveDraftIdFromClient = (quotation?: HireQuotation | null) => {
  const clientId = deriveClientIdFromQuotationNumber(quotation?.quotation_number)
    .trim()
    .toLowerCase();

  return clientId ? `client:${clientId}` : null;
};

const createEmptyDirector = (): DirectorDetails => ({
  fullName: "",
  idNumber: "",
  residentialTel: "",
  cellphone: "",
  residentialAddress: "",
});

const createDefaultCompanySection = (): CompanySectionDetails => ({
  registeredName: "",
  registrationNumber: "",
  commencementDate: "",
  registeredOffice: "",
  issuedShareCapital: "",
  judicialManagement: "",
  compromiseDetails: "",
  holdingCompanyName: "",
  holdingCompanyRegistration: "",
  subsidiaryCompanyName: "",
  subsidiaryCompanyRegistration: "",
  auditors: "",
});

const createDefaultOtherInformation = (): OtherInformationDetails => ({
  bankers: "",
  branchName: "",
  branchNumber: "",
  accountName: "",
  accountNumber: "",
  ownPremises: "",
  landlordDetails: "",
  vatRegistrationNumber: "",
  authorisedPersons: ["", "", ""],
  officialOrderNumbers: "",
});

const parseStructuredQuotationNotes = (notes: string | null | undefined): StructuredQuotationNotes => {
  if (!notes) {
    return {
      paymentTerms: "",
      clientDetails: {
        directors: Array.from({ length: 4 }, createEmptyDirector),
        companySection: createDefaultCompanySection(),
        otherInformation: createDefaultOtherInformation(),
        profile: {},
      },
    };
  }

  try {
    const parsed = JSON.parse(notes) as Partial<StructuredQuotationNotes>;
    return {
      paymentTerms: parsed.paymentTerms ?? "",
      clientDetails: {
        directors: Array.from({ length: 4 }, (_, index) => ({
          ...createEmptyDirector(),
          ...(parsed.clientDetails?.directors?.[index] ?? {}),
        })),
        companySection: {
          ...createDefaultCompanySection(),
          ...(parsed.clientDetails?.companySection ?? {}),
        },
        otherInformation: {
          ...createDefaultOtherInformation(),
          ...(parsed.clientDetails?.otherInformation ?? {}),
          authorisedPersons: Array.from({ length: 3 }, (_, index) =>
            parsed.clientDetails?.otherInformation?.authorisedPersons?.[index] ?? ""
          ),
        },
        profile: parsed.clientDetails?.profile ?? {},
      },
    };
  } catch {
    return {
      paymentTerms: notes,
      clientDetails: {
        directors: Array.from({ length: 4 }, createEmptyDirector),
        companySection: createDefaultCompanySection(),
        otherInformation: createDefaultOtherInformation(),
        profile: {},
      },
    };
  }
};

const buildStructuredQuotationNotes = (paymentTerms: string, header: QuotationHeader) =>
  JSON.stringify({
    paymentTerms,
    clientDetails: {
      directors: header.directors,
      companySection: header.companySection,
      otherInformation: header.otherInformation,
      profile: {
        postalAddress: header.postalAddress,
        postalCode: header.postalCode,
        physicalAddress: header.physicalAddress,
        physicalCode: header.physicalCode,
        companyEmail: header.companyEmail,
        landline1: header.landline1,
        landline2: header.landline2,
        faxNumber: header.faxNumber,
        siteContactPerson: header.siteContactPerson,
        accountsContact: header.accountsContact,
        accountsEmail: header.accountsEmail,
        statementDelivery: header.statementDelivery,
        legalEntity: header.legalEntity,
        clientCompanyName: header.clientCompanyName,
        clientName: header.clientName,
        clientPhone: header.clientPhone,
        clientEmail: header.clientEmail,
        officeTel: header.officeTel,
        officeEmail: header.officeEmail,
        customerOrderNo: header.customerOrderNo,
        officialOrdersUsed: header.officialOrdersUsed,
        bulkOrdersUsed: header.bulkOrdersUsed,
        newOrderForEveryQuote: header.newOrderForEveryQuote,
        telephonicOrders: header.telephonicOrders,
        personsNameAsOrder: header.personsNameAsOrder,
        personsName: header.personsName,
        requisitionNumberUsed: header.requisitionNumberUsed,
        requisitionNo: header.requisitionNo,
        fixedRateAgreed: header.fixedRateAgreed,
        returns: header.returns,
        delivery: header.delivery,
        specialTransportArrangement: header.specialTransportArrangement,
        projectTypes: header.projectTypes,
        marketSegments: header.marketSegments,
        civilsSegments: header.civilsSegments,
        scaffoldingSegments: header.scaffoldingSegments,
      },
    },
  } as StructuredQuotationNotes);

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

type ClientEntryMode = "new" | "existing";

type HireQuotationWorkflowProps = {
  onClientProcessed?: (client: ProcessedClient) => void;
  initialQuotation?: HireQuotation | null;
  initialStep?: StepKey;
  initialClientMode?: ClientEntryMode;
  initialExistingClient?: HireQuotation | null;
  isTestQuotation?: boolean;
};

const HireQuotationWorkflow = ({
  onClientProcessed,
  initialQuotation,
  initialStep,
  initialClientMode = "new",
  initialExistingClient,
  isTestQuotation = false,
}: HireQuotationWorkflowProps) => {
  const { user, profile } = useAuth();
  const { data: scaffolds, isLoading: scaffoldsLoading } = useScaffolds();
  const deductInventory = useDeductScaffoldInventory();
  const returnInventory = useReturnScaffoldInventory();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const addLineItems = useAddLineItems();
  const clearLineItems = useClearLineItems();
  const updateLineItemQuantities = useUpdateLineItemQuantities();
  const updateLineItemReturnQuantities = useUpdateLineItemReturnQuantities();
  const createMaintenanceLogs = useCreateMaintenanceLogs();
  const { data: previousQuotations = [] } = useHireQuotations();

  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [clientEntryMode, setClientEntryMode] = useState<ClientEntryMode>(initialClientMode);
  const [clientLookupQuery, setClientLookupQuery] = useState("");
  const [selectedPreviousClientId, setSelectedPreviousClientId] = useState("");

  const [activeStep, setActiveStep] = useState<StepKey>(initialStep || "client");
  const [inventoryDeducted, setInventoryDeducted] = useState(false);

  // Site Master Plan state
  const { data: clientSites, isLoading: sitesLoading } = useClientSites(savedQuotationId);
  const createClientSite = useCreateClientSite();
  const updateClientSite = useUpdateClientSite();
  const deleteClientSite = useDeleteClientSite();
  const [showSiteMasterPlan, setShowSiteMasterPlan] = useState(false);
  const [selectedDeliverySiteId, setSelectedDeliverySiteId] = useState<string>("");
  const [selectedReturnSiteId, setSelectedReturnSiteId] = useState<string>("");
  const [newSite, setNewSite] = useState({
    siteName: "",
    siteLocation: "",
    siteAddress: "",
    siteManagerName: "",
    siteManagerPhone: "",
    siteManagerEmail: "",
    siteOpenedBy: "",
    notes: "",
  });
  const [siteMasterForm, setSiteMasterForm] = useState({
    // Invoicing
    companyNameOnInvoice: "",
    officeTel: "",
    officeEmail: "",
    smName: "",
    smCell: "",
    smEmail: "",
    // Ordering
    customerOrderNumber: "",
    officialOrdersUsed: "",
    bulkOrdersUsed: "",
    newOrderEveryQuote: "",
    telephonicOrders: "",
    personsNameAsOrder: "",
    personsName: "",
    requisitionNumberUsed: "",
    requisitionNumber: "",
    // Transport
    fixedRateAgreed: "",
    transportReturns: "",
    transportDeliveries: "",
    specialTransportArrangement: "",
    // Discounts
    tonnageProduct: "", tonnageHireDiscount: "", tonnageSalesDiscount: "", tonnageRate: "",
    basketProduct: "", basketHireDiscount: "", basketSalesDiscount: "", basketRate: "",
    straightHireProduct: "", straightHireHireDiscount: "", straightHireSalesDiscount: "", straightHireRate: "",
    nettProduct: "", nettHireDiscount: "", nettSalesDiscount: "", nettRate: "",
    quoteNumber: "",
    // Project Type / Market Segmentation
    ptBuilding: false, ptEducation: false, ptHealthcare: false, ptOfficeBlocks: false,
    ptResidential: false, ptShoppingCentres: false, ptTourismHotels: false,
    msCivils: false, msInfrastructure: false, msMines: false, msPetrochemical: false,
    scScaffolding: false, scBuildingIndustry: false, scCivilsIndustry: false, scIndustrialIndustry: false,
    // Internal Information
    customerAccountNo: "",
    accountType30Day: false,
    accountTypeDeposit: false,
    moneyPaidDeposit: "",
    paymentEFT: false,
    paymentCreditCard: false,
    customerCurrent: "",
    creditLimit: "",
    currentProforma: "",
    balanceAvailable: "",
    otnoSalesman: "",
    internalSiteName: "",
    internalDate: "",
    internalSiteAddress: "",
    // Administrator
    siteOpenedBy: "",
    adminDate: "",
    siteNumber: "",
  });
  const [returnProcessed, setReturnProcessed] = useState(false);
  const [deliverySequence, setDeliverySequence] = useState(1); // Track delivery sequence for DN numbering
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryRecord[]>([]); // Track all deliveries
  const [currentDeliveryDispatched, setCurrentDeliveryDispatched] = useState(false);
  const [hireQuotationDiscount, setHireQuotationDiscount] = useState("0");
  const [quotationComments, setQuotationComments] = useState(
    "Quotes exclude transport to and from site.\nOne month deposit is required upfront.\nWe do not accept cash payments."
  );
  const [returnSequence, setReturnSequence] = useState(1);
  const [returnHistory, setReturnHistory] = useState<ReturnRecord[]>([]);
  const [returnNote, setReturnNote] = useState({
    returnNoteNo: "",
    returnDate: getToday(),
    returnedBy: "",
    receivedBy: "",
    vehicleNo: "",
    hireEndDate: getToday(),
    remarks: "",
  });
  const [header, setHeader] = useState<QuotationHeader>(() => ({
    quotationNo: "",
    clientId: "",
    dateCreated: getToday(),
    tradingName: "",
    postalAddress: "",
    postalCode: "",
    physicalAddress: "",
    physicalCode: "",
    companyEmail: "",
    landline1: "",
    landline2: "",
    faxNumber: "",
    siteContactPerson: "",
    accountsContact: "",
    accountsEmail: "",
    statementDelivery: "",
    legalEntity: "",
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
    directors: Array.from({ length: 4 }, createEmptyDirector),
    companySection: createDefaultCompanySection(),
    otherInformation: createDefaultOtherInformation(),
  }));

  const mapDatabaseLineItemsToEquipment = useCallback((lineItems: HireQuotation["line_items"] = []) => {
    return lineItems.map((lineItem) => ({
      id: lineItem.id,
      scaffoldId: lineItem.scaffold_id ?? "",
      itemCode: lineItem.part_number ?? "",
      description: lineItem.description ?? "",
      unit: "pcs",
      qtyDelivered: String(lineItem.quantity ?? 0),
      weeklyRate: String(lineItem.weekly_rate ?? 0),
      hireDiscount: String(lineItem.hire_discount ?? 0),
      massPerItem: String(lineItem.mass_per_item ?? 0),
      notes: "",
      warehouseAvailableQty: scaffolds?.find((scaffold) => scaffold.id === lineItem.scaffold_id)?.quantity ?? 0,
      originalQuantity: lineItem.quantity ?? 0,
      previouslyDelivered: lineItem.delivered_quantity ?? 0,
      dbBalanceQuantity: lineItem.balance_quantity ?? 0,
    }));
  }, [scaffolds]);

  useEffect(() => {
    setClientEntryMode(initialClientMode);
  }, [initialClientMode]);

  useEffect(() => {
    if (profile?.full_name && !header.createdBy) {
      setHeader(prev => ({ ...prev, createdBy: profile.full_name }));
    }
  }, [profile?.full_name, header.createdBy]);

  useEffect(() => {
    if (initialQuotation) {
      return;
    }

    // Prevent stale quotation IDs from previous sessions from being reused
    // when starting a new quotation (including test-quotation flows).
    setSavedQuotationId(null);
    setEquipmentItems([]);
    setRemainingQuantities({});
    setDeliveryQuantities({});
    setSelectedDeliverySiteId("");
    setSelectedReturnSiteId("");
  }, [initialQuotation, initialExistingClient?.id, initialClientMode, isTestQuotation]);

  useEffect(() => {
    if (!initialQuotation) return;

    const createdDate = initialQuotation.created_at
      ? new Date(initialQuotation.created_at).toISOString().split("T")[0]
      : getToday();

    const parsedNotes = parseStructuredQuotationNotes(initialQuotation.notes);

    setSavedQuotationId(initialQuotation.id);
    setHeader(prev => {
      const qNum = initialQuotation.quotation_number || prev.quotationNo;
      const derivedClientId = deriveClientIdFromQuotationNumber(qNum);
      const savedProfile = parsedNotes.clientDetails.profile ?? {};
      return {
        ...prev,
        ...savedProfile,
        quotationNo: qNum,
        clientId: derivedClientId,
        dateCreated: createdDate,
        tradingName: initialQuotation.company_name ?? "",
        clientCompanyName: initialQuotation.company_name ?? "",
        clientName: initialQuotation.site_manager_name ?? "",
        clientPhone: initialQuotation.site_manager_phone ?? "",
        clientEmail: initialQuotation.site_manager_email ?? "",
        companyEmail: initialQuotation.site_manager_email ?? "",
        siteContactPerson: initialQuotation.site_manager_name ?? "",
        landline1: initialQuotation.site_manager_phone ?? "",
        siteName: initialQuotation.site_name ?? "",
        siteAddress: initialQuotation.site_address ?? "",
        physicalAddress: initialQuotation.site_address ?? "",
        officialOrdersUsed: initialQuotation.official_order_required ? "yes" : "no",
        bulkOrdersUsed: initialQuotation.bulk_order_required ? "yes" : "no",
        telephonicOrders: initialQuotation.telephonic_order_acceptable ? "yes" : "no",
        specialTransportArrangement: initialQuotation.transport_arrangement ?? savedProfile.specialTransportArrangement ?? "",
        projectTypes: initialQuotation.project_type ?? savedProfile.projectTypes ?? [],
        marketSegments: initialQuotation.market_segment ?? savedProfile.marketSegments ?? [],
        customerOrderNo: initialQuotation.account_number ?? "",
        directors: parsedNotes.clientDetails.directors,
        companySection: parsedNotes.clientDetails.companySection,
        otherInformation: parsedNotes.clientDetails.otherInformation,
        createdBy: prev.createdBy || profile?.full_name || "",
      };
    });

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
      paymentTerms: parsedNotes.paymentTerms,
    }));

    // Load equipment items with balance tracking from database
    const lineItems = initialQuotation.line_items ?? [];
    const hasDeliveredItems = lineItems.some((item) => (item.delivered_quantity ?? 0) > 0);
    const hasBalanceItems = lineItems.some(item => (item.balance_quantity ?? 0) > 0);
    const hasDispatchActivity =
      hasDeliveredItems ||
      initialQuotation.status === "dispatched" ||
      initialQuotation.status === "completed" ||
      !!initialQuotation.dispatch_date;
    
    setEquipmentItems(
      lineItems.map(item => {
        const originalQty = item.quantity ?? 0;
        const deliveredQty = item.delivered_quantity ?? 0;
        const balanceQty = item.balance_quantity ?? 0;
        
        // If this quotation has a balance delivery, show only the balance quantities.
        // Once a quotation has been dispatched and fully delivered, do not allow redispatching.
        const qtyToShow = hasBalanceItems
          ? balanceQty
          : hasDispatchActivity
            ? Math.max(balanceQty, 0)
            : originalQty;
        
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
          warehouseAvailableQty: scaffolds?.find((scaffold) => scaffold.id === item.scaffold_id)?.quantity ?? 0,
          originalQuantity: originalQty,
          previouslyDelivered: deliveredQty,
          dbBalanceQuantity: balanceQty,
        };
      })
    );
    
    if (hasDispatchActivity) {
      const initialRemainingQuantities = lineItems.reduce<Record<string, number>>((acc, item) => {
        const fallbackBalance = Math.max((item.quantity ?? 0) - (item.delivered_quantity ?? 0), 0);
        acc[item.id] = Math.max(item.balance_quantity ?? fallbackBalance, 0);
        return acc;
      }, {});
      setRemainingQuantities(initialRemainingQuantities);
      setCurrentDeliveryDispatched(true);
      // Mark inventory as deducted so dispatch cannot be triggered again
      setInventoryDeducted(true);
    }

    // If this quotation has balance items from previous delivery, skip to hire-delivery step
    if (hasBalanceItems && !isTestQuotation) {
      setActiveStep("hire-delivery");
      setDeliverySequence(2); // This is at least the 2nd delivery
      setInventoryDeducted(false); // Reset so they can deliver balance
      toast.info("Loaded quotation with balance items from previous delivery. Ready for next delivery.");
    } else if (hasDispatchActivity && !isTestQuotation) {
      setActiveStep("return");
      setDeliverySequence(1);
      // inventoryDeducted already set to true above
    } else {
      setActiveStep("client");
      setDeliverySequence(1);
      setCurrentDeliveryDispatched(false);
      setInventoryDeducted(false);
    }
    setReturnProcessed(false);
  }, [initialQuotation, isTestQuotation, profile?.full_name, scaffolds]);

  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, string>>({});
  const [remainingQuantities, setRemainingQuantities] = useState<Record<string, number>>({});
  const [lastDeliveredQuantities, setLastDeliveredQuantities] = useState<Record<string, number> | null>(null);
  const [selectedScaffoldId, setSelectedScaffoldId] = useState<string>("");
  const [equipmentQuantity, setEquipmentQuantity] = useState<string>("0");
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
    hireStartDate: getToday(),
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
    if (!initialQuotation) return;

    const persistedHistory = Array.isArray(initialQuotation.delivery_history)
      ? (initialQuotation.delivery_history as DeliveryRecord[])
      : [];

    if (persistedHistory.length > 0) {
      setDeliveryHistory(persistedHistory);
      setInventoryDeducted(true);
      setCurrentDeliveryDispatched(true);
      return;
    }

    const fallbackStorageKey = savedQuotationId
      ? `hire-delivery-history:${savedQuotationId}`
      : header.quotationNo
        ? `hire-delivery-history:${header.quotationNo}`
        : null;

    if (!fallbackStorageKey) return;

    const stored = window.localStorage.getItem(fallbackStorageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        deliveryHistory?: DeliveryRecord[];
        inventoryDeducted?: boolean;
        deliverySequence?: number;
        remainingQuantities?: Record<string, number>;
        currentDeliveryDispatched?: boolean;
      };

      if (parsed.deliveryHistory) {
        setDeliveryHistory(parsed.deliveryHistory);
      }
      if (parsed.inventoryDeducted !== undefined) {
        setInventoryDeducted(parsed.inventoryDeducted);
      } else if (parsed.deliveryHistory?.length) {
        setInventoryDeducted(true);
      }
      if (parsed.deliverySequence) {
        setDeliverySequence(parsed.deliverySequence);
      }
      if (parsed.remainingQuantities) {
        setRemainingQuantities(parsed.remainingQuantities);
      }
      if (parsed.currentDeliveryDispatched !== undefined) {
        setCurrentDeliveryDispatched(parsed.currentDeliveryDispatched);
      }
    } catch (error) {
      console.error("Failed to load delivery history from storage:", error);
    }
  }, [initialQuotation, savedQuotationId, header.quotationNo]);

  // Return history localStorage persistence
  const returnStorageKey = useMemo(() => {
    if (savedQuotationId) return `hire-return-history:${savedQuotationId}`;
    if (header.quotationNo) return `hire-return-history:${header.quotationNo}`;
    return null;
  }, [savedQuotationId, header.quotationNo]);

  useEffect(() => {
    if (!returnStorageKey) return;
    const stored = window.localStorage.getItem(returnStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        returnHistory?: ReturnRecord[];
        returnProcessed?: boolean;
        returnSequence?: number;
        returnItems?: ReturnItem[];
      };
      if (parsed.returnHistory?.length) setReturnHistory(parsed.returnHistory);
      if (parsed.returnProcessed !== undefined) setReturnProcessed(parsed.returnProcessed);
      if (parsed.returnSequence) setReturnSequence(parsed.returnSequence);
      if (parsed.returnItems?.length) {
        setReturnItems(prev => prev.map(item => {
          const saved = parsed.returnItems?.find(s => s.id === item.id);
          return saved ? { ...item, previouslyReturned: saved.previouslyReturned, returnBalance: saved.returnBalance } : item;
        }));
      }
    } catch (error) {
      console.error("Failed to load return history from storage:", error);
    }
  }, [returnStorageKey]);

  // Return save effect is placed after returnItems declaration below

  useEffect(() => {
    if (!initialQuotation) return;
    if (deliveryHistory.length > 0) return;

    const lineItems = initialQuotation.line_items ?? [];
    const persistedDeliveredItems = lineItems
      .filter((item) => (item.delivered_quantity ?? 0) > 0)
      .map((item) => {
        const deliveredQty = item.delivered_quantity ?? 0;
        const massPerItem = item.mass_per_item ?? 0;
        return {
          itemCode: item.part_number ?? "",
          description: item.description ?? "",
          quantityDelivered: deliveredQty,
          balanceAfter: item.balance_quantity ?? 0,
          massPerItem,
          totalMass: deliveredQty * massPerItem,
        };
      });

    if (!persistedDeliveredItems.length) return;

    const derivedDeliveryDate =
      initialQuotation.dispatch_date ||
      initialQuotation.updated_at ||
      initialQuotation.created_at ||
      new Date().toISOString();

    setDeliveryHistory([
      {
        id: `persisted-delivery-${initialQuotation.id}`,
        deliveryNoteNumber: deriveDeliveryNoteNumber(initialQuotation.quotation_number || "", 1),
        deliveryDate: new Date(derivedDeliveryDate).toISOString().split("T")[0],
        deliveredBy: "",
        receivedBy: "",
        vehicleNo: "",
        status: "dispatched",
        items: persistedDeliveredItems,
        totalMass: persistedDeliveredItems.reduce((sum, item) => sum + item.totalMass, 0),
        createdAt: derivedDeliveryDate,
      },
    ]);
  }, [initialQuotation, deliveryHistory.length]);

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
  const [hasHydratedTestDraft, setHasHydratedTestDraft] = useState(false);

  useEffect(() => {
    if (!isTestQuotation || initialQuotation) {
      setHasHydratedTestDraft(true);
      return;
    }

    try {
      let draft: Partial<TestWorkflowDraft> | null = null;
      const storedDrafts = window.localStorage.getItem(TEST_WORKFLOW_DRAFTS_KEY);

      if (storedDrafts) {
        const draftCollection = JSON.parse(storedDrafts) as Record<string, TestWorkflowDraft>;
        const requestedDraftId = deriveDraftIdFromClient(initialExistingClient);
        const activeDraftId =
          window.localStorage.getItem(TEST_WORKFLOW_ACTIVE_DRAFT_KEY) ??
          TEST_WORKFLOW_DEFAULT_DRAFT_ID;

        if (requestedDraftId) {
          // Never hydrate another client’s draft when a client-specific context is requested.
          draft = draftCollection[requestedDraftId] ?? null;
          if (draftCollection[requestedDraftId]) {
            window.localStorage.setItem(TEST_WORKFLOW_ACTIVE_DRAFT_KEY, requestedDraftId);
          }
        } else {
          draft =
            draftCollection[activeDraftId] ??
            draftCollection[TEST_WORKFLOW_DEFAULT_DRAFT_ID] ??
            Object.values(draftCollection)[0] ??
            null;
        }
      }

      if (!draft && !initialExistingClient) {
        const storedLegacyDraft = window.localStorage.getItem(TEST_WORKFLOW_DRAFT_KEY);
        if (!storedLegacyDraft) {
          setHasHydratedTestDraft(true);
          return;
        }
        draft = JSON.parse(storedLegacyDraft) as Partial<TestWorkflowDraft>;
      }

      const allowedSteps: StepKey[] = ["client", "equipment", "quotation"];
      if (draft.activeStep && allowedSteps.includes(draft.activeStep)) {
        setActiveStep(draft.activeStep);
      }

      if (draft.header) {
        setHeader((prev) => ({ ...prev, ...draft.header }));
      }

      if (draft.discounts?.length) {
        setDiscounts(draft.discounts);
      }

      if (draft.calculation) {
        setCalculation((prev) => ({ ...prev, ...draft.calculation }));
      }


      if (typeof draft.selectedScaffoldId === "string") {
        setSelectedScaffoldId(draft.selectedScaffoldId);
      }

      if (typeof draft.equipmentQuantity === "string") {
        setEquipmentQuantity(draft.equipmentQuantity);
      }

      if (typeof draft.itemCodeSearch === "string") {
        setItemCodeSearch(draft.itemCodeSearch);
      }

      // Restore the saved quotation ID so equipment can be re-linked to the DB record
      if (draft.savedQuotationId) {
        setSavedQuotationId(draft.savedQuotationId);
        // Load equipment from DB if available (so all users see the same data)
        const dbQuotation = previousQuotations.find(q => q.id === draft.savedQuotationId);
        if (dbQuotation?.line_items?.length) {
          setEquipmentItems(mapDatabaseLineItemsToEquipment(dbQuotation.line_items));
        } else if (draft.equipmentItems?.length) {
          setEquipmentItems(draft.equipmentItems);
        }
      } else {
        if (draft.equipmentItems?.length) {
          setEquipmentItems(draft.equipmentItems);
        }
      }

      toast.success("Restored your test workflow draft.");
    } catch (error) {
      console.error("Failed to hydrate test workflow draft:", error);
    } finally {
      setHasHydratedTestDraft(true);
    }
  }, [initialExistingClient, initialQuotation, isTestQuotation, previousQuotations, mapDatabaseLineItemsToEquipment]);

  // This effect is intentionally left empty - equipment is loaded once during hydration
  // and must NOT be re-loaded on every realtime update to prevent overwriting user changes.

  useEffect(() => {
    if (!hasHydratedTestDraft || !isTestQuotation || initialQuotation) {
      return;
    }

    const draft: TestWorkflowDraft = {
      activeStep,
      header,
      discounts,
      calculation,
      equipmentItems,
      selectedScaffoldId,
      equipmentQuantity,
      itemCodeSearch,
      savedQuotationId,
    };

    const draftId = deriveTestDraftId(header);
    const existingDrafts = window.localStorage.getItem(TEST_WORKFLOW_DRAFTS_KEY);
    const draftCollection = existingDrafts
      ? (JSON.parse(existingDrafts) as Record<string, TestWorkflowDraft>)
      : {};

    draftCollection[draftId] = draft;

    window.localStorage.setItem(TEST_WORKFLOW_DRAFTS_KEY, JSON.stringify(draftCollection));
    window.localStorage.setItem(TEST_WORKFLOW_ACTIVE_DRAFT_KEY, draftId);
    window.localStorage.setItem(TEST_WORKFLOW_DRAFT_KEY, JSON.stringify(draft));
  }, [
    hasHydratedTestDraft,
    isTestQuotation,
    initialQuotation,
    activeStep,
    header,
    discounts,
    calculation,
    equipmentItems,
    selectedScaffoldId,
    equipmentQuantity,
    itemCodeSearch,
    savedQuotationId,
  ]);

  // Auto-sync equipment items to the database whenever they change (debounced).
  // This ensures test quotations are persisted for all users, not just localStorage.
  const addLineItemsForSync = useAddLineItems();
  const clearLineItemsForSync = useClearLineItems();
  useEffect(() => {
    if (!savedQuotationId || !hasHydratedTestDraft) return;
    // Only auto-sync for test quotations that have a DB record
    if (!isTestQuotation) return;

    const timer = setTimeout(async () => {
      try {
        await clearLineItemsForSync.mutateAsync(savedQuotationId);
        if (equipmentItems.length > 0) {
          await addLineItemsForSync.mutateAsync(
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
        }
      } catch (err) {
        console.error("Auto-sync equipment failed:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentItems, savedQuotationId, hasHydratedTestDraft, isTestQuotation]);


  const persistedReturnQuantitiesByItemCode = useMemo(() => {
    const quantities = new Map<string, { returned: number; balance: number | null }>();
    (initialQuotation?.line_items ?? []).forEach((lineItem) => {
      const itemCode = lineItem.part_number ?? "";
      if (!itemCode) return;

      quantities.set(itemCode, {
        returned: Math.max(lineItem.returned_quantity ?? 0, 0),
        balance:
          lineItem.return_balance_quantity === null || lineItem.return_balance_quantity === undefined
            ? null
            : Math.max(lineItem.return_balance_quantity, 0),
      });
    });
    return quantities;
  }, [initialQuotation]);

  useEffect(() => {
    setReturnItems((prev) =>
      equipmentItems.map((item) => {
        const existing = prev.find((entry) => entry.id === item.id);
        const orderedQuantity = item.originalQuantity ?? 0;
        const totalDelivered = parseNumber(item.qtyDelivered);
        const maxReturnable = Math.min(orderedQuantity, totalDelivered);
        const persistedReturns = persistedReturnQuantitiesByItemCode.get(item.itemCode);
        const persistedPreviouslyReturned = persistedReturns?.returned ?? 0;
        const persistedBalance = persistedReturns?.balance;
        const previouslyReturned = Math.min(
          Math.max(existing?.previouslyReturned ?? 0, persistedPreviouslyReturned),
          maxReturnable
        );
        const computedBalance =
          persistedBalance !== null && persistedBalance !== undefined
            ? Math.min(Math.max(persistedBalance, 0), maxReturnable)
            : Math.max(maxReturnable - previouslyReturned, 0);
        return {
          id: item.id,
          scaffoldId: item.scaffoldId,
          itemCode: item.itemCode,
          description: item.description,
          orderedQuantity,
          totalDelivered,
          previouslyReturned,
          maxReturnable,
          returnBalance: Math.min(existing?.returnBalance ?? computedBalance, computedBalance),
          good: existing?.good ?? "0",
          dirty: existing?.dirty ?? "0",
          damaged: existing?.damaged ?? "0",
          scrap: existing?.scrap ?? "0",
          massPerItem: parseNumber(item.massPerItem),
        };
      })
    );
  }, [equipmentItems, persistedReturnQuantitiesByItemCode]);

  // Persist return history to localStorage (after returnItems is declared)
  useEffect(() => {
    if (!returnStorageKey) return;
    window.localStorage.setItem(returnStorageKey, JSON.stringify({
      returnHistory,
      returnProcessed,
      returnSequence,
      returnItems,
    }));
  }, [returnStorageKey, returnHistory, returnProcessed, returnSequence, returnItems]);

  useEffect(() => {
    if (!initialQuotation) return;
    if (returnHistory.length > 0) return;

    const lineItems = initialQuotation.line_items ?? [];
    const persistedReturnItems = lineItems
      .filter((item) => (item.returned_quantity ?? 0) > 0)
      .map((item) => {
        const returnedQty = item.returned_quantity ?? 0;
        const massPerItem = item.mass_per_item ?? 0;
        return {
          itemCode: item.part_number ?? "",
          description: item.description ?? "",
          good: returnedQty,
          dirty: 0,
          damaged: 0,
          scrap: 0,
          totalReturned: returnedQty,
          balanceAfter: item.return_balance_quantity ?? 0,
          massPerItem,
          totalMass: returnedQty * massPerItem,
        };
      });

    if (!persistedReturnItems.length) return;

    setReturnHistory([
      {
        id: `persisted-return-${initialQuotation.id}`,
        returnNoteNumber: deriveReturnNoteNumber(initialQuotation.quotation_number || "", 1),
        returnDate: new Date(initialQuotation.updated_at || initialQuotation.created_at).toISOString().split("T")[0],
        hireEndDate: new Date(initialQuotation.updated_at || initialQuotation.created_at).toISOString().split("T")[0],
        returnedBy: "",
        receivedBy: "",
        vehicleNo: "",
        status: "processed",
        items: persistedReturnItems,
        totalReturned: persistedReturnItems.reduce((sum, item) => sum + item.totalReturned, 0),
        totalMass: persistedReturnItems.reduce((sum, item) => sum + item.totalMass, 0),
        createdAt: initialQuotation.updated_at || initialQuotation.created_at,
      },
    ]);
  }, [initialQuotation, returnHistory.length]);

  // Auto-fill site form from client details when entering site-master step
  useEffect(() => {
    if (activeStep === "site-master" && savedQuotationId && !clientSites?.length && !newSite.siteName) {
      handleAutoFillSiteFromClient();
    }
  }, [activeStep, savedQuotationId, clientSites?.length]);

  const workflowSteps = useMemo(
    () =>
      isTestQuotation
        ? steps.filter((step) => step.key !== "site-master" && step.key !== "hire-delivery" && step.key !== "return")
        : steps,
    [isTestQuotation]
  );

  const stepIndex = workflowSteps.findIndex((step) => step.key === activeStep);

  const weeklyHireTotal = useMemo(() => {
    return equipmentItems.reduce((total, item) => {
      const qty = parseNumber(item.qtyDelivered);
      const rate = parseNumber(item.weeklyRate);
      const discountRate = Math.min(Math.max(parseNumber(item.hireDiscount), 0), 100) / 100;
      const hireRate = Math.max(rate * (1 - discountRate), 0);
      return total + qty * hireRate;
    }, 0);
  }, [equipmentItems]);

  const hasPreviousDelivery = useMemo(
    () => equipmentItems.some((item) => item.previouslyDelivered > 0),
    [equipmentItems]
  );

  const hasBalanceDelivery = useMemo(
    () => equipmentItems.some((item) => item.dbBalanceQuantity > 0),
    [equipmentItems]
  );

  const balanceDeliveryItems = useMemo(
    () => (hasBalanceDelivery ? equipmentItems.filter((item) => item.dbBalanceQuantity > 0) : equipmentItems),
    [equipmentItems, hasBalanceDelivery]
  );

  const previousDeliveryItems = useMemo(
    () => equipmentItems.filter((item) => item.previouslyDelivered > 0),
    [equipmentItems]
  );

  const selectedScaffold = useMemo(
    () => scaffolds?.find((scaffold) => scaffold.id === selectedScaffoldId),
    [scaffolds, selectedScaffoldId]
  );
  const remainingSelectedQty = useMemo(() => {
    if (!selectedScaffold) return 0;
    if (isTestQuotation) return selectedScaffold.quantity ?? 0;

    const alreadyAdded = equipmentItems.reduce((total, item) => {
      if (item.scaffoldId !== selectedScaffold.id) return total;
      return total + parseNumber(item.qtyDelivered);
    }, 0);

    return Math.max((selectedScaffold.quantity ?? 0) - alreadyAdded, 0);
  }, [equipmentItems, isTestQuotation, selectedScaffold]);
  const addDisabled =
    !selectedScaffoldId ||
    parseNumber(equipmentQuantity) <= 0;

  const clampToInventory = (requestedQty: number, availableQty: number) => {
    if (isTestQuotation) {
      return Math.max(requestedQty, 0);
    }

    return Math.min(Math.max(requestedQty, 0), Math.max(availableQty, 0));
  };

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

  const handleAddClientSite = async () => {
    if (!savedQuotationId) {
      toast.error("Please save the client details first before adding sites.");
      return;
    }
    if (!newSite.siteName) {
      toast.error("Site name is required.");
      return;
    }
    const existingSites = clientSites || [];
    const suffix = existingSites.length === 0 ? "" : String.fromCharCode(65 + existingSites.length - 1); // A, B, C...
    const siteNumber = deriveSiteNumber(header.quotationNo, suffix);

    const createdSite = await createClientSite.mutateAsync({
      quotation_id: savedQuotationId,
      site_number: siteNumber,
      site_suffix: suffix,
      site_name: newSite.siteName,
      site_location: newSite.siteLocation || undefined,
      site_address: newSite.siteAddress || undefined,
      site_manager_name: newSite.siteManagerName || undefined,
      site_manager_phone: newSite.siteManagerPhone || undefined,
      site_manager_email: newSite.siteManagerEmail || undefined,
      site_opened_by: newSite.siteOpenedBy || undefined,
      notes: newSite.notes || undefined,
    });

    handleSelectDeliverySiteFromRow(createdSite);

    setNewSite({ siteName: "", siteLocation: "", siteAddress: "", siteManagerName: "", siteManagerPhone: "", siteManagerEmail: "", siteOpenedBy: "", notes: "" });
  };

  const handleAutoFillSiteFromClient = () => {
    setNewSite(prev => ({
      ...prev,
      siteName: header.siteName || prev.siteName,
      siteLocation: header.siteLocation || prev.siteLocation,
      siteAddress: header.siteAddress || header.physicalAddress || prev.siteAddress,
      siteManagerName: header.siteContactPerson || header.clientName || prev.siteManagerName,
      siteManagerPhone: header.landline1 || header.clientPhone || prev.siteManagerPhone,
      siteManagerEmail: header.companyEmail || header.clientEmail || prev.siteManagerEmail,
      siteOpenedBy: header.createdBy || prev.siteOpenedBy,
    }));
    // Auto-fill site master form from client/header details
    setSiteMasterForm(prev => ({
      ...prev,
      companyNameOnInvoice: header.tradingName || header.clientCompanyName || prev.companyNameOnInvoice,
      officeTel: header.landline1 || header.officeTel || prev.officeTel,
      officeEmail: header.companyEmail || header.officeEmail || prev.officeEmail,
      smName: header.siteContactPerson || header.clientName || prev.smName,
      smCell: header.clientPhone || header.landline1 || prev.smCell,
      smEmail: header.clientEmail || header.companyEmail || prev.smEmail,
      customerOrderNumber: header.customerOrderNo || prev.customerOrderNumber,
      officialOrdersUsed: header.officialOrdersUsed || prev.officialOrdersUsed,
      bulkOrdersUsed: header.bulkOrdersUsed || prev.bulkOrdersUsed,
      newOrderEveryQuote: header.newOrderForEveryQuote || prev.newOrderEveryQuote,
      telephonicOrders: header.telephonicOrders || prev.telephonicOrders,
      personsNameAsOrder: header.personsNameAsOrder || prev.personsNameAsOrder,
      personsName: header.personsName || prev.personsName,
      requisitionNumberUsed: header.requisitionNumberUsed || prev.requisitionNumberUsed,
      requisitionNumber: header.requisitionNo || prev.requisitionNumber,
      fixedRateAgreed: header.fixedRateAgreed || prev.fixedRateAgreed,
      transportReturns: header.returns || prev.transportReturns,
      transportDeliveries: header.delivery || prev.transportDeliveries,
      specialTransportArrangement: header.specialTransportArrangement || prev.specialTransportArrangement,
      tonnageHireDiscount: discounts[0]?.hireDiscount || prev.tonnageHireDiscount,
      basketHireDiscount: discounts[1]?.hireDiscount || prev.basketHireDiscount,
      straightHireHireDiscount: discounts[2]?.hireDiscount || prev.straightHireHireDiscount,
      nettHireDiscount: discounts[3]?.hireDiscount || prev.nettHireDiscount,
      quoteNumber: header.quotationNo || prev.quoteNumber,
      ptBuilding: header.projectTypes.includes("Building") || prev.ptBuilding,
      ptEducation: header.projectTypes.includes("Education") || prev.ptEducation,
      ptHealthcare: header.projectTypes.includes("Healthcare") || prev.ptHealthcare,
      ptOfficeBlocks: header.projectTypes.includes("Office Blocks") || prev.ptOfficeBlocks,
      ptResidential: header.projectTypes.includes("Residential") || prev.ptResidential,
      ptShoppingCentres: header.projectTypes.includes("Shopping Centres") || prev.ptShoppingCentres,
      ptTourismHotels: header.projectTypes.includes("Tourism / Hotels") || prev.ptTourismHotels,
      msCivils: header.civilsSegments?.includes("Civils") || header.marketSegments?.includes("Civils") || prev.msCivils,
      msInfrastructure: header.civilsSegments?.includes("Infrastructure") || header.marketSegments?.includes("Infrastructure") || prev.msInfrastructure,
      msMines: header.civilsSegments?.includes("Mines") || header.marketSegments?.includes("Mines") || prev.msMines,
      msPetrochemical: header.civilsSegments?.includes("Petrochemical") || header.marketSegments?.includes("Petrochemical") || prev.msPetrochemical,
      scScaffolding: header.scaffoldingSegments?.includes("Scaffolding") || prev.scScaffolding,
      scBuildingIndustry: header.scaffoldingSegments?.includes("Building Industry") || prev.scBuildingIndustry,
      scCivilsIndustry: header.scaffoldingSegments?.includes("Civils Industry") || prev.scCivilsIndustry,
      scIndustrialIndustry: header.scaffoldingSegments?.includes("Industrial Industry") || prev.scIndustrialIndustry,
      otnoSalesman: header.createdBy || prev.otnoSalesman,
      internalSiteName: header.siteName || prev.internalSiteName,
      internalSiteAddress: header.siteAddress || header.physicalAddress || prev.internalSiteAddress,
      internalDate: header.dateCreated || prev.internalDate,
      siteOpenedBy: header.createdBy || prev.siteOpenedBy,
      adminDate: header.dateCreated || prev.adminDate,
      siteNumber: deriveSiteNumber(header.quotationNo, clientSites?.length ? String.fromCharCode(65 + clientSites.length - 1) : ""),
    }));
    toast.success("Site details auto-filled from client information");
  };

  const getSelectedSiteNumber = (selectedSiteId: string) => {
    if (!selectedSiteId) return "";
    const site = clientSites?.find(s => s.id === selectedSiteId);
    return site?.site_number || "";
  };

  const handleSelectDeliverySite = (siteId: string) => {
    setSelectedDeliverySiteId(siteId);
    const site = clientSites?.find(s => s.id === siteId);
    if (site) {
      setHeader(prev => ({
        ...prev,
        siteName: site.site_name,
        siteLocation: site.site_location || prev.siteLocation,
        siteAddress: site.site_address || prev.siteAddress,
      }));
      setDeliveryNote(prev => ({
        ...prev,
        remarks: `Site: ${site.site_number} - ${site.site_name}`,
      }));
      toast.success(`Delivery linked to site ${site.site_number}`);
    }
  };

  const handleSelectDeliverySiteFromRow = (site: ClientSite) => {
    setSelectedDeliverySiteId(site.id);
    setSelectedReturnSiteId(site.id);
    setHeader(prev => ({
      ...prev,
      siteName: site.site_name,
      siteLocation: site.site_location || prev.siteLocation,
      siteAddress: site.site_address || prev.siteAddress,
    }));
    setDeliveryNote(prev => ({
      ...prev,
      remarks: `Site: ${site.site_number} - ${site.site_name}`,
    }));
    toast.success(`Site ${site.site_number} selected for this hire loading.`);
  };

  const handleSelectReturnSite = (siteId: string) => {
    setSelectedReturnSiteId(siteId);
    const site = clientSites?.find(s => s.id === siteId);
    if (site) {
      toast.success(`Hire return linked to site ${site.site_number}`);
    }
  };

  const handleNext = () => {
    const currentIndex = workflowSteps.findIndex((step) => step.key === activeStep);
    const nextStep = workflowSteps[currentIndex + 1];
    if (nextStep) {
      setActiveStep(nextStep.key);
    }
  };

  const handleBack = () => {
    const currentIndex = workflowSteps.findIndex((step) => step.key === activeStep);
    const prevStep = workflowSteps[currentIndex - 1];
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
      const stringValues = currentValues as string[];
      const nextValues = stringValues.includes(value)
        ? stringValues.filter(item => item !== value)
        : [...stringValues, value];
      return { ...prev, [field]: nextValues };
    });
  };

  const previousClientMatches = useMemo(() => {
    const query = clientLookupQuery.trim().toLowerCase();
    const seen = new Set<string>();

    return previousQuotations.filter((quotation) => {
      const companyName = quotation.company_name?.trim() || "";
      const companyKey = companyName.toLowerCase();
      const clientId = deriveClientIdFromQuotationNumber(quotation.quotation_number).toLowerCase();
      const uniqueKey = `${companyKey}|${clientId}`;

      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);

      if (!query) return true;
      return companyKey.includes(query) || clientId.includes(query);
    }).slice(0, 8);
  }, [clientLookupQuery, previousQuotations]);

  useEffect(() => {
    if (!previousClientMatches.length) {
      setSelectedPreviousClientId("");
      return;
    }

    const selectedStillVisible = previousClientMatches.some((quotation) => quotation.id === selectedPreviousClientId);
    if (!selectedStillVisible) {
      setSelectedPreviousClientId("");
    }
  }, [previousClientMatches, selectedPreviousClientId]);

  const handleSelectPreviousClient = (quotation: HireQuotation) => {
    // Treat client selection as a context switch to prevent cross-client equipment carry-over.
    const existingEquipment =
      isTestQuotation && quotation.line_items?.length
        ? mapDatabaseLineItemsToEquipment(quotation.line_items)
        : [];

    setEquipmentItems(existingEquipment);
    setRemainingQuantities({});
    setDeliveryQuantities({});
    setSelectedScaffoldId("");
    setEquipmentQuantity("0");
    setItemCodeSearch("");
    setLastDeliveredQuantities(null);
    setSavedQuotationId(isTestQuotation ? quotation.id : null);

    const derivedClientId = deriveClientIdFromQuotationNumber(quotation.quotation_number);
    const parsedNotes = parseStructuredQuotationNotes(quotation.notes);
    const savedProfile = parsedNotes.clientDetails.profile ?? {};

    setHeader((prev) => ({
      ...prev,
      // From saved profile (lower priority)
      postalAddress: savedProfile.postalAddress ?? prev.postalAddress,
      postalCode: savedProfile.postalCode ?? prev.postalCode,
      landline2: savedProfile.landline2 ?? prev.landline2,
      faxNumber: savedProfile.faxNumber ?? prev.faxNumber,
      accountsContact: savedProfile.accountsContact ?? prev.accountsContact,
      accountsEmail: savedProfile.accountsEmail ?? prev.accountsEmail,
      statementDelivery: savedProfile.statementDelivery ?? prev.statementDelivery,
      legalEntity: savedProfile.legalEntity ?? prev.legalEntity,
      officeTel: savedProfile.officeTel ?? prev.officeTel,
      officeEmail: savedProfile.officeEmail ?? prev.officeEmail,
      newOrderForEveryQuote: savedProfile.newOrderForEveryQuote ?? prev.newOrderForEveryQuote,
      personsNameAsOrder: savedProfile.personsNameAsOrder ?? prev.personsNameAsOrder,
      personsName: savedProfile.personsName ?? prev.personsName,
      requisitionNumberUsed: savedProfile.requisitionNumberUsed ?? prev.requisitionNumberUsed,
      requisitionNo: savedProfile.requisitionNo ?? prev.requisitionNo,
      fixedRateAgreed: savedProfile.fixedRateAgreed ?? prev.fixedRateAgreed,
      returns: savedProfile.returns ?? prev.returns,
      delivery: savedProfile.delivery ?? prev.delivery,
      civilsSegments: savedProfile.civilsSegments ?? prev.civilsSegments,
      scaffoldingSegments: savedProfile.scaffoldingSegments ?? prev.scaffoldingSegments,
      // From quotation (higher priority, overrides savedProfile)
      clientId: derivedClientId || prev.clientId,
      tradingName: quotation.company_name ?? "",
      clientCompanyName: quotation.company_name ?? "",
      siteContactPerson: quotation.site_manager_name ?? "",
      clientName: quotation.site_manager_name ?? "",
      landline1: quotation.site_manager_phone ?? savedProfile.landline1 ?? prev.landline1,
      clientPhone: quotation.site_manager_phone ?? "",
      companyEmail: quotation.site_manager_email ?? savedProfile.companyEmail ?? prev.companyEmail,
      clientEmail: quotation.site_manager_email ?? "",
      physicalAddress: quotation.company_address ?? savedProfile.physicalAddress ?? prev.physicalAddress,
      siteAddress: "",
      siteLocation: quotation.delivery_address ?? "",
      officialOrdersUsed: quotation.official_order_required ? "yes" : (savedProfile.officialOrdersUsed ?? prev.officialOrdersUsed),
      bulkOrdersUsed: quotation.bulk_order_required ? "yes" : (savedProfile.bulkOrdersUsed ?? prev.bulkOrdersUsed),
      telephonicOrders: quotation.telephonic_order_acceptable ? "yes" : (savedProfile.telephonicOrders ?? prev.telephonicOrders),
      specialTransportArrangement: quotation.transport_arrangement ?? savedProfile.specialTransportArrangement ?? "",
      customerOrderNo: quotation.account_number ?? "",
      projectTypes: quotation.project_type ?? savedProfile.projectTypes ?? [],
      marketSegments: quotation.market_segment ?? savedProfile.marketSegments ?? [],
      directors: parsedNotes.clientDetails.directors,
      companySection: parsedNotes.clientDetails.companySection,
      otherInformation: parsedNotes.clientDetails.otherInformation,
      siteName: "",
      physicalCode: "",
    }));

    setDiscounts([
      { type: "Tonnage", product: "", hireDiscount: String(quotation.tonnage_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Basket", product: "", hireDiscount: String(quotation.basket_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Straight Hire", product: "", hireDiscount: String(quotation.tube_clamp_discount ?? ""), salesDiscount: "", rate: "" },
      { type: "Nett", product: "", hireDiscount: String(quotation.other_discount ?? ""), salesDiscount: "", rate: "" },
    ]);

    setClientLookupQuery(derivedClientId || quotation.company_name || "");
    toast.success("Client credentials loaded. Enter the new site details to continue.");
  };

  useEffect(() => {
    if (!initialExistingClient) return;
    if (initialClientMode === "existing") {
      setClientEntryMode("existing");
    }
    handleSelectPreviousClient(initialExistingClient);
  }, [initialClientMode, initialExistingClient]);

  const validateHeader = () => {
    // For test quotations, all fields are optional
    if (isTestQuotation) return true;
    if (!header.tradingName && !header.clientCompanyName) {
      toast.error("Trading Name / Company Name is required.");
      return false;
    }
    if (!header.siteContactPerson && !header.clientName) {
      toast.error("Site Contact Person is required.");
      return false;
    }
    if (!header.landline1 && !header.clientPhone) {
      toast.error("At least one telephone number is required.");
      return false;
    }
    return true;
  };

  // Auto-create or update DB record — used by both test and real quotations.
  // For test quotations this is called silently; for real quotations validation runs first.
  const ensureQuotationSaved = async (silent = false): Promise<string | null> => {
    if (!user) {
      if (!silent) toast.error("Please log in to create a quotation");
      return null;
    }
    try {
      const companyName = header.tradingName || header.clientCompanyName || "Test Client";
      const contactName = header.siteContactPerson || header.clientName || undefined;
      const contactPhone = header.landline1 || header.clientPhone || undefined;
      const contactEmail = header.companyEmail || header.clientEmail || undefined;
      const structuredNotes = buildStructuredQuotationNotes(calculation.paymentTerms, header);

      if (!savedQuotationId) {
        const quotation = await createQuotation.mutateAsync({
          company_name: companyName,
          site_name: header.siteName || undefined,
          site_address: header.physicalAddress || header.siteAddress || undefined,
          site_manager_name: contactName,
          site_manager_phone: contactPhone,
          site_manager_email: contactEmail,
          delivery_address: header.siteLocation || undefined,
          notes: structuredNotes,
        });
        setSavedQuotationId(quotation.id);
        const clientId = deriveClientIdFromQuotationNumber(quotation.quotation_number);
        setHeader(prev => ({
          ...prev,
          quotationNo: quotation.quotation_number,
          clientId,
          clientCompanyName: companyName,
          clientName: contactName || prev.clientName,
          clientPhone: contactPhone || prev.clientPhone,
          clientEmail: contactEmail || prev.clientEmail,
        }));
        if (!silent) toast.success(`Client ID: ${clientId} — ${quotation.quotation_number}`);
        return quotation.id;
      } else {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          company_name: companyName,
          site_name: header.siteName || undefined,
          site_address: header.physicalAddress || header.siteAddress || undefined,
          site_manager_name: contactName,
          site_manager_phone: contactPhone,
          site_manager_email: contactEmail,
          delivery_address: header.siteLocation || undefined,
          notes: structuredNotes,
        });
        return savedQuotationId;
      }
    } catch (error) {
      console.error("Failed to save quotation:", error);
      return null;
    }
  };

  const handleHeaderSave = async () => {
    if (!validateHeader()) return;
    const id = await ensureQuotationSaved(false);
    if (id) handleNext();
  };

  const handleAddFromInventory = async () => {
    if (!selectedScaffoldId) {
      toast.error("Please select an item from inventory");
      return;
    }
    // For test quotations: silently create DB record before adding equipment so items persist
    if (isTestQuotation && !savedQuotationId) {
      await ensureQuotationSaved(true);
    }
    
    const scaffold = scaffolds?.find(s => s.id === selectedScaffoldId);
    if (!scaffold) return;

    const qty = parseNumber(equipmentQuantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const availableQty = scaffold.quantity ?? 0;
    const existingItem = equipmentItems.find(item => item.scaffoldId === scaffold.id);
    const alreadyAdded = existingItem ? parseNumber(existingItem.qtyDelivered) : 0;
    const totalRequested = clampToInventory(alreadyAdded + qty, availableQty);

    if (!isTestQuotation && alreadyAdded + qty > availableQty) {
      toast.error(`Cannot request more than ${availableQty} item(s) available in inventory.`);
    }

    const existingIndex = equipmentItems.findIndex(item => item.scaffoldId === scaffold.id);
    if (existingIndex >= 0) {
      setEquipmentItems(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, qtyDelivered: String(totalRequested) }
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
        qtyDelivered: String(clampToInventory(qty, availableQty)),
        weeklyRate: String(scaffold.weekly_rate || 0),
        hireDiscount: inheritedDiscount,
        massPerItem: String(scaffold.mass_per_item || 0),
        notes: "",
        warehouseAvailableQty: scaffold.quantity ?? 0,
        originalQuantity: clampToInventory(qty, availableQty),
        previouslyDelivered: 0,
        dbBalanceQuantity: 0,
      };
      setEquipmentItems(prev => [...prev, newItem]);
      toast.success(`Added ${scaffold.description || scaffold.part_number}`);
    }

    setSelectedScaffoldId("");
    setItemCodeSearch("");
    setEquipmentQuantity("0");
  };

  const isEquipmentItemLocked = useCallback((item: EquipmentItem) => {
    if (item.previouslyDelivered > 0) return true;

    const deliveredFromHistory = deliveryHistory.some((delivery) =>
      delivery.items.some(
        (deliveryItem) =>
          deliveryItem.itemCode === item.itemCode && deliveryItem.quantityDelivered > 0
      )
    );
    if (deliveredFromHistory) return true;

    const returnedFromHistory = returnHistory.some((record) =>
      record.items.some(
        (returnedItem) => returnedItem.itemCode === item.itemCode && returnedItem.totalReturned > 0
      )
    );

    return returnedFromHistory;
  }, [deliveryHistory, returnHistory]);

  const removeItem = (index: number) => {
    const item = equipmentItems[index];
    if (!item) return;

    if (isEquipmentItemLocked(item)) {
      toast.error("Cannot remove this item after hire loading/delivery activity has been recorded.");
      return;
    }

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
      const maxAllowed =
        item.originalQuantity > 0
          ? Math.max(item.originalQuantity - (item.previouslyDelivered || 0), 0)
          : orderedQty;
      if (deliveredQty > orderedQty) {
        toast.error(`Delivery Qty cannot exceed Order Qty for ${item.description || item.itemCode}.`);
        return false;
      }
      if (deliveredQty > maxAllowed) {
        toast.error(
          `Delivery Qty cannot exceed original ordered amount for ${item.description || item.itemCode}.`
        );
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

  // Calculate totals for delivery progress
  const totalOrdered = useMemo(() => 
    equipmentItems.reduce((sum, item) => sum + parseNumber(item.qtyDelivered), 0), 
    [equipmentItems]
  );

  const totalDeliveredFromHistory = useMemo(() => 
    deliveryHistory.reduce((sum, delivery) => 
      sum + delivery.items.reduce((itemSum, item) => itemSum + item.quantityDelivered, 0), 0
    ), 
    [deliveryHistory]
  );

  const hasRemainingBalance = useMemo(() => {
    // Check if there are items with balance quantities
    return equipmentItems.some(item => {
      const orderedQty = getOrderedQuantity(item);
      const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "0");
      return orderedQty > deliveredQty;
    });
  }, [equipmentItems, deliveryQuantities]);

  // Create a delivery record and add to history
  const createDeliveryRecord = useCallback((): DeliveryRecord => {
    const items = equipmentItems.map(item => {
      const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "0");
      const orderedQty = getOrderedQuantity(item);
      const balanceAfter = Math.max(orderedQty - deliveredQty, 0);
      const massPerItem = parseNumber(item.massPerItem);
      return {
        itemCode: item.itemCode,
        description: item.description,
        quantityDelivered: deliveredQty,
        balanceAfter,
        massPerItem,
        totalMass: deliveredQty * massPerItem,
      };
    }).filter(item => item.quantityDelivered > 0);

    const totalMass = equipmentItems.reduce((sum, item) => {
      const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "0");
      return sum + deliveredQty * parseNumber(item.massPerItem);
    }, 0);

    return {
      id: crypto.randomUUID(),
      deliveryNoteNumber: deliveryNote.deliveryNoteNo,
      deliveryDate: deliveryNote.deliveryDate,
      hireStartDate: deliveryNote.hireStartDate,
      deliveredBy: deliveryNote.deliveredBy,
      receivedBy: deliveryNote.receivedBy,
      vehicleNo: deliveryNote.vehicleNo,
      status: "pending",
      items,
      totalMass,
      createdAt: new Date().toISOString(),
    };
  }, [equipmentItems, deliveryQuantities, deliveryNote]);

  // Dispatch a delivery and save to database
  const handleDispatchDelivery = async () => {
    if (!deliveryNote.deliveryDate) {
      toast.error("Please set the Dispatch Date before dispatching.");
      return;
    }
    if (!deliveryNote.hireStartDate) {
      toast.error("Please set the Hire Start Date before dispatching.");
      return;
    }
    if (!validateDeliveryQuantities()) return;

    // Deduct inventory first
    const success = await handleEquipmentHired();
    if (!success) return;

    // Create delivery record
    const newDelivery = createDeliveryRecord();
    newDelivery.status = "dispatched";
    const nextDeliveryHistory = [newDelivery, ...deliveryHistory];
    setDeliveryHistory(nextDeliveryHistory);

    // Calculate balance quantities
    const balanceQuantities: Record<string, number> = {};
    const deliveredQuantities: Record<string, number> = {};
    
    equipmentItems.forEach(item => {
      const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "0");
      const orderedQty = getOrderedQuantity(item);
      balanceQuantities[item.id] = Math.max(orderedQty - deliveredQty, 0);
      deliveredQuantities[item.id] = deliveredQty;
    });

    // Save to database
    if (savedQuotationId) {
      try {
        const quantityUpdates = equipmentItems
          .filter(item => item.itemCode)
          .map(item => ({
            part_number: item.itemCode,
            delivered_quantity: (item.previouslyDelivered || 0) + (deliveredQuantities[item.id] ?? 0),
            balance_quantity: balanceQuantities[item.id] ?? 0,
          }));
        
        if (quantityUpdates.length > 0) {
          await updateLineItemQuantities.mutateAsync({
            quotation_id: savedQuotationId,
            items: quantityUpdates,
          });
        }

        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          status: "dispatched",
          // Always use the current delivery date – this is the authoritative dispatch date
          dispatch_date: deliveryNote.deliveryDate,
          delivery_history: nextDeliveryHistory,
        } as any);
      } catch (error) {
        console.error("Failed to save delivery quantities:", error);
      }
    }

    // Update remaining quantities for next delivery
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
    setLastDeliveredQuantities(deliveredQuantities);
    setCurrentDeliveryDispatched(true);
    setEquipmentItems((prev) =>
      prev.map((item) => {
        const deliveredNow = deliveredQuantities[item.id] ?? 0;
        if (deliveredNow <= 0) return item;
        const newPreviouslyDelivered = Math.max(item.previouslyDelivered + deliveredNow, 0);
        return {
          ...item,
          previouslyDelivered: newPreviouslyDelivered,
          dbBalanceQuantity: balanceQuantities[item.id] ?? item.dbBalanceQuantity,
        };
      })
    );
    
    toast.success(`Delivery ${newDelivery.deliveryNoteNumber} dispatched successfully!`);
  };

  // Start a new delivery for remaining balance
  const handleDeliverBalance = useCallback(() => {
    // Increment delivery sequence
    const nextSequence = deliverySequence + 1;
    setDeliverySequence(nextSequence);
    
    // Reset delivery state for new batch
    setInventoryDeducted(false);
    setCurrentDeliveryDispatched(false);
    
    // Update delivery note number
    setDeliveryNote(prev => ({
      ...prev,
      deliveryNoteNo: deriveDeliveryNoteNumber(header.quotationNo, nextSequence),
      deliveryDate: getToday(),
      hireStartDate: getToday(),
      deliveredBy: "",
      receivedBy: "",
      vehicleNo: "",
      remarks: "",
    }));

    // Set delivery quantities to remaining balance
    const newDeliveryQuantities: Record<string, string> = {};
    equipmentItems.forEach(item => {
      const remaining = remainingQuantities[item.id] ?? parseNumber(item.qtyDelivered);
      newDeliveryQuantities[item.id] = String(remaining);
    });
    setDeliveryQuantities(newDeliveryQuantities);
    
    toast.info(`Starting delivery batch ${nextSequence}. Enter quantities for this delivery.`);
  }, [deliverySequence, header.quotationNo, equipmentItems, remainingQuantities]);

  // Mark a delivery as dispatched from history
  const handleMarkDeliveryDispatched = useCallback(async (deliveryId: string) => {
    const updatedDeliveryHistory = deliveryHistory.map((delivery) =>
      delivery.id === deliveryId
        ? { ...delivery, status: "dispatched" as const }
        : delivery
    );

    setDeliveryHistory(updatedDeliveryHistory);

    if (savedQuotationId) {
      try {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          delivery_history: updatedDeliveryHistory,
        } as any);
      } catch (error) {
        console.error("Failed to persist delivery history:", error);
      }
    }

    toast.success("Delivery marked as dispatched");
  }, [deliveryHistory, savedQuotationId, updateQuotation]);

  // Print delivery note from history
  const handlePrintDeliveryNoteFromHistory = useCallback((delivery: DeliveryRecord) => {
    const data: DeliveryNoteData = {
      quotationNumber: header.quotationNo,
      deliveryNoteNumber: delivery.deliveryNoteNumber,
      dateCreated: header.dateCreated,
      deliveryDate: delivery.deliveryDate,
      hireStartDate: delivery.hireStartDate ?? "",
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      deliveredBy: delivery.deliveredBy,
      receivedBy: delivery.receivedBy,
      vehicleNo: delivery.vehicleNo,
      remarks: "",
      createdBy: header.createdBy,
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
      items: delivery.items.map(item => ({
        partNumber: item.itemCode,
        description: item.description,
        balanceQuantity: item.balanceAfter,
        quantity: item.quantityDelivered,
        massPerItem: item.massPerItem ?? 0,
        totalMass: item.totalMass ?? item.quantityDelivered * (item.massPerItem ?? 0),
      })),
    };
    generateDeliveryNotePDF(data);
    toast.success("Delivery note opened for printing");
  }, [header]);

  // Print loading note from history
  const handlePrintLoadingNoteFromHistory = useCallback((delivery: DeliveryRecord) => {
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
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
      noteTitle: "Hire Loading Report",
      items: delivery.items.map(item => ({
        partNumber: item.itemCode,
        description: item.description,
        quantity: item.quantityDelivered,
        massPerItem: item.massPerItem ?? 0,
        totalMass: item.totalMass ?? item.quantityDelivered * (item.massPerItem ?? 0),
      })),
    };
    generateHireLoadingNotePDF(data);
    toast.success("Loading note opened for printing");
  }, [header]);

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
      hireStartDate: deliveryNote.hireStartDate,
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
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
      items: equipmentItems.map(item => {
        const deliveredQty = getInventoryDeliveryQuantity(item);
        const balanceQuantity = Math.max(getOrderedQuantity(item) - deliveredQty, 0);
        const massPerItem = parseNumber(item.massPerItem);
        balanceQuantities[item.id] = balanceQuantity;
        deliveredQuantities[item.id] = deliveredQty;
        return {
          partNumber: item.itemCode,
          description: item.description,
          balanceQuantity,
          quantity: deliveredQty,
          massPerItem,
          totalMass: deliveredQty * massPerItem,
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
            delivered_quantity: (item.previouslyDelivered || 0) + (deliveredQuantities[item.id] ?? 0),
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

    // Add to delivery history
    const newDelivery = createDeliveryRecord();
    setDeliveryHistory(prev => {
      // Avoid duplicates
      if (prev.some(d => d.deliveryNoteNumber === newDelivery.deliveryNoteNumber)) {
        return prev;
      }
      return [newDelivery, ...prev];
    });

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

    toast.success("Hire loading note opened for printing");
  };

  const handlePrintHireLoadingNote = (noteType: "current" | "balance") => {
    if (!equipmentItems.length) {
      toast.error("No equipment items to include in hire loading note");
      return;
    }

    const deliveredQuantities: Record<string, number> = {};
    const currentItems = equipmentItems
      .map((item) => {
        const deliveredQty = getDeliveredQuantity(item);
        const massPerItem = parseNumber(item.massPerItem);
        deliveredQuantities[item.id] = deliveredQty;
        return {
          partNumber: item.itemCode,
          description: item.description,
          quantity: deliveredQty,
          massPerItem,
          totalMass: deliveredQty * massPerItem,
        };
      })
      .filter((item) => item.quantity > 0);

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
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
      noteTitle: noteType === "balance" ? "Hire Loading Report (Balance)" : "Hire Loading Report",
      items: [],
    };

    const remainingItems = equipmentItems
      .map((item) => {
        const orderedQty = getOrderedQuantity(item);
        const deliveredQty = deliveredQuantities[item.id] ?? 0;
        const remainingQty = Math.max(orderedQty - deliveredQty, 0);
        const massPerItem = parseNumber(item.massPerItem);
        return {
          partNumber: item.itemCode,
          description: item.description,
          quantity: remainingQty,
          massPerItem,
          totalMass: remainingQty * massPerItem,
        };
      })
      .filter((item) => item.quantity > 0);

    const items = noteType === "balance" ? remainingItems : currentItems;

    if (!items.length) {
      toast.error(
        noteType === "balance"
          ? "No remaining quantities to include in a balance hire loading note."
          : "Enter delivered quantities to generate a hire loading note."
      );
      return;
    }

    generateHireLoadingNotePDF({
      ...data,
      items,
    });

    if (noteType === "current") {
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
    }

    toast.success(
      noteType === "balance"
        ? "Balance hire loading note opened for printing."
        : "Hire loading note opened for printing"
    );
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
      quotationNumber: header.quotationNo,
      deliveryNoteNumber: deliveryNote.deliveryNoteNo,
      dateCreated: header.dateCreated,
      deliveryDate: deliveryNote.deliveryDate,
      hireStartDate: deliveryNote.hireStartDate,
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
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
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
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
      discountRate: parseNumber(hireQuotationDiscount),
      comments: quotationComments,
      items: equipmentItems.map(item => ({
        partNumber: item.itemCode,
        description: item.description,
        quantity: parseNumber(item.qtyDelivered),
        warehouseAvailableQty: item.warehouseAvailableQty,
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
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      contactEmail: header.clientEmail,
      createdBy: header.createdBy,
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedDeliverySiteId),
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

  const deriveReturnNoteNumber = (quotationNo: string, seq: number) => {
    if (!quotationNo) return "RN-0001";
    const parts = quotationNo.match(/\d+/g);
    const lastPart = parts?.[parts.length - 1];
    if (!lastPart) return "RN-0001";
    const num = Number.parseInt(lastPart, 10);
    if (Number.isNaN(num)) return "RN-0001";
    const base = "RN-" + String(num).padStart(4, "0");
    if (seq > 1) return base + "-" + String.fromCharCode(64 + seq);
    return base;
  };

  useEffect(() => {
    setReturnNote(prev => ({
      ...prev,
      returnNoteNo: deriveReturnNoteNumber(header.quotationNo, returnSequence),
    }));
  }, [header.quotationNo, returnSequence]);

  const handleReturnQuantityChange = (
    id: string,
    field: "good" | "dirty" | "damaged" | "scrap",
    value: string
  ) => {
    if (returnProcessed) {
      toast.error("Return has already been processed for this batch.");
      return;
    }

    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.returnBalance <= 0) {
          toast.error(`${item.description || item.itemCode} has already been fully returned.`);
          return item;
        }
        const nextItem = { ...item, [field]: value };
        const totalReturned =
          parseNumber(nextItem.good) +
          parseNumber(nextItem.dirty) +
          parseNumber(nextItem.damaged) +
          parseNumber(nextItem.scrap);

        if (totalReturned > item.returnBalance) {
          toast.error(`Cannot return more than balance (${item.returnBalance}) for ${item.description || item.itemCode}.`);
          return item;
        }

        return nextItem;
      })
    );
  };

  const handleProcessReturn = async () => {
    if (returnProcessed) {
      toast.error("Return has already been processed for this batch.");
      return;
    }

    // Require site selection when multiple sites exist
    if (clientSites && clientSites.length > 0 && !selectedReturnSiteId) {
      toast.error("Please select a site before processing the return.");
      return;
    }

    if (!returnItems.length) {
      toast.error("No items available for return.");
      return;
    }

    const hasReturn = returnItems.some((item) =>
      parseNumber(item.good) + parseNumber(item.dirty) + parseNumber(item.damaged) + parseNumber(item.scrap) > 0
    );

    if (!hasReturn) {
      toast.error("Enter at least one returned quantity.");
      return;
    }

    for (const item of returnItems) {
      const totalReturned = parseNumber(item.good) + parseNumber(item.dirty) + parseNumber(item.damaged) + parseNumber(item.scrap);
      if (totalReturned > item.returnBalance) {
        toast.error(`Cannot return more than balance (${item.returnBalance}) for ${item.description || item.itemCode}.`);
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
            issue_description: `Return condition: ${entry.condition}. Quantity: ${entry.qty}. Quotation: ${header.quotationNo || "N/A"}. Client: ${header.clientCompanyName || "N/A"}.`,
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

      // Create return record for history
      const returnRecordItems = returnItems
        .map((item) => {
          const good = parseNumber(item.good);
          const dirty = parseNumber(item.dirty);
          const damaged = parseNumber(item.damaged);
          const scrap = parseNumber(item.scrap);
          const totalReturned = good + dirty + damaged + scrap;
          const balanceAfter = Math.max(item.returnBalance - totalReturned, 0);
          return {
            itemCode: item.itemCode,
            description: item.description,
            good, dirty, damaged, scrap, totalReturned,
            balanceAfter,
            massPerItem: item.massPerItem,
            totalMass: totalReturned * item.massPerItem,
          };
        })
        .filter((item) => item.totalReturned > 0);

      const newReturn: ReturnRecord = {
        id: crypto.randomUUID(),
        returnNoteNumber: returnNote.returnNoteNo,
        returnDate: returnNote.returnDate,
        hireEndDate: returnNote.hireEndDate,
        returnedBy: returnNote.returnedBy,
        receivedBy: returnNote.receivedBy,
        vehicleNo: returnNote.vehicleNo,
        status: "processed",
        items: returnRecordItems,
        totalReturned: returnRecordItems.reduce((s, i) => s + i.totalReturned, 0),
        totalMass: returnRecordItems.reduce((s, i) => s + i.totalMass, 0),
        createdAt: new Date().toISOString(),
      };
      setReturnHistory((prev) => [newReturn, ...prev]);

      // Update return balances
      const updatedReturnItems = returnItems.map((item) => {
        const totalReturned = parseNumber(item.good) + parseNumber(item.dirty) + parseNumber(item.damaged) + parseNumber(item.scrap);
        const newPreviouslyReturned = Math.min(item.previouslyReturned + totalReturned, item.maxReturnable);
        const newReturnBalance = Math.max(item.maxReturnable - newPreviouslyReturned, 0);
        return { ...item, previouslyReturned: newPreviouslyReturned, returnBalance: newReturnBalance, good: "0", dirty: "0", damaged: "0", scrap: "0" };
      });
      setReturnItems(updatedReturnItems);

      // Save return quantities to database
      if (savedQuotationId) {
        const returnUpdates = returnItems
          .filter((item) => item.itemCode)
          .map((item) => {
            const totalReturned = parseNumber(item.good) + parseNumber(item.dirty) + parseNumber(item.damaged) + parseNumber(item.scrap);
            const newPreviouslyReturned = Math.min(item.previouslyReturned + totalReturned, item.maxReturnable);
            return {
              part_number: item.itemCode,
              returned_quantity: newPreviouslyReturned,
              return_balance_quantity: Math.max(item.maxReturnable - newPreviouslyReturned, 0),
            };
          });
        if (returnUpdates.length > 0) {
          await updateLineItemReturnQuantities.mutateAsync({ quotation_id: savedQuotationId, items: returnUpdates });
        }
      }

      // Check if all items are fully returned
      const allReturned = updatedReturnItems.every((item) => item.returnBalance <= 0);
      if (allReturned && savedQuotationId) {
        await updateQuotation.mutateAsync({
          id: savedQuotationId,
          hire_weeks: Math.max(numberOfWeeks, 1),
          notes: buildStructuredQuotationNotes(calculation.paymentTerms, header),
          status: "completed",
        });
      }

      setReturnProcessed(true);
      toast.success("Hire return batch processed successfully!");
    } catch (error) {
      console.error("Failed to process return:", error);
    }
  };

  const handleReturnBalance = useCallback(() => {
    const nextSequence = returnSequence + 1;
    setReturnSequence(nextSequence);
    setReturnProcessed(false);
    setReturnNote((prev) => ({
      ...prev,
      returnNoteNo: deriveReturnNoteNumber(header.quotationNo, nextSequence),
      returnDate: getToday(),
      returnedBy: "",
      receivedBy: "",
      vehicleNo: "",
      hireEndDate: getToday(),
      remarks: "",
    }));
    toast.info("Starting return batch " + nextSequence + ". Enter return quantities.");
  }, [returnSequence, header.quotationNo]);

  const handlePrintReturnNoteFromHistory = useCallback((record: ReturnRecord) => {
    const data: HireReturnNoteData = {
      quotationNumber: header.quotationNo,
      returnNoteNumber: record.returnNoteNumber,
      dateCreated: header.dateCreated,
      returnDate: record.returnDate,
      hireEndDate: record.hireEndDate || record.returnDate,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      contactEmail: header.clientEmail,
      officeTel: header.officeTel,
      officeEmail: header.officeEmail,
      returnedBy: record.returnedBy,
      receivedBy: record.receivedBy,
      vehicleNo: record.vehicleNo,
      remarks: "",
      createdBy: header.createdBy,
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedReturnSiteId),
      items: record.items.map((item) => ({
        partNumber: item.itemCode,
        description: item.description,
        totalDelivered: 0,
        good: item.good,
        dirty: item.dirty,
        damaged: item.damaged,
        scrap: item.scrap,
        totalReturned: item.totalReturned,
        balanceAfter: item.balanceAfter,
        massPerItem: item.massPerItem,
        totalMass: item.totalMass,
      })),
    };
    generateHireReturnNotePDF(data);
    toast.success("Return note opened for printing");
  }, [header]);

  const handlePrintCurrentReturnNote = () => {
    const data: HireReturnNoteData = {
      quotationNumber: header.quotationNo,
      returnNoteNumber: returnNote.returnNoteNo,
      dateCreated: header.dateCreated,
      returnDate: returnNote.returnDate,
      hireEndDate: returnNote.hireEndDate,
      companyName: header.clientCompanyName,
      siteName: header.siteName,
      siteLocation: header.siteLocation,
      siteAddress: header.siteAddress,
      contactName: header.clientName,
      contactPhone: header.clientPhone,
      contactEmail: header.clientEmail,
      officeTel: header.officeTel,
      officeEmail: header.officeEmail,
      returnedBy: returnNote.returnedBy,
      receivedBy: returnNote.receivedBy,
      vehicleNo: returnNote.vehicleNo,
      remarks: returnNote.remarks,
      createdBy: header.createdBy,
      clientId: header.clientId,
      siteId: getSelectedSiteNumber(selectedReturnSiteId),
      items: returnItems
        .filter((item) => parseNumber(item.good) + parseNumber(item.dirty) + parseNumber(item.damaged) + parseNumber(item.scrap) > 0)
        .map((item) => {
          const good = parseNumber(item.good);
          const dirty = parseNumber(item.dirty);
          const damaged = parseNumber(item.damaged);
          const scrap = parseNumber(item.scrap);
          const totalReturned = good + dirty + damaged + scrap;
          return {
            partNumber: item.itemCode,
            description: item.description,
            totalDelivered: item.totalDelivered,
            good, dirty, damaged, scrap, totalReturned,
            balanceAfter: item.returnBalance - totalReturned,
            massPerItem: item.massPerItem,
            totalMass: totalReturned * item.massPerItem,
          };
        }),
    };
    generateHireReturnNotePDF(data);
    toast.success("Return note opened for printing");
  };

  const inventoryScaffolds = scaffolds ?? [];
  const normalizedItemCodeSearch = itemCodeSearch.trim().toLowerCase();
  /** Derive a grouping key from the description so similar items cluster together. */
  const getEquipmentGroupKey = (description: string | null): string => {
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

  const filteredScaffolds = (() => {
    let list = inventoryScaffolds;
    if (normalizedItemCodeSearch) {
      const matches = inventoryScaffolds.filter((scaffold) => {
        const partNumber = scaffold.part_number?.toLowerCase() ?? "";
        const description = scaffold.description?.toLowerCase() ?? "";
        const scaffoldType = scaffold.scaffold_type?.toLowerCase() ?? "";
        return (
          partNumber.includes(normalizedItemCodeSearch) ||
          description.includes(normalizedItemCodeSearch) ||
          scaffoldType.includes(normalizedItemCodeSearch)
        );
      });
      if (matches.length) {
        const matchIds = new Set(matches.map(match => match.id));
        const remaining = inventoryScaffolds.filter(scaffold => !matchIds.has(scaffold.id));
        list = [...matches, ...remaining];
      }
    }
    // Sort by group then description
    return [...list].sort((a, b) => {
      const ga = getEquipmentGroupKey(a.description ?? a.scaffold_type);
      const gb = getEquipmentGroupKey(b.description ?? b.scaffold_type);
      if (ga !== gb) return ga.localeCompare(gb);
      return (a.description ?? "").localeCompare(b.description ?? "");
    });
  })();

  const handleItemCodeSearchChange = (value: string) => {
    setItemCodeSearch(value);
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) return;
    const exactMatch = inventoryScaffolds.find(
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
          Create quotations with equipment from inventory → generate hire quotation report → confirm delivery quantities → generate delivery notes → process hire returns
          {header.quotationNo && <span className="ml-2 font-medium text-primary">({header.quotationNo})</span>}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="flex flex-wrap gap-2">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.key === activeStep;
            const isComplete = index < stepIndex;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(step.key)}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-150 ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isComplete
                      ? "bg-primary/15 text-primary"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground group-hover:text-primary"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                }`}>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Step 1: Client Details - Trade Account Application Form */}
        {activeStep === "client" && (
          <div className="space-y-6">
            {/* Header Row */}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-base font-semibold mb-3">Trade Account Application</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Quotation No (HSQ)</Label>
                  <Input value={header.quotationNo || "Auto-generated on save"} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Client ID</Label>
                  <Input value={header.clientId || "Auto-generated from HSQ"} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Date Created</Label>
                  <Input value={header.dateCreated} readOnly className="bg-muted" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-primary">Client Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    For repeat clients, search by Client ID or company name to preload credentials, then add a new site.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant={clientEntryMode === "new" ? "default" : "outline"} onClick={() => setClientEntryMode("new")}>
                    New Client
                  </Button>
                  <Button type="button" variant={clientEntryMode === "existing" ? "default" : "outline"} onClick={() => setClientEntryMode("existing")}>
                    Existing Client New Site
                  </Button>
                </div>
              </div>

              {clientEntryMode === "existing" && (
                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="clientLookup">Search existing client</Label>
                    <Input
                      id="clientLookup"
                      value={clientLookupQuery}
                      onChange={(e) => setClientLookupQuery(e.target.value)}
                      placeholder="Search by Client ID (CL-...) or company name"
                    />
                  </div>
                  <div>
                    <Label>Select client to continue quotation</Label>
                    <Select
                      value={selectedPreviousClientId}
                      onValueChange={(value) => {
                        setSelectedPreviousClientId(value);
                        const selectedQuotation = previousClientMatches.find((quotation) => quotation.id === value);
                        if (selectedQuotation) {
                          handleSelectPreviousClient(selectedQuotation);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            previousClientMatches.length
                              ? "Choose previous client"
                              : "No previous clients found for that search"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {previousClientMatches.map((quotation) => {
                          const clientId = deriveClientIdFromQuotationNumber(quotation.quotation_number) || "No client ID";
                          return (
                            <SelectItem key={quotation.id} value={quotation.id}>
                              {(quotation.company_name || "Unnamed company")} • {clientId}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>


            {clientEntryMode !== "existing" && (
            <>
            {/* Section 1 - Applicant */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-4 text-primary">Section 1 — Applicant Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="tradingName">Trading Name *</Label>
                  <Input
                    id="tradingName"
                    value={header.tradingName}
                    onChange={(e) => setHeader(prev => ({ ...prev, tradingName: e.target.value }))}
                    placeholder="Company / Trading name"
                  />
                </div>
                <div>
                  <Label htmlFor="postalAddress">Postal Address</Label>
                  <Input
                    id="postalAddress"
                    value={header.postalAddress}
                    onChange={(e) => setHeader(prev => ({ ...prev, postalAddress: e.target.value }))}
                    placeholder="P.O. Box ..."
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={header.postalCode}
                    onChange={(e) => setHeader(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Code"
                  />
                </div>
                <div>
                  <Label htmlFor="physicalAddress">Physical Address</Label>
                  <Input
                    id="physicalAddress"
                    value={header.physicalAddress}
                    onChange={(e) => setHeader(prev => ({ ...prev, physicalAddress: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label htmlFor="physicalCode">Physical Code</Label>
                  <Input
                    id="physicalCode"
                    value={header.physicalCode}
                    onChange={(e) => setHeader(prev => ({ ...prev, physicalCode: e.target.value }))}
                    placeholder="Code"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={header.companyEmail}
                    onChange={(e) => setHeader(prev => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="info@company.co.ke"
                  />
                </div>
                <div>
                  <Label htmlFor="landline1">Landline 1 *</Label>
                  <Input
                    id="landline1"
                    value={header.landline1}
                    onChange={(e) => setHeader(prev => ({ ...prev, landline1: e.target.value }))}
                    placeholder="+254 ..."
                  />
                </div>
                <div>
                  <Label htmlFor="landline2">Landline 2</Label>
                  <Input
                    id="landline2"
                    value={header.landline2}
                    onChange={(e) => setHeader(prev => ({ ...prev, landline2: e.target.value }))}
                    placeholder="+254 ..."
                  />
                </div>
                <div>
                  <Label htmlFor="faxNumber">Fax Number</Label>
                  <Input
                    id="faxNumber"
                    value={header.faxNumber}
                    onChange={(e) => setHeader(prev => ({ ...prev, faxNumber: e.target.value }))}
                    placeholder="Fax"
                  />
                </div>
                <div>
                  <Label htmlFor="siteContactPerson">Site Contact Person *</Label>
                  <Input
                    id="siteContactPerson"
                    value={header.siteContactPerson}
                    onChange={(e) => setHeader(prev => ({ ...prev, siteContactPerson: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountsContact">Accounts Contact</Label>
                  <Input
                    id="accountsContact"
                    value={header.accountsContact}
                    onChange={(e) => setHeader(prev => ({ ...prev, accountsContact: e.target.value }))}
                    placeholder="Accounts person"
                  />
                </div>
                <div>
                  <Label htmlFor="accountsEmail">Accounts Email</Label>
                  <Input
                    id="accountsEmail"
                    type="email"
                    value={header.accountsEmail}
                    onChange={(e) => setHeader(prev => ({ ...prev, accountsEmail: e.target.value }))}
                    placeholder="accounts@company.co.ke"
                  />
                </div>
                <div>
                  <Label>Statements Delivered To</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.statementDelivery === "physical"}
                        onCheckedChange={(checked) =>
                          setHeader(prev => ({ ...prev, statementDelivery: checked ? "physical" : "" }))
                        }
                      />
                      Physical Address
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={header.statementDelivery === "postal"}
                        onCheckedChange={(checked) =>
                          setHeader(prev => ({ ...prev, statementDelivery: checked ? "postal" : "" }))
                        }
                      />
                      Postal Address
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Legal Entity</Label>
                  <Select
                    value={header.legalEntity}
                    onValueChange={(value) => setHeader(prev => ({ ...prev, legalEntity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_company">Public Company</SelectItem>
                      <SelectItem value="private_company">Private Company</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="close_corporation">Close Corporation</SelectItem>
                      <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>


            {/* Section 2 - Directors / Partners / Owners / Members */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-4 text-primary">Section 2 — Directors / Partners / Owners / Members</h4>
              <div className="space-y-4">
                {header.directors.map((director, index) => (
                  <div key={`director-${index}`} className="rounded-md border p-3">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">Entry {index + 1}</p>
                    <div className="grid gap-3 md:grid-cols-4">
                      <Input
                        value={director.fullName}
                        onChange={(e) => setHeader(prev => ({
                          ...prev,
                          directors: prev.directors.map((entry, i) => i === index ? { ...entry, fullName: e.target.value } : entry),
                        }))}
                        placeholder="Full Name"
                      />
                      <Input
                        value={director.idNumber}
                        onChange={(e) => setHeader(prev => ({
                          ...prev,
                          directors: prev.directors.map((entry, i) => i === index ? { ...entry, idNumber: e.target.value } : entry),
                        }))}
                        placeholder="ID Number"
                      />
                      <Input
                        value={director.residentialTel}
                        onChange={(e) => setHeader(prev => ({
                          ...prev,
                          directors: prev.directors.map((entry, i) => i === index ? { ...entry, residentialTel: e.target.value } : entry),
                        }))}
                        placeholder="Residential Tel. No."
                      />
                      <Input
                        value={director.cellphone}
                        onChange={(e) => setHeader(prev => ({
                          ...prev,
                          directors: prev.directors.map((entry, i) => i === index ? { ...entry, cellphone: e.target.value } : entry),
                        }))}
                        placeholder="Cellphone No."
                      />
                      <div className="md:col-span-4">
                        <Input
                          value={director.residentialAddress}
                          onChange={(e) => setHeader(prev => ({
                            ...prev,
                            directors: prev.directors.map((entry, i) => i === index ? { ...entry, residentialAddress: e.target.value } : entry),
                          }))}
                          placeholder="Residential Address"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 - Companies */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-4 text-primary">Section 3 — Companies (Public and Private) and Close Corporations</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={header.companySection.registeredName} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, registeredName: e.target.value } }))} placeholder="Registered Name of Company / CC" className="md:col-span-2" />
                <Input value={header.companySection.registrationNumber} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, registrationNumber: e.target.value } }))} placeholder="Registration Number / CC Number" className="md:col-span-2" />
                <Input value={header.companySection.commencementDate} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, commencementDate: e.target.value } }))} placeholder="Date of Commencement of Business" className="md:col-span-2" />
                <Input value={header.companySection.registeredOffice} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, registeredOffice: e.target.value } }))} placeholder="Registered Office" className="md:col-span-2" />
                <Input value={header.companySection.issuedShareCapital} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, issuedShareCapital: e.target.value } }))} placeholder="Issued Share Capital" className="md:col-span-2" />
                <div className="md:col-span-2">
                  <Label>Judicial Management / Compromise with Creditors</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Button type="button" variant={header.companySection.judicialManagement === "yes" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, judicialManagement: "yes" } }))}>Yes</Button>
                    <Button type="button" variant={header.companySection.judicialManagement === "no" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, judicialManagement: "no" } }))}>No</Button>
                  </div>
                </div>
                <Input value={header.companySection.compromiseDetails} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, compromiseDetails: e.target.value } }))} placeholder="If yes, please give details" className="md:col-span-2" />
                <Input value={header.companySection.holdingCompanyName} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, holdingCompanyName: e.target.value } }))} placeholder="Holding Company Name" />
                <Input value={header.companySection.holdingCompanyRegistration} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, holdingCompanyRegistration: e.target.value } }))} placeholder="Holding Company Registration Number" />
                <Input value={header.companySection.subsidiaryCompanyName} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, subsidiaryCompanyName: e.target.value } }))} placeholder="Subsidiary Company Name" />
                <Input value={header.companySection.subsidiaryCompanyRegistration} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, subsidiaryCompanyRegistration: e.target.value } }))} placeholder="Subsidiary Company Registration Number" />
                <Input value={header.companySection.auditors} onChange={(e) => setHeader(prev => ({ ...prev, companySection: { ...prev.companySection, auditors: e.target.value } }))} placeholder="Auditors" className="md:col-span-2" />
              </div>
            </div>

            {/* Section 7 - Other Information */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-4 text-primary">Section 7 — Other Information</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={header.otherInformation.bankers} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, bankers: e.target.value } }))} placeholder="Bankers" className="md:col-span-2" />
                <Input value={header.otherInformation.branchName} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, branchName: e.target.value } }))} placeholder="Branch Name" />
                <Input value={header.otherInformation.branchNumber} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, branchNumber: e.target.value } }))} placeholder="Branch Number" />
                <Input value={header.otherInformation.accountName} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, accountName: e.target.value } }))} placeholder="Account Name" className="md:col-span-2" />
                <Input value={header.otherInformation.accountNumber} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, accountNumber: e.target.value } }))} placeholder="Account Number" className="md:col-span-2" />
                <div className="md:col-span-2">
                  <Label>Do you own your own premises?</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Button type="button" variant={header.otherInformation.ownPremises === "yes" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, ownPremises: "yes" } }))}>Yes</Button>
                    <Button type="button" variant={header.otherInformation.ownPremises === "no" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, ownPremises: "no" } }))}>No</Button>
                  </div>
                </div>
                <Input value={header.otherInformation.landlordDetails} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, landlordDetails: e.target.value } }))} placeholder="If no, name and telephone number of landlord" className="md:col-span-2" />
                <Input value={header.otherInformation.vatRegistrationNumber} onChange={(e) => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, vatRegistrationNumber: e.target.value } }))} placeholder="VAT Registration Number" className="md:col-span-2" />
                {header.otherInformation.authorisedPersons.map((person, index) => (
                  <Input
                    key={`authorised-person-${index}`}
                    value={person}
                    onChange={(e) => setHeader(prev => ({
                      ...prev,
                      otherInformation: {
                        ...prev.otherInformation,
                        authorisedPersons: prev.otherInformation.authorisedPersons.map((entry, i) => i === index ? e.target.value : entry),
                      },
                    }))}
                    placeholder={`Authorised person ${index + 1}`}
                    className="md:col-span-2"
                  />
                ))}
                <div className="md:col-span-2">
                  <Label>Does your company use official Order Numbers?</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Button type="button" variant={header.otherInformation.officialOrderNumbers === "yes" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, officialOrderNumbers: "yes" } }))}>Yes</Button>
                    <Button type="button" variant={header.otherInformation.officialOrderNumbers === "no" ? "default" : "outline"} onClick={() => setHeader(prev => ({ ...prev, otherInformation: { ...prev.otherInformation, officialOrderNumbers: "no" } }))}>No</Button>
                  </div>
                </div>
              </div>
            </div>


            {/* Transport */}
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold mb-4 text-primary">Transport</h4>
              <div className="grid gap-4 md:grid-cols-2">
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
            {/* Project Type & Market Segmentation */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-3 text-primary">Project Type</h4>
                <div className="grid gap-2">
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
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-3 text-primary">Market Segmentation</h4>
                <div className="grid gap-2">
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
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-3 text-primary">Civils</h4>
                <div className="grid gap-2">
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
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-semibold mb-3 text-primary">Scaffolding</h4>
                <div className="grid gap-2">
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
            </div>
            </>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                {isTestQuotation ? "All fields optional — a Client ID will be auto-assigned" : "* Required fields"}
              </p>
              <div className="flex gap-2">
                {!isTestQuotation && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep("site-master")}
                    disabled={!savedQuotationId}
                  >
                    Site Details
                  </Button>
                )}
                <Button 
                  type="button" 
                  onClick={handleHeaderSave}
                  disabled={createQuotation.isPending || updateQuotation.isPending}
                >
                  {createQuotation.isPending ? "Creating..." : isTestQuotation ? "Continue to Equipment →" : "Save & Continue"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Equipment Selection */}
        {activeStep === "equipment" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <PackageSearch className="h-4 w-4" />
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
                      const selected = inventoryScaffolds.find(scaffold => scaffold.id === value);
                      if (selected?.part_number) {
                        setItemCodeSearch(selected.part_number);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={scaffoldsLoading ? "Loading inventory..." : "Choose from inventory"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto bg-background z-50">
                      {filteredScaffolds.length > 0 ? (
                        (() => {
                          let lastGroup = "";
                          return filteredScaffolds.map(scaffold => {
                            const group = getEquipmentGroupKey(scaffold.description ?? scaffold.scaffold_type);
                            const groupLabel = group.replace(/^[A-Z]+_/, "");
                            const showHeader = group !== lastGroup;
                            lastGroup = group;
                            const alreadyAdded = equipmentItems.reduce((total, item) => {
                              if (item.scaffoldId !== scaffold.id) return total;
                              return total + parseNumber(item.qtyDelivered);
                            }, 0);
                            const remainingQty = Math.max((scaffold.quantity ?? 0) - alreadyAdded, 0);
                            return (
                              <React.Fragment key={scaffold.id}>
                                {showHeader && (
                                  <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-muted/50 border-b border-border sticky top-0">
                                    {groupLabel}
                                  </div>
                                )}
                                <SelectItem value={scaffold.id}>
                                  {scaffold.part_number} - {scaffold.description || scaffold.scaffold_type} 
                                  (Status: {scaffold.status}, Qty: {scaffold.quantity}, Remaining: {remainingQty}, Rate: {formatCurrency(scaffold.weekly_rate || 0)}/week)
                                </SelectItem>
                              </React.Fragment>
                            );
                          });
                        })()
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
                      min={0}
                      max={isTestQuotation ? undefined : remainingSelectedQty}
                      value={equipmentQuantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setEquipmentQuantity(value);
                          return;
                        }

                        const clampedQty = clampToInventory(parseNumber(value), remainingSelectedQty);
                        if (!isTestQuotation && parseNumber(value) > remainingSelectedQty) {
                          toast.error(`Cannot request more than ${remainingSelectedQty} item(s) available in inventory.`);
                        }

                        setEquipmentQuantity(String(clampedQty));
                      }}
                      disabled={!selectedScaffoldId}
                    />
                    <Button type="button" onClick={handleAddFromInventory} size="icon" disabled={addDisabled}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedScaffoldId && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Available in yard: {selectedScaffold?.quantity ?? 0} • Remaining to add: {remainingSelectedQty}
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
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              className="h-8 w-20 text-right ml-auto"
                              value={item.qtyDelivered}
                              onChange={(e) => {
                                const value = e.target.value;
                                const requestedQty = parseNumber(value);
                                const nextQty = clampToInventory(requestedQty, item.warehouseAvailableQty);

                                if (!isTestQuotation && requestedQty > item.warehouseAvailableQty) {
                                  toast.error(`Cannot set quantity above inventory (${item.warehouseAvailableQty}).`);
                                }

                                setEquipmentItems((prev) =>
                                  prev.map((entry, entryIndex) =>
                                    entryIndex === idx
                                      ? { ...entry, qtyDelivered: String(nextQty), originalQuantity: nextQty }
                                      : entry
                                  )
                                );
                              }}
                              disabled={isEquipmentItemLocked(item)}
                            />
                          </td>
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
                              disabled={isEquipmentItemLocked(item)}
                              title={isEquipmentItemLocked(item) ? "Cannot remove after hire loading/delivery activity" : "Remove item"}
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

            {/* Editable Comments Section */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <Label htmlFor="quotationComments" className="text-sm font-semibold">Comments</Label>
              <Textarea
                id="quotationComments"
                value={quotationComments}
                onChange={(e) => setQuotationComments(e.target.value)}
                rows={4}
                placeholder="Enter quotation comments..."
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                These comments will appear on the printed Hire Quotation report.
              </p>
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
                  Continue to Site Master Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Site Master Plan */}
        {activeStep === "site-master" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site Master Plan
              </h4>
              <p className="text-sm text-muted-foreground">
                Register and manage client site locations.
              </p>
            </div>

            {/* Client ID display */}
            {savedQuotationId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Client ID / Quotation No</Label>
                      <Input value={header.quotationNo} readOnly className="bg-muted font-mono" />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <Input value={header.clientCompanyName} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Site Contact</Label>
                      <Input value={header.clientName} readOnly className="bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!savedQuotationId && (
              <div className="rounded-lg border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Please save the client details first (Step 1) before managing sites.</p>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => goToStep("client")}>
                  Go to Client Details
                </Button>
              </div>
            )}

            {savedQuotationId && (
              <div className="space-y-5">
                {/* Add New Site Form */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Add New Site</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Site Name *</Label>
                        <Input value={newSite.siteName} onChange={(e) => setNewSite(prev => ({ ...prev, siteName: e.target.value }))} placeholder="Site / Project name" />
                      </div>
                      <div>
                        <Label>Site Location</Label>
                        <Input value={newSite.siteLocation} onChange={(e) => setNewSite(prev => ({ ...prev, siteLocation: e.target.value }))} placeholder="City or area" />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Site Address</Label>
                        <Input value={newSite.siteAddress} onChange={(e) => setNewSite(prev => ({ ...prev, siteAddress: e.target.value }))} placeholder="Full address" />
                      </div>
                      <div>
                        <Label>Site Manager Name</Label>
                        <Input value={newSite.siteManagerName} onChange={(e) => setNewSite(prev => ({ ...prev, siteManagerName: e.target.value }))} placeholder="Manager name" />
                      </div>
                      <div>
                        <Label>Manager Phone</Label>
                        <Input value={newSite.siteManagerPhone} onChange={(e) => setNewSite(prev => ({ ...prev, siteManagerPhone: e.target.value }))} placeholder="+254 ..." />
                      </div>
                      <div>
                        <Label>Manager Email</Label>
                        <Input value={newSite.siteManagerEmail} onChange={(e) => setNewSite(prev => ({ ...prev, siteManagerEmail: e.target.value }))} placeholder="email@example.com" />
                      </div>
                      <div>
                        <Label>Site Opened By</Label>
                        <Input value={newSite.siteOpenedBy} onChange={(e) => setNewSite(prev => ({ ...prev, siteOpenedBy: e.target.value }))} placeholder="Name" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Badge variant="secondary" className="text-sm font-mono">
                        Next: {deriveSiteNumber(header.quotationNo, clientSites?.length ? String.fromCharCode(65 + clientSites.length - 1) : "")}
                      </Badge>
                      <Button type="button" onClick={handleAddClientSite} disabled={createClientSite.isPending || !newSite.siteName}>
                        <Plus className="h-4 w-4 mr-1" />
                        {createClientSite.isPending ? "Adding..." : "Add Site"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Sites Table */}
                {(clientSites?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Registered Sites ({clientSites?.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Site ID</th>
                              <th className="px-4 py-3 text-left font-semibold">Site Name</th>
                              <th className="px-4 py-3 text-left font-semibold">Location</th>
                              <th className="px-4 py-3 text-left font-semibold">Manager</th>
                              <th className="px-4 py-3 text-left font-semibold">Phone</th>
                              <th className="px-4 py-3 text-center font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientSites?.map((site) => (
                              <tr key={site.id} className="border-t border-border hover:bg-muted/30">
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {site.site_number}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 font-medium">{site.site_name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{site.site_location || "—"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{site.site_manager_name || "—"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{site.site_manager_phone || "—"}</td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      type="button"
                                      variant={selectedDeliverySiteId === site.id ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleSelectDeliverySiteFromRow(site)}
                                    >
                                      Save Site
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => deleteClientSite.mutate({ id: site.id, quotation_id: site.quotation_id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* NOTE section */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-sm">NOTE</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>All OTNO equipment delivered to site conforms to our international Standards Organization (ISO) – Quality Management System.</li>
                    <li>Please do not accept any dirty or damaged equipment from our drivers.</li>
                    <li>Please ensure that EVERY ITEM is checked, counted and signed for.</li>
                    <li>It is your responsibility to load and off-load our trucks – please have labour and or a crane available.</li>
                    <li>Please ensure that you are issued with a "Request for Collection" reference number when you instruct our offices to collect equipment.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Hire Loading */}
        {activeStep === "hire-delivery" && (
          <div className="space-y-6">
            {/* Header with Delivery Number Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Hire Loading</h3>
                  <Badge variant="outline" className="gap-1 text-sm">
                    <Truck className="h-3 w-3" />
                    {deliveryNote.deliveryNoteNo}
                  </Badge>
                  {deliverySequence > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      Batch {deliverySequence}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter quantities for this delivery batch, then dispatch to deduct from inventory.
                </p>
              </div>
              {inventoryDeducted && (
                <Badge variant="outline" className="gap-1 border-green-500/50 bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Inventory Deducted
                </Badge>
              )}
            </div>

            {/* Balance Delivery Alert */}
            {(hasPreviousDelivery || deliverySequence > 1) && (
              <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <History className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Balance Delivery (Batch {deliverySequence})</h4>
                    <p className="text-sm text-muted-foreground">
                      This is a continuation delivery. The quantities shown are the balance remaining from previous deliveries.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Site Selection for Delivery */}
            {(clientSites?.length ?? 0) > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Delivery Site
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Select Site</Label>
                      <Select value={selectedDeliverySiteId} onValueChange={handleSelectDeliverySite}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose delivery site..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clientSites?.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.site_number} — {site.site_name} ({site.site_location || "No location"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedDeliverySiteId && (() => {
                      const site = clientSites?.find(s => s.id === selectedDeliverySiteId);
                      return site ? (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{site.site_name}</p>
                          <p className="text-muted-foreground">Site ID: {site.site_number}</p>
                          <p className="text-muted-foreground">{site.site_address || site.site_location || "—"}</p>
                          <p className="text-muted-foreground">{site.site_manager_name} • {site.site_manager_phone || "—"}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Details Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="deliveryDate">Dispatch Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryNote.deliveryDate}
                    onChange={(e) => setDeliveryNote(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hireStartDate">Hire Start Date</Label>
                  <Input
                    id="hireStartDate"
                    type="date"
                    value={deliveryNote.hireStartDate}
                    onChange={(e) => setDeliveryNote(prev => ({ ...prev, hireStartDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment Delivery Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageSearch className="h-4 w-4" />
                  Equipment Items ({balanceDeliveryItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Part No</th>
                        <th className="px-4 py-3 text-left font-semibold">Description</th>
                        {(hasPreviousDelivery || deliverySequence > 1) && (
                          <>
                            <th className="px-4 py-3 text-right font-semibold">Original</th>
                            <th className="px-4 py-3 text-right font-semibold">Prev. Delivered</th>
                          </>
                        )}
                        <th className="px-4 py-3 text-right font-semibold">
                          {(hasPreviousDelivery || deliverySequence > 1) ? "Available" : "Order Qty"}
                        </th>
                        <th className="px-4 py-3 text-right font-semibold bg-primary/10">This Delivery</th>
                        <th className="px-4 py-3 text-right font-semibold">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceDeliveryItems.length === 0 ? (
                        <tr>
                          <td colSpan={(hasPreviousDelivery || deliverySequence > 1) ? 7 : 5} className="px-4 py-8 text-center text-muted-foreground">
                            {hasBalanceDelivery ? "All items have been fully delivered." : "No equipment items available."}
                          </td>
                        </tr>
                      ) : (
                        balanceDeliveryItems.map((item, idx) => {
                          const orderedQty = getOrderedQuantity(item);
                          const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "");
                          const remainingQty = Math.max(orderedQty - deliveredQty, 0);
                          const isFullyDelivered = deliveredQty === orderedQty;
                          return (
                            <tr 
                              key={`hire-delivery-${item.id}`} 
                              className={`border-t border-border transition-colors ${isFullyDelivered ? 'bg-green-50/50' : 'hover:bg-muted/30'}`}
                            >
                              <td className="px-4 py-3 font-mono text-xs">{item.itemCode || "-"}</td>
                              <td className="px-4 py-3">{item.description}</td>
                              {(hasPreviousDelivery || deliverySequence > 1) && (
                                <>
                                  <td className="px-4 py-3 text-right text-muted-foreground">{item.originalQuantity}</td>
                                  <td className="px-4 py-3 text-right text-muted-foreground">{item.previouslyDelivered}</td>
                                </>
                              )}
                              <td className="px-4 py-3 text-right font-semibold">{orderedQty}</td>
                              <td className="px-4 py-3 text-right bg-primary/5">
                                <Input
                                  type="number"
                                  min="0"
                                  max={orderedQty}
                                  className="h-9 w-24 text-right font-medium border-primary/30 focus:border-primary"
                                  value={deliveryQuantities[item.id] ?? ""}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    const nextValue = parseNumber(rawValue);
                                    if (nextValue > orderedQty) {
                                      toast.error("Delivery quantity cannot exceed available quantity.");
                                      setDeliveryQuantities((prev) => ({ ...prev, [item.id]: String(orderedQty) }));
                                      return;
                                    }
                                    setDeliveryQuantities((prev) => ({ ...prev, [item.id]: rawValue }));
                                  }}
                                  disabled={inventoryDeducted}
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`font-medium ${remainingQty === 0 ? 'text-green-600' : remainingQty > 0 ? 'text-amber-600' : ''}`}>
                                  {remainingQty}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {balanceDeliveryItems.length > 0 && (
                      <tfoot className="bg-muted/40">
                        <tr>
                          <td colSpan={(hasPreviousDelivery || deliverySequence > 1) ? 4 : 2} className="px-4 py-3 font-semibold">
                            Totals
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {balanceDeliveryItems.reduce((sum, item) => sum + getOrderedQuantity(item), 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold bg-primary/10">
                            {balanceDeliveryItems.reduce((sum, item) => sum + parseNumber(deliveryQuantities[item.id] ?? "0"), 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {balanceDeliveryItems.reduce((sum, item) => {
                              const orderedQty = getOrderedQuantity(item);
                              const deliveredQty = parseNumber(deliveryQuantities[item.id] ?? "0");
                              return sum + Math.max(orderedQty - deliveredQty, 0);
                            }, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-2 border-dashed">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Delivery Actions</p>
                    <p className="text-xs text-muted-foreground">
                      {!inventoryDeducted 
                        ? "Click 'Dispatch Delivery' to deduct from inventory and record this delivery."
                        : "Delivery dispatched. Generate reports or continue to next step."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!inventoryDeducted ? (
                      <Button
                        onClick={handleDispatchDelivery}
                        disabled={deductInventory.isPending || updateQuotation.isPending}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        {deductInventory.isPending ? "Dispatching..." : "Dispatch Delivery"}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-green-500/50 bg-green-500/10 text-green-600 h-9 px-3">
                        <CheckCircle2 className="h-3 w-3" />
                        Dispatched
                      </Badge>
                    )}
                    {currentDeliveryDispatched && (
                      <>
                        <Button variant="outline" onClick={() => handlePrintHireLoadingNote("current")}>
                          <Printer className="h-4 w-4 mr-2" />
                          Loading Note
                        </Button>
                        <Button variant="outline" onClick={handlePrintDeliveryNote}>
                          <Printer className="h-4 w-4 mr-2" />
                          Delivery Note
                        </Button>
                      </>
                    )}
                    <Button variant="outline" onClick={handlePrintYardVerificationNote}>
                      <Printer className="h-4 w-4 mr-2" />
                      Yard Verification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery History Section */}
            {(deliveryHistory.length > 0 || inventoryDeducted) && (
              <DeliveryHistorySection
                deliveries={deliveryHistory}
                onPrintDeliveryNote={handlePrintDeliveryNoteFromHistory}
                onPrintLoadingNote={handlePrintLoadingNoteFromHistory}
                onMarkDispatched={handleMarkDeliveryDispatched}
                onDeliverBalance={handleDeliverBalance}
                hasRemainingBalance={Object.values(remainingQuantities).some(qty => qty > 0)}
                totalDelivered={deliveryHistory.reduce((sum, d) => 
                  sum + d.items.reduce((itemSum, item) => itemSum + item.quantityDelivered, 0), 0
                )}
                totalOrdered={equipmentItems.reduce((sum, item) => sum + item.originalQuantity, 0)}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleNext} disabled={!inventoryDeducted}>
                {inventoryDeducted ? "Continue to Hire Return" : "Dispatch delivery first"}
              </Button>
            </div>
          </div>
        )}

        {/* Yard Verification Report (accessible from sidebar) */}
        {activeStep === "delivery" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Yard Verification Report No</Label>
                <Input value={deliveryNote.deliveryNoteNo} readOnly className="bg-muted" />
              </div>
              <div>
                <Label>Dispatch Date</Label>
                <Input
                  type="date"
                  value={deliveryNote.deliveryDate}
                  onChange={(e) => setDeliveryNote(prev => ({ ...prev, deliveryDate: e.target.value }))}
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

            <div className="flex items-center justify-end border-t border-border pt-4">
              <Button type="button" onClick={handlePrintYardVerificationNote}>
                <Printer className="h-4 w-4 mr-2" />
                Print Yard Verification Report
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Hire Return */}
        {activeStep === "return" && (
          <div className="space-y-6">
            {/* Site Selector for Return — MANDATORY when multiple sites exist */}
            {clientSites && clientSites.length > 0 && (
              <Card className={`border-2 ${!selectedReturnSiteId ? "border-destructive/50 bg-destructive/5" : "border-green-500/30 bg-green-500/5"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Select Return Site
                    {!selectedReturnSiteId ? (
                      <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs ml-2 border-green-500/50 text-green-600">Selected</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className={!selectedReturnSiteId ? "text-destructive font-medium" : ""}>
                      Which site is this return from? {!selectedReturnSiteId && <span className="text-destructive">*</span>}
                    </Label>
                    <Select value={selectedReturnSiteId} onValueChange={handleSelectReturnSite}>
                      <SelectTrigger className={!selectedReturnSiteId ? "border-destructive" : "border-green-500/40"}>
                        <SelectValue placeholder="Select a site to continue..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clientSites.map(site => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.site_number} — {site.site_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedReturnSiteId && (
                      <p className="text-xs text-destructive">⚠ A site must be selected before processing the return.</p>
                    )}
                    {selectedReturnSiteId && (() => {
                      const site = clientSites.find(s => s.id === selectedReturnSiteId);
                      return site ? (
                        <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted/30 rounded">
                          <span className="font-medium text-foreground">{site.site_number}</span> — {site.site_name}
                          {site.site_address && <span> • {site.site_address}</span>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Hire Return</h4>
                {returnSequence > 1 && (
                  <Badge variant="secondary">Batch {returnSequence}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Record the returned quantities by condition. Good and dirty items return to inventory,
                while damaged and scrap items are logged to maintenance.
              </p>
            </div>

            {/* Return Note Details Form */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Return Note Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Return Note Number</Label>
                    <Input value={returnNote.returnNoteNo} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label>Return Date</Label>
                    <Input
                      type="date"
                      value={returnNote.returnDate}
                      onChange={(e) => setReturnNote(prev => ({ ...prev, returnDate: e.target.value }))}
                      disabled={returnProcessed}
                    />
                  </div>
                  <div>
                    <Label>Hire End Date</Label>
                    <Input
                      type="date"
                      value={returnNote.hireEndDate}
                      onChange={(e) => setReturnNote(prev => ({ ...prev, hireEndDate: e.target.value }))}
                      disabled={returnProcessed}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Return Items Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-center font-medium">Delivered</th>
                    <th className="px-3 py-2 text-center font-medium">Prev. Returned</th>
                    <th className="px-3 py-2 text-center font-medium">Balance</th>
                    <th className="px-3 py-2 text-center font-medium">Good</th>
                    <th className="px-3 py-2 text-center font-medium">Dirty</th>
                    <th className="px-3 py-2 text-center font-medium">Damaged</th>
                    <th className="px-3 py-2 text-center font-medium">Scrap</th>
                    <th className="px-3 py-2 text-center font-medium">This Return</th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map((item) => {
                    const totalReturned =
                      parseNumber(item.good) +
                      parseNumber(item.dirty) +
                      parseNumber(item.damaged) +
                      parseNumber(item.scrap);
                    const fullyReturned = item.returnBalance <= 0;
                    return (
                      <tr key={item.id} className={`border-b border-border ${fullyReturned ? "bg-green-50/50 dark:bg-green-950/20" : ""}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{item.description || item.itemCode}</div>
                              <div className="text-xs text-muted-foreground">{item.itemCode || "—"}</div>
                            </div>
                            {fullyReturned && (
                              <Badge variant="outline" className="text-xs border-green-500/50 bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Done
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{item.totalDelivered}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{item.previouslyReturned}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-semibold ${item.returnBalance > 0 ? "text-amber-600" : "text-green-600"}`}>
                            {item.returnBalance}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.good}
                            onChange={(e) => handleReturnQuantityChange(item.id, "good", e.target.value)}
                            disabled={returnProcessed || fullyReturned || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.dirty}
                            onChange={(e) => handleReturnQuantityChange(item.id, "dirty", e.target.value)}
                            disabled={returnProcessed || fullyReturned || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.damaged}
                            onChange={(e) => handleReturnQuantityChange(item.id, "damaged", e.target.value)}
                            disabled={returnProcessed || fullyReturned || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.scrap}
                            onChange={(e) => handleReturnQuantityChange(item.id, "scrap", e.target.value)}
                            disabled={returnProcessed || fullyReturned || returnInventory.isPending || createMaintenanceLogs.isPending}
                            className="h-8 text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{totalReturned}</td>
                      </tr>
                    );
                  })}
                  {!returnItems.length && (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                        No hire items available for return yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Process Return + Print Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleProcessReturn}
                disabled={
                  returnProcessed ||
                  returnInventory.isPending ||
                  createMaintenanceLogs.isPending ||
                  updateQuotation.isPending ||
                  (!!clientSites && clientSites.length > 0 && !selectedReturnSiteId)
                }
                title={clientSites && clientSites.length > 0 && !selectedReturnSiteId ? "Select a site first" : undefined}
              >
                {returnProcessed
                  ? "Return Processed"
                  : updateQuotation.isPending
                    ? "Finalizing..."
                    : clientSites && clientSites.length > 0 && !selectedReturnSiteId
                      ? "Select site first"
                      : "Process Return"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintCurrentReturnNote}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Return Note
              </Button>
            </div>

            {/* Return History Section */}
            <ReturnHistorySection
              returns={returnHistory}
              onPrintReturnNote={handlePrintReturnNoteFromHistory}
              onReturnBalance={handleReturnBalance}
              hasRemainingBalance={returnItems.some(item => item.returnBalance > 0) && returnProcessed}
              totalReturned={returnItems.reduce((sum, item) => sum + item.previouslyReturned, 0)}
              totalDelivered={returnItems.reduce((sum, item) => sum + item.totalDelivered, 0)}
            />

            {/* Persistent Hire Return Report */}
            {returnHistory.length > 0 && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Hire Return Report — Cumulative Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Item</th>
                          <th className="px-3 py-2 text-right font-medium">Good</th>
                          <th className="px-3 py-2 text-right font-medium">Dirty</th>
                          <th className="px-3 py-2 text-right font-medium">Damaged</th>
                          <th className="px-3 py-2 text-right font-medium">Scrap</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                          <th className="px-3 py-2 text-right font-medium">Mass (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const cumulative: Record<string, { itemCode: string; description: string; good: number; dirty: number; damaged: number; scrap: number; total: number; mass: number }> = {};
                          returnHistory.forEach(r => r.items.forEach(item => {
                            const key = item.itemCode || item.description;
                            if (!cumulative[key]) cumulative[key] = { itemCode: item.itemCode, description: item.description, good: 0, dirty: 0, damaged: 0, scrap: 0, total: 0, mass: 0 };
                            cumulative[key].good += item.good;
                            cumulative[key].dirty += item.dirty;
                            cumulative[key].damaged += item.damaged;
                            cumulative[key].scrap += item.scrap;
                            cumulative[key].total += item.totalReturned;
                            cumulative[key].mass += item.totalMass;
                          }));
                          return Object.values(cumulative).map((item, idx) => (
                            <tr key={idx} className="border-b border-border/50">
                              <td className="px-3 py-2">
                                <span className="font-medium">{item.itemCode}</span>
                                <span className="text-muted-foreground ml-1">- {item.description}</span>
                              </td>
                              <td className="px-3 py-2 text-right text-green-600">{item.good}</td>
                              <td className="px-3 py-2 text-right text-amber-600">{item.dirty}</td>
                              <td className="px-3 py-2 text-right text-red-600">{item.damaged}</td>
                              <td className="px-3 py-2 text-right text-red-800">{item.scrap}</td>
                              <td className="px-3 py-2 text-right font-semibold">{item.total}</td>
                              <td className="px-3 py-2 text-right text-muted-foreground">{item.mass.toFixed(2)}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => returnHistory.length > 0 && handlePrintReturnNoteFromHistory(returnHistory[0])}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Latest Return Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HireQuotationWorkflow;
