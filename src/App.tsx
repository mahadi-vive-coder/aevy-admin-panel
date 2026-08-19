import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { LoginPage } from './components/auth/LoginPage';
import { AdminLayout, AdminTab } from './components/layout/AdminLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { OrdersView } from './components/orders/OrdersView';
import { CustomersView } from './components/customers/CustomersView';
import { CouponsView } from './components/coupons/CouponsView';
import { SettingsView } from './components/settings/SettingsView';
import { Order } from './types';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Tab State syncing with hash
  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (['dashboard', 'products', 'orders', 'customers', 'coupons', 'settings'].includes(hash)) {
      return hash as AdminTab;
    }
    return 'dashboard';
  });

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Sync hash with currentTab
  useEffect(() => {
    if (user && user.role === 'admin') {
      window.location.hash = `#/${currentTab}`;
    }
  }, [currentTab, user]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['dashboard', 'products', 'orders', 'customers', 'coupons', 'settings'].includes(hash)) {
        setCurrentTab(hash as AdminTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center text-[#FAF9F5]">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mb-4" />
        <p className="font-serif-brand tracking-widest uppercase text-xs text-[#D4AF37]">
          AEVY Security Verification...
        </p>
      </div>
    );
  }

  // If not authenticated or not admin, show dedicated Login Page
  if (!user || user.role !== 'admin') {
    return <LoginPage onSuccessRedirect={() => setCurrentTab('dashboard')} />;
  }

  const handleSelectOrderFromAnywhere = (order: Order) => {
    setSelectedOrderForDetails(order);
    setCurrentTab('orders');
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        if (tab !== 'orders') {
          setSelectedOrderForDetails(null);
        }
      }}
    >
      {currentTab === 'dashboard' && (
        <DashboardView
          onNavigate={(tab) => setCurrentTab(tab)}
          onSelectOrder={handleSelectOrderFromAnywhere}
        />
      )}

      {currentTab === 'products' && <ProductsView />}

      {currentTab === 'orders' && (
        <OrdersView
          key={selectedOrderForDetails?.id || 'orders-view'}
          initialSelectedOrder={selectedOrderForDetails}
        />
      )}

      {currentTab === 'customers' && (
        <CustomersView onSelectOrder={handleSelectOrderFromAnywhere} />
      )}

      {currentTab === 'coupons' && <CouponsView />}

      {currentTab === 'settings' && <SettingsView />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
