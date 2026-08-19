/**
 * AEVY Supabase PostgreSQL Database Schema & Security Policies
 * Shared between Public AEVY Shop and Secure AEVY Admin
 *
 * Rules:
 * - NO DEMO / SAMPLE DATA inserted (0 products, 0 orders, 0 customers, 0 order items, 0 inventory).
 * - Single initial settings row with Brand: 'AEVY', Tagline: 'ESSENCE OF FRESH ELEGANCE', Currency: 'BDT', delivery charges: 0.
 * - public.profiles.role = 'admin' strictly controls all admin write/read capabilities.
 * - Public shop can read active products, submit orders, and submit order items.
 * - Historical orders are protected: Deleting a product keeps order_items intact (product_id SET NULL with historical fields preserved).
 * - Inventory trigger automatically initializes/updates inventory without creating negative stock.
 */

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- AEVY POSTGRESQL PRODUCTION DATABASE SCHEMA & RLS
-- Brand: AEVY | ESSENCE OF FRESH ELEGANCE
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 2. SETTINGS TABLE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL DEFAULT 'AEVY',
  brand_tagline TEXT DEFAULT 'ESSENCE OF FRESH ELEGANCE',
  currency TEXT NOT NULL DEFAULT 'BDT',
  inside_dhaka_delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  outside_dhaka_delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  tiktok TEXT DEFAULT '',
  pinterest TEXT DEFAULT '',
  store_active BOOLEAN NOT NULL DEFAULT true,
  accept_orders BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Seed exactly ONE initial neutral settings record if table is completely empty
INSERT INTO public.settings (
  brand_name,
  brand_tagline,
  currency,
  inside_dhaka_delivery_charge,
  outside_dhaka_delivery_charge,
  phone,
  email,
  whatsapp,
  instagram,
  facebook,
  tiktok,
  pinterest,
  store_active,
  accept_orders,
  maintenance_mode
)
SELECT 
  'AEVY',
  'ESSENCE OF FRESH ELEGANCE',
  'BDT',
  0.00,
  0.00,
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  true,
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- ==========================================================
-- 3. PROFILES TABLE (Linked with auth.users)
-- Role must be 'admin' or 'customer'
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==========================================================
-- 4. PRODUCTS TABLE (30ml Extrait Standard, Round / Square)
-- Zero demo records
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  size TEXT NOT NULL DEFAULT '30ml',
  bottle_shape TEXT NOT NULL DEFAULT 'Round' CHECK (bottle_shape IN ('Round', 'Square')),
  category TEXT DEFAULT 'Extrait de Parfum',
  gender TEXT DEFAULT 'Unisex' CHECK (gender IN ('Unisex', 'Men', 'Women')),
  top_notes TEXT,
  heart_notes TEXT,
  base_notes TEXT,
  sku TEXT UNIQUE NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  seasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ensure columns exist in case products table was created earlier
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ==========================================================
-- 4B. PRODUCT IMAGES TABLE (1:N Multi-Image Gallery)
-- Zero demo records
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images (sort_order);

-- ==========================================================
-- 5. CUSTOMERS DIRECTORY TABLE
-- Zero demo records
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  district TEXT,
  thana TEXT,
  thana_upazila TEXT,
  full_address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==========================================================
-- 6. ORDERS TABLE
-- Zero demo records
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  order_id TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  district TEXT NOT NULL,
  thana TEXT,
  thana_upazila TEXT NOT NULL DEFAULT '',
  address TEXT,
  full_address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'bKash', 'Nagad', 'Card')),
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (delivery_charge >= 0),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  coupon_code TEXT,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  customer_note TEXT,
  internal_note TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Ensure columns exist in case table was created earlier
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- ==========================================================
-- 7. ORDER ITEMS TABLE (Relationship with Orders)
-- Preserves historical items even if product is deleted (ON DELETE SET NULL)
-- Zero demo records
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '30ml',
  bottle_shape TEXT NOT NULL DEFAULT 'Round',
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==========================================================
-- 8. COUPONS TABLE
-- AEVY Promotional Coupons & Discount Management
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (minimum_order >= 0),
  maximum_discount NUMERIC(10,2) CHECK (maximum_discount IS NULL OR maximum_discount >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Coupon indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons (expires_at);

-- ==========================================================
-- 9. INVENTORY TABLE
-- Zero demo records; populated strictly upon real product creation
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sku TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==========================================================
-- 9. AUTOMATIC INVENTORY SYNC TRIGGER
-- Keeps inventory synchronized with products in real time
-- ==========================================================
CREATE OR REPLACE FUNCTION public.sync_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.inventory (
      product_id,
      sku,
      stock_quantity,
      reserved_quantity,
      available_quantity,
      low_stock_threshold,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.sku,
      GREATEST(0, NEW.stock),
      0,
      GREATEST(0, NEW.stock),
      GREATEST(0, NEW.low_stock_threshold),
      NOW()
    )
    ON CONFLICT (product_id) DO UPDATE SET
      sku = EXCLUDED.sku,
      stock_quantity = EXCLUDED.stock_quantity,
      available_quantity = GREATEST(0, EXCLUDED.stock_quantity - public.inventory.reserved_quantity),
      low_stock_threshold = EXCLUDED.low_stock_threshold,
      updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.inventory
    SET
      sku = NEW.sku,
      stock_quantity = GREATEST(0, NEW.stock),
      available_quantity = GREATEST(0, NEW.stock - reserved_quantity),
      low_stock_threshold = GREATEST(0, NEW.low_stock_threshold),
      updated_at = NOW()
    WHERE product_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_product_inventory ON public.products;
CREATE TRIGGER trigger_sync_product_inventory
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_inventory();

-- ==========================================================
-- 10. SUPABASE STORAGE (product-images bucket)
-- ==========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- ==========================================================
-- 11. HELPER FUNCTIONS FOR STRICT ROLE-BASED ACCESS CONTROL
-- Admin status is strictly determined by public.profiles.role = 'admin'
-- No email-pattern matching or user_metadata overrides
-- ==========================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Service role key has backend superuser access
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;

  -- Verify authenticated user has role = 'admin' in public.profiles
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$;

-- Automatic profile creation on auth.users (strictly defaults to 'customer')
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'AEVY User'),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent customers / regular users from changing role to admin
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only existing administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_role ON public.profiles;
CREATE TRIGGER trigger_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- ==========================================================
-- 12. TABLE PERMISSIONS & GRANTS
-- ==========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.settings TO anon, authenticated, service_role;
GRANT ALL ON public.settings TO authenticated, service_role;

GRANT SELECT ON public.products TO anon, authenticated, service_role;
GRANT ALL ON public.products TO authenticated, service_role;

GRANT SELECT ON public.product_images TO anon, authenticated, service_role;
GRANT ALL ON public.product_images TO authenticated, service_role;

GRANT INSERT, SELECT ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO authenticated, service_role;

GRANT INSERT, SELECT ON public.order_items TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO authenticated, service_role;

GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated, service_role;

GRANT ALL ON public.customers TO authenticated, service_role;
GRANT ALL ON public.inventory TO authenticated, service_role;
GRANT SELECT ON public.coupons TO anon, authenticated, service_role;
GRANT ALL ON public.coupons TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_product_inventory() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.protect_profile_role() TO anon, authenticated, service_role;

-- ==========================================================
-- 13. COUPON VALIDATION & USAGE STORED FUNCTIONS
-- ==========================================================
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0.00;
  v_clean_code TEXT;
BEGIN
  v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
  
  IF v_clean_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code.');
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = v_clean_code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code.');
  END IF;
  
  IF NOT v_coupon.active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is currently unavailable.');
  END IF;
  
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired.');
  END IF;
  
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is no longer available.');
  END IF;
  
  IF p_subtotal < v_coupon.minimum_order THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Minimum order value of ৳' || TO_CHAR(v_coupon.minimum_order, 'FM999,999,999') || ' is required for this coupon.'
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_subtotal * v_coupon.discount_value) / 100.0;
    IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
      v_discount := v_coupon.maximum_discount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  -- Ensure discount never exceeds subtotal or becomes negative
  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;
  IF v_discount < 0 THEN
    v_discount := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'minimum_order', v_coupon.minimum_order,
    'maximum_discount', v_coupon.maximum_discount,
    'id', v_coupon.id
  );
END;
$$;

-- Atomic increment coupon usage function
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_code TEXT;
BEGIN
  v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
  
  IF v_clean_code = '' THEN
    RETURN false;
  END IF;

  UPDATE public.coupons
  SET 
    used_count = used_count + 1,
    updated_at = NOW()
  WHERE UPPER(code) = v_clean_code
  AND (usage_limit IS NULL OR used_count < usage_limit);
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO anon, authenticated, service_role;

-- ==========================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- Settings Policies
-- Public: Can read settings
-- Admin: Can insert / update settings
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
CREATE POLICY "Admin write settings" ON public.settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Products Policies
-- Public: Can read active products only
-- Admin: Can SELECT, INSERT, UPDATE, DELETE all products
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public read active products" ON public.products;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;
DROP POLICY IF EXISTS "Admin delete products" ON public.products;

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admin insert products" ON public.products
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update products" ON public.products
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin delete products" ON public.products
  FOR DELETE
  USING (public.is_admin());

-- ----------------------------------------------------------
-- Product Images Policies (1:N Gallery)
-- Public: Can read images
-- Admin: Can SELECT, INSERT, UPDATE, DELETE all product images
-- ----------------------------------------------------------
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;

CREATE POLICY "Public read product_images" ON public.product_images
  FOR SELECT
  USING (true);

CREATE POLICY "Admin manage product_images" ON public.product_images
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Orders Policies
-- Public/Shop: Can place order (INSERT)
-- Customer: Can read their own order via customer_id or when admin
-- Admin: Full management (read, update status, note)
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
CREATE POLICY "Public create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Secure read orders" ON public.orders;
CREATE POLICY "Secure read orders" ON public.orders
  FOR SELECT USING (
    public.is_admin() OR 
    (auth.uid() IS NOT NULL AND customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;
CREATE POLICY "Admin manage orders" ON public.orders
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Order Items Policies
-- Public/Shop: Can insert order items when creating order
-- Read: Admin or authenticated customer viewing own order
-- Admin: Full management
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public create order items" ON public.order_items;
CREATE POLICY "Public create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Secure read order items" ON public.order_items;
CREATE POLICY "Secure read order items" ON public.order_items
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admin manage order items" ON public.order_items;
CREATE POLICY "Admin manage order items" ON public.order_items
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Customers Policies
-- Strictly admin-only directory
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Admin manage customers" ON public.customers;
CREATE POLICY "Admin manage customers" ON public.customers
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Inventory Policies
-- Strictly admin-only management
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Admin manage inventory" ON public.inventory;
CREATE POLICY "Admin manage inventory" ON public.inventory
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Coupons Policies
-- Public: Can read active coupons
-- Admin: Full CRUD (Select, Insert, Update, Delete)
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------
-- Profiles Policies
-- Users can read/update their own profile
-- Admin can view/manage profiles
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- ----------------------------------------------------------
-- Supabase Storage Policies (product-images bucket)
-- Public: Can view images
-- Admin: Only role='admin' can upload, update, delete
-- ----------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public View Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin insert product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;

-- SELECT (Public & Admin can view files in product-images)
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- INSERT (Admin only)
CREATE POLICY "Admin insert product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_admin()
  );

-- UPDATE (Admin only, needed for upsert)
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images' AND
    public.is_admin()
  );

-- DELETE (Admin only)
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images' AND
    public.is_admin()
  );

-- ==========================================================
-- 14. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- ==========================================================
NOTIFY pgrst, 'reload schema';
`;

/**
 * Safe Incremental SQL Migration Script for Existing AEVY Supabase Databases
 * Adds product_images table, seasons column, coupons table, and updated validate_coupon function
 * without dropping or modifying any existing data.
 */
export const SUPABASE_MIGRATION_SQL = `-- ==========================================================
-- AEVY SAFE INCREMENTAL SCHEMA MIGRATION SCRIPT
-- Execute in Supabase Dashboard -> SQL Editor
-- Safe to run on existing databases (non-destructive)
-- ==========================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Update products table with seasons and image_url
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Create product_images table (1:N Gallery)
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images (sort_order);

-- 4. Enable RLS and grants for product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.product_images TO anon, authenticated, service_role;
GRANT ALL ON public.product_images TO authenticated, service_role;

DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
DROP POLICY IF EXISTS "Admin manage product_images" ON public.product_images;

CREATE POLICY "Public read product_images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Admin manage product_images" ON public.product_images
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Ensure coupons table exists
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (minimum_order >= 0),
  maximum_discount NUMERIC(10,2) CHECK (maximum_discount IS NULL OR maximum_discount >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (active);
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON public.coupons (expires_at);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.coupons TO anon, authenticated, service_role;
GRANT ALL ON public.coupons TO authenticated, service_role;

DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;

CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (active = true OR public.is_admin());

CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. Ensure orders has coupon_code and discount
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 7. Update validate_coupon function (Flexible discount & Date validation)
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0.00;
  v_clean_code TEXT;
BEGIN
  v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
  
  IF v_clean_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code.');
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = v_clean_code;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code.');
  END IF;
  
  IF NOT v_coupon.active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is currently unavailable.');
  END IF;
  
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired.');
  END IF;
  
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is no longer available.');
  END IF;
  
  IF p_subtotal < v_coupon.minimum_order THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Minimum order value of ৳' || TO_CHAR(v_coupon.minimum_order, 'FM999,999,999') || ' is required for this coupon.'
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_subtotal * v_coupon.discount_value) / 100.0;
    IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
      v_discount := v_coupon.maximum_discount;
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;
  
  -- Ensure discount never exceeds subtotal or becomes negative
  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;
  IF v_discount < 0 THEN
    v_discount := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'minimum_order', v_coupon.minimum_order,
    'maximum_discount', v_coupon.maximum_discount,
    'id', v_coupon.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC) TO anon, authenticated, service_role;

-- 8. Stored function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_code TEXT;
BEGIN
  v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
  
  IF v_clean_code = '' THEN
    RETURN false;
  END IF;

  UPDATE public.coupons
  SET 
    used_count = used_count + 1,
    updated_at = NOW()
  WHERE UPPER(code) = v_clean_code
  AND (usage_limit IS NULL OR used_count < usage_limit);
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO anon, authenticated, service_role;

-- 9. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';
`;

/**
 * Optional Clean-Up SQL script to purge test records from Supabase tables
 * Run ONLY if you wish to wipe any records previously inserted for testing.
 */
export const SUPABASE_CLEANUP_SQL = `-- Run this in Supabase SQL Editor to wipe test records:
DELETE FROM public.product_images;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.inventory;
DELETE FROM public.customers;
DELETE FROM public.products;
NOTIFY pgrst, 'reload schema';
`;
