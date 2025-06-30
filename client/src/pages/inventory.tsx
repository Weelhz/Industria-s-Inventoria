import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import InventoryTable from "@/components/inventory/inventory-table";
import AddItemModal from "@/components/inventory/add-item-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ItemWithCategory } from "@/lib/types";

export default function Inventory() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItemWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemWithCategory[]>({
    queryKey: ["/api/items", searchQuery, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Item deleted",
        description: "Item has been removed from inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const rentItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`/api/items/${id}/rent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rent item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/low-stock"] });
      toast({
        title: "Item rented",
        description: "Item has been rented successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rent item",
        variant: "destructive",
      });
    },
  });

  const returnItemMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`/api/items/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to return item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items/low-stock"] });
      toast({
        title: "Item returned",
        description: "Item has been returned successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return item",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setCategoryFilter(categoryId);
  };

  const handleAddItem = () => {
    setEditItem(null);
    setIsAddModalOpen(true);
  };

  const handleEditItem = (item: ItemWithCategory) => {
    setEditItem(item);
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (itemId: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleRentItem = (itemId: number) => {
    const quantity = prompt("Enter quantity to rent:");
    if (quantity && parseInt(quantity) > 0) {
      rentItemMutation.mutate({ id: itemId, quantity: parseInt(quantity) });
    } else {
      toast({
        title: "Error",
        description: "Invalid quantity",
        variant: "destructive",
      });
    }
  };

  const handleReturnItem = (itemId: number) => {
    const quantity = prompt("Enter quantity to return:");
    if (quantity && parseInt(quantity) > 0) {
      returnItemMutation.mutate({ id: itemId, quantity: parseInt(quantity) });
    } else {
      toast({
        title: "Error",
        description: "Invalid quantity",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditItem(null);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/database/export/inventory");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export completed",
        description: "Inventory exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export inventory",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const { format } = new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const handleDeleteCategory = async (categoryId: number) => {
      try {
        const response = await apiRequest(
          `/api/categories/${categoryId}`,
          "DELETE"
        );

        let result;
        try {
          const responseText = await response.text();
          if (responseText) {
            result = JSON.parse(responseText);
          }
        } catch (parseError) {
          result = { success: true };
        }

        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete category";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-end items-center">
          <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <InventoryTable
            items={items}
            categories={categories}
            onCategoryFilter={handleCategoryFilter}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onRentItem={handleRentItem}
            onReturnItem={handleReturnItem}
            onSearch={handleSearch}
            isLoading={itemsLoading}
            showAllColumns={true}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
      </div>

      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        categories={categories}
        editItem={editItem}
        currentUserId={currentUserId}
      />
    </div>
  );
}
