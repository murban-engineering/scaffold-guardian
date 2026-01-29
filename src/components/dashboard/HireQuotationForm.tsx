import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useScaffolds } from "@/hooks/useScaffolds";

const projectTypes = [
  { id: "building", label: "Building" },
  { id: "education", label: "Education" },
  { id: "healthcare", label: "Healthcare" },
  { id: "office_blocks", label: "Office Blocks" },
  { id: "residential", label: "Residential" },
  { id: "shopping_centre", label: "Shopping Centre" },
  { id: "tourism_hotels", label: "Tourism / Hotels" },
];

const marketSegments = [
  { id: "civils", label: "Civils" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "mines", label: "Mines" },
  { id: "petrochemical", label: "Petrochemical" },
  { id: "scaffolding", label: "Scaffolding" },
  { id: "building_industry", label: "Building Industry" },
  { id: "civils_industry", label: "Civils Industry" },
  { id: "industrial_industry", label: "Industrial Industry" },
];

const HireQuotationForm = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [formData, setFormData] = useState({
    // Invoicing
    companyName: "",
    siteManagerName: "",
    siteManagerCell: "",
    siteManagerEmail: "",
    officeTel: "",
    officeEmail: "",
    // Ordering
    customerOrderNumber: "",
    officialOrdersUsed: false,
    bulkOrdersUsed: false,
    newOrderForEveryQuote: false,
    telephonicOrders: false,
    personsNameAsOrder: false,
    personsName: "",
    requisitionNumberUsed: false,
    requisitionNumber: "",
    // Transport
    fixedRateAgreed: "",
    returns: "",
    deliveries: "",
    specialTransportArrangement: "",
    // Discounts
    tonnageProduct: "",
    tonnageHireDiscount: "",
    tonnageSalesDiscount: "",
    tonnageRate: "",
    basketProduct: "",
    basketHireDiscount: "",
    basketSalesDiscount: "",
    basketRate: "",
    straightHireProduct: "",
    straightHireDiscount: "",
    straightSalesDiscount: "",
    straightRate: "",
    nettProduct: "",
    nettHireDiscount: "",
    nettSalesDiscount: "",
    nettRate: "",
    quoteNumber: "",
    // Project Type
    projectTypes: [] as string[],
    marketSegments: [] as string[],
    // Internal Information
    customerAccountNo: "",
    accountType: "30_day",
    depositAccount: "",
    moneyPaidDeposit: "",
    paymentMethod: "eft",
    creditLimit: "",
    balanceAvailable: "",
    siteName: "",
    siteAddress: "",
    fsSalesman: "",
    date: "",
  });
  const [equipmentForm, setEquipmentForm] = useState({
    partId: "",
    orderQuantity: "",
  });
  const { data: scaffolds, isLoading, error } = useScaffolds();

  const selectedScaffold = scaffolds?.find((item) => item.id === equipmentForm.partId);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  };

  const formatMass = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `${value} kg`;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxArrayChange = (field: "projectTypes" | "marketSegments", value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quote submitted:", formData);
    toast.success("Hire quotation submitted successfully!");
  };

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Hire Quotation</CardTitle>
                <p className="text-sm text-muted-foreground">Site Master - Customer Information</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invoicing Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Invoicing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName">Company name to appear on invoice</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteManagerName">Site Manager's Name</Label>
                    <Input
                      id="siteManagerName"
                      value={formData.siteManagerName}
                      onChange={(e) => handleInputChange("siteManagerName", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="officeTel">Office Tel</Label>
                    <Input
                      id="officeTel"
                      value={formData.officeTel}
                      onChange={(e) => handleInputChange("officeTel", e.target.value)}
                      placeholder="Office telephone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteManagerCell">Cell</Label>
                    <Input
                      id="siteManagerCell"
                      value={formData.siteManagerCell}
                      onChange={(e) => handleInputChange("siteManagerCell", e.target.value)}
                      placeholder="Mobile number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="officeEmail">Office Email</Label>
                    <Input
                      id="officeEmail"
                      type="email"
                      value={formData.officeEmail}
                      onChange={(e) => handleInputChange("officeEmail", e.target.value)}
                      placeholder="Office email address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="siteManagerEmail">Site Manager's Email</Label>
                    <Input
                      id="siteManagerEmail"
                      type="email"
                      value={formData.siteManagerEmail}
                      onChange={(e) => handleInputChange("siteManagerEmail", e.target.value)}
                      placeholder="Site manager email"
                    />
                  </div>
                </div>
              </div>

            {/* Ordering Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Ordering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerOrderNumber">Customer Order Number</Label>
                  <Input
                    id="customerOrderNumber"
                    value={formData.customerOrderNumber}
                    onChange={(e) => handleInputChange("customerOrderNumber", e.target.value)}
                    placeholder="Order number"
                  />
                </div>
                <div>
                  <Label htmlFor="personsName">Person's Name</Label>
                  <Input
                    id="personsName"
                    value={formData.personsName}
                    onChange={(e) => handleInputChange("personsName", e.target.value)}
                    placeholder="Contact person"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="officialOrdersUsed"
                    checked={formData.officialOrdersUsed}
                    onCheckedChange={(checked) => handleInputChange("officialOrdersUsed", !!checked)}
                  />
                  <Label htmlFor="officialOrdersUsed" className="text-sm">Official orders used</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulkOrdersUsed"
                    checked={formData.bulkOrdersUsed}
                    onCheckedChange={(checked) => handleInputChange("bulkOrdersUsed", !!checked)}
                  />
                  <Label htmlFor="bulkOrdersUsed" className="text-sm">Bulk orders used</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="telephonicOrders"
                    checked={formData.telephonicOrders}
                    onCheckedChange={(checked) => handleInputChange("telephonicOrders", !!checked)}
                  />
                  <Label htmlFor="telephonicOrders" className="text-sm">Telephonic orders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newOrderForEveryQuote"
                    checked={formData.newOrderForEveryQuote}
                    onCheckedChange={(checked) => handleInputChange("newOrderForEveryQuote", !!checked)}
                  />
                  <Label htmlFor="newOrderForEveryQuote" className="text-sm">New order for every quote</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="personsNameAsOrder"
                    checked={formData.personsNameAsOrder}
                    onCheckedChange={(checked) => handleInputChange("personsNameAsOrder", !!checked)}
                  />
                  <Label htmlFor="personsNameAsOrder" className="text-sm">Person's name as order</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="requisitionNumberUsed"
                    checked={formData.requisitionNumberUsed}
                    onCheckedChange={(checked) => handleInputChange("requisitionNumberUsed", !!checked)}
                  />
                  <Label htmlFor="requisitionNumberUsed" className="text-sm">Requisition number used</Label>
                  {formData.requisitionNumberUsed && (
                    <Input
                      value={formData.requisitionNumber}
                      onChange={(e) => handleInputChange("requisitionNumber", e.target.value)}
                      placeholder="Requisition #"
                      className="w-32"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Transport Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Transport</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="fixedRateAgreed">Fixed Rate Agreed</Label>
                  <Input
                    id="fixedRateAgreed"
                    value={formData.fixedRateAgreed}
                    onChange={(e) => handleInputChange("fixedRateAgreed", e.target.value)}
                    placeholder="Rate"
                  />
                </div>
                <div>
                  <Label htmlFor="returns">Returns</Label>
                  <Input
                    id="returns"
                    value={formData.returns}
                    onChange={(e) => handleInputChange("returns", e.target.value)}
                    placeholder="Return details"
                  />
                </div>
                <div>
                  <Label htmlFor="deliveries">Deliveries</Label>
                  <Input
                    id="deliveries"
                    value={formData.deliveries}
                    onChange={(e) => handleInputChange("deliveries", e.target.value)}
                    placeholder="Delivery info"
                  />
                </div>
                <div>
                  <Label htmlFor="specialTransportArrangement">Special Transport Arrangement</Label>
                  <Input
                    id="specialTransportArrangement"
                    value={formData.specialTransportArrangement}
                    onChange={(e) => handleInputChange("specialTransportArrangement", e.target.value)}
                    placeholder="Special arrangements"
                  />
                </div>
              </div>
            </div>

            {/* Discounts Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Discounts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Product</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Hire Discount</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Sales Discount</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-medium">Tonnage</td>
                      <td className="py-2"><Input className="h-8" value={formData.tonnageProduct} onChange={(e) => handleInputChange("tonnageProduct", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.tonnageHireDiscount} onChange={(e) => handleInputChange("tonnageHireDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.tonnageSalesDiscount} onChange={(e) => handleInputChange("tonnageSalesDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.tonnageRate} onChange={(e) => handleInputChange("tonnageRate", e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Basket</td>
                      <td className="py-2"><Input className="h-8" value={formData.basketProduct} onChange={(e) => handleInputChange("basketProduct", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.basketHireDiscount} onChange={(e) => handleInputChange("basketHireDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.basketSalesDiscount} onChange={(e) => handleInputChange("basketSalesDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.basketRate} onChange={(e) => handleInputChange("basketRate", e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Straight Hire</td>
                      <td className="py-2"><Input className="h-8" value={formData.straightHireProduct} onChange={(e) => handleInputChange("straightHireProduct", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.straightHireDiscount} onChange={(e) => handleInputChange("straightHireDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.straightSalesDiscount} onChange={(e) => handleInputChange("straightSalesDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.straightRate} onChange={(e) => handleInputChange("straightRate", e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Nett</td>
                      <td className="py-2"><Input className="h-8" value={formData.nettProduct} onChange={(e) => handleInputChange("nettProduct", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.nettHireDiscount} onChange={(e) => handleInputChange("nettHireDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.nettSalesDiscount} onChange={(e) => handleInputChange("nettSalesDiscount", e.target.value)} /></td>
                      <td className="py-2"><Input className="h-8" value={formData.nettRate} onChange={(e) => handleInputChange("nettRate", e.target.value)} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="w-48">
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <Input
                  id="quoteNumber"
                  value={formData.quoteNumber}
                  onChange={(e) => handleInputChange("quoteNumber", e.target.value)}
                  placeholder="Quote #"
                />
              </div>
            </div>

            {/* Project Type / Market Segmentation */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Project Type / Market Segmentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-3 text-muted-foreground">Project Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {projectTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={formData.projectTypes.includes(type.id)}
                          onCheckedChange={(checked) => handleCheckboxArrayChange("projectTypes", type.id, !!checked)}
                        />
                        <Label htmlFor={type.id} className="text-sm">{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3 text-muted-foreground">Market Segmentation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {marketSegments.map((segment) => (
                      <div key={segment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={segment.id}
                          checked={formData.marketSegments.includes(segment.id)}
                          onCheckedChange={(checked) => handleCheckboxArrayChange("marketSegments", segment.id, !!checked)}
                        />
                        <Label htmlFor={segment.id} className="text-sm">{segment.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-primary border-b border-border pb-2">Internal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="customerAccountNo">Customer Account No.</Label>
                  <Input
                    id="customerAccountNo"
                    value={formData.customerAccountNo}
                    onChange={(e) => handleInputChange("customerAccountNo", e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(value) => handleInputChange("accountType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30_day">30 Day Account</SelectItem>
                      <SelectItem value="60_day">60 Day Account</SelectItem>
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="depositAccount">Deposit Account</Label>
                  <Input
                    id="depositAccount"
                    value={formData.depositAccount}
                    onChange={(e) => handleInputChange("depositAccount", e.target.value)}
                    placeholder="Deposit account"
                  />
                </div>
                <div>
                  <Label htmlFor="moneyPaidDeposit">Money Paid (Deposit) R</Label>
                  <Input
                    id="moneyPaidDeposit"
                    value={formData.moneyPaidDeposit}
                    onChange={(e) => handleInputChange("moneyPaidDeposit", e.target.value)}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eft">EFT</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    value={formData.creditLimit}
                    onChange={(e) => handleInputChange("creditLimit", e.target.value)}
                    placeholder="Limit"
                  />
                </div>
                <div>
                  <Label htmlFor="balanceAvailable">Balance Available</Label>
                  <Input
                    id="balanceAvailable"
                    value={formData.balanceAvailable}
                    onChange={(e) => handleInputChange("balanceAvailable", e.target.value)}
                    placeholder="Available balance"
                  />
                </div>
                <div>
                  <Label htmlFor="fsSalesman">Salesman</Label>
                  <Input
                    id="fsSalesman"
                    value={formData.fsSalesman}
                    onChange={(e) => handleInputChange("fsSalesman", e.target.value)}
                    placeholder="Salesman name"
                  />
                </div>
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) => handleInputChange("siteName", e.target.value)}
                    placeholder="Site name"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label htmlFor="siteAddress">Site Address</Label>
                  <Textarea
                    id="siteAddress"
                    value={formData.siteAddress}
                    onChange={(e) => handleInputChange("siteAddress", e.target.value)}
                    placeholder="Full site address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>
            </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setFormData({
                  companyName: "", siteManagerName: "", siteManagerCell: "", siteManagerEmail: "",
                  officeTel: "", officeEmail: "", customerOrderNumber: "", officialOrdersUsed: false,
                  bulkOrdersUsed: false, newOrderForEveryQuote: false, telephonicOrders: false,
                  personsNameAsOrder: false, personsName: "", requisitionNumberUsed: false,
                  requisitionNumber: "", fixedRateAgreed: "", returns: "", deliveries: "",
                  specialTransportArrangement: "", tonnageProduct: "", tonnageHireDiscount: "",
                  tonnageSalesDiscount: "", tonnageRate: "", basketProduct: "", basketHireDiscount: "",
                  basketSalesDiscount: "", basketRate: "", straightHireProduct: "", straightHireDiscount: "",
                  straightSalesDiscount: "", straightRate: "", nettProduct: "", nettHireDiscount: "",
                  nettSalesDiscount: "", nettRate: "", quoteNumber: "", projectTypes: [],
                  marketSegments: [], customerAccountNo: "", accountType: "30_day", depositAccount: "",
                  moneyPaidDeposit: "", paymentMethod: "eft", creditLimit: "", balanceAvailable: "",
                  siteName: "", siteAddress: "", fsSalesman: "", date: "",
                })}>
                  Clear Form
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Submit Quotation
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Equipment Details</CardTitle>
              <p className="text-sm text-muted-foreground">Select a part to load inventory details</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading inventory parts...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Unable to load inventory items.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipmentPart">Part</Label>
                  <Select
                    value={equipmentForm.partId}
                    onValueChange={(value) => setEquipmentForm((prev) => ({ ...prev, partId: value }))}
                  >
                    <SelectTrigger id="equipmentPart">
                      <SelectValue placeholder="Select a part from inventory" />
                    </SelectTrigger>
                    <SelectContent>
                      {scaffolds?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.part_number || "No Part #"} — {item.description || item.scaffold_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="equipmentOrderQty">Order Quantity</Label>
                  <Input
                    id="equipmentOrderQty"
                    value={equipmentForm.orderQuantity}
                    onChange={(e) => setEquipmentForm((prev) => ({ ...prev, orderQuantity: e.target.value }))}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Description</Label>
                  <Input value={selectedScaffold?.description || selectedScaffold?.scaffold_type || ""} readOnly />
                </div>
                <div>
                  <Label>Mass per Item</Label>
                  <Input value={formatMass(selectedScaffold?.mass_per_item)} readOnly />
                </div>
                <div>
                  <Label>Weekly Rate</Label>
                  <Input value={formatCurrency(selectedScaffold?.weekly_rate)} readOnly />
                </div>
                <div>
                  <Label>Available Quantity</Label>
                  <Input value={selectedScaffold?.quantity?.toString() || ""} readOnly />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline">
                  Add Equipment
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HireQuotationForm;
