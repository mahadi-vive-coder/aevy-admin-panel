import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  Database,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'coupons' | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const { user, signOut, diagnostics } = useAuth();
  const { isSupabaseLive, refreshData, isLoading, dashboardStats, activeCouponsCount, actionMessage, clearActionMessage } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const navItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package, badge: dashboardStats.lowStockCount > 0 ? dashboardStats.lowStockCount : undefined },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: dashboardStats.newOrders > 0 ? dashboardStats.newOrders : undefined },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'coupons', label: 'Coupons', icon: Tag, badge: activeCouponsCount > 0 ? activeCouponsCount : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'products':
        return 'Product & Inventory Management';
      case 'orders':
        return 'Customer Orders & Dispatch';
      case 'customers':
        return 'Clientele & CRM Profiles';
      case 'coupons':
        return 'Promotions & Coupon Management';
      case 'settings':
        return 'Store Configuration & Database';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#FAF9F5] flex flex-col lg:flex-row antialiased">
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 text-sm animate-in fade-in slide-in-from-top-4 ${
            actionMessage.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : actionMessage.type === 'info'
              ? 'bg-amber-950/90 border-amber-800 text-amber-200'
              : 'bg-[#141E18]/90 border-emerald-700/80 text-emerald-200'
          }`}
        >
          {actionMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : actionMessage.type === 'info' ? (
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{actionMessage.text}</span>
          <button
            onClick={clearActionMessage}
            className="ml-2 text-current opacity-70 hover:opacity-100 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden bg-[#121216] border-b border-[#24242D] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1A22] border border-[#D4AF37]/40 flex items-center justify-center">
            <span className="font-serif-brand font-bold text-xs text-[#D4AF37]">A</span>
          </div>
          <div>
            <div className="font-serif-brand text-sm font-bold tracking-widest text-[#FAF9F5]">AEVY</div>
            <div className="text-[10px] tracking-wider text-[#D4AF37] uppercase font-semibold">Admin Panel</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-[#181820] text-[#A0A0AB] hover:text-[#FAF9F5] border border-[#262632]"
            title="Sync with database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#181820] text-[#FAF9F5] border border-[#262632]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#101014] border-r border-[#202026] flex flex-col justify-between z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Top: Branding */}
        <div>
          <div className="p-6 border-b border-[#1E1E26]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#16161E] border border-[#D4AF37]/40 flex items-center justify-center shadow-inner">
                <span className="font-serif-brand text-lg font-bold text-[#D4AF37]">A</span>
              </div>
              <div>
                <h1 className="font-serif-brand text-lg font-bold tracking-widest text-[#FAF9F5]">
                  AEVY
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                  Admin Portal
                </p>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-[#787886] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Private Management System</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#FAF9F5] border-l-2 border-[#D4AF37] shadow-sm font-semibold'
                      : 'text-[#A0A0B0] hover:text-[#FAF9F5] hover:bg-[#16161E]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-[#7A7A8A]'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        item.id === 'orders'
                          ? 'bg-[#D4AF37] text-[#0B0B0C]'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Supabase Status & Admin Account */}
        <div className="p-4 border-t border-[#1E1E26] space-y-3">
          {/* Supabase Connection Status Card */}
          <div className="p-3 bg-[#15151C] border border-[#22222C] rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[#8E8E9A] text-[11px]">Database Engine</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSupabaseLive
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseLive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {isSupabaseLive ? 'Supabase Live' : 'Local Storage'}
              </span>
            </div>
          </div>

          {/* Admin User Info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#20202A] border border-[#30303E] flex items-center justify-center text-xs font-bold text-[#FAF9F5] shrink-0">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#FAF9F5] truncate">
                  {user?.full_name || 'Admin User'}
                </p>
                <p className="text-[10px] text-[#7A7A8A] truncate">{user?.email}</p>
              </div>
            </div>

            <button
              id="admin-logout-btn"
              onClick={signOut}
              title="Logout"
              className="p-2 text-[#8E8E9A] hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-[#0F0F13]/80 backdrop-blur-md border-b border-[#1E1E26] sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8E8E9A] mb-1">
              <span>AEVY Admin</span>
              <span>/</span>
              <span className="text-[#D4AF37] capitalize">{currentTab}</span>
            </div>
            <h2 className="font-serif-brand text-xl font-bold tracking-wide text-[#FAF9F5]">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync trigger */}
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#171720] hover:bg-[#20202B] border border-[#272734] rounded-lg text-xs text-[#C5A059] transition-all cursor-pointer disabled:opacity-50"
              title="Sync latest records from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4AF37]' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
            </button>

            {/* Admin Role & Session Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#15151C] border border-[#24242E] rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
              <span className="text-xs text-[#E0E0E6] font-medium">
                {user?.email || 'aevy.brand@gmail.com'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded">
                {diagnostics.profileRole || 'admin'}
              </span>
              {diagnostics.authUid && (
                <span className="text-[9px] text-[#8E8E9A] font-mono border-l border-[#2E2E3A] pl-2">
                  UID: {diagnostics.authUid.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
