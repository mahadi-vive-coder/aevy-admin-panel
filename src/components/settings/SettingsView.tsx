import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';
import { SUPABASE_SQL_SCHEMA, SUPABASE_CLEANUP_SQL } from '../../lib/supabaseSchema';
import {
  Settings,
  Truck,
  Phone,
  Share2,
  Store,
  Database,
  Save,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Shield,
  Sparkles,
  RefreshCw,
  Power,
  UserCheck,
  Lock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    isSaving,
    isSupabaseLive,
    supabaseConfig,
    updateSupabaseCredentials,
    disconnectSupabase,
    refreshData
  } = useData();
  const { user, diagnostics, checkSession } = useAuth();

  // Local state for editable settings
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Local state for Supabase credentials modal / panel
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isConnectingSupabase, setIsConnectingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCleanupSql, setCopiedCleanupSql] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'contact' | 'social' | 'store' | 'database'>('general');

  const handleFieldChange = (key: keyof StoreSettings, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'delivery_inside_dhaka' || key === 'inside_dhaka_delivery_charge') {
        next.inside_dhaka_delivery_charge = Number(value);
        next.delivery_inside_dhaka = Number(value);
      }
      if (key === 'delivery_outside_dhaka' || key === 'outside_dhaka_delivery_charge') {
        next.outside_dhaka_delivery_charge = Number(value);
        next.delivery_outside_dhaka = Number(value);
      }
      if (key === 'contact_phone' || key === 'phone') {
        next.phone = value;
        next.contact_phone = value;
      }
      if (key === 'contact_email' || key === 'email') {
        next.email = value;
        next.contact_email = value;
      }
      if (key === 'contact_whatsapp' || key === 'whatsapp') {
        next.whatsapp = value;
        next.contact_whatsapp = value;
      }
      if (key === 'social_instagram' || key === 'instagram') {
        next.instagram = value;
        next.social_instagram = value;
      }
      if (key === 'social_facebook' || key === 'facebook') {
        next.facebook = value;
        next.social_facebook = value;
      }
      if (key === 'social_tiktok' || key === 'tiktok') {
        next.tiktok = value;
        next.social_tiktok = value;
      }
      if (key === 'social_pinterest' || key === 'pinterest') {
        next.pinterest = value;
        next.social_pinterest = value;
      }
      return next;
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingSupabase(true);
    await updateSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setIsConnectingSupabase(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyCleanupSql = () => {
    navigator.clipboard.writeText(SUPABASE_CLEANUP_SQL);
    setCopiedCleanupSql(true);
    setTimeout(() => setCopiedCleanupSql(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-brand text-2xl font-bold text-[#FAF9F5]">
            Store Settings & Database Architecture
          </h1>
          <p className="text-xs text-[#8E8E9A] mt-1">
            Configure global brand metadata, Dhaka delivery fees, concierge contacts, and Supabase backend.
          </p>
        </div>

        {/* Save button for form */}
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:brightness-110 text-[#0B0B0C] font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202028] pb-3 text-xs">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'delivery'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Delivery</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'contact'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Concierge & Contact</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'social'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Social Media</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'store'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Store Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'database'
              ? 'bg-[#D4AF37] text-[#0B0B0C]'
              : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase Database & SQL</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-[#121216] border border-[#22222A] rounded-2xl p-6 shadow-xl">
        
        {/* 1. GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                General Brand Identity
              </h2>
              <p className="text-[#8E8E9A] mt-0.5">
                Brand nomenclature and default monetary currency across all storefronts.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => handleFieldChange('brand_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                  placeholder="BDT"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.brand_tagline}
                  onChange={(e) => handleFieldChange('brand_tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. DELIVERY SETTINGS */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                Courier & Delivery Charges (Bangladesh)
              </h2>
              <p className="text-[#8E8E9A] mt-0.5">
                Standard delivery tariffs applied during customer checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#16161E] border border-[#242430] rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
                  Inside Dhaka Delivery Charge (BDT ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={formData.delivery_inside_dhaka}
                  onChange={(e) => handleFieldChange('delivery_inside_dhaka', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-bold text-sm"
                />
                <p className="text-[11px] text-[#7A7A8A]">
                  Default for Dhaka Metro, Gulshan, Banani, Dhanmondi, Uttara, Mirpur.
                </p>
              </div>

              <div className="p-4 bg-[#16161E] border border-[#242430] rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider">
                  Outside Dhaka Delivery Charge (BDT ৳)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={formData.delivery_outside_dhaka}
                  onChange={(e) => handleFieldChange('delivery_outside_dhaka', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-bold text-sm"
                />
                <p className="text-[11px] text-[#7A7A8A]">
                  Applies to Chittagong, Sylhet, Rajshahi, Khulna, and all other districts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. CONTACT SETTINGS */}
        {activeTab === 'contact' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                Concierge & Client Relations Channels
              </h2>
              <p className="text-[#8E8E9A] mt-0.5">
                Official contact channels published for customer assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Concierge Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleFieldChange('contact_email', e.target.value)}
                  placeholder="concierge@aevyfragrance.com"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  WhatsApp Direct
                </label>
                <input
                  type="text"
                  value={formData.contact_whatsapp}
                  onChange={(e) => handleFieldChange('contact_whatsapp', e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. SOCIAL MEDIA SETTINGS */}
        {activeTab === 'social' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                Social Media Handles & Links
              </h2>
              <p className="text-[#8E8E9A] mt-0.5">
                Official social ecosystem for the AEVY brand.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.social_instagram}
                  onChange={(e) => handleFieldChange('social_instagram', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.social_facebook}
                  onChange={(e) => handleFieldChange('social_facebook', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={formData.social_tiktok}
                  onChange={(e) => handleFieldChange('social_tiktok', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider mb-1.5">
                  Pinterest URL
                </label>
                <input
                  type="url"
                  value={formData.social_pinterest}
                  onChange={(e) => handleFieldChange('social_pinterest', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. STORE CONTROLS */}
        {activeTab === 'store' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                E-Commerce Operational Switches
              </h2>
              <p className="text-[#8E8E9A] mt-0.5">
                Control customer availability, checkout access, and maintenance mode.
              </p>
            </div>

            <div className="space-y-4">
              {/* Store Active */}
              <div className="p-4 bg-[#16161E] border border-[#242430] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#FAF9F5]">Store Active</div>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">
                    Whether the customer-facing storefront (shop.aevyfragrance.com) is publicly accessible.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.store_active}
                    onChange={(e) => handleFieldChange('store_active', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#262632] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>

              {/* Accept Orders */}
              <div className="p-4 bg-[#16161E] border border-[#242430] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#FAF9F5]">Accept Orders</div>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">
                    Allow patrons to add items to cart and execute orders.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.accept_orders}
                    onChange={(e) => handleFieldChange('accept_orders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#262632] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>

              {/* Maintenance Mode */}
              <div className="p-4 bg-[#16161E] border border-[#242430] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#FAF9F5]">Maintenance Mode</div>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">
                    Display an elegant luxury maintenance screen during private collection drops or updates.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenance_mode}
                    onChange={(e) => handleFieldChange('maintenance_mode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#262632] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 6. SUPABASE DATABASE & SQL MIGRATION */}
        {activeTab === 'database' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                    Supabase PostgreSQL Connection & Schema Setup
                  </h2>
                  <p className="text-[#8E8E9A] mt-0.5">
                    Shared database connection for Customer Shop and Admin Panel.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isSupabaseLive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {isSupabaseLive ? 'Connected to Supabase' : 'Offline Local Storage Cache'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Auth & RLS Session Diagnostics Card */}
            <div className="p-4 bg-[#14141B] border border-[#23232F] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-semibold text-xs text-[#FAF9F5] uppercase tracking-wider">
                    Admin Session & RLS Verification
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => checkSession()}
                  className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-check Session
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div className="p-2.5 bg-[#0B0B0E] border border-[#1E1E28] rounded-lg">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A7A8A]">1. auth.uid()</div>
                  <div className="text-xs font-mono text-[#E0E0E8] truncate mt-0.5">
                    {diagnostics.authUid || <span className="text-red-400">Not authenticated</span>}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0B0B0E] border border-[#1E1E28] rounded-lg">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A7A8A]">2. public.profiles.id</div>
                  <div className="text-xs font-mono text-[#E0E0E8] truncate mt-0.5">
                    {diagnostics.profileId || <span className="text-red-400">No profile record</span>}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0B0B0E] border border-[#1E1E28] rounded-lg">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A7A8A]">3. public.profiles.role</div>
                  <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                    {diagnostics.profileRole === 'admin' ? (
                      <span className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                        admin (Verified)
                      </span>
                    ) : (
                      <span className="text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800">
                        {diagnostics.profileRole || 'None'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 bg-[#0B0B0E] border border-[#1E1E28] rounded-lg">
                  <div className="text-[10px] uppercase tracking-wider text-[#7A7A8A]">4. public.is_admin() RLS Check</div>
                  <div className="text-xs font-semibold mt-0.5">
                    {diagnostics.hasAdminPrivileges && diagnostics.authUid === diagnostics.profileId ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Full RLS Bypass Valid
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Fails WITH CHECK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {diagnostics.authUid && diagnostics.profileRole === 'admin' && diagnostics.authUid === diagnostics.profileId && (
                <div className="p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>Session valid: <code>auth.uid() = profiles.id</code> with <code>role = 'admin'</code>. Product insertions are fully permitted by RLS.</span>
                </div>
              )}
            </div>

            {/* Connection Credentials Box */}
            <form onSubmit={handleConnectSupabase} className="p-4 bg-[#16161E] border border-[#242430] rounded-xl space-y-4">
              <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase API Keys & URL (From Project Settings)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#A0A0B0] mb-1">
                    Supabase Project URL (e.g. https://your-project.supabase.co)
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A0A0B0] mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-[#FAF9F5] outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[#7A7A8A]">
                  Changes are stored securely in browser storage and apply to all data operations.
                </div>

                <div className="flex items-center gap-2">
                  {supabaseConfig.isConfigured && (
                    <button
                      type="button"
                      onClick={disconnectSupabase}
                      className="px-3.5 py-2 bg-[#20202C] hover:bg-red-950/40 text-[#FAF9F5] hover:text-red-300 border border-[#2E2E3E] rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Clear / Disconnect
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isConnectingSupabase}
                    className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-[#0B0B0C] font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isConnectingSupabase ? 'Connecting...' : 'Update & Connect'}
                  </button>
                </div>
              </div>
            </form>

            {/* SQL DDL & RLS Schema Runner Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-brand font-bold text-[#FAF9F5] text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span>Complete PostgreSQL Database Schema & RLS Policies</span>
                  </h3>
                  <p className="text-[11px] text-[#8E8E9A]">
                    Copy and run this in your Supabase SQL Editor to create public.settings and all database tables.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181822] hover:bg-[#22222E] text-[#D4AF37] border border-[#D4AF37]/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-[#22222C] bg-[#0A0A0D]">
                <pre className="p-4 text-[11px] font-mono text-[#D0D0DA] max-h-72 overflow-y-auto leading-relaxed selection:bg-[#D4AF37]/30">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>

            {/* Optional Database Clean Up SQL */}
            <div className="p-4 bg-[#16161E] border border-[#262632] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-[#FAF9F5]">Purge / Wipe Test Records Script</h4>
                  <p className="text-[11px] text-[#8E8E98]">
                    Execute only if you need to wipe previous test orders or mock products.
                  </p>
                </div>
                <button
                  onClick={handleCopyCleanupSql}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A24] hover:bg-[#242432] text-[#A0A0B0] hover:text-[#FAF9F5] border border-[#2E2E3E] rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {copiedCleanupSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCleanupSql ? 'Copied!' : 'Copy Cleanup SQL'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#0E0E12] border border-[#22222C] rounded-lg text-[11px] font-mono text-[#A0A0B0] overflow-x-auto">
                {SUPABASE_CLEANUP_SQL}
              </pre>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
