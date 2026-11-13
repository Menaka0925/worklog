import React from 'react';
import type { FollowUpStatus } from '../../types/followup';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'warm'
    | 'forest'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    default: 'bg-[#F0F3EF] text-[#525D54] border border-[#E5E9E3]',
    primary: 'bg-forest-100 text-forest-700 border border-forest-200',
    warm: 'bg-warm-50 text-warm-700 border border-warm-200',
    forest: 'bg-forest-600 text-white',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200',
    slate: 'bg-[#252B27] text-white',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md select-none tracking-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const getStatusBadgeVariant = (
  status: FollowUpStatus
): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'info';
    case 'Pending':
      return 'warning';
    case 'Upcoming':
      return 'primary';
    case 'On Hold':
      return 'default';
    case 'Carried Forward':
      return 'purple';
    case 'Cancelled / Rejected':
      return 'danger';
    default:
      return 'default';
  }
};
