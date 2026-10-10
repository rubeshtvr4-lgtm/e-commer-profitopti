import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../lib/apiClient';
import { formatINR, formatPercent } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { Download, Sparkles, TrendingUp, Layers, ArrowUpRight } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [productStats, setProductStats] = useState<any[]>([]);
  const [returnStats, setReturnStats] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, retRes, expRes] = await Promise.all([
          api.get<any>('/analytics/products'),
          api.get<any>('/analytics/returns'),
          api.get<any>('/analytics/expenses'),
        ]);
        setProductStats(prodRes.products || []);
        setReturnStats(retRes || null);
        setExpenseStats(expRes || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-[#E7E9ED] rounded-lg w-64" />
        <div className="h-80 bg-white rounded-2xl border border-[#E7E9ED]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-2xl border border-[#E7E9ED]" />
          <div className="h-64 bg-white rounded-2xl border border-[#E7E9ED]" />
        </div>
      </div>
    );
  }

  // Top products chart data
  const topProductsChartData = productStats.slice(0, 7).map((p) => ({
    name: p.SKU,
    revenue: p.grossRevenue,
    profit: p.netProfit,
    margin: p.profitMargin,
  }));

  const COLORS = ['#176B57', '#0284C7', '#D97706', '#7C3AED', '#16835D', '#555C68'];

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Financial & SKU Analytics"
        description="Deep-dive profitability attribution across inventory lines, couriers, and overhead"
      >
        <Link to="/reports">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4 text-[#555C68]" />}
          >
            Export Financial Statements
          </Button>
        </Link>
      </PageHeader>

      {/* Top 7 Product Profitability Chart */}
      <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              Top SKU Profitability Breakdown
            </h3>
            <p className="text-xs text-[#737983]">
              Gross Revenue vs Realized Net Profit contribution per product line
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#555C68]">
              <span className="w-3 h-3 rounded-xs bg-[#176B57]" /> Gross Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[#555C68]">
              <span className="w-3 h-3 rounded-xs bg-[#16835D]" /> Realized Net Profit
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F6" vertical={false} />
              <XAxis dataKey="name" stroke="#9DA3AE" fontSize={11} tickLine={false} />
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
              <Bar dataKey="revenue" name="Gross Revenue" fill="#176B57" radius={[4, 4, 0, 0]} maxBarSize={34} />
              <Bar dataKey="profit" name="Net Profit" fill="#16835D" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Return Rate & Category Breakdown 2-cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              Operating Overhead Allocation
            </h3>
            <p className="text-xs text-[#737983]">
              Total Recorded Overhead: <strong className="text-[#17191C]">{formatINR(expenseStats?.totalExpenses || 0)}</strong>
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseStats?.categories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="category"
                >
                  {(expenseStats?.categories || []).map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatINR(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#E7E9ED] pt-3">
            {(expenseStats?.categories || []).map((cat: any, idx: number) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 capitalize text-[#555C68]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {cat.category}
                </span>
                <span className="font-semibold text-[#17191C] tabular-nums">{formatINR(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Return Reasons Breakdown */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              Return Reasons Attribution
            </h3>
            <p className="text-xs text-[#737983]">
              Refunds: <strong className="text-[#C84B4B]">{formatINR(returnStats?.totalRefunds || 0)}</strong> • Reverse Freight: <strong className="text-[#D97706]">{formatINR(returnStats?.totalReverseShipping || 0)}</strong>
            </p>
          </div>

          <div className="space-y-3.5 my-auto py-4">
            {Object.entries(returnStats?.byReason || {}).map(([reason, count]: any) => (
              <div key={reason}>
                <div className="flex justify-between text-xs font-semibold mb-1 text-[#17191C]">
                  <span>{reason}</span>
                  <span className="text-[#737983]">{count} orders</span>
                </div>
                <div className="w-full h-2 bg-[#F1F3F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#176B57] rounded-full"
                    style={{
                      width: `${Math.min(100, (count / (returnStats?.totalReturns || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(returnStats?.byReason || {}).length === 0 && (
              <p className="text-xs text-[#737983] text-center py-8">
                No returns logged in this period.
              </p>
            )}
          </div>

          <div className="border-t border-[#E7E9ED] pt-3 text-xs text-[#737983] flex justify-between">
            <span>Inspection Status:</span>
            <span className="font-semibold text-[#17191C]">
              {returnStats?.byRecoveryStatus?.restocked || 0} Restocked /{' '}
              {returnStats?.byRecoveryStatus?.damaged_written_off || 0} Written Off
            </span>
          </div>
        </div>
      </div>

      {/* Product Profitability Rankings Table */}
      <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E7E9ED]">
          <h3 className="text-base font-bold text-[#17191C] tracking-tight">
            Product Profitability League Table
          </h3>
          <p className="text-xs text-[#737983]">Ranked by total realized net profit contribution</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
              <tr>
                <th className="py-3 px-6">SKU Code</th>
                <th className="py-3 px-6">Product Title</th>
                <th className="py-3 px-6 text-center">Units Sold</th>
                <th className="py-3 px-6 text-center">Return Rate</th>
                <th className="py-3 px-6 text-right">Gross Revenue</th>
                <th className="py-3 px-6 text-right">Total Cost</th>
                <th className="py-3 px-6 text-right">Net Profit</th>
                <th className="py-3 px-6 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9ED]">
              {productStats.map((p) => (
                <tr key={p.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-[#17191C]">{p.SKU}</td>
                  <td className="py-3.5 px-6 font-semibold text-[#17191C]">{p.name}</td>
                  <td className="py-3.5 px-6 text-center font-semibold text-[#555C68] tabular-nums">
                    {p.unitsSold} pcs
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums border ${
                        p.returnRate > 15
                          ? 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]'
                          : 'bg-[#F7F8FA] text-[#555C68] border-[#E7E9ED]'
                      }`}
                    >
                      {p.returnRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-[#17191C] tabular-nums">
                    {formatINR(p.grossRevenue)}
                  </td>
                  <td className="py-3.5 px-6 text-right text-[#737983] tabular-nums font-medium">
                    {formatINR(p.totalCost)}
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold text-[#16835D] tabular-nums">
                    {formatINR(p.netProfit)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <ProfitBadge margin={p.profitMargin} />
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
