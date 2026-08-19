import React from 'react';
import { useData, formatShortOrderNumber } from '../../context/DataContext';
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Sparkles,
  Plus,
  Layers,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { AdminTab } from '../layout/AdminLayout';

interface DashboardViewProps {
  onNavigate: (tab: AdminTab) => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectOrder }) => {
  const { dashboardStats, orders, products, settings } = useData();

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('en-US')}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#D4AF37]/15 text-[#E6CA65] border border-[#D4AF37]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            NEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            CONFIRMED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            PROCESSING
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-950/60 text-red-300 border border-red-850/60">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            CANCELLED
          </span>
        );
    }
  };

  const lowStockProducts = products.filter(
    (p) => p.active && p.stock <= (p.low_stock_threshold || 5)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Store Status */}
      <div className="bg-gradient-to-r from-[#14141A] via-[#121217] to-[#16161E] border border-[#262632] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                AEVY Management Hub
              </span>
            </div>
            <h1 className="font-serif-brand text-2xl font-bold text-[#FAF9F5]">
              Executive Performance Dashboard
            </h1>
            <p className="text-xs text-[#8E8E9A] mt-1">
              Real-time dispatch metrics, sales telemetry, and catalog monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1C24] hover:bg-[#252530] text-[#FAF9F5] border border-[#2E2E3C] rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Add Fragrance</span>
            </button>

            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:brightness-110 text-[#0B0B0C] rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Dispatch Orders ({dashboardStats.newOrders} New)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial & Volume KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-[#121216] border border-[#22222A] p-5 rounded-2xl hover:border-[#D4AF37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#8E8E9A] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-[#1B1B24] text-[#D4AF37]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FAF9F5] font-serif-brand">
            {formatCurrency(dashboardStats.totalSales)}
          </div>
          <div className="mt-2 text-xs text-[#8E8E98] flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">Live</span>
            <span>from verified customer orders</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#121216] border border-[#22222A] p-5 rounded-2xl hover:border-[#D4AF37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#8E8E9A] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-[#1B1B24] text-[#D4AF37]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FAF9F5] font-serif-brand">
            {dashboardStats.totalOrders}
          </div>
          <div className="mt-2 text-xs text-[#8E8E98] flex items-center gap-1.5">
            <span className="text-[#D4AF37] font-semibold">{dashboardStats.newOrders}</span>
            <span>awaiting initial confirmation</span>
          </div>
        </div>

        {/* Products Sold */}
        <div className="bg-[#121216] border border-[#22222A] p-5 rounded-2xl hover:border-[#D4AF37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#8E8E9A] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Flacons Sold</span>
            <div className="p-2 rounded-xl bg-[#1B1B24] text-[#D4AF37]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#FAF9F5] font-serif-brand">
            {dashboardStats.productsSold} <span className="text-sm font-normal text-[#8E8E9A]">units</span>
          </div>
          <div className="mt-2 text-xs text-[#8E8E98]">
            30ml Extrait de Parfum bottles
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#121216] border border-[#22222A] p-5 rounded-2xl hover:border-[#D4AF37]/40 transition-colors">
          <div className="flex items-center justify-between text-[#8E8E9A] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`p-2 rounded-xl ${dashboardStats.lowStockCount > 0 ? 'bg-red-950/50 text-red-400' : 'bg-[#1B1B24] text-[#8E8E9A]'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-serif-brand ${dashboardStats.lowStockCount > 0 ? 'text-red-400' : 'text-[#FAF9F5]'}`}>
            {dashboardStats.lowStockCount} <span className="text-sm font-normal text-[#8E8E9A]">fragrances</span>
          </div>
          <div className="mt-2 text-xs text-[#8E8E98]">
            {dashboardStats.lowStockCount > 0 ? 'Requires atelier inventory restock' : 'All stock levels healthy'}
          </div>
        </div>
      </div>

      {/* Order Status Breakdown Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-brand text-lg font-bold text-[#FAF9F5] flex items-center gap-2">
            <span>Fulfillment Pipeline Status</span>
          </h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* NEW */}
          <div className="bg-[#131318] border border-amber-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
              <span className="font-bold">NEW</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.newOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">Need review</div>
          </div>

          {/* CONFIRMED */}
          <div className="bg-[#131318] border border-blue-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span className="font-bold">CONFIRMED</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.confirmedOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">Phone verified</div>
          </div>

          {/* PROCESSING */}
          <div className="bg-[#131318] border border-purple-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
              <span className="font-bold">PROCESSING</span>
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.processingOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">Packing box</div>
          </div>

          {/* SHIPPED */}
          <div className="bg-[#131318] border border-cyan-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
              <span className="font-bold">SHIPPED</span>
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.shippedOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">In transit</div>
          </div>

          {/* DELIVERED */}
          <div className="bg-[#131318] border border-emerald-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span className="font-bold">DELIVERED</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.deliveredOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">Completed</div>
          </div>

          {/* CANCELLED */}
          <div className="bg-[#131318] border border-red-500/20 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-red-400 mb-1">
              <span className="font-bold">CANCELLED</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold text-[#FAF9F5] mt-1">{dashboardStats.cancelledOrders}</div>
            <div className="text-[10px] text-[#7A7A8A] mt-0.5">Voided</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-[#121216] border border-[#22222A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                Recent Customer Orders
              </h3>
              <p className="text-xs text-[#8E8E98]">
                Real-time incoming orders from customer website
              </p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-[#D4AF37] hover:text-[#FAF9F5] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-[#7A7A88]">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No orders recorded in the system yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="p-4 bg-[#16161D] hover:bg-[#1C1C24] border border-[#24242E] hover:border-[#D4AF37]/50 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1F1F2A] border border-[#2D2D3C] flex items-center justify-center font-mono text-xs font-bold text-[#D4AF37] shrink-0">
                      #{formatShortOrderNumber(order.order_number)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#FAF9F5]">{order.customer_name}</span>
                        <span className="text-xs text-[#7A7A8A]">({order.district})</span>
                      </div>
                      <div className="text-xs text-[#8E8E9A] mt-0.5">
                        {order.items?.map(i => `${i.product_name} (${i.bottle_shape}) x${i.quantity}`).join(', ') || 'Fragrance Extrait'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#24242E]">
                    <div className="text-right">
                      <div className="font-bold text-sm text-[#FAF9F5]">{formatCurrency(order.total)}</div>
                      <div className="text-[10px] text-[#7A7A8A]">{order.payment_method}</div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Fragrances Alerts (1 Column) */}
        <div className="bg-[#121216] border border-[#22222A] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif-brand text-base font-bold text-[#FAF9F5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Inventory Alerts</span>
              </h3>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
              >
                View Catalog
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center bg-[#16161D] rounded-xl border border-[#22222C] p-4">
                <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-[#FAF9F5]">Atelier Stock Optimal</p>
                <p className="text-xs text-[#7A7A88] mt-1">All 30ml flacons exceed minimum safety thresholds.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#171720] border border-red-900/30 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=150&q=80'}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-[#0E0E12] border border-[#2A2A36] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#FAF9F5] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#8E8E98]">{p.bottle_shape} Bottle • {p.size}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-950 text-red-300 border border-red-800">
                        {p.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="mt-6 pt-4 border-t border-[#202028] text-xs text-[#8E8E98] space-y-2">
            <div className="flex items-center justify-between">
              <span>Standard Flacon Size:</span>
              <span className="font-semibold text-[#FAF9F5]">30ml Extrait</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bottle Geometries:</span>
              <span className="font-semibold text-[#FAF9F5]">Round / Square</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active Catalog Size:</span>
              <span className="font-semibold text-[#FAF9F5]">{products.length} Products</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
