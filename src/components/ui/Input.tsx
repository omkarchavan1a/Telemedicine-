import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full px-3.5 py-2 text-sm rounded-xl bg-white/80 border border-slate-200',
      'placeholder:text-slate-400 text-slate-900 shadow-2xs',
      'focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 focus:border-blue-400',
      'disabled:opacity-50 disabled:bg-slate-100',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('block text-xs font-semibold text-slate-700 mb-1.5', className)} {...props} />
);
