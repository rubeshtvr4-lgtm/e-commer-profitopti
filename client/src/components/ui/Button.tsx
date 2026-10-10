import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'emerald';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.99]';

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-1 gap-1.5',
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#176B57] text-white hover:bg-[#125645] focus:ring-[#176B57]/30 shadow-[0_1px_2px_rgba(23,107,87,0.15)]',
    dark:
      'bg-[#17191C] text-white hover:bg-[#2A2E33] focus:ring-[#17191C]/30 shadow-[0_1px_2px_rgba(0,0,0,0.1)]',
    emerald:
      'bg-[#16835D] text-white hover:bg-[#126B4C] focus:ring-[#16835D]/30 shadow-[0_1px_2px_rgba(22,131,93,0.15)]',
    secondary:
      'bg-[#F1F3F6] text-[#17191C] hover:bg-[#E5E8EC] focus:ring-[#737983]/30',
    danger:
      'bg-[#C84B4B] text-white hover:bg-[#B33E3E] focus:ring-[#C84B4B]/30 shadow-[0_1px_2px_rgba(200,75,75,0.15)]',
    outline:
      'border border-[#E7E9ED] bg-white text-[#17191C] hover:bg-[#F7F8FA] hover:border-[#D1D5DB] focus:ring-[#176B57]/20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
    ghost:
      'text-[#555C68] hover:text-[#17191C] hover:bg-[#F1F3F6] focus:ring-[#737983]/20',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
};
