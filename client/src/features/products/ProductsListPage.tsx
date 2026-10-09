import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Product, Pagination } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductModal } from './ProductModal';

export const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        category: categoryFilter,
      });

      const res = await api.get<{ products: Product[]; pagination: Pagination }>(
        `/products?${params.toString()}`
      );
      setProducts(res.products || []);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts(pagination.page);
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog & SKU Margins</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit cost economics, target selling prices, and live inventory levels
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Categories</option>
          <option value="Apparel">Apparel</option>
          <option value="Accessories">Accessories</option>
          <option value="Footwear">Footwear</option>
          <option value="Electronics">Electronics</option>
          <option value="Home & Living">Home & Living</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10 text-brand-600" />}
          title="No Products in Catalog"
          description="Create your first product SKU or seed demo products to see margin analysis."
          actionLabel="Add Product"
          onAction={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Unit COGS</th>
                  <th className="py-3 px-4 text-right">Unit Profit</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const profitUnit = p.sellingPrice - p.unitCost;
                  const margin =
                    p.sellingPrice > 0 ? ((profitUnit / p.sellingPrice) * 100).toFixed(1) : '0';
                  const isLowMargin = Number(margin) < 15;
                  const isLowStock = p.stockQuantity <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.SKU}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatINR(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                        {formatINR(p.unitCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                        {formatINR(profitUnit)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            isLowMargin
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            isLowStock
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.stockQuantity} pcs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProducts(pagination.page)}
      />
    </div>
  );
};
