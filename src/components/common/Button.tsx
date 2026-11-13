import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'white'
    | 'outline-white'
    | 'danger'
    | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 focus:ring-forest-600 shadow-xs',
    secondary:
      'bg-forest-100 text-forest-800 hover:bg-forest-200 active:bg-forest-300 focus:ring-forest-600',
    outline:
      'border border-[#E5E9E3] bg-white text-[#252B27] hover:bg-forest-50 active:bg-forest-100 focus:ring-forest-600 shadow-xs',
    white:
      'bg-white text-[#1C3629] hover:bg-[#F2F5F0] active:bg-[#EAF1EB] focus:ring-white shadow-md font-bold',
    'outline-white':
      'border-2 border-white/60 bg-transparent text-white hover:bg-white/15 active:bg-white/25 focus:ring-white font-semibold',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus:ring-rose-600 shadow-xs',
    ghost:
      'text-[#737C74] hover:text-[#252B27] hover:bg-forest-50 focus:ring-forest-600',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

