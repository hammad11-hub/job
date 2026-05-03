import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, TrendingUp, Users, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/jobsApi';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Home = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const categories = categoriesData?.data?.categories || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
              Find Your <span className="text-primary">Dream Job</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
              Discover thousands of opportunities from top-tier companies. Your next career move starts here.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input className="pl-12 border-none ring-0 focus:ring-0 h-12" placeholder="Job title, keywords..." />
              </div>
              <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 w-full relative">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <Input className="pl-12 border-none ring-0 focus:ring-0 h-12" placeholder="Location..." />
              </div>
              <Button size="lg" className="w-full sm:w-auto h-12 px-8">Search</Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
                <Briefcase className="w-4 h-4 text-primary" />
                <span>12,000+ Jobs</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-400 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
                <Users className="w-4 h-4 text-secondary" />
                <span>500+ Companies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Popular Categories</h2>
            <p className="text-gray-600 dark:text-gray-400">Explore jobs by industry and field</p>
          </div>
          <Link to="/jobs" className="text-primary font-semibold hover:underline">View all jobs</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 8).map((cat, i) => (
            <Link 
              key={i} 
              to={`/jobs?category=${cat.category}`}
              className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{cat.category}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{cat.count} open positions</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-100 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Create Profile', desc: 'Build your career profile and upload your resume.', icon: User },
              { title: 'Search & Apply', desc: 'Find relevant jobs and apply with one click.', icon: Search },
              { title: 'Get Hired', desc: 'Connect with employers and land your dream job.', icon: TrendingUp },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mb-6">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">&copy; 2026 JobPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
