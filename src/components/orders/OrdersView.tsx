import React, { useState, useMemo } from 'react';
import { useData, formatShortOrderNumber } from '../../context/DataContext';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Save,
  CreditCard,
  User,
  ArrowUpDown,
  X,
  AlertTriangle,
  RefreshCw,
  Eye,
  Ban,
  Tag
} from 'lucide-react';

interface OrdersViewProps {
  initialSelectedOrder?: Order | null;
}

type SortOption = 'newest' | 'oldest' | 'highest_total' | 'lowest_total';

export const OrdersView: React.FC<OrdersViewProps> = ({ initialSelectedOrder }) => {
  const {
    orders,
    updateOrderStatus,
    cancelOrder,
    updateOrderAdminNote,
    isSaving,
    isLoading,
    refreshData
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialSelectedOrder?.id || null
  );

  // Cancel Confirmation Modal State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Sync selected order from fresh orders array
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Admin note local state
  const [adminNoteText, setAdminNoteText] = useState(selectedOrder?.admin_note || '');

  // Update note text when selected order changes
  React.useEffect(() => {
    if (selectedOrder) {
      setAdminNoteText(selectedOrder.admin_note || '');
    }
  }, [selectedOrder?.id, selectedOrder?.admin_note]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setAdminNoteText(order.admin_note || '');
  };

  const handleStatusSelectChange = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    if (newStatus === 'CANCELLED') {
      // Trigger confirmation dialog
      setOrderToCancel(selectedOrder);
      return;
    }
    await updateOrderStatus(selectedOrder.id, newStatus);
  };

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await cancelOrder(orderToCancel.id);
    } finally {
      setIsCancelling(false);
      setOrderToCancel(null);
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedOrder) return;
    await updateOrderAdminNote(selectedOrder.id, adminNoteText);
  };

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('en-US')}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Status visual badge styling adhering to AEVY luxury theme
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/40 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            NEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            CONFIRMED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            PROCESSING
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-red-950/60 text-red-300 border border-red-850/60 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            CANCELLED
          </span>
        );
    }
  };

  const statusTabs: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Orders', count: orders.length },
    { id: 'NEW', label: 'New', count: orders.filter(o => o.status === 'NEW').length },
    { id: 'CONFIRMED', label: 'Confirmed', count: orders.filter(o => o.status === 'CONFIRMED').length },
    { id: 'PROCESSING', label: 'Processing', count: orders.filter(o => o.status === 'PROCESSING').length },
    { id: 'SHIPPED', label: 'Shipped', count: orders.filter(o => o.status === 'SHIPPED').length },
    { id: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.status === 'DELIVERED').length },
    { id: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.status === 'CANCELLED').length },
  ];

  // Filter & Sort Orders
  const processedOrders = useMemo(() => {
    // 1. Filter
    const filtered = orders.filter((o) => {
      const shortNum = formatShortOrderNumber(o.order_number);
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query ||
        shortNum.toLowerCase().includes(query) ||
        o.order_number.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.toLowerCase().includes(query) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(query)) ||
        o.items?.some(i => i.product_name.toLowerCase().includes(query));

      const matchesStatus = selectedStatusTab === 'ALL' || o.status === selectedStatusTab;

      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOption === 'highest_total') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (sortOption === 'lowest_total') {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      return 0;
    });
  }, [orders, searchQuery, selectedStatusTab, sortOption]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Pipeline Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
              Live Supabase Data
            </span>
          </div>
          <h1 className="font-serif-brand text-2xl font-bold text-[#FAF9F5]">
            Order Management & Dispatch
          </h1>
          <p className="text-xs text-[#8E8E9A] mt-0.5">
            Real-time customer orders synchronized directly with Supabase database.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshData()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#16161F] hover:bg-[#1E1E2A] text-[#FAF9F5] border border-[#262634] rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh Orders'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Order Status */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#202028] pb-3 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatusTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedStatusTab === tab.id
                ? 'bg-[#D4AF37] text-[#0B0B0C] shadow-sm font-bold'
                : 'bg-[#15151C] text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#1A1A24] border border-[#242430]'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                selectedStatusTab === tab.id
                  ? 'bg-[#0B0B0C] text-[#D4AF37]'
                  : 'bg-[#22222E] text-[#8E8E9A]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#121216] border border-[#22222A] rounded-2xl p-3.5">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70707D]" />
          <input
            type="text"
            placeholder="Search by Order Number (e.g. 001), Customer Name, Phone (+880...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] placeholder-[#5A5A66] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70707D] hover:text-[#FAF9F5]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sorting Dropdown */}
        <div className="md:col-span-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#8E8E9A] shrink-0 pl-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="w-full px-3 py-2 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_total">Highest Total</option>
            <option value="lowest_total">Lowest Total</option>
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout: Table of Orders & Selected Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Orders Table Container */}
        <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#121216] border border-[#22222A] rounded-2xl overflow-hidden shadow-xl transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#202028] bg-[#16161D] text-[#8E8E9A] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4 sm:px-5">Order Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Product & Qty</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D26] text-xs">
                {processedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-[#707080]">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#D4AF37]" />
                      <p className="text-sm font-semibold text-[#FAF9F5]">
                        {orders.length === 0 ? 'No orders in Supabase database yet.' : 'No orders matched your search/filter.'}
                      </p>
                      <p className="text-xs text-[#7A7A8A] mt-1 max-w-sm mx-auto">
                        {orders.length === 0
                          ? 'Incoming customer checkout orders will automatically populate here via Supabase.'
                          : 'Try changing your search keywords or switching status tabs.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  processedOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const totalQty = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 1;
                    const shortNumber = formatShortOrderNumber(order.order_number);
                    const primaryItem = order.items?.[0];

                    return (
                      <tr
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`hover:bg-[#181822] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1A1A24] border-l-2 border-[#D4AF37]' : ''
                        }`}
                      >
                        {/* 1. Short Order Number (NOT UUID) */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="font-mono font-bold text-xs text-[#D4AF37] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            <span>{shortNumber}</span>
                          </div>
                        </td>

                        {/* 2. Customer Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#FAF9F5] whitespace-nowrap">
                            {order.customer_name}
                          </div>
                          <div className="text-[10px] text-[#7A7A8A] truncate max-w-[120px]">
                            {order.district || 'Bangladesh'}
                          </div>
                        </td>

                        {/* 3. Phone */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[#C5C5D0] text-[11px] whitespace-nowrap">
                            {order.customer_phone}
                          </span>
                        </td>

                        {/* 4. Product & Quantity */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#FAF9F5] truncate max-w-[160px]" title={order.items?.map(i => i.product_name).join(', ')}>
                            {primaryItem?.product_name || 'AEVY Extrait'}
                            {order.items && order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </div>
                          <div className="text-[10px] text-[#8E8E9A]">
                            Qty: <span className="font-bold text-[#FAF9F5]">{totalQty}</span> • {primaryItem?.size || '30ml'} ({primaryItem?.bottle_shape || 'Round'})
                          </div>
                        </td>

                        {/* 5. Total Amount */}
                        <td className="py-3.5 px-4 font-bold text-xs text-[#FAF9F5] whitespace-nowrap">
                          <div>{formatCurrency(order.total)}</div>
                          {order.coupon_code && (
                            <div className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1 mt-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{order.coupon_code}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. Payment Method */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#181822] border border-[#282836] text-[#D0D0DC] whitespace-nowrap">
                            {order.payment_method}
                          </span>
                        </td>

                        {/* 7. Current Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* 8. Order Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#8E8E9A]">
                          {formatDate(order.created_at)}
                        </td>

                        {/* 9. Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOrder(order);
                              }}
                              className="p-1.5 rounded-lg bg-[#1D1D28] hover:bg-[#252534] text-[#FAF9F5] transition-colors"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                            </button>
                            {order.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToCancel(order);
                                }}
                                className="p-1.5 rounded-lg bg-[#221518] hover:bg-[#34181E] text-red-400 transition-colors"
                                title="Cancel Order"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
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

        {/* Selected Order Full Details Panel */}
        {selectedOrder && (
          <div className="lg:col-span-5 bg-[#121216] border border-[#282834] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl animate-in fade-in duration-200 sticky top-4">
            
            {/* Panel Header */}
            <div className="flex items-start justify-between border-b border-[#20202A] pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8E8E9A] font-semibold">
                  Order Details
                </span>
                <div className="font-mono text-xl font-bold text-[#D4AF37] flex items-center gap-2 mt-0.5">
                  <span>Order #{formatShortOrderNumber(selectedOrder.order_number)}</span>
                </div>
                <div className="text-[11px] text-[#7A7A8A] mt-0.5">
                  Placed: {formatDate(selectedOrder.created_at)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="p-1.5 rounded-lg text-[#7A7A8A] hover:text-[#FAF9F5] bg-[#181822] cursor-pointer"
                  title="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Live Updater Dropdown & Cancel Action */}
            <div className="p-4 bg-[#16161F] border border-[#262634] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Update Order Status</span>
                </label>
                <span className="text-[10px] text-[#7A7A8A]">Saves directly to Supabase</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedOrder.status}
                  disabled={isSaving}
                  onChange={(e) => handleStatusSelectChange(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#2D2D3C] focus:border-[#D4AF37] text-xs font-bold text-[#FAF9F5] rounded-xl outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="NEW">NEW (Awaiting review)</option>
                  <option value="CONFIRMED">CONFIRMED (Call verified)</option>
                  <option value="PROCESSING">PROCESSING (Packaging extrait)</option>
                  <option value="SHIPPED">SHIPPED (Handed to courier)</option>
                  <option value="DELIVERED">DELIVERED (Payment collected)</option>
                  <option value="CANCELLED">CANCELLED (Order void)</option>
                </select>

                {selectedOrder.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => setOrderToCancel(selectedOrder)}
                    disabled={isSaving}
                    className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>

              <div className="text-[10px] text-[#7A7A8A] flex items-center justify-between pt-1">
                <span>Last Updated: {formatDate(selectedOrder.updated_at)}</span>
              </div>
            </div>

            {/* 1. CUSTOMER INFORMATION */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0B0] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Customer Information</span>
              </h3>

              <div className="p-4 bg-[#16161E] border border-[#22222D] rounded-xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Customer Name:</span>
                  <span className="font-semibold text-[#FAF9F5]">{selectedOrder.customer_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Phone Number:</span>
                  <a
                    href={`tel:${selectedOrder.customer_phone}`}
                    className="font-mono text-[#D4AF37] hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedOrder.customer_phone}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Email Address:</span>
                  <span className="text-[#FAF9F5]">
                    {selectedOrder.customer_email ? (
                      <a href={`mailto:${selectedOrder.customer_email}`} className="text-[#C0C0D0] hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#8E8E9A]" />
                        <span>{selectedOrder.customer_email}</span>
                      </a>
                    ) : (
                      <span className="text-[#656575] italic">Not provided</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">District:</span>
                  <span className="font-semibold text-[#FAF9F5]">{selectedOrder.district || 'Not specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Thana / Upazila:</span>
                  <span className="text-[#FAF9F5]">{selectedOrder.thana_upazila || 'Not specified'}</span>
                </div>

                <div className="pt-2 border-t border-[#22222E]">
                  <span className="text-[#8E8E9A] flex items-center gap-1 mb-1 font-medium">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    <span>Full Delivery Address:</span>
                  </span>
                  <p className="text-[#FAF9F5] bg-[#0E0E12] p-2.5 rounded-lg leading-relaxed border border-[#22222E]">
                    {selectedOrder.full_address || 'No address provided'}
                  </p>
                </div>

                {selectedOrder.customer_note && (
                  <div className="pt-2 border-t border-[#22222E]">
                    <span className="text-[#8E8E9A] flex items-center gap-1 mb-1 font-medium">
                      <FileText className="w-3 h-3 text-[#D4AF37]" />
                      <span>Customer Note:</span>
                    </span>
                    <p className="text-amber-200/90 bg-[#16130B] p-2.5 rounded-lg leading-relaxed border border-amber-900/40 italic">
                      "{selectedOrder.customer_note}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. ORDER ITEMS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0B0] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Order Items</span>
              </h3>

              <div className="space-y-2">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#16161E] border border-[#22222D] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=150&q=80'}
                          alt={item.product_name}
                          className="w-11 h-11 rounded-lg object-cover bg-[#0E0E12] border border-[#262634] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-serif-brand font-bold text-[#FAF9F5] text-sm">
                            {item.product_name}
                          </div>
                          <div className="text-[11px] text-[#8E8E9A] flex items-center gap-1.5 mt-0.5">
                            <span className="text-[#D4AF37] font-semibold">{item.size || '30ml'}</span>
                            <span>•</span>
                            <span>{item.bottle_shape || 'Round'} Flacon</span>
                            <span>•</span>
                            <span>Qty: <strong className="text-[#FAF9F5]">{item.quantity}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-[#FAF9F5]">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </div>
                        <div className="text-[10px] text-[#7A7A8A]">
                          {formatCurrency(item.unit_price)} each
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#16161E] rounded-xl text-center text-[#7A7A8A] text-xs">
                    No line items recorded for this order.
                  </div>
                )}
              </div>
            </div>

            {/* 3. ORDER SUMMARY */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0B0] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Order Summary & Billing</span>
              </h3>

              <div className="p-4 bg-[#16161E] border border-[#22222D] rounded-xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Subtotal</span>
                  <span className="text-[#FAF9F5] font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Delivery Charge ({selectedOrder.district.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                  <span className="text-[#FAF9F5] font-medium">{formatCurrency(selectedOrder.delivery_charge)}</span>
                </div>

                {Number(selectedOrder.discount || 0) > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <span>Discount</span>
                      {selectedOrder.coupon_code && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 font-mono text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                          {selectedOrder.coupon_code}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold">-{formatCurrency(selectedOrder.discount || 0)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Payment Method</span>
                  <span className="font-bold text-[#D4AF37]">{selectedOrder.payment_method}</span>
                </div>

                <div className="pt-3 border-t border-[#262634] flex items-center justify-between text-sm font-bold">
                  <span className="text-[#FAF9F5]">Total Payable</span>
                  <span className="text-[#D4AF37] font-serif-brand text-lg">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. INTERNAL ADMIN NOTE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A0A0B0] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Internal Admin Note</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveAdminNote}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Note</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
                placeholder="Add courier tracking numbers, customer verification notes, dispatch instructions..."
                className="w-full px-3.5 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] outline-none resize-none leading-relaxed"
              />
            </div>

          </div>
        )}

      </div>

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#14141B] border border-[#2E2E3C] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-brand font-bold text-base text-[#FAF9F5]">
                  Cancel Order Confirmation
                </h3>
                <p className="text-xs text-[#8E8E9A]">
                  Order #{formatShortOrderNumber(orderToCancel.order_number)}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#0E0E12] border border-[#22222E] rounded-xl space-y-2 text-xs">
              <p className="text-[#FAF9F5] leading-relaxed">
                Are you sure you want to cancel <strong className="text-[#D4AF37]">Order #{formatShortOrderNumber(orderToCancel.order_number)}</strong> for <strong>{orderToCancel.customer_name}</strong> ({formatCurrency(orderToCancel.total)})?
              </p>
              <p className="text-[#7A7A8A] text-[11px] leading-relaxed">
                • The order status will be updated to <strong>CANCELLED</strong> in Supabase.<br />
                • The record is preserved for order history and audit purposes.<br />
                • No inventory duplication will occur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={isCancelling}
                className="px-4 py-2.5 bg-[#1C1C26] hover:bg-[#252534] text-[#FAF9F5] border border-[#2E2E3E] rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                KEEP ORDER
              </button>

              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-red-900/30 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>CANCEL ORDER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
