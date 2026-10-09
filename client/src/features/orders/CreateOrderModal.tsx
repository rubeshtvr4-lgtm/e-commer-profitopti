import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/apiClient';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [channel, setChannel] = useState<'website' | 'Shopify' | 'Instagram' | 'WhatsApp' | 'marketplace'>('website');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');

  const [items, setItems] = useState([
    {
      nameSnapshot: '',
      skuSnapshot: '',
      quantity: 1,
      unitSalePrice: 999,
      unitCostSnapshot: 350,
    },
  ]);

  const [shippingCost, setShippingCost] = useState(80);
  const [shippingCharged, setShippingCharged] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advertisingCost, setAdvertisingCost] = useState(100);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'shipped' | 'delivered'>('delivered');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        nameSnapshot: '',
        skuSnapshot: '',
        quantity: 1,
        unitSalePrice: 500,
        unitCostSnapshot: 200,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const next = [...items];
    (next[idx] as any)[field] = val;
    setItems(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/orders', {
        orderNumber,
        channel,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          city,
        },
        items: items.map((i) => ({
          ...i,
          skuSnapshot: i.skuSnapshot || `SKU-${Math.floor(100 + Math.random() * 900)}`,
          nameSnapshot: i.nameSnapshot || 'Product Item',
          quantity: Number(i.quantity),
          unitSalePrice: Number(i.unitSalePrice),
          unitCostSnapshot: Number(i.unitCostSnapshot),
        })),
        status,
        shippingCost: Number(shippingCost),
        shippingChargedToCustomer: Number(shippingCharged),
        discountAmount: Number(discountAmount),
        advertisingCost: Number(advertisingCost),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Order"
      subtitle="Record order and snapshot unit cost economics"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Order Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Order Number
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Sales Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="website">Website Direct</option>
              <option value="Shopify">Shopify Store</option>
              <option value="Instagram">Instagram DM / Post</option>
              <option value="WhatsApp">WhatsApp Commerce</option>
              <option value="marketplace">Amazon / Marketplace</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="delivered">Delivered</option>
              <option value="shipped">Shipped</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Customer fields */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Customer Information
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            />
            <input
              type="text"
              placeholder="City / Location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Line Items & Unit Economics
            </span>
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 p-2.5 border border-slate-200 rounded-xl bg-white items-center"
            >
              <div className="col-span-4">
                <input
                  type="text"
                  required
                  placeholder="Item Name"
                  value={item.nameSnapshot}
                  onChange={(e) => updateItem(idx, 'nameSnapshot', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  required
                  placeholder="SKU"
                  value={item.skuSnapshot}
                  onChange={(e) => updateItem(idx, 'skuSnapshot', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono uppercase"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Price ₹"
                  value={item.unitSalePrice}
                  onChange={(e) => updateItem(idx, 'unitSalePrice', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs text-right"
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="COGS ₹"
                  value={item.unitCostSnapshot}
                  onChange={(e) => updateItem(idx, 'unitCostSnapshot', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs text-right text-slate-500"
                />
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Adjustments */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Seller Shipping (₹)
            </label>
            <input
              type="number"
              min="0"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Customer Shipping (₹)
            </label>
            <input
              type="number"
              min="0"
              value={shippingCharged}
              onChange={(e) => setShippingCharged(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Discounts (₹)
            </label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Ad Cost / CAC (₹)
            </label>
            <input
              type="number"
              min="0"
              value={advertisingCost}
              onChange={(e) => setAdvertisingCost(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Order & Calculate Profit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
