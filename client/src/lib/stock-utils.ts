export interface StockStatus {
  level: 'critical' | 'urgent' | 'warning' | 'low' | 'good' | 'saturated';
  label: string;
  className: string;
  badgeClassName: string;
  percentage: number;
}

export interface Item {
  id: number;
  quantity: number;
  minStockLevel?: number;
  rentedCount?: number;
  brokenCount?: number;
}

export function calculateStockStatus(item: Item): StockStatus {
  const minStock = item.minStockLevel || 5;
  const availableStock = item.quantity;
  const percentage = Math.min(100, (availableStock / minStock) * 100);
  
  if (availableStock === 0) {
    return {
      level: 'critical',
      label: 'Out of Stock',
      className: 'text-red-600 bg-red-50',
      badgeClassName: 'bg-red-500 text-white',
      percentage: 0
    };
  }

  if (availableStock <= minStock * 0.3) {
    return {
      level: 'urgent',
      label: 'Urgent',
      className: 'text-orange-600 bg-orange-50',
      badgeClassName: 'bg-orange-500 text-white',
      percentage
    };
  }

  if (availableStock < minStock) {
    return {
      level: 'warning',
      label: 'Low Stock',
      className: 'text-red-600 bg-red-50',
      badgeClassName: 'bg-red-500 text-white',
      percentage
    };
  }

  if (availableStock <= minStock * 1.5) {
    return {
      level: 'low',
      label: 'Good',
      className: 'text-blue-600 bg-blue-50',
      badgeClassName: 'bg-blue-500 text-white',
      percentage
    };
  }

  if (availableStock > minStock * 3) {
    return {
      level: 'saturated',
      label: 'Saturated',
      className: 'text-orange-600 bg-orange-50',
      badgeClassName: 'bg-orange-500 text-white',
      percentage
    };
  }

  return {
    level: 'good',
    label: 'Good',
    className: 'text-green-600 bg-green-50',
    badgeClassName: 'bg-green-500 text-white',
    percentage
  };
}

export function isLowStock(item: Item): boolean {
  const status = calculateStockStatus(item);
  return ['critical', 'urgent', 'warning'].includes(status.level);
}

export function getStockBadgeVariant(level: StockStatus['level']) {
  switch (level) {
    case 'critical':
      return 'destructive';
    case 'urgent':
      return 'secondary';
    case 'warning':
      return 'secondary';
    case 'low':
      return 'secondary';
    case 'saturated':
      return 'secondary';
    default:
      return 'secondary';
  }
}
