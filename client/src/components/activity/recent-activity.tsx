import { Clock, TrendingUp, TrendingDown, Package, RefreshCw, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionWithDetails } from "@/lib/types";

interface RecentActivityProps {
  transactions: TransactionWithDetails[];
  isLoading: boolean;
}

export default function RecentActivity({ transactions, isLoading }: RecentActivityProps) {
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rent":
        return <TrendingDown className="h-3 w-3 text-blue-600" />;
      case "return":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "add":
        return <Package className="h-3 w-3 text-purple-600" />;
      case "update":
        return <RefreshCw className="h-3 w-3 text-orange-600" />;
      default:
        return <ArrowUpDown className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      rent: "default" as const,
      return: "secondary" as const,
      add: "outline" as const,
      update: "destructive" as const,
    };
    return variants[type as keyof typeof variants] || "default";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {getTypeIcon(transaction.type)}
                <div>
                  <div className="font-medium text-sm">
                    {transaction.item?.name || "Unknown Item"}
                  </div>
                  <div className="text-xs text-gray-500">
                    by {transaction.user?.fullName || "Unknown User"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={getTypeBadge(transaction.type)} className="text-xs mb-1">
                  {transaction.type}
                </Badge>
                <div className="text-xs text-gray-500">
                  {formatDate(transaction.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
