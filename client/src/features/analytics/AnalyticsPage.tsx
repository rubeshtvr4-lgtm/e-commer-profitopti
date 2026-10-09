import React, { useState, useEffect } from 'react';
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
import { Download, Sparkles, TrendingUp, Layers } from 'lucide-react';

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
    return <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />;
  }

  // Top products chart data
  const topProductsChartData = productStats.slice(0, 7).map((p) => ({
    name: p.SKU,
    revenue: p.grossRevenue,
    profit: p.netProfit,
    margin: p.profitMargin,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial & SKU Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep-dive profitability attribution across inventory lines, couriers, and overhead
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = '/reports')}
          icon={<Download className="w-4 h-4" />}
        >
          Export Reports
        </Button>
      </div>

      {/* Top 7 Product Profitability Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Top SKU Profitability Breakdown</h3>
          <p className="text-xs text-slate-500">Gross Revenue vs Realized Net Profit by SKU</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProductsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(val: any) => formatINR(Number(val))}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  borderColor: '#e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Gross Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Return Rate & Category Breakdown 2-cols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Operating Overhead Allocation</h3>
            <p className="text-xs text-slate-500">
              Total Recorded Overhead: {formatINR(expenseStats?.totalExpenses || 0)}
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseStats?.categories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {(expenseStats?.categories || []).map((cat: any, idx: number) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 capitalize text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {cat.category}
                </span>
                <span className="font-semibold text-slate-900">{formatINR(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Return Reasons Breakdown */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Return Reasons Attribution</h3>
            <p className="text-xs text-slate-500">
              Total Refunds Paid: {formatINR(returnStats?.totalRefunds || 0)} • Reverse Courier Freight: {formatINR(returnStats?.totalReverseShipping || 0)}
            </p>
          </div>

          <div className="space-y-3 my-auto py-4">
            {Object.entries(returnStats?.byReason || {}).map(([reason, count]: any) => (
              <div key={reason}>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                  <span>{reason}</span>
                  <span>{count} orders</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (count / (returnStats?.totalReturns || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {Object.keys(returnStats?.byReason || {}).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                No returns logged in this period.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex justify-between">
            <span>Inspection Status:</span>
            <span className="font-semibold text-slate-800">
              {returnStats?.byRecoveryStatus?.restocked || 0} Restocked /{' '}
              {returnStats?.byRecoveryStatus?.damaged_written_off || 0} Written Off
            </span>
          </div>
        </div>
      </div>

      {/* Product Profitability Rankings Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Product Profitability League Table</h3>
          <p className="text-xs text-slate-500">Ranked by total realized net profit contribution</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-center">Return Rate</th>
                <th className="py-3 px-4 text-right">Gross Revenue</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Profit Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productStats.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.SKU}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{p.name}</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                    {p.unitsSold} pcs
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.returnRate > 15
                          ? 'bg-red-50 text-red-700 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p.returnRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                    {formatINR(p.grossRevenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                    {formatINR(p.totalCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                    {formatINR(p.netProfit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] ${
                        p.profitMargin >= 25
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.profitMargin < 15
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.profitMargin}%
                    </span>
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
