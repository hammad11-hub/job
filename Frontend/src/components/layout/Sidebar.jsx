import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  PlusCircle, 
  BarChart3,
  CreditCard
} from 'lucide-react';

const Sidebar = ({ role }) => {
  const { user } = useAuth();

  const employerLinks = [
    { name: 'Overview', path: '/dashboard/employer', icon: BarChart3 },
    { name: 'My Jobs', path: '/dashboard/employer/jobs', icon: Briefcase },
    { name: 'Post a Job', path: '/dashboard/employer/post-job', icon: PlusCircle },
    { name: 'Billing', path: '/dashboard/employer/billing', icon: CreditCard },
    { name: 'Settings', path: '/dashboard/employer/settings', icon: Settings },
  ];

  const jobseekerLinks = [
    { name: 'Overview', path: '/dashboard/jobseeker', icon: BarChart3 },
    { name: 'Applications', path: '/dashboard/jobseeker/applications', icon: Briefcase },
    { name: 'Resume', path: '/dashboard/jobseeker/resume', icon: Users },
    { name: 'Settings', path: '/dashboard/jobseeker/settings', icon: Settings },
  ];

  const links = role === 'employer' ? employerLinks : jobseekerLinks;

  return (
    <aside className="w-64 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 hidden md:block">
      <div className="h-full flex flex-col py-6">
        <div className="px-6 mb-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role} • {user?.plan}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path.split('/').length === 3}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
