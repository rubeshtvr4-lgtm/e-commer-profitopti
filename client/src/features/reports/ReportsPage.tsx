import React, { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { useToast } from '../../contexts/ToastContext';

export const ReportsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [status, setStatus] = useState('all');
  const [downloadingOrders, setDownloadingOrders] = useState(false);
  const [downloadingProducts, setDownloadingProducts] = useState(false);

  const downloadFile = (url: string, filename: string) => {
    const token = localStorage.getItem('profitpilot_token');
    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Export download failed');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        success('Export Downloaded', filename);
      })
      .catch((err) => {
        toastError('Download Error', err.message);
      });
  };

  const handleExportOrders = () => {
    setDownloadingOrders(true);
    const params = status !== 'all' ? `?status=${status}` : '';
    downloadFile(
      `/api/v1/reports/orders.csv${params}`,
      `profitpilot-orders-${new Date().toISOString().split('T')[0]}.csv`
    );
    setTimeout(() => setDownloadingOrders(false), 1200);
  };

  const handleExportProfitability = () => {
    setDownloadingProducts(true);
    downloadFile(
      '/api/v1/reports/profitability.csv',
      `profitpilot-sku-profitability-${new Date().toISOString().split('T')[0]}.csv`
    );
    setTimeout(() => setDownloadingProducts(false), 1200);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Audit & CSV Report Exports"
        description="Generate accounting-verified CSV exports validated against backend financial formulas"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Orders Report */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#176B57] border border-[#D2ECE1] flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              Orders Financial Ledger
            </h3>
            <p className="text-xs text-[#737983] mt-1 leading-relaxed">
              Export every customer order with line items, revenue, COGS, seller courier fee, CAC ad spend, net profit, and profit margin %.
            </p>

            <div className="mt-5 pt-4 border-t border-[#E7E9ED]">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1.5">
                Filter by Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E7E9ED] rounded-lg text-xs bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
              >
                <option value="all">All Orders</option>
                <option value="delivered">Delivered Only</option>
                <option value="returned">Returned Orders</option>
                <option value="cancelled">Cancelled Orders</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-2">
            <Button
              variant="primary"
              className="w-full"
              loading={downloadingOrders}
              onClick={handleExportOrders}
              icon={<Download className="w-4 h-4" />}
            >
              Download Orders CSV
            </Button>
          </div>
        </div>

        {/* Card 2: SKU Profitability Report */}
        <div className="bg-white border border-[#E7E9ED] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF5F0] text-[#16835D] border border-[#D2ECE1] flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#17191C] tracking-tight">
              SKU Profitability Matrix
            </h3>
            <p className="text-xs text-[#737983] mt-1 leading-relaxed">
              Export comprehensive product-level metrics including SKU code, selling price, unit cost, units sold, return rate %, gross revenue, and total net profit.
            </p>

            <div className="mt-5 pt-4 border-t border-[#E7E9ED] text-xs text-[#555C68] space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16835D] flex-shrink-0" />
                <span>Includes return & restocking rate per product</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16835D] flex-shrink-0" />
                <span>Ranks inventory by realized net profit contribution</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-2">
            <Button
              variant="primary"
              className="w-full"
              loading={downloadingProducts}
              onClick={handleExportProfitability}
              icon={<Download className="w-4 h-4" />}
            >
              Download SKU Profitability CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
