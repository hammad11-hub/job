import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ResumeUploader from '../../../components/resume/ResumeUploader';
import Button from '../../../components/ui/Button';

const Resume = () => {
  const { user, refreshUser } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('resume', file);
      return api.post('/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      refreshUser();
      toast.success('Resume uploaded successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">My Resume</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Upload your latest resume to apply for jobs and get AI feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white dark:bg-gray-900 p-10 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl">
            <ResumeUploader 
              onUpload={(file) => uploadMutation.mutate(file)}
              isLoading={uploadMutation.isPending}
              currentResume={user?.resumeUrl?.split('/').pop()}
            />
          </section>

          {user?.resumeUrl && (
            <section className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                    {user.resumeUrl.split('/').pop()}
                  </h4>
                  <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <a href={user.resumeUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="p-2">
                    <Eye className="w-5 h-5" />
                  </Button>
                </a>
                <Button variant="outline" size="sm" className="p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-[32px] text-white shadow-xl">
            <h3 className="text-xl font-bold mb-4">AI Resume Analysis</h3>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Get instant feedback on your resume matching with job descriptions using our AI analyzer.
            </p>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-60">Status</p>
              <p className="text-sm font-medium">Ready to analyze</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Resume;
