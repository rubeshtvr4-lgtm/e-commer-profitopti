import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
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
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { OrderDetailModal } from './OrderDetailModal';
import { CreateOrderModal } from './CreateOrderModal';
import { CreateReturnModal } from '../returns/CreateReturnModal';
import { useToast } from '../../contexts/ToastContext';

export const OrdersListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
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
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

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
      success('Order Status Updated', `Status changed to ${newStatus}.`);
      fetchOrders(pagination.page);
      if (selectedOrder && (selectedOrder.id === orderId || (selectedOrder as any)._id === orderId)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err: any) {
      toastError('Update Failed', err?.message || 'Could not update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Order Management & Unit Economics"
        description="Realized profits calculated on an individual order unit economics basis"
      >
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Order
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E7E9ED] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#737983] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
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
            className="text-xs font-medium px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
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
        <div className="bg-white p-12 rounded-2xl border border-[#E7E9ED] text-center animate-pulse">
          <div className="h-6 bg-[#E7E9ED] rounded w-1/4 mx-auto mb-3" />
          <div className="h-4 bg-[#E7E9ED] rounded w-1/3 mx-auto" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-[#176B57]" />}
          title="No Orders Found"
          description="No orders match your filter criteria. Create a new order or seed realistic demo data."
          actionLabel="Create Order"
          onAction={() => setIsCreateOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9ED]">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      setIsDetailOpen(true);
                    }}
                    className="hover:bg-[#F7F8FA]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#17191C]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-[#737983]">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#17191C]">
                      {ord.customer?.name || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#F1F3F6] text-[#555C68] font-medium text-[11px] border border-[#E7E9ED]">
                        {ord.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#555C68] font-semibold tabular-nums">
                      {ord.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={ord.status} type="order" />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#17191C] tabular-nums">
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
                        className="p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] transition-colors"
                        title="View order economics"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="px-6 py-3.5 bg-[#F7F8FA] border-t border-[#E7E9ED] flex items-center justify-between text-xs text-[#737983]">
            <span>
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Prev
              </Button>
              <span className="font-semibold text-[#17191C]">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
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
        onRecordReturn={(ord) => {
          setReturnOrder(ord);
          setIsReturnOpen(true);
        }}
      />

      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchOrders(1)}
      />

      <CreateReturnModal
        isOpen={isReturnOpen}
        initialOrder={returnOrder}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={() => fetchOrders(pagination.page)}
      />
    </div>
  );
};
