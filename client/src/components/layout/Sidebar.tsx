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
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
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

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#17191C]/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E7E9ED] flex flex-col transition-all duration-200 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center border-b border-[#E7E9ED] ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="w-10 h-10 rounded-xl bg-[#EAF5F0] border border-[#D2ECE1] flex items-center justify-center text-[#176B57] hover:bg-[#DDF3EA] hover:border-[#BDE3D3] transition-all group relative"
            >
              <TrendingUp className="w-5 h-5 group-hover:scale-95 transition-transform" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-[#D2ECE1] flex items-center justify-center shadow-xs">
                <ChevronRight className="w-2.5 h-2.5 text-[#176B57]" />
              </span>
            </button>
          ) : (
            <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-lg bg-[#EAF5F0] border border-[#D2ECE1] flex items-center justify-center text-[#176B57] transition-transform group-hover:scale-105 flex-shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-[#17191C] leading-none">
                  ProfitPilot
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#176B57] tracking-wider mt-1">
                  Financial OS
                </span>
              </div>
            </NavLink>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Desktop Collapse Toggle (When expanded) */}
          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              className="hidden lg:flex p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? 'px-2 py-4 space-y-1.5' : 'px-3 py-4 space-y-1'
          }`}
        >
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#737983]">
              Financial Operations
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                title={item.name}
                className={({ isActive }) =>
                  isCollapsed
                    ? `w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-all relative group ${
                        isActive
                          ? 'bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1] shadow-[0_1px_2px_rgba(23,107,87,0.08)]'
                          : 'text-[#555C68] hover:bg-[#F1F3F6] hover:text-[#17191C]'
                      }`
                    : `flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-[13px] font-medium transition-all group ${
                        isActive
                          ? 'bg-[#EAF5F0] text-[#176B57] font-semibold border border-[#D2ECE1]'
                          : 'text-[#555C68] hover:bg-[#F7F8FA] hover:text-[#17191C]'
                      }`
                }
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 transition-colors opacity-90 group-hover:text-[#17191C]" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>

                {/* Badge when collapsed (subtle emerald dot) */}
                {isCollapsed && item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#176B57]" />
                )}

                {/* Badge when expanded */}
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#176B57]/10 text-[#176B57] border border-[#176B57]/20">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Account Footer */}
        <div className="p-3 border-t border-[#E7E9ED] bg-[#FAFAFC]">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <NavLink
                to="/settings"
                onClick={onCloseMobile}
                title={`${user?.businessName || 'Store'} — Settings`}
                className="w-9 h-9 rounded-full bg-[#EAECEF] border border-[#D1D5DB] flex items-center justify-center text-xs font-bold text-[#17191C] hover:ring-2 hover:ring-[#176B57]/30 transition-all"
              >
                {user?.name?.[0]?.toUpperCase() || 'P'}
              </NavLink>
              <button
                onClick={() => logout()}
                title="Log out"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#737983] hover:text-[#C84B4B] hover:bg-[#FDF2F2] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <NavLink
                to="/settings"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-lg hover:bg-[#F1F3F6] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#EAECEF] border border-[#D1D5DB] flex items-center justify-center text-xs font-bold text-[#17191C] flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-[#17191C] truncate">
                    {user?.businessName || 'My Store'}
                  </p>
                  <p className="text-[11px] text-[#737983] truncate">{user?.email}</p>
                </div>
              </NavLink>
              <button
                onClick={() => logout()}
                title="Log out"
                className="p-1.5 text-[#737983] hover:text-[#C84B4B] hover:bg-[#FDF2F2] rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
