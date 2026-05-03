import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { Briefcase, Users, Eye, MoreVertical, Trash2, Edit2, Star, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';

const MyJobs = () => {
  const queryClient = useQueryClient();
  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['employerJobs'],
    queryFn: () => api.get('/employer/jobs'),
  });

  const jobs = jobsData?.data?.jobs || [];

  const featureMutation = useMutation({
    mutationFn: (id) => api.post(`/employer/jobs/${id}/feature`),
    onSuccess: () => {
      queryClient.invalidateQueries(['employerJobs']);
      queryClient.invalidateQueries(['employerStats']);
      toast.success('Job featured successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to feature job');
    }
  });

  const handleExport = async (id) => {
    try {
      const res = await api.get(`/employer/jobs/${id}/applicants/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applicants-${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('CSV Export requires Enterprise plan.');
    }
  };

  if (isLoading) return <div className="p-8">Loading jobs...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Job Postings</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and track your active job listings.</p>
        </div>
        <Button onClick={() => window.location.href='/dashboard/employer/post-job'}>
          Post New Job
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Job Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicants</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Posted Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${job.featured ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          <Link to={`/dashboard/employer/jobs/${job._id}/applicants`} className="hover:text-primary transition-colors">
                            {job.title}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-500">{job.location} • {job.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      job.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 font-medium">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{job.applicants?.length || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500">
                    {format(new Date(job.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button 
                      onClick={() => handleExport(job._id)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Export Applicants"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!job.featured && (
                      <button 
                        onClick={() => featureMutation.mutate(job._id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Feature Job"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {jobs.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-500">You haven't posted any jobs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobs;
