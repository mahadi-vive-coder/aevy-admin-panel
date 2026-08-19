import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Customer, Order } from '../../types';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Calendar,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';

interface CustomersViewProps {
  onSelectOrder?: (order: Order) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onSelectOrder }) => {
  const { customers, orders } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount || 0).toLocaleString('en-US')}`;
  };

  // Build live customer records dynamically from actual orders if customer table is empty or needs aggregation
  const liveCustomerList: Customer[] = useMemo(() => {
    // If we already have stored customers, update them with orders
    const map = new Map<string, Customer>();

    customers.forEach(c => {
      map.set(c.phone, { ...c });
    });

    orders.forEach(order => {
      const existing = map.get(order.customer_phone);
      if (existing) {
        // Update stats
        map.set(order.customer_phone, {
          ...existing,
          total_orders: Math.max(existing.total_orders, orders.filter(o => o.customer_phone === order.customer_phone).length),
          total_spent: orders.filter(o => o.customer_phone === order.customer_phone && o.status !== 'CANCELLED').reduce((acc, o) => acc + o.total, 0),
          last_order_date: order.created_at,
          full_address: order.full_address || existing.full_address,
          district: order.district || existing.district,
          thana_upazila: order.thana_upazila || existing.thana_upazila,
        });
      } else {
        map.set(order.customer_phone, {
          id: `cust-${order.customer_phone.replace(/[^0-9]/g, '')}`,
          name: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email || '—',
          district: order.district,
          thana_upazila: order.thana_upazila,
          full_address: order.full_address,
          total_orders: 1,
          total_spent: order.status !== 'CANCELLED' ? order.total : 0,
          last_order_date: order.created_at,
          created_at: order.created_at,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
  }, [customers, orders]);

  // Customer order history
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => o.customer_phone === selectedCustomer.phone);
  }, [selectedCustomer, orders]);

  // Filtered
  const filteredCustomers = liveCustomerList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="font-serif-brand text-2xl font-bold text-[#FAF9F5]">
          Clientele & Haute Parfumerie CRM
        </h1>
        <p className="text-xs text-[#8E8E9A] mt-1">
          Complete patron relationship records, cumulative spend, order histories, and delivery profiles.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121216] border border-[#22222A] p-4 rounded-xl">
          <div className="text-xs text-[#8E8E9A] font-semibold uppercase tracking-wider mb-1">Total Patrons</div>
          <div className="text-2xl font-bold font-serif-brand text-[#FAF9F5]">{liveCustomerList.length}</div>
        </div>
        <div className="bg-[#121216] border border-[#22222A] p-4 rounded-xl">
          <div className="text-xs text-[#8E8E9A] font-semibold uppercase tracking-wider mb-1">Total Lifetime Orders</div>
          <div className="text-2xl font-bold font-serif-brand text-[#FAF9F5]">{orders.length}</div>
        </div>
        <div className="bg-[#121216] border border-[#22222A] p-4 rounded-xl">
          <div className="text-xs text-[#8E8E9A] font-semibold uppercase tracking-wider mb-1">Average Patron Lifetime Value</div>
          <div className="text-2xl font-bold font-serif-brand text-[#D4AF37]">
            {formatCurrency(
              liveCustomerList.length > 0
                ? Math.round(liveCustomerList.reduce((acc, c) => acc + c.total_spent, 0) / liveCustomerList.length)
                : 0
            )}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-[#121216] border border-[#22222A] rounded-2xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70707D]" />
          <input
            type="text"
            placeholder="Search by Patron Name, Phone, Email, District..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0E0E12] border border-[#262632] focus:border-[#D4AF37] rounded-xl text-xs text-[#FAF9F5] placeholder-[#5A5A66] outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Customers Directory & Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Customer Directory Table (Takes 7 or 12 cols) */}
        <div className={`${selectedCustomer ? 'lg:col-span-7' : 'lg:col-span-12'} bg-[#121216] border border-[#22222A] rounded-2xl overflow-hidden shadow-xl`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#202028] bg-[#16161D] text-[#8E8E9A] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4 sm:px-6">Client Profile</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Last Order</th>
                  <th className="py-3.5 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D26] text-xs">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#707080]">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium text-[#8E8E98]">
                        {searchQuery ? 'No customer profiles matching search query.' : 'No customers yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.phone === cust.phone;
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`hover:bg-[#181822] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1C1C26] border-l-2 border-[#D4AF37]' : ''
                        }`}
                      >
                        {/* Name & Initials */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1C1C26] border border-[#2D2D3C] flex items-center justify-center font-bold text-xs text-[#D4AF37] shrink-0">
                              {cust.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-sm text-[#FAF9F5]">{cust.name}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-[#FAF9F5]">{cust.phone}</div>
                          <div className="text-[10px] text-[#7A7A8A] truncate max-w-[140px]">{cust.email || '—'}</div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#FAF9F5]">{cust.district || 'Dhaka'}</div>
                          <div className="text-[10px] text-[#7A7A8A]">{cust.thana_upazila || ''}</div>
                        </td>

                        {/* Number of Orders */}
                        <td className="py-3.5 px-4 font-bold text-xs text-[#FAF9F5]">
                          <span className="px-2 py-0.5 rounded bg-[#181822] border border-[#262634]">
                            {cust.total_orders} order{cust.total_orders > 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-4 font-bold text-xs text-[#D4AF37]">
                          {formatCurrency(cust.total_spent)}
                        </td>

                        {/* Last Order Date */}
                        <td className="py-3.5 px-4 text-[#8E8E9A]">
                          {cust.last_order_date
                            ? new Date(cust.last_order_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <ChevronRight className="w-4 h-4 text-[#7A7A8A] inline-block" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Details Drawer (5 Cols) */}
        {selectedCustomer && (
          <div className="lg:col-span-5 bg-[#121216] border border-[#282834] rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#20202A] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1A24] border border-[#D4AF37]/40 flex items-center justify-center font-serif-brand font-bold text-lg text-[#D4AF37]">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-serif-brand text-base font-bold text-[#FAF9F5]">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-[11px] text-[#8E8E9A]">Registered AEVY Patron</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-[#7A7A8A] hover:text-[#FAF9F5] bg-[#181822] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#16161F] border border-[#242430] rounded-xl">
                <span className="text-[10px] text-[#8E8E9A] uppercase tracking-wider block mb-1">Total Lifetime Spend</span>
                <span className="font-serif-brand font-bold text-lg text-[#D4AF37]">
                  {formatCurrency(selectedCustomer.total_spent)}
                </span>
              </div>

              <div className="p-3 bg-[#16161F] border border-[#242430] rounded-xl">
                <span className="text-[10px] text-[#8E8E9A] uppercase tracking-wider block mb-1">Orders Placed</span>
                <span className="font-serif-brand font-bold text-lg text-[#FAF9F5]">
                  {customerOrders.length} orders
                </span>
              </div>
            </div>

            {/* Contact & Address Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0B0] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Contact & Shipping Details</span>
              </h3>

              <div className="p-4 bg-[#16161E] border border-[#22222D] rounded-xl text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Phone:</span>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedCustomer.phone}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Email:</span>
                  <span className="text-[#FAF9F5]">{selectedCustomer.email || 'Not provided'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E9A]">Primary District:</span>
                  <span className="font-semibold text-[#FAF9F5]">{selectedCustomer.district}</span>
                </div>

                <div className="pt-2 border-t border-[#242432]">
                  <span className="text-[#8E8E9A] block mb-1">Default Delivery Address:</span>
                  <p className="text-[#FAF9F5] bg-[#0E0E12] p-2.5 rounded-lg border border-[#22222E] leading-relaxed">
                    {selectedCustomer.full_address || 'Address provided at checkout.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0A0B0] flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Order History ({customerOrders.length})</span>
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-[#7A7A8A]">No historic orders registered.</p>
                ) : (
                  customerOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder && onSelectOrder(order)}
                      className="p-3 bg-[#16161E] hover:bg-[#1C1C24] border border-[#22222D] rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D4AF37]">{order.order_number}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#20202C] text-[#FAF9F5] rounded">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#7A7A8A] mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#FAF9F5]">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
