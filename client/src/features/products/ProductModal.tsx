import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types';
import { api } from '../../lib/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { formatINR } from '../../lib/currency';

interface ProductModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSaved?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
  onSaved,
}) => {
  const { success, error: toastError } = useToast();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Apparel');
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
      setCategory(product.category || 'General');
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
        SKU: sku.toUpperCase().trim(),
        category: category.trim(),
        sellingPrice: Number(sellingPrice),
        unitCost: Number(unitCost),
        stockQuantity: Number(stockQuantity),
        active,
      };

      if (product) {
        await api.patch(`/products/${product.id || product._id}`, payload);
        success('Product Updated', `${name} catalog data updated successfully.`);
      } else {
        await api.post('/products', payload);
        success('Product Created', `${name} (${sku}) added to catalog.`);
      }

      if (onSuccess) onSuccess();
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to save product';
      setError(msg);
      toastError('Save Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const profitPerUnit = sellingPrice - unitCost;
  const margin =
    sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product SKU' : 'Add New Inventory SKU'}
      subtitle="Configure target selling price and manufacturer unit cost economics"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#FCE4E4] text-[#C84B4B] text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
            Product Title
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Classic Oversized Hoodie"
            className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              SKU Identifier
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="HOOD-OVR-01"
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-mono uppercase text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Category
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Apparel, Footwear..."
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Selling Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-semibold text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Unit Cost / COGS (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-semibold text-[#737983] tabular-nums focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
            />
          </div>
        </div>

        {/* Live Profit Margin Calculator Preview */}
        <div className="p-3 bg-[#F7F8FA] border border-[#E7E9ED] rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[#737983] font-medium">Estimated Margin:</span>{' '}
            <span
              className={`font-bold ml-1 ${
                Number(margin) >= 20
                  ? 'text-[#16835D]'
                  : Number(margin) < 15
                  ? 'text-[#C84B4B]'
                  : 'text-[#D97706]'
              }`}
            >
              {margin}%
            </span>
          </div>
          <div>
            <span className="text-[#737983] font-medium">Unit Profit:</span>{' '}
            <span className="font-bold text-[#17191C] tabular-nums ml-1">
              {formatINR(profitPerUnit)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Initial Stock Units
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-semibold text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#17191C]">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-[#176B57] rounded border-[#E7E9ED] focus:ring-[#176B57]"
              />
              Active in store catalog
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E7E9ED]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            {product ? 'Update SKU' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
