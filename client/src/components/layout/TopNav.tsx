import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Menu,
  Coins,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

const PAGE_METADATA: Record<string, { title: string; category: string }> = {
  '/': { title: 'Financial Overview', category: 'Executive Dashboard' },
  '/orders': { title: 'Order Management', category: 'Sales & Line Items' },
  '/products': { title: 'Product Catalog', category: 'Inventory & Margins' },
  '/returns': { title: 'Returns & Restocking', category: 'Reverse Logistics' },
  '/shipping': { title: 'Shipping Logistics', category: 'Courier Costs' },
  '/expenses': { title: 'Operating Expenses', category: 'Overhead & Ad Spend' },
  '/analytics': { title: 'Financial Analytics', category: 'Unit Economics' },
  '/ai-insights': { title: 'AI Business Advisory', category: 'Automated Optimization' },
  '/reports': { title: 'Reports & CSV Export', category: 'Financial Statements' },
  '/settings': { title: 'Store Settings', category: 'Preferences & Security' },
};

interface TopNavProps {
  onOpenMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { user, seedDemoData, logout } = useAuth();
  const { success, error } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pageMeta = PAGE_METADATA[location.pathname] || {
    title: 'Dashboard',
    category: 'Platform',
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      success('Demo Store Data Seeded', 'Realistic orders, returns, and expenses loaded.');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      error('Failed to seed demo data', err?.message || 'Server error occurred');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E7E9ED] sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Breadcrumb Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] lg:hidden transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar (click to expand)' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#555C68] hover:text-[#176B57]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-[#555C68] hover:text-[#17191C]" />
            )}
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] text-[#737983] font-medium">
            <span>ProfitPilot</span>
            <ChevronRight className="w-3 h-3 text-[#9DA3AE]" />
            <span className="text-[#176B57] font-semibold">{pageMeta.category}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-[#17191C] tracking-tight leading-tight">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Seed Demo Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          loading={seeding}
          className="text-xs bg-[#EAF5F0] border-[#D2ECE1] text-[#176B57] hover:bg-[#DDF3EA]"
          icon={<Sparkles className="w-3.5 h-3.5 text-[#176B57]" />}
        >
          <span className="hidden sm:inline">Seed Demo Store</span>
          <span className="sm:hidden">Demo</span>
        </Button>

        {/* Currency badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F8FA] text-[#555C68] text-xs font-semibold border border-[#E7E9ED]">
          <Coins className="w-3.5 h-3.5 text-[#176B57]" />
          <span>{user?.currency || 'INR'} (₹)</span>
        </div>

        {/* Multi-tenant isolation verified badge */}
        <div
          title="Protected by Server-Side Multi-Tenant Data Isolation"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF5F0] text-[#176B57] text-xs font-medium border border-[#D2ECE1] select-none"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[11px] font-semibold">Tenant Isolated</span>
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-8 h-8 rounded-full bg-[#17191C] text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-[#176B57]/30 transition-all"
          >
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E7E9ED] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] py-1.5 z-50 animate-fade-in">
                <div className="px-3.5 py-2 border-b border-[#E7E9ED]">
                  <p className="text-xs font-bold text-[#17191C] truncate">{user?.name}</p>
                  <p className="text-[11px] text-[#737983] truncate">{user?.businessName}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#555C68] hover:text-[#17191C] hover:bg-[#F7F8FA] transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Store Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs text-[#C84B4B] hover:bg-[#FDF2F2] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
