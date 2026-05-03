import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200",
        maxWidth
      )}>
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-50 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
