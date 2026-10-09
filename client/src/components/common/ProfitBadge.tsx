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

  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (isLoss) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
  } else if (isThin) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      {amount !== undefined && <span>{formatINR(amount)}</span>}
      {showBoth && amount !== undefined && margin !== undefined && <span>•</span>}
      {margin !== undefined && <span>{formatPercent(margin)}</span>}
    </span>
  );
};
