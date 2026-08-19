export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type BottleShape = 'Round' | 'Square';

export type ProductGender = 'Unisex' | 'Men' | 'Women';

export type ProductSeason = 'Spring' | 'Summer' | 'Monsoon' | 'Autumn' | 'Winter' | 'All Season';

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: number;
  size: string; // "30ml"
  bottle_shape: BottleShape;
  category: string;
  gender: ProductGender;
  top_notes: string;
  heart_notes: string;
  base_notes: string;
  sku: string;
  stock: number;
  low_stock_threshold: number;
  featured: boolean;
  active: boolean;
  image_url: string;
  seasons?: string[];
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  size: string; // "30ml"
  bottle_shape: BottleShape;
  quantity: number;
  unit_price: number;
  subtotal: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  district: string;
  thana_upazila: string;
  full_address: string;
  status: OrderStatus;
  payment_method: 'COD' | 'bKash' | 'Nagad' | 'Card';
  delivery_charge: number;
  subtotal: number;
  coupon_code?: string | null;
  discount?: number;
  total: number;
  customer_note?: string;
  admin_note?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discountAmount?: number;
  calculatedDiscount?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  district: string;
  thana_upazila?: string;
  full_address: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at: string;
}

export interface StoreSettings {
  id?: string;
  brand_name: string;
  brand_tagline: string;
  currency: string;
  inside_dhaka_delivery_charge: number;
  outside_dhaka_delivery_charge: number;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  pinterest: string;
  store_active: boolean;
  accept_orders: boolean;
  maintenance_mode: boolean;
  created_at?: string;
  updated_at?: string;
  // Compatibility aliases
  delivery_inside_dhaka?: number;
  delivery_outside_dhaka?: number;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_tiktok?: string;
  social_pinterest?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  full_name: string;
  avatar_url?: string;
  last_sign_in_at?: string;
}

export interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSales: number;
  productsSold: number;
  lowStockCount: number;
  totalProductsCount: number;
}
