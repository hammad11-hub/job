import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getJobDetails } from '../api/jobsApi';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import { MapPin, Briefcase, Clock, Building2, Globe, DollarSign, Calendar, Share2, Bookmark, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const JobDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJobDetails(id),
  });

  const job = jobData?.data?.job;

  const handleApply = () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }
    toast.success('Application submitted! (Demo)');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job not found</h2>
        <Link to="/jobs"><Button variant="outline">Back to Jobs</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <Navbar />

      {/* Header Section */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl font-bold text-gray-400">
                {job.company?.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                    {job.type}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {job.experienceLevel}
                  </span>
                  {job.featured && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center"><Building2 className="w-4 h-4 mr-2" /> {job.company}</div>
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {job.location}</div>
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="p-3 rounded-xl"><Bookmark className="w-5 h-5" /></Button>
              <Button variant="outline" className="p-3 rounded-xl"><Share2 className="w-5 h-5" /></Button>
              <Button size="lg" className="px-10 h-14 text-lg shadow-lg shadow-primary/20" onClick={handleApply}>
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Job Description</h2>
              <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </section>

            <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Requirements & Skills</h2>
              <div className="flex flex-wrap gap-3">
                {job.skills?.map((skill, i) => (
                  <span key={i} className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-gray-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Job Overview</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-primary">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Offered Salary</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      PKR {(job.salary?.min / 1000).toFixed(0)}k - {(job.salary?.max / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-secondary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                    <p className="font-bold text-gray-900 dark:text-white">{job.category}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-bold text-gray-900 dark:text-white">{job.location}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                <Button className="w-full h-12" onClick={handleApply}>Apply Now</Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default JobDetail;
