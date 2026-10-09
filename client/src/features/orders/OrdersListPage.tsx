import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Order, Pagination } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { OrderDetailModal } from './OrderDetailModal';
import { CreateOrderModal } from './CreateOrderModal';

export const OrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
        channel: channelFilter,
      });

      const res = await api.get<{ orders: Order[]; pagination: Pagination }>(
        `/orders?${params.toString()}`
      );
      setOrders(res.orders || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, channelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(pagination.page);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Orders & Line Item P&L</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Realized profits calculated on an individual order unit economics basis
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="shipped">Shipped</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="website">Website</option>
            <option value="Shopify">Shopify</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-10 h-10 text-brand-600" />}
          title="No Orders Found"
          description="No orders match your filter criteria. Create a new order or seed demo store data."
          actionLabel="Create Order"
          onAction={() => setIsCreateOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {ord.customer?.name || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {ord.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {ord.items.reduce((s, i) => s + i.quantity, 0)} pcs
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatINR(ord.financials?.netRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ProfitBadge
                        amount={ord.financials?.netProfit}
                        margin={ord.financials?.profitMargin}
                        showBoth
                      />
                    </td>
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="font-semibold text-slate-700">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
        onRecordReturn={() => (window.location.href = '/returns')}
      />

      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchOrders(1)}
      />
    </div>
  );
};
