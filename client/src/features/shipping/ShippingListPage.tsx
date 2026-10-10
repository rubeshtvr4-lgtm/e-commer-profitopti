import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { ShipmentRecord, Order } from '../../types';
import { formatINR } from '../../lib/currency';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../contexts/ToastContext';

export const ShippingListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
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
    } catch (err: any) {
      console.error('Failed to load shipments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [courierFilter]);

  const openCreateModal = async () => {
    try {
      const res = await api.get<{ orders: Order[] }>('/orders?limit=30');
      setOrders(res.orders || []);
      if (res.orders && res.orders.length > 0) {
        setSelectedOrderId(res.orders[0].id || (res.orders[0] as any)._id);
      }
      setTrackingNumber(`TRK${Math.floor(1000000 + Math.random() * 9000000)}`);
      setIsModalOpen(true);
    } catch (err: any) {
      toastError('Error', 'Could not fetch orders for dispatch');
    }
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
      success('Consignment Created', `${courier} shipment ${trackingNumber} dispatched.`);
      setIsModalOpen(false);
      fetchShipments();
    } catch (err: any) {
      toastError('Dispatch Error', err?.message || 'Could not manifest consignment');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/shipments/${id}`, { shipmentStatus: status });
      success('Milestone Updated', `Shipment status updated to ${status.replace(/_/g, ' ')}.`);
      fetchShipments();
    } catch (err: any) {
      toastError('Update Failed', err?.message || 'Could not update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Courier Logistics & Tracking"
        description="Monitor courier freight fees, dispatch milestones, and RTO return rates"
      >
        <Button variant="primary" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
          Dispatch Shipment
        </Button>
      </PageHeader>

      {/* Filter */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E7E9ED] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <select
          value={courierFilter}
          onChange={(e) => setCourierFilter(e.target.value)}
          className="text-xs font-semibold px-3 py-1.5 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
        >
          <option value="all">All Couriers</option>
          <option value="Delhivery">Delhivery</option>
          <option value="Bluedart">Bluedart</option>
          <option value="Shiprocket">Shiprocket</option>
          <option value="Ekart Logistics">Ekart Logistics</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E7E9ED] animate-pulse h-48" />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-8 h-8 text-[#176B57]" />}
          title="No Shipments Manifested"
          description="Create courier consignments or seed demo data to track courier spend."
          actionLabel="Dispatch Shipment"
          onAction={openCreateModal}
          showSeedDemo={true}
        />
      ) : (
        <div className="bg-white border border-[#E7E9ED] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] text-[#737983] uppercase tracking-wider font-semibold border-b border-[#E7E9ED]">
                <tr>
                  <th className="py-3 px-6">Courier Partner</th>
                  <th className="py-3 px-6">AWB / Tracking #</th>
                  <th className="py-3 px-6">Order Reference</th>
                  <th className="py-3 px-6 text-right">Forward Shipping</th>
                  <th className="py-3 px-6 text-right">Reverse Freight</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Update Milestone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9ED]">
                {shipments.map((s) => (
                  <tr key={s.id || (s as any)._id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#17191C]">{s.courier}</td>
                    <td className="py-3.5 px-6 font-mono text-[#555C68] font-bold">{s.trackingNumber}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-[#17191C]">
                      {s.orderNumber || 'ORD-REF'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#17191C] tabular-nums">
                      {formatINR(s.shippingCost)}
                    </td>
                    <td className="py-3.5 px-6 text-right text-[#737983] font-semibold tabular-nums">
                      {s.reverseShippingCost ? formatINR(s.reverseShippingCost) : '₹0.00'}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={s.shipmentStatus} type="shipment" />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <select
                        value={s.shipmentStatus}
                        onChange={(e) => handleUpdateStatus(s.id || (s as any)._id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] focus:outline-none focus:border-[#176B57]"
                      >
                        <option value="manifested">Manifested</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="rto_initiated">RTO Initiated</option>
                        <option value="rto_delivered">RTO Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dispatch Consignment"
        subtitle="Create tracking consignment and attribute courier freight cost to order"
        maxWidth="md"
      >
        <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
              Order Reference
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
            >
              {orders.map((o) => (
                <option key={o.id || (o as any)._id} value={o.id || (o as any)._id}>
                  {o.orderNumber} — {o.customer?.name || 'Customer'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Courier Partner
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
              >
                <option value="Delhivery">Delhivery</option>
                <option value="Bluedart">Bluedart</option>
                <option value="Shiprocket">Shiprocket</option>
                <option value="Ekart Logistics">Ekart Logistics</option>
                <option value="Shadowfax">Shadowfax</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                AWB Tracking #
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg font-mono font-bold text-[#17191C] focus:outline-none focus:border-[#176B57]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Courier Freight Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={shippingCost}
                onChange={(e) => setShippingCost(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg font-semibold tabular-nums text-[#17191C] focus:outline-none focus:border-[#176B57]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737983] mb-1">
                Initial Milestone
              </label>
              <select
                value={shipmentStatus}
                onChange={(e) => setShipmentStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#E7E9ED] rounded-lg bg-white text-[#17191C] font-medium focus:outline-none focus:border-[#176B57]"
              >
                <option value="in_transit">In Transit</option>
                <option value="manifested">Manifested</option>
                <option value="picked_up">Picked Up</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E7E9ED]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={modalLoading}>
              Dispatch Consignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
