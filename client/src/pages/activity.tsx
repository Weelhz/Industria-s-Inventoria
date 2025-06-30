import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, TrendingUp, TrendingDown, RefreshCw, Package, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TransactionWithDetails } from "@/lib/types";

const ITEMS_PER_PAGE = 10;

export default function Activity() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rent":
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case "return":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "add":
        return <Package className="h-4 w-4 text-purple-600" />;
      case "update":
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
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

  const totalPages = Math.ceil(recentTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = recentTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Activity</h1>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(transaction.type)}
                                  <Badge variant={getTypeBadge(transaction.type)}>
                                    {transaction.type}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {transaction.item?.name || "Unknown Item"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.item?.sku || "No SKU"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {transaction.user?.fullName || "Unknown User"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{transaction.user?.username || "unknown"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{transaction.quantity}</span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDate(transaction.createdAt)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {transaction.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, recentTransactions.length)} of {recentTransactions.length} transactions
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}