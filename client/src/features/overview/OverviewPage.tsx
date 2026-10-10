import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Truck,
  Megaphone,
  Layers,
  Sparkles,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Store,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../lib/apiClient';
import { StoreFinancialSummary, Order } from '../../types';
import { formatINR, formatNumber, formatPercent } from '../../lib/currency';
import { StatCard } from '../../components/ui/StatCard';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { CreateOrderModal } from '../orders/CreateOrderModal';
import { ProductModal } from '../products/ProductModal';

export const OverviewPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StoreFinancialSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<{ lowMarginProducts: any[]; lowStockProducts: any[] }>({
    lowMarginProducts: [],
    lowStockProducts: [],
  });
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Quick action modals
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let startDate: string | undefined;
      const now = new Date();
      if (dateRange === '7d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else if (dateRange === '30d') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString();
      }

      const params = startDate ? `?startDate=${startDate}` : '';
      const [overviewRes, trendsRes, ordersRes, aiRes] = await Promise.all([
        api.get<any>(`/analytics/overview${params}`),
        api.get<any>(`/analytics/trends?days=${dateRange === '7d' ? 7 : 30}`),
        api.get<any>('/orders?limit=6'),
        api.post<any>('/ai/insights', {}).catch(() => null),
      ]);

      setSummary(overviewRes.summary);
      setAlerts(overviewRes.alerts || { lowMarginProducts: [], lowStockProducts: [] });
      setTrends(trendsRes.trends || []);
      setRecentOrders(ordersRes.orders || []);
      if (aiRes?.insights) {
        setAiPreview(aiRes.insights);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[#E7E9ED] rounded-lg" />
            <div className="h-4 w-72 bg-[#E7E9ED] rounded-md" />
          </div>
          <div className="h-9 w-52 bg-[#E7E9ED] rounded-lg" />
        </div>

        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-[#FFFFFF] border border-[#E7E9ED] rounded-xl" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#FFFFFF] border border-[#E7E9ED] rounded-2xl" />
          <div className="h-80 bg-[#FFFFFF] border border-[#E7E9ED] rounded-2xl" />
        </div>
      </div>
    );
  }

  const isEmpty = !summary || summary.totalOrders === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Sparkles className="w-8 h-8 text-[#176B57]" />}
        title="Welcome to ProfitPilot"
        description="Your financial command center is initialized. Add your first customer order or seed verified demo store data to experience instant unit economics, courier calculations, and AI profitability audits."
        actionLabel="Create First Order"
        onAction={() => setIsCreateOrderOpen(true)}
        showSeedDemo={true}
      />
    );
  }

  // Cost breakdown pie chart data
  const totalOperatingOutflows =
    summary.totalProductCost +
    summary.totalShipping +
    summary.totalAdvertising +
    summary.totalOverhead;

  const costBreakdownData = [
    { name: 'Product COGS', value: summary.totalProductCost, color: '#176B57' },
    { name: 'Shipping Paid', value: summary.totalShipping, color: '#D97706' },
    { name: 'Ad Spend (CAC)', value: summary.totalAdvertising, color: '#0284C7' },
    { name: 'Overhead & Software', value: summary.totalOverhead, color: '#7C3AED' },
  ].filter((d) => d.value > 0);

  // Channel breakdown calculated from recent orders if available
  const channelCounts = recentOrders.reduce((acc: Record<string, number>, order) => {
    acc[order.channel] = (acc[order.channel] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* 1. Welcome Section & Executive Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#E7E9ED] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#17191C] tracking-tight font-sans">
              {greeting}, {user?.name || 'Seller'}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1]">
              Live Audit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#737983] font-medium mt-1">
            {user?.businessName || 'Store'} · True deterministic net margin derived directly from verified line items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date-Range Selector Pills */}
          <div className="inline-flex p-1 bg-[#F1F3F6] rounded-xl border border-[#E7E9ED]">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateRange === '7d'
                  ? 'bg-white text-[#17191C] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#737983] hover:text-[#17191C]'
              }`}
            >
              Last 7D
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateRange === '30d'
                  ? 'bg-white text-[#17191C] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#737983] hover:text-[#17191C]'
              }`}
            >
              Last 30D
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateRange === 'all'
                  ? 'bg-white text-[#17191C] shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'text-[#737983] hover:text-[#17191C]'
              }`}
            >
              All-Time
            </button>
          </div>

          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddProductOpen(true)}
            icon={<Package className="w-3.5 h-3.5 text-[#555C68]" />}
          >
            Add Product
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOrderOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Order
          </Button>

          <Link to="/reports">
            <Button
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#555C68]" />}
              title="View Financial Reports"
            >
              Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Financial KPI Section (6 Core Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Revenue"
          value={formatINR(summary.netRevenue)}
          subtitle={`Gross: ${formatINR(summary.grossMerchandiseSales)}`}
          icon={<DollarSign className="w-4 h-4" />}
          accentColor="blue"
        />

        <StatCard
          title="Net Profit"
          value={formatINR(summary.netProfit)}
          subtitle="After all direct deductions"
          icon={<TrendingUp className="w-4 h-4" />}
          accentColor={summary.netProfit >= 0 ? 'emerald' : 'red'}
          trend={{
            value: formatPercent(summary.profitMargin),
            isPositive: summary.netProfit >= 0,
          }}
        />

        <StatCard
          title="Profit Margin"
          value={formatPercent(summary.profitMargin)}
          subtitle={summary.profitMargin >= 20 ? 'Healthy (>20%)' : 'Caution: Under 20%'}
          icon={<Layers className="w-4 h-4" />}
          accentColor={summary.profitMargin >= 20 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Total Orders"
          value={formatNumber(summary.totalOrders)}
          subtitle={`${summary.deliveredOrders} delivered`}
          icon={<ShoppingCart className="w-4 h-4" />}
          accentColor="slate"
        />

        <StatCard
          title="Return Rate"
          value={`${summary.returnRatePercent}%`}
          subtitle={`${summary.returnedOrders} items processed`}
          icon={<RotateCcw className="w-4 h-4" />}
          accentColor={summary.returnRatePercent > 12 ? 'amber' : 'slate'}
        />

        <StatCard
          title="Operating Expenses"
          value={formatINR(totalOperatingOutflows)}
          subtitle={`COGS + Courier + Ads`}
          icon={<Receipt className="w-4 h-4" />}
          accentColor="amber"
        />
      </div>

      {/* 3. Secondary Detailed Cost Breakdown Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E7E9ED] rounded-xl p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737983]">
              Product COGS
            </span>
            <p className="text-base font-bold text-[#17191C] tabular-nums mt-0.5">
              {formatINR(summary.totalProductCost)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1]">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E7E9ED] rounded-xl p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737983]">
              Courier Freight & Shipping
            </span>
            <p className="text-base font-bold text-[#17191C] tabular-nums mt-0.5">
              {formatINR(summary.totalShipping)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#FEF7EC] text-[#D97706] border border-[#FDEECC]">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#E7E9ED] rounded-xl p-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737983]">
              Advertising Outflow (CAC)
            </span>
            <p className="text-base font-bold text-[#17191C] tabular-nums mt-0.5">
              {formatINR(summary.totalAdvertising)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]">
            <Megaphone className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trends (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#17191C] tracking-tight">
                Revenue & Profit Trajectory
              </h3>
              <p className="text-xs text-[#737983]">
                Daily timeline comparison of Net Revenue vs Realized Net Profit
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#555C68]">
                <span className="w-3 h-3 rounded-xs bg-[#176B57]" /> Net Revenue
              </span>
              <span className="flex items-center gap-1.5 text-[#555C68]">
                <span className="w-3 h-1 rounded bg-[#16835D]" /> Net Profit
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9DA3AE" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9DA3AE"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#E7E9ED',
                    fontSize: '12px',
                    boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Net Revenue"
                  fill="#176B57"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#16835D"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16835D', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown Donut Chart (1 col) */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              Expense Composition
            </h3>
            <p className="text-xs text-[#737983]">
              Proportional distribution of store outflows
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatINR(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E7E9ED] text-xs">
            {costBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#555C68]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-[#17191C] tabular-nums">
                  {formatINR(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. AI Business Insights Command Panel */}
      {aiPreview && aiPreview.recommendations && aiPreview.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-[#EAF5F0]/60 to-white border border-[#D2ECE1] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#17191C] tracking-tight">
                  Gemini AI Financial Recommendations
                </h4>
                <p className="text-xs text-[#737983]">
                  Automated audit detected actionable optimization opportunities
                </p>
              </div>
            </div>

            <Link to="/ai-insights">
              <Button
                variant="outline"
                size="xs"
                className="text-xs bg-white border-[#D2ECE1] text-[#176B57] hover:bg-[#EAF5F0]"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Full Advisory
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {aiPreview.recommendations.slice(0, 2).map((rec: any) => (
              <div
                key={rec.id}
                className="bg-white border border-[#E7E9ED] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        rec.type === 'danger'
                          ? 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]'
                          : rec.type === 'warning'
                          ? 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]'
                          : 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]'
                      }`}
                    >
                      {rec.type}
                    </span>
                    {rec.metricImpact && (
                      <span className="text-[11px] font-bold text-[#17191C] tabular-nums">
                        {rec.metricImpact}
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold text-[#17191C]">{rec.title}</h5>
                  <p className="text-[11px] text-[#737983] mt-1 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#E7E9ED] text-[11px] font-medium text-[#176B57]">
                  → {rec.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Critical Warnings Banner (Low Margin Products) */}
      {alerts.lowMarginProducts.length > 0 && (
        <div className="bg-[#FEF7EC]/60 border border-[#FDEECC] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#17191C]">
                Low Margin Products Detected (&lt; 15% Profit Margin)
              </h4>
              <p className="text-xs text-[#737983] mt-0.5 mb-3">
                These catalog SKUs risk net negative profitability after customer shipping and return allowances:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {alerts.lowMarginProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3 rounded-xl border border-[#E7E9ED] shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#17191C] truncate max-w-[140px]">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-[#737983] font-mono">
                        {p.SKU} • Cost: {formatINR(p.unitCost)}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FEF7EC] text-[#D97706] border border-[#FDEECC]">
                      {p.margin}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Recent Orders Activity Section */}
      <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E9ED] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">Recent Orders</h3>
            <p className="text-xs text-[#737983]">Real-time order unit profit calculations</p>
          </div>
          <Link to="/orders">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              View All Orders
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
              <tr>
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Net Revenue</th>
                <th className="py-3 px-6 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9ED]">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-[#17191C]">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-[#17191C]">
                    {ord.customer?.name || 'Anonymous Customer'}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="capitalize px-2 py-0.5 rounded bg-[#F1F3F6] font-medium text-[11px] text-[#555C68] border border-[#E7E9ED]">
                      {ord.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <StatusBadge status={ord.status} type="order" />
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-[#17191C] tabular-nums">
                    {formatINR(ord.financials?.netRevenue)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <ProfitBadge
                      amount={ord.financials?.netProfit}
                      margin={ord.financials?.profitMargin}
                      showBoth
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals for Quick Actions */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        onCreated={() => {
          setIsCreateOrderOpen(false);
          fetchDashboardData();
        }}
      />

      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSaved={() => {
          setIsAddProductOpen(false);
          fetchDashboardData();
        }}
      />
    </div>
  );
};
