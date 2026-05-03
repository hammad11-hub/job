import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployerStats } from '../../../api/jobsApi';
import { Briefcase, Users, Eye, Star } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';

const Overview = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['employerStats'],
    queryFn: getEmployerStats,
  });

  const stats = statsData?.data || {};

  if (isLoading) return <div className="p-8 animate-pulse">Loading stats...</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {stats.plan} Plan</h1>
        <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your job postings today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Jobs" 
          value={stats.totalJobs || 0} 
          icon={Briefcase} 
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20" 
        />
        <StatCard 
          label="Total Applicants" 
          value={stats.totalApplicants || 0} 
          icon={Users} 
          color="bg-purple-50 text-purple-600 dark:bg-purple-900/20" 
        />
        <StatCard 
          label="Active Jobs" 
          value={stats.activeJobs || 0} 
          icon={Eye} 
          color="bg-green-50 text-green-600 dark:bg-green-900/20" 
        />
        <StatCard 
          label="Featured Slots Left" 
          value={stats.limits?.featuredJobsPerMonth || 0} 
          icon={Star} 
          color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Activity chart will be here.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Plan Usage</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Active Jobs</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.activeJobs || 0} / {stats.limits?.maxActiveJobs || '∞'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (stats.activeJobs / (stats.limits?.maxActiveJobs || 100)) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
