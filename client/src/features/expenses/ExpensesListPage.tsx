import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Megaphone, Box, Laptop, Wrench, CreditCard } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ExpenseRecord } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';

export const ExpensesListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<any>('advertising');
  const [amount, setAmount] = useState(1500);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete confirm
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = categoryFilter !== 'all' ? `?category=${categoryFilter}` : '';
      const res = await api.get<{ expenses: ExpenseRecord[] }>(`/expenses${params}`);
      setExpenses(res.expenses || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/expenses', {
        category,
        amount: Number(amount),
        description,
        date,
      });
      success('Expense Recorded', `Logged ${category} expense of ₹${amount}.`);
      setIsModalOpen(false);
      setDescription('');
      fetchExpenses();
    } catch (err: any) {
      toastError('Save Failed', err?.message || 'Could not record expense');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteExpenseId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/expenses/${deleteExpenseId}`);
      success('Expense Removed', 'Deleted expense entry.');
      setDeleteExpenseId(null);
      fetchExpenses();
    } catch (err: any) {
      toastError('Delete Failed', err?.message || 'Failed to remove expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'advertising':
        return 'bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]';
      case 'packaging':
        return 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]';
      case 'software':
        return 'bg-[#F6F3FB] text-[#7C3AED] border-[#EDE7F9]';
      case 'operations':
      case 'shipping':
        return 'bg-[#EAF5F0] text-[#176B57] border-[#D2ECE1]';
      default:
        return 'bg-[#F1F3F6] text-[#555C68] border-[#E7E9ED]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Operating Expenses & Overhead"
        description="Log marketing ad spend (CAC), packaging supplies, SaaS software, and operations overhead"
      >
        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E7E9ED] text-xs font-bold text-[#17191C] tabular-nums shadow-xs">
            Total Outflow: <span className="text-[#C84B4B]">{formatINR(totalExpense)}</span>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </PageHeader>

      {/* Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E7E9ED] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
        >
          <option value="all">All Expense Categories</option>
          <option value="advertising">Advertising / CAC</option>
          <option value="packaging">Packaging Materials</option>
          <option value="software">Software & SaaS</option>
          <option value="operations">Warehouse & Operations</option>
          <option value="salaries">Salaries & Labor</option>
          <option value="shipping">General Courier Freight</option>
          <option value="other">Other Overhead</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E7E9ED] animate-pulse h-48" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-[#176B57]" />}
          title="No Expenses Recorded"
          description="Track your advertising and operating overhead so your bottom-line profit margins are 100% accurate."
          actionLabel="Record Expense"
          onAction={() => setIsModalOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Order Linkage</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9ED]">
                {expenses.map((e) => (
                  <tr key={e.id || (e as any)._id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3.5 px-6 text-[#737983]">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`capitalize px-2.5 py-0.5 rounded-md font-semibold text-[11px] border ${getCategoryBadgeClass(
                          e.category
                        )}`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-[#17191C]">
                      {e.description || 'Operating overhead entry'}
                    </td>
                    <td className="py-3.5 px-6 text-[#737983] font-mono text-[11px]">
                      {e.orderNumber || '—'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#17191C] tabular-nums">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setDeleteExpenseId(e.id || (e as any)._id)}
                        className="p-1.5 text-[#737983] hover:text-[#C84B4B] rounded-lg hover:bg-[#FDF2F2] transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Outflow"
        subtitle="Deduct store operating expenses directly against net business profits"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              <option value="advertising">Advertising / Meta / Google Ads</option>
              <option value="packaging">Boxes, Bubble Wrap & Mailers</option>
              <option value="software">Shopify, Tools & SaaS Apps</option>
              <option value="operations">Warehouse Rent & Utilities</option>
              <option value="salaries">Store Staff Salaries</option>
              <option value="shipping">General Shipping Freight</option>
              <option value="other">Miscellaneous Overhead</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs font-bold text-[#17191C] tabular-nums focus:outline-none focus:border-[#176B57]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Memo / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Meta Ads campaign for Summer Sale"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg text-xs text-[#17191C] focus:outline-none focus:border-[#176B57]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7E9ED]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accessible Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense Entry"
        message="Are you sure you want to delete this operating expense? It will be removed from your profit & loss statements."
        confirmLabel="Delete Expense"
        loading={isDeleting}
        isDestructive={true}
      />
    </div>
  );
};
