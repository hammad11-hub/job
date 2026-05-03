import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <TrendingUp className="w-4 h-4 text-green-500" />
    </div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
  </div>
);

export default StatCard;
