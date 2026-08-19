import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Coupon, DiscountType } from '../../types';
import { SUPABASE_MIGRATION_SQL } from '../../lib/supabaseSchema';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Percent,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Hash,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Play,
  Database,
  Terminal,
  Code2
} from 'lucide-react';

export const CouponsView: React.FC = () => {
  const {
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponActive,
    validateCouponCode,
    isSaving,
    isLoading,
    isSupabaseLive,
    isCouponsTableMissing,
    refreshData
  } = useData();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive' | 'max_used'>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'code_asc' | 'used_desc' | 'discount_desc' | 'expiring_soon'>('newest');

  // Copy Feedback State
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<string>('15');
  const [formMinimumOrder, setFormMinimumOrder] = useState<string>('0');
  const [formMaximumDiscount, setFormMaximumDiscount] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formExpiryTime, setFormExpiryTime] = useState<string>('');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Validation Sandbox Test State
  const [testCodeInput, setTestCodeInput] = useState('');
  const [testSubtotalInput, setTestSubtotalInput] = useState<number>(3000);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    valid: boolean;
    error?: string;
    discount?: number;
    coupon?: Coupon;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue('15');
    setFormMinimumOrder('0');
    setFormMaximumDiscount('');
    setFormUsageLimit('');
    
    // Default expiry date to 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setFormExpiryDate(`${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}`);
    setFormExpiryTime('');
    setFormActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discount_type);
    setFormDiscountValue(coupon.discount_value.toString());
    setFormMinimumOrder((coupon.minimum_order || 0).toString());
    setFormMaximumDiscount(coupon.maximum_discount != null ? coupon.maximum_discount.toString() : '');
    setFormUsageLimit(coupon.usage_limit != null ? coupon.usage_limit.toString() : '');
    
    // Parse date and time
    if (coupon.expires_at) {
      try {
        const d = new Date(coupon.expires_at);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setFormExpiryDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        const hours = d.getHours();
        const mins = d.getMinutes();
        // If not 23:59 (end of day), populate time
        if (!(hours === 23 && (mins === 59 || mins === 0))) {
          setFormExpiryTime(`${pad(hours)}:${pad(mins)}`);
        } else {
          setFormExpiryTime('');
        }
      } catch {
        setFormExpiryDate('');
        setFormExpiryTime('');
      }
    } else {
      setFormExpiryDate('');
      setFormExpiryTime('');
    }

    setFormActive(coupon.active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setFormError(null);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Coupon code is required.');
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      setFormError('Code must only contain uppercase letters, numbers, hyphens, and underscores.');
      return;
    }

    const numDiscountValue = Number(formDiscountValue);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      setFormError('Discount value must be a valid positive number.');
      return;
    }

    if (formDiscountType === 'percentage' && numDiscountValue > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    const maxDiscNum = formMaximumDiscount.trim() !== '' ? Number(formMaximumDiscount) : null;
    if (maxDiscNum !== null && (isNaN(maxDiscNum) || maxDiscNum <= 0)) {
      setFormError('Maximum discount must be a positive amount if specified.');
      return;
    }

    const usageLimitNum = formUsageLimit.trim() !== '' ? parseInt(formUsageLimit, 10) : null;
    if (usageLimitNum !== null && (isNaN(usageLimitNum) || usageLimitNum <= 0)) {
      setFormError('Usage limit must be a positive integer if specified.');
      return;
    }

    // Expiry Date is required
    if (!formExpiryDate.trim()) {
      setFormError('Expiry Date is required. Please choose an expiration date.');
      return;
    }

    let isoExpiry: string | null = null;
    try {
      if (formExpiryTime.trim()) {
        isoExpiry = new Date(`${formExpiryDate}T${formExpiryTime}:00`).toISOString();
      } else {
        // If time is omitted, valid until 23:59:59 (end of day)
        isoExpiry = new Date(`${formExpiryDate}T23:59:59`).toISOString();
      }
    } catch {
      setFormError('Invalid date or time entered.');
      return;
    }

    const payload = {
      code: cleanCode,
      discount_type: formDiscountType,
      discount_value: numDiscountValue,
      minimum_order: Number(formMinimumOrder || 0),
      maximum_discount: maxDiscNum,
      usage_limit: usageLimitNum,
      expires_at: isoExpiry,
      active: formActive,
    };

    let success = false;
    if (editingCoupon) {
      success = await updateCoupon(editingCoupon.id, payload);
    } else {
      success = await addCoupon(payload);
    }

    if (success) {
      handleCloseModal();
    }
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCoupon(couponToDelete.id);
    } finally {
      setIsDeleting(false);
      setCouponToDelete(null);
    }
  };

  // Run validation sandbox test
  const handleRunValidationTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCodeInput.trim()) return;

    setIsTesting(true);
    try {
      const result = await validateCouponCode(testCodeInput.trim(), Number(testSubtotalInput || 0));
      setTestResult({
        tested: true,
        valid: result.valid,
        error: result.error,
        discount: result.discountAmount,
        coupon: result.coupon
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Calculate stats
  const couponStats = useMemo(() => {
    const total = coupons.length;
    const now = Date.now();
    let active = 0;
    let expired = 0;
    let totalRedemptions = 0;

    coupons.forEach(c => {
      totalRedemptions += Number(c.used_count || 0);
      const isExpired = c.expires_at && new Date(c.expires_at).getTime() < now;
      if (isExpired) {
        expired++;
      } else if (c.active) {
        active++;
      }
    });

    return {
      total,
      active,
      expired,
      totalRedemptions,
    };
  }, [coupons]);

  // Filtered & Sorted Coupons
  const processedCoupons = useMemo(() => {
    const now = Date.now();
    let list = [...coupons];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(c => c.code.toUpperCase().includes(q));
    }

    // 2. Status filter
    if (statusFilter === 'active') {
      list = list.filter(c => c.active && (!c.expires_at || new Date(c.expires_at).getTime() >= now));
    } else if (statusFilter === 'expired') {
      list = list.filter(c => c.expires_at && new Date(c.expires_at).getTime() < now);
    } else if (statusFilter === 'inactive') {
      list = list.filter(c => !c.active);
    } else if (statusFilter === 'max_used') {
      list = list.filter(c => c.usage_limit != null && c.used_count >= c.usage_limit);
    }

    // 3. Discount type filter
    if (discountTypeFilter !== 'all') {
      list = list.filter(c => c.discount_type === discountTypeFilter);
    }

    // 4. Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === 'code_asc') {
        return a.code.localeCompare(b.code);
      }
      if (sortBy === 'used_desc') {
        return (b.used_count || 0) - (a.used_count || 0);
      }
      if (sortBy === 'discount_desc') {
        return b.discount_value - a.discount_value;
      }
      if (sortBy === 'expiring_soon') {
        const timeA = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
        const timeB = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
        return timeA - timeB;
      }
      return 0;
    });

    return list;
  }, [coupons, searchQuery, statusFilter, discountTypeFilter, sortBy]);

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('en-US')}`;
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return 'Lifetime (No Expiry)';
    try {
      const date = new Date(isoString);
      const hours = date.getHours();
      const mins = date.getMinutes();
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      // If time is end-of-day (23:59), display clean "End of day"
      if (hours === 23 && (mins === 59 || mins === 0)) {
        return `${formattedDate} (End of day)`;
      }

      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${formattedDate} at ${formattedTime}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121216] border border-[#22222D] p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-serif-brand font-bold text-[#FAF9F5] tracking-wide">
              Promotional Coupons & Vouchers
            </h1>
          </div>
          <p className="text-xs text-[#8E8E9A] mt-1 pl-11">
            Configure percentage and fixed discount vouchers with minimum order criteria and usage bounds.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#181822] hover:bg-[#20202E] border border-[#2A2A38] text-[#FAF9F5] text-xs font-semibold transition-all cursor-pointer shrink-0"
            title="View Supabase SQL Migration Script"
          >
            <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Database SQL</span>
          </button>

          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#181822] hover:bg-[#20202E] border border-[#2A2A38] text-[#FAF9F5] transition-all cursor-pointer shrink-0"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#DFBD4E] text-[#0B0B0C] rounded-xl text-xs font-bold font-serif-brand uppercase tracking-wider transition-all shadow-lg hover:shadow-[#D4AF37]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Missing Schema Warning Banner */}
      {isCouponsTableMissing && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif-brand font-bold text-amber-200">
                Database Notice: 'public.coupons' Table Not Yet in Supabase
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Coupons are currently being preserved safely in your local admin cache. To synchronize them with your live Supabase database, run the prepared SQL Migration script in your Supabase SQL Editor.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
                setCopiedSql(true);
                setTimeout(() => setCopiedSql(false), 2500);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-serif-brand uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy Migration SQL'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252538] text-amber-200 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>View SQL</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#121216] border border-[#22222D] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E9A]">Total Coupons</span>
            <span className="p-2 rounded-xl bg-[#1C1C26] text-[#FAF9F5] border border-[#2A2A38]">
              <Hash className="w-4 h-4 text-[#D4AF37]" />
            </span>
          </div>
          <div className="text-2xl font-serif-brand font-bold text-[#FAF9F5] mt-2">
            {couponStats.total}
          </div>
          <div className="text-[11px] text-[#7A7A8A] mt-1">Configured promo codes</div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#121216] border border-[#22222D] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active & Ready</span>
            <span className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif-brand font-bold text-emerald-300 mt-2">
            {couponStats.active}
          </div>
          <div className="text-[11px] text-[#7A7A8A] mt-1">Applicable at checkout</div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#121216] border border-[#22222D] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">Total Redemptions</span>
            <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif-brand font-bold text-[#D4AF37] mt-2">
            {couponStats.totalRedemptions}
          </div>
          <div className="text-[11px] text-[#7A7A8A] mt-1">Orders with coupon applied</div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#121216] border border-[#22222D] p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0B0]">Expired / Inactive</span>
            <span className="p-2 rounded-xl bg-[#1C1C26] text-[#8E8E9A] border border-[#2A2A38]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-serif-brand font-bold text-[#A0A0B0] mt-2">
            {couponStats.expired + (couponStats.total - couponStats.active - couponStats.expired)}
          </div>
          <div className="text-[11px] text-[#7A7A8A] mt-1">{couponStats.expired} passed expiration date</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121216] border border-[#22222D] p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coupon code (e.g. AEVY10, EID2026)..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] placeholder-[#606070] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A8A] hover:text-[#FAF9F5]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
              <option value="inactive">Disabled / Inactive</option>
              <option value="max_used">Fully Redeemed (Limit Met)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={discountTypeFilter}
              onChange={(e) => setDiscountTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="all">All Discount Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (৳)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="code_asc">Sort: Code (A-Z)</option>
              <option value="used_desc">Sort: Highest Usage</option>
              <option value="discount_desc">Sort: Highest Discount</option>
              <option value="expiring_soon">Sort: Expiring Soonest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#121216] border border-[#22222D] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#202028] bg-[#16161D] text-[#8E8E9A] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 sm:px-5">Coupon Code</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4">Min. Order</th>
                <th className="py-3.5 px-4">Max. Cap</th>
                <th className="py-3.5 px-4">Usage / Limit</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D26] text-xs">
              {processedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-[#707080]">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#D4AF37]" />
                    <p className="text-sm font-semibold text-[#FAF9F5]">
                      {coupons.length === 0 ? 'No promotional coupons created yet.' : 'No coupons matched your filter.'}
                    </p>
                    <p className="text-xs text-[#7A7A8A] mt-1 max-w-sm mx-auto">
                      {coupons.length === 0
                        ? 'Click "Create New Coupon" to generate discount codes for customers to apply at checkout.'
                        : 'Try adjusting your search criteria or changing the status filter.'}
                    </p>
                    {coupons.length === 0 && (
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] text-[#0B0B0C] rounded-xl text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Coupon</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                processedCoupons.map((coupon) => {
                  const now = Date.now();
                  const isExpired = coupon.expires_at && new Date(coupon.expires_at).getTime() < now;
                  const isMaxUsed = coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit;
                  const isLive = coupon.active && !isExpired && !isMaxUsed;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-[#181824] transition-colors group"
                    >
                      {/* Code + Copy Button */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#FAF9F5] px-2.5 py-1 rounded-lg bg-[#1C1C28] border border-[#2D2D3E] tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 rounded text-[#7A7A8A] hover:text-[#D4AF37] hover:bg-[#252534] transition-colors"
                            title="Copy Code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-4 font-semibold text-[#FAF9F5]">
                        {coupon.discount_type === 'percentage' ? (
                          <span className="flex items-center gap-1 text-[#D4AF37]">
                            <Percent className="w-3.5 h-3.5" />
                            <span>{coupon.discount_value}% OFF</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono">
                            <span>{formatCurrency(coupon.discount_value)} FLAT</span>
                          </span>
                        )}
                      </td>

                      {/* Minimum Order */}
                      <td className="py-3.5 px-4 text-[#C0C0CF]">
                        {coupon.minimum_order > 0 ? (
                          <span>{formatCurrency(coupon.minimum_order)}</span>
                        ) : (
                          <span className="text-[#656575] italic">No minimum</span>
                        )}
                      </td>

                      {/* Maximum Discount Cap */}
                      <td className="py-3.5 px-4 text-[#C0C0CF]">
                        {coupon.maximum_discount != null ? (
                          <span>{formatCurrency(coupon.maximum_discount)}</span>
                        ) : (
                          <span className="text-[#656575] italic">No cap</span>
                        )}
                      </td>

                      {/* Usage / Limit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-bold text-[#FAF9F5]">{coupon.used_count}</span>
                          <span className="text-[#707080]">/</span>
                          <span className="text-[#8E8E9A]">
                            {coupon.usage_limit != null ? coupon.usage_limit : '∞'}
                          </span>
                        </div>
                        {coupon.usage_limit != null && (
                          <div className="w-20 bg-[#1F1F2C] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                isMaxUsed ? 'bg-red-500' : 'bg-[#D4AF37]'
                              }`}
                              style={{
                                width: `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[#A0A0B0] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#707080]" />
                          <span className={isExpired ? 'text-red-400 font-semibold' : ''}>
                            {formatDate(coupon.expires_at)}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 border border-red-800/60 text-red-300">
                            <XCircle className="w-3 h-3" />
                            <span>Expired</span>
                          </span>
                        ) : isMaxUsed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>Redeemed</span>
                          </span>
                        ) : coupon.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1F1F2A] border border-[#2D2D3C] text-[#8E8E9A]">
                            <EyeOff className="w-3 h-3" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Active */}
                          <button
                            type="button"
                            onClick={() => toggleCouponActive(coupon.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              coupon.active
                                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50'
                                : 'bg-[#181822] border-[#2A2A38] text-[#7A7A8A] hover:text-[#FAF9F5]'
                            }`}
                            title={coupon.active ? 'Disable coupon' : 'Enable coupon'}
                          >
                            {coupon.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 rounded-lg bg-[#1C1C28] hover:bg-[#252538] border border-[#2C2C3E] text-[#D4AF37] transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setCouponToDelete(coupon)}
                            className="p-1.5 rounded-lg bg-[#1C1C28] hover:bg-red-950/60 border border-[#2C2C3E] hover:border-red-800/60 text-[#8E8E9A] hover:text-red-400 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Sandbox & Diagnostics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sandbox Tester */}
        <div className="bg-[#121216] border border-[#22222D] p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
              <Play className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif-brand font-bold text-sm text-[#FAF9F5]">
                Coupon Validation Simulator
              </h3>
              <p className="text-[11px] text-[#8E8E9A]">
                Test how customer checkout will evaluate and calculate any coupon code in real time.
              </p>
            </div>
          </div>

          <form onSubmit={handleRunValidationTest} className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8E8E9A] uppercase tracking-wider block mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={testCodeInput}
                  onChange={(e) => setTestCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AEVY10"
                  className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E8E9A] uppercase tracking-wider block mb-1">
                  Order Subtotal (৳)
                </label>
                <input
                  type="number"
                  value={testSubtotalInput}
                  onChange={(e) => setTestSubtotalInput(Number(e.target.value))}
                  placeholder="3000"
                  className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isTesting || !testCodeInput.trim()}
              className="w-full py-2.5 bg-[#1C1C28] hover:bg-[#252538] border border-[#2E2E40] text-[#D4AF37] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Checkout Validation</span>
            </button>
          </form>

          {testResult && testResult.tested && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
                testResult.valid
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-red-950/40 border-red-800/60 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {testResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Valid Coupon — Applied Successfully</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300">Validation Rejected</span>
                  </>
                )}
              </div>

              {testResult.valid ? (
                <div className="space-y-1 pt-1 text-emerald-200/90">
                  <div className="flex justify-between">
                    <span>Discount Calculated:</span>
                    <strong className="text-emerald-300 font-mono text-sm">
                      -{formatCurrency(testResult.discount || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Payable Subtotal:</span>
                    <strong className="text-[#FAF9F5] font-mono">
                      {formatCurrency(Math.max(0, testSubtotalInput - (testResult.discount || 0)))}
                    </strong>
                  </div>
                  <div className="text-[11px] opacity-80 pt-1">
                    Rule matched: {testResult.coupon?.discount_type === 'percentage' ? `${testResult.coupon?.discount_value}% discount` : `Flat ${formatCurrency(testResult.coupon?.discount_value || 0)}`}
                    {testResult.coupon?.minimum_order ? ` (Min. ৳${testResult.coupon.minimum_order})` : ''}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-300 pt-1">
                  Reason: {testResult.error || 'The coupon is not valid for this subtotal or is expired.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Security & RLS Guide */}
        <div className="bg-[#121216] border border-[#22222D] p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif-brand font-bold text-sm text-[#FAF9F5]">
                Supabase Row-Level Security Rules
              </h3>
              <p className="text-[11px] text-[#8E8E9A]">
                How coupon data access and server verification are enforced.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-[#A0A0B0] leading-relaxed pt-1">
            <div className="p-3 bg-[#0E0E12] border border-[#242432] rounded-xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#FAF9F5]">Public Checkout Read:</strong> Customers can verify active coupons without seeing internal usage limits or private admin keys.
              </div>
            </div>

            <div className="p-3 bg-[#0E0E12] border border-[#242432] rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#FAF9F5]">Admin Full Management:</strong> Verified admins (`public.profiles.role = 'admin'`) have complete CRUD permissions to create, alter, and delete promo rules.
              </div>
            </div>

            <div className="p-3 bg-[#0E0E12] border border-[#242432] rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#FAF9F5]">Server-Side Verification:</strong> Discounts are computed using the `public.validate_coupon` function to prevent client price tampering.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#14141B] border border-[#2A2A38] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#22222E] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                  <Tag className="w-4 h-4" />
                </span>
                <h2 className="font-serif-brand font-bold text-base text-[#FAF9F5]">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[#7A7A8A] hover:text-[#FAF9F5] p-1.5 rounded-lg hover:bg-[#1E1E2A] transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EID15, LUXURY500"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono uppercase tracking-wider outline-none"
                />
                <span className="text-[10px] text-[#6E6E7E] mt-0.5 block">
                  Letters, numbers, hyphens, and underscores only. Automatically converted to uppercase.
                </span>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as DiscountType)}
                    className="w-full px-3 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount (৳ BDT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                    Discount Value ({formDiscountType === 'percentage' ? '%' : '৳'}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={0.01}
                    max={formDiscountType === 'percentage' ? 100 : undefined}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percentage' ? 'e.g. 15 or 25.5' : 'e.g. 500 or 1250'}
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono outline-none"
                  />
                  <span className="text-[10px] text-[#6E6E7E] mt-0.5 block">
                    {formDiscountType === 'percentage' ? 'Any percentage between 0.01% and 100%.' : 'Any positive fixed amount in ৳ BDT.'}
                  </span>
                </div>
              </div>

              {/* Minimum Order & Maximum Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                    Minimum Order Value (৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={formMinimumOrder}
                    onChange={(e) => setFormMinimumOrder(e.target.value)}
                    placeholder="0 (No minimum)"
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono outline-none"
                  />
                  <span className="text-[10px] text-[#6E6E7E] mt-0.5 block">0 = no minimum required.</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                    Maximum Discount Cap (৳)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min={0.01}
                    value={formMaximumDiscount}
                    onChange={(e) => setFormMaximumDiscount(e.target.value)}
                    placeholder="Optional ceiling limit"
                    disabled={formDiscountType === 'fixed'}
                    className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono outline-none disabled:opacity-40"
                  />
                  <span className="text-[10px] text-[#6E6E7E] mt-0.5 block">
                    {formDiscountType === 'fixed' ? 'Not applicable for fixed discounts.' : 'Ceiling cap for large percentage orders.'}
                  </span>
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="text-xs font-semibold text-[#A0A0B0] block mb-1">
                  Usage Limit (Max Uses)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formUsageLimit}
                  onChange={(e) => setFormUsageLimit(e.target.value)}
                  placeholder="e.g. 50 (Leave blank for unlimited)"
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262634] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] font-mono outline-none"
                />
                <span className="text-[10px] text-[#6E6E7E] mt-0.5 block">Total times this coupon can be redeemed across all customers.</span>
              </div>

              {/* Expiration Date (Required) & Time (Optional) */}
              <div className="p-3.5 bg-[#0E0E12] border border-[#242432] rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-semibold text-[#FAF9F5]">Coupon Expiration Settings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#A0A0B0] block mb-1">
                      Expiry Date * <span className="text-[#D4AF37] text-[10px] font-normal">(Required)</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#14141B] border border-[#2A2A38] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#A0A0B0] block mb-1">
                      Expiry Time <span className="text-[#8E8E9A] text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="time"
                      value={formExpiryTime}
                      onChange={(e) => setFormExpiryTime(e.target.value)}
                      placeholder="23:59"
                      className="w-full px-3 py-2 bg-[#14141B] border border-[#2A2A38] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-[#8E8E9A] leading-relaxed">
                  💡 <strong className="text-[#FAF9F5]">Date is required</strong>. If time is left empty, the coupon will stay valid until <strong className="text-[#D4AF37]">11:59:59 PM (end of day)</strong> of the chosen date.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="p-3.5 bg-[#0E0E12] border border-[#242432] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#FAF9F5] block">Coupon Active</span>
                  <span className="text-[11px] text-[#7A7A8A]">
                    When active, customers can apply this promo code during checkout.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formActive ? 'bg-emerald-600' : 'bg-[#282836]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      formActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#22222E]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl bg-[#1C1C28] hover:bg-[#252538] text-[#FAF9F5] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#DFBD4E] text-[#0B0B0C] text-xs font-bold font-serif-brand uppercase tracking-wider transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#14141B] border border-[#2E2E3C] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-brand font-bold text-base text-[#FAF9F5]">
                  Delete Coupon Confirmation
                </h3>
                <p className="text-xs text-[#8E8E9A]">
                  Permanently remove promo code <strong className="text-red-300 font-mono">{couponToDelete.code}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0E0E12] border border-[#242432] rounded-xl text-xs text-[#A0A0B0] leading-relaxed">
              <p>
                Deleting this coupon will prevent future orders from applying it. Historical completed orders that used this code will remain safe and unaffected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252538] text-[#FAF9F5] text-xs font-semibold cursor-pointer"
              >
                Keep Coupon
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-serif-brand uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE SQL MIGRATION MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-[#2A2A38] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#22222E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-brand font-bold text-base text-[#FAF9F5]">
                    Supabase Database SQL Migration
                  </h3>
                  <p className="text-xs text-[#8E8E9A]">
                    Run this script in your Supabase SQL Editor to create <span className="text-[#D4AF37] font-mono">public.coupons</span>, <span className="text-[#D4AF37] font-mono">public.product_images</span>, and validation functions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1E1E2A] text-[#8E8E9A] hover:text-[#FAF9F5] transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#A0A0B0]">
                <span>How to execute:</span>
                <span className="text-[#D4AF37]">Supabase Dashboard &gt; SQL Editor &gt; New query &gt; Run</span>
              </div>
              <div className="relative">
                <pre className="p-4 bg-[#0A0A0D] border border-[#22222E] rounded-xl text-xs font-mono text-[#D8D8E2] overflow-auto max-h-[50vh] select-all leading-relaxed whitespace-pre">
                  {SUPABASE_MIGRATION_SQL}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#22222E]">
              <span className="text-xs text-[#6B6B7B]">
                Includes RLS security policies, RPC validation &amp; schema cache reload.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1C1C28] hover:bg-[#252538] text-[#FAF9F5] text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#DFBD4E] text-[#0B0B0C] text-xs font-bold font-serif-brand uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                >
                  {copiedSql ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
