import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJobs } from '../api/jobsApi';
import Navbar from '../components/layout/Navbar';
import JobCard from '../components/jobs/JobCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const keyword = searchParams.get('keyword') || '';
  const location = searchParams.get('location') || '';
  const category = searchParams.get('category') || '';

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', page, keyword, location, category],
    queryFn: () => getJobs({ page, keyword, location, category }),
  });

  const jobs = jobsData?.data?.jobs || [];
  const totalPages = jobsData?.data?.totalPages || 1;

  const handleSearch = (e) => {
    e.preventDefault();
    const k = e.target.keyword.value;
    const l = e.target.location.value;
    setSearchParams({ keyword: k, location: l, page: '1' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex flex-col md:row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input 
                name="keyword"
                defaultValue={keyword}
                className="pl-12 h-12" 
                placeholder="Job title, keywords..." 
              />
            </div>
            <div className="flex-1 w-full relative">
              <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input 
                name="location"
                defaultValue={location}
                className="pl-12 h-12" 
                placeholder="Location..." 
              />
            </div>
            <Button type="submit" size="lg" className="w-full md:w-auto h-12 px-8">Search</Button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </h3>
              <div className="space-y-4">
                {/* Example filter groups */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Type</label>
                  <div className="mt-2 space-y-2">
                    {['Full-time', 'Part-time', 'Remote', 'Contract'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Job List */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-bold text-gray-900 dark:text-white">{jobs.length}</span> jobs
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center space-x-4 pt-10">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No jobs found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Jobs;
