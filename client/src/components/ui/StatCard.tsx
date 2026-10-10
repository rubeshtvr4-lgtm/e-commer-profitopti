import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: 'emerald' | 'blue' | 'red' | 'amber' | 'slate' | 'teal';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'teal',
}) => {
  const iconBg = {
    emerald: 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]',
    teal: 'bg-[#EAF5F0] text-[#176B57] border-[#D2ECE1]',
    blue: 'bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]',
    red: 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]',
    amber: 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]',
    slate: 'bg-[#F1F3F6] text-[#555C68] border-[#E7E9ED]',
  }[accentColor] || 'bg-[#F1F3F6] text-[#555C68] border-[#E7E9ED]';

  return (
    <div className="bg-white border border-[#E7E9ED] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#D6DAE1] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737983]">
          {title}
        </span>
        <div className={`p-2 rounded-lg border text-sm transition-transform group-hover:scale-105 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-[26px] font-bold tracking-tight text-[#17191C] tabular-nums font-sans">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              trend.isPositive
                ? 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]'
                : 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-3 h-3 stroke-[2.5]" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-[#737983] font-medium leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
};
