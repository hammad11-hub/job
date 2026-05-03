import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import Profile from './jobseeker/Profile';
import Resume from './jobseeker/Resume';
import Applications from './jobseeker/Applications';

const JobSeekerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="jobseeker" />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Profile />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/resume" element={<Resume />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
