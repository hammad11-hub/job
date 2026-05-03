import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'gray', className }) => {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-green-50 text-green-600',
    danger: 'bg-red-50 text-red-600',
    warning: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;
