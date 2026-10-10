import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Product, Pagination } from '../../types';
import { formatINR, formatPercent } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { ProfitBadge } from '../../components/common/ProfitBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProductModal } from './ProductModal';
import { useToast } from '../../contexts/ToastContext';

export const ProductsListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
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

  // Modals & confirmation
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;
    try {
      setIsDeleting(true);
      await api.delete(`/products/${deleteProductTarget.id || deleteProductTarget._id}`);
      success('Product Deleted', `Removed ${deleteProductTarget.name} from catalog.`);
      setDeleteProductTarget(null);
      fetchProducts(pagination.page);
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Server error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Product Catalog & SKU Margins"
        description="Monitor unit economics, inventory coverage, and profit margins per SKU"
      >
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
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E7E9ED] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#737983] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57] focus:ring-2 focus:ring-[#176B57]/10"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
          >
            <option value="all">All Categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Accessories">Accessories</option>
            <option value="Footwear">Footwear</option>
            <option value="Electronics">Electronics</option>
            <option value="Home & Living">Home & Living</option>
          </select>
        </div>
      </div>

      {/* Product Catalog Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E7E9ED] text-center animate-pulse">
          <div className="h-6 bg-[#E7E9ED] rounded w-1/4 mx-auto mb-3" />
          <div className="h-4 bg-[#E7E9ED] rounded w-1/3 mx-auto" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-[#176B57]" />}
          title="No Products in Catalog"
          description="Create your first SKU or seed demo store products to inspect unit economics."
          actionLabel="Add Product"
          onAction={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
                <tr>
                  <th className="py-3 px-6">SKU Code</th>
                  <th className="py-3 px-6">Product Title</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6 text-right">Selling Price</th>
                  <th className="py-3 px-6 text-right">Unit Cost (COGS)</th>
                  <th className="py-3 px-6 text-center">Unit Margin</th>
                  <th className="py-3 px-6 text-center">Stock</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9ED]">
                {products.map((p) => {
                  const profit = p.sellingPrice - p.unitCost;
                  const marginPct =
                    p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;
                  const isLowStock = p.stockQuantity <= 5;

                  return (
                    <tr key={p.id || p._id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-bold text-[#17191C]">
                        {p.SKU}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-[#17191C]">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded bg-[#F1F3F6] text-[#555C68] font-medium text-[11px] border border-[#E7E9ED]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-[#17191C] tabular-nums">
                        {formatINR(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-6 text-right text-[#737983] tabular-nums font-medium">
                        {formatINR(p.unitCost)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <ProfitBadge amount={profit} margin={marginPct} showBoth />
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tabular-nums border ${
                            isLowStock
                              ? 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]'
                              : 'bg-[#F7F8FA] text-[#17191C] border-[#E7E9ED]'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-[#D97706]" />}
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsModalOpen(true);
                            }}
                            title="Edit Product"
                            className="p-1.5 text-[#737983] hover:text-[#17191C] rounded-lg hover:bg-[#F1F3F6] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProductTarget(p)}
                            title="Delete Product"
                            className="p-1.5 text-[#737983] hover:text-[#C84B4B] rounded-lg hover:bg-[#FDF2F2] transition-colors"
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

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3.5 bg-[#F7F8FA] border-t border-[#E7E9ED] flex items-center justify-between text-xs text-[#737983]">
              <span>
                Showing page <strong className="text-[#17191C]">{pagination.page}</strong> of{' '}
                <strong className="text-[#17191C]">{pagination.totalPages}</strong> (
                {pagination.total} products)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProducts(pagination.page - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProducts(pagination.page + 1)}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Edit / Create Modal */}
      <ProductModal
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          fetchProducts(pagination.page);
        }}
      />

      {/* Accessible Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product SKU"
        message={`Are you sure you want to delete "${deleteProductTarget?.name}" (${deleteProductTarget?.SKU})? This action cannot be undone.`}
        confirmLabel="Delete SKU"
        loading={isDeleting}
        isDestructive={true}
      />
    </div>
  );
};
