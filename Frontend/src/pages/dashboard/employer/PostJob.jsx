import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/jobsApi';
import { toast } from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PostJob = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    category: 'Engineering',
    experienceLevel: 'mid',
    salary: { min: '', max: '', currency: 'PKR' },
    description: '',
    skills: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/employer/jobs', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employerJobs']);
      toast.success('Job posted successfully!');
      navigate('/dashboard/employer/jobs');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post job');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      salary: {
        min: Number(formData.salary.min),
        max: Number(formData.salary.max),
        currency: 'PKR'
      },
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
    };
    mutation.mutate(data);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Post a New Job</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Reach thousands of qualified candidates today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-900 p-10 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input 
            label="Job Title" 
            placeholder="e.g. Senior Frontend Developer" 
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <Input 
            label="Company Name" 
            placeholder="e.g. Acme Inc." 
            required
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
          />
          <Input 
            label="Location" 
            placeholder="e.g. Karachi, Pakistan or Remote" 
            required
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Job Type</label>
            <select 
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Category</label>
            <select 
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Experience Level</label>
            <select 
              className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
              value={formData.experienceLevel}
              onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead / Principal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input 
            label="Min Salary (Annual PKR)" 
            type="number" 
            placeholder="e.g. 600000"
            value={formData.salary.min}
            onChange={(e) => setFormData({...formData, salary: {...formData.salary, min: e.target.value}})}
          />
          <Input 
            label="Max Salary (Annual PKR)" 
            type="number" 
            placeholder="e.g. 1200000"
            value={formData.salary.max}
            onChange={(e) => setFormData({...formData, salary: {...formData.salary, max: e.target.value}})}
          />
        </div>

        <Input 
          label="Skills (comma separated)" 
          placeholder="e.g. React, Node.js, SQL"
          value={formData.skills}
          onChange={(e) => setFormData({...formData, skills: e.target.value})}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Job Description</label>
          <textarea 
            className="w-full min-h-[200px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
            placeholder="Describe the role, responsibilities, and requirements..."
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
          <Button type="submit" size="lg" className="px-12 h-14 text-lg shadow-lg shadow-primary/20" isLoading={mutation.isPending}>
            Post Job Listing
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
