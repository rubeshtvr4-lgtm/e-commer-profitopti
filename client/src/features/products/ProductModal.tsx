import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types';
import { api } from '../../lib/apiClient';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  const [sellingPrice, setSellingPrice] = useState(999);
  const [unitCost, setUnitCost] = useState(350);
  const [stockQuantity, setStockQuantity] = useState(50);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.SKU);
      setCategory(product.category);
      setSellingPrice(product.sellingPrice);
      setUnitCost(product.unitCost);
      setStockQuantity(product.stockQuantity);
      setActive(product.active);
    } else {
      setName('');
      setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
      setCategory('Apparel');
      setSellingPrice(1199);
      setUnitCost(420);
      setStockQuantity(60);
      setActive(true);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        SKU: sku.toUpperCase(),
        category,
        sellingPrice: Number(sellingPrice),
        unitCost: Number(unitCost),
        stockQuantity: Number(stockQuantity),
        active,
      };

      if (product) {
        await api.patch(`/products/${product.id || product._id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const margin =
    sellingPrice > 0 ? (((sellingPrice - unitCost) / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Inventory SKU'}
      subtitle="Configure selling price and manufacturer unit cost economics"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Product Title
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vintage Heavyweight Tee"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              SKU Code
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="TEE-BLK-01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Category
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Apparel, Footwear, etc."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Selling Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Unit Cost / COGS (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-600"
            />
          </div>
        </div>

        {/* Live Profit Margin Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Projected Margin:</span>{' '}
            <span
              className={`font-bold ${
                Number(margin) >= 25
                  ? 'text-emerald-700'
                  : Number(margin) < 15
                  ? 'text-red-700'
                  : 'text-amber-700'
              }`}
            >
              {margin}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Profit/Unit:</span>{' '}
            <span className="font-bold text-slate-900">₹{(sellingPrice - unitCost).toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Initial Stock Units
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              Active in catalog
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {product ? 'Update SKU' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
