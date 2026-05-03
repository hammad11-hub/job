import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import Overview from './employer/Overview';
import MyJobs from './employer/MyJobs';
import PostJob from './employer/PostJob';
import Applicants from './employer/Applicants';

const EmployerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="employer" />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/jobs" element={<MyJobs />} />
            <Route path="/jobs/:id/applicants" element={<Applicants />} />
            <Route path="/post-job" element={<PostJob />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default EmployerDashboard;
