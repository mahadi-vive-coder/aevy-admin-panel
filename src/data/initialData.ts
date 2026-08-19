import { Product, Order, StoreSettings, Customer } from '../types';

/**
 * Production Initial State: No demo/sample business data.
 * All records are sourced directly from real Supabase database entries.
 */
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SETTINGS: StoreSettings = {
  brand_name: 'AEVY',
  brand_tagline: 'ESSENCE OF FRESH ELEGANCE',
  currency: 'BDT',
  inside_dhaka_delivery_charge: 0,
  outside_dhaka_delivery_charge: 0,
  phone: '',
  email: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  pinterest: '',
  store_active: true,
  accept_orders: true,
  maintenance_mode: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  delivery_inside_dhaka: 0,
  delivery_outside_dhaka: 0,
  contact_phone: '',
  contact_email: '',
  contact_whatsapp: '',
  social_instagram: '',
  social_facebook: '',
  social_tiktok: '',
  social_pinterest: '',
};
