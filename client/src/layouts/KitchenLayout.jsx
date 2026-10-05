import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, LogOut, LayoutDashboard } from 'lucide-react';

export default function KitchenLayout() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const staffRole = user?.restaurants?.[0]?.role;
  const isKitchenStaff = staffRole === 'KITCHEN';
  const isAdmin = !isKitchenStaff && (staffRole === 'ADMIN' || staffRole === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Kitchen header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">{restaurant?.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">Kitchen Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <a
              href="/admin/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 transition-colors text-sm"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Admin</span>
            </a>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:text-red-400 hover:bg-gray-600 transition-colors text-sm"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
