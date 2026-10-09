import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Calendar, Bell, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Executive Profit & Loss Overview',
  '/orders': 'Order Management & Unit Economics',
  '/products': 'Product Catalog & Margin Analysis',
  '/returns': 'Returns & Inventory Restocking',
  '/shipping': 'Courier & Shipping Logistics',
  '/expenses': 'Ad Spend & Operating Overhead',
  '/analytics': 'Performance Analytics & Profit Trends',
  '/ai-insights': 'AI Business Optimization Advisory',
  '/reports': 'Financial & CSV Reports Export',
  '/settings': 'Store Profile & Settings',
};

export const TopNav: React.FC = () => {
  const location = useLocation();
  const { user, seedDemoData } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 font-medium">
          {user?.businessName} • Real-time Deterministic Financials
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Seed Demo Action Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeed}
          loading={seeding}
          className="text-xs bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
          icon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
        >
          {seedSuccess ? 'Data Seeded!' : 'Seed Demo Store Data'}
        </Button>

        {/* Currency indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-mono">CURRENCY</span>
          <span>{user?.currency || 'INR'} (₹)</span>
        </div>

        {/* Multi-tenant isolation verified badge */}
        <div
          title="Protected by Server-Side Multi-Tenant Data Isolation"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200 cursor-default"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden md:inline">Isolated</span>
        </div>
      </div>
    </header>
  );
};
