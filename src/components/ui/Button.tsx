import React from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-xs',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200',
  outline: 'bg-white text-slate-800 hover:border-blue-400 hover:text-blue-700 border border-slate-200 shadow-2xs',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  default: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-2xl gap-2',
  icon: 'p-2 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// shadcn-style API, Tailwind-only. No extra runtime so it can coexist with
// HeroUI / Mantine / MUI / Chakra adapters per-location if needed later.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
        'disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
