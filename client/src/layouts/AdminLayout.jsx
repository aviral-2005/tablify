import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, UtensilsCrossed, Tag, Table, ShoppingBag, Settings, LogOut, ChefHat, Coffee
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Items' },
  { to: '/admin/categories', icon: Tag, label: 'Categories' },
  { to: '/admin/tables', icon: Table, label: 'Tables & QR' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">Tablify</p>
              <p className="text-sm font-semibold text-gray-900 leading-none truncate max-w-[140px]">
                {restaurant?.name || 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Kitchen link */}
        <div className="p-3 border-t border-gray-100">
          <a
            href="/kitchen"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mb-0.5"
          >
            <ChefHat size={18} />
            Kitchen View
          </a>
          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-brand-700">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{restaurant?.name}</span>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto hide-scrollbar bg-white border-b border-gray-100 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-brand-600' : 'text-gray-500'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
