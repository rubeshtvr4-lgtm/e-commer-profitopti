import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { Order } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface CreateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialOrder?: Order | null;
}

export const CreateReturnModal: React.FC<CreateReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialOrder,
}) => {
  const { success, error: toastError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItemSku, setSelectedItemSku] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('Size exchange request');
  const [refundAmount, setRefundAmount] = useState(0);
  const [reverseShippingCost, setReverseShippingCost] = useState(90);
  const [returnedCondition, setReturnedCondition] = useState<'resalable' | 'damaged' | 'missing_parts' | 'unopened'>('resalable');
  const [recoveryStatus, setRecoveryStatus] = useState<'pending_inspection' | 'restocked' | 'damaged_written_off'>('restocked');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setSelectedOrderId(initialOrder.id || (initialOrder as any)._id);
        setOrders([initialOrder]);
        if (initialOrder.items.length > 0) {
          const first = initialOrder.items[0];
          setSelectedItemSku(first.skuSnapshot);
          setReturnQuantity(1);
          setRefundAmount(first.unitSalePrice);
        }
      } else {
        api.get<{ orders: Order[] }>('/orders?limit=30').then((res) => {
          const fetchedOrders = res.orders || [];
          setOrders(fetchedOrders);
          if (fetchedOrders.length > 0) {
            const firstOrd = fetchedOrders[0];
            setSelectedOrderId(firstOrd.id || (firstOrd as any)._id);
            if (firstOrd.items.length > 0) {
              setSelectedItemSku(firstOrd.items[0].skuSnapshot);
              setReturnQuantity(1);
              setRefundAmount(firstOrd.items[0].unitSalePrice);
            }
          }
        }).catch(console.error);
      }
    }
  }, [isOpen, initialOrder]);

  const currentOrder = orders.find((o) => (o.id || (o as any)._id) === selectedOrderId) || initialOrder;

  const handleOrderChange = (id: string) => {
    setSelectedOrderId(id);
    const ord = orders.find((o) => (o.id || (o as any)._id) === id);
    if (ord && ord.items.length > 0) {
      setSelectedItemSku(ord.items[0].skuSnapshot);
      setReturnQuantity(1);
      setRefundAmount(ord.items[0].unitSalePrice);
    }
  };

  const handleItemChange = (sku: string) => {
    setSelectedItemSku(sku);
    if (currentOrder) {
      const it = currentOrder.items.find((i) => i.skuSnapshot === sku);
      if (it) {
        setReturnQuantity(1);
        setRefundAmount(it.unitSalePrice);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const ord = currentOrder;
      if (!ord || ord.items.length === 0) {
        throw new Error('Please select a valid order');
      }

      const item = ord.items.find((i) => i.skuSnapshot === selectedItemSku) || ord.items[0];
      await api.post(`/orders/${selectedOrderId}/returns`, {
        orderId: selectedOrderId,
        returnedItems: [
          {
            sku: item.skuSnapshot,
            name: item.nameSnapshot,
            quantity: Number(returnQuantity),
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

      success('Return Logged', `Refund of ₹${refundAmount} recorded for order.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to record return';
      setError(msg);
      toastError('Return Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Return & Restocking"
      subtitle="Track reverse courier logistics, customer refunds, and physical stock inspection"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
            Order Reference
          </label>
          <select
            value={selectedOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            disabled={Boolean(initialOrder)}
            className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
          >
            {orders.map((o) => (
              <option key={o.id || (o as any)._id} value={o.id || (o as any)._id}>
                {o.orderNumber} — {o.customer?.name || 'Customer'} (
                {o.items.map((i) => `${i.quantity}x ${i.nameSnapshot}`).join(', ')})
              </option>
            ))}
          </select>
        </div>

        {currentOrder && currentOrder.items.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl items-center">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Select Item to Return
              </label>
              <select
                value={selectedItemSku}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
              >
                {currentOrder.items.map((it) => (
                  <option key={it.skuSnapshot} value={it.skuSnapshot}>
                    {it.nameSnapshot} [{it.skuSnapshot}] — ₹{it.unitSalePrice} (Ordered: {it.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Return Qty
              </label>
              <input
                type="number"
                min="1"
                max={currentOrder.items.find((i) => i.skuSnapshot === selectedItemSku)?.quantity || 1}
                required
                value={returnQuantity}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  setReturnQuantity(qty);
                  const it = currentOrder.items.find((i) => i.skuSnapshot === selectedItemSku);
                  if (it) setRefundAmount(it.unitSalePrice * qty);
                }}
                className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-lg bg-white font-bold text-center text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57]"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
            Return Reason
          </label>
          <input
            type="text"
            required
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="e.g. Size exchange request, courier transit damage"
            className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Merchandise Refund (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Reverse Courier Fee (₹)
            </label>
            <input
              type="number"
              min="0"
              required
              value={reverseShippingCost}
              onChange={(e) => setReverseShippingCost(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Physical Condition
            </label>
            <select
              value={returnedCondition}
              onChange={(e) => setReturnedCondition(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              <option value="resalable">Resalable / Good</option>
              <option value="unopened">Unopened Box</option>
              <option value="damaged">Damaged Goods</option>
              <option value="missing_parts">Missing Parts</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Restock Decision
            </label>
            <select
              value={recoveryStatus}
              onChange={(e) => setRecoveryStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              <option value="restocked">Restocked into Inventory</option>
              <option value="damaged_written_off">Damaged / Written Off</option>
              <option value="pending_inspection">Pending Inspection</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl text-[11px] text-[#737983] leading-relaxed">
          <strong className="text-[#17191C]">Financial Impact:</strong> Resalable items restocked into inventory automatically credit back inventory asset value on the P&L sheet. Damaged items remain booked as an inventory write-off.
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7E9ED]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Confirm Return
          </Button>
        </div>
      </form>
    </Modal>
  );
};
