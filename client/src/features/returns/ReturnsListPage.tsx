import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, PackageCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ReturnRecord, Pagination } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CreateReturnModal } from './CreateReturnModal';
import { useToast } from '../../contexts/ToastContext';

export const ReturnsListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [conditionFilter, setConditionFilter] = useState('all');
  const [recoveryFilter, setRecoveryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReturns = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        condition: conditionFilter,
        recoveryStatus: recoveryFilter,
      });

      const res = await api.get<{ returns: ReturnRecord[]; pagination: Pagination }>(
        `/returns?${params.toString()}`
      );
      setReturns(res.returns || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(1);
  }, [conditionFilter, recoveryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns(1);
  };

  const handleUpdateRecovery = async (
    returnId: string,
    newStatus: 'restocked' | 'damaged_written_off' | 'pending_inspection'
  ) => {
    try {
      await api.patch(`/returns/${returnId}`, {
        inventoryRecoveryStatus: newStatus,
        returnedCondition: newStatus === 'restocked' ? 'resalable' : 'damaged',
      });
      success('Return Updated', `Inventory recovery set to ${newStatus.replace(/_/g, ' ')}.`);
      fetchReturns(pagination.page);
    } catch (err: any) {
      toastError('Update Failed', err?.message || 'Could not update recovery status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Returns & Reverse Logistics"
        description="Audit refund erosion, reverse courier costs, and physical stock recovery"
      >
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Return
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E7E9ED] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#737983] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search return reason, SKU, or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
          >
            <option value="all">All Conditions</option>
            <option value="resalable">Resalable</option>
            <option value="unopened">Unopened</option>
            <option value="damaged">Damaged</option>
          </select>

          <select
            value={recoveryFilter}
            onChange={(e) => setRecoveryFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
          >
            <option value="all">All Restock Decisions</option>
            <option value="restocked">Restocked into Stock</option>
            <option value="damaged_written_off">Written Off / Damaged</option>
            <option value="pending_inspection">Pending Inspection</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E7E9ED] text-center animate-pulse">
          <div className="h-6 bg-[#E7E9ED] rounded w-1/4 mx-auto mb-3" />
        </div>
      ) : returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="w-8 h-8 text-[#176B57]" />}
          title="No Returns Recorded"
          description="Your reverse logistics records are clean. Log customer returns to track refund impacts or seed demo data."
          actionLabel="Record Return"
          onAction={() => setIsModalOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
                <tr>
                  <th className="py-3 px-6">Return Date</th>
                  <th className="py-3 px-6">Order Reference</th>
                  <th className="py-3 px-6">Items & Reason</th>
                  <th className="py-3 px-6 text-right">Refund Amount</th>
                  <th className="py-3 px-6 text-right">Reverse Freight</th>
                  <th className="py-3 px-6 text-center">Condition</th>
                  <th className="py-3 px-6 text-right">Inventory Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9ED]">
                {returns.map((ret) => (
                  <tr key={ret.id || (ret as any)._id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#737983]">
                      {new Date(ret.returnDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-[#17191C]">
                      {ret.orderNumber || 'ORD-REF'}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#17191C]">
                        {ret.returnedItems?.map((i) => `${i.name || i.sku} (${i.quantity}x)`).join(', ')}
                      </div>
                      <div className="text-[11px] text-[#737983]">{ret.returnReason}</div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#C84B4B] tabular-nums">
                      -{formatINR(ret.refundAmount)}
                    </td>
                    <td className="py-3.5 px-6 text-right text-[#737983] tabular-nums font-semibold">
                      -{formatINR(ret.reverseShippingCost)}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <StatusBadge status={ret.returnedCondition} type="return" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <select
                        value={ret.inventoryRecoveryStatus}
                        onChange={(e) =>
                          handleUpdateRecovery(
                            ret.id || (ret as any)._id,
                            e.target.value as any
                          )
                        }
                        className="text-xs font-semibold px-2.5 py-1 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
                      >
                        <option value="restocked">Restocked (+Inventory)</option>
                        <option value="damaged_written_off">Damaged (Write Off)</option>
                        <option value="pending_inspection">Pending Inspection</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3.5 bg-[#F7F8FA] border-t border-[#E7E9ED] flex items-center justify-between text-xs text-[#737983]">
              <span>
                Showing {returns.length} of {pagination.total} return records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReturns(pagination.page - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchReturns(pagination.page + 1)}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <CreateReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchReturns(1)}
      />
    </div>
  );
};
