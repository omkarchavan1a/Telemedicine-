import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

// Minimal accessible dialog (shadcn Dialog-style API).
// Portal-free to avoid new deps; fixed overlay with Escape + backdrop close,
// role="dialog" aria-modal, and initial focus.
export const Dialog: React.FC<DialogProps> = ({ open, onClose, title, description, children, className }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Focus panel on open
    const t = window.setTimeout(() => panelRef.current?.focus(), 0);
    // Lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg liquid-glass rounded-2xl shadow-2xl border border-white/90',
          'max-h-[90vh] overflow-y-auto outline-none',
          className
        )}
      >
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};
