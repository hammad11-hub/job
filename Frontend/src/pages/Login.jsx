import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api/jobsApi';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Login = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.pathname.includes('register'));

  useEffect(() => {
    setIsLogin(!location.pathname.includes('register'));
  }, [location.pathname]);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'jobseeker' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await loginUser({ email: formData.email, password: formData.password });
        login(res.data.user, res.data.token);
        toast.success('Logged in successfully!');
        
        // Redirect logic: Employers without a paid plan go to pricing
        if (res.data.user.role === 'employer' && res.data.user.plan === 'free') {
          navigate('/pricing');
        } else {
          navigate('/dashboard');
        }
      } else {
        const res = await registerUser(formData);
        // Auto-login after registration
        login(res.data.user, res.data.token);
        toast.success('Account created successfully!');
        
        if (formData.role === 'employer') {
          navigate('/pricing');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err.response?.data);
      const backendError = err.response?.data;
      const errorMessage = 
        backendError?.errors?.[0]?.message || 
        backendError?.error || 
        backendError?.message || 
        'Authentication failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">JobPortal</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isLogin ? 'Sign in to access your dashboard' : 'Join thousands of job seekers and employers'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'jobseeker' })}
                      className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                        formData.role === 'jobseeker' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      Job Seeker
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'employer' })}
                      className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                        formData.role === 'employer' 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      Employer
                    </button>
                  </div>
                </div>
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Button type="submit" className="w-full h-12" isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
