import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, Download, BarChart3, TrendingUp, Package, FileText } from "lucide-react";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ItemWithCategory, TransactionWithDetails } from "@/lib/types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [reportType, setReportType] = useState("inventory");

  const { data: items = [], isLoading: itemsLoading } = useQuery<ItemWithCategory[]>({
    queryKey: ["/api/items"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  const getFilteredData = () => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    if (reportType === "inventory") {
      return {
        items: items,
        transactions: []
      };
    } else {
      return {
        items: [],
        transactions: selectedPeriod === "all" ? transactions : transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= cutoffDate;
        })
      };
    }
  };

  const { items: filteredItems, transactions: filteredTransactions } = getFilteredData();

  const exportToJSON = () => {
    const data = reportType === "inventory" ? filteredItems : filteredTransactions;
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${reportType}-report-${selectedPeriod}days.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${reportType}-report-${selectedPeriod}days.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">View inventory listings and recent activity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventory Report</SelectItem>
                <SelectItem value="transactions">Activity Report</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToJSON} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>

            <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            <div className="text-sm text-gray-600 flex items-center">
              {reportType === "inventory" 
                ? `${filteredItems.length} items` 
                : `${filteredTransactions.length} transactions`}
            </div>
          </div>

          {/* Report Content */}
          <Card id="report-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {reportType === "inventory" ? "Inventory" : "Activity"} Report
                <Badge variant="secondary">
                  {reportType === "inventory" ? `${filteredItems.length} items` : `${filteredTransactions.length} transactions`}
                </Badge>
              </CardTitle>
              <p className="text-gray-600">
                Data for {selectedPeriod === "all" ? "all time" : `the last ${selectedPeriod} day${selectedPeriod === "1" ? "" : "s"}`}
              </p>
            </CardHeader>
            <CardContent>
              {(itemsLoading || transactionsLoading) ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : reportType === "inventory" ? (
                filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No inventory data available for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Rented</TableHead>
                          <TableHead>Broken</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Min Stock Level</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.sku}</TableCell>
                            <TableCell>{item.description || "-"}</TableCell>
                            <TableCell>{item.categoryName || "-"}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.rentedCount || 0}</TableCell>
                            <TableCell>{item.brokenCount || 0}</TableCell>
                            <TableCell>${item.unitPrice}</TableCell>
                            <TableCell>${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}</TableCell>
                            <TableCell>{item.location || "-"}</TableCell>
                            <TableCell>{item.minStockLevel || 5}</TableCell>
                            <TableCell>
                              <Badge variant={
                                item.status === "active" ? "secondary" :
                                item.status === "inactive" ? "outline" : "destructive"
                              }>
                                {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                filteredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No activity data available for the selected period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                transaction.type === "in" ? "secondary" :
                                transaction.type === "out" ? "destructive" : "default"
                              }>
                                {transaction.type === "in" ? "Stock In" :
                                 transaction.type === "out" ? "Stock Out" : "Adjustment"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.item?.name || "Unknown Item"}
                            </TableCell>
                            <TableCell>{transaction.quantity}</TableCell>
                            <TableCell>${transaction.unitPrice}</TableCell>
                            <TableCell>
                              ${(transaction.quantity * parseFloat(transaction.unitPrice)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {transaction.user?.fullName || "Unknown User"}
                            </TableCell>
                            <TableCell>{transaction.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
