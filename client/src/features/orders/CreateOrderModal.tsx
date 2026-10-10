import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Calculator, PackageCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Product } from '../../types';
import { formatINR, formatPercent } from '../../lib/currency';
import { useToast } from '../../contexts/ToastContext';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreated?: () => void;
}

interface OrderItemInput {
  productId?: string;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitSalePrice: number;
  unitCostSnapshot: number;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCreated,
}) => {
  const { success, error: toastError } = useToast();
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [channel, setChannel] = useState<'website' | 'Shopify' | 'Instagram' | 'WhatsApp' | 'marketplace'>('website');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItemInput[]>([
    {
      productId: undefined,
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

  useEffect(() => {
    if (isOpen) {
      setOrderNumber(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
      api.get<{ products: Product[] }>('/products?limit=100').then((res) => {
        setAvailableProducts(res.products || []);
      }).catch(console.error);
    }
  }, [isOpen]);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: undefined,
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

  const updateItem = (idx: number, field: keyof OrderItemInput, val: any) => {
    const next = [...items];
    (next[idx] as any)[field] = val;
    setItems(next);
  };

  const selectCatalogProduct = (idx: number, prodId: string) => {
    if (!prodId) {
      updateItem(idx, 'productId', undefined);
      return;
    }
    const found = availableProducts.find((p) => (p.id || p._id) === prodId);
    if (found) {
      const next = [...items];
      next[idx] = {
        ...next[idx],
        productId: found.id || found._id,
        nameSnapshot: found.name,
        skuSnapshot: found.SKU,
        unitSalePrice: found.sellingPrice,
        unitCostSnapshot: found.unitCost,
      };
      setItems(next);
    }
  };

  // Live Projected Financial Waterfall
  const projectedGrossSales = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitSalePrice) || 0),
    0
  );
  const projectedNetSales = Math.max(0, projectedGrossSales - (Number(discountAmount) || 0));
  const projectedNetRevenue = projectedNetSales + (Number(shippingCharged) || 0);
  const projectedCogs = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCostSnapshot) || 0),
    0
  );
  const projectedDirectCosts = (Number(shippingCost) || 0) + (Number(advertisingCost) || 0);
  const projectedNetProfit = projectedNetRevenue - projectedCogs - projectedDirectCosts;
  const projectedMargin = projectedNetRevenue > 0 ? (projectedNetProfit / projectedNetRevenue) * 100 : 0;

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
          productId: i.productId,
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

      success('Order Recorded', `Order ${orderNumber} created with live unit margins.`);
      if (onSuccess) onSuccess();
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to create order';
      setError(msg);
      toastError('Order Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Order"
      subtitle="Record order with catalog linkage, stock decrement, and unit economics"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Order Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Order Number
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-mono font-bold text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Sales Channel
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              <option value="website">Website Direct</option>
              <option value="Shopify">Shopify Store</option>
              <option value="Instagram">Instagram DM / Post</option>
              <option value="WhatsApp">WhatsApp Commerce</option>
              <option value="marketplace">Amazon / Marketplace</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              <option value="delivered">Delivered</option>
              <option value="shipped">Shipped</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Customer fields */}
        <div className="p-3 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737983] block">
            Customer Information
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
            <input
              type="text"
              placeholder="City / Location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#17191C]">
                Line Items & Unit Economics
              </span>
              <span className="text-[10px] text-[#737983] font-medium">
                (Snapshots unit cost & automatically updates stock)
              </span>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-semibold text-[#176B57] hover:text-[#125645] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          {items.map((item, idx) => {
            const matchedProduct = availableProducts.find((p) => (p.id || p._id) === item.productId);
            return (
              <div
                key={idx}
                className="p-3 border border-[#E7E9ED] rounded-xl bg-white shadow-xs space-y-2"
              >
                {/* Product catalog quick picker */}
                {availableProducts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#737983]">Catalog:</span>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => selectCatalogProduct(idx, e.target.value)}
                      className="text-xs px-2 py-1 border border-[#E7E9ED] rounded-lg bg-[#F7F8FA] text-[#17191C] font-medium flex-1 focus:outline-none focus:border-[#176B57]"
                    >
                      <option value="">— Auto-fill from Catalog SKU —</option>
                      {availableProducts.map((p) => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {p.name} [{p.SKU}] — Price: ₹{p.sellingPrice} | Cost: ₹{p.unitCost} (Stock: {p.stockQuantity})
                        </option>
                      ))}
                    </select>
                    {matchedProduct && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF5F0] text-[#16835D] border border-[#D2ECE1] flex items-center gap-1">
                        <PackageCheck className="w-3 h-3" />
                        In Stock: {matchedProduct.stockQuantity}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <label className="block text-[10px] text-[#737983] font-semibold mb-0.5">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Item Name"
                      value={item.nameSnapshot}
                      onChange={(e) => updateItem(idx, 'nameSnapshot', e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-md text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#737983] font-semibold mb-0.5">SKU Code</label>
                    <input
                      type="text"
                      required
                      placeholder="SKU"
                      value={item.skuSnapshot}
                      onChange={(e) => updateItem(idx, 'skuSnapshot', e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-md text-xs font-mono uppercase text-[#17191C] focus:outline-none focus:border-[#176B57]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#737983] font-semibold mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-md text-xs text-center font-bold text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#737983] font-semibold mb-0.5">Sale Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Price ₹"
                      value={item.unitSalePrice}
                      onChange={(e) => updateItem(idx, 'unitSalePrice', e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-md text-xs text-right font-semibold text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57]"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] text-[#737983] font-semibold mb-0.5">COGS</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Cost"
                      value={item.unitCostSnapshot}
                      onChange={(e) => updateItem(idx, 'unitCostSnapshot', e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#E7E9ED] rounded-md text-xs text-right text-[#737983] tabular-nums focus:outline-none focus:border-[#176B57]"
                    />
                  </div>
                  <div className="col-span-1 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                      className="text-[#737983] hover:text-[#C84B4B] disabled:opacity-20 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Adjustments */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#E7E9ED]">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#737983] mb-1">
              Seller Courier (₹)
            </label>
            <input
              type="number"
              min="0"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#737983] mb-1">
              Customer Shipping (₹)
            </label>
            <input
              type="number"
              min="0"
              value={shippingCharged}
              onChange={(e) => setShippingCharged(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#737983] mb-1">
              Discounts (₹)
            </label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#737983] mb-1">
              Order Ad Spend (₹)
            </label>
            <input
              type="number"
              min="0"
              value={advertisingCost}
              onChange={(e) => setAdvertisingCost(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-[#E7E9ED] rounded-lg text-xs font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>
        </div>

        {/* Live Projected Order P&L Preview */}
        <div className="p-3.5 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#176B57]" />
            <span className="font-bold text-[#17191C]">Projected Economics:</span>
            <span className="text-[#737983] tabular-nums">Rev {formatINR(projectedNetRevenue)}</span>
            <span className="text-[#E7E9ED]">|</span>
            <span className="text-[#737983] tabular-nums">COGS {formatINR(projectedCogs)}</span>
          </div>

          <div className="flex items-center gap-2 font-bold tabular-nums">
            <span className="text-[#737983]">Net Profit:</span>
            <span className={projectedNetProfit >= 0 ? 'text-[#16835D]' : 'text-[#C84B4B]'}>
              {formatINR(projectedNetProfit)} ({formatPercent(projectedMargin)})
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E7E9ED]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Save Order & Compute Margin
          </Button>
        </div>
      </form>
    </Modal>
  );
};
