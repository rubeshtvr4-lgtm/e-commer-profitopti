import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Megaphone, Box, Laptop, Wrench, CreditCard } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ExpenseRecord, Pagination } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const ExpensesListPage: React.FC = () => {
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

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = categoryFilter !== 'all' ? `?category=${categoryFilter}` : '';
      const res = await api.get<{ expenses: ExpenseRecord[] }>(`/expenses${params}`);
      setExpenses(res.expenses || []);
    } catch (err) {
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
      setIsModalOpen(false);
      setDescription('');
      fetchExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Operating Expenses & Overhead</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log marketing campaigns, packaging boxes, SaaS subscriptions, and warehouse overhead
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200">
            Total: {formatINR(totalExpense)}
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
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

      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse h-48" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-10 h-10 text-brand-600" />}
          title="No Expenses Recorded"
          description="Track your advertising and operating overhead to ensure profit margins are completely accurate."
          actionLabel="Record Expense"
          onAction={() => setIsModalOpen(true)}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Order Linkage</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(e.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 capitalize">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{e.description}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {e.orderNumber ? (
                        <span className="text-brand-600 font-semibold">{e.orderNumber}</span>
                      ) : (
                        <span className="text-slate-400">Store General Overhead</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        subtitle="Log advertising, software, packaging or overhead spend"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Expense Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="advertising">Advertising (Meta / Google Ads)</option>
              <option value="packaging">Packaging & Shipping Boxes</option>
              <option value="software">Software & SaaS Subscriptions</option>
              <option value="operations">Warehouse & Operational Expenses</option>
              <option value="salaries">Salaries & Contractor Fees</option>
              <option value="other">Other Store Overhead</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Date Incurred
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description / Vendor
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Meta Advantage+ catalog ad campaign"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            <strong>Double-Counting Prevention:</strong> Store overhead is aggregated at the store
            P&L level. Specific order-level costs (e.g. order-attributed ad cost) are isolated to avoid
            duplication.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={modalLoading}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
