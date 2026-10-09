import React from 'react';
import { Order } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatPercent } from '../../lib/currency';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { Package, Truck, Megaphone, Receipt, RotateCcw } from 'lucide-react';

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
        {/* Profit Hero Bar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Realized Net Profit
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">
                {formatINR(f?.netProfit)}
              </span>
              <ProfitBadge margin={f?.profitMargin} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onStatusChange && (
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
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
              <button
                onClick={() => {
                  onClose();
                  onRecordReturn(order);
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return
              </button>
            )}
          </div>
        </div>

        {/* Customer Information */}
        {order.customer && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Customer Information
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400">Name:</span>{' '}
                <span className="font-semibold text-slate-900">{order.customer.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span> {order.customer.email || 'N/A'}
              </div>
              <div>
                <span className="text-slate-400">Phone:</span> {order.customer.phone || 'N/A'}
              </div>
              <div>
                <span className="text-slate-400">Location:</span>{' '}
                {[order.customer.city, order.customer.state].filter(Boolean).join(', ') || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Order Line Items */}
        <div>
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block mb-2">
            Items & Cost of Goods Sold (COGS)
          </span>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Sale Price</th>
                  <th className="py-2.5 px-3 text-right">Unit COGS</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const grossItemRev = item.quantity * item.unitSalePrice;
                  const itemCost = item.quantity * item.unitCostSnapshot;
                  const itemProfit = grossItemRev - itemCost;
                  return (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900">{item.nameSnapshot}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.skuSnapshot}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900">
                        {formatINR(item.unitSalePrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatINR(item.unitCostSnapshot)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        {formatINR(itemProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accounting Waterfall Breakdown */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Financial Calculation Waterfall
          </span>

          <div className="flex justify-between text-slate-600">
            <span>Gross Merchandise Sales</span>
            <span className="font-medium text-slate-900">{formatINR(f?.grossMerchandiseSales)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>- Discounts Applied</span>
            <span className="font-medium text-red-600">
              -{formatINR(order.discountAmount)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>+ Customer Shipping Charged</span>
            <span className="font-medium text-slate-900">
              +{formatINR(order.shippingChargedToCustomer)}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
            <span>Net Revenue</span>
            <span>{formatINR(f?.netRevenue)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>- Product COGS (Adjusted)</span>
            <span className="font-medium text-red-600">
              -{formatINR(f?.adjustedProductCost)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>- Seller Shipping Paid (Forward)</span>
            <span className="font-medium text-red-600">
              -{formatINR(order.shippingCost)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>- Attributed Advertising Cost</span>
            <span className="font-medium text-red-600">
              -{formatINR(order.advertisingCost)}
            </span>
          </div>

          <div className="border-t-2 border-slate-300 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
            <span>Net Profit</span>
            <span className={f && f.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}>
              {formatINR(f?.netProfit)} ({f?.profitMargin}%)
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
