import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';
import { Link } from 'react-router-dom';

const Applications = () => {
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => api.get('/applications'), // This endpoint gets user's job applications
  });

  const applications = appsData?.data?.jobs || [];

  if (isLoading) return <div className="p-8 animate-pulse">Loading applications...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">My Applications</h1>
        <p className="text-gray-500 dark:text-gray-400">Track the status of your submitted job applications.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {applications.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {applications.map((app) => (
              <div key={app.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all flex flex-col md:row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center font-bold text-gray-400">
                    {app.company?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{app.role}</h3>
                    <p className="text-sm text-gray-500">{app.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    Applied {formatDate(app.date)}
                  </div>
                  
                  <div className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    app.status === 'Applied' ? 'bg-blue-50 text-blue-600' :
                    app.status === 'Interview' ? 'bg-purple-50 text-purple-600' :
                    app.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {app.status === 'Applied' && <Clock className="w-3.5 h-3.5 mr-1.5" />}
                    {app.status === 'Interview' && <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                    {app.status === 'Rejected' && <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                    {app.status === 'Offer' && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                    {app.status}
                  </div>

                  <Link to={`/jobs/${app.id}`}>
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-8">Start your job search and apply to your first position.</p>
            <Link to="/jobs"><Button>Browse Jobs</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
