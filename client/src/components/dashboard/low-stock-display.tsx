import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LowStockDisplay() {
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ["/api/items/low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/items/low-stock");
      if (!response.ok) throw new Error("Failed to fetch low stock items");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Low Stock Alert</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-800">Low Stock Alert</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowStockItems.slice(0, 5).map((item: any) => (
            <div key={item.id} className="flex flex-col p-2 bg-orange-50 rounded">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{item.name}</div>
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                  {item.quantity} left
                </Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                <div>Tag: {item.sku}</div>
                <div>Location: {item.location || 'Not specified'}</div>
                <div>Min Level: {item.minStockLevel || 5}</div>
              </div>
            </div>
          ))}
          {lowStockItems.length > 5 && (
            <div className="text-sm text-gray-500 mt-2">
              +{lowStockItems.length - 5} more low stock items
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}