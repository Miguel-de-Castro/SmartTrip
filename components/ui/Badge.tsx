
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'brand' | 'success' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variants = {
    slate: "bg-slate-100 text-slate-500",
    brand: "bg-brand-50 text-brand-500",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600"
  };

  return (
    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
