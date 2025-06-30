import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemWithCategory } from "@/lib/types";
import ItemDetailsModal from "./item-details-modal";

interface InventoryTableProps {
  items: ItemWithCategory[];
  categories: Array<{ id: number; name: string }>;
  onCategoryFilter: (categoryId: string) => void;
  onEditItem: (item: ItemWithCategory) => void;
  onDeleteItem: (itemId: number) => void;
  onRentItem?: (itemId: number) => void;
  onReturnItem?: (itemId: number) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  showAllColumns?: boolean;
}

const ITEMS_PER_PAGE = 10;

const calculateStockStatus = (item: ItemWithCategory) => {
  const minStock = item.minStockLevel || 5;
  const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();

  if (item.quantity < minStock) {
    return {
      level: "low",
      label: "Low Stock",
      badgeClassName: "bg-red-100 text-red-800",
      isExpired,
    };
  } else if (item.quantity > minStock * 2.5) {
    return {
      level: "saturated",
      label: "Saturated",
      badgeClassName: "bg-orange-100 text-orange-800",
      isExpired,
    };
  } else {
    return {
      level: "good",
      label: "In Stock",
      badgeClassName: "bg-emerald-100 text-emerald-800",
      isExpired,
    };
  }
};

const getStockBadgeVariant = (level: string) => {
  switch (level) {
    case "low":
      return "destructive";
    case "saturated":
      return "outline";
    default:
      return "secondary";
  }
};

export default function InventoryTable({ 
  items, 
  categories, 
  onCategoryFilter,
  onEditItem, 
  onDeleteItem,
  onRentItem,
  onReturnItem,
  onSearch,
  isLoading = false,
  showAllColumns = true
}: InventoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemWithCategory | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const filteredItems = items.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || 
      item.categoryId === parseInt(selectedCategory);

    const itemStatus = calculateStockStatus(item);
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "low" && itemStatus.level === "low") ||
      (selectedStatus === "good" && itemStatus.level === "good") ||
      (selectedStatus === "saturated" && itemStatus.level === "saturated") ||
      (selectedStatus === "expired" && itemStatus.isExpired) ||
      (selectedStatus === "broken" && (item.brokenCount || 0) > 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    onCategoryFilter(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleItemClick = (item: ItemWithCategory) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const getItemStatus = (item: ItemWithCategory) => {
    const status = calculateStockStatus(item);
    const statuses = [status.label];

    if (status.isExpired) {
      statuses.unshift("Expired");
    }

    if (item.rentedCount && item.rentedCount > 0) {
      statuses.push(`Rented: ${item.rentedCount}`);
    }

    if (item.brokenCount && item.brokenCount > 0) {
      statuses.push(`Broken: ${item.brokenCount}`);
    }

    const statusText = statuses.join(" • ");
    const badgeClassName = status.isExpired 
      ? "bg-red-100 text-red-800" 
      : status.badgeClassName;

    return (
      <Badge 
        variant={status.isExpired ? "destructive" : getStockBadgeVariant(status.level)} 
        className={badgeClassName}
      >
        {statusText}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Inventory</CardTitle>
          {showAllColumns && (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchChange(searchQuery);
                    }
                  }}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories && categories.map((category) => (
                    <SelectItem key={category.id || category} value={(category.id || category).toString()}>
                      {category.name || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="good">In Stock</SelectItem>
                  <SelectItem value="saturated">Saturated</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="broken">Broken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                {showAllColumns && <TableHead>Category</TableHead>}
                <TableHead>Quantity</TableHead>
                {showAllColumns && <TableHead>Value</TableHead>}
                <TableHead>Status</TableHead>
                {showAllColumns && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showAllColumns ? 5 : 3} className="text-center py-8 text-gray-500">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <button 
                          onClick={() => handleItemClick(item)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {item.name}
                        </button>
                        <div className="text-sm text-gray-500">{item.sku}</div>
                      </div>
                    </TableCell>
                    {showAllColumns && <TableCell>{item.categoryName || "Uncategorized"}</TableCell>}
                    <TableCell className="font-medium">{item.quantity}</TableCell>
                    {showAllColumns && <TableCell>${(parseFloat(item.unitPrice) * (item.quantity + (item.rentedCount || 0))).toFixed(2)}</TableCell>}
                    <TableCell>{getItemStatus(item)}</TableCell>
                    {showAllColumns && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {item.rentable && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onRentItem && onRentItem(item.id)}
                              disabled={item.quantity === 0}
                            >
                              Rent
                            </Button>
                          )}
                          {item.rentable && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onReturnItem && onReturnItem(item.id)}
                              disabled={!item.rentedCount || item.rentedCount === 0}
                            >
                              Return
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditItem(item)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onDeleteItem(item.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} results
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <ItemDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        item={selectedItem}
      />
    </Card>
  );
}