export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  todayTransactions: number;
  brokenCount: number;
  rentedCount: number;
}

export interface ItemWithCategory {
  id: number;
  name: string;
  sku: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  quantity: number;
  unitPrice: string;
  location?: string;
  minStockLevel?: number;
  status: string;
  rentedCount?: number;
  brokenCount?: number;
  expirationDate?: Date;
  rentable?: boolean;
  expirable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithDetails {
  id: number;
  itemId: number;
  userId: number;
  type: string;
  quantity: number;
  unitPrice?: string;
  notes?: string;
  createdAt: Date;
  item?: {
    id: number;
    name: string;
    sku: string;
  };
  user?: {
    id: number;
    fullName: string;
    username: string;
  };
}