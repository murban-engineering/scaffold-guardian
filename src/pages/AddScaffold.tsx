import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import constructionImage from "@/assets/construction-silhouette.jpg";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useCreateScaffold, useDeleteScaffold, useScaffolds, useUpdateScaffold } from "@/hooks/useScaffolds";
import { getInventoryGroupKey, getInventoryGroupLabel } from "@/lib/inventoryGrouping";

const formSchema = z.object({
  scaffold_type: z.enum(["frame", "tube_coupler", "mobile", "suspended", "cantilever", "system"]),
  status: z.enum(["available", "in_use", "damaged", "maintenance"]).default("available"),
  part_number: z
    .string()
    .min(1, "Part number is required")
    .max(50, "Part number must be less than 50 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  adjustment_type: z.enum(["add", "remove"]).default("add"),
  quantity: z.coerce
    .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
    .int()
    .min(0, "Quantity must be 0 or greater"),
  mass_per_item: z.coerce
    .number({ required_error: "Mass per item is required", invalid_type_error: "Mass per item must be a number" })
    .min(0, "Mass must be 0 or greater"),
  weekly_rate: z.coerce
    .number({ required_error: "Weekly rate is required", invalid_type_error: "Weekly rate must be a number" })
    .min(0, "Rate must be 0 or greater"),
  unit_price: z.coerce
    .number({ invalid_type_error: "Unit price must be a number" })
    .min(0, "Unit price must be 0 or greater")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddScaffold = () => {
  const navigate = useNavigate();
  const createScaffold = useCreateScaffold();
  const updateScaffold = useUpdateScaffold();
  const deleteScaffold = useDeleteScaffold();
  const { data: existingScaffolds } = useScaffolds();
  const [selectedScaffoldId, setSelectedScaffoldId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const isSubmitting = createScaffold.isPending || updateScaffold.isPending;

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
    if (item === "previous-clients") {
      navigate("/previous-clients");
      return;
    }
    if (item === "maintenance") {
      navigate("/maintenance-logs");
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
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scaffold_type: "system",
      status: "available",
      part_number: "",
      description: "",
      adjustment_type: "add",
      quantity: undefined,
      mass_per_item: undefined,
      weekly_rate: undefined,
      unit_price: undefined,
    },
  });
  const adjustmentType = form.watch("adjustment_type");
  const quantityValue = form.watch("quantity");
  const selectedScaffold = existingScaffolds?.find((scaffold) => scaffold.id === selectedScaffoldId);
  const currentQuantity = selectedScaffold?.quantity ?? 0;

  const watchedPartNumber = form.watch("part_number");

  const groupedInventoryOptions = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filtered = (existingScaffolds ?? []).filter((scaffold) => {
      if (!query) return true;
      return (
        (scaffold.part_number ?? "").toLowerCase().includes(query) ||
        (scaffold.description ?? "").toLowerCase().includes(query) ||
        scaffold.scaffold_type.toLowerCase().includes(query)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const groupA = getInventoryGroupKey(a.description ?? a.scaffold_type);
      const groupB = getInventoryGroupKey(b.description ?? b.scaffold_type);
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return (a.description ?? "").localeCompare(b.description ?? "");
    });

    return sorted.reduce<Record<string, typeof sorted>>((acc, scaffold) => {
      const group = getInventoryGroupKey(scaffold.description ?? scaffold.scaffold_type);
      if (!acc[group]) acc[group] = [];
      acc[group].push(scaffold);
      return acc;
    }, {});
  }, [existingScaffolds, inventorySearch]);

  const handlePresetSelect = (scaffoldId: string) => {
    const scaffold = existingScaffolds?.find(s => s.id === scaffoldId);
    if (scaffold) {
      setSelectedScaffoldId(scaffoldId);
      setShowDeleteConfirm(false);
      form.setValue("scaffold_type", scaffold.scaffold_type);
      form.setValue("part_number", scaffold.part_number || "");
      form.setValue("description", scaffold.description || "");
      form.setValue("mass_per_item", scaffold.mass_per_item || undefined);
      form.setValue("weekly_rate", scaffold.weekly_rate || undefined);
      form.setValue("unit_price", scaffold.unit_price || undefined);
    }
  };

  const handleAdjustmentSelect = (type: FormValues["adjustment_type"]) => {
    form.setValue("adjustment_type", type);
    if (type === "remove" && !selectedScaffoldId && existingScaffolds?.length) {
      handlePresetSelect(existingScaffolds[0].id);
    }
    if (type !== "remove") {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteRequest = () => {
    if (!selectedScaffoldId) {
      toast.error("Select an inventory item to delete.");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handleDeleteSelected = async () => {
    if (!selectedScaffoldId) {
      toast.error("Select an inventory item to delete.");
      return;
    }
    await deleteScaffold.mutateAsync(selectedScaffoldId);
    setSelectedScaffoldId(null);
    setShowDeleteConfirm(false);
    form.reset({
      scaffold_type: "system",
      status: "available",
      part_number: "",
      description: "",
      adjustment_type: "add",
      quantity: undefined,
      mass_per_item: undefined,
      weekly_rate: undefined,
      unit_price: undefined,
    });
  };

  useEffect(() => {
    if (adjustmentType !== "remove") {
      form.clearErrors("quantity");
      return;
    }
    if (!selectedScaffold) {
      return;
    }
    if ((quantityValue ?? 0) > currentQuantity) {
      form.setError("quantity", {
        type: "validate",
        message: `Cannot deduct more than ${currentQuantity} in inventory.`,
      });
      return;
    }
    form.clearErrors("quantity");
  }, [adjustmentType, currentQuantity, form, quantityValue, selectedScaffold]);

  useEffect(() => {
    const normalizedPartNumber = (watchedPartNumber ?? "").trim().toLowerCase();
    if (!normalizedPartNumber) return;

    const matchingScaffold = existingScaffolds?.find(
      (scaffold) => (scaffold.part_number ?? "").trim().toLowerCase() === normalizedPartNumber
    );

    if (!matchingScaffold) return;
    if (selectedScaffoldId === matchingScaffold.id) return;

    setSelectedScaffoldId(matchingScaffold.id);
    setShowDeleteConfirm(false);
    form.setValue("scaffold_type", matchingScaffold.scaffold_type);
    form.setValue("part_number", matchingScaffold.part_number || "");
    form.setValue("description", matchingScaffold.description || "");
    form.setValue("mass_per_item", matchingScaffold.mass_per_item || undefined);
    form.setValue("weekly_rate", matchingScaffold.weekly_rate || undefined);
    form.setValue("unit_price", matchingScaffold.unit_price || undefined);
    form.setValue("quantity", matchingScaffold.quantity ?? undefined);
  }, [existingScaffolds, form, selectedScaffoldId, watchedPartNumber]);

  const onSubmit = async (values: FormValues) => {
    if (values.adjustment_type === "remove") {
      if (!selectedScaffold) {
        toast.error("Select an existing inventory item before removing quantity.");
        return;
      }
      const removeQuantity = values.quantity ?? 0;
      if (removeQuantity <= 0) {
        toast.error("Removal quantity must be greater than 0.");
        return;
      }
      if (removeQuantity > currentQuantity) {
        toast.error(`Cannot remove ${removeQuantity}. Only ${currentQuantity} available.`);
        return;
      }
      await updateScaffold.mutateAsync({
        id: selectedScaffold.id,
        quantity: currentQuantity - removeQuantity,
      });
      navigate("/");
      return;
    }

    const scaffoldData = {
      scaffold_type: values.scaffold_type,
      status: values.status,
      part_number: values.part_number,
      description: values.description,
      quantity: values.quantity,
      mass_per_item: values.mass_per_item,
      weekly_rate: values.weekly_rate,
      unit_price: values.unit_price ?? null,
    };

    await createScaffold.mutateAsync(scaffoldData);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="inventory" onItemClick={handleSidebarItemClick} />
      <div className="ml-0 md:ml-64">
        <Header title="Add Scaffold" subtitle="Register new equipment" />
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60">
              <img
                src={constructionImage}
                alt="Construction site silhouette"
                className="h-36 w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
              <div className="absolute inset-0 flex items-end p-4">
                <p className="text-sm font-medium text-primary-foreground">
                  Keep your inventory records accurate before creating quotations and dispatches.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Scaffold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Preset Selection */}
                    <div className="p-4 bg-muted rounded-lg">
                      <FormLabel className="text-sm font-medium mb-2 block">
                        Quick Select from Inventory
                      </FormLabel>
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={inventorySearch}
                          onChange={(event) => setInventorySearch(event.target.value)}
                          placeholder="Search by part number, description, or type..."
                          className="pl-9"
                        />
                      </div>
                      <Select onValueChange={handlePresetSelect} value={selectedScaffoldId ?? ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item to auto-fill details..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[320px]">
                          {Object.entries(groupedInventoryOptions).map(([group, items]) => (
                            <SelectGroup key={group}>
                              <SelectLabel>{getInventoryGroupLabel(group)}</SelectLabel>
                              {items.map((scaffold) => (
                                <SelectItem key={scaffold.id} value={scaffold.id}>
                                  {scaffold.part_number} - {scaffold.description}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Enter an existing part number to auto-fill, or complete the form manually below
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current inventory quantity: {currentQuantity}
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="adjustment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Actions</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <Button
                                type="button"
                                variant={field.value === "add" ? "default" : "outline"}
                                className="justify-start gap-2"
                                onClick={() => handleAdjustmentSelect("add")}
                              >
                                <Plus className="h-4 w-4" />
                                Add Inventory
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "remove" ? "default" : "outline"}
                                className="justify-start gap-2"
                                onClick={() => handleAdjustmentSelect("remove")}
                              >
                                <Minus className="h-4 w-4" />
                                Deduct Inventory
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="justify-start gap-2 sm:col-span-2"
                                onClick={handleDeleteRequest}
                                disabled={deleteScaffold.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                                {deleteScaffold.isPending ? "Deleting..." : "Delete Inventory Item"}
                              </Button>
                              {showDeleteConfirm && (
                                <div className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                                  <p className="font-medium">
                                    Are you sure you want to delete this inventory item?
                                  </p>
                                  <p className="text-xs text-destructive/80">
                                    This action cannot be undone.
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={handleDeleteSelected}
                                      disabled={deleteScaffold.isPending}
                                    >
                                      {deleteScaffold.isPending ? "Deleting..." : "Confirm Delete"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => setShowDeleteConfirm(false)}
                                      disabled={deleteScaffold.isPending}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-2">
                            Deduct and delete actions use the inventory selector above to target an item.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="part_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Part Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1105005" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Kwik-stage Standard 3000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max={adjustmentType === "remove" ? currentQuantity : undefined}
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mass_per_item"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mass per Item (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                                {...field} 
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weekly_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weekly Rate (Ksh)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                                {...field} 
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price / Selling Price (Ksh)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                placeholder="0.00"
                                {...field} 
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/")}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Saving..."
                          : adjustmentType === "remove"
                          ? "Deduct Inventory"
                          : "Add Inventory"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddScaffold;
