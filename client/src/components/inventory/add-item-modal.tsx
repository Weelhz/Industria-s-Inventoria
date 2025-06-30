import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ItemWithCategory } from "@/lib/types";

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  sku: z.string().min(1, "Tag is required"),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  stockQuantity: z.number().min(0, "Stock quantity must be non-negative"),
  brokenQuantity: z.number().min(0, "Broken quantity must be non-negative"),
  rentedQuantity: z.number().min(0, "Rented quantity must be non-negative"),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Unit price must be a valid positive number",
  }),
  location: z.string().optional(),
  minStockLevel: z.number().min(0, "Minimum stock level must be non-negative").optional(),
  expirationDate: z.string().optional(),
  rentable: z.boolean().default(true),
  expirable: z.boolean().default(false),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ id: number; name: string }>;
  editItem?: ItemWithCategory | null;
  currentUserId?: number;
}

export default function AddItemModal({ open, onOpenChange, categories, editItem, currentUserId }: AddItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      categoryId: undefined,
      stockQuantity: 0,
      brokenQuantity: 0,
      rentedQuantity: 0,
      unitPrice: "0.00",
      location: "",
      minStockLevel: 5,
      expirationDate: "",
      rentable: false,
      expirable: false,
    },
  });

  React.useEffect(() => {
    if (editItem) {
      form.reset({
        name: editItem.name,
        sku: editItem.sku,
        description: editItem.description || "",
        categoryId: editItem.categoryId || undefined,
        stockQuantity: editItem.quantity || 0,
        brokenQuantity: editItem.brokenCount || 0,
        rentedQuantity: editItem.rentedCount || 0,
        unitPrice: editItem.unitPrice?.toString() || "0.00",
        location: editItem.location || "",
        minStockLevel: editItem.minStockLevel || 5,
        expirationDate: editItem.expirationDate ? formatDateForInput(new Date(editItem.expirationDate)) : "",
        rentable: editItem.rentable !== undefined ? editItem.rentable : false,
        expirable: editItem.expirable !== undefined ? editItem.expirable : false,
      });
    } else {
      form.reset({
        name: "",
        sku: "",
        description: "",
        categoryId: undefined,
        stockQuantity: 0,
        brokenQuantity: 0,
        rentedQuantity: 0,
        unitPrice: "0.00",
        location: "",
        minStockLevel: 5,
        expirationDate: "",
        rentable: false,
        expirable: false,
      });
    }
  }, [editItem, form]);

  const mutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      const submitData = {
        name: data.name,
        sku: data.sku,
        description: data.description || "",
        categoryId: data.categoryId || null,
        stockQuantity: data.stockQuantity,
        brokenQuantity: data.brokenQuantity,
        rentedQuantity: data.rentedQuantity,
        unitPrice: data.unitPrice,
        location: data.location || "",
        minStockLevel: data.minStockLevel || 5,
        expirationDate: data.expirationDate || null,
        rentable: data.rentable,
        expirable: data.expirable,
        userId: currentUserId || 1
      };

      const url = editItem ? `/api/items/${editItem.id}` : "/api/items";
      const method = editItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editItem ? 'update' : 'create'} item`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: editItem ? "Item updated" : "Item added",
        description: editItem ? "Item has been updated successfully." : "New item has been added to inventory.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ItemFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Tag" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
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
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brokenQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broken Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rentable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Rentable Item</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("rentable") && (
                <FormField
                  control={form.control}
                  name="rentedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rented Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Storage location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="5" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Expirable Item</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("expirable") && (
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Item description..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editItem ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}