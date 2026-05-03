import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { 
  Users, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Mail,
  MoreVertical
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';

const Applicants = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: applicantsData, isLoading } = useQuery({
    queryKey: ['applicants', id],
    queryFn: () => api.get(`/employer/jobs/${id}/applicants`),
  });

  const applicants = applicantsData?.data?.applicants || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ appId, status }) => api.patch(`/employer/applications/${appId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['applicants', id]);
      toast.success('Applicant status updated');
    },
    onError: (err) => {
      toast.error('Failed to update status');
    }
  });

  if (isLoading) return <div className="p-8 animate-pulse">Loading applicants...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard/employer/jobs">
          <Button variant="ghost" size="sm" className="p-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applicants List</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage candidates who applied for this position.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {applicants.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                        {app.applicant?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{app.applicant?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{app.applicant?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {app.aiMatchScore !== undefined ? (
                      <div className="flex items-center space-x-2">
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-xs font-bold ${
                          app.aiMatchScore >= 80 ? 'border-green-500 text-green-500' :
                          app.aiMatchScore >= 50 ? 'border-yellow-500 text-yellow-500' :
                          'border-red-500 text-red-500'
                        }`}>
                          {app.aiMatchScore}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Upgrade to Pro</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500">
                    {formatDate(app.appliedAt)}
                  </td>
                  <td className="px-6 py-5">
                    <select 
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary/20 ${
                        app.status === 'Applied' ? 'bg-blue-50 text-blue-600' :
                        app.status === 'Interview' ? 'bg-purple-50 text-purple-600' :
                        app.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                        'bg-green-50 text-green-600'
                      }`}
                      value={app.status}
                      onChange={(e) => updateStatusMutation.mutate({ appId: app._id, status: e.target.value })}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Offer">Offer</option>
                    </select>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors" title="View Resume">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors" title="Email Candidate">
                      <Mail className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {applicants.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-500">No applications received yet for this position.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applicants;
