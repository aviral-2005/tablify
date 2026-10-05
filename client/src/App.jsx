import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Customer pages
import OrderPage from './pages/customer/OrderPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';

// Admin pages
import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminCategories from './pages/admin/AdminCategories';
import AdminTables from './pages/admin/AdminTables';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';

// Kitchen pages
import KitchenLayout from './layouts/KitchenLayout';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';

// Protected route
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Customer routes */}
              <Route path="/order/:slug/:tableNumber" element={<OrderPage />} />
              <Route path="/order/:slug/:tableNumber/confirm" element={<OrderConfirmationPage />} />
              <Route path="/order/:slug/:tableNumber/track/:orderId" element={<OrderTrackingPage />} />

              {/* Auth routes */}
              <Route path="/admin/login" element={<LoginPage />} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="tables" element={<AdminTables />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Kitchen routes */}
              <Route path="/kitchen" element={<ProtectedRoute><KitchenLayout /></ProtectedRoute>}>
                <Route index element={<KitchenDashboard />} />
              </Route>

              {/* Redirect root */}
              <Route path="/" element={<Navigate to="/admin/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <a href="/admin/login" className="btn-primary btn">Go to Admin</a>
      </div>
    </div>
  );
}

export default App;
