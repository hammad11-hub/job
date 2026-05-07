import { cn } from './utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variant === 'primary' && 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-indigo-500',
        variant === 'secondary' && 'bg-white/8 text-slate-100 ring-1 ring-white/10 hover:bg-white/10',
        variant === 'ghost' && 'text-slate-300 hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
