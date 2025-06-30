import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemWithCategory } from "@/lib/types";

interface ItemDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemWithCategory | null;
}

export default function ItemDetailsModal({ open, onOpenChange, item }: ItemDetailsModalProps) {
  if (!item) return null;

  const getStatusBadge = () => {
    const minStock = item.minStockLevel || 5;
    const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
    
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (item.quantity < minStock) {
      return <Badge variant="destructive">Low Stock</Badge>;
    } else if (item.quantity > minStock * 2.5) {
      return <Badge variant="outline">Saturated</Badge>;
    } else {
      return <Badge variant="secondary">In Stock</Badge>;
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.name}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">SKU:</span>
                <p className="text-gray-900">{item.sku}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Category:</span>
                <p className="text-gray-900">{item.categoryName || 'Uncategorized'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Description:</span>
                <p className="text-gray-900">{item.description || 'No description'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Location:</span>
                <p className="text-gray-900">{item.location || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">Available Quantity:</span>
                <p className="text-gray-900 text-xl font-bold">{item.quantity}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Unit Price:</span>
                <p className="text-gray-900">{formatCurrency(item.unitPrice)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Value:</span>
                <p className="text-gray-900 font-semibold">
                  {formatCurrency(parseFloat(item.unitPrice) * (item.quantity + (item.rentedCount || 0)))}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Minimum Stock Level:</span>
                <p className="text-gray-900">{item.minStockLevel || 5}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">Rented Count:</span>
                <p className="text-gray-900">{item.rentedCount || 0}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Broken Count:</span>
                <p className="text-gray-900">{item.brokenCount || 0}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Rentable:</span>
                <p className="text-gray-900">{item.rentable ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Expirable:</span>
                <p className="text-gray-900">{item.expirable ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">Expiration Date:</span>
                <p className="text-gray-900">{formatDate(item.expirationDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Created:</span>
                <p className="text-gray-900">{formatDate(item.createdAt)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last Updated:</span>
                <p className="text-gray-900">{formatDate(item.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
