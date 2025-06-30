import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionWithDetails } from "@/lib/types";

export default function Transactions() {
  // Fetch all transactions
  const { data: transactions = [], isLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-amber-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Stock In</Badge>;
      case 'out':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Stock Out</Badge>;
      case 'adjustment':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Adjustment</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">View all inventory transactions and movements</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-gray-50">
                          <TableCell className="text-sm text-gray-900">
                            {formatDateTime(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="mr-3">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.item?.name || 'Unknown Item'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {transaction.item?.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTransactionBadge(transaction.type)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900">
                            {transaction.type === 'out' ? '-' : '+'}{transaction.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900">
                            {transaction.unitPrice ? `€${parseFloat(transaction.unitPrice).toFixed(2)}` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900">
                            {transaction.user?.fullName || 'Unknown User'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
