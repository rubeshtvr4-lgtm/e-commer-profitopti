import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'shipment' | 'return' | 'stock';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'order',
  className = '',
}) => {
  const normalized = (status || '').toLowerCase().replace(/_/g, ' ');

  const getStyle = () => {
    switch (normalized) {
      // Success states
      case 'delivered':
      case 'paid':
      case 'completed':
      case 'restocked':
      case 'in stock':
        return 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]';

      // Negative / Danger states
      case 'cancelled':
      case 'refunded':
      case 'rejected':
      case 'damaged written off':
      case 'failed':
      case 'out of stock':
        return 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]';

      // Warning / Attention states
      case 'returned':
      case 'rto initiated':
      case 'rto delivered':
      case 'low stock':
      case 'cod':
      case 'requested':
      case 'missing parts':
        return 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]';

      // Active / In transit states
      case 'shipped':
      case 'in transit':
      case 'out for delivery':
      case 'processing':
      case 'approved':
      case 'received':
        return 'bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]';

      // Neutral states
      case 'pending':
      case 'confirmed':
      case 'manifested':
      case 'picked up':
      case 'pending inspection':
      default:
        return 'bg-[#F1F3F6] text-[#555C68] border-[#E7E9ED]';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border capitalize ${getStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {normalized}
    </span>
  );
};
