import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ReturnRecord, Pagination } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { CreateReturnModal } from './CreateReturnModal';

export const ReturnsListPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [conditionFilter, setConditionFilter] = useState('all');
  const [recoveryFilter, setRecoveryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReturns = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
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

  const handleUpdateRecovery = async (
    returnId: string,
    newStatus: 'restocked' | 'damaged_written_off' | 'pending_inspection'
  ) => {
    try {
      await api.patch(`/returns/${returnId}`, {
        inventoryRecoveryStatus: newStatus,
        returnedCondition: newStatus === 'restocked' ? 'resalable' : 'damaged',
      });
      fetchReturns(pagination.page);
    } catch (err) {
      console.error('Failed to update return recovery status', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Returns & Reverse Logistics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit refund erosion, reverse courier costs, and physical stock recovery
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Return
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Conditions</option>
          <option value="resalable">Resalable</option>
          <option value="unopened">Unopened</option>
          <option value="damaged">Damaged</option>
        </select>

        <select
          value={recoveryFilter}
          onChange={(e) => setRecoveryFilter(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Restock Decisions</option>
          <option value="restocked">Restocked into Stock</option>
          <option value="damaged_written_off">Written Off / Damaged</option>
          <option value="pending_inspection">Pending Inspection</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mb-4" />
        </div>
      ) : returns.length === 0 ? (
        <EmptyState
          icon={<RotateCcw className="w-10 h-10 text-brand-600" />}
          title="No Returns Recorded"
          description="Your return rate is currently 0%. Record returns to track refund impacts or seed demo data."
          actionLabel="Record Return"
          onAction={() => setIsModalOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Returned Items</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Refund Amount</th>
                  <th className="py-3 px-4 text-right">Reverse Freight</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Inventory Restock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((r) => {
                  const isRestocked = r.inventoryRecoveryStatus === 'restocked';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {r.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(r.returnDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {r.returnedItems.map((i) => `${i.quantity}x ${i.name} (${i.sku})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{r.returnReason}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-red-600">
                        -{formatINR(r.refundAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        {formatINR(r.reverseShippingCost)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`capitalize px-2 py-0.5 rounded font-medium text-[11px] ${
                            r.returnedCondition === 'resalable' || r.returnedCondition === 'unopened'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {r.returnedCondition}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={r.inventoryRecoveryStatus}
                          onChange={(e) => handleUpdateRecovery(r.id, e.target.value as any)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                            isRestocked
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : r.inventoryRecoveryStatus === 'damaged_written_off'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="restocked">✓ Restocked (COGS Credited)</option>
                          <option value="damaged_written_off">✕ Written Off (Cost Lost)</option>
                          <option value="pending_inspection">? Pending Inspection</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchReturns(pagination.page)}
      />
    </div>
  );
};
