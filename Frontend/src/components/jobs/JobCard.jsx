import React from 'react';
import { MapPin, Briefcase, Clock, Bookmark, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const JobCard = ({ job }) => {
  const {
    _id,
    title,
    company,
    location,
    type,
    salary,
    experienceLevel,
    featured,
    createdAt,
  } = job;

  const formattedSalary = salary?.min && salary?.max
    ? `PKR ${(salary.min / 1000).toFixed(0)}k - ${(salary.max / 1000).toFixed(0)}k`
    : 'Salary not listed';

  return (
    <div className={`relative group p-6 bg-white dark:bg-gray-800 rounded-2xl border ${featured ? 'border-yellow-400/50 bg-yellow-50/10' : 'border-gray-100 dark:border-gray-700'} hover:shadow-xl transition-all`}>
      {featured && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center space-x-1 shadow-sm">
          <Star className="w-3 h-3 fill-current" />
          <span>FEATURED</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center font-bold text-gray-400">
            {company?.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-tight">
              <Link to={`/jobs/${_id}`}>{title}</Link>
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{company}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-primary transition-colors">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {location}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
          {type}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : 'Recently'}
        </div>
        <div className="flex items-center text-sm font-semibold text-primary">
          {formattedSalary}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md uppercase">
            {experienceLevel}
          </span>
        </div>
        <Link to={`/jobs/${_id}`}>
          <button className="text-sm font-bold text-primary hover:underline flex items-center">
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </Link>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default JobCard;
