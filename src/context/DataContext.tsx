import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Order, Customer, StoreSettings, DashboardStats, OrderStatus, Coupon, CouponValidationResult } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_CUSTOMERS, INITIAL_SETTINGS } from '../data/initialData';
import { getSupabase, getStoredSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig } from '../lib/supabase';

export function formatShortOrderNumber(num: string | undefined | null): string {
  if (!num) return '001';
  const clean = num.replace(/^#/, '').replace(/^AEVY-ORD-/, '').replace(/^AEVY-/, '');
  if (/^\d+$/.test(clean)) {
    return clean.padStart(3, '0');
  }
  return clean;
}

interface DataContextType {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  settings: StoreSettings;
  dashboardStats: DashboardStats;
  activeCouponsCount: number;
  isLoading: boolean;
  isSaving: boolean;
  isSupabaseLive: boolean;
  isCouponsTableMissing: boolean;
  supabaseConfig: { url: string; anonKey: string; isConfigured: boolean };
  refreshData: () => Promise<void>;
  updateSupabaseCredentials: (url: string, anonKey: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  toggleProductActive: (id: string) => Promise<boolean>;
  updateStock: (id: string, newStock: number) => Promise<boolean>;
  // Order actions
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  cancelOrder: (id: string) => Promise<boolean>;
  updateOrderAdminNote: (id: string, note: string) => Promise<boolean>;
  // Coupon actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => Promise<boolean>;
  updateCoupon: (id: string, updates: Partial<Coupon>) => Promise<boolean>;
  deleteCoupon: (id: string) => Promise<boolean>;
  toggleCouponActive: (id: string) => Promise<boolean>;
  validateCouponCode: (code: string, subtotal: number) => Promise<CouponValidationResult>;
  incrementCouponUsedCount: (code: string) => Promise<boolean>;
  // Settings actions
  updateSettings: (updates: Partial<StoreSettings>) => Promise<boolean>;
  // Notifications
  actionMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  clearActionMessage: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = 'aevy_products_store';
const STORAGE_KEY_ORDERS = 'aevy_orders_store';
const STORAGE_KEY_CUSTOMERS = 'aevy_customers_store';
const STORAGE_KEY_COUPONS = 'aevy_coupons_store';
const STORAGE_KEY_SETTINGS = 'aevy_settings_store';

function isLegacyDemoProduct(p: any) {
  return p && (p.id === 'prod-001' || p.id === 'prod-002' || p.id === 'prod-003' || p.id === 'prod-004' || p.id === 'prod-005' || p.id === 'prod-006');
}

function isLegacyDemoOrder(o: any) {
  return o && (o.id === 'ord-001' || o.id === 'ord-002' || o.id === 'ord-003' || o.id === 'ord-004' || o.id === 'ord-005' || o.id === 'ord-006' || o.order_number?.startsWith('AEVY-ORD-100'));
}

function isLegacyDemoCustomer(c: any) {
  return c && (c.id === 'cust-001' || c.id === 'cust-002' || c.id === 'cust-003' || c.id === 'cust-004' || c.id === 'cust-005' || c.id === 'cust-006');
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(isLegacyDemoProduct)) {
          localStorage.removeItem(STORAGE_KEY_PRODUCTS);
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(isLegacyDemoOrder)) {
          localStorage.removeItem(STORAGE_KEY_ORDERS);
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return INITIAL_ORDERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(isLegacyDemoCustomer)) {
          localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
          return [];
        }
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return INITIAL_CUSTOMERS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUPONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_SETTINGS,
            ...parsed,
          };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [isCouponsTableMissing, setIsCouponsTableMissing] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfigState] = useState(getStoredSupabaseConfig());
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  }, []);

  const clearActionMessage = useCallback(() => {
    setActionMessage(null);
  }, []);

  // Save changes to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUPONS, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Load from Supabase if configured
  const refreshData = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsSupabaseLive(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Products with Images Gallery
      let mappedProducts: Product[] = [];
      try {
        const { data: dbProductsWithImages, error: prodImgErr } = await supabase
          .from('products')
          .select('*, images:product_images(*)')
          .order('created_at', { ascending: false });

        if (!prodImgErr && dbProductsWithImages) {
          mappedProducts = dbProductsWithImages.map((p: any) => {
            const rawImages = Array.isArray(p.images) ? p.images : [];
            const sortedImages = [...rawImages].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            const primaryImg = sortedImages.find((img: any) => img.is_primary)?.image_url || sortedImages[0]?.image_url || p.image_url || '';

            return {
              ...p,
              image_url: primaryImg,
              seasons: Array.isArray(p.seasons) ? p.seasons : [],
              images: sortedImages.length > 0
                ? sortedImages
                : p.image_url
                ? [{ image_url: p.image_url, sort_order: 0, is_primary: true }]
                : [],
            };
          });
        } else {
          throw prodImgErr;
        }
      } catch {
        // Fallback if product_images table hasn't been migrated yet
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!prodErr && dbProducts) {
          mappedProducts = dbProducts.map((p: any) => ({
            ...p,
            seasons: Array.isArray(p.seasons) ? p.seasons : [],
            images: p.image_url
              ? [{ image_url: p.image_url, sort_order: 0, is_primary: true }]
              : [],
          }));
        }
      }

      if (mappedProducts.length > 0 || isSupabaseLive) {
        setProducts(mappedProducts);
      }

      // 2. Fetch Orders with Items
      const { data: dbOrders, error: ordErr } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (ordErr) {
        console.error('Supabase orders fetch error:', ordErr.message);
      } else if (dbOrders) {
        const mappedOrders: Order[] = dbOrders.map((o: any) => ({
          id: o.id,
          order_number: o.order_number || o.order_id || '001',
          customer_id: o.customer_id,
          customer_name: o.customer_name || 'Customer',
          customer_phone: o.customer_phone || '',
          customer_email: o.customer_email || '',
          district: o.district || '',
          thana_upazila: o.thana_upazila || o.thana || '',
          full_address: o.full_address || o.address || '',
          status: (o.status as OrderStatus) || 'NEW',
          payment_method: o.payment_method || 'COD',
          delivery_charge: Number(o.delivery_charge || 0),
          subtotal: Number(o.subtotal || 0),
          coupon_code: o.coupon_code || null,
          discount: Number(o.discount || 0),
          total: Number(o.total || 0),
          customer_note: o.customer_note || '',
          admin_note: o.admin_note || o.internal_note || '',
          items: Array.isArray(o.items)
            ? o.items.map((it: any) => ({
                id: it.id,
                order_id: it.order_id,
                product_id: it.product_id,
                product_name: it.product_name || 'Extrait de Parfum',
                size: it.size || '30ml',
                bottle_shape: it.bottle_shape || 'Round',
                quantity: Number(it.quantity || 1),
                unit_price: Number(it.unit_price || 0),
                subtotal: Number(it.subtotal || (Number(it.unit_price || 0) * Number(it.quantity || 1))),
                image_url: it.image_url || '',
              }))
            : [],
          created_at: o.created_at || new Date().toISOString(),
          updated_at: o.updated_at || new Date().toISOString(),
        }));
        setOrders(mappedOrders);
      }

      // 3. Fetch Customers
      const { data: dbCustomers, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .order('total_spent', { ascending: false });

      if (!custErr && dbCustomers) {
        setCustomers(dbCustomers as Customer[]);
      }

      // 4. Fetch Coupons
      try {
        const { data: dbCoupons, error: coupErr } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (coupErr) {
          if (coupErr.code === 'PGRST205' || coupErr.message?.includes('Could not find the table') || coupErr.message?.includes('coupons')) {
            console.warn('Notice: coupons table not found in Supabase schema cache. Operating with local coupon state.');
            setIsCouponsTableMissing(true);
          } else {
            console.warn('Supabase coupons query error:', coupErr.message);
          }
        } else if (dbCoupons) {
          setIsCouponsTableMissing(false);
          const mappedCoupons: Coupon[] = dbCoupons.map((c: any) => ({
            id: c.id,
            code: (c.code || '').toUpperCase(),
            discount_type: c.discount_type === 'fixed' ? 'fixed' : 'percentage',
            discount_value: Number(c.discount_value || 0),
            minimum_order: Number(c.minimum_order || 0),
            maximum_discount: c.maximum_discount != null ? Number(c.maximum_discount) : null,
            usage_limit: c.usage_limit != null ? Number(c.usage_limit) : null,
            used_count: Number(c.used_count || 0),
            expires_at: c.expires_at || null,
            active: Boolean(c.active ?? true),
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at || new Date().toISOString(),
          }));
          setCoupons(mappedCoupons);
        }
      } catch (coupEx) {
        console.warn('Coupons fetch notice:', coupEx);
      }

      // 5. Fetch Settings
      const { data: dbSettings, error: setErr } = await supabase
        .from('settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (setErr) {
        console.warn('Supabase settings query notice:', setErr.message);
      } else if (dbSettings) {
        const insideCharge = Number(dbSettings.inside_dhaka_delivery_charge ?? dbSettings.delivery_inside_dhaka ?? 70);
        const outsideCharge = Number(dbSettings.outside_dhaka_delivery_charge ?? dbSettings.delivery_outside_dhaka ?? 130);
        const phone = dbSettings.phone || dbSettings.contact_phone || '';
        const email = dbSettings.email || dbSettings.contact_email || '';
        const whatsapp = dbSettings.whatsapp || dbSettings.contact_whatsapp || '';
        const instagram = dbSettings.instagram || dbSettings.social_instagram || '';
        const facebook = dbSettings.facebook || dbSettings.social_facebook || '';
        const tiktok = dbSettings.tiktok || dbSettings.social_tiktok || '';
        const pinterest = dbSettings.pinterest || dbSettings.social_pinterest || '';

        const normalized: StoreSettings = {
          id: dbSettings.id,
          brand_name: dbSettings.brand_name || 'AEVY Fragrance',
          brand_tagline: dbSettings.brand_tagline || 'Haute Parfumerie & Artisanal Extraits',
          currency: dbSettings.currency || 'BDT',
          inside_dhaka_delivery_charge: insideCharge,
          outside_dhaka_delivery_charge: outsideCharge,
          phone,
          email,
          whatsapp,
          instagram,
          facebook,
          tiktok,
          pinterest,
          store_active: dbSettings.store_active ?? true,
          accept_orders: dbSettings.accept_orders ?? true,
          maintenance_mode: dbSettings.maintenance_mode ?? false,
          created_at: dbSettings.created_at,
          updated_at: dbSettings.updated_at,
          // Compatibility aliases
          delivery_inside_dhaka: insideCharge,
          delivery_outside_dhaka: outsideCharge,
          contact_phone: phone,
          contact_email: email,
          contact_whatsapp: whatsapp,
          social_instagram: instagram,
          social_facebook: facebook,
          social_tiktok: tiktok,
          social_pinterest: pinterest,
        };
        setSettings(normalized);
      }

      setIsSupabaseLive(true);
    } catch (err) {
      console.warn('Error fetching data from Supabase:', err);
      setIsSupabaseLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Supabase Realtime channel for live order & coupon updates
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('admin_live_orders_feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'coupons' },
          () => {
            refreshData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (realtimeErr) {
      console.warn('Supabase realtime subscription notice:', realtimeErr);
    }
  }, [refreshData]);

  // Connect / Update Supabase Credentials
  const updateSupabaseCredentials = async (url: string, anonKey: string): Promise<boolean> => {
    try {
      saveSupabaseConfig(url, anonKey);
      const newCfg = getStoredSupabaseConfig();
      setSupabaseConfigState(newCfg);
      await refreshData();
      showNotification('Supabase connection updated and synchronized.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Supabase';
      showNotification(msg, 'error');
      return false;
    }
  };

  const disconnectSupabase = () => {
    clearSupabaseConfig();
    setSupabaseConfigState({ url: '', anonKey: '', isConfigured: false });
    setIsSupabaseLive(false);
    showNotification('Disconnected from custom Supabase. Operating in offline admin cache mode.', 'info');
  };

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();

    const rawImages = productData.images || [];
    const primaryImgUrl = rawImages.find(img => img.is_primary)?.image_url || rawImages[0]?.image_url || productData.image_url || '';

    // Prepare main product record without nested relations
    const dbPayload = {
      name: productData.name,
      slug: productData.slug,
      short_description: productData.short_description,
      description: productData.description,
      price: productData.price,
      size: productData.size,
      bottle_shape: productData.bottle_shape,
      category: productData.category,
      gender: productData.gender,
      top_notes: productData.top_notes,
      heart_notes: productData.heart_notes,
      base_notes: productData.base_notes,
      sku: productData.sku,
      stock: productData.stock,
      low_stock_threshold: productData.low_stock_threshold,
      featured: productData.featured,
      active: productData.active,
      image_url: primaryImgUrl,
      seasons: productData.seasons || [],
    };

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      image_url: primaryImgUrl,
      seasons: productData.seasons || [],
      images: rawImages.length > 0
        ? rawImages.map((img, idx) => ({ ...img, sort_order: idx, is_primary: img.image_url === primaryImgUrl }))
        : primaryImgUrl
        ? [{ image_url: primaryImgUrl, sort_order: 0, is_primary: true }]
        : [],
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([dbPayload])
          .select()
          .single();

        if (error) {
          console.error('Supabase product insert error:', error);
          showNotification(`Product insert error: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        } else if (data) {
          newProduct.id = data.id;
          newProduct.created_at = data.created_at || now;
          newProduct.updated_at = data.updated_at || now;

          // Insert images into product_images table if images are present
          if (rawImages.length > 0) {
            try {
              const imageRows = rawImages.map((img, idx) => ({
                product_id: data.id,
                image_url: img.image_url,
                sort_order: idx,
                is_primary: img.image_url === primaryImgUrl,
              }));

              await supabase.from('product_images').insert(imageRows);
            } catch (imgErr) {
              console.warn('Notice: product_images table insert skipped or unavailable:', imgErr);
            }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase product insert failed:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setProducts(prev => [newProduct, ...prev]);
    setIsSaving(false);
    showNotification(`Product "${productData.name}" created successfully.`, 'success');
    return true;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();

    const rawImages = updates.images;
    let primaryImgUrl: string | undefined = undefined;
    if (rawImages !== undefined) {
      primaryImgUrl = rawImages.find(img => img.is_primary)?.image_url || rawImages[0]?.image_url || '';
    } else if (updates.image_url !== undefined) {
      primaryImgUrl = updates.image_url;
    }

    // Strip out client-only relations before sending update to products table
    const { images, ...dbUpdates } = updates as any;
    if (primaryImgUrl !== undefined) {
      dbUpdates.image_url = primaryImgUrl;
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ ...dbUpdates, updated_at: now })
          .eq('id', id);

        if (error) {
          console.error('Supabase product update error:', error.message);
          showNotification(`Update error: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        }

        // If images were explicitly modified, sync the product_images table
        if (rawImages !== undefined) {
          try {
            await supabase.from('product_images').delete().eq('product_id', id);
            if (rawImages.length > 0) {
              const imageRows = rawImages.map((img, idx) => ({
                product_id: id,
                image_url: img.image_url,
                sort_order: idx,
                is_primary: img.image_url === primaryImgUrl,
              }));
              await supabase.from('product_images').insert(imageRows);
            }
          } catch (imgSyncErr) {
            console.warn('Notice: product_images sync skipped or table missing:', imgSyncErr);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase product update failed:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updatedProduct = { ...p, ...updates, updated_at: now };
          if (primaryImgUrl !== undefined) {
            updatedProduct.image_url = primaryImgUrl;
          }
          if (rawImages !== undefined) {
            updatedProduct.images = rawImages.map((img, idx) => ({
              ...img,
              sort_order: idx,
              is_primary: img.image_url === (primaryImgUrl || rawImages[0]?.image_url),
            }));
          }
          return updatedProduct;
        }
        return p;
      })
    );
    setIsSaving(false);
    showNotification('Product details updated successfully.', 'success');
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    setIsSaving(true);
    const prodToDelete = products.find(p => p.id === id);

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Supabase product delete warning:', error.message);
          showNotification(`Delete error: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase product delete failed:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    setIsSaving(false);
    showNotification(`Product "${prodToDelete?.name || 'Fragrance'}" deleted from catalog.`, 'success');
    return true;
  };

  const toggleProductActive = async (id: string): Promise<boolean> => {
    const prod = products.find(p => p.id === id);
    if (!prod) return false;
    const newStatus = !prod.active;
    return updateProduct(id, { active: newStatus });
  };

  const updateStock = async (id: string, newStock: number): Promise<boolean> => {
    return updateProduct(id, { stock: Math.max(0, newStock) });
  };

  // Order Actions
  const updateOrderStatus = async (id: string, status: OrderStatus): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const targetOrder = orders.find(o => o.id === id);
    const shortNum = targetOrder ? formatShortOrderNumber(targetOrder.order_number) : '001';

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status, updated_at: now })
          .eq('id', id);

        if (error) {
          console.error('Supabase order status update error:', error.message);
          showNotification('Unable to update order status. Please try again.', 'error');
          setIsSaving(false);
          return false;
        }
      } catch (err: unknown) {
        console.error('Supabase order status update failed:', err);
        showNotification('Unable to update order status. Please try again.', 'error');
        setIsSaving(false);
        return false;
      }
    }

    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status, updated_at: now } : o))
    );
    setIsSaving(false);
    showNotification(`Order #${shortNum} status updated to ${status}.`, 'success');
    return true;
  };

  const cancelOrder = async (id: string): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const targetOrder = orders.find(o => o.id === id);
    const shortNum = targetOrder ? formatShortOrderNumber(targetOrder.order_number) : '001';

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'CANCELLED', updated_at: now })
          .eq('id', id);

        if (error) {
          console.error('Supabase order cancel error:', error.message);
          showNotification('Unable to cancel order. Please try again.', 'error');
          setIsSaving(false);
          return false;
        }
      } catch (err: unknown) {
        console.error('Supabase order cancellation failed:', err);
        showNotification('Unable to cancel order. Please try again.', 'error');
        setIsSaving(false);
        return false;
      }
    }

    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'CANCELLED', updated_at: now } : o))
    );
    setIsSaving(false);
    showNotification(`Order #${shortNum} has been cancelled.`, 'success');
    return true;
  };

  const updateOrderAdminNote = async (id: string, note: string): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ admin_note: note, updated_at: now })
          .eq('id', id);

        if (error) {
          console.warn('Supabase order note update error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase order note update failed:', err);
      }
    }

    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, admin_note: note, updated_at: now } : o))
    );
    setIsSaving(false);
    showNotification('Internal admin note saved.', 'success');
    return true;
  };

  // Coupon Actions
  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const cleanCode = couponData.code.trim().toUpperCase();

    // Check duplicate code in local state
    if (coupons.some(c => c.code.toUpperCase() === cleanCode)) {
      showNotification(`Coupon code "${cleanCode}" already exists.`, 'error');
      setIsSaving(false);
      return false;
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discount_type: couponData.discount_type,
      discount_value: Number(couponData.discount_value),
      minimum_order: Number(couponData.minimum_order || 0),
      maximum_discount: couponData.maximum_discount != null ? Number(couponData.maximum_discount) : null,
      usage_limit: couponData.usage_limit != null ? Number(couponData.usage_limit) : null,
      used_count: 0,
      expires_at: couponData.expires_at || null,
      active: Boolean(couponData.active ?? true),
      created_at: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .insert([{
            code: cleanCode,
            discount_type: newCoupon.discount_type,
            discount_value: newCoupon.discount_value,
            minimum_order: newCoupon.minimum_order,
            maximum_discount: newCoupon.maximum_discount,
            usage_limit: newCoupon.usage_limit,
            used_count: 0,
            expires_at: newCoupon.expires_at,
            active: newCoupon.active,
          }])
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('coupons')) {
            console.warn('Supabase coupons table not yet created (PGRST205). Storing coupon in local admin cache:', error.message);
            setIsCouponsTableMissing(true);
            setCoupons(prev => [newCoupon, ...prev]);
            setIsSaving(false);
            showNotification(`Coupon "${cleanCode}" saved locally. Run the SQL Migration in Supabase to sync the database table.`, 'info');
            return true;
          }
          console.error('Supabase coupon insert error:', error);
          showNotification(`Failed to create coupon: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        } else if (data) {
          newCoupon.id = data.id;
          newCoupon.created_at = data.created_at || now;
          newCoupon.updated_at = data.updated_at || now;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase coupon insert exception:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setCoupons(prev => [newCoupon, ...prev]);
    setIsSaving(false);
    showNotification(`Coupon "${cleanCode}" created successfully.`, 'success');
    return true;
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();
    const cleanUpdates: any = { ...updates, updated_at: now };

    if (cleanUpdates.code) {
      cleanUpdates.code = cleanUpdates.code.trim().toUpperCase();
    }
    if (cleanUpdates.discount_value !== undefined) {
      cleanUpdates.discount_value = Number(cleanUpdates.discount_value);
    }
    if (cleanUpdates.minimum_order !== undefined) {
      cleanUpdates.minimum_order = Number(cleanUpdates.minimum_order);
    }
    if (cleanUpdates.maximum_discount !== undefined) {
      cleanUpdates.maximum_discount = cleanUpdates.maximum_discount != null ? Number(cleanUpdates.maximum_discount) : null;
    }
    if (cleanUpdates.usage_limit !== undefined) {
      cleanUpdates.usage_limit = cleanUpdates.usage_limit != null ? Number(cleanUpdates.usage_limit) : null;
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('coupons')
          .update(cleanUpdates)
          .eq('id', id);

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            setIsCouponsTableMissing(true);
            setCoupons(prev => prev.map(c => (c.id === id ? { ...c, ...cleanUpdates } : c)));
            setIsSaving(false);
            showNotification('Coupon updated in local cache. Run the SQL Migration in Supabase to sync.', 'info');
            return true;
          }
          console.error('Supabase coupon update error:', error.message);
          showNotification(`Update error: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase coupon update failed:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setCoupons(prev =>
      prev.map(c => (c.id === id ? { ...c, ...cleanUpdates } : c))
    );
    setIsSaving(false);
    showNotification('Coupon updated successfully.', 'success');
    return true;
  };

  const deleteCoupon = async (id: string): Promise<boolean> => {
    setIsSaving(true);
    const couponToDelete = coupons.find(c => c.id === id);

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', id);

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            setIsCouponsTableMissing(true);
            setCoupons(prev => prev.filter(c => c.id !== id));
            setIsSaving(false);
            showNotification(`Coupon "${couponToDelete?.code || ''}" removed from local cache.`, 'info');
            return true;
          }
          console.error('Supabase coupon delete error:', error.message);
          showNotification(`Delete error: ${error.message}`, 'error');
          setIsSaving(false);
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Supabase coupon delete failed:', err);
        showNotification(`Database error: ${msg}`, 'error');
        setIsSaving(false);
        return false;
      }
    }

    setCoupons(prev => prev.filter(c => c.id !== id));
    setIsSaving(false);
    showNotification(`Coupon "${couponToDelete?.code || ''}" removed successfully.`, 'info');
    return true;
  };

  const toggleCouponActive = async (id: string): Promise<boolean> => {
    const target = coupons.find(c => c.id === id);
    if (!target) return false;
    const newActive = !target.active;
    return updateCoupon(id, { active: newActive });
  };

  const validateCouponCode = async (code: string, subtotal: number): Promise<CouponValidationResult> => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: 'Invalid coupon code.' };
    }

    const supabase = getSupabase();
    let targetCoupon: Coupon | undefined;

    if (supabase && isSupabaseLive) {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (error) {
          console.warn('Coupon Supabase lookup error:', error.message);
        } else if (data) {
          targetCoupon = {
            id: data.id,
            code: (data.code || '').toUpperCase(),
            discount_type: data.discount_type === 'fixed' ? 'fixed' : 'percentage',
            discount_value: Number(data.discount_value || 0),
            minimum_order: Number(data.minimum_order || 0),
            maximum_discount: data.maximum_discount != null ? Number(data.maximum_discount) : null,
            usage_limit: data.usage_limit != null ? Number(data.usage_limit) : null,
            used_count: Number(data.used_count || 0),
            expires_at: data.expires_at || null,
            active: Boolean(data.active ?? true),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Coupon Supabase lookup exception:', err);
      }
    }

    // Fallback to local state if not found via query or offline
    if (!targetCoupon) {
      targetCoupon = coupons.find(c => c.code.toUpperCase() === cleanCode);
    }

    if (!targetCoupon) {
      return { valid: false, error: 'Invalid coupon code.' };
    }

    if (!targetCoupon.active) {
      return { valid: false, error: 'This coupon is currently unavailable.' };
    }

    if (targetCoupon.expires_at && new Date(targetCoupon.expires_at).getTime() < Date.now()) {
      return { valid: false, error: 'This coupon has expired.' };
    }

    if (targetCoupon.usage_limit != null && targetCoupon.used_count >= targetCoupon.usage_limit) {
      return { valid: false, error: 'This coupon is no longer available.' };
    }

    if (subtotal < targetCoupon.minimum_order) {
      return {
        valid: false,
        error: `Minimum order value of ৳${targetCoupon.minimum_order.toLocaleString('en-US')} is required for this coupon.`
      };
    }

    let calculatedDiscount = 0;
    if (targetCoupon.discount_type === 'percentage') {
      calculatedDiscount = (subtotal * targetCoupon.discount_value) / 100;
      if (targetCoupon.maximum_discount != null && calculatedDiscount > targetCoupon.maximum_discount) {
        calculatedDiscount = targetCoupon.maximum_discount;
      }
    } else {
      calculatedDiscount = targetCoupon.discount_value;
    }

    // Ensure discount never exceeds subtotal or becomes negative
    if (calculatedDiscount > subtotal) {
      calculatedDiscount = subtotal;
    }
    if (calculatedDiscount < 0) {
      calculatedDiscount = 0;
    }

    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return {
      valid: true,
      coupon: targetCoupon,
      discountAmount: calculatedDiscount,
      calculatedDiscount
    };
  };

  const incrementCouponUsedCount = async (code: string): Promise<boolean> => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return false;

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('increment_coupon_usage', {
          p_code: cleanCode
        });

        if (!rpcError && rpcData) {
          refreshData();
          return true;
        }

        // Direct query fallback
        const { data: cData } = await supabase
          .from('coupons')
          .select('id, used_count, usage_limit')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (cData) {
          if (cData.usage_limit != null && cData.used_count >= cData.usage_limit) {
            return false;
          }
          await supabase
            .from('coupons')
            .update({
              used_count: (cData.used_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', cData.id);
          refreshData();
          return true;
        }
      } catch (err) {
        console.warn('Coupon increment error:', err);
      }
    }

    setCoupons(prev =>
      prev.map(c => (c.code.toUpperCase() === cleanCode ? { ...c, used_count: c.used_count + 1 } : c))
    );
    return true;
  };

  // Settings Actions
  const updateSettings = async (updates: Partial<StoreSettings>): Promise<boolean> => {
    setIsSaving(true);
    const now = new Date().toISOString();
    
    const insideCharge = Number(
      updates.inside_dhaka_delivery_charge ?? updates.delivery_inside_dhaka ?? settings.inside_dhaka_delivery_charge ?? 70
    );
    const outsideCharge = Number(
      updates.outside_dhaka_delivery_charge ?? updates.delivery_outside_dhaka ?? settings.outside_dhaka_delivery_charge ?? 130
    );
    const phone = updates.phone ?? updates.contact_phone ?? settings.phone ?? '';
    const email = updates.email ?? updates.contact_email ?? settings.email ?? '';
    const whatsapp = updates.whatsapp ?? updates.contact_whatsapp ?? settings.whatsapp ?? '';
    const instagram = updates.instagram ?? updates.social_instagram ?? settings.instagram ?? '';
    const facebook = updates.facebook ?? updates.social_facebook ?? settings.facebook ?? '';
    const tiktok = updates.tiktok ?? updates.social_tiktok ?? settings.tiktok ?? '';
    const pinterest = updates.pinterest ?? updates.social_pinterest ?? settings.pinterest ?? '';

    const payload: any = {
      brand_name: updates.brand_name ?? settings.brand_name,
      brand_tagline: updates.brand_tagline ?? settings.brand_tagline,
      currency: updates.currency ?? settings.currency,
      inside_dhaka_delivery_charge: insideCharge,
      outside_dhaka_delivery_charge: outsideCharge,
      phone,
      email,
      whatsapp,
      instagram,
      facebook,
      tiktok,
      pinterest,
      store_active: updates.store_active ?? settings.store_active,
      accept_orders: updates.accept_orders ?? settings.accept_orders,
      maintenance_mode: updates.maintenance_mode ?? settings.maintenance_mode,
      updated_at: now,
    };

    if (settings.id) {
      payload.id = settings.id;
    }

    const supabase = getSupabase();
    if (supabase && isSupabaseLive) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .upsert([payload])
          .select();

        if (error) {
          console.warn('Supabase settings update error:', error.message);
          showNotification(`Database note: ${error.message}`, 'info');
        } else if (data && data.length > 0 && data[0].id) {
          payload.id = data[0].id;
        }
      } catch (err) {
        console.warn('Supabase settings update failed:', err);
      }
    }

    const newSettings: StoreSettings = {
      ...settings,
      ...updates,
      ...payload,
      inside_dhaka_delivery_charge: insideCharge,
      outside_dhaka_delivery_charge: outsideCharge,
      phone,
      email,
      whatsapp,
      instagram,
      facebook,
      tiktok,
      pinterest,
      delivery_inside_dhaka: insideCharge,
      delivery_outside_dhaka: outsideCharge,
      contact_phone: phone,
      contact_email: email,
      contact_whatsapp: whatsapp,
      social_instagram: instagram,
      social_facebook: facebook,
      social_tiktok: tiktok,
      social_pinterest: pinterest,
      updated_at: now,
    };

    setSettings(newSettings);
    setIsSaving(false);
    showNotification('Store settings saved successfully.', 'success');
    return true;
  };

  // Compute Dashboard Statistics dynamically
  const dashboardStats: DashboardStats = useMemo(() => {
    let totalSales = 0;
    let productsSold = 0;
    let newOrders = 0;
    let confirmedOrders = 0;
    let processingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        totalSales += Number(order.total) || 0;
        order.items?.forEach(item => {
          productsSold += item.quantity || 1;
        });
      }

      switch (order.status) {
        case 'NEW':
          newOrders++;
          break;
        case 'CONFIRMED':
          confirmedOrders++;
          break;
        case 'PROCESSING':
          processingOrders++;
          break;
        case 'SHIPPED':
          shippedOrders++;
          break;
        case 'DELIVERED':
          deliveredOrders++;
          break;
        case 'CANCELLED':
          cancelledOrders++;
          break;
      }
    });

    const lowStockCount = products.filter(
      p => p.active && p.stock <= (p.low_stock_threshold || 5)
    ).length;

    return {
      totalOrders: orders.length,
      newOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSales,
      productsSold,
      lowStockCount,
      totalProductsCount: products.length,
    };
  }, [orders, products]);

  const activeCouponsCount = useMemo(() => {
    const now = Date.now();
    return coupons.filter(c => c.active && (!c.expires_at || new Date(c.expires_at).getTime() >= now)).length;
  }, [coupons]);

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        customers,
        coupons,
        settings,
        dashboardStats,
        activeCouponsCount,
        isLoading,
        isSaving,
        isSupabaseLive,
        isCouponsTableMissing,
        supabaseConfig,
        refreshData,
        updateSupabaseCredentials,
        disconnectSupabase,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        updateStock,
        updateOrderStatus,
        cancelOrder,
        updateOrderAdminNote,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        validateCouponCode,
        incrementCouponUsedCount,
        updateSettings,
        actionMessage,
        clearActionMessage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
