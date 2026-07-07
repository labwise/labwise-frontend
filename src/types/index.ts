export interface Product {
  id: string;
  sku?: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: Category;
  manufacturer?: string;
  casNumber?: string;
  specifications?: string;
  unit?: string;
  price: number;
  costPrice?: number;
  effectivePrice?: number;
  stockQuantity: number;
  minOrderQty: number;
  maxOrderQty?: number;
  isActive: boolean;
  isDisplayed: boolean;
  isOnSale: boolean;
  taxType: 'TAXABLE' | 'ZERO_RATE' | 'TAX_EXEMPT';
  countryOfOrigin?: string;
  pointPolicy: 'DEFAULT' | 'CUSTOM';
  customPointRates?: Record<string, number>;
  description?: string;
  sdsFileUrl?: string;
  images: ProductImage[];
  createdAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: Category[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  productTotal: number;
  discountTotal: number;
  couponDiscount: number;
  pointUsed: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  taxInvoiceRequested: boolean;
  shippingAddress: ShippingAddress;
  memo?: string;
  trackingNumber?: string;
  trackingCompany?: string;
  cancelReason?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface PointLedger {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason?: string;
  createdAt: string;
}

export interface PointProduct {
  id: string;
  name: string;
  category: string;
  requiredPoints: number;
  referencePrice?: number;
  stockQuantity: number;
  description?: string;
  images: { url: string; isPrimary: boolean }[];
}

export interface ApiError {
  message: string;
  statusCode: number;
}
