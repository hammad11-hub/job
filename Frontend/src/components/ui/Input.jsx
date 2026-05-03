import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, error, label, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-primary/10',
          error && 'border-red-500 focus:ring-red-500/10 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
