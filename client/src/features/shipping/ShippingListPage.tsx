import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ShipmentRecord, Order } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const ShippingListPage: React.FC = () => {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [courierFilter, setCourierFilter] = useState('all');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [courier, setCourier] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState(`TRK${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [shippingCost, setShippingCost] = useState(90);
  const [shipmentStatus, setShipmentStatus] = useState<any>('in_transit');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params = courierFilter !== 'all' ? `?courier=${courierFilter}` : '';
      const res = await api.get<{ shipments: ShipmentRecord[] }>(`/shipments${params}`);
      setShipments(res.shipments || []);
    } catch (err) {
      console.error('Failed to load shipments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [courierFilter]);

  const openCreateModal = async () => {
    const res = await api.get<{ orders: Order[] }>('/orders?limit=30');
    setOrders(res.orders || []);
    if (res.orders && res.orders.length > 0) {
      setSelectedOrderId(res.orders[0].id);
    }
    setTrackingNumber(`TRK${Math.floor(1000000 + Math.random() * 9000000)}`);
    setIsModalOpen(true);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post('/shipments', {
        orderId: selectedOrderId,
        courier,
        trackingNumber,
        shippingCost: Number(shippingCost),
        shipmentStatus,
      });
      setIsModalOpen(false);
      fetchShipments();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/shipments/${id}`, { shipmentStatus: status });
      fetchShipments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Courier Logistics & Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor courier freight fees, dispatch milestones, and RTO return rates
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Dispatch Shipment
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <select
          value={courierFilter}
          onChange={(e) => setCourierFilter(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
        >
          <option value="all">All Couriers</option>
          <option value="Delhivery">Delhivery</option>
          <option value="Bluedart">Bluedart</option>
          <option value="Shiprocket">Shiprocket</option>
          <option value="Ekart Logistics">Ekart Logistics</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse h-48" />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-10 h-10 text-brand-600" />}
          title="No Shipments Manifested"
          description="Create courier consignments or seed demo data to track courier spend."
          actionLabel="Dispatch Shipment"
          onAction={openCreateModal}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Courier Partner</th>
                  <th className="py-3 px-4">AWB / Tracking #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4 text-right">Forward Shipping</th>
                  <th className="py-3 px-4 text-right">Reverse Freight</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Update Milestone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{s.courier}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{s.trackingNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.orderNumber}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      {formatINR(s.shippingCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {formatINR(s.reverseShippingCost)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`capitalize px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                          s.shipmentStatus === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.shipmentStatus === 'in_transit' || s.shipmentStatus === 'picked_up'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.shipmentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={s.shipmentStatus}
                        onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white font-medium"
                      >
                        <option value="manifested">Manifested</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="rto_initiated">RTO Initiated</option>
                      </select>
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
        title="Dispatch New Courier Consignment"
        subtitle="Generate AWB tracking and record forward courier shipping charges"
        maxWidth="md"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Order
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} — {o.customer?.name || 'Customer'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Courier Service
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Delhivery">Delhivery</option>
                <option value="Bluedart">Bluedart</option>
                <option value="Shiprocket">Shiprocket</option>
                <option value="Ekart Logistics">Ekart Logistics</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                AWB / Tracking Number
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Courier Shipping Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Initial Status
              </label>
              <select
                value={shipmentStatus}
                onChange={(e) => setShipmentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="in_transit">In Transit</option>
                <option value="picked_up">Picked Up</option>
                <option value="manifested">Manifested</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={modalLoading}>
              Save Shipment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
