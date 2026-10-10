import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Package,
  RotateCcw,
  Receipt,
  Layers,
  Truck,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { StatusBadge } from '../../components/common/StatusBadge';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#17191C] font-sans antialiased selection:bg-[#176B57] selection:text-white flex flex-col">
      {/* Top Marketing Navigation */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#E7E9ED] sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#EAF5F0] border border-[#D2ECE1] flex items-center justify-center text-[#176B57] transition-transform group-hover:scale-105">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#17191C] leading-none">
              ProfitPilot
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#176B57] tracking-wider mt-0.5">
              Financial OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Get Started Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-16 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5F0] text-[#176B57] text-xs font-semibold border border-[#D2ECE1] mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Financial OS for E-commerce & D2C Brands</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#17191C] tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Know what you earn. <br className="hidden sm:inline" />
          <span className="text-[#176B57]">Understand what you keep.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#737983] max-w-2xl mx-auto font-medium leading-relaxed">
          Track orders, control expenses, and discover your real product profitability — all in one workspace built for growing e-commerce businesses.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link to="/register">
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Get Started Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Sign In to Store
            </Button>
          </Link>
        </div>

        {/* Security & Isolation Trust Markers */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#737983] font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#16835D]" /> Strict Multi-Tenant Data Isolation
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16835D]" /> Indian Rupee (INR ₹) Paise Precision
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#176B57]" /> Deterministic P&L Engine
          </span>
        </div>
      </section>

      {/* Real UI Interactive Dashboard Preview */}
      <section className="px-4 sm:px-8 max-w-6xl mx-auto w-full pb-20">
        <div className="bg-white rounded-2xl border border-[#E7E9ED] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="px-6 py-3.5 bg-[#F7F8FA] border-b border-[#E7E9ED] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E7E9ED]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E7E9ED]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E7E9ED]" />
              <span className="ml-2 text-xs font-mono text-[#737983]">profitpilot.app/dashboard</span>
            </div>
            <span className="text-[11px] font-semibold text-[#176B57] bg-[#EAF5F0] px-2 py-0.5 rounded-full border border-[#D2ECE1]">
              Live Store Simulation
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value="₹2,48,500.00"
                subtitle="Gross Sales: ₹2,84,000.00"
                icon={<DollarSign className="w-4 h-4" />}
                accentColor="blue"
              />
              <StatCard
                title="Net Profit"
                value="₹68,450.00"
                subtitle="After COGS, Courier & Ad Spend"
                icon={<TrendingUp className="w-4 h-4" />}
                accentColor="emerald"
                trend={{ value: "+27.5%", isPositive: true }}
              />
              <StatCard
                title="Profit Margin"
                value="27.5%"
                subtitle="Healthy Unit Margin (>20%)"
                icon={<Layers className="w-4 h-4" />}
                accentColor="emerald"
              />
              <StatCard
                title="Return Rate"
                value="7.2%"
                subtitle="14 Restocked / 2 Damaged"
                icon={<RotateCcw className="w-4 h-4" />}
                accentColor="slate"
              />
            </div>

            {/* Sample Unit Economics Waterfall Preview */}
            <div className="p-5 bg-[#F7F8FA] rounded-xl border border-[#E7E9ED] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983] block mb-1">
                  Line-Item Financial Audit
                </span>
                <h4 className="text-base font-bold text-[#17191C]">
                  ORD-8492 · Classic Oversized Hoodie (2x)
                </h4>
                <p className="text-xs text-[#737983] mt-1">
                  Sold via Instagram DM · Delivered via Delhivery Express
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <StatusBadge status="delivered" type="order" />
                  <ProfitBadge amount={890} margin={37.1} showBoth />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#555C68]">
                  <span>Gross Order Value</span>
                  <span className="font-semibold text-[#17191C]">₹2,398.00</span>
                </div>
                <div className="flex justify-between text-[#555C68]">
                  <span>Product Manufacturing Cost (COGS)</span>
                  <span className="text-[#C84B4B]">-₹840.00</span>
                </div>
                <div className="flex justify-between text-[#555C68]">
                  <span>Seller Courier Freight</span>
                  <span className="text-[#C84B4B]">-₹140.00</span>
                </div>
                <div className="flex justify-between text-[#555C68]">
                  <span>Attributed Instagram Ad Spend</span>
                  <span className="text-[#C84B4B]">-₹528.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#17191C] border-t border-[#E7E9ED] pt-1.5">
                  <span>Realized Net Cash Profit</span>
                  <span className="text-[#16835D]">₹890.00 (+37.1%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-16 px-6 sm:px-12 max-w-6xl mx-auto w-full border-t border-[#E7E9ED]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#17191C] tracking-tight">
            Engineered for High-Velocity Modern Sellers
          </h2>
          <p className="text-xs sm:text-sm text-[#737983] mt-2 font-medium">
            Stop relying on generic top-line revenue numbers. ProfitPilot reveals what really hits your bank account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E7E9ED] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1] flex items-center justify-center mb-4">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17191C]">Unit Economics Per SKU</h3>
            <p className="text-xs text-[#737983] mt-2 leading-relaxed">
              Track COGS snapshots on every sale, detect low-margin products before discounts eat your capital, and automate margin recalculations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E7E9ED] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-xl bg-[#FEF7EC] text-[#D97706] border border-[#FDEECC] flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17191C]">Returns & Reverse Logistics</h3>
            <p className="text-xs text-[#737983] mt-2 leading-relaxed">
              Audit return freight penalties, distinguish resalable restocked goods from damaged write-offs, and track return rate erosion accurately.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E7E9ED] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-xl bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17191C]">AI Profitability Advisory</h3>
            <p className="text-xs text-[#737983] mt-2 leading-relaxed">
              Gemini AI analyzes store data to proactively highlight margin leakage, spikes in courier freight, and excessive customer acquisition costs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-[#E7E9ED] py-8 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737983]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17191C]">ProfitPilot</span>
            <span>· E-commerce Order & Profit Optimizer</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#17191C] transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[#17191C] transition-colors">
              Create Account
            </Link>
            <span className="text-[#9DA3AE]">Deterministic Financial Accounting</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
