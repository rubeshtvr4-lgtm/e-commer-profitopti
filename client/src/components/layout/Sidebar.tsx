import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RotateCcw,
  Truck,
  Receipt,
  BarChart3,
  Sparkles,
  FileSpreadsheet,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Orders', to: '/orders', icon: ShoppingCart },
  { name: 'Products', to: '/products', icon: Package },
  { name: 'Returns', to: '/returns', icon: RotateCcw },
  { name: 'Shipping', to: '/shipping', icon: Truck },
  { name: 'Expenses', to: '/expenses', icon: Receipt },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'AI Insights', to: '/ai-insights', icon: Sparkles, badge: 'AI' },
  { name: 'Reports', to: '/reports', icon: FileSpreadsheet },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
            ProfitPilot
          </span>
          <span className="text-[10px] uppercase font-semibold text-emerald-400 block tracking-wider">
            Profit Optimizer
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Operations & Finance
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 opacity-80" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Seller Account Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.businessName || 'My Store'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
