import React, { useState } from 'react';
import { FileSpreadsheet, Download, Calendar, Filter, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const [status, setStatus] = useState('all');
  const [downloadingOrders, setDownloadingOrders] = useState(false);
  const [downloadingProducts, setDownloadingProducts] = useState(false);

  const downloadFile = (url: string, filename: string) => {
    const token = localStorage.getItem('profitpilot_token');
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token || ''}`;

    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      });
  };

  const handleExportOrders = () => {
    setDownloadingOrders(true);
    const params = status !== 'all' ? `?status=${status}` : '';
    downloadFile(
      `/api/v1/reports/orders.csv${params}`,
      `profitpilot-orders-${new Date().toISOString().split('T')[0]}.csv`
    );
    setTimeout(() => setDownloadingOrders(false), 1000);
  };

  const handleExportProfitability = () => {
    setDownloadingProducts(true);
    downloadFile(
      '/api/v1/reports/profitability.csv',
      `profitpilot-sku-profitability-${new Date().toISOString().split('T')[0]}.csv`
    );
    setTimeout(() => setDownloadingProducts(false), 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit & CSV Report Exports</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate accounting-verified CSV exports validated against backend financial formulas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Orders Report */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Orders Financial Ledger</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export every customer order with line items, revenue, COGS, seller courier fee, CAC ad
              spend, net profit, and profit margin %.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Filter by Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="all">All Orders</option>
                <option value="delivered">Delivered Only</option>
                <option value="returned">Returned Orders</option>
                <option value="cancelled">Cancelled Orders</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">SKU Profitability Matrix</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export comprehensive product-level metrics including SKU code, selling price, unit cost,
              units sold, return rate %, gross revenue, and total net profit.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Includes return & restocking rate per product</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ranks inventory by realized net profit contribution</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="emerald"
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
