import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, LayoutDashboard, Briefcase, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md dark:bg-gray-950/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">JobPortal</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/jobs" className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors">Find Jobs</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors">Pricing</Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 dark:text-gray-300 p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-4 pt-2 pb-6 space-y-3">
          <Link to="/jobs" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Find Jobs</Link>
          <Link to="/pricing" className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">Pricing</Link>
          <hr className="border-gray-100 dark:border-gray-800" />
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/dashboard" className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center space-x-2 w-full text-left px-3 py-2 text-red-500">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link to="/login"><Button variant="outline" className="w-full">Login</Button></Link>
              <Link to="/register"><Button className="w-full">Sign Up</Button></Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
