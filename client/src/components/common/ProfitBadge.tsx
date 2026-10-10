import React from 'react';
import { formatINR, formatPercent } from '../../lib/currency';

interface ProfitBadgeProps {
  amount?: number;
  margin?: number;
  showBoth?: boolean;
}

export const ProfitBadge: React.FC<ProfitBadgeProps> = ({
  amount,
  margin,
  showBoth = false,
}) => {
  const isLoss = (amount !== undefined && amount < 0) || (margin !== undefined && margin < 0);
  const isThin = !isLoss && margin !== undefined && margin < 15;

  let colorClasses = 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]';
  if (isLoss) {
    colorClasses = 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]';
  } else if (isThin) {
    colorClasses = 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border tabular-nums ${colorClasses}`}
    >
      {amount !== undefined && <span>{formatINR(amount)}</span>}
      {showBoth && amount !== undefined && margin !== undefined && <span className="opacity-50">•</span>}
      {margin !== undefined && <span>{formatPercent(margin)}</span>}
    </span>
  );
};
