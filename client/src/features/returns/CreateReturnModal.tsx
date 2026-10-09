import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { Order } from '../../types';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateReturnModal: React.FC<CreateReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('Size exchange request');
  const [refundAmount, setRefundAmount] = useState(0);
  const [reverseShippingCost, setReverseShippingCost] = useState(90);
  const [returnedCondition, setReturnedCondition] = useState<'resalable' | 'damaged' | 'missing_parts' | 'unopened'>('resalable');
  const [recoveryStatus, setRecoveryStatus] = useState<'pending_inspection' | 'restocked' | 'damaged_written_off'>('restocked');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get<{ orders: Order[] }>('/orders?limit=30').then((res) => {
        setOrders(res.orders || []);
        if (res.orders && res.orders.length > 0) {
          setSelectedOrderId(res.orders[0].id);
          const firstOrd = res.orders[0];
          setRefundAmount(firstOrd.items[0]?.unitSalePrice || 0);
        }
      });
    }
  }, [isOpen]);

  const handleOrderChange = (id: string) => {
    setSelectedOrderId(id);
    const ord = orders.find((o) => o.id === id);
    if (ord && ord.items.length > 0) {
      setRefundAmount(ord.items[0].unitSalePrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ord = orders.find((o) => o.id === selectedOrderId);
      if (!ord || ord.items.length === 0) {
        throw new Error('Please select a valid order');
      }

      const item = ord.items[0];
      await api.post(`/orders/${selectedOrderId}/returns`, {
        orderId: selectedOrderId,
        returnedItems: [
          {
            sku: item.skuSnapshot,
            name: item.nameSnapshot,
            quantity: 1,
            unitCostSnapshot: item.unitCostSnapshot,
          },
        ],
        returnReason,
        refundAmount: Number(refundAmount),
        reverseShippingCost: Number(reverseShippingCost),
        inventoryRecoveryStatus: recoveryStatus,
        returnedCondition,
        status: 'completed',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Order Return & Restocking"
      subtitle="Track reverse logistics, customer refunds, and physical stock inspection"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
            Select Order to Return
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} — {o.customer?.name || 'Customer'} (
                {o.items.map((i) => `${i.quantity}x ${i.nameSnapshot}`).join(', ')})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
            Return Reason
          </label>
          <input
            type="text"
            required
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g. Size didn't fit, transit box crushed"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Merchandise Refund (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Reverse Courier Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={reverseShippingCost}
              onChange={(e) => setReverseShippingCost(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Physical Condition
            </label>
            <select
              value={returnedCondition}
              onChange={(e) => setReturnedCondition(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="resalable">Resalable / Good</option>
              <option value="unopened">Unopened Box</option>
              <option value="damaged">Damaged Goods</option>
              <option value="missing_parts">Missing Parts</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Restock Decision
            </label>
            <select
              value={recoveryStatus}
              onChange={(e) => setRecoveryStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="restocked">Restocked into Inventory</option>
              <option value="damaged_written_off">Damaged / Written Off</option>
              <option value="pending_inspection">Pending Inspection</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
          <strong>Accounting Impact:</strong> If item is restocked in resalable condition, the
          baseline COGS is automatically recovered on the P&L sheet. If written off as damaged, COGS
          remains an inventory loss.
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Confirm Return
          </Button>
        </div>
      </form>
    </Modal>
  );
};
