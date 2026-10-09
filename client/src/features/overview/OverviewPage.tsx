import React, { useState, useEffect } from 'react';
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
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/Button';

export const OverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<StoreFinancialSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<{ lowMarginProducts: any[]; lowStockProducts: any[] }>({
    lowMarginProducts: [],
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

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
      const [overviewRes, trendsRes, ordersRes] = await Promise.all([
        api.get<any>(`/analytics/overview${params}`),
        api.get<any>(`/analytics/trends?days=${dateRange === '7d' ? 7 : 30}`),
        api.get<any>('/orders?limit=6'),
      ]);

      setSummary(overviewRes.summary);
      setAlerts(overviewRes.alerts || { lowMarginProducts: [], lowStockProducts: [] });
      setTrends(trendsRes.trends || []);
      setRecentOrders(ordersRes.orders || []);
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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const isEmpty = !summary || summary.totalOrders === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon={<Sparkles className="w-10 h-10 text-brand-600" />}
        title="Welcome to ProfitPilot"
        description="Your financial dashboard is ready. Add your first order or seed our realistic demo store data to explore live profit calculations, courier costs, and AI insights."
        actionLabel="Go to Orders"
        onAction={() => (window.location.href = '/orders')}
        showSeedDemo={true}
      />
    );
  }

  // Cost breakdown pie chart data
  const costBreakdownData = [
    { name: 'Product COGS', value: summary.totalProductCost, color: '#3b82f6' },
    { name: 'Shipping Paid', value: summary.totalShipping, color: '#f59e0b' },
    { name: 'Ad Spend', value: summary.totalAdvertising, color: '#ec4899' },
    { name: 'Overhead', value: summary.totalOverhead, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Date Filter & Executive Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            True net profit accounting derived directly from verified order line items
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <button
            onClick={() => setDateRange('7d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateRange === '7d'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateRange === '30d'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateRange === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Net Revenue"
          value={formatINR(summary.netRevenue)}
          subtitle={`Gross Sales: ${formatINR(summary.grossMerchandiseSales)}`}
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="blue"
        />

        <StatCard
          title="Net Profit"
          value={formatINR(summary.netProfit)}
          subtitle={`After COGS, Courier, Ads & Overhead`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor={summary.netProfit >= 0 ? 'emerald' : 'red'}
          trend={{
            value: formatPercent(summary.profitMargin),
            isPositive: summary.netProfit >= 0,
          }}
        />

        <StatCard
          title="Profit Margin"
          value={formatPercent(summary.profitMargin)}
          subtitle={summary.profitMargin >= 20 ? 'Healthy Margin (>20%)' : 'Caution: Low Margin'}
          icon={<Layers className="w-5 h-5" />}
          accentColor={summary.profitMargin >= 20 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Orders & Return Rate"
          value={`${formatNumber(summary.totalOrders)} Orders`}
          subtitle={`${summary.returnRatePercent}% Returns (${summary.returnedOrders} items)`}
          icon={<ShoppingCart className="w-5 h-5" />}
          accentColor={summary.returnRatePercent > 12 ? 'amber' : 'slate'}
        />
      </div>

      {/* Secondary Cost Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Product COGS
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatINR(summary.totalProductCost)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Shipping & Courier
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatINR(summary.totalShipping)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ad Spend (CAC)
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {formatINR(summary.totalAdvertising)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
            <Megaphone className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Trends (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue & Profit Trajectory</h3>
              <p className="text-xs text-slate-500">
                Daily comparison of Net Revenue vs Realized Net Profit
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Net Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown Donut Chart (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Expense Composition</h3>
            <p className="text-xs text-slate-500">Proportional breakdown of store outflows</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
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

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {costBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-900">{formatINR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Warnings & Low-Margin Product Alerts */}
      {alerts.lowMarginProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">
                Low Margin Products Detected (&lt; 15% Profit Margin)
              </h4>
              <p className="text-xs text-amber-700 mt-0.5 mb-3">
                These SKUs are at risk of turning negative once customer shipping and advertising
                expenses are factored in:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {alerts.lowMarginProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        SKU: {p.SKU} • Cost: {formatINR(p.unitCost)}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {p.margin}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Orders</h3>
            <p className="text-xs text-slate-500">Live order profit margins</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/orders')}
            icon={<ArrowUpRight className="w-4 h-4" />}
          >
            View All Orders
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Channel</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Net Revenue</th>
                <th className="py-3 px-6 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">
                    {ord.customer?.name || 'Anonymous Customer'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                      {ord.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.status === 'returned'
                          ? 'bg-red-50 text-red-700'
                          : ord.status === 'cancelled'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-semibold text-slate-900">
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
    </div>
  );
};
