import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import StatsCards from "@/components/inventory/stats-cards";
import RecentActivity from "@/components/activity/recent-activity";
import LowStockDisplay from "@/components/dashboard/low-stock-display";
import InventoryTable from "@/components/inventory/inventory-table";
import AddItemModal from "@/components/inventory/add-item-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ItemWithCategory, TransactionWithDetails } from "@/lib/types";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItemWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/categories"],
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

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions", "recent"],
    queryFn: async () => {
      const response = await fetch("/api/transactions?limit=10");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings/expires-threshold"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/expires-threshold");
        if (!response.ok) return { expiresSoonThreshold: 7 };
        return response.json();
      } catch (error) {
        console.error("Failed to fetch expires threshold:", error);
        return { expiresSoonThreshold: 7 };
      }
    },
  });

  const { data: expiringSoonItems = [] } = useQuery<ItemWithCategory[]>({
    queryKey: ["/api/items/expires-soon"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/items/expires-soon");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch expiring items:", error);
        return [];
      }
    },
  });

  const expiresSoonThreshold = settings?.expiresSoonThreshold || 7;

  const expiredItems = items.filter(item => {
    if (!item?.expirable || !item?.expirationDate) return false;
    try {
      const expirationDate = new Date(item.expirationDate);
      if (isNaN(expirationDate.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expirationDate.setHours(0, 0, 0, 0);
      return expirationDate <= today;
    } catch (error) {
      console.error("Error parsing expiration date:", error);
      return false;
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setCategoryFilter(categoryId);
  };

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!itemId || itemId <= 0) throw new Error("Invalid item ID");
      return await apiRequest("DELETE", `/api/items/${itemId}`);
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
      console.error("Delete item error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const rentItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!itemId || itemId <= 0) throw new Error("Invalid item ID");
      const quantity = prompt("Enter quantity to rent:");
      const parsedQuantity = parseInt(quantity || "0");
      if (!quantity || parsedQuantity <= 0 || isNaN(parsedQuantity)) {
        throw new Error("Invalid quantity");
      }
      if (!currentUser?.id) throw new Error("User not authenticated");
      return await apiRequest("POST", `/api/items/${itemId}/rent`, { 
        quantity: parsedQuantity,
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Item rented",
        description: "Item has been rented successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Rent item error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to rent item",
        variant: "destructive",
      });
    },
  });

  const returnItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!itemId || itemId <= 0) throw new Error("Invalid item ID");
      const quantity = prompt("Enter quantity to return:");
      const parsedQuantity = parseInt(quantity || "0");
      if (!quantity || parsedQuantity <= 0 || isNaN(parsedQuantity)) {
        throw new Error("Invalid quantity");
      }
      if (!currentUser?.id) throw new Error("User not authenticated");
      return await apiRequest("POST", `/api/items/${itemId}/return`, { 
        quantity: parsedQuantity,
        userId: currentUser.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Item returned",
        description: "Item has been returned successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Return item error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to return item",
        variant: "destructive",
      });
    },
  });

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
    rentItemMutation.mutate(itemId);
  };

  const handleReturnItem = (itemId: number) => {
    returnItemMutation.mutate(itemId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InventoryTable
            items={items}
            categories={categories}
            onCategoryFilter={handleCategoryFilter}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onRentItem={handleRentItem}
            onReturnItem={handleReturnItem}
            isLoading={itemsLoading}
            showAllColumns={false}
          />
        </div>

        <div className="space-y-6">
          {expiredItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800">Expired Items Alert</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredItems
                    .sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
                    .slice(0, 5).map((item) => (
                    <div key={item.id} className="flex flex-col p-2 bg-red-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{item.name}</div>
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Tag: {item.sku}</div>
                        <div>Location: {item.location || 'Not specified'}</div>
                        <div>Expired: {new Date(item.expirationDate!).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {expiredItems.length > 5 && (
                    <div className="text-sm text-gray-500 mt-2">
                      +{expiredItems.length - 5} more expired items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <LowStockDisplay />
          {expiringSoonItems.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-yellow-800">Expires Soon</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringSoonItems
                    .slice(0, 5).map((item) => {
                      const daysUntilExpiry = Math.ceil((new Date(item.expirationDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={item.id} className="flex flex-col p-2 bg-yellow-50 rounded">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{item.name}</div>
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                              {daysUntilExpiry} days
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <div>Tag: {item.sku}</div>
                            <div>Location: {item.location || 'Not specified'}</div>
                            <div>Expires: {new Date(item.expirationDate!).toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  {expiringSoonItems.length > 5 && (
                    <div className="text-sm text-gray-500 mt-2">
                      +{expiringSoonItems.length - 5} more items expiring soon
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <RecentActivity 
            transactions={recentTransactions}
            isLoading={transactionsLoading}
          />
        </div>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditItem(null);
        }}
        item={editItem}
        categories={categories}
      />
    </div>
  );
}
