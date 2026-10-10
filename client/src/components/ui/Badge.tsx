import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'teal' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-[#EAF5F0] text-[#16835D] border-[#D2ECE1]',
    teal: 'bg-[#EAF5F0] text-[#176B57] border-[#D2ECE1]',
    red: 'bg-[#FDF2F2] text-[#C84B4B] border-[#FCE4E4]',
    amber: 'bg-[#FEF7EC] text-[#D97706] border-[#FDEECC]',
    blue: 'bg-[#F0F5FA] text-[#0284C7] border-[#E0EBF7]',
    purple: 'bg-[#F6F3FB] text-[#7C3AED] border-[#EDE7F9]',
    slate: 'bg-[#F1F3F6] text-[#555C68] border-[#E7E9ED]',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-md transition-colors ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
