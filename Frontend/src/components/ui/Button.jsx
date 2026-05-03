import React from 'react';
import { cn } from '../../utils/cn';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 shadow-md',
    secondary: 'bg-secondary text-white hover:bg-violet-700 shadow-md',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {props.children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
