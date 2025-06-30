import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  FileDown,
  FileUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import TopBar from "@/components/layout/top-bar";

export default function DatabasePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState({
    inventory: false,
    activity: false,
  });
  const [isBackupProcessing, setIsBackupProcessing] = useState({
    export: false,
    import: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportFilters, setExportFilters] = useState({
    category: 'all',
    status: 'all',
    rentable: 'all',
    expirable: 'all',
    lowStock: false,
    expired: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const flushActivityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/database/flush-activity", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to flush activity logs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Activity logs have been flushed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to flush activity logs",
        variant: "destructive",
      });
    },
  });

  const handleExportBackup = async () => {
    setIsBackupProcessing((prev) => ({ ...prev, export: true }));
    try {
      const response = await fetch("/api/database/backup/export", {
        method: "GET",
      });
      if (!response.ok) throw new Error("Failed to export backup");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventoria_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Complete backup exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export backup",
        variant: "destructive",
      });
    } finally {
      setIsBackupProcessing((prev) => ({ ...prev, export: false }));
    }
  };

  const handleImportBackup = async (file: File) => {
    setIsBackupProcessing((prev) => ({ ...prev, import: true }));
    try {
      const formData = new FormData();
      formData.append("backup", file);

      const response = await fetch("/api/database/backup/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import backup");
      }

      queryClient.invalidateQueries();
      toast({
        title: "Success",
        description:
          "Backup imported successfully. All data has been restored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to import backup",
        variant: "destructive",
      });
    } finally {
      setIsBackupProcessing((prev) => ({ ...prev, import: false }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        handleImportBackup(file);
      } else {
        toast({
          title: "Error",
          description: "Please select a valid JSON backup file",
          variant: "destructive",
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportInventory = async () => {
    setIsExporting((prev) => ({ ...prev, inventory: true }));
    try {
      const params = new URLSearchParams();
      
      if (exportFilters.category !== 'all') {
        params.append('category', exportFilters.category);
      }
      if (exportFilters.status !== 'all') {
        params.append('status', exportFilters.status);
      }
      if (exportFilters.rentable !== 'all') {
        params.append('rentable', exportFilters.rentable);
      }
      if (exportFilters.expirable !== 'all') {
        params.append('expirable', exportFilters.expirable);
      }
      if (exportFilters.lowStock) {
        params.append('lowStock', 'true');
      }
      if (exportFilters.expired) {
        params.append('expired', 'true');
      }

      const queryString = params.toString();
      const url = `/api/database/export/inventory${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to export inventory");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "inventory_export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Success",
        description: "Inventory data exported successfully with applied filters",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export inventory data",
        variant: "destructive",
      });
    } finally {
      setIsExporting((prev) => ({ ...prev, inventory: false }));
    }
  };

  const handleExportActivity = async () => {
    setIsExporting((prev) => ({ ...prev, activity: true }));
    try {
      const response = await fetch("/api/database/export/activity");
      if (!response.ok) throw new Error("Failed to export activity");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Activity data exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export activity data",
        variant: "destructive",
      });
    } finally {
      setIsExporting((prev) => ({ ...prev, activity: false }));
    }
  };

    const { data: categories = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Database Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{stats?.totalValue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your inventory and activity data as Excel files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Export Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <Label htmlFor="category">Category</Label>
                <Select value={exportFilters.category} onValueChange={(value) => setExportFilters({...exportFilters, category: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setExportFilters({...exportFilters, status: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="rentable">Rentable</Label>
                <Select onValueChange={(value) => setExportFilters({...exportFilters, rentable: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="expirable">Expirable</Label>
                <Select onValueChange={(value) => setExportFilters({...exportFilters, expirable: value})}>
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="lowStock" onCheckedChange={(checked) => setExportFilters({...exportFilters, lowStock: checked || false})} />
                <Label htmlFor="lowStock">Low Stock</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="expired" onCheckedChange={(checked) => setExportFilters({...exportFilters, expired: checked || false})} />
                <Label htmlFor="expired">Expired</Label>
            </div>
        </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExportInventory}
              disabled={isExporting.inventory}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting.inventory
                ? "Exporting..."
                : "Export Inventory as Excel"}
            </Button>
            <Button
              onClick={handleExportActivity}
              disabled={isExporting.activity}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting.activity
                ? "Exporting..."
                : "Export Activity Log as Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Complete Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Management</CardTitle>
          <CardDescription>
            Create complete backups of all data or restore from existing backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleExportBackup}
              disabled={isBackupProcessing.export}
              className="flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isBackupProcessing.export
                ? "Exporting..."
                : "Export Complete Backup"}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBackupProcessing.import}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              {isBackupProcessing.import ? "Importing..." : "Import Backup"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Backup includes:</strong> All inventory items, categories,
              users, and activity logs. Import will replace all existing data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Database Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Database Maintenance</CardTitle>
          <CardDescription>
            Manage database operations and cleanup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => flushActivityMutation.mutate()}
              disabled={flushActivityMutation.isPending}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {flushActivityMutation.isPending
                ? "Flushing..."
                : "Flush Activity Logs"}
            </Button>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Flushing activity logs will permanently
              remove all transaction history. This action cannot be undone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
