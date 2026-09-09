import React from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-900 text-white border-slate-900',
  secondary: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  destructive: 'bg-rose-50 text-rose-700 border-rose-200',
  outline: 'bg-white text-slate-700 border-slate-200',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'secondary', className, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
      variantClasses[variant],
      className
    )}
    {...props}
  />
);
