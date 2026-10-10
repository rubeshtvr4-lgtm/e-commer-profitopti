import React from 'react';
import { Order } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatPercent } from '../../lib/currency';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Package, Truck, Megaphone, Receipt, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, status: string) => void;
  onRecordReturn?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onRecordReturn,
}) => {
  if (!order) return null;

  const f = order.financials;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order.orderNumber}`}
      subtitle={`Placed on ${new Date(order.orderDate).toLocaleDateString('en-IN', {
        dateStyle: 'medium',
      })} via ${order.channel}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Realized Profit Banner */}
        <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E7E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983]">
              Realized Net Profit
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#17191C] tabular-nums">
                {formatINR(f?.netProfit)}
              </span>
              <ProfitBadge margin={f?.profitMargin} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStatusChange && (
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id || (order as any)._id, e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            )}

            {onRecordReturn && order.status !== 'returned' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onRecordReturn(order);
                }}
                className="text-xs bg-[#FDF2F2] border-[#FCE4E4] text-[#C84B4B] hover:bg-[#FCE8E8]"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Record Return
              </Button>
            )}
          </div>
        </div>

        {/* Customer & Channel Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white border border-[#E7E9ED] rounded-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983]">
              Customer
            </span>
            <p className="text-xs font-bold text-[#17191C] mt-1">
              {order.customer?.name || 'Anonymous Customer'}
            </p>
            <p className="text-[11px] text-[#737983]">{order.customer?.city || 'City not specified'}</p>
          </div>

          <div className="p-3.5 bg-white border border-[#E7E9ED] rounded-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983]">
              Channel & Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="capitalize px-2 py-0.5 rounded bg-[#F1F3F6] text-[#555C68] font-medium text-[11px] border border-[#E7E9ED]">
                {order.channel}
              </span>
              <StatusBadge status={order.status} type="order" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#E7E9ED] rounded-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983]">
              Payment Status
            </span>
            <div className="mt-1">
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-[#E7E9ED] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F7F8FA] border-b border-[#E7E9ED] text-[11px] font-bold uppercase tracking-wider text-[#737983]">
            Purchased Line Items
          </div>
          <table className="w-full text-left text-xs">
            <thead className="text-[#737983] border-b border-[#E7E9ED] bg-white">
              <tr>
                <th className="py-2.5 px-4 font-semibold">SKU / Item</th>
                <th className="py-2.5 px-4 text-center font-semibold">Qty</th>
                <th className="py-2.5 px-4 text-right font-semibold">Unit Price</th>
                <th className="py-2.5 px-4 text-right font-semibold">COGS Snapshot</th>
                <th className="py-2.5 px-4 text-right font-semibold">Unit Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E9ED]">
              {order.items.map((it, idx) => {
                const profit = it.unitSalePrice - it.unitCostSnapshot;
                return (
                  <tr key={idx} className="hover:bg-[#F7F8FA]/60">
                    <td className="py-3 px-4 font-medium text-[#17191C]">
                      <span className="font-bold">{it.nameSnapshot}</span>
                      <span className="block text-[11px] text-[#737983] font-mono">
                        {it.skuSnapshot}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums font-semibold">
                      {it.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-[#17191C]">
                      {formatINR(it.unitSalePrice)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[#737983]">
                      {formatINR(it.unitCostSnapshot)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ProfitBadge amount={profit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Unit Economics Direct Costs Waterfall */}
        <div className="p-4 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl space-y-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983] block mb-2">
            Unit Economics Waterfall (Paise Precision)
          </span>

          <div className="flex justify-between text-[#555C68]">
            <span>Gross Merchandise Value</span>
            <span className="font-semibold text-[#17191C] tabular-nums">
              {formatINR(f?.grossMerchandiseSales)}
            </span>
          </div>

          <div className="flex justify-between text-[#555C68]">
            <span>Discounts Applied</span>
            <span className="tabular-nums text-[#C84B4B] font-semibold">
              -{formatINR(order.discountAmount || 0)}
            </span>
          </div>

          <div className="flex justify-between font-semibold text-[#17191C] border-t border-[#E7E9ED] pt-1">
            <span>Net Revenue Recognized</span>
            <span className="tabular-nums">{formatINR(f?.netRevenue)}</span>
          </div>

          <div className="flex justify-between text-[#555C68]">
            <span>Adjusted Product Cost (COGS)</span>
            <span className="tabular-nums text-[#C84B4B]">
              -{formatINR(f?.adjustedProductCost)}
            </span>
          </div>

          <div className="flex justify-between text-[#555C68]">
            <span>Seller-Paid Shipping / Logistics</span>
            <span className="tabular-nums text-[#C84B4B]">
              -{formatINR(order.shippingCost || 0)}
            </span>
          </div>

          <div className="flex justify-between text-[#555C68]">
            <span>Direct Advertising Attribution (CAC)</span>
            <span className="tabular-nums text-[#C84B4B]">
              -{formatINR(order.advertisingCost || 0)}
            </span>
          </div>

          <div className="flex justify-between font-bold text-sm text-[#17191C] border-t-2 border-[#E7E9ED] pt-2">
            <span>Realized Net Profit</span>
            <span className="tabular-nums text-[#16835D]">
              {formatINR(f?.netProfit)}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
