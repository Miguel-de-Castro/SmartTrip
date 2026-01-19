
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white dark:bg-surface-accent rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-300 ${className}`}>
      {title && (
        <div className="px-10 pt-8 pb-1">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">{title}</h3>
        </div>
      )}
      <div className={`${title ? 'px-10 pb-8 pt-2' : 'p-8'}`}>
        {children}
      </div>
    </div>
  );
};
