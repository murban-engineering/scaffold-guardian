import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useCreateScaffold, useScaffolds, ScaffoldType, ScaffoldStatus } from "@/hooks/useScaffolds";
import { useSites } from "@/hooks/useSites";

const scaffoldTypes: { value: ScaffoldType; label: string }[] = [
  { value: "frame", label: "Frame" },
  { value: "tube_coupler", label: "Tube & Coupler" },
  { value: "mobile", label: "Mobile" },
  { value: "suspended", label: "Suspended" },
  { value: "cantilever", label: "Cantilever" },
  { value: "system", label: "System" },
];

const scaffoldStatuses: { value: ScaffoldStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "damaged", label: "Damaged" },
  { value: "maintenance", label: "Maintenance" },
];

const formSchema = z.object({
  scaffold_type: z.enum(["frame", "tube_coupler", "mobile", "suspended", "cantilever", "system"]),
  status: z.enum(["available", "in_use", "damaged", "maintenance"]).default("available"),
  part_number: z.string().max(50, "Part number must be less than 50 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or greater").default(0),
  mass_per_item: z.coerce.number().min(0, "Mass must be 0 or greater").optional(),
  weekly_rate: z.coerce.number().min(0, "Rate must be 0 or greater").optional(),
  manufacturer: z.string().max(100, "Manufacturer must be less than 100 characters").optional(),
  site_id: z.string().uuid().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const AddScaffold = () => {
  const navigate = useNavigate();
  const createScaffold = useCreateScaffold();
  const { data: sites } = useSites();
  const { data: existingScaffolds } = useScaffolds();

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
      quantity: 0,
      mass_per_item: undefined,
      weekly_rate: undefined,
      manufacturer: "",
      site_id: "",
    },
  });

  const handlePresetSelect = (scaffoldId: string) => {
    const scaffold = existingScaffolds?.find(s => s.id === scaffoldId);
    if (scaffold) {
      form.setValue("scaffold_type", scaffold.scaffold_type);
      form.setValue("part_number", scaffold.part_number || "");
      form.setValue("description", scaffold.description || "");
      form.setValue("mass_per_item", scaffold.mass_per_item || undefined);
      form.setValue("weekly_rate", scaffold.weekly_rate || undefined);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const scaffoldData = {
      scaffold_type: values.scaffold_type,
      status: values.status,
      part_number: values.part_number || null,
      description: values.description || null,
      quantity: values.quantity,
      mass_per_item: values.mass_per_item || null,
      weekly_rate: values.weekly_rate || null,
      manufacturer: values.manufacturer || null,
      site_id: values.site_id && values.site_id !== "" ? values.site_id : null,
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
                        Quick Select from Price List
                      </FormLabel>
                      <Select onValueChange={handlePresetSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item to auto-fill details..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {existingScaffolds?.map((scaffold) => (
                            <SelectItem key={scaffold.id} value={scaffold.id}>
                              {scaffold.part_number} - {scaffold.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Or fill in the details manually below
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="scaffold_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Scaffold Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {scaffoldTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {scaffoldStatuses.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Kwik-stage" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="site_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign to Site</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select site (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sites?.map((site) => (
                                  <SelectItem key={site.id} value={site.id}>
                                    {site.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                        disabled={createScaffold.isPending}
                      >
                        {createScaffold.isPending ? "Adding..." : "Add Scaffold"}
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
