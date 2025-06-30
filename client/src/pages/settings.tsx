import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Category, User } from "@shared/schema";
import { Plus, Edit, Trash2, MoreHorizontal, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/user-context";

interface CategoryFormData {
  name: string;
  description: string;
}

export default function Settings() {
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [expiresSoonThreshold, setExpiresSoonThreshold] = useState(7);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const { data: categoryList = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const { data: thresholdSettings } = useQuery({
    queryKey: ["/api/settings/expires-threshold"],
    queryFn: async () => {
      const response = await fetch("/api/settings/expires-threshold");
      if (!response.ok) return { expiresSoonThreshold: 7 };
      return response.json();
    },
  });

  React.useEffect(() => {
    if (thresholdSettings?.expiresSoonThreshold) {
      setExpiresSoonThreshold(thresholdSettings.expiresSoonThreshold);
    }
  }, [thresholdSettings]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category created",
        description: "New category has been added successfully.",
      });
      setNewCategoryName("");
      setNewCategoryDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const resetCategoryForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category created",
        description: "New category has been added successfully.",
      });
      setFormData({ name: "", description: "" });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const editCategoryMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: number; categoryData: CategoryFormData }) => {
      return await apiRequest("PUT", `/api/categories/${id}`, categoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const updateThresholdMutation = useMutation({
    mutationFn: async (threshold: number) => {
      return await apiRequest("PUT", "/api/settings/expires-threshold", { expiresSoonThreshold: threshold });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/expires-threshold"] });
      toast({
        title: "Setting updated",
        description: "Expires soon threshold has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    addCategoryMutation.mutate(formData);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (editingCategory) {
      editCategoryMutation.mutate({
        id: editingCategory.id,
        categoryData: formData,
      });
    }
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };

  async function apiRequest(method: string, url: string, data: any = null) {
    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure application settings and preferences</p>
          </div>

          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-xl">🔒</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                <p className="text-gray-500">
                    You need administrator privileges to access settings.
                  </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure application settings and manage categories</p>
        </div>

        {/* Status Management Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
            <p className="text-gray-600 mt-1">Configure inventory status thresholds and rental tracking</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status Definitions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="font-medium text-green-800">Full</span>
                      <p className="text-sm text-green-600">Adequate stock levels</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <span className="font-medium text-yellow-800">Saturated</span>
                      <p className="text-sm text-yellow-600">Excessive stock levels</p>
                    </div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <span className="font-medium text-red-800">Low Stock</span>
                      <p className="text-sm text-red-600">Requires restocking</p>
                    </div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Rental Tracking</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-blue-800">Rental System</span>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">
                    Track items that are currently rented out to customers or departments.
                  </p>
                  <div className="text-sm text-blue-700">
                    • Automatic quantity adjustment<br />
                    • Rental count tracking<br />
                    • Return management
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiration Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Expiration Settings</CardTitle>
            <p className="text-gray-600 mt-1">Configure expiration alerts and thresholds</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="expires-threshold">Expires Soon Threshold (days)</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="expires-threshold"
                    type="number"
                    min="1"
                    max="365"
                    value={expiresSoonThreshold}
                    onChange={(e) => setExpiresSoonThreshold(parseInt(e.target.value) || 7)}
                    className="w-32"
                  />
                  <Button
                    onClick={() => updateThresholdMutation.mutate(expiresSoonThreshold)}
                    disabled={updateThresholdMutation.isPending}
                    size="sm"
                  >
                    {updateThresholdMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Items expiring within this many days will appear in the "Expires Soon" alert on the dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Category Management Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Category Management</CardTitle>
                <p className="text-gray-600 mt-1">Manage inventory categories and their organization</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      createCategoryMutation.mutate({
                        name: newCategoryName.trim(),
                        description: newCategoryDescription.trim() || undefined
                      });
                    }
                  }}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createCategoryMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Categories</h4>
                {categoriesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : categoriesError ? (
                  <div className="text-red-600 text-sm">
                    Failed to load categories. Please try again.
                  </div>
                ) : categoryList.length === 0 ? (
                  <p className="text-gray-500 text-sm">No categories found. Add your first category above.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryList.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                          {category.description && (
                            <p className="text-sm text-gray-600">{category.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-description">Description</Label>
                <Textarea
                  id="edit-category-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCategory}
                  disabled={editCategoryMutation.isPending}
                >
                  {editCategoryMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
